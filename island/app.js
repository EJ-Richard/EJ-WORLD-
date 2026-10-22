import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

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

const SHORT = {
  basic: "基礎", diag: "問切", herb: "中藥", formula: "方劑", acu: "針灸", tuina: "推拿",
  food: "食療", season: "節氣", internal: "內科", gyn: "婦科", ped: "兒科", skin: "皮膚",
  eent: "五官", mind: "情志", onco: "腫瘤", other: "其他",
};
const POS = {
  internal: [0.2, 0.15], basic: [-6.4, -3.3], herb: [-2.6, -7.2], food: [3.6, -7.0],
  season: [8.2, -4.6], skin: [10.0, 0.4], eent: [7.4, 6.0], mind: [2.0, 7.6],
  ped: [-3.4, 8.0], gyn: [-8.2, 5.4], tuina: [-8.6, 0.2], onco: [5.4, 2.4],
  acu: [-7.2, -7.4], formula: [-11.0, -3.6], diag: [0.6, -11.0], other: [11.0, 4.8],
};
const TILE = {
  basic: 0xf0e2b0, diag: 0xe7efe8, herb: 0xc6d7a4, formula: 0xead6b4, acu: 0xf3e3d2,
  tuina: 0xd5e2c6, food: 0xf6e0c2, season: 0xd9e6c4, internal: 0xe5f0e4, gyn: 0xf6dce4,
  ped: 0xf8efc6, skin: 0xf7efe4, eent: 0xd4ebe7, mind: 0xdce3f1, onco: 0xf3e7c8, other: 0xe7e1d4,
};
const ZS = 0.92;

const reduced = matchMedia("(prefers-reduced-motion: reduce)");
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
const movers = [];
const pickables = [];
let sim = 0;

$("#brand-sub").textContent = `${DATA.topics.length} 座園區・${DATA.v.length} 支影片`;

function tileRadius(n) { return 1.28 + 0.78 * Math.sqrt(n / maxCount); }
function liftOf(n) { return 0.7 + 2.05 * Math.sqrt(n / maxCount); }
function coast(a) {
  return 17.2 + Math.sin(a * 3) * 1.15 + Math.cos(a * 5) * 0.55 + Math.sin(a * 7 + 0.6) * 0.3;
}
function makeShape(scale) {
  const s = new THREE.Shape();
  const N = 80;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = coast(a) * scale;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  return s;
}
function layFlat(geo) {
  geo.rotateX(-Math.PI / 2);
  geo.scale(1, 1, -1);
  geo.computeBoundingBox();
  geo.translate(0, -geo.boundingBox.max.y, 0);
  geo.computeVertexNormals();
  return geo;
}
function facet(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  return g;
}

function boot() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd7ebe4);
  scene.fog = new THREE.Fog(0xd7ebe4, 52, 110);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 240);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setClearColor(0xd7ebe4, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.insertBefore(renderer.domElement, $("#labels"));
  const labelRenderer = new CSS2DRenderer({ element: $("#labels") });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced.matches;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.75;
  controls.zoomSpeed = 0.85;
  controls.minDistance = 5;
  controls.maxDistance = 42;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = 1.12;
  controls.maxTargetRadius = 26;

  scene.add(new THREE.HemisphereLight(0xfff3dd, 0x6a8a62, 0.95));
  scene.add(new THREE.AmbientLight(0xfff4e6, 0.38));
  const sun = new THREE.DirectionalLight(0xfff7ea, 1.3);
  sun.position.set(14, 22, 10);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xd5efe8, 0.32);
  fill.position.set(-12, 8, -8);
  scene.add(fill);

  const GEOS = {
    box: facet(new THREE.BoxGeometry(1, 1, 1)),
    cyl: facet(new THREE.CylinderGeometry(0.5, 0.5, 1, 6)),
    cone: facet(new THREE.ConeGeometry(0.5, 1, 6)),
    sph: facet(new THREE.SphereGeometry(0.5, 7, 5)),
    ico: facet(new THREE.IcosahedronGeometry(0.5, 0)),
    tor: facet(new THREE.TorusGeometry(0.5, 0.16, 5, 10)),
    disc: facet(new THREE.CircleGeometry(1, 22)),
    ring: new THREE.RingGeometry(0.86, 1.04, 28),
  };
  const mats = new Map();
  function lambert(color) {
    let m = mats.get(color);
    if (!m) {
      m = new THREE.MeshLambertMaterial({ color, flatShading: true });
      mats.set(color, m);
    }
    return m;
  }
  const basics = new Map();
  function basic(color, opts) {
    const key = color + (opts ? "t" : "");
    if (!basics.has(key)) basics.set(key, new THREE.MeshBasicMaterial({ color, ...opts }));
    return basics.get(key);
  }
  function piece(parent, shape, color, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, kind = "l") {
    const m = new THREE.Mesh(GEOS[shape], kind === "b" ? basic(color) : lambert(color));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.set(rx, ry, rz);
    parent.add(m);
    return m;
  }
  function sit(parent, shape, color, x, z, sx, sy, sz, ry = 0, kind = "l") {
    return piece(parent, shape, color, x, sy / 2, z, sx, sy, sz, 0, ry, 0, kind);
  }

  buildSea(scene);
  buildIsland(scene, lambert);
  buildDistricts(scene, GEOS, lambert, piece, sit);
  buildLinks(scene);
  buildShore(scene, GEOS, lambert);
  buildPeople(scene, GEOS, lambert, piece);

  const home = homePose();
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
    camera.fov = portrait ? 58 : 38;
    if (!birdOn) controls.maxDistance = portrait ? 130 : 48;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    document.body.classList.toggle("show-names", w >= 760 || camera.position.distanceTo(controls.target) < 20);
  }
  resize();
  window.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);

  renderer.domElement.addEventListener("pointerdown", (e) => {
    down = { x: e.clientX, y: e.clientY };
  });
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
    if (hit?.object.userData.topic) openTopic(hit.object.userData.topic);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    renderer.domElement.style.cursor = hit ? "pointer" : "";
  });

  buildList();
  wireUi(camera, controls);

  const water = scene.userData.water;
  let last = performance.now();
  let started = false;
  function frame(now) {
    requestAnimationFrame(frame);
    try {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      stepFlight(now, camera, controls);
      if (!paused) sim += dt;
      if (water?.uTime) water.uTime.value = sim;
      stepMovers();
      stepRings();
      const dist = camera.position.distanceTo(controls.target);
      document.body.classList.toggle("show-names", window.innerWidth >= 760 || dist < 20);
      if (!flight) controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      if (!started) {
        started = true;
        loadingEl.classList.add("hide");
        if (!localStorage.getItem("daai-island-tour-v1")) openTour(camera, controls);
      }
    } catch (err) {
      console.error(err);
      if (!started) fail("這台裝置無法顯示立體小島，請改用清單。");
      started = true;
    }
  }
  requestAnimationFrame(frame);
}

