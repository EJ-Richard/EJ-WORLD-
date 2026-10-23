// taiwan-oldtown-20261023b — 十六座台灣古城拼成的大愛學漢醫島
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { buildIsland, TOWNS, LAND, pointInPoly } from "./layout.js";

const ISLAND_REV = "taiwan-oldtown-20261023b";
void ISLAND_REV;

const DATA = window.DATA;
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const stage = $("#stage");
const qInput = $("#q");
const panel = $("#panel");
const panelBody = $("#panel-body");
const listEl = $("#list");
const listBody = $("#list-body");
const timebar = $("#timebar");
const yearInput = $("#year");
const yearOut = $("#year-out");
const yearNote = $("#year-note");
const tourEl = $("#tour");
const loadingEl = $("#loading");
const live = $("#live");
const btnHome = $("#btn-home");
const btnList = $("#btn-list");
const btnTime = $("#btn-time");
const btnPause = $("#btn-pause");
const btnBird = $("#btn-bird");
const btnHelp = $("#btn-help");

const TOPICS = Object.fromEntries(DATA.topics.map((t) => [t.id, t]));
const DOCS = Object.fromEntries(DATA.docs.map((d) => [d.name, d]));
const byTopic = Object.fromEntries(DATA.topics.map((t) => [t.id, []]));
const byYear = { 2022: {}, 2023: {}, 2024: {}, 2025: {}, 2026: {} };
const yearVideoCount = { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 };
for (const v of DATA.v) {
  for (const id of v.tp || []) if (byTopic[id]) byTopic[id].push(v);
  const y = Number(String(v.date || "").slice(0, 4));
  if (byYear[y]) {
    yearVideoCount[y] += 1;
    for (const id of v.tp || []) byYear[y][id] = (byYear[y][id] || 0) + 1;
  }
}
for (const id of Object.keys(byTopic)) byTopic[id].sort((a, b) => b.date.localeCompare(a.date));
const counts = Object.fromEntries(DATA.topics.map((t) => [t.id, byTopic[t.id].length]));
const maxCount = Math.max(1, ...Object.values(counts));
const countSum = Object.values(counts).reduce((s, n) => s + n, 0) || 1;

const SHORT = {
  basic: "基礎", diag: "診斷", herb: "中藥", formula: "藥方", acu: "針灸", tuina: "推拿",
  food: "食療", season: "節氣", internal: "內科", gyn: "婦科", ped: "兒科", skin: "皮膚",
  eent: "五官", mind: "睡眠", onco: "癌症", other: "綜合",
};
for (const t of DATA.topics) if (SHORT[t.id]) t.ic = SHORT[t.id];

const labelOf = (id) => `${SHORT[id] || TOPICS[id].ic}・${TOWNS[id].name}`;

const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const narrow = () => window.innerWidth < 820 || matchMedia("(pointer: coarse)").matches;
let selected = null;
let birdOn = false;
let paused = false;
let timeOn = false;
let searchOn = false;
let hot = new Set();
let panelMode = null;
let flight = null;
let listItems = [];
let listShown = 0;
const districts = new Map();
const links = [];
const pickables = [];
let sim = 0;
let layout = null;
let peopleMesh = null;
let peopleBudget = 0;
let crowdLevel = 1;
let fpsMix = 60;
let slowFrames = 0;
const lanternTime = { value: 0 };
const peopleTime = { value: 0 };

$("#brand-sub").textContent = `${DATA.topics.length} 座古城・${DATA.v.length} 支影片`;

function boot() {
  layout = buildIsland(counts);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc5e6f2);
  scene.fog = new THREE.Fog(0xc5e6f2, 48, 150);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.08, 420);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setClearColor(0xc5e6f2, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.insertBefore(renderer.domElement, $("#labels"));
  const labelRenderer = new CSS2DRenderer({ element: $("#labels") });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced.matches;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.72;
  controls.zoomSpeed = 0.85;
  controls.minDistance = 2.8;
  controls.maxDistance = 96;
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = 1.28;
  controls.maxTargetRadius = 22;

  scene.add(new THREE.HemisphereLight(0xfff6e4, 0x6e8b5e, 0.92));
  scene.add(new THREE.AmbientLight(0xfff3e4, 0.28));
  const sun = new THREE.DirectionalLight(0xfff4e2, 1.28);
  sun.position.set(-18, 26, -12);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xd5efe8, 0.34);
  fill.position.set(12, 10, 8);
  scene.add(fill);

  const lamberts = new Map();
  function lambert(color, opts) {
    const key = color + JSON.stringify(opts || {});
    if (!lamberts.has(key)) lamberts.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
    return lamberts.get(key);
  }

  buildSea(scene);
  buildLand(scene, lambert);
  buildMountains(scene, lambert);
  buildTowns(scene, lambert);
  buildLinks(scene);
  buildCrowd(scene);

  const home = framedPose(camera, "home");
  camera.position.copy(home.p);
  controls.target.copy(home.t);
  applyLimits(controls);
  controls.update();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;

  function resize() {
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    camera.aspect = w / Math.max(1, h);
    const portrait = w / h < 0.85;
    if (!birdOn) camera.fov = portrait ? 52 : 34;
    camera.updateProjectionMatrix();
    const cap = narrow() ? 1.35 : 1.6;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    const dist = camera.position.distanceTo(controls.target);
    document.body.classList.toggle("show-names", w >= 760 || dist < 18);
  }
  resize();
  window.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);

  renderer.domElement.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    down = null;
    if (dx * dx + dy * dy > 64) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    const topic = topicOf(hit);
    if (topic) openTopic(topic);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    renderer.domElement.style.cursor = topicOf(hit) ? "pointer" : "";
  });

  buildList();
  wireUi(camera, controls);

  let last = performance.now();
  let started = false;
  let warm = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    try {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      warm += dt;
      stepFlight(now, camera, controls);
      const moving = !paused && !reduced.matches;
      if (moving) sim += dt;
      if (scene.userData.water) scene.userData.water.value = sim;
      lanternTime.value = sim;
      peopleTime.value = sim;
      stepRings();
      const dist = camera.position.distanceTo(controls.target);
      document.body.classList.toggle("show-names", window.innerWidth >= 760 || dist < 18);
      if (!flight) controls.update();
      adaptCrowd(dt, warm, renderer);
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      declutterLabels(camera, controls);
      if (!started) {
        started = true;
        loadingEl.classList.add("hide");
        if (!localStorage.getItem("daai-island-tour-v2")) openTour(camera, controls);
      }
    } catch (err) {
      console.error(err);
      if (!started) fail("這台裝置無法顯示立體小島，請改用清單。");
      started = true;
    }
  }
  requestAnimationFrame(frame);
}

function topicOf(hit) {
  if (!hit) return null;
  if (hit.object.userData.topic) return hit.object.userData.topic;
  const list = hit.object.userData.topics;
  if (list && hit.instanceId != null) return list[hit.instanceId] || null;
  return null;
}

function framedPose(camera, kind) {
  const b = layout.bbox;
  const cx = (b.minx + b.maxx) / 2;
  const cz = (b.miny + b.maxy) / 2;
  const hw = (b.maxx - b.minx) / 2 + 2.4;
  const hh = (b.maxy - b.miny) / 2 + 3.1;
  const vf = Math.tan((camera.fov * Math.PI) / 360);
  const hf = vf * Math.max(0.35, camera.aspect || 1);
  const fit = Math.max(hh / vf, hw / hf);
  // Aim a little north of center so the north tip sits below the toolbar.
  const north = hh * 0.16;
  if (kind === "bird") {
    return {
      p: new THREE.Vector3(cx, fit * 1.05, cz - hh * 0.08),
      t: new THREE.Vector3(cx, 0, cz + north),
    };
  }
  const dist = fit * 1.02;
  return {
    p: new THREE.Vector3(cx, dist * 0.58, cz - dist * 0.46),
    t: new THREE.Vector3(cx, 0.08, cz + north),
  };
}
function homePose(camera) { return framedPose(camera, "home"); }
function birdPose(camera) { return framedPose(camera, "bird"); }

function applyLimits(controls) {
  const portrait = window.innerWidth < 760;
  if (birdOn) {
    controls.minPolarAngle = 0.02;
    controls.maxPolarAngle = 0.72;
    controls.minDistance = 12;
    controls.maxDistance = portrait ? 150 : 80;
  } else {
    controls.minPolarAngle = 0.18;
    controls.maxPolarAngle = 1.28;
    controls.minDistance = portrait ? 3.2 : 2.6;
    controls.maxDistance = portrait ? 150 : 90;
  }
}
function fly(camera, controls, p, t, ms) {
  const dur = reduced.matches ? 1 : (ms ?? 880);
  flight = { fromP: camera.position.clone(), fromT: controls.target.clone(), toP: p.clone(), toT: t.clone(), t0: performance.now(), dur };
  controls.enabled = false;
}
function stepFlight(now, camera, controls) {
  if (!flight) return;
  const k = Math.min(1, (now - flight.t0) / flight.dur);
  const s = k * k * (3 - 2 * k);
  camera.position.lerpVectors(flight.fromP, flight.toP, s);
  controls.target.lerpVectors(flight.fromT, flight.toT, s);
  controls.update();
  if (k >= 1) { flight = null; controls.enabled = true; }
}
function viewFor(id) {
  const d = districts.get(id);
  const portrait = window.innerWidth < 760;
  const dist = portrait ? 5.1 : 4.15;
  const height = d.kind === "hill" ? 2.5 : (portrait ? 2.15 : 1.72);
  const dir = d.street;
  const perp = [-dir[1], dir[0]];
  const fx = dir[0] * 0.82 + perp[0] * 0.42;
  const fz = dir[1] * 0.82 + perp[1] * 0.42;
  const fl = Math.hypot(fx, fz) || 1;
  const y0 = d.kind === "hill" ? 0.7 : 0.32;
  return {
    p: new THREE.Vector3(d.x + (fx / fl) * dist, height, d.z + (fz / fl) * dist),
    t: new THREE.Vector3(d.x, y0, d.z),
  };
}

