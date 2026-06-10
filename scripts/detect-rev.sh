#!/bin/sh
# Ermittelt die Hardware-Revision eines angeschlossenen ZSA Moonlander
# anhand der USB-Deskriptoren (macOS). Datenquelle: ioreg (Live-Zustand,
# im Gegensatz zu system_profiler nicht gecacht).
#
#   reva  Normalmodus  USB 0x3297:0x1969   Bootloader  STM32 DFU (0x0483:0xdf11)
#   revb  Normalmodus  USB 0x3297:0x1972   Bootloader  "Moonlander Bootloader"
#
# Aufruf:
#   detect-rev.sh             einmalig pruefen
#   detect-rev.sh --wait [N]  bis zu N Sekunden warten (Default 60), bis das
#                             Board auftaucht (z.B. im Bootloader, Reset druecken)
#   detect-rev.sh --list      nur alle angeschlossenen USB-Geraete auflisten
#
# Ausgabe: reiner "reva"/"revb"-Token auf stdout (fuer Scripting),
#          Meldungen/Geraeteliste auf stderr. Exit 0 = erkannt, 1 = nichts.

set -eu

if [ "$(uname)" != "Darwin" ]; then
	echo ">> detect-rev unterstuetzt aktuell nur macOS." >&2
	exit 1
fi

MODE=once
WAIT=60
case "${1:-}" in
	-w|--wait) MODE=wait; WAIT="${2:-60}" ;;
	-l|--list) MODE=list ;;
	"") : ;;
	*) echo ">> Unbekanntes Argument: $1 (erlaubt: --wait [N] | --list)" >&2; exit 2 ;;
esac

# Gemeinsames Python-Programm. Argument: "detect" oder "list".
# Liest ioreg-Textbaum von stdin.
PROG='
import sys, re

action = sys.argv[1] if len(sys.argv) > 1 else "detect"

devs = []
cur = None
for line in sys.stdin:
    m = re.search(r"\+-o (.+?)  <class", line)
    if m:
        cur = {"name": m.group(1).strip()}
        devs.append(cur)
        continue
    if cur is None:
        continue
    m = re.search(r"\"idVendor\" = (\d+)", line)
    if m: cur["vid"] = int(m.group(1))
    m = re.search(r"\"idProduct\" = (\d+)", line)
    if m: cur["pid"] = int(m.group(1))
    m = re.search(r"\"USB Product Name\" = \"(.*)\"", line)
    if m: cur["prod"] = m.group(1)

def rev_of(d):
    vid, pid = d.get("vid"), d.get("pid")
    name = (d.get("prod") or d.get("name") or "").lower()
    if vid == 0x3297 and pid == 0x1969: return "reva", "Normalmodus"
    if vid == 0x3297 and pid == 0x1972: return "revb", "Normalmodus"
    if "moonlander" in name and "bootloader" in name: return "revb", "Bootloader"
    if vid == 0x0483 and pid == 0xdf11: return "reva", "Bootloader (STM32 DFU)"
    return None, None

def looks_like_kbd(d):
    vid = d.get("vid")
    name = (d.get("prod") or d.get("name") or "").lower()
    if vid in (0x3297, 0x0483): return True
    return any(w in name for w in ("moonlander", "zsa", "keyboard", "stm32", "dfu", "bootloader"))

if action == "list":
    print(">> Angeschlossene USB-Geraete:", file=sys.stderr)
    real = [d for d in devs if d.get("vid") is not None or d.get("pid") is not None]
    if not real:
        print("   (keine gefunden)", file=sys.stderr)
    for d in real:
        vid, pid = d.get("vid"), d.get("pid")
        ids = f"{vid:#06x}:{pid:#06x}" if vid is not None and pid is not None else "      ?      "
        name = d.get("prod") or d.get("name") or "?"
        mark = "   <-- evtl. das Keyboard" if looks_like_kbd(d) else ""
        print(f"   {ids}  {name}{mark}", file=sys.stderr)
    sys.exit(0)

# action == detect
for d in devs:
    rev, mode = rev_of(d)
    if rev:
        print(f">> Moonlander erkannt: {rev} ({mode}).", file=sys.stderr)
        if "Normalmodus" in mode:
            print(">> Hinweis: Board ist im Normalmodus - zum Flashen Reset druecken.", file=sys.stderr)
        print(f">> Flashen mit:  make flash REV={rev}", file=sys.stderr)
        print(rev)
        sys.exit(0)
sys.exit(1)
'

usb_dump() { ioreg -p IOUSB -l -w 0 2>/dev/null; }
list_usb() { usb_dump | python3 -c "$PROG" list; }   # gibt auf stderr aus

detect_once() { usb_dump | python3 -c "$PROG" detect; }  # rev auf stdout, Meldung auf stderr

# --list: nur auflisten
if [ "$MODE" = "list" ]; then
	list_usb
	exit 0
fi

rev="$(detect_once || true)"

if [ -z "$rev" ] && [ "$MODE" = "wait" ]; then
	echo ">> Kein Board. Warte bis zu ${WAIT}s - jetzt den Moonlander in den Bootloader bringen (Reset-Knopf)." >&2
	end=$(( $(date +%s) + WAIT ))
	while [ "$(date +%s)" -lt "$end" ]; do
		sleep 1
		rev="$(detect_once || true)"
		[ -n "$rev" ] && break
	done
fi

if [ -n "$rev" ]; then
	printf '%s\n' "$rev"   # reiner Token auf stdout (fuer flash-auto / Scripting)
	exit 0
fi

# Nicht gefunden -> zur Diagnose alle USB-Geraete zeigen.
echo ">> Kein Moonlander erkannt." >&2
list_usb
echo ">> Falls dein Board oben gelistet ist, aber nicht erkannt wurde, schick mir die" >&2
echo ">> Zeile (VID:PID + Name) - dann ergaenze ich die Erkennung." >&2
echo ">> Tipp: STM32-DFU (revA-Bootloader) ist generisch und nur eindeutig," >&2
echo ">>       wenn sonst kein STM32-DFU-Geraet angeschlossen ist." >&2
exit 1
