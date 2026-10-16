import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { parseKeymap, describeKey, LAYER_NAMES } from './keymap.js';

// Lokal ein Symlink auf die Keymap-Quelle, im gebauten Site-Ordner eine Kopie (make site).
const SOURCE_URL = 'keymap.c';
// Live-Reload nur lokal; die gehostete Seite ist ein fester Stand.
const LIVE = ['localhost', '127.0.0.1'].includes(location.hostname);
const POLL_MS = 2000;

const THUMB_ANGLE = THREE.MathUtils.degToRad(27); // thumb clusters fan out down/inward like the real board
const HALF_GAP = 1.6;                              // extra space between the halves (key units)
const HALF_SPLAY = THREE.MathUtils.degToRad(9);   // halves rotated outward (top view)
const HALF_TENT = THREE.MathUtils.degToRad(6);    // inner edges raised
const CASE_HEIGHT = 0.55;
const CAP_HEIGHT = 0.38;
const CAP_GAP = 0.1;

const CATEGORIES = {
  letter:     { color: '#e4e0d6', name: 'Buchstaben' },
  number:     { color: '#c3ccd6', name: 'Ziffern' },
  symbol:     { color: '#86a6e6', name: 'Sonderzeichen' },
  modifier:   { color: '#e0a458', name: 'Modifier' },
  layer:      { color: '#a487e0', name: 'Layer' },
  nav:        { color: '#6cc48a', name: 'Navigation' },
  edit:       { color: '#e57f6e', name: 'Bearbeiten' },
  function:   { color: '#69788a', name: 'F-Tasten' },
  media:      { color: '#d873ad', name: 'Medien' },
  mouse:      { color: '#cdbb5e', name: 'Maus' },
  system:     { color: '#c24b4b', name: 'System' },
  shortcut:   { color: '#3fb1bd', name: 'Shortcuts' },
  none:       { color: '#2a2d34', name: 'unbelegt' },
};
const BG = '#14161b';
const ACCENT = new THREE.Color('#7aa7ff');

const $ = (id) => document.getElementById(id);
const layout = await (await fetch('layout.json')).json();

// ---------- physical layout ----------

const isLeft = (k) => k.x + k.w / 2 < 8.5;
const isRed = (k) => k.w === 2;
const isThumb = (k) => isRed(k) || k.h > 1;

// 2D placement in key units (x right, y down): center + rotation, thumb clusters rotated around the red key's outer top corner.
const placements = layout.map((k) => {
  const left = isLeft(k);
  let cx = k.x + k.w / 2, cy = k.y + k.h / 2, angle = 0;
  if (isThumb(k)) {
    const px = left ? 5 : 12, py = 4.5;
    angle = left ? THUMB_ANGLE : -THUMB_ANGLE;
    const dx = cx - px, dy = cy - py, c = Math.cos(angle), s = Math.sin(angle);
    cx = px + dx * c - dy * s;
    cy = py + dx * s + dy * c;
  }
  return { left, cx, cy, angle, w: k.w - CAP_GAP, h: k.h - CAP_GAP };
});

function rowLabel(i) {
  const k = layout[i];
  if (isRed(k)) return 'Daumencluster (rote Taste)';
  if (isThumb(k)) return 'Daumencluster';
  return `Reihe ${[14, 28, 42, 54, 66].filter((start) => i >= start).length + 1}`;
}

// ---------- scene ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
$('scene').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 30, 60);

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
camera.position.set(0, 15, 14);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0.6);
controls.enableDamping = true;
controls.minDistance = 7;
controls.maxDistance = 40;
controls.maxPolarAngle = THREE.MathUtils.degToRad(82);
controls.update();

scene.add(new THREE.HemisphereLight('#c8d4ff', '#1a1612', 1.1));
const sun = new THREE.DirectionalLight('#fff4e6', 2.2);
sun.position.set(-6, 14, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 6;
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 10, bottom: -10, near: 1, far: 40 });
sun.shadow.bias = -0.0005;
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: '#1b1e24', roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.3;
ground.receiveShadow = true;
scene.add(ground);