function declutterLabels(camera, controls) {
  const w = stage.clientWidth || window.innerWidth;
  const h = stage.clientHeight || window.innerHeight;
  const narrowUi = window.innerWidth < 760;
  const top = narrowUi ? 158 : 110;
  const bot = 42;
  const dist = camera.position.distanceTo(controls.target);
  const close = dist < 9;
  const items = [];
  for (const d of districts.values()) {
    const show = !close || d.id === selected || (searchOn && hot.has(d.id));
    d.pin.style.visibility = show ? "visible" : "hidden";
    if (!show) { d.pin.style.translate = "0px 0px"; continue; }
    const v = new THREE.Vector3(d.x, 1.2, d.z).project(camera);
    if (v.z < -1 || v.z > 1) { d.pin.style.visibility = "hidden"; continue; }
    const ax = (v.x * 0.5 + 0.5) * w;
    const ay = (-v.y * 0.5 + 0.5) * h;
    items.push({
      d, ax, ay, x: ax, y: ay,
      hw: Math.max(28, d.pin.offsetWidth / 2),
      hh: Math.max(11, d.pin.offsetHeight / 2),
    });
  }
  const clamp = (it) => {
    it.x = Math.max(it.hw + 4, Math.min(w - it.hw - 4, it.x));
    it.y = Math.max(top + it.hh, Math.min(h - bot - it.hh, it.y));
  };
  for (let n = 0; n < 14; n++) {
    for (const it of items) clamp(it);
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        const gapX = a.hw + b.hw + 10;
        const gapY = a.hh + b.hh + 8;
        if (Math.abs(dx) >= gapX || Math.abs(dy) >= gapY) continue;
        const px = (gapX - Math.abs(dx)) * 0.5;
        const py = (gapY - Math.abs(dy)) * 0.5;
        if (px < py) {
          const s = dx === 0 ? (i % 2 ? 1 : -1) : Math.sign(dx);
          a.x -= s * px; b.x += s * px;
        } else {
          const s = dy === 0 ? 1 : Math.sign(dy);
          a.y -= s * py; b.y += s * py;
        }
      }
    }
    if (n < 8) {
      for (const it of items) {
        it.x += (it.ax - it.x) * 0.14;
        it.y += (it.ay - it.y) * 0.06;
      }
    }
  }
  for (const it of items) clamp(it);
  for (const it of items) {
    it.d.pin.style.translate = `${Math.round(it.x - it.ax)}px ${Math.round(it.y - it.ay)}px`;
  }
}

function shapeOf(poly) {
  const s = new THREE.Shape();
  s.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) s.lineTo(poly[i][0], poly[i][1]);
  return s;
}
function flatGeo(poly) {
  const g = new THREE.ShapeGeometry(shapeOf(poly));
  g.rotateX(-Math.PI / 2);
  g.scale(1, 1, -1);
  g.computeVertexNormals();
  return g;
}
function layFlat(geo) {
  geo.rotateX(-Math.PI / 2);
  geo.scale(1, 1, -1);
  geo.computeBoundingBox();
  geo.translate(0, -geo.boundingBox.max.y, 0);
  geo.computeVertexNormals();
  return geo;
}

function buildSea(scene) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uShallow: { value: new THREE.Color(0x7ec4c4) },
      uDeep: { value: new THREE.Color(0x1e6d86) },
      uSky: { value: new THREE.Color(0xc5e6f2) },
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec3 pos = position;
        float w = sin(pos.x * 0.18 + uTime * 0.6) + cos(pos.y * 0.15 + uTime * 0.45);
        pos.z += w * 0.08;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        vUv = uv;
      }
    `,
    fragmentShader: `
      uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uSky;
      varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float d = length(p);
        vec3 col = mix(uShallow, uDeep, smoothstep(0.05, 0.55, d));
        col = mix(col, uSky, smoothstep(0.45, 1.05, d));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(280, 280, 36, 36), mat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.36;
  scene.add(sea);
  scene.userData.water = mat.uniforms.uTime;

  const shelf = new THREE.Mesh(flatGeo(scaleAbout(layout.taiwan, 1.035)), new THREE.MeshBasicMaterial({
    color: 0x8fd0cf, transparent: true, opacity: 0.55, depthWrite: false,
  }));
  shelf.position.y = -0.3;
  scene.add(shelf);
}

function scaleAbout(poly, s) {
  let cx = 0, cy = 0;
  for (const p of poly) { cx += p[0]; cy += p[1]; }
  cx /= poly.length; cy /= poly.length;
  return poly.map((p) => [cx + (p[0] - cx) * s, cy + (p[1] - cy) * s]);
}

function buildLand(scene, lambert) {
  const body = new THREE.Mesh(
    layFlat(new THREE.ExtrudeGeometry(shapeOf(layout.taiwan), { depth: 0.46, bevelEnabled: false, curveSegments: 1 })),
    lambert(0xe7d2a6)
  );
  body.material.side = THREE.DoubleSide;
  scene.add(body);

  const penghu = layout.cells.other.poly;
  const islet = new THREE.Mesh(
    layFlat(new THREE.ExtrudeGeometry(shapeOf(penghu), { depth: 0.28, bevelEnabled: false, curveSegments: 1 })),
    lambert(0xecdcb8)
  );
  islet.material.side = THREE.DoubleSide;
  scene.add(islet);

  for (const id of Object.keys(TOWNS)) {
    const cell = layout.cells[id];
    const root = new THREE.Group();
    scene.add(root);
    const ground = new THREE.Mesh(flatGeo(cell.poly), lambert(LAND[id] || 0xd2c09a));
    ground.position.y = 0.025;
    ground.material.side = THREE.DoubleSide;
    root.add(ground);

    const shadeMat = new THREE.MeshBasicMaterial({ color: 0x1c2420, transparent: true, opacity: 0, depthWrite: false, depthTest: false });
    const shade = new THREE.Mesh(flatGeo(cell.poly), shadeMat);
    shade.position.y = 0.2;
    shade.renderOrder = 4;
    root.add(shade);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf0c14e, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ribbonGeo(cell.poly, 0.045, 0.06), ringMat);
    ring.renderOrder = 3;
    root.add(ring);

    const n = counts[id] || 0;
    const lab = document.createElement("div");
    lab.className = "lab";
    const title = labelOf(id);
    lab.innerHTML = `<button type="button" class="pin" data-id="${id}" aria-label="${esc(title)}，${n} 支影片"><span class="seal">${esc(SHORT[id])}</span><span class="nm full">・${esc(TOWNS[id].name)}</span><span class="nm short">${esc(SHORT[id])}</span></button>`;
    lab.querySelector("button").addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      openTopic(id);
    });
    const label = new CSS2DObject(lab);
    label.center.set(0.5, 0);
    const lift = TOWNS[id].kind === "hill" ? 1.35 : 0.7;
    label.position.set(cell.anchor[0], lift, cell.anchor[1]);
    root.add(label);

    ground.material.polygonOffset = true;
    ground.material.polygonOffsetFactor = 1;
    ground.material.polygonOffsetUnits = 1;
    ground.userData.topic = id;
    pickables.push(ground);

    const edge = new THREE.Mesh(
      ribbonGeo(cell.poly, 0.03, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x3f3428, transparent: true, opacity: 0.78, depthWrite: false })
    );
    edge.renderOrder = 2;
    root.add(edge);

    if (id === "internal") {
      const coast = new THREE.Mesh(ribbonGeo(layout.taiwan, 0.055, 0.045), new THREE.MeshBasicMaterial({ color: 0x6d7c58 }));
      coast.renderOrder = 2;
      scene.add(coast);
      const islet = new THREE.Mesh(ribbonGeo(layout.cells.other.poly, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0x8a7a58 }));
      scene.add(islet);
    }

    const street = unit2(TOWNS[id].street[0], TOWNS[id].street[1]);
    districts.set(id, {
      id, x: cell.anchor[0], z: cell.anchor[1], area: cell.area, kind: TOWNS[id].kind, street,
      root, ground, shade, ring, pin: lab.querySelector("button"),
      base: ground.material.color.clone(), glow: 0, ringColor: 0xf0c14e, phase: districts.size,
    });
  }

  // A couple of rocks beside Penghu, so the offshore group reads as islets.
  const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.5, 0), lambert(0xd9cbb0), 5);
  const dummy = new THREE.Object3D();
  const pc = layout.cells.other.anchor;
  [[0.55, 0.35, 0.22], [-0.62, 0.15, 0.16], [0.2, -0.58, 0.14], [0.85, -0.1, 0.1], [-0.3, 0.62, 0.12]].forEach((r, i) => {
    dummy.position.set(pc[0] + r[0], -0.08, pc[1] + r[1]);
    dummy.scale.setScalar(r[2] * 2);
    dummy.rotation.set(i, i * 0.6, 0);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  });
  scene.add(rocks);
}