function homePose() {
  if (window.innerWidth / window.innerHeight < 0.85) {
    return { p: new THREE.Vector3(0.2, 50, 18), t: new THREE.Vector3(0, 0, 0) };
  }
  return { p: new THREE.Vector3(14, 13.5, 19), t: new THREE.Vector3(0, 0.3, 0) };
}
function birdPose() {
  if (window.innerWidth < 760) return { p: new THREE.Vector3(0.2, 78, 0.2), t: new THREE.Vector3(0, 0, 0) };
  return { p: new THREE.Vector3(0.4, 30, 0.4), t: new THREE.Vector3(0, 0, 0) };
}
function applyLimits(controls) {
  const portrait = window.innerWidth < 760;
  if (birdOn) {
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = 0.75;
    controls.minDistance = 14;
    controls.maxDistance = portrait ? 140 : 52;
  } else {
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = 1.15;
    controls.minDistance = portrait ? 8 : 5;
    controls.maxDistance = portrait ? 130 : 48;
  }
}
function fly(camera, controls, p, t, ms) {
  const dur = reduced.matches ? 1 : (ms ?? 880);
  flight = {
    fromP: camera.position.clone(),
    fromT: controls.target.clone(),
    toP: p.clone(),
    toT: t.clone(),
    t0: performance.now(),
    dur,
  };
  controls.enabled = false;
}
function stepFlight(now, camera, controls) {
  if (!flight) return;
  const k = Math.min(1, (now - flight.t0) / flight.dur);
  const s = k * k * (3 - 2 * k);
  camera.position.lerpVectors(flight.fromP, flight.toP, s);
  controls.target.lerpVectors(flight.fromT, flight.toT, s);
  controls.update();
  if (k >= 1) {
    flight = null;
    controls.enabled = true;
  }
}
function viewFor(id) {
  const d = districts.get(id);
  const target = new THREE.Vector3(d.x, 0.8, d.z);
  const outward = new THREE.Vector3(d.x, 0, d.z);
  if (outward.lengthSq() < 0.25) outward.set(1, 0, 1.15);
  outward.normalize();
  const portrait = window.innerWidth < 760;
  const dist = portrait ? 6.6 : 5.4;
  const height = portrait ? 5.8 : 3.7;
  const pos = new THREE.Vector3(d.x + outward.x * dist, height, d.z + outward.z * dist);
  if (portrait) {
    target.addScaledVector(outward, 2.3);
    target.y = 0.15;
  } else {
    const up = new THREE.Vector3(0, 1, 0);
    const dir = target.clone().sub(pos).normalize();
    const right = new THREE.Vector3().crossVectors(up, dir).normalize();
    target.addScaledVector(right, 1.2);
  }
  return { p: pos, t: target };
}

