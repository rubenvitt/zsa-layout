// Parses the QMK keymap.c of the Moonlander "bone-r" layout and describes each key
// for a macOS host with German keyboard layout.

export const LAYER_NAMES = {
  0: 'Bone (Basis)',
  1: 'QWERTZ',
  2: 'Symbole & F-Tasten',
  3: 'Navigation & Numpad',
  4: 'Maus, Media & System',
  5: 'IDE-Shortcuts',
};

const KEYS_PER_LAYER = 72;

export function parseKeymap(source) {
  // shortcut: comment stripping ignores string literals, fine for keymap.c
  const src = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  const defines = {};
  for (const [, name, value] of src.matchAll(/^[ \t]*#define[ \t]+(\w+)[ \t]+(.+?)[ \t]*$/gm)) {
    defines[name] = value;
  }

  const start = src.search(/keymaps\s*\[\s*\]/);
  if (start < 0) throw new Error('keymap.c: Keine keymaps[]-Definition gefunden');

  const layers = [];
  const layerRe = /\[\s*(\d+)\s*\]\s*=\s*LAYOUT_moonlander\s*\(/g;
  layerRe.lastIndex = start;
  let m;
  while ((m = layerRe.exec(src))) {
    const keys = [];
    let depth = 0, arg = '', i = layerRe.lastIndex;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === '(') depth++;
      else if (ch === ')' && depth-- === 0) break;
      if (ch === ',' && depth === 0) { keys.push(arg.trim()); arg = ''; }
      else arg += ch;
    }
    if (arg.trim()) keys.push(arg.trim());
    const index = Number(m[1]);
    if (keys.length !== KEYS_PER_LAYER) {
      throw new Error(`keymap.c: Layer ${index} hat ${keys.length} statt ${KEYS_PER_LAYER} Tasten`);
    }
    layers.push({ index, keys });
    layerRe.lastIndex = i;
  }
  if (!layers.length) throw new Error('keymap.c: Keine LAYOUT_moonlander-Layer gefunden');
  return { layers, defines };
}

const layerText = (n) => (LAYER_NAMES[n] ? `Layer ${n} (${LAYER_NAMES[n]})` : `Layer ${n}`);