function ribbonGeo(poly, half, y) {
  const pos = [];
  const idx = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const dx = q[0] - p[0], dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * half, ny = (dx / len) * half;
    const b = pos.length / 3;
    pos.push(p[0] - nx, y, p[1] - ny, p[0] + nx, y, p[1] + ny, q[0] - nx, y, q[1] - ny, q[0] + nx, y, q[1] + ny);
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

function buildMountains(scene, lambert) {
  const ridge = layout.ridge;
  const pos = [];
  const col = [];
  const cLo = new THREE.Color(0x6d8a52);
  const cHi = new THREE.Color(0x8a8172);
  function push(a, b, c, h) {
    pos.push(...a, ...b, ...c);
    const color = cLo.clone().lerp(cHi, h);
    col.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);
  }
  const cross = ridge.map((p, i) => {
    const q = ridge[Math.min(ridge.length - 1, i + 1)];
    const dx = q.x - p.x, dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const w = p.w * 0.55;
    return {
      l: [p.x - nx * w, 0.04, p.y - ny * w],
      r: [p.x + nx * w, 0.04, p.y + ny * w],
      t: [p.x, p.h, p.y],
      h: p.h / 1.9,
    };
  });
  for (let i = 0; i < cross.length - 1; i++) {
    const a = cross[i], b = cross[i + 1];
    push(a.l, b.l, a.t, a.h);
    push(b.l, b.t, a.t, b.h);
    push(a.r, a.t, b.r, a.h);
    push(a.t, b.t, b.r, b.h);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
  scene.add(mesh);

  const peak = ridge.reduce((m, p) => (p.h > m.h ? p : m), ridge[0]);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.7, 6), lambert(0x9a9184));
  cone.position.set(peak.x, peak.h + 0.28, peak.y);
  scene.add(cone);

  const trees = 84;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 5), lambert(0x6b4632), trees);
  const leaf = new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 1, 6), lambert(0xffffff), trees);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < trees; i++) {
    const t = i / (trees - 1);
    const f = t * (ridge.length - 1);
    const a = ridge[Math.floor(f)], b = ridge[Math.min(ridge.length - 1, Math.floor(f) + 1)];
    const u = f - Math.floor(f);
    const jitter = ((i * 17) % 7) - 3;
    const x = a.x + (b.x - a.x) * u + jitter * 0.08;
    const z = a.y + (b.y - a.y) * u + ((i % 5) - 2) * 0.07;
    const y = a.h + (b.h - a.h) * u;
    const s = 0.22 + (i % 4) * 0.05;
    dummy.position.set(x, y + s * 0.35, z);
    dummy.scale.set(0.06, s * 0.7, 0.06);
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, y + s * 0.95, z);
    dummy.scale.set(s * 0.7, s * 0.85, s * 0.7);
    dummy.updateMatrix();
    leaf.setMatrixAt(i, dummy.matrix);
    leaf.setColorAt(i, new THREE.Color(i % 6 === 0 ? 0x3f6a3c : 0x2f6a40));
  }
  leaf.instanceColor.needsUpdate = true;
  trunk.frustumCulled = false;
  leaf.frustumCulled = false;
  scene.add(trunk, leaf);
}

const SIGN_DEFS = [
  ["藥舖", "#1e4630", "#f6ecd2"],
  ["青草", "#215c38", "#f3ffe4"],
  ["參行", "#5c3a1e", "#ffe9c2"],
  ["染坊", "#243e78", "#e7eeff"],
  ["藍布", "#1a4c88", "#e7f2ff"],
  ["粄條", "#6b3b22", "#fff1d8"],
  ["茶行", "#2c2416", "#f6e7c0"],
  ["餅舖", "#7a2e24", "#fff6de"],
  ["米店", "#3e3428", "#f8edd2"],
  ["雜貨", "#4a2c28", "#fff1e4"],
];
const SIGN_FOR = {
  herb: [0, 1, 2, 0, 1],
  indigo: [3, 4, 3, 9],
  hakka: [5, 6, 8, 5],
  tamsui: [6, 8, 9],
  temple: [6, 7, 9],
  default: [6, 7, 8, 9, 6],
};

function unit2(x, y) {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shopBudget(id) {
  const n = counts[id] || 0;
  const area = layout.cells[id].area || 0.4;
  const want = Math.round(3 + 32 * Math.sqrt(n / maxCount));
  const cap = Math.max(3, Math.floor(area / 0.15));
  return Math.max(3, Math.min(42, want, cap));
}

function buildTowns(scene, lambert) {
  const houses = [];
  const roads = [];
  const lanterns = [];
  const cloths = [];
  const herbs = [];
  const steps = [];
  const fields = [];
  const segments = [];

  for (const id of Object.keys(TOWNS)) {
    const town = TOWNS[id];
    const cell = layout.cells[id];
    const rand = rng(hash(id) + 17);
    const plan = planTown(id, town, cell, rand);
    for (const h of plan.houses) { h.topic = id; houses.push(h); }
    for (const r of plan.roads) roads.push(r);
    for (const L of plan.lanterns) lanterns.push(L);
    for (const c of plan.cloths) cloths.push(c);
    for (const h of plan.herbs) herbs.push(h);
    for (const s of plan.steps) steps.push(s);
    for (const f of plan.fields) fields.push(f);
    for (const s of plan.segments) segments.push({ ...s, id });
    if (plan.landmark) {
      const mesh = plan.landmark;
      mesh.traverse?.((o) => { if (o.isMesh) { o.userData.topic = id; pickables.push(o); } });
      if (mesh.isMesh) { mesh.userData.topic = id; pickables.push(mesh); scene.add(mesh); }
      else scene.add(mesh);
    }
  }

  const dummy = new THREE.Object3D();
  function fill(mesh, list, colorOf, yOf) {
    list.forEach((h, i) => {
      dummy.position.set(h.x, yOf ? yOf(h) : h.y, h.z);
      dummy.rotation.set(0, h.rot, 0);
      dummy.scale.set(h.sx, h.sy, h.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (colorOf) mesh.setColorAt(i, new THREE.Color(colorOf(h)));
    });
    if (colorOf) mesh.instanceColor.needsUpdate = true;
    mesh.userData.topics = list.map((h) => h.topic);
    pickables.push(mesh);
  }

  if (houses.length) {
    const wall = new THREE.InstancedMesh(houseWall(), lambert(0xffffff), houses.length);
    const roof = new THREE.InstancedMesh(houseRoof(), lambert(0xffffff), houses.length);
    const arcade = new THREE.InstancedMesh(houseArcade(), lambert(0xffffff), houses.length);
    const door = new THREE.InstancedMesh(houseDoor(), lambert(0x2a211c), houses.length);
    fill(wall, houses, (h) => h.wall);
    fill(roof, houses, (h) => h.roof);
    fill(arcade, houses, () => 0x8a5a32);
    fill(door, houses, null);
    wall.instanceMatrix.needsUpdate = true;
    scene.add(wall, roof, arcade, door);

    for (let s = 0; s < SIGN_DEFS.length; s++) {
      const subset = houses.filter((h) => h.sign === s);
      if (!subset.length) continue;
      const mat = new THREE.MeshBasicMaterial({ map: signTexture(SIGN_DEFS[s]), toneMapped: false });
      const mesh = new THREE.InstancedMesh(houseSign(), mat, subset.length);
      subset.forEach((h, i) => {
        dummy.position.set(h.x, h.y, h.z);
        dummy.rotation.set(0, h.rot, 0);
        dummy.scale.set(h.sx, h.sy, h.sz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.userData.topics = subset.map((h) => h.topic);
      pickables.push(mesh);
      scene.add(mesh);
    }
  }

  if (roads.length) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), lambert(0xc4b496), roads.length);
    roads.forEach((r, i) => {
      dummy.position.set(r.x, 0.03, r.z);
      dummy.rotation.set(0, r.rot, 0);
      dummy.scale.set(r.sx, 0.025, r.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    scene.add(mesh);
  }
  if (steps.length) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), lambert(0xb7a48a), steps.length);
    steps.forEach((s, i) => {
      dummy.position.set(s.x, s.y, s.z);
      dummy.rotation.set(0, s.rot, 0);
      dummy.scale.set(s.sx, s.sy, s.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    scene.add(mesh);
  }
  if (lanterns.length) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = lanternTime;
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace("#include <begin_vertex>", `#include <begin_vertex>
        transformed.y += sin(uTime * 2.1 + instanceMatrix[3].x * 2.7 + instanceMatrix[3].z) * 0.03;`);
    };
    mat.customProgramCacheKey = () => "lantern-bob";
    const mesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.5, 0), mat, lanterns.length);
    lanterns.forEach((L, i) => {
      dummy.position.set(L.x, L.y, L.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(L.s, L.s * 1.25, L.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(L.gold ? 0xffc14a : 0xff4a32));
    });
    mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    scene.add(mesh);
  }
  if (cloths.length) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), lambert(0xffffff), cloths.length);
    cloths.forEach((c, i) => {
      dummy.position.set(c.x, c.y, c.z);
      dummy.rotation.set(0, c.rot, 0);
      dummy.scale.set(c.sx, c.sy, 0.02);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(i % 2 ? 0x2c4f92 : 0x3a62b0));
    });
    mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
  }
  if (herbs.length) {
    const mesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 1, 5), lambert(0xffffff), herbs.length);
    herbs.forEach((h, i) => {
      dummy.position.set(h.x, h.y, h.z);
      dummy.rotation.set(0, i, Math.PI);
      dummy.scale.set(h.s, h.s * 1.4, h.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(i % 2 ? 0x6a8f3a : 0x3f6b32));
    });
    mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
  }
  if (fields.length) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), lambert(0xffffff), fields.length);
    fields.forEach((f, i) => {
      dummy.position.set(f.x, 0.03, f.z);
      dummy.rotation.set(0, f.rot, 0);
      dummy.scale.set(f.sx, 0.02, f.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(i % 3 === 0 ? 0xd2c46a : 0x8fba62));
    });
    mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
  }

  scene.userData.segments = segments;
}