function buildSea(scene) {
  const uniforms = {
    uTime: { value: 0 },
    uShallow: { value: new THREE.Color(0x8ec9bf) },
    uDeep: { value: new THREE.Color(0x3e807c) },
    uSky: { value: new THREE.Color(0xd7ebe4) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorld;
      void main() {
        vec3 pos = position;
        float dist = length(pos.xy);
        float wave = sin(pos.x * 0.42 + uTime * 0.9) + cos(pos.y * 0.33 + uTime * 0.7);
        pos.z += wave * 0.05 * smoothstep(60.0, 12.0, dist);
        vec4 world = modelMatrix * vec4(pos, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uSky;
      varying vec3 vWorld;
      void main() {
        float d = length(vWorld.xz);
        vec3 col = mix(uShallow, uDeep, smoothstep(4.0, 26.0, d));
        float shore = smoothstep(1.6, 0.0, abs(d - 16.2));
        col = mix(col, vec3(0.93, 0.97, 0.94), shore * 0.45);
        col = mix(col, uSky, smoothstep(30.0, 78.0, d));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(220, 220, 40, 40), mat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.62;
  scene.add(sea);
  scene.userData.water = mat.uniforms;

  const shade = new THREE.Mesh(
    new THREE.CircleGeometry(15.5, 40),
    new THREE.MeshBasicMaterial({ color: 0x1c4746, transparent: true, opacity: 0.22, depthWrite: false })
  );
  shade.rotation.x = -Math.PI / 2;
  shade.position.y = -0.58;
  shade.scale.set(1, ZS, 1);
  scene.add(shade);
}

function buildIsland(scene, lambert) {
  const group = new THREE.Group();
  group.scale.z = ZS;
  const sandGeo = layFlat(new THREE.ExtrudeGeometry(makeShape(1), {
    depth: 0.85, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.32, bevelSegments: 1, curveSegments: 1,
  }));
  const sand = new THREE.Mesh(sandGeo, lambert(0xe4cb93));
  sand.material.side = THREE.DoubleSide;
  group.add(sand);
  const grassGeo = layFlat(new THREE.ShapeGeometry(makeShape(0.9)));
  const grass = new THREE.Mesh(grassGeo, lambert(0x8eae68));
  grass.position.y = 0.03;
  group.add(grass);
  scene.add(group);
}

function buildDistricts(scene, GEOS, lambert, piece, sit) {
  DATA.topics.forEach((topic, index) => {
    const n = counts[topic.id] || 0;
    const r = tileRadius(n);
    const lift = liftOf(n);
    const spot = POS[topic.id] || [Math.cos(index) * 12, Math.sin(index) * 12];
    const root = new THREE.Group();
    root.position.set(spot[0], 0.06, spot[1]);
    scene.add(root);

    const disc = new THREE.Mesh(GEOS.disc, lambert(TILE[topic.id] || 0xe7e1d4));
    disc.rotation.x = -Math.PI / 2;
    disc.scale.set(r, r, r);
    disc.position.y = 0.02;
    root.add(disc);

    const theme = new THREE.Group();
    theme.rotation.y = Math.PI / 4 + ((hash(topic.id) % 7) - 3) * 0.1;
    root.add(theme);
    buildTheme(theme, topic.id, lift, piece, sit);

    const shade = new THREE.Mesh(GEOS.disc, new THREE.MeshBasicMaterial({
      color: 0x1b2822, transparent: true, opacity: 0, depthWrite: false,
    }));
    shade.rotation.x = -Math.PI / 2;
    shade.scale.set(r, r, r);
    shade.position.y = 0.05;
    shade.renderOrder = 2;
    root.add(shade);

    const ring = new THREE.Mesh(GEOS.ring, new THREE.MeshBasicMaterial({
      color: 0xf0c14e, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.scale.setScalar(r);
    ring.position.y = 0.07;
    ring.renderOrder = 3;
    root.add(ring);

    const lab = document.createElement("div");
    lab.className = "lab";
    lab.innerHTML = `<button type="button" class="pin" data-id="${topic.id}" aria-label="${esc(topic.name)}，${n} 支影片"><span class="seal">${esc(topic.ic)}</span><span class="nm full">${esc(topic.name)}</span><span class="nm short">${esc(SHORT[topic.id] || topic.ic)}</span></button>`;
    const pin = lab.querySelector("button");
    pin.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      openTopic(topic.id);
    });
    const label = new CSS2DObject(lab);
    label.center.set(0.5, 1);
    label.position.set(0, lift + 0.75, 0);
    root.add(label);

    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.userData.topic = topic.id;
        pickables.push(obj);
      }
    });

    districts.set(topic.id, {
      id: topic.id, x: spot[0], z: spot[1], r, lift, root, shade, ring, pin, glow: 0, ringColor: 0xf0c14e, phase: index,
    });
  });
}

function buildTheme(g, id, lift, piece, sit) {
  const C = {
    cream: 0xf6f1e4, wood: 0x8d5a34, woodlt: 0xc49262, clay: 0xc46a42, jade: 0x3f6b52,
    ink: 0x2c2926, white: 0xfffaf3, pink: 0xe7a3b4, water: 0x6aa8b0, gold: 0xe2b34a,
    leaf: 0x6f914c, leaflight: 0x8fb56a, orange: 0xe08a3c, red: 0xc4543a, blue: 0x6a90b8,
    straw: 0xd8b56a, pot: 0xd7b48a, cloth: 0xf0e2c8, night: 0x3d4a66,
  };
  if (id === "basic") {
    sit(g, "cyl", C.cream, 0, 0, 1.2, 0.1, 1.2);
    piece(g, "sph", C.ink, -0.16, 0.28, 0, 0.4, 0.4, 0.4);
    piece(g, "sph", C.white, 0.16, 0.28, 0, 0.4, 0.4, 0.4);
    piece(g, "sph", C.white, -0.16, 0.34, 0.1, 0.12, 0.12, 0.12);
    piece(g, "sph", C.ink, 0.16, 0.34, -0.1, 0.12, 0.12, 0.12);
    piece(g, "tor", C.gold, 0, 0.24, 0, 0.92, 0.92, 0.92, Math.PI / 2);
    [C.leaf, C.red, C.gold, C.white, C.blue].forEach((c, i) => {
      const a = (i / 5) * Math.PI * 2;
      sit(g, "cone", c, Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0.16, 0.28, 0.16);
    });
    sit(g, "box", C.straw, 0.85, 0.15, 0.16, lift * 0.85, 0.12);
  } else if (id === "diag") {
    sit(g, "box", C.woodlt, 0, 0.05, 0.9, 0.42, 0.55);
    piece(g, "box", C.cream, 0, 0.55, 0.05, 0.85, 0.12, 0.5);
    piece(g, "sph", C.cloth, 0.15, 0.68, 0.05, 0.28, 0.16, 0.22);
    piece(g, "box", C.white, 0, lift * 0.55, -0.35, 0.55, lift, 0.08);
    piece(g, "box", C.red, 0, lift * 0.7, -0.28, 0.16, 0.16, 0.04, 0, 0, 0, "b");
    sit(g, "cyl", C.gold, -0.48, 0.35, 0.06, 0.55, 0.06);
  } else if (id === "herb") {
    [[-0.4, -0.15, 0.85], [0.15, 0.3, 1], [-0.15, -0.5, 0.7], [0.5, -0.2, 0.8], [0.05, 0.05, 0.55]].forEach(([x, z, s]) => {
      sit(g, "cyl", C.wood, x, z, 0.05, 0.16 * s, 0.05);
      piece(g, "cone", C.leaf, x, 0.16 * s + 0.2 * s, z, 0.36 * s, 0.46 * s, 0.36 * s);
      piece(g, "cone", C.leaflight, x + 0.06, 0.16 * s + 0.38 * s, z - 0.04, 0.24 * s, 0.3 * s, 0.24 * s);
    });
    sit(g, "box", C.pot, 0.62, -0.45, 0.28, 0.22, 0.28);
    sit(g, "cyl", C.wood, -0.5, 0.55, 0.05, lift, 0.05);
    sit(g, "cyl", C.wood, 0.45, 0.55, 0.05, lift, 0.05);
    piece(g, "box", C.wood, -0.02, lift, 0.55, 1.05, 0.05, 0.05);
    for (let i = -1; i <= 1; i++) piece(g, "box", i === 0 ? C.straw : C.leaf, i * 0.26, lift - 0.22, 0.55, 0.1, 0.26, 0.05);
  } else if (id === "formula") {
    sit(g, "cyl", C.pot, 0, 0, 0.7, 0.28, 0.7);
    sit(g, "cyl", C.cream, 0, 0, 0.42, 0.16, 0.42);
    piece(g, "cyl", C.wood, 0.28, 0.32, 0.1, 0.08, 0.55, 0.08, 0, 0, 0.9);
    sit(g, "box", C.wood, -0.15, -0.55, 0.7, lift * 0.72, 0.28);
    for (let i = 0; i < 3; i++) {
      sit(g, "cyl", i === 1 ? C.jade : C.clay, -0.32 + i * 0.18, -0.55, 0.12, 0.2 + i * 0.04, 0.12);
      piece(g, "cyl", C.gold, -0.32 + i * 0.18, 0.26 + i * 0.04, -0.55, 0.1, 0.05, 0.1);
    }
    piece(g, "box", C.white, 0.45, 0.16, 0.2, 0.28, 0.08, 0.2, 0.2, 0.4, 0);
  } else if (id === "acu") {
    piece(g, "sph", C.cloth, 0, 0.16, 0, 0.7, 0.22, 0.5);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const h = lift * (0.45 + (i % 3) * 0.2);
      const x = Math.cos(a) * 0.26, z = Math.sin(a) * 0.18;
      piece(g, "cyl", 0xd5d0c8, x, h / 2, z, 0.02, h, 0.02);
      piece(g, "sph", C.gold, x, h + 0.03, z, 0.07, 0.07, 0.07, 0, 0, 0, "b");
    }
    sit(g, "cone", C.orange, 0.55, 0.15, 0.16, 0.28, 0.16);
  } else if (id === "tuina") {
    sit(g, "box", C.wood, -0.35, 0, 0.08, 0.55, 0.08);
    sit(g, "box", C.wood, 0.35, 0, 0.08, 0.55, 0.08);
    piece(g, "box", C.cream, 0, 0.62, 0, 1.15, 0.12, 0.48);
    piece(g, "cyl", C.cloth, 0.28, 0.78, 0, 0.16, 0.16, 0.32, Math.PI / 2, 0, Math.PI / 2);
    sit(g, "cyl", C.woodlt, -0.7, 0.45, 0.22, 0.36, 0.22);
    sit(g, "box", C.jade, 0.72, -0.15, 0.16, lift * 0.7, 0.12);
  } else if (id === "food") {
    sit(g, "box", C.wood, 0, 0, 0.9, 0.5, 0.55);
    piece(g, "box", C.straw, 0, 0.58, 0, 0.95, 0.1, 0.55);
    piece(g, "box", C.clay, 0, 0.58 + lift * 0.42, 0, 1.15, 0.1, 0.85);
    sit(g, "cyl", C.wood, -0.48, -0.32, 0.05, lift * 0.85, 0.05);
    sit(g, "cyl", C.wood, 0.48, -0.32, 0.05, lift * 0.85, 0.05);
    piece(g, "sph", C.pot, 0.15, 0.82, 0.05, 0.28, 0.22, 0.28);
    piece(g, "cyl", C.pot, 0.32, 0.84, 0.05, 0.08, 0.08, 0.16, 0, 0, Math.PI / 2);
    piece(g, "cone", C.wood, 0.15, 0.98, 0.05, 0.16, 0.1, 0.16);
    sit(g, "cyl", C.cream, -0.28, 0.12, 0.16, 0.1, 0.16);
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xfffaf4, transparent: true, opacity: 0.65, depthWrite: false });
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), steamMat.clone());
      puff.position.set(0.15 + i * 0.05, 1.15, 0.05);
      g.add(puff);
      movers.push({ type: "steam", mesh: puff, base: 1.12, phase: i * 0.33 });
    }
  } else if (id === "season") {
    const trees = [
      [-0.45, -0.35, C.pink, 0.72],
      [0.45, -0.3, C.leaf, 1],
      [0.4, 0.4, C.orange, 0.82],
      [-0.4, 0.38, 0xf4f7fb, 0.62],
    ];
    trees.forEach(([x, z, col, s]) => {
      const h = lift * 0.55 * s;
      sit(g, "cyl", C.wood, x, z, 0.07, h * 0.55, 0.07);
      piece(g, "cone", col, x, h * 0.55 + h * 0.35, z, 0.38 * s, h * 0.7, 0.38 * s);
    });
  } else if (id === "internal") {
    sit(g, "box", C.cream, 0, 0, 1.05, lift, 0.82);
    piece(g, "cone", C.jade, 0, lift + 0.2, 0, 1.35, 0.5, 1.12);
    piece(g, "box", C.ink, 0, lift * 0.28, 0.43, 0.22, lift * 0.4, 0.06);
    piece(g, "box", C.gold, -0.3, lift * 0.62, 0.43, 0.18, 0.18, 0.04, 0, 0, 0, "b");
    piece(g, "box", C.gold, 0.3, lift * 0.62, 0.43, 0.18, 0.18, 0.04, 0, 0, 0, "b");
    piece(g, "box", C.woodlt, 0, 0.08, 0.62, 0.38, 0.16, 0.24);
    piece(g, "sph", C.gold, 0.62, lift * 0.7, 0.2, 0.12, 0.14, 0.12, 0, 0, 0, "b");
  } else if (id === "gyn") {
    sit(g, "cyl", C.water, 0, 0.1, 0.85, 0.08, 0.85);
    [[0, 0.05], [-0.28, 0.22], [0.26, -0.12]].forEach(([x, z], i) => {
      piece(g, "cone", C.pink, x, 0.2, z, 0.22, 0.16, 0.22);
      piece(g, "sph", C.gold, x, 0.26, z, 0.08, 0.08, 0.08, 0, 0, 0, "b");
    });
    [[-0.45, -0.4], [0.45, -0.4], [-0.45, 0.15], [0.45, 0.15]].forEach(([x, z]) => {
      sit(g, "cyl", C.woodlt, x, z, 0.05, lift * 0.55, 0.05);
    });
    piece(g, "box", C.pink, 0, lift * 0.58, -0.12, 1.05, 0.08, 0.7);
    piece(g, "cone", 0xf3c2d0, 0, lift * 0.58 + 0.16, -0.12, 1.15, 0.32, 0.8);
  } else if (id === "ped") {
    sit(g, "box", C.wood, 0, 0.15, 0.16, 0.16, 0.16);
    piece(g, "box", C.straw, 0, 0.32, 0.15, 0.7, 0.06, 0.16, 0, 0, 0.25);
    sit(g, "cyl", C.wood, -0.55, -0.4, 0.06, 0.4, 0.06);
    piece(g, "cone", C.leaflight, -0.55, 0.55, -0.4, 0.36, 0.4, 0.36);
    const kite = new THREE.Group();
    piece(kite, "box", C.red, 0, 0, 0, 0.42, 0.42, 0.03, 0, 0, Math.PI / 4);
    piece(kite, "box", C.gold, 0, -0.26, 0, 0.07, 0.14, 0.02);
    piece(kite, "box", C.cream, 0, -0.4, 0, 0.06, 0.12, 0.02);
    kite.position.set(0.25, lift, 0.15);
    g.add(kite);
    movers.push({ type: "bob", mesh: kite, base: lift, amp: 0.16, speed: 1.1, phase: 0.6 });
  } else if (id === "skin") {
    sit(g, "cyl", C.cream, -0.28, 0.05, 0.55, 0.22, 0.55);
    sit(g, "cyl", C.water, -0.28, 0.05, 0.4, 0.08, 0.4);
    sit(g, "cyl", C.pot, 0.32, -0.2, 0.42, 0.28, 0.42);
    piece(g, "cone", C.leaf, 0.32, 0.42, -0.2, 0.5, 0.1, 0.5, 0, 0, 0.4);
    sit(g, "cyl", C.white, 0.1, 0.45, 0.16, 0.22, 0.16);
    piece(g, "sph", C.white, 0.1, 0.36, 0.45, 0.14, 0.1, 0.14);
    sit(g, "box", C.cloth, -0.1, -0.5, 0.4, lift * 0.45, 0.08);
  } else if (id === "eent") {
    sit(g, "cyl", C.cream, 0, 0, 0.62, lift * 0.8, 0.62);
    piece(g, "cone", C.clay, 0, lift * 0.8 + 0.16, 0, 0.9, 0.36, 0.9);
    piece(g, "tor", C.blue, 0, lift * 0.48, 0.32, 0.28, 0.28, 0.28, Math.PI / 2);
    sit(g, "box", C.woodlt, 0, 0.55, 0.7, 0.16, 0.28);
    [C.blue, C.gold, C.pink, C.leaf, C.orange].forEach((c, i) => {
      piece(g, "sph", c, -0.28 + i * 0.14, 0.32, 0.55, 0.1, 0.1, 0.1, 0, 0, 0, "b");
    });
  } else if (id === "mind") {
    piece(g, "box", C.woodlt, 0, 0.2, 0.1, 0.95, 0.22, 0.55);
    piece(g, "box", C.night, 0.05, 0.36, 0.05, 0.7, 0.1, 0.48);
    piece(g, "box", C.white, -0.28, 0.4, 0.05, 0.22, 0.12, 0.28);
    const moon = piece(g, "sph", 0xf4e6b8, 0.15, lift, -0.15, 0.42, 0.42, 0.42, 0, 0, 0, "b");
    movers.push({ type: "bob", mesh: moon, base: lift, amp: 0.1, speed: 0.7, phase: 0.2 });
    [[-0.45, lift * 0.7, 0.35], [0.55, lift * 0.45, -0.4], [-0.2, lift * 0.9, 0.45]].forEach(([x, y, z], i) => {
      const star = piece(g, "ico", C.gold, x, y, z, 0.08, 0.08, 0.08, 0, 0, 0, "b");
      movers.push({ type: "bob", mesh: star, base: y, amp: 0.06, speed: 1.4, phase: i });
    });
  } else if (id === "onco") {
    piece(g, "tor", C.straw, 0, 0.12, 0, 0.9, 0.9, 0.9, Math.PI / 2);
    [[-0.35, 0.2], [0.4, 0.15], [0.05, -0.4]].forEach(([x, z], i) => {
      const h = lift * (0.55 + i * 0.12);
      sit(g, "cyl", C.wood, x, z, 0.04, h, 0.04);
      piece(g, "sph", C.gold, x, h + 0.08, z, 0.12, 0.14, 0.12, 0, 0, 0, "b");
    });
    [[-0.1, 0.45], [0.2, 0.35], [-0.25, -0.1]].forEach(([x, z]) => {
      sit(g, "cone", C.white, x, z, 0.1, 0.16, 0.1);
    });
    piece(g, "cone", C.clay, 0.55, 0.28, -0.35, 0.4, 0.28, 0.4);
  } else {
    sit(g, "cyl", C.wood, 0, 0, 0.06, lift * 0.75, 0.06);
    piece(g, "cone", C.clay, 0, lift * 0.72, 0, 1.15, 0.28, 1.15);
    sit(g, "box", C.woodlt, -0.45, 0.25, 0.28, 0.22, 0.28);
    sit(g, "box", C.straw, 0.4, 0.2, 0.32, 0.2, 0.26);
    sit(g, "cyl", C.pot, 0.15, -0.45, 0.22, 0.2, 0.22);
    piece(g, "box", C.cream, -0.1, 0.2, -0.4, 0.5, 0.32, 0.16);
  }
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
    const p = new THREE.Vector3(a.x, 0.12, a.z).addScaledVector(dir, a.r * 0.72);
    const q = new THREE.Vector3(b.x, 0.12, b.z).addScaledVector(dir, -b.r * 0.72);
    const mid = p.clone().lerp(q, 0.5);
    mid.y += 0.35 + Math.min(1.8, len * 0.06);
    const curve = new THREE.QuadraticBezierCurve3(p, mid, q);
    const N = 9;
    const half = 0.025 + Math.min(0.11, w / 90);
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
      color: 0xe6c36a, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide,
    }));
    mesh.renderOrder = 1;
    mesh.visible = w >= 6;
    scene.add(mesh);
    links.push({ a: aId, b: bId, w, mesh });
  }
}

