# Moonlander Layout – Build- & Flash-Pipeline
# Layout "bone-r" (Oryx-Export pzg9d) fuer den ZSA Moonlander.
#
# Schnellstart:
#   make setup     einmalig: QMK-Fork klonen, zapp (Flasher) installieren
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

# Flasher: zapp (ZSA, Nachfolger von wally-cli, kann revA und revB)
ZAPP        := zapp

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
.PHONY: help setup build build-all detect detect-wait usb flash flash-auto viewer site clean distclean

help:
	@echo "Moonlander Build-Pipeline (Layout: $(KEYMAP), Revision: $(REV))"
	@echo ""
	@echo "  make setup      QMK-Fork klonen + zapp installieren (einmalig)"
	@echo "  make build      Firmware kompilieren  -> ./$(FW_BIN)"
	@echo "  make build-all  reva und revb bauen"
	@echo "  make detect     Revision des angeschlossenen Boards ermitteln"
	@echo "  make detect-wait  bis zu WAIT=$(WAIT)s warten, bis Board (Bootloader) auftaucht"
	@echo "  make usb        alle angeschlossenen USB-Geraete auflisten (Diagnose)"
	@echo "  make flash      Firmware flashen (Board per Reset in den Bootloader)"
	@echo "  make flash-auto Revision automatisch erkennen, passende Firmware flashen"
	@echo "  make viewer     3D-Ansicht des Layouts im Browser (liest keymap.c live)"
	@echo "  make site       3D-Ansicht als statische Seite nach $(SITE_DIR)/ bauen (Hosting)"
	@echo "  make clean      gebaute Artefakte entfernen"
	@echo "  make distclean  zusaetzlich QMK-Fork loeschen"
	@echo ""
	@echo "  Revision umstellen:  make build REV=revb / make flash REV=revb"

setup: $(QMK_DIR) zapp
	@echo ">> Setup abgeschlossen."

# QMK-Fork klonen (nur falls noch nicht vorhanden, ~1.5 GB inkl. Submodule).
$(QMK_DIR):
	@echo ">> Klone ZSA QMK-Fork (dauert ein paar Minuten) ..."
	git clone --recurse-submodules --depth 1 --shallow-submodules $(FORK_URL) $(QMK_DIR)

# zapp per Homebrew installieren, falls noch nicht vorhanden.
.PHONY: zapp
zapp:
	@command -v $(ZAPP) >/dev/null 2>&1 || brew install zapp

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
flash-auto: zapp
	@rev=$$(scripts/detect-rev.sh --wait $(WAIT)) || exit 1; \
	$(MAKE) build REV=$$rev && $(MAKE) flash REV=$$rev

flash: zapp
	@test -f ./$(FW_BIN) || { echo ">> ./$(FW_BIN) fehlt – erst 'make build REV=$(REV)' ausfuehren."; exit 1; }
	@echo ">> Flashe ./$(FW_BIN) ($(REV))."
	@echo ">> Druecke jetzt den Reset-Knopf am Moonlander (kleines Loch oben links)."
	$(ZAPP) flash ./$(FW_BIN)

# 3D-Ansicht: Seite liest keymap.c live per fetch, braucht daher einen lokalen Server.
VIEWER_PORT ?= 8000
viewer:
	@echo ">> 3D-Ansicht: http://localhost:$(VIEWER_PORT)/viewer/  (Strg+C beendet)"
	@(sleep 1 && open http://localhost:$(VIEWER_PORT)/viewer/) &
	python3 -m http.server $(VIEWER_PORT) --bind 127.0.0.1

# Statische Seite fürs Hosting (z.B. Cloudflare Pages: Build-Befehl 'make site', Ausgabe 'dist').
SITE_DIR := dist
site:
	rm -rf $(SITE_DIR) && mkdir -p $(SITE_DIR)
	cp -L viewer/index.html viewer/main.js viewer/keymap.js viewer/layout.json viewer/keymap.c $(SITE_DIR)/
	@echo ">> Statische Seite: ./$(SITE_DIR)/"

clean:
	rm -f ./zsa_moonlander_*_$(KEYMAP).bin ./zsa_moonlander_*_$(KEYMAP).bin.md5
	rm -rf $(QMK_DIR)/.build $(SITE_DIR)

distclean: clean
	rm -rf $(QMK_DIR)
