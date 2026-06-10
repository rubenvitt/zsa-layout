# Keymap-Cleanup „bone-r" — Design

**Datum:** 2026-06-10
**Scope:** Aufräumen (A) + sanfte Ergonomie (C), ohne Buchstaben-Layout oder Muskelgedächtnis zu brechen. Quelle ist `keymap.c` (Oryx abgehängt).

## Rahmenbedingungen
- **Auto Shift bleibt aktiv** (`AUTO_SHIFT_ENABLE = yes`). Echte Home-Row-Mods sind damit
  inkompatibel (Halten = Großbuchstabe vs. Halten = Modifier) → bewusst weggelassen.
- Layer 1–5 werden in diesem Schritt **nicht** umgebaut (vertagt).

## Änderungen (nur Layer 0 + ein Define)

1. **Index 13** (Layer 0, oben rechts außen): `LT(2, KC_Q)` → `LT(2, KC_BSPC)`.
   Hold = Layer 2 (unverändert), Tap = Backspace. Q-Tap entfällt (vom Nutzer nicht gewünscht).
2. **Index 21** (Layer 0, innere Zusatzspalte rechts, Reihe 2): `KC_P` → `KC_BSPC`.
   Verifizierte Dublette; das echte Bone-`P` (Index 22) bleibt.
3. **Phantom-Layer 6** (`DUAL_FUNC_0`): sprechend umbenennen (`TH_LTGT`) + Kommentar.
   **Funktion unverändert:** Tap = `<`, Hold = `>`. Layer 6 ist ein nie aktivierter Dummy
   (Oryx-Tap/Hold-Trick; `process_record_user` bricht mit `return false` ab).

## Bewusst nicht angefasst
Buchstaben-Layout (Bone), Pfeil-Cluster (bereits sauberes Inverted-T: `↑` Idx 52 über `↓`
Idx 64), Space/Daumen, `MO(3)`/`MO(4)`/`TG(4)` (beidhändiger Layer-Zugriff, gewollt).

## Verifikation
`make build` muss sauber durchlaufen und die `.bin` erzeugen. Flashen erst auf Wunsch.
