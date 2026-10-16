# ZSA Moonlander – Layout "bone-r"

Build- & Flash-Pipeline für mein Oryx-Layout (`pzg9d`). Firmware wird reproduzierbar
im Docker-Container gegen ZSA's QMK-Fork gebaut und mit [`zapp`](https://github.com/zsa/zapp) geflasht.

## Schnellstart

```sh
make setup              # einmalig: QMK-Fork klonen (~1.5 GB), zapp installieren
make build              # Firmware kompilieren -> ./zsa_moonlander_reva_bone-r.bin
make flash              # aufs Board flashen (Reset-Knopf drücken, wenn zapp wartet)
```

`make help` zeigt alle Targets.

## Hardware-Revision

Der Moonlander gibt es als **revA** (Mark I, ausgeliefert bis ~Mitte Dez 2025) und
**revB** (neuer). Sie haben unterschiedliche USB-PID und Bootloader – die Firmware muss
zur Hardware passen. Default ist `reva`; für revB:

```sh
make build REV=revb
make flash REV=revb
```

Im Bootloader-Modus (Reset) meldet sich revA als „STM32 Bootloader" / „STM Device in DFU
Mode", revB als „Moonlander Bootloader".

Die Revision lässt sich auch automatisch über die USB-Deskriptoren ermitteln:

```sh
make detect             # einmalig prüfen, welches Board angeschlossen ist
make detect-wait        # bis zu 60s warten – Board in den Bootloader bringen (Reset)
make detect-wait WAIT=120
make usb                # alle USB-Geräte auflisten (Diagnose, wenn nichts erkannt wird)
make flash-auto         # Revision erkennen (mit Warten), bauen und flashen in einem Schritt
```

`make flash-auto` ist der bequemste Weg: Befehl starten, Reset drücken, fertig.

Die Erkennung liest den Live-USB-Zustand via `ioreg` (nicht `system_profiler`, das auf
macOS oft veraltete/leere Daten liefert). Wird nichts erkannt, zeigt `make detect` automatisch
die USB-Geräteliste, damit sich das Board (auch im Bootloader) identifizieren lässt.

## Voraussetzungen

- Docker (für den QMK-Build – keine lokale Toolchain nötig)
- macOS mit Homebrew (für `zapp`, ZSAs Flasher – Nachfolger von `wally-cli`, kann revA und revB)

## Was wo liegt

- `zsa_moonlander_bone-r_source/` – die aus Oryx exportierte Layout-Quelle (eingecheckt)
- `Makefile` – die Pipeline
- `qmk_firmware/` – geklonter ZSA-Fork (gitignored, via `make setup`)

Der Build mountet den Quell-Ordner direkt als Keymap `bone-r` in den Container, klont/kopiert
also nichts in den Fork hinein – Layout-Änderungen in `zsa_moonlander_bone-r_source/` werden
beim nächsten `make build` automatisch übernommen.

---

# Building your layout from source (Original ZSA-Anleitung)

Congratulations on taking the next step, and making use of your keyboard's open-source nature! There's so much you can do with QMK. 

Here's how to get started compiling your own firmware:
1. Choose whether to build your layout against ZSA's QMK fork or mainline QMK. Using ZSA's fork means your firmware will compile easily, but it is slower to update and does not pull all the new features of mainline QMK. Mainline is the bleeding edge, but you will probably need to debug some compiler errors when setting up your layout for the first time.
2. Use the documentation at [docs.qmk.fm](https://docs.qmk.fm/) to set up your environment for building your firmware.
	- If you would like to compile against ZSA's fork,  make sure to manually set the path when going through the setup: [https://github.com/zsa/qmk_firmware/](https://github.com/zsa/qmk_firmware/) (ZSA's QMK fork). Otherwise, the setup process will default to mainline QMK (qmk/qmk_firmware).
		- ZSA's QMK fork will default to the current firmware revision, but it is possible to compile against other revisions by specifying the relevant branch. You can see what firmware revision a layout was compiled against in Oryx by looking at the badge at the top right, e.g. "firmware v24.0", "firmware v23.0" etc.
        3. Create a folder with a simple name and no spaces for your layout inside the qmk_firmware/keyboards/zsa/moonlander/keymaps/ folder.
	- Optionally, you can instead use an external userspace: https://docs.qmk.fm/newbs_external_userspace
4. Copy the contents of the \*\_source folder (in the .zip you downloaded from Oryx) into this folder.
5. Make sure you've set up your environment for compiling per the [QMK docs](https://docs.qmk.fm/#/newbs_getting_started?id=set-up-your-environment).
6. From your shell, make sure your working directory is qmk_firmware, then enter the command `qmk compile`. If you haven't set up a default keyboard and layout through the QMK docs, you'll need to specify these manually: `qmk compile -kb <your-keyboard> -km <your-layout-folder-name>`. 
7. To flash, enter the command `qmk flash`, then put your board into bootloader mode with the reset button. 

Good luck on your journey! If you would like to maintain your Oryx layout with custom QMK functionality, check out this [community-made tool to add custom QMK features to your Oryx layout](https://blog.zsa.io/oryx-custom-qmk-features/). And remember, if you get stuck, you can always get back to your [original layout](https://configure.zsa.io/moonlander/layouts/pzg9d/B4PNwW/0) from Oryx.
