import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseKeymap, describeKey, LAYER_NAMES } from './keymap.js';

const source = readFileSync(new URL('../zsa_moonlander_bone-r_source/keymap.c', import.meta.url), 'utf8');
const { layers, defines } = parseKeymap(source);

test('parses 6 layers with 72 keys each', () => {
  assert.deepEqual(layers.map((l) => l.index), [0, 1, 2, 3, 4, 5]);
  for (const layer of layers) assert.equal(layer.keys.length, 72, `layer ${layer.index}`);
  assert.equal(layers[0].keys[0], 'MO(3)');
  assert.equal(layers[2].keys[29], 'LALT(LSFT(KC_7))');
});

test('collects simple defines', () => {
  assert.equal(defines.TH_LTGT, 'LT(6, KC_F14)');
});

test('rejects layers with the wrong key count', () => {
  assert.throws(() => parseKeymap('keymaps[] = { [0] = LAYOUT_moonlander(KC_A, KC_B) };'), /Layer 0 hat 2 statt 72/);
});

test('German host: KC_Y types Z, KC_Z types Y', () => {
  assert.equal(describeKey('KC_Y').label, 'Z');
  assert.equal(describeKey('KC_Z').label, 'Y');
  assert.equal(describeKey('DE_Z').label, 'Z');
  assert.equal(describeKey('DE_SS').label, 'ß');
});

test('dual-function and layer keys', () => {
  const lt = describeKey('LT(2, KC_BSPC)');
  assert.equal(lt.label, '⌫');
  assert.equal(lt.hold, 'L2');
  assert.match(lt.detail, new RegExp(LAYER_NAMES[2]));
  assert.equal(describeKey('MO(3)').category, 'layer');
});

test('macOS Option characters', () => {
  assert.equal(describeKey('LALT(KC_L)').label, '@');
  assert.equal(describeKey('LALT(LSFT(KC_7))').label, '\\');
  assert.equal(describeKey('LSFT(DE_CIRC)').label, '°');
  assert.equal(describeKey('LGUI(LSFT(KC_4))').label, '⇧⌘4');
});

test('TH_LTGT resolves via defines', () => {
  const info = describeKey('TH_LTGT', defines);
  assert.equal(info.label, '<');
  assert.equal(info.hold, '>');
  assert.match(info.detail, /LT\(6, KC_F14\)/);
});

test('transparent, none and unknown codes', () => {
  assert.equal(describeKey('KC_TRANSPARENT').category, 'transparent');
  assert.equal(describeKey('KC_TRANSPARENT').label, '');
  assert.equal(describeKey('KC_NO').category, 'none');
  const unknown = describeKey('KC_WHATEVER_LONG');
  assert.equal(unknown.category, 'system');
  assert.ok(unknown.label.length > 0 && unknown.label.length <= 6);
});

test('every key in every layer is described', () => {
  for (const { index, keys } of layers) {
    keys.forEach((code, i) => {
      const info = describeKey(code, defines);
      assert.equal(info.code, code);
      if (info.category === 'transparent' || info.category === 'none') return;
      assert.ok(info.title, `layer ${index} key ${i} (${code}) has no title`);
      assert.ok(info.label, `layer ${index} key ${i} (${code}) has no label`);
      assert.notEqual(info.detail.startsWith('Unbekannter'), true, `layer ${index} key ${i} (${code}) is unknown`);
    });
  }
});