function buildShore(scene, GEOS, lambert) {
  const spots = [];
  for (let i = 0; i < 42; i++) {
    const a = (i / 42) * Math.PI * 2 + 0.15;
    const inset = 0.78 + (i % 4) * 0.05;
    const r = coast(a) * inset;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r * ZS;
    if ([...districts.values()].some((d) => Math.hypot(x - d.x, z - d.z) < d.r + 0.7)) continue;
    spots.push({ x, z, s: 0.75 + (i % 5) * 0.12, rot: i, blossom: i % 6 === 0, autumn: i % 7 === 0 });
  }
  const trunk = new THREE.InstancedMesh(GEOS.cyl, lambert(0xffffff), spots.length);
  const leaf = new THREE.InstancedMesh(GEOS.cone, lambert(0xffffff), spots.length);
  trunk.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  const colors = [0x6e944e, 0x7ea85a, 0x5d8344, 0xe7a0b4, 0xd98a55];
  spots.forEach((p, i) => {
    dummy.position.set(p.x, p.s * 0.28, p.z);
    dummy.rotation.set(0, p.rot, 0);
    dummy.scale.set(0.1, p.s * 0.55, 0.1);
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
    dummy.position.set(p.x, p.s * 0.7, p.z);
    dummy.scale.set(p.s * 0.55, p.s * 0.7, p.s * 0.55);
    dummy.updateMatrix();
    leaf.setMatrixAt(i, dummy.matrix);
    const col = p.blossom ? 0xe7a0b4 : p.autumn ? 0xd98a55 : colors[i % 3];
    leaf.setColorAt(i, new THREE.Color(col));
    trunk.setColorAt(i, new THREE.Color(0x8a5a38));
  });
  trunk.instanceColor.needsUpdate = true;
  leaf.instanceColor.needsUpdate = true;
  trunk.frustumCulled = false;
  leaf.frustumCulled = false;
  scene.add(trunk, leaf);

  const rocks = new THREE.InstancedMesh(GEOS.ico, lambert(0xffffff), 16);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.4;
    const r = coast(a) * 0.98;
    dummy.position.set(Math.cos(a) * r, -0.15, Math.sin(a) * r * ZS);
    dummy.rotation.set(i, i * 0.7, 0);
    const s = 0.28 + (i % 3) * 0.12;
    dummy.scale.set(s, s * 0.7, s);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    rocks.setColorAt(i, new THREE.Color(i % 2 ? 0xcbb99a : 0xb7a488));
  }
  rocks.instanceColor.needsUpdate = true;
  rocks.frustumCulled = false;
  scene.add(rocks);
}