// [label, category, title, detail, autoShiftChar]
const KEYS = {
  KC_TRANSPARENT: ['', 'transparent', 'Durchlässig', 'Verhält sich wie die Taste der darunterliegenden Ebene'],
  KC_NO: ['', 'none', 'Nicht belegt', 'Keine Funktion'],

  KC_LEFT_SHIFT: ['⇧', 'modifier', 'Shift links', 'Modifier'],
  KC_LEFT_CTRL: ['⌃', 'modifier', 'Control links', 'Modifier'],
  KC_LEFT_ALT: ['⌥', 'modifier', 'Option links', 'Modifier (macOS: Option/Alt)'],
  KC_RIGHT_ALT: ['⌥', 'modifier', 'Option rechts', 'Modifier (macOS: Option/Alt)'],
  KC_LEFT_GUI: ['⌘', 'modifier', 'Command links', 'Modifier (macOS: Command)'],
  KC_RIGHT_GUI: ['⌘', 'modifier', 'Command rechts', 'Modifier (macOS: Command)'],
  KC_CAPS: ['⇪', 'modifier', 'Caps Lock', 'Feststelltaste'],

  KC_ENTER: ['⏎', 'edit', 'Enter', 'Eingabe / Zeilenumbruch'],
  KC_SPACE: ['␣', 'edit', 'Leertaste', 'Leerzeichen'],
  KC_TAB: ['⇥', 'edit', 'Tab', 'Tabulator (ohne Auto Shift)'],
  KC_BSPC: ['⌫', 'edit', 'Backspace', 'Zeichen links löschen'],
  KC_DELETE: ['⌦', 'edit', 'Entf', 'Zeichen rechts löschen'],
  KC_ESCAPE: ['Esc', 'edit', 'Escape', 'Abbrechen / Escape'],

  KC_UP: ['↑', 'nav', 'Pfeil hoch', 'Cursor nach oben'],
  KC_DOWN: ['↓', 'nav', 'Pfeil runter', 'Cursor nach unten'],
  KC_LEFT: ['←', 'nav', 'Pfeil links', 'Cursor nach links'],
  KC_RIGHT: ['→', 'nav', 'Pfeil rechts', 'Cursor nach rechts'],
  KC_HOME: ['Pos1', 'nav', 'Pos1 (Home)', 'Zum Anfang (macOS: Dokumentanfang)'],
  KC_END: ['Ende', 'nav', 'Ende (End)', 'Zum Ende (macOS: Dokumentende)'],
  KC_PAGE_UP: ['Bild↑', 'nav', 'Bild auf', 'Eine Seite nach oben'],
  KC_PGDN: ['Bild↓', 'nav', 'Bild ab', 'Eine Seite nach unten'],

  KC_COMMA: [',', 'symbol', 'Komma', '', ';'],
  KC_DOT: ['.', 'symbol', 'Punkt', '', ':'],
  KC_KP_SLASH: ['/', 'symbol', 'Numpad-Schrägstrich', 'Schrägstrich vom Ziffernblock'],

  // DE_* from i18n.h, characters as produced on a macOS German layout
  DE_UE: ['Ü', 'letter', 'Ü', '', 'Ü'],
  DE_AE: ['Ä', 'letter', 'Ä', '', 'Ä'],
  DE_OE: ['Ö', 'letter', 'Ö', '', 'Ö'],
  DE_SS: ['ß', 'letter', 'ß (Eszett)', '', '?'],
  DE_Y: ['Y', 'letter', 'Buchstabe Y', '', 'Y'],
  DE_Z: ['Z', 'letter', 'Buchstabe Z', '', 'Z'],
  DE_MINS: ['-', 'symbol', 'Minus', '', '_'],
  DE_PLUS: ['+', 'symbol', 'Plus', '', '*'],
  DE_HASH: ['#', 'symbol', 'Raute', '', "'"],
  DE_CIRC: ['^', 'symbol', 'Zirkumflex', 'Tottaste: erst mit dem nächsten Zeichen sichtbar', '°'],
  DE_UNDS: ['_', 'symbol', 'Unterstrich', ''],
  DE_LESS: ['<', 'symbol', 'Kleiner-als', ''],
  DE_MORE: ['>', 'symbol', 'Größer-als', ''],
  DE_SLSH: ['/', 'symbol', 'Schrägstrich', ''],
  DE_ASTR: ['*', 'symbol', 'Stern', ''],
  DE_DLR: ['$', 'symbol', 'Dollar', ''],
  DE_GRV: ['`', 'symbol', 'Gravis (Backtick)', 'Tottaste: erst mit dem nächsten Zeichen sichtbar'],
  DE_EXLM: ['!', 'symbol', 'Ausrufezeichen', ''],
  DE_EQL: ['=', 'symbol', 'Gleichheitszeichen', ''],
  DE_AMPR: ['&', 'symbol', 'Kaufmanns-Und', ''],
  DE_QST: ['?', 'symbol', 'Fragezeichen', ''],
  DE_LPRN: ['(', 'symbol', 'Klammer auf', ''],
  DE_RPRN: [')', 'symbol', 'Klammer zu', ''],
  DE_COLN: [':', 'symbol', 'Doppelpunkt', ''],
  DE_PERC: ['%', 'symbol', 'Prozent', ''],
  DE_DQOT: ['"', 'symbol', 'Anführungszeichen', ''],
  DE_QUOT: ["'", 'symbol', 'Apostroph', ''],
  DE_SCLN: [';', 'symbol', 'Semikolon', ''],
  DE_EURO: ['€', 'symbol', 'Euro', 'Sendet AltGr+E = ⌥E'],
  // i18n.h defines DE_AT as AltGr+Q (PC layout); macOS turns ⌥Q into «, @ would be ⌥L
  DE_AT: ['«', 'symbol', '« (DE_AT, nicht @)', 'Sendet AltGr+Q (PC-Belegung für @). Unter macOS ergibt ⌥Q aber « – für @ ist ⌥L nötig'],

  KC_AUDIO_MUTE: ['Mute', 'media', 'Stumm', 'Ton aus/an'],
  KC_AUDIO_VOL_DOWN: ['Vol−', 'media', 'Leiser', 'Lautstärke verringern'],
  KC_AUDIO_VOL_UP: ['Vol+', 'media', 'Lauter', 'Lautstärke erhöhen'],
  KC_BRIGHTNESS_DOWN: ['☀−', 'media', 'Bildschirm dunkler', 'Display-Helligkeit verringern'],
  KC_BRIGHTNESS_UP: ['☀+', 'media', 'Bildschirm heller', 'Display-Helligkeit erhöhen'],
  KC_MEDIA_PREV_TRACK: ['⏮', 'media', 'Vorheriger Titel', 'Medien: zurück'],
  KC_MEDIA_PLAY_PAUSE: ['⏯', 'media', 'Play/Pause', 'Medien: Wiedergabe/Pause'],
  KC_MEDIA_NEXT_TRACK: ['⏭', 'media', 'Nächster Titel', 'Medien: vor'],

  KC_MS_UP: ['M↑', 'mouse', 'Maus hoch', 'Mauszeiger nach oben bewegen'],
  KC_MS_DOWN: ['M↓', 'mouse', 'Maus runter', 'Mauszeiger nach unten bewegen'],
  KC_MS_LEFT: ['M←', 'mouse', 'Maus links', 'Mauszeiger nach links bewegen'],
  KC_MS_RIGHT: ['M→', 'mouse', 'Maus rechts', 'Mauszeiger nach rechts bewegen'],
  KC_MS_BTN1: ['Klick', 'mouse', 'Linksklick', 'Maustaste 1 (links)'],
  KC_MS_BTN2: ['R-Kl.', 'mouse', 'Rechtsklick', 'Maustaste 2 (rechts)'],
  KC_MS_BTN3: ['M-Kl.', 'mouse', 'Mittelklick', 'Maustaste 3 (Mitte)'],
  KC_MS_WH_UP: ['Rad↑', 'mouse', 'Scrollen hoch', 'Mausrad nach oben'],
  KC_MS_WH_DOWN: ['Rad↓', 'mouse', 'Scrollen runter', 'Mausrad nach unten'],
  KC_MS_WH_LEFT: ['Rad←', 'mouse', 'Scrollen links', 'Mausrad nach links'],
  KC_MS_WH_RIGHT: ['Rad→', 'mouse', 'Scrollen rechts', 'Mausrad nach rechts'],

  QK_BOOT: ['Boot', 'system', 'Bootloader', 'Startet den Flash-Modus zum Aufspielen neuer Firmware'],
  AS_TOGG: ['AS', 'system', 'Auto Shift an/aus', 'Schaltet Auto Shift (Halten = Großbuchstabe/Shift-Zeichen) ein oder aus'],
  CW_TOGG: ['CW', 'system', 'Caps Word', 'Nächstes Wort in Großbuchstaben, endet bei Leerzeichen'],
  MU_NEXT: ['Mu▸', 'system', 'Musik-Modus: nächster', 'Wechselt den Musik-Modus; ohne Audio-Hardware (AUDIO_ENABLE = no) wirkungslos'],
  RGB_VAI: ['LED+', 'system', 'LED heller', 'Helligkeit der Tastatur-Beleuchtung erhöhen'],
  RGB_VAD: ['LED−', 'system', 'LED dunkler', 'Helligkeit der Tastatur-Beleuchtung verringern'],
  RGB_SLD: ['LED', 'system', 'LED-Modus statisch', 'Setzt die Beleuchtung auf statischen Modus'],
  MAC_SIRI: ['Siri', 'system', 'Siri / Diktat', 'Sendet Consumer-Code 0xCF (Sprachbefehl): startet Siri bzw. Diktat'],
  MAC_LOCK: ['Sperre', 'system', 'Bildschirm sperren', 'Sendet Consumer-Code 0x19E: sperrt den Mac'],
};

