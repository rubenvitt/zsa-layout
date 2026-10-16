import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { parseKeymap, describeKey, LAYER_NAMES } from './keymap.js';

// Lokal ein Symlink auf die Keymap-Quelle, im gebauten Site-Ordner eine Kopie (make site).
const SOURCE_URL = 'keymap.c';
// Live-Reload nur lokal; die gehostete Seite ist ein fester Stand.
const LIVE = ['localhost', '127.0.0.1'].includes(location.hostname);
const POLL_MS = 2000;

const THUMB_ANGLE = THREE.MathUtils.degToRad(27); // thumb clusters fan out down/inward like the real board
const HALF_GAP = 1.6;                              // extra space between the halves (key units)
const HALF_SPLAY = THREE.MathUtils.degToRad(9);   // halves rotated outward (top view)
const CASE_HEIGHT = 0.8;
const PALM_HEIGHT = 0.62;
const CAP_LIFT = 0.2;    // gap between plate and cap where the underglow shows
const CAP_HEIGHT = 0.42;
const CAP_TAPER = 0.84;  // top face size relative to the cap's footprint
const CAP_GAP = 0.1;

const CASE_COLOR = '#e8e8e6';
const CAP_COLOR = '#f4f3ef';
const RED_COLOR = '#c9776a';
const NONE_CAP_COLOR = '#8e9198';
const LEGEND_COLOR = '#7486a6';
const RED_LEGEND_COLOR = '#fbeee9';

// Category = color of the per-key underglow (and the small dot on the cap).
const CATEGORIES = {
  letter:     { color: '#7aaeff', name: 'Buchstaben' },
  number:     { color: '#9de7ff', name: 'Ziffern' },
  symbol:     { color: '#3d63ff', name: 'Sonderzeichen' },
  modifier:   { color: '#ffae42', name: 'Modifier' },
  layer:      { color: '#b38aff', name: 'Layer' },
  nav:        { color: '#64e04a', name: 'Navigation' },
  edit:       { color: '#ff765f', name: 'Bearbeiten' },
  function:   { color: '#8798ae', name: 'F-Tasten' },
  media:      { color: '#ff69c4', name: 'Medien' },
  mouse:      { color: '#ffdf5a', name: 'Maus' },
  system:     { color: '#ff3d3d', name: 'System' },
  shortcut:   { color: '#1fd6a8', name: 'Shortcuts' },
  none:       { color: '#2a2d34', name: 'unbelegt' },
};
const BG = '#070a13';

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
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
camera.position.set(0, 14, 20);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0.3);
controls.enableDamping = true;
controls.minDistance = 8;
controls.maxDistance = 45;
controls.maxPolarAngle = THREE.MathUtils.degToRad(80);
controls.update();

scene.add(new THREE.HemisphereLight('#dfe8ff', '#0b1020', 0.7));
const keyLight = new THREE.DirectionalLight('#fff6ec', 1.9);
keyLight.position.set(-8, 18, 12);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.radius = 8;
Object.assign(keyLight.shadow.camera, { left: -16, right: 16, top: 12, bottom: -12, near: 1, far: 50 });
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight('#8fb2ff', 1.6);
rimLight.position.set(6, 7, -14);
scene.add(rimLight);

function canvasTexture(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roundedRect(x0, y0, x1, y1, r) {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r);
  s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

// Extrude a 2D outline (x, z) into a slab standing on y = base with rounded edges.
function slab(shape, height, material, base = 0, bevel = 0.18) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height - 2 * bevel, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 5, curveSegments: 24 });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, base + height - bevel, 0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// Desk mat with a soft vignette.
const MAT_W = 27, MAT_D = 15.5;
const matTexture = canvasTexture(512, (g, n) => {
  const grad = g.createRadialGradient(n / 2, n / 2, n * 0.05, n / 2, n / 2, n * 0.72);
  grad.addColorStop(0, '#3a5283');
  grad.addColorStop(0.55, '#2a3a5c');
  grad.addColorStop(1, '#151d31');
  g.fillStyle = grad;
  g.fillRect(0, 0, n, n);
});
matTexture.repeat.set(1 / MAT_W, 1 / MAT_D); // extrude UVs are shape coordinates
matTexture.offset.set(0.5, 0.5);
scene.add(slab(roundedRect(-MAT_W / 2, -MAT_D / 2, MAT_W / 2, MAT_D / 2, 1.2), 0.1,
  new THREE.MeshStandardMaterial({ map: matTexture, roughness: 0.95 }), -0.1, 0.04));

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

// Rounded box whose top is narrower than its base, like a sculpted keycap.
function capGeometry(w, h) {
  const geo = new RoundedBoxGeometry(w, CAP_HEIGHT, h, 3, 0.1);
  const pos = geo.attributes.position;
  for (let v = 0; v < pos.count; v++) {
    const s = 1 - (1 - CAP_TAPER) * (pos.getY(v) / CAP_HEIGHT + 0.5);
    pos.setXYZ(v, pos.getX(v) * s, pos.getY(v), pos.getZ(v) * s);
  }
  return geo;
}

const glowTexture = canvasTexture(128, (g, n) => {
  const grad = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.62, 'rgba(255,255,255,0.95)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, n, n);
});