function planTown(id, town, cell, rand) {
  const anchor = cell.anchor;
  const poly = cell.poly;
  const dir = unit2(town.street[0], town.street[1]);
  const perp = [-dir[1], dir[0]];
  const shops = shopBudget(id);
  const span = Math.sqrt(Math.max(0.35, cell.area));
  const spacing = 0.54;
  const sideOff = 0.46;
  const houses = [];
  const roads = [];
  const lanterns = [];
  const cloths = [];
  const herbs = [];
  const steps = [];
  const fields = [];
  const segments = [];
  const kind = town.kind;

  const placeHouse = (x, z, y, rot, scaleY, opts = {}) => {
    if (!pointInPoly(poly, x, z) && kind !== "penghu") return false;
    const r = rand();
    const plaster = r > 0.62;
    let wall = plaster ? 0xf4efe4 : 0xa34738;
    if (kind === "wood") wall = plaster ? 0xe6d3b0 : 0x8d5a34;
    if (kind === "hakka") wall = plaster ? 0xe7d7a4 : 0xc4a56a;
    if (kind === "penghu") wall = 0xe5dcc8;
    if (kind === "hill") wall = plaster ? 0xd7c4a4 : 0x6e4632;
    const roofs = [0x8e342c, 0x7a3028, 0xa34532, 0x6e2e32];
    const signs = SIGN_FOR[kind] || SIGN_FOR.default;
    houses.push({
      x, y, z, rot,
      sx: 1,
      sy: (kind === "penghu" ? 0.78 : 1) * Math.min(1, scaleY),
      sz: 1,
      wall,
      roof: roofs[Math.floor(rand() * roofs.length)],
      sign: rand() > 0.28 ? signs[Math.floor(rand() * signs.length)] : -1,
      topic: id,
    });
    const front = rot;
    const fx = Math.sin(front), fz = Math.cos(front);
    const rx = Math.cos(front), rz = -Math.sin(front);
    const hy = y + 0.42 * Math.min(1, scaleY);
    lanterns.push({ x: x + fx * 0.22 + rx * 0.14, y: hy, z: z + fz * 0.22 + rz * 0.14, s: 0.045, gold: rand() > 0.82, topic: id });
    if (rand() > 0.45) lanterns.push({ x: x + fx * 0.22 - rx * 0.14, y: hy, z: z + fz * 0.22 - rz * 0.14, s: 0.04, gold: false, topic: id });
    if (kind === "indigo" && rand() > 0.4) {
      cloths.push({ x: x + fx * 0.2, y: y + 0.28 * scaleY, z: z + fz * 0.2, rot: front, sx: 0.16, sy: 0.2, topic: id });
    }
    if (kind === "herb" && rand() > 0.35) {
      herbs.push({ x: x + fx * 0.18 + rx * 0.05, y: y + 0.3 * scaleY, z: z + fz * 0.18 + rz * 0.05, s: 0.06, topic: id });
    }
    return true;
  };

  const halfW = spacing * 0.42;
  const footprintOk = (x, z) => {
    if (kind === "penghu") return true;
    return pointInPoly(poly, x, z)
      && pointInPoly(poly, x + dir[0] * halfW, z + dir[1] * halfW)
      && pointInPoly(poly, x - dir[0] * halfW, z - dir[1] * halfW);
  };
  let streetEnd = [anchor[0], anchor[1]];

  if (kind === "hill") {
    const terraces = Math.min(4, Math.max(3, Math.round(shops / 5)));
    const per = Math.min(4, Math.max(2, Math.round(shops / terraces)));
    for (let row = 0; row < terraces; row++) {
      const lift = 0.06 + row * 0.22;
      const along = (row - (terraces - 1) / 2) * 0.62;
      const cx = anchor[0] + dir[0] * along;
      const cz = anchor[1] + dir[1] * along;
      const placed = [];
      for (let i = 0; i < per; i++) {
        const t = (i - (per - 1) / 2) * spacing;
        const x = cx + perp[0] * t;
        const z = cz + perp[1] * t;
        if (!footprintOk(x, z)) continue;
        const face = Math.atan2(-dir[0], -dir[1]);
        if (placeHouse(x, z, lift, face, 1)) placed.push(t);
      }
      if (placed.length) {
        steps.push({
          x: cx, y: lift - 0.04, z: cz, rot: Math.atan2(dir[0], dir[1]),
          sx: (placed.length - 1) * spacing + 0.5, sy: 0.06, sz: 0.36, topic: id,
        });
        segments.push({
          ax: cx + perp[0] * placed[0], az: cz + perp[1] * placed[0], ay: lift + 0.02,
          bx: cx + perp[0] * placed[placed.length - 1], bz: cz + perp[1] * placed[placed.length - 1], by: lift + 0.02,
        });
      }
      streetEnd = [cx, cz];
    }
  } else {
    const wantedPairs = Math.min(kind === "penghu" ? 3 : 8, Math.max(2, Math.ceil(shops / 2)));
    let perSide = wantedPairs;
    let ts = [];
    const collect = (n) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        const t = (i - (n - 1) / 2) * spacing;
        const ok = [-1, 1].every((side) => footprintOk(
          anchor[0] + dir[0] * t + perp[0] * side * sideOff,
          anchor[1] + dir[1] * t + perp[1] * side * sideOff
        ));
        if (ok) out.push(t);
      }
      return out;
    };
    ts = collect(perSide);
    while (ts.length < Math.min(3, perSide) && perSide > 2) {
      perSide -= 1;
      ts = collect(perSide);
    }
    if (ts.length < 2) {
      ts = [];
      const n = Math.min(5, shops);
      for (let i = 0; i < n; i++) {
        const t = (i - (n - 1) / 2) * spacing;
        if (footprintOk(anchor[0] + dir[0] * t, anchor[1] + dir[1] * t)) ts.push(t);
      }
    }
    if (ts.length >= 2) {
      const a = ts[0], b = ts[ts.length - 1];
      const both = [-1, 1].every((side) => footprintOk(
        anchor[0] + dir[0] * a + perp[0] * side * sideOff,
        anchor[1] + dir[1] * a + perp[1] * side * sideOff
      ));
      const sides = both ? [-1, 1] : [0];
      const off = both ? sideOff : 0;
      roads.push({
        x: anchor[0] + dir[0] * (a + b) / 2,
        z: anchor[1] + dir[1] * (a + b) / 2,
        rot: Math.atan2(dir[0], dir[1]),
        sx: 0.34,
        sz: Math.abs(b - a) + spacing,
      });
      segments.push({
        ax: anchor[0] + dir[0] * (a - spacing * 0.15), az: anchor[1] + dir[1] * (a - spacing * 0.15), ay: 0.02,
        bx: anchor[0] + dir[0] * (b + spacing * 0.15), bz: anchor[1] + dir[1] * (b + spacing * 0.15), by: 0.02,
      });
      for (const t of ts) {
        for (const side of sides) {
          const x = anchor[0] + dir[0] * t + perp[0] * side * off;
          const z = anchor[1] + dir[1] * t + perp[1] * side * off;
          const face = side === 0
            ? Math.atan2(perp[0], perp[1])
            : Math.atan2(-perp[0] * side, -perp[1] * side);
          placeHouse(x, z, 0, face, 1);
        }
      }
      const endT = b + 0.9;
      const ex = anchor[0] + dir[0] * endT, ez = anchor[1] + dir[1] * endT;
      streetEnd = (kind === "penghu" || pointInPoly(poly, ex, ez)) ? [ex, ez] : [anchor[0] + dir[0] * b, anchor[1] + dir[1] * b];
    }
  }

  if (!houses.length) {
    placeHouse(anchor[0], anchor[1], 0, Math.atan2(dir[0], dir[1]), 1);
    segments.push({
      ax: anchor[0] - dir[0] * 0.4, az: anchor[1] - dir[1] * 0.4, ay: 0.02,
      bx: anchor[0] + dir[0] * 0.4, bz: anchor[1] + dir[1] * 0.4, by: 0.02,
    });
  }

  const fieldN = cell.area > 5 ? Math.min(14, Math.round(cell.area * 0.22)) : 0;
  for (let i = 0; i < fieldN; i++) {
    const ang = rand() * Math.PI * 2;
    const rad = 1.1 + rand() * Math.max(0.4, span * 0.55);
    const x = anchor[0] + Math.cos(ang) * rad;
    const z = anchor[1] + Math.sin(ang) * rad;
    if (!pointInPoly(poly, x, z)) continue;
    if (Math.hypot(x - anchor[0], z - anchor[1]) < 1.05) continue;
    fields.push({ x, z, rot: rand() * 3, sx: 0.35 + rand() * 0.45, sz: 0.28 + rand() * 0.4 });
  }

  const landmark = makeLandmark(kind, anchor, dir, id, streetEnd);
  return { houses, roads, lanterns, cloths, herbs, steps, fields, segments, landmark };
}