const ALIASES = {
  KC_TRNS: 'KC_TRANSPARENT', _______: 'KC_TRANSPARENT', XXXXXXX: 'KC_NO',
  KC_MAC_CUT: 'LGUI(KC_X)', KC_MAC_COPY: 'LGUI(KC_C)', KC_MAC_PASTE: 'LGUI(KC_V)',
};

// Shifted characters of the number row on a German layout
const SHIFTED_DIGITS = { 1: '!', 2: '"', 3: '§', 4: '$', 5: '%', 6: '&', 7: '/', 8: '(', 9: ')', 0: '=' };

const MODS = {
  LCTL: '⌃', RCTL: '⌃', C: '⌃',
  LALT: '⌥', RALT: '⌥', ALGR: '⌥', A: '⌥',
  LSFT: '⇧', RSFT: '⇧', S: '⇧',
  LGUI: '⌘', RGUI: '⌘', G: '⌘',
};
const MOD_ORDER = ['⌃', '⌥', '⇧', '⌘'];
const MOD_NAMES = { '⌃': 'Ctrl', '⌥': 'Option', '⇧': 'Shift', '⌘': 'Cmd' };

// macOS German Option characters (cf. qmk keymap_german_mac_iso.h); key: chord label
const CHORD_CHARS = {
  '⌥L': ['@', 'At-Zeichen'],
  '⌥5': ['[', 'Eckige Klammer auf'],
  '⌥6': [']', 'Eckige Klammer zu'],
  '⌥7': ['|', 'Senkrechter Strich (Pipe)'],
  '⌥⇧7': ['\\', 'Backslash'],
  '⌥8': ['{', 'Geschweifte Klammer auf'],
  '⌥9': ['}', 'Geschweifte Klammer zu'],
  '⌥N': ['~', 'Tilde', 'Tottaste: erst mit dem nächsten Zeichen sichtbar (Leertaste für ~ allein)'],
  '⌥.': ['…', 'Auslassungspunkte'],
  '⇧^': ['°', 'Gradzeichen'],
};