const caseMaterial = new THREE.MeshStandardMaterial({ color: CASE_COLOR, roughness: 0.7 });
const ORIGIN_Y = 4.6; // vertical center of keys + palm rests (key units)
const caps = [];
for (const left of [true, false]) {
  const originX = left ? 8 : 9;
  // Shapes are defined for the left half; the right half mirrors them (x -> 17 - x).
  const local = (x, y) => [(left ? x : 17 - x) - originX, y - ORIGIN_Y];
  const group = new THREE.Group();
  group.position.set((left ? -1 : 1) * (0.5 + HALF_GAP / 2), 0, 0);
  group.rotation.y = left ? -HALF_SPLAY : HALF_SPLAY;
  scene.add(group);

  const bodyCorners = [], thumbCorners = [];
  placements.forEach((p, i) => {
    if (p.left !== left) return;
    const lx = p.cx - originX, lz = p.cy - ORIGIN_Y;
    const c = Math.cos(p.angle), s = Math.sin(p.angle), pad = isThumb(layout[i]) ? 0.28 : 0.38;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const dx = sx * (p.w / 2 + pad), dy = sy * (p.h / 2 + pad);
      (isThumb(layout[i]) ? thumbCorners : bodyCorners).push([lx + dx * c - dy * s, lz + dx * s + dy * c]);
    }

    const red = isRed(layout[i]);
    const cap = new THREE.Mesh(capGeometry(p.w, p.h),
      new THREE.MeshStandardMaterial({ color: red ? RED_COLOR : CAP_COLOR, roughness: 0.48 }));
    cap.position.set(lx, 0, lz);
    cap.rotation.y = -p.angle;
    cap.castShadow = cap.receiveShadow = true;
    cap.userData = { index: i, red };
    const top = new THREE.Mesh(new THREE.PlaneGeometry(p.w * CAP_TAPER - 0.1, p.h * CAP_TAPER - 0.1),
      new THREE.MeshBasicMaterial({ transparent: true }));
    top.rotation.x = -Math.PI / 2;
    top.position.y = CAP_HEIGHT / 2 + 0.002;
    top.userData.index = i;
    cap.add(top);

    // Underglow on the plate, not a child of the cap so it neither lifts nor gets picked.
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(p.w + 0.8, p.h + 0.8),
      new THREE.MeshBasicMaterial({ map: glowTexture, transparent: true, depthWrite: false, toneMapped: false }));
    glow.rotation.set(-Math.PI / 2, 0, -p.angle);
    glow.position.set(lx, CASE_HEIGHT + 0.004, lz);
    cap.userData.glow = glow;
    group.add(cap, glow);
    caps[i] = cap;
  });

  const toShape = (pts) => new THREE.Shape(hull(pts).map(([x, y]) => new THREE.Vector2(x, y)));
  group.add(slab(toShape(bodyCorners), CASE_HEIGHT, caseMaterial));
  group.add(slab(toShape(thumbCorners), CASE_HEIGHT, caseMaterial));
  // Palm rest: wide rounded paddle below the rows, outside the thumb module.
  const [px0, py0] = local(-0.35, 4.9), [px1, py1] = local(5.0, 9.4);
  group.add(slab(roundedRect(Math.min(px0, px1), py0, Math.max(px0, px1), py1, 1.5), PALM_HEIGHT, caseMaterial));
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

function legendTexture(desc, w, h, ghost, color, dotColor) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * PX);
  canvas.height = Math.round(h * PX);
  const g = canvas.getContext('2d');
  g.globalAlpha = ghost ? 0.35 : 1;
  g.fillStyle = dotColor;
  g.beginPath();
  g.arc(PX * 0.13, PX * 0.13, PX * 0.06, 0, 2 * Math.PI);
  g.fill();
  g.fillStyle = color;
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
    const none = desc.category === 'none';
    const glowColor = (CATEGORIES[desc.category] ?? CATEGORIES.letter).color;
    cap.material.color.set(none ? NONE_CAP_COLOR : cap.userData.red ? RED_COLOR : CAP_COLOR);
    // Faint category tint (light bleeding through), so the info survives where caps hide the glow from view.
    if (!ghost && !none && !cap.userData.red) cap.material.color.lerp(new THREE.Color(glowColor), 0.24);
    cap.userData.glow.material.color.set(glowColor);
    cap.userData.glow.visible = !ghost && !none;
    const top = cap.children[0];
    top.material.map?.dispose();
    top.material.map = none ? null : legendTexture(desc, top.geometry.parameters.width, top.geometry.parameters.height,
      ghost, cap.userData.red ? RED_LEGEND_COLOR : LEGEND_COLOR, glowColor);
    top.visible = !!top.material.map;
    top.material.needsUpdate = true;
  });
  paintHighlight();
}

// Only selection/hover styling, without re-rendering legends.
function paintHighlight() {
  caps.forEach((cap, i) => {
    const glow = cap.userData.glow;
    cap.material.emissive.copy(glow.material.color);
    cap.material.emissiveIntensity = i === selected ? 0.45 : 0;
    cap.position.y = CASE_HEIGHT + CAP_LIFT + CAP_HEIGHT / 2 + (i === selected ? 0.14 : i === hovered ? 0.06 : 0);
    glow.scale.setScalar(i === selected ? 1.6 : 1);
    glow.material.opacity = i === selected ? 1 : 0.9;
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
  }), Object.assign(document.createElement('span'), { className: 'ghost', textContent: 'durchlässig (ohne Glow)' }));
  $('legend').lastChild.style.setProperty('--c', CASE_COLOR);
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