function makeLandmark(kind, anchor, dir, id, origin) {
  const base = origin || anchor;
  const rot = Math.atan2(dir[0], dir[1]);
  const buf = { pos: [], col: [], nor: [] };
  const frame = (dx, dz) => {
    const c = Math.cos(rot), s = Math.sin(rot);
    return [base[0] + dx * c + dz * s, base[1] - dx * s + dz * c];
  };
  const box = (color, x, y, z, sx, sy, sz) => {
    const p = frame(x, z);
    pushBox(buf, color, p[0], y, p[1], sx, sy, sz, rot);
  };
  if (kind === "temple" || kind === "tainan") {
    box(0xd9cbb0, 0, 0.04, 0.1, 0.7, 0.08, 0.52);
    for (const x of [-0.22, 0.22]) for (const z of [-0.02, 0.2]) box(0xa33b32, x, 0.22, z, 0.05, 0.32, 0.05);
    box(0xf3efe4, 0, 0.28, 0.1, 0.42, 0.26, 0.3);
    pushSwallow(buf, 0x8c2e28, frame, rot, 0, 0.46, 0.1, 0.72, 0.52, 0.16);
    box(0xf0c14e, 0, 0.36, 0.26, 0.1, 0.1, 0.03);
  } else if (kind === "anping" || kind === "tamsui") {
    box(0xc4a078, 0, 0.06, 0, 0.7, 0.12, 0.52);
    box(0xa34738, 0, 0.22, -0.2, 0.62, 0.22, 0.06);
    box(0xa34738, 0, 0.22, 0.2, 0.62, 0.22, 0.06);
    box(0xa34738, -0.28, 0.22, 0, 0.07, 0.24, 0.42);
    box(0xa34738, 0.28, 0.22, 0, 0.07, 0.24, 0.42);
    for (const x of [-0.28, 0.28]) for (const z of [-0.2, 0.2]) box(0x8d3a30, x, 0.38, z, 0.1, 0.12, 0.1);
    box(0xf4efe4, 0, 0.46, 0, 0.025, 0.28, 0.025);
    box(0xc4543a, 0.05, 0.56, 0, 0.1, 0.06, 0.015);
    if (kind === "tamsui") {
      box(0x3d8f9a, -0.1, 0.02, -0.55, 0.42, 0.03, 0.7);
      box(0x4ea3ac, 0.28, 0.02, -0.75, 0.28, 0.025, 0.42);
    }
  } else if (kind === "hengchun" || kind === "gate" || kind === "market") {
    box(0xb7a890, -0.42, 0.1, 0, 0.4, 0.14, 0.1);
    box(0xb7a890, 0.42, 0.1, 0, 0.4, 0.14, 0.1);
    box(0xa33b32, -0.2, 0.3, 0, 0.1, 0.4, 0.1);
    box(0xa33b32, 0.2, 0.3, 0, 0.1, 0.4, 0.1);
    pushSwallow(buf, 0x8e342c, frame, rot, 0, 0.52, 0, 0.55, 0.32, 0.14);
    box(0x2c241c, 0, 0.26, 0.02, 0.16, 0.22, 0.04);
  } else if (kind === "penghu") {
    box(0xe7dcc4, 0, 0.1, 0, 0.36, 0.18, 0.26);
    pushSwallow(buf, 0xa34b3c, frame, rot, 0, 0.24, 0, 0.42, 0.32, 0.12);
  } else {
    return null;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(buf.pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(buf.col, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

function pushBox(buf, color, cx, cy, cz, sx, sy, sz, rot) {
  const c = new THREE.Color(color);
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const pts = [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz], [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]];
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const w = pts.map(([x, y, z]) => [cx + x * cos + z * sin, cy + y, cz - x * sin + z * cos]);
  const faces = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]];
  for (const f of faces) {
    const tri = [[f[0], f[1], f[2]], [f[0], f[2], f[3]]];
    for (const t of tri) {
      for (const i of t) buf.pos.push(w[i][0], w[i][1], w[i][2]);
      for (let k = 0; k < 3; k++) buf.col.push(c.r, c.g, c.b);
    }
  }
}
function pushSwallow(buf, color, frame, rot, x, y, z, w, d, h) {
  const c = new THREE.Color(color);
  const xs = [-0.5, -0.16, 0.16, 0.5];
  const ridge = [1, 0.62, 0.62, 1];
  const eave = [0.18, 0, 0, 0.18];
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const p = frame(x, z);
  function tp(lx, ly, lz) {
    const X = lx * w, Y = y + ly * h, Z = lz * d;
    return [p[0] + X * cos + Z * sin, Y, p[1] - X * sin + Z * cos];
  }
  function tri(a, b, c1) {
    for (const v of [a, b, c1]) buf.pos.push(v[0], v[1], v[2]);
    for (let k = 0; k < 3; k++) buf.col.push(c.r, c.g, c.b);
  }
  for (let i = 0; i < 3; i++) {
    const r1 = tp(xs[i], ridge[i], 0), r2 = tp(xs[i + 1], ridge[i + 1], 0);
    const f1 = tp(xs[i], eave[i], 0.5), f2 = tp(xs[i + 1], eave[i + 1], 0.5);
    const b1 = tp(xs[i], eave[i], -0.5), b2 = tp(xs[i + 1], eave[i + 1], -0.5);
    tri(f1, f2, r2); tri(f1, r2, r1);
    tri(b2, b1, r1); tri(b2, r1, r2);
  }
}

function houseWall() {
  return new THREE.BoxGeometry(0.4, 0.56, 0.32).translate(0, 0.28, -0.02);
}
function houseRoof() {
  const buf = { pos: [], col: [] };
  const xs = [-0.23, -0.07, 0.07, 0.23];
  const ridge = [0.13, 0.045, 0.045, 0.13];
  const eave = [0.02, 0, 0, 0.02];
  const y0 = 0.56;
  function tri(a, b, c) { buf.pos.push(...a, ...b, ...c); }
  for (let i = 0; i < 3; i++) {
    const r1 = [xs[i], y0 + ridge[i], 0], r2 = [xs[i + 1], y0 + ridge[i + 1], 0];
    const f1 = [xs[i], y0 + eave[i], 0.18], f2 = [xs[i + 1], y0 + eave[i + 1], 0.18];
    const b1 = [xs[i], y0 + eave[i], -0.18], b2 = [xs[i + 1], y0 + eave[i + 1], -0.18];
    tri(f1, f2, r2); tri(f1, r2, r1);
    tri(b2, b1, r1); tri(b2, r1, r2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(buf.pos, 3));
  g.computeVertexNormals();
  return g;
}
function houseArcade() {
  const g = new THREE.BoxGeometry(0.4, 0.04, 0.12);
  g.translate(0, 0.4, 0.16);
  const postL = new THREE.BoxGeometry(0.04, 0.4, 0.04).translate(-0.15, 0.2, 0.18);
  const postR = new THREE.BoxGeometry(0.04, 0.4, 0.04).translate(0.15, 0.2, 0.18);
  return mergeGeos([g, postL, postR]);
}
function houseDoor() {
  const door = new THREE.BoxGeometry(0.12, 0.32, 0.02).translate(0, 0.16, 0.145);
  const w1 = new THREE.BoxGeometry(0.07, 0.07, 0.02).translate(-0.1, 0.36, 0.145);
  const w2 = new THREE.BoxGeometry(0.07, 0.07, 0.02).translate(0.1, 0.36, 0.145);
  return mergeGeos([door, w1, w2]);
}
function houseSign() {
  return new THREE.BoxGeometry(0.2, 0.08, 0.02).translate(0, 0.5, 0.22);
}
function mergeGeos(list) {
  let count = 0;
  const geos = list.map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of geos) count += g.attributes.position.count;
  const pos = new Float32Array(count * 3);
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, o);
    o += g.attributes.position.array.length;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}
function signTexture([text, bg, fg]) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = bg;
  g.fillRect(0, 0, 128, 64);
  g.strokeStyle = fg;
  g.lineWidth = 4;
  g.strokeRect(3, 3, 122, 58);
  g.fillStyle = fg;
  g.font = "700 36px 'WenQuanYi Micro Hei', sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 64, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ROBES = [0x9c2c2c, 0xc4473a, 0x1f4e79, 0x2f6f6a, 0xf4f1e8, 0xe7d7a4, 0x6e8f4e, 0xd07a96, 0xd4a24a, 0x5c3d6e, 0x8a5a3c, 0xb85a32, 0x234e3f, 0xf2efe6, 0x7a2430];