const ide = (title) => [title, `IDE-Shortcut (JetBrains, Windows/Linux-Keymap – vermutet): ${title}`];

// macOS and IDE shortcuts; key: chord label
const SHORTCUTS = {
  '⇧⌘4': ['Bildschirmfoto: Bereich', 'macOS: Bildschirmbereich auswählen und als Foto sichern'],
  '⇧⌘5': ['Bildschirmfoto-Werkzeug', 'macOS: Werkzeug für Bildschirmfotos und -aufnahmen öffnen'],
  '⌘␣': ['Spotlight', 'macOS: Spotlight-Suche öffnen'],
  '⇧⌘␣': ['Cmd+Shift+Leertaste', 'App-spezifisches Kürzel (z. B. Launcher); unter macOS standardmäßig nicht belegt'],
  '⌘X': ['Ausschneiden', 'macOS: Auswahl ausschneiden'],
  '⌘C': ['Kopieren', 'macOS: Auswahl kopieren'],
  '⌘V': ['Einsetzen', 'macOS: Zwischenablage einsetzen'],
  '⇧⌘Z': ['Wiederholen', 'macOS: Rückgängig gemachte Aktion wiederholen (Redo)'],
  '⌃Z': ['Ctrl+Z', 'Unter macOS kein Rückgängig (das wäre ⌘Z); im Terminal: Prozess anhalten, in IDEs mit Windows-Keymap: Rückgängig'],

  '⌃⌥⇧L': ide('Code formatieren (Dialog)'),
  '⌃Q': ide('Schnelldokumentation'),
  '⌃⇧/': ide('Blockkommentar'),
  '⌃/': ide('Zeilenkommentar'),
  '⌃Y': ide('Zeile löschen'),
  '⌥⇧↑': ide('Zeile nach oben verschieben'),
  '⌥⇧↓': ide('Zeile nach unten verschieben'),
  '⌃⇧↑': ide('Anweisung nach oben verschieben'),
  '⌃⇧↓': ide('Anweisung nach unten verschieben'),
  '⌃⌥T': ide('Umschließen mit … (Surround With)'),
  '⌃⇧I': ide('Schnelldefinition'),
  '⇧F9': ide('Debuggen'),
  '⇧F10': ide('Ausführen'),
  '⌃⇧F9': ide('Kontext debuggen'),
  '⌃D': ide('Zeile duplizieren'),
  '⌃⇧⌦': ide('Auspacken/Entfernen (Unwrap/Remove)'),
  '⌃⇧⏎': ide('Anweisung vervollständigen'),
  '⌃⌥⇧T': ide('Refactor This'),
  '⌃⌥M': ide('Methode extrahieren'),
  '⇧F6': ide('Umbenennen'),
  '⌃W': ide('Auswahl erweitern'),
  '⌃⇧W': ide('Auswahl verkleinern'),
  '⌥J': ide('Nächstes Vorkommen auswählen'),
  '⌥⇧J': ide('Vorkommen abwählen'),
  '⌃⌥⇧J': ide('Alle Vorkommen auswählen'),
};

const autoShift = (char) => `Halten: ${char} (Auto Shift)`;