function buildPeople(scene, GEOS, lambert, piece) {
  const colors = [0x3f6b52, 0xc46a42, 0xe2b34a, 0x6a90b8, 0xf6f1e4];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    piece(g, "cone", colors[i], 0, 0.22, 0, 0.16, 0.28, 0.16);
    piece(g, "sph", 0xf3d2b8, 0, 0.42, 0, 0.12, 0.12, 0.12);
    scene.add(g);
    movers.push({ type: "walk", mesh: g, phase: (i / 5) * Math.PI * 2 });
  }
}

function stepMovers() {
  for (const m of movers) {
    if (m.type === "bob") {
      const y = paused ? m.base : m.base + Math.sin(sim * m.speed + m.phase) * m.amp;
      m.mesh.position.y = y;
    } else if (m.type === "steam") {
      if (paused) continue;
      const u = (sim * 0.45 + m.phase) % 1;
      m.mesh.position.y = m.base + u * 0.55;
      m.mesh.material.opacity = (1 - u) * 0.7;
      m.mesh.scale.setScalar(0.7 + u);
    } else if (m.type === "walk") {
      if (paused) continue;
      const a = sim * 0.18 + m.phase;
      const R = 4.15;
      m.mesh.position.set(Math.cos(a) * R + 0.2, 0.06, Math.sin(a) * R * 0.9);
      m.mesh.rotation.y = -a + Math.PI / 2;
    }
  }
  for (const d of districts.values()) {
    const target = d.id === selected ? 0.2 : 0;
    d.root.position.y += ((0.06 + target) - d.root.position.y) * (paused ? 1 : 0.12);
  }
}