function buildCrowd(scene) {
  const segments = scene.userData.segments || [];
  const byId = new Map();
  for (const s of segments) {
    if (!byId.has(s.id)) byId.set(s.id, []);
    byId.get(s.id).push(s);
  }
  const mobile = narrow();
  peopleBudget = mobile ? 240 : 780;
  const raw = Object.keys(TOWNS).map((id) => {
    const min = id === "other" ? 4 : 6;
    return { id, n: Math.max(min, Math.round(peopleBudget * (counts[id] || 0) / countSum)) };
  });
  let sum = raw.reduce((s, r) => s + r.n, 0);
  if (sum > peopleBudget) {
    const k = peopleBudget / sum;
    for (const r of raw) r.n = Math.max(r.id === "other" ? 3 : 4, Math.round(r.n * k));
  }
  const people = [];
  for (const group of raw) {
    const segs = byId.get(group.id) || [];
    if (!segs.length) continue;
    const rand = rng(hash(group.id) + 99);
    for (let i = 0; i < group.n; i++) {
      const seg = segs[i % segs.length];
      const stop = rand() < 0.32;
      const fem = rand() < 0.48;
      const age = rand();
      const child = age > 0.86;
      const elder = age < 0.16;
      const hat = elder ? rand() < 0.7 : rand() < 0.22;
      const scale = child ? 0.62 : elder ? 0.9 : 0.86 + rand() * 0.18;
      const along = rand();
      const side = (rand() - 0.5) * 0.1;
      const dx = seg.bx - seg.ax, dz = seg.bz - seg.az;
      const len = Math.hypot(dx, dz) || 1;
      const px = -dz / len, pz = dx / len;
      const ax = seg.ax + px * side, az = seg.az + pz * side, ay = seg.ay;
      const bx = seg.bx + px * side, bz = seg.bz + pz * side, by = seg.by;
      let sx = ax, sz = az, sy = ay, ex = bx, ez = bz, ey = by, face = Math.atan2(dx, dz);
      if (stop) {
        const t = 0.15 + rand() * 0.7;
        const stand = 0.12 + rand() * 0.06;
        sx = ax + (bx - ax) * t + px * stand;
        sz = az + (bz - az) * t + pz * stand;
        sy = ay + (by - ay) * t;
        ex = sx; ez = sz; ey = sy;
        face = Math.atan2(px, pz);
      }
      const robe = ROBES[Math.floor(rand() * ROBES.length)];
      people.push({
        ax: sx, ay: sy, az: sz, bx: ex, by: ey, bz: ez,
        phase: rand(), speed: 0.07 + rand() * 0.06, stop: stop ? 1 : 0, hat: hat ? 1 : 0,
        fem: fem ? 1 : 0, scale, face, robe, child,
      });
    }
  }
  // Interleave towns so a lower draw count still shows every street.
  const buckets = new Map();
  for (const p of people) {
    const id = "all";
    void id;
  }
  people.sort((a, b) => a.phase - b.phase);

  const geo = personGeometry();
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: peopleTime,
      uLight: { value: new THREE.Vector3(-0.48, 0.82, -0.3).normalize() },
    },
    vertexShader: `
      attribute float aPart;
      attribute vec4 aA;
      attribute vec4 aB;
      attribute vec4 aP;
      attribute vec4 aC;
      uniform float uTime;
      uniform vec3 uLight;
      varying vec3 vCol;
      varying vec3 vN;
      void main() {
        float aPhase = aA.w;
        float aSpeed = aB.w;
        float aStop = aP.x;
        float aHat = aP.y;
        float aFem = aP.z;
        float aScale = aP.w;
        float aFace = aC.w;
        float travel = fract(uTime * aSpeed + aPhase);
        float ping = travel < 0.5 ? travel * 2.0 : 2.0 - travel * 2.0;
        vec3 base = aStop > 0.5 ? aA.xyz : mix(aA.xyz, aB.xyz, ping);
        vec3 dir = aB.xyz - aA.xyz;
        float ang = aStop > 0.5 ? aFace : (travel < 0.5 ? atan(dir.x, dir.z) : atan(-dir.x, -dir.z));
        bool hide = (aPart > 2.5 && aPart < 3.5 && aHat < 0.5) || (aPart > 1.5 && aPart < 2.5 && aHat > 0.5);
        vec3 p = hide ? vec3(0.0) : position * aScale;
        if (!hide && aPart < 0.5 && aFem > 0.5) p.xz *= 1.15;
        if (!hide && aPart > 1.5 && aPart < 2.5 && aFem < 0.5) p.xz *= 0.72;
        float bob = aStop > 0.5 ? sin(uTime * 1.7 + aPhase) * 0.006 : abs(sin(ping * 10.0 + aPhase)) * 0.02;
        float c = cos(ang), s = sin(ang);
        vec3 w = vec3(c * p.x + s * p.z, p.y + bob, -s * p.x + c * p.z) + base;
        vec3 n = normalize(vec3(c * normal.x + s * normal.z, normal.y, -s * normal.x + c * normal.z));
        vec3 albedo = aC.xyz;
        if (aPart > 0.5 && aPart < 1.5) albedo = vec3(0.93, 0.73, 0.58);
        else if (aPart > 1.5 && aPart < 2.5) albedo = vec3(0.08, 0.06, 0.05);
        else if (aPart > 2.5 && aPart < 3.5) albedo = vec3(0.86, 0.71, 0.4);
        else if (aPart > 3.5) albedo = vec3(0.28, 0.16, 0.1);
        vN = n;
        vCol = albedo;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(w, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uLight;
      varying vec3 vCol;
      varying vec3 vN;
      void main() {
        float ndl = dot(normalize(vN), uLight) * 0.5 + 0.55;
        vec3 col = vCol * (0.42 + 0.75 * ndl);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  peopleMesh = new THREE.InstancedMesh(geo, mat, Math.max(1, people.length));
  peopleMesh.count = people.length;
  peopleMesh.frustumCulled = false;
  const aA = new Float32Array(people.length * 4);
  const aB = new Float32Array(people.length * 4);
  const aP = new Float32Array(people.length * 4);
  const aC = new Float32Array(people.length * 4);
  people.forEach((p, i) => {
    aA.set([p.ax, p.ay, p.az, p.phase], i * 4);
    aB.set([p.bx, p.by, p.bz, p.speed], i * 4);
    aP.set([p.stop, p.hat, p.fem, p.scale * 0.62], i * 4);
    const col = new THREE.Color(p.robe);
    aC.set([col.r, col.g, col.b, p.face], i * 4);
  });
  const inst = (name, arr) => geo.setAttribute(name, new THREE.InstancedBufferAttribute(arr, 4));
  inst("aA", aA); inst("aB", aB); inst("aP", aP); inst("aC", aC);
  const ident = new THREE.Matrix4();
  for (let i = 0; i < people.length; i++) peopleMesh.setMatrixAt(i, ident);
  scene.add(peopleMesh);
  scene.userData.peopleCount = people.length;
}

function personGeometry() {
  const pos = [];
  const nor = [];
  const part = [];
  function add(geo, partId, x, y, z, sx, sy, sz) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    g.computeVertexNormals();
    const p = g.attributes.position.array;
    const n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i += 3) {
      pos.push(p[i] * sx + x, p[i + 1] * sy + y, p[i + 2] * sz + z);
      nor.push(n[i], n[i + 1], n[i + 2]);
      part.push(partId);
    }
  }
  const cone = new THREE.CylinderGeometry(0.045, 0.08, 0.2, 7);
  add(cone, 0, 0, 0.12, 0, 1, 1, 1);
  const torso = new THREE.CylinderGeometry(0.032, 0.04, 0.1, 6);
  add(torso, 0, 0, 0.24, 0, 1, 1, 1);
  const sleeve = new THREE.BoxGeometry(0.1, 0.035, 0.05);
  add(sleeve, 0, 0.09, 0.25, 0.01, 1, 1, 1);
  add(sleeve, 0, -0.09, 0.25, 0.01, 1, 1, 1);
  const belt = new THREE.CylinderGeometry(0.042, 0.042, 0.02, 7);
  add(belt, 4, 0, 0.2, 0, 1, 1, 1);
  const head = new THREE.SphereGeometry(0.04, 7, 6);
  add(head, 1, 0, 0.32, 0, 1, 1.05, 1);
  const bun = new THREE.SphereGeometry(0.026, 6, 5);
  add(bun, 2, 0, 0.365, -0.005, 1, 1, 1);
  const hat = new THREE.ConeGeometry(0.07, 0.035, 7);
  add(hat, 3, 0, 0.378, 0, 1, 1,4, 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("aPart", new THREE.Float32BufferAttribute(part, 1));
  return g;
}

function adaptCrowd(dt, warm, renderer) {
  if (!peopleMesh || navigator.webdriver) return;
  if (warm < 2.2) return;
  const fps = 1 / Math.max(0.001, dt);
  fpsMix = fpsMix * 0.9 + fps * 0.1;
  if (fpsMix < 46) slowFrames++;
  else slowFrames = Math.max(0, slowFrames - 1);
  if (slowFrames > 40 && crowdLevel > 0.4) {
    crowdLevel *= 0.75;
    peopleMesh.count = Math.max(36, Math.floor(sceneCount() * crowdLevel));
    const pr = renderer.getPixelRatio();
    if (pr > 1) renderer.setPixelRatio(Math.max(1, pr * 0.85));
    slowFrames = 0;
  }
}
function sceneCount() {
  return peopleMesh ? peopleMesh.geometry.getAttribute("aA").count : 0;
}

function buildLinks(scene) {
  const pair = new Map();
  for (const v of DATA.v) {
    const ids = [...new Set(v.tp || [])].filter((id) => districts.has(id)).sort();
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = ids[i] + "|" + ids[j];
        pair.set(key, (pair.get(key) || 0) + 1);
      }
    }
  }
  for (const [key, w] of pair) {
    const [aId, bId] = key.split("|");
    const a = districts.get(aId), b = districts.get(bId);
    const dir = new THREE.Vector3(b.x - a.x, 0, b.z - a.z);
    const len = dir.length() || 1;
    dir.multiplyScalar(1 / len);
    const inset = 0.7;
    const p = new THREE.Vector3(a.x, 0.2, a.z).addScaledVector(dir, inset);
    const q = new THREE.Vector3(b.x, 0.2, b.z).addScaledVector(dir, -inset);
    const mid = p.clone().lerp(q, 0.5);
    mid.y += 0.28;
    const curve = new THREE.QuadraticBezierCurve3(p, mid, q);
    const N = 8;
    const half = 0.012;
    const positions = [];
    const index = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const point = curve.getPoint(t);
      const tan = curve.getTangent(t);
      const px = -tan.z, pz = tan.x;
      const plen = Math.hypot(px, pz) || 1;
      positions.push(point.x + (px / plen) * half, point.y, point.z + (pz / plen) * half);
      positions.push(point.x - (px / plen) * half, point.y, point.z - (pz / plen) * half);
    }
    for (let i = 0; i < N; i++) {
      const k = i * 2;
      index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(index);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xd9c48a, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide,
    }));
    mesh.renderOrder = 1;
    mesh.visible = false;
    scene.add(mesh);
    links.push({ a: aId, b: bId, w, mesh });
  }
}

function stepRings() {
  for (const d of districts.values()) {
    const pulse = paused || reduced.matches ? 1 : 0.72 + 0.28 * Math.sin(sim * 2.1 + d.phase);
    const aim = d.glow * (d.glow >= 1 ? 0.95 : 0.25 + 0.6 * pulse);
    d.ring.material.opacity += (aim - d.ring.material.opacity) * 0.18;
    d.ring.material.color.setHex(d.ringColor);
  }
}

function refreshGlow() {
  let maxC = 1;
  const y = Number(yearInput.value);
  if (timeOn) for (const t of DATA.topics) maxC = Math.max(maxC, byYear[y][t.id] || 0);
  for (const d of districts.values()) {
    let glow = 0;
    let color = 0xf0c14e;
    if (timeOn) { glow = (byYear[y][d.id] || 0) / maxC; color = 0xd2ee78; }
    if (searchOn && hot.has(d.id)) { glow = 1; color = 0xffe08a; }
    else if (searchOn) glow = 0;
    if (d.id === selected) { glow = 1; color = 0xf0c14e; }
    d.glow = glow;
    d.ringColor = color;
    d.pin.classList.toggle("hot", searchOn && hot.has(d.id));
    d.pin.classList.toggle("on", d.id === selected);
    d.shade.material.opacity = searchOn && !hot.has(d.id) ? 0.5 : 0;
    d.ground.material.color.copy(d.base).lerp(new THREE.Color(color), glow * 0.38);
  }
  for (const link of links) {
    const touch = selected && (link.a === selected || link.b === selected);
    const both = searchOn && hot.has(link.a) && hot.has(link.b);
    link.mesh.visible = Boolean(touch || both);
    link.mesh.material.opacity = touch || both ? 0.12 : 0;
  }
  listBody.querySelectorAll("[data-topic]").forEach((btn) => {
    btn.classList.toggle("hot", searchOn && hot.has(btn.dataset.topic));
    btn.classList.toggle("on", btn.dataset.topic === selected);
  });
}

function symptomHits(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DATA.sym.filter((g) => [g.w, ...g.syn].some((w) => {
    const lw = String(w).toLowerCase();
    if (lw === q) return true;
    if (q.length < 2) return false;
    return lw.includes(q) || (lw.length >= 2 && q.includes(lw));
  }));
}
function runSearch(raw) {
  const query = raw.trim();
  if (!query) {
    clearSearch();
    if (panelMode === "search") hidePanel(false);
    return;
  }
  const syms = symptomHits(query);
  const terms = new Set([query]);
  const score = {};
  for (const s of syms) {
    terms.add(s.w);
    for (const syn of s.syn) terms.add(syn);
    for (const id of s.tp) score[id] = (score[id] || 0) + 100;
  }
  for (const t of DATA.topics) {
    const town = TOWNS[t.id]?.name || "";
    if (t.name.includes(query) || t.sub.includes(query) || t.ic === query || town.includes(query) || labelOf(t.id).includes(query)) {
      score[t.id] = (score[t.id] || 0) + 80;
    }
  }
  const found = [];
  for (const v of DATA.v) {
    let s = 0;
    const title = v.t || "";
    const desc = v.d || "";
    const kw = (v.kw || []).join(" ");
    for (const term of terms) {
      if (!term) continue;
      const tl = term.toLowerCase();
      const boost = term.toLowerCase() === query.toLowerCase() ? 2 : 1;
      if (title.includes(term) || title.toLowerCase().includes(tl)) s += 5 * boost;
      else if (kw.includes(term) || kw.toLowerCase().includes(tl)) s += 3 * boost;
      else if (desc.includes(term) || desc.toLowerCase().includes(tl)) s += 2 * boost;
    }
    if ((v.doc || []).some((n) => n.includes(query))) s += 6;
    if (s > 0) {
      found.push([s, v]);
      for (const id of v.tp || []) score[id] = (score[id] || 0) + 1;
    }
  }
  found.sort((a, b) => b[0] - a[0] || b[1].date.localeCompare(a[1].date));
  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
  hot = new Set();
  for (const s of syms) for (const id of s.tp) hot.add(id);
  for (const t of DATA.topics) {
    const town = TOWNS[t.id]?.name || "";
    if (query.length >= 1 && (t.name.includes(query) || t.ic === query || town.includes(query) || (query.length >= 2 && t.sub.includes(query)))) hot.add(t.id);
  }
  if (!hot.size) {
    for (const [id, sc] of ranked) {
      if (hot.size >= 3) break;
      if (sc >= 3) hot.add(id);
    }
  }
  searchOn = true;
  selected = null;
  panelMode = "search";
  renderSearch(query, syms, found.map((x) => x[1]));
  showPanel();
  refreshGlow();
  live.textContent = `搜尋${query}，${found.length} 支影片`;
}
function clearSearch() {
  searchOn = false;
  hot = new Set();
  refreshGlow();
}

function docBits(name) {
  const docLinks = DOCS[name]?.links || {};
  const profile = docLinks.prof || "";
  const reg = docLinks.reg || docLinks.regDept || "";
  const nameHtml = profile
    ? `<a href="${esc(profile)}" target="_blank" rel="noopener">${esc(name)}</a>`
    : reg
      ? `<a href="${esc(reg)}" target="_blank" rel="noopener">${esc(name)}</a>`
      : esc(name);
  const regHtml = profile && reg ? ` <a class="reg" href="${esc(reg)}" target="_blank" rel="noopener">掛號</a>` : "";
  return `${nameHtml}${regHtml}`;
}
function topDoctors(id) {
  const map = new Map();
  for (const v of byTopic[id]) for (const n of v.doc || []) map.set(n, (map.get(n) || 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
}
function videoCard(v) {
  const href = `https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`;
  const docs = (v.doc || []).length ? (v.doc || []).map(docBits).join("、") : "未標示醫師";
  const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/mqdefault.jpg`;
  return `<article class="vcard"><a href="${href}" target="_blank" rel="noopener"><img loading="lazy" alt="" src="${thumb}"></a><div><h4><a href="${href}" target="_blank" rel="noopener">${esc(v.t)}</a></h4><div class="meta">${esc(v.date || "—")}・${docs}</div></div></article>`;
}
function setVideos(items) {
  listItems = items;
  listShown = 0;
  const box = panelBody.querySelector(".videos");
  if (!box) return;
  box.innerHTML = items.length ? "" : `<p class="empty">沒有對得上的影片。</p>`;
  appendVideos();
}
function appendVideos() {
  const box = panelBody.querySelector(".videos");
  const more = panelBody.querySelector("[data-more]");
  if (!box) return;
  const next = listItems.slice(listShown, listShown + 18);
  if (next.length) box.insertAdjacentHTML("beforeend", next.map(videoCard).join(""));
  listShown += next.length;
  if (more) more.hidden = listShown >= listItems.length;
}
function showPanel() {
  panel.hidden = false;
  document.body.classList.add("panel-open");
  panelBody.scrollTop = 0;
}
function hidePanel(flyHomeAfter) {
  panel.hidden = true;
  panel.classList.remove("full");
  document.body.classList.remove("panel-open");
  selected = null;
  panelMode = null;
  refreshGlow();
  if (flyHomeAfter && !birdOn) goHome();
}
function renderTopic(id) {
  const t = TOPICS[id];
  const n = counts[id] || 0;
  const docs = topDoctors(id);
  const syms = DATA.sym.filter((s) => s.tp.includes(id));
  panelBody.innerHTML = `
    <p class="eyebrow">古城園區</p>
    <h2><span class="mini-seal" style="display:inline-grid;vertical-align:middle;margin-right:2px">${esc(t.ic)}</span>・${esc(TOWNS[id].name)}</h2>
    <p class="sub">${esc(t.sub)}</p>
    <p class="count"><b>${n}</b> 支影片</p>
    ${docs.length ? `<h3>常出現的醫師</h3><div class="doc-row">${docs.map(([name, c]) => `<span class="doc-chip">${docBits(name)} <span class="n">${c} 支</span></span>`).join("")}</div>` : ""}
    ${syms.length ? `<h3>相關症狀</h3><div class="chips">${syms.map((s) => `<button type="button" class="chip" data-q="${esc(s.w)}">${esc(s.w)}</button>`).join("")}</div>` : ""}
    <h3>影片</h3>
    <div class="videos"></div>
    <div class="more-wrap"><button type="button" data-more>載入更多</button></div>`;
  panelMode = "topic";
  setVideos(byTopic[id]);
}
function renderSearch(query, syms, videos) {
  const zones = [...hot].map((id) => TOPICS[id]).filter(Boolean);
  panelBody.innerHTML = `
    <p class="eyebrow">搜尋</p>
    <h2>「${esc(query)}」</h2>
    <p class="sub">${syms.length ? `對上症狀：${syms.map((s) => esc(s.w)).join("、")}。` : "依標題、說明與關鍵字查找。"}相關古城會亮起來。</p>
    ${zones.length ? `<div class="chips">${zones.map((t) => `<button type="button" class="chip plain" data-open="${t.id}">${esc(labelOf(t.id))}</button>`).join("")}</div>` : ""}
    <p class="count"><b>${videos.length}</b> 支影片</p>
    <div class="videos"></div>
    <div class="more-wrap"><button type="button" data-more>載入更多</button></div>`;
  setVideos(videos);
}
function openTopic(id) {
  if (!districts.has(id)) return;
  if (window.innerWidth < 760) toggleList(false);
  birdOn = false;
  btnBird.setAttribute("aria-pressed", "false");
  selected = id;
  renderTopic(id);
  showPanel();
  const controls = openTopic.controls;
  const camera = openTopic.camera;
  applyLimits(controls);
  const pose = viewFor(id);
  fly(camera, controls, pose.p, pose.t);
  refreshGlow();
  live.textContent = `已打開${labelOf(id)}，${counts[id]} 支影片`;
}
function goHome() {
  const controls = openTopic.controls;
  const camera = openTopic.camera;
  birdOn = false;
  btnBird.setAttribute("aria-pressed", "false");
  applyLimits(controls);
  const pose = homePose(camera);
  fly(camera, controls, pose.p, pose.t);
}
function toggleList(force) {
  const open = typeof force === "boolean" ? force : listEl.hidden;
  listEl.hidden = !open;
  btnList.setAttribute("aria-pressed", open ? "true" : "false");
  document.body.classList.toggle("list-open", open);
}
function toggleTime(force) {
  timeOn = typeof force === "boolean" ? force : !timeOn;
  timebar.hidden = !timeOn;
  btnTime.setAttribute("aria-pressed", timeOn ? "true" : "false");
  document.body.classList.toggle("time-on", timeOn);
  paintYear();
  refreshGlow();
}
function paintYear() {
  const y = Number(yearInput.value);
  yearOut.textContent = String(y);
  let best = DATA.topics[0], bn = -1;
  for (const t of DATA.topics) {
    const c = byYear[y][t.id] || 0;
    if (c > bn) { bn = c; best = t; }
  }
  yearNote.textContent = `${y} 年 ${yearVideoCount[y] || 0} 支影片・${labelOf(best.id)}最亮（${bn} 支主題收錄）`;
}
function buildList() {
  listBody.innerHTML = DATA.topics.map((t) => `
    <button type="button" class="topic-btn" data-topic="${t.id}">
      <span class="seal">${esc(t.ic)}</span>
      <span class="txt"><b>${esc(labelOf(t.id))}</b><small>${esc(t.sub)}</small></span>
      <em>${counts[t.id] || 0}</em>
    </button>`).join("");
}
function hash(s) {
  let h = 0;
  for (const c of s) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return h;
}