// Convex hull (monotone chain) for the case outline.
function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (pts) => {
    const out = [];
    for (const q of pts) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return [...half(p), ...half(p.reverse())];
}

const caps = [];
for (const left of [true, false]) {
  const originX = left ? 8 : 9, originY = 3.5;
  const group = new THREE.Group();
  group.position.set((left ? -1 : 1) * (0.5 + HALF_GAP / 2), 0, 0);
  group.rotation.set(0, left ? -HALF_SPLAY : HALF_SPLAY, left ? HALF_TENT : -HALF_TENT);
  scene.add(group);

  const corners = [];
  placements.forEach((p, i) => {
    if (p.left !== left) return;
    const lx = p.cx - originX, lz = p.cy - originY;
    const c = Math.cos(p.angle), s = Math.sin(p.angle), pad = 0.35;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const dx = sx * (p.w / 2 + pad), dy = sy * (p.h / 2 + pad);
      corners.push([lx + dx * c - dy * s, lz + dx * s + dy * c]);
    }

    const cap = new THREE.Mesh(
      new RoundedBoxGeometry(p.w, CAP_HEIGHT, p.h, 3, 0.09),
      new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 }));
    cap.position.set(lx, CASE_HEIGHT + CAP_HEIGHT / 2, lz);
    cap.rotation.y = -p.angle;
    cap.castShadow = cap.receiveShadow = true;
    cap.userData.index = i;
    const top = new THREE.Mesh(new THREE.PlaneGeometry(p.w - 0.12, p.h - 0.12),
      new THREE.MeshBasicMaterial({ transparent: true }));
    top.rotation.x = -Math.PI / 2;
    top.position.y = CAP_HEIGHT / 2 + 0.002;
    top.userData.index = i;
    cap.add(top);
    group.add(cap);
    caps[i] = cap;
  });

  const shape = new THREE.Shape(hull(corners).map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: CASE_HEIGHT - 0.1, bevelSize: 0.12, bevelThickness: 0.1, bevelSegments: 3 });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, CASE_HEIGHT - 0.1, 0);
  const slab = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#2a2e36', roughness: 0.7, metalness: 0.15 }));
  slab.castShadow = slab.receiveShadow = true;
  group.add(slab);
}

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  // Keep the whole board in view on narrow/portrait windows by widening the vertical fov.
  camera.fov = Math.max(40, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(33)) / camera.aspect)));
  // Shift the board left while the side panel is open on wide screens (narrow screens use a bottom sheet).
  const shift = !$('panel').hidden && innerWidth > 800 ? ($('panel').offsetWidth + 16) / 2 : 0;
  if (shift) camera.setViewOffset(innerWidth, innerHeight, shift, 0, innerWidth, innerHeight);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

// ---------- legends ----------

const PX = 192; // canvas pixels per key unit

function textColorFor(color) {
  const c = color.clone().convertLinearToSRGB();
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b > 0.6 ? '#1b1d22' : '#eef0f3';
}

// Largest font (one line, else two lines split at a space/+) that fits the cap width.
function fitLabel(g, label, maxW) {
  const breaks = [...label.matchAll(/[ +]/g)].map((m) => m.index);
  for (let size = PX * 0.42; size >= PX * 0.16; size *= 0.92) {
    g.font = `600 ${size}px system-ui, -apple-system, "Helvetica Neue", sans-serif`;
    if (g.measureText(label).width <= maxW) return { size, lines: [label] };
    for (const b of breaks) {
      const lines = [label.slice(0, b + (label[b] === '+' ? 1 : 0)).trim(), label.slice(b + 1).trim()];
      if (lines.every((l) => g.measureText(l).width <= maxW) && size <= PX * 0.3) return { size, lines };
    }
  }
  return { size: PX * 0.16, lines: [label] };
}