function stepRings() {
  for (const d of districts.values()) {
    const pulse = paused ? 1 : 0.75 + 0.25 * Math.sin(sim * 2 + d.phase);
    const aim = d.glow * (d.glow >= 1 ? 0.95 : 0.35 + 0.6 * pulse);
    d.ring.material.opacity += (aim - d.ring.material.opacity) * 0.18;
    d.ring.material.color.setHex(d.ringColor);
  }
}

function refreshGlow() {
  let maxC = 1;
  const y = Number(yearInput.value);
  if (timeOn) {
    for (const t of DATA.topics) maxC = Math.max(maxC, byYear[y][t.id] || 0);
  }
  for (const d of districts.values()) {
    let glow = 0;
    let color = 0xf0c14e;
    if (timeOn) {
      glow = (byYear[y][d.id] || 0) / maxC;
      color = 0xd2ee78;
    }
    if (searchOn && hot.has(d.id)) {
      glow = 1;
      color = 0xffe08a;
    } else if (searchOn) glow = 0;
    if (d.id === selected) {
      glow = 1;
      color = 0xf0c14e;
    }
    d.glow = glow;
    d.ringColor = color;
    d.pin.classList.toggle("hot", searchOn && hot.has(d.id));
    d.pin.classList.toggle("on", d.id === selected);
    d.shade.material.opacity = searchOn && !hot.has(d.id) ? 0.45 : 0;
  }
  for (const link of links) {
    const touch = selected && (link.a === selected || link.b === selected);
    const both = searchOn && hot.has(link.a) && hot.has(link.b);
    link.mesh.visible = link.w >= 6 || touch || both;
    const t = Math.min(1, link.w / 40);
    link.mesh.material.opacity = touch || both ? 0.55 + 0.4 * t : 0.34 + 0.4 * t;
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
    if (t.name.includes(query) || t.sub.includes(query) || t.ic === query) score[t.id] = (score[t.id] || 0) + 80;
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
    if (query.length >= 1 && (t.name.includes(query) || t.ic === query || (query.length >= 2 && t.sub.includes(query)))) hot.add(t.id);
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
  const links = DOCS[name]?.links || {};
  const profile = links.prof || "";
  const reg = links.reg || links.regDept || "";
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
    <p class="eyebrow">主題園區</p>
    <h2><span class="mini-seal" style="display:inline-grid;vertical-align:middle;margin-right:6px">${esc(t.ic)}</span>${esc(t.name)}</h2>
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
    <p class="sub">${syms.length ? `對上症狀：${syms.map((s) => esc(s.w)).join("、")}。` : "依標題、說明與關鍵字查找。"}相關園區會亮起來。</p>
    ${zones.length ? `<div class="chips">${zones.map((t) => `<button type="button" class="chip plain" data-open="${t.id}">${esc(t.ic)} ${esc(t.name)}</button>`).join("")}</div>` : ""}
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
  live.textContent = `已打開${TOPICS[id].name}，${counts[id]} 支影片`;
}
function goHome() {
  const controls = openTopic.controls;
  const camera = openTopic.camera;
  birdOn = false;
  btnBird.setAttribute("aria-pressed", "false");
  applyLimits(controls);
  const pose = homePose();
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
  yearNote.textContent = `${y} 年 ${yearVideoCount[y] || 0} 支影片・${best.name}最亮（${bn} 支主題收錄）`;
}
function buildList() {
  listBody.innerHTML = DATA.topics.map((t) => `
    <button type="button" class="topic-btn" data-topic="${t.id}">
      <span class="seal">${esc(t.ic)}</span>
      <span class="txt"><b>${esc(t.name)}</b><small>${esc(t.sub)}</small></span>
      <em>${counts[t.id] || 0}</em>
    </button>`).join("");
}
function hash(s) {
  let h = 0;
  for (const c of s) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return h;
}

const TOUR = [
  { title: "歡迎來到大愛學漢醫島", body: "十六座園區對應節目裡的中醫主題。地面愈大、屋子愈高，收錄的影片愈多。", pose: "home" },
  { title: "主題會彼此牽線", body: "園區之間的光帶，代表同一支影片同時談到兩邊。共通的影片愈多，光帶愈亮。", pose: "home" },
  { title: "點一下，走進去", body: "點地面或名牌，鏡頭會飛近。旁邊列出影片、常出現的醫師，以及相關症狀。", pose: "herb" },
  { title: "用一句不適找路", body: "上方可以搜尋「失眠」或「便秘」。對得上的園區會亮起來，並列出影片。", pose: "home" },
  { title: "清單與年份", body: "☰ 清單用文字瀏覽每一座園區。◷ 時間把年份撥到 2022 至 2026，看當時哪些主題最熱鬧。", pose: "bird" },
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
    const pose = homePose();
    fly(camera, controls, pose.p, pose.t, 700);
  } else if (step.pose === "bird") {
    birdOn = true;
    applyLimits(controls);
    const pose = birdPose();
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
  try { localStorage.setItem("daai-island-tour-v1", "1"); } catch (e) { /* ignore */ }
  birdOn = false;
  btnBird.setAttribute("aria-pressed", "false");
  applyLimits(controls);
  const pose = homePose();
  fly(camera, controls, pose.p, pose.t, 600);
}

function wireUi(camera, controls) {
  openTopic.camera = camera;
  openTopic.controls = controls;
  btnHome.addEventListener("click", () => {
    hidePanel(false);
    goHome();
  });
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
    const pose = birdOn ? birdPose() : homePose();
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