const TOUR = [
  { title: "歡迎來到大愛學漢醫島", body: "十六座主題園區成了十六座台灣古城。土地拼成直立的蕃薯，西邊海上是澎湖馬公。", pose: "home" },
  { title: "城有大有小", body: "影片愈多，那一塊地愈大，街上的紅磚店家和穿漢服的行人也愈多。內科在台中舊城，位在島的中央，最大。", pose: "home" },
  { title: "走一條老街", body: "點一座古城或名牌，鏡頭會飛近亭仔腳。旁邊列出影片、常出現的醫師，以及相關症狀。", pose: "herb" },
  { title: "用一句不適找路", body: "上方可以搜尋「失眠」或「便秘」。對得上的古城會亮起來，並列出影片。", pose: "home" },
  { title: "清單、年份與鳥瞰", body: "☰ 清單用文字走一遍每一座古城。◷ 時間把年份撥到 2022 至 2026。鳥瞰從天上看整座台灣。", pose: "bird" },
];
let tourStep = 0;
function openTour(camera, controls) {
  tourStep = 0;
  tourEl.hidden = false;
  paintTour(camera, controls);
}
function paintTour(camera, controls) {
  const step = TOUR[tourStep];
  $("#tour-step").textContent = `導覽 ${tourStep + 1} / ${TOUR.length}`;
  $("#tour-title").textContent = step.title;
  $("#tour-body").textContent = step.body;
  $("#tour-next").textContent = tourStep === TOUR.length - 1 ? "開始逛島" : "下一步";
  if (reduced.matches) return;
  if (step.pose === "home") {
    birdOn = false;
    applyLimits(controls);
    const pose = homePose(camera);
    fly(camera, controls, pose.p, pose.t, 700);
  } else if (step.pose === "bird") {
    birdOn = true;
    applyLimits(controls);
    const pose = birdPose(camera);
    fly(camera, controls, pose.p, pose.t, 700);
  } else if (districts.has(step.pose)) {
    birdOn = false;
    applyLimits(controls);
    const pose = viewFor(step.pose);
    fly(camera, controls, pose.p, pose.t, 700);
  }
  btnBird.setAttribute("aria-pressed", birdOn ? "true" : "false");
}
function endTour(camera, controls) {
  tourEl.hidden = true;
  try { localStorage.setItem("daai-island-tour-v2", "1"); } catch (e) { /* ignore */ }
  birdOn = false;
  btnBird.setAttribute("aria-pressed", "false");
  applyLimits(controls);
  const pose = homePose(camera);
  fly(camera, controls, pose.p, pose.t, 600);
}