function fromEntry([label, category, title, detail = '', shifted]) {
  const tap = category === 'letter' ? label.toLowerCase() : label;
  const parts = [detail || (shifted ? `Tippen: ${tap}` : ''), shifted && autoShift(shifted)].filter(Boolean);
  return { label, category, title, detail: parts.join(' · ') };
}

function describeChord(code, defines, depth) {
  const mods = new Set();
  let m;
  while ((m = code.match(/^(\w+)\((.*)\)$/s)) && MODS[m[1]]) {
    mods.add(MODS[m[1]]);
    code = m[2].trim();
  }
  if (!mods.size) return null;
  const prefix = MOD_ORDER.filter((s) => mods.has(s)).join('');
  const inner = describe(code, defines, depth + 1);
  const chord = prefix + inner.label;
  const combo = [...MOD_ORDER.filter((s) => mods.has(s)).map((s) => MOD_NAMES[s]), inner.label].join('+');

  if (CHORD_CHARS[chord]) {
    const [char, title, extra] = CHORD_CHARS[chord];
    return { label: char, category: 'symbol', title, detail: [`macOS (Deutsch): ${chord}`, extra].filter(Boolean).join(' · ') };
  }
  if (SHORTCUTS[chord]) {
    const [title, detail] = SHORTCUTS[chord];
    return { label: chord, category: 'shortcut', title, detail: `${chord} · ${detail}` };
  }
  return { label: chord, category: 'shortcut', title: combo, detail: `Tastenkombination ${chord} (Funktion app-abhängig, z. B. IDE-Shortcut)` };
}

function describe(code, defines, depth = 0) {
  if (ALIASES[code]) return describe(ALIASES[code], defines, depth + 1);
  if (KEYS[code]) return fromEntry(KEYS[code]);

  if (code === 'TH_LTGT') {
    return {
      label: '<', hold: '>', category: 'symbol', title: 'Kleiner-/Größer-als',
      detail: `Tippen: < · Halten: > · Eigene Tap/Hold-Taste; ${defines.TH_LTGT ?? 'LT(6, …)'} ist nur eine Attrappe, Layer 6 wird nie aktiv`,
    };
  }

  let m;
  if ((m = code.match(/^KC_([A-Z])$/))) {
    // German layout swaps Y and Z
    const letter = { Y: 'Z', Z: 'Y' }[m[1]] ?? m[1];
    return fromEntry([letter, 'letter', `Buchstabe ${letter}`, '', letter]);
  }
  if ((m = code.match(/^KC_(\d)$/))) return fromEntry([m[1], 'number', `Ziffer ${m[1]}`, '', SHIFTED_DIGITS[m[1]]]);
  if ((m = code.match(/^KC_F(\d+)$/))) return { label: `F${m[1]}`, category: 'function', title: `F${m[1]}`, detail: `Funktionstaste F${m[1]}` };

  if ((m = code.match(/^MO\((\d+)\)$/))) {
    return { label: `L${m[1]}`, category: 'layer', title: `Layer ${m[1]} (halten)`, detail: `Halten: ${layerText(m[1])}` };
  }
  if ((m = code.match(/^TG\((\d+)\)$/))) {
    return { label: `⇆L${m[1]}`, category: 'layer', title: `Layer ${m[1]} umschalten`, detail: `Tippen: ${layerText(m[1])} ein-/ausschalten` };
  }
  if ((m = code.match(/^LT\((\d+),\s*(.+)\)$/s))) {
    const tap = describe(m[2].trim(), defines, depth + 1);
    return {
      label: tap.label, hold: `L${m[1]}`, category: 'layer',
      title: `${tap.title} / Layer ${m[1]}`, detail: `Tippen: ${tap.title} · Halten: ${layerText(m[1])}`,
    };
  }

  const chord = describeChord(code, defines, depth);
  if (chord) return chord;

  if (defines[code] && depth < 8) return describe(defines[code].trim(), defines, depth + 1);

  return { label: code.replace(/^(KC|DE|QK|RGB)_/, '').slice(0, 6), category: 'system', title: code, detail: `Unbekannter Keycode: ${code}` };
}

export function describeKey(code, defines = {}) {
  code = String(code ?? '').trim();
  const info = describe(code, defines);
  return { label: info.label, hold: info.hold ?? null, category: info.category, title: info.title, detail: info.detail, code };
}