function legendTexture(desc, w, h, ghost, color) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * PX);
  canvas.height = Math.round(h * PX);
  const g = canvas.getContext('2d');
  g.fillStyle = color;
  g.globalAlpha = ghost ? 0.45 : 1;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const { size, lines } = fitLabel(g, desc.label || '', canvas.width * 0.86);
  g.font = `600 ${size}px system-ui, -apple-system, "Helvetica Neue", sans-serif`;
  const cy = canvas.height / 2 - (desc.hold ? PX * 0.08 : 0);
  lines.forEach((l, n) => g.fillText(l, canvas.width / 2, cy + (n - (lines.length - 1) / 2) * size * 1.05));
  if (desc.hold) {
    g.font = `500 ${PX * 0.15}px system-ui, -apple-system, sans-serif`;
    g.textAlign = 'right';
    g.textBaseline = 'bottom';
    g.globalAlpha *= 0.8;
    g.fillText(desc.hold, canvas.width - PX * 0.06, canvas.height - PX * 0.04, canvas.width * 0.9);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// ---------- keymap state ----------

let keymap = null;     // parseKeymap result
let layerIndex = 0;
let selected = null;   // key index
let hovered = null;
let lastText = null;

const layerByIndex = (n) => keymap.layers.find((l) => l.index === n);

// Effective key on layer n: transparent keys fall through to the next lower layer (layer 0 is the base).
function resolve(n, i) {
  const own = describeKey(layerByIndex(n).keys[i], keymap.defines);
  if (own.category !== 'transparent') return { desc: own, from: n, own };
  // Alle Layer werden von der Basis aus aktiviert (MO/TG/LT auf Layer 0), daher fällt Durchlässiges auf Layer 0.
  if (n === 0) return { desc: own, from: n, own };
  return { desc: describeKey(layerByIndex(0).keys[i], keymap.defines), from: 0, own };
}

function paintCaps() {
  caps.forEach((cap, i) => {
    const { desc, from } = resolve(layerIndex, i);
    const ghost = from !== layerIndex;
    const base = (CATEGORIES[desc.category] ?? CATEGORIES.none).color;
    const color = new THREE.Color(base);
    if (ghost) color.lerp(new THREE.Color(BG), 0.72);
    cap.material.color.copy(color);
    const top = cap.children[0];
    top.material.map?.dispose();
    top.material.map = desc.category === 'none' ? null : legendTexture(desc, top.geometry.parameters.width,
      top.geometry.parameters.height, ghost, textColorFor(color));
    top.visible = !!top.material.map;
    top.material.needsUpdate = true;
  });
  paintHighlight();
}

// Only selection/hover styling, without re-rendering legends.
function paintHighlight() {
  caps.forEach((cap, i) => {
    cap.material.emissive.copy(i === selected ? ACCENT : new THREE.Color(0xffffff));
    cap.material.emissiveIntensity = i === selected ? 0.35 : i === hovered ? 0.08 : 0;
    cap.position.y = CASE_HEIGHT + CAP_HEIGHT / 2 - (i === selected ? 0.1 : 0);
  });
}

function renderTabs() {
  $('tabs').replaceChildren(...keymap.layers.map((l) => {
    const b = document.createElement('button');
    b.innerHTML = `<kbd>${l.index}</kbd>`;
    b.append(LAYER_NAMES[l.index] ?? `Layer ${l.index}`);
    b.setAttribute('aria-pressed', l.index === layerIndex);
    b.onclick = () => setLayer(l.index);
    return b;
  }));
}

function renderLegend() {
  $('legend').replaceChildren(...Object.values(CATEGORIES).map(({ color, name }) => {
    const s = document.createElement('span');
    s.style.setProperty('--c', color);
    s.textContent = name;
    return s;
  }), Object.assign(document.createElement('span'), { className: 'ghost', textContent: 'durchlässig (gedimmt)' }));
  $('legend').lastChild.style.setProperty('--c', CATEGORIES.letter.color);
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

function renderPanel() {
  const panel = $('panel');
  if (selected === null) { panel.hidden = true; resize(); return; }
  const i = selected, k = layout[i];
  const { desc, from, own } = resolve(layerIndex, i);
  const through = from !== layerIndex;
  panel.innerHTML = `
    <button id="close" aria-label="Schließen">×</button>
    <h2>${esc(desc.label) || '—'}</h2>
    <div class="title">${esc(desc.title)}</div>
    ${desc.detail ? `<div class="detail">${esc(desc.detail)}</div>` : ''}
    <dl>
      <dt>Code</dt><dd><code>${esc(own.code)}</code>${through ? ` durchlässig → von Layer ${from} (<code>${esc(desc.code)}</code>)` : ''}</dd>
      ${desc.hold ? `<dt>Halten</dt><dd>${esc(desc.hold)}</dd>` : ''}
      <dt>Layer</dt><dd>${layerIndex} · ${esc(LAYER_NAMES[layerIndex] ?? '')}</dd>
      <dt>Position</dt><dd>${k.x + k.w / 2 < 8.5 ? 'Linke' : 'Rechte'} Hälfte · ${rowLabel(i)} · Matrix [${k.matrix.join(', ')}]</dd>
      <dt>Index</dt><dd>${i} von ${layout.length}</dd>
    </dl>
    <h3>Auf allen Layern</h3>
    <ol>${keymap.layers.map((l) => {
      const r = resolve(l.index, i);
      const via = r.from !== l.index ? `<span class="via">durchlässig → von Layer ${r.from}</span>` : '';
      return `<li data-layer="${l.index}" class="${l.index === layerIndex ? 'current' : ''}">
        <span class="layer">${l.index} · ${esc(LAYER_NAMES[l.index] ?? '')}</span>
        <span class="${via ? 'dim' : ''}">${esc(r.desc.label) || '—'}</span>${via}</li>`;
    }).join('')}</ol>`;
  panel.hidden = false;
  resize();
  $('close').onclick = () => select(null);
  panel.querySelectorAll('li').forEach((li) => { li.onclick = () => setLayer(+li.dataset.layer); });
}

function setLayer(n) {
  if (!keymap || !layerByIndex(n)) return;
  layerIndex = n;
  renderTabs();
  paintCaps();
  renderPanel();
}

function select(i) {
  selected = i;
  paintHighlight();
  renderPanel();
}

// ---------- live reload from keymap.c ----------

async function load() {
  try {
    const res = await fetch(SOURCE_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} für ${SOURCE_URL}`);
    const text = await res.text();
    if (text === lastText) { $('banner').hidden = true; return; }
    const parsed = parseKeymap(text);
    if (!parsed.layers.length) throw new Error('Keine Layer in keymap.c gefunden.');
    const bad = parsed.layers.find((l) => l.keys.length !== layout.length);
    if (bad) throw new Error(`Layer ${bad.index} hat ${bad.keys.length} statt ${layout.length} Tasten.`);
    keymap = parsed;
    lastText = text;
    if (!layerByIndex(layerIndex)) layerIndex = keymap.layers[0].index;
    renderTabs();
    paintCaps();
    renderPanel();
    $('banner').hidden = true;
    $('status').textContent = `Aus keymap.c geladen: ${new Date().toLocaleTimeString('de-DE')}${LIVE ? ' · prüft alle 2 s' : ''}`;
  } catch (err) {
    showError(`keymap.c konnte nicht geladen werden: ${err.message}` + (keymap ? '\nAngezeigt wird der letzte gültige Stand.' : ''));
  }
}

// ---------- interaction ----------

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function pick(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(caps, true)[0]?.object.userData.index ?? null;
}

let downAt = null;
renderer.domElement.addEventListener('pointerdown', (ev) => { downAt = [ev.clientX, ev.clientY]; });
renderer.domElement.addEventListener('pointerup', (ev) => {
  // A drag (orbit) is not a click.
  if (downAt && Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) < 5 && keymap) select(pick(ev));
  downAt = null;
});
renderer.domElement.addEventListener('pointermove', (ev) => {
  if (ev.buttons) return;
  const i = pick(ev);
  if (i === hovered) return;
  hovered = i;
  renderer.domElement.style.cursor = i === null ? '' : 'pointer';
  paintHighlight();
});

addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (/^[0-9]$/.test(ev.key)) setLayer(+ev.key);
  if (ev.key === 'Escape') select(null);
});

renderLegend();
await load();
if (LIVE) setInterval(load, POLL_MS);