function wireUi(camera, controls) {
  openTopic.camera = camera;
  openTopic.controls = controls;
  btnHome.addEventListener("click", () => { hidePanel(false); goHome(); });
  btnList.addEventListener("click", () => toggleList());
  $("#list-close").addEventListener("click", () => toggleList(false));
  listBody.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-topic]");
    if (!btn) return;
    openTopic(btn.dataset.topic);
  });
  btnTime.addEventListener("click", () => toggleTime());
  yearInput.addEventListener("input", () => { paintYear(); if (timeOn) refreshGlow(); });
  paintYear();
  btnPause.addEventListener("click", () => {
    paused = !paused;
    btnPause.setAttribute("aria-pressed", paused ? "true" : "false");
    btnPause.textContent = paused ? "繼續" : "暫停";
  });
  btnBird.addEventListener("click", () => {
    birdOn = !birdOn;
    btnBird.setAttribute("aria-pressed", birdOn ? "true" : "false");
    applyLimits(controls);
    const pose = birdOn ? birdPose(camera) : homePose(camera);
    fly(camera, controls, pose.p, pose.t);
  });
  btnHelp.addEventListener("click", () => openTour(camera, controls));
  $("#tour-skip").addEventListener("click", () => endTour(camera, controls));
  $("#tour-next").addEventListener("click", () => {
    if (tourStep >= TOUR.length - 1) endTour(camera, controls);
    else { tourStep += 1; paintTour(camera, controls); }
  });
  let searchTimer = 0;
  $("#search-form").addEventListener("submit", (e) => { e.preventDefault(); runSearch(qInput.value); });
  qInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => runSearch(qInput.value), 80);
  });
  panel.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) {
      if (panelMode === "search") { qInput.value = ""; clearSearch(); }
      hidePanel(true);
      return;
    }
    if (e.target.closest("[data-expand]")) { panel.classList.toggle("full"); return; }
    if (e.target.closest("[data-more]")) { appendVideos(); return; }
    const chip = e.target.closest("[data-q]");
    if (chip) { qInput.value = chip.dataset.q; runSearch(chip.dataset.q); return; }
    const open = e.target.closest("[data-open]");
    if (open) openTopic(open.dataset.open);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!tourEl.hidden) { endTour(camera, controls); return; }
    if (!panel.hidden) {
      if (panelMode === "search") { qInput.value = ""; clearSearch(); }
      hidePanel(true);
      return;
    }
    if (!listEl.hidden) toggleList(false);
  });
  refreshGlow();
}

const fail = (msg) => {
  loadingEl.textContent = msg;
  toggleList(true);
};

if (!DATA || !DATA.topics || !DATA.v) {
  fail("找不到影片資料。");
} else {
  try { boot(); }
  catch (err) {
    console.error(err);
    fail("這台裝置無法顯示立體小島，請改用清單。");
  }
}
