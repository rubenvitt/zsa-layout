# Moonlander Layout – Build- & Flash-Pipeline
# Layout "bone-r" (Oryx-Export pzg9d) fuer den ZSA Moonlander.
#
# Schnellstart:
#   make setup     einmalig: QMK-Fork klonen, wally-cli + libusb bereitstellen
#   make build     Firmware im Docker-Container kompilieren -> ./<bin>
#   make flash     Firmware aufs Board flashen (Reset-Knopf druecken)
#
# Hardware-Revision umstellen (Default: reva):
#   make build REV=revb
#   make flash REV=revb

# ---- Konfiguration -------------------------------------------------------
# Hardware-Revision: reva | revb (siehe README / Bootloader-Name)
REV         ?= reva
# Wartezeit (Sekunden) fuer detect-wait / flash-auto
WAIT        ?= 60
KEYBOARD    := zsa/moonlander/$(REV)
KEYMAP      := bone-r
SOURCE_DIR  := zsa_moonlander_bone-r_source
QMK_DIR     := qmk_firmware
FORK_URL    := https://github.com/zsa/qmk_firmware.git
QMK_IMAGE   := ghcr.io/qmk/qmk_cli

# QMK leitet den Ausgabenamen aus Keyboard + Keymap ab.
FW_BIN      := zsa_moonlander_$(REV)_$(KEYMAP).bin

WALLY       := bin/wally-cli
WALLY_URL   := https://github.com/zsa/wally-cli/releases/download/2.0.1-osx/wally-cli

# Container-Aufruf: Fork als /qmk_firmware mounten, die Layout-Quelle direkt
# an die Keymap-Stelle binden (kein Symlink -> funktioniert auch im Container).
DOCKER_RUN = docker run --rm --user $(shell id -u):$(shell id -g) \
	-w /qmk_firmware \
	-v "$(CURDIR)/$(QMK_DIR)":/qmk_firmware \
	-v "$(CURDIR)/$(SOURCE_DIR)":/qmk_firmware/keyboards/zsa/moonlander/keymaps/$(KEYMAP) \
	-e SKIP_GIT=1 -e SKIP_VERSION=1 -e MAKEFLAGS=-j8 \
	$(QMK_IMAGE)

.DEFAULT_GOAL := help

# ---- Targets -------------------------------------------------------------
.PHONY: help setup build build-all detect detect-wait usb flash flash-auto clean distclean

help:
	@echo "Moonlander Build-Pipeline (Layout: $(KEYMAP), Revision: $(REV))"
	@echo ""
	@echo "  make setup      QMK-Fork klonen + wally-cli/libusb bereitstellen (einmalig)"
	@echo "  make build      Firmware kompilieren  -> ./$(FW_BIN)"
	@echo "  make build-all  reva und revb bauen"
	@echo "  make detect     Revision des angeschlossenen Boards ermitteln"
	@echo "  make detect-wait  bis zu WAIT=$(WAIT)s warten, bis Board (Bootloader) auftaucht"
	@echo "  make usb        alle angeschlossenen USB-Geraete auflisten (Diagnose)"
	@echo "  make flash      Firmware flashen (Board per Reset in den Bootloader)"
	@echo "  make flash-auto Revision automatisch erkennen, passende Firmware flashen"
	@echo "  make clean      gebaute Artefakte entfernen"
	@echo "  make distclean  zusaetzlich QMK-Fork und bin/ loeschen"
	@echo ""
	@echo "  Revision umstellen:  make build REV=revb / make flash REV=revb"

setup: $(QMK_DIR) $(WALLY) libusb
	@echo ">> Setup abgeschlossen."

# QMK-Fork klonen (nur falls noch nicht vorhanden, ~1.5 GB inkl. Submodule).
$(QMK_DIR):
	@echo ">> Klone ZSA QMK-Fork (dauert ein paar Minuten) ..."
	git clone --recurse-submodules --depth 1 --shallow-submodules $(FORK_URL) $(QMK_DIR)

# wally-cli herunterladen (CLI-Flasher von ZSA, macOS-Binary).
$(WALLY):
	@echo ">> Lade wally-cli ..."
	@mkdir -p bin
	curl -fL -o $(WALLY) $(WALLY_URL)
	chmod +x $(WALLY)
	@xattr -d com.apple.quarantine $(WALLY) 2>/dev/null || true

# libusb wird von wally-cli zur Laufzeit benoetigt.
.PHONY: libusb
libusb:
	@command -v brew >/dev/null 2>&1 || { echo ">> Homebrew fehlt – libusb bitte manuell installieren."; exit 0; }
	@brew list libusb >/dev/null 2>&1 || brew install libusb

build: $(QMK_DIR)
	@echo ">> Kompiliere $(KEYBOARD):$(KEYMAP) im Container ..."
	$(DOCKER_RUN) qmk compile -kb $(KEYBOARD) -km $(KEYMAP)
	@cp $(QMK_DIR)/$(FW_BIN) ./$(FW_BIN)
	@md5 -q ./$(FW_BIN) > ./$(FW_BIN).md5
	@echo ">> Fertig: ./$(FW_BIN)  ($$(wc -c < ./$(FW_BIN)) Bytes, md5 $$(cat ./$(FW_BIN).md5))"

build-all:
	@$(MAKE) build REV=reva
	@$(MAKE) build REV=revb

detect:
	@scripts/detect-rev.sh || true

# Wartet bis zu WAIT Sekunden, bis das Board (z.B. im Bootloader) auftaucht.
detect-wait:
	@scripts/detect-rev.sh --wait $(WAIT) || true

# Alle angeschlossenen USB-Geraete auflisten (Diagnose).
usb:
	@scripts/detect-rev.sh --list

# Revision automatisch erkennen (mit Warten), passende Firmware bauen und flashen.
flash-auto: $(WALLY)
	@rev=$$(scripts/detect-rev.sh --wait $(WAIT)) || exit 1; \
	$(MAKE) build REV=$$rev && $(MAKE) flash REV=$$rev

flash: $(WALLY)
	@test -f ./$(FW_BIN) || { echo ">> ./$(FW_BIN) fehlt – erst 'make build REV=$(REV)' ausfuehren."; exit 1; }
	@echo ">> Flashe ./$(FW_BIN) ($(REV))."
	@echo ">> Druecke jetzt den Reset-Knopf am Moonlander (kleines Loch oben links)."
	$(WALLY) ./$(FW_BIN)

clean:
	rm -f ./zsa_moonlander_*_$(KEYMAP).bin ./zsa_moonlander_*_$(KEYMAP).bin.md5
	rm -rf $(QMK_DIR)/.build

distclean: clean
	rm -rf $(QMK_DIR) bin
