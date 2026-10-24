// 慈濟四大志業島 — 原創 Three.js 導覽，不使用遊戲素材。
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { ISLANDS, LINKS, deedCount, findDeed } from "./data.js";

const REV = "missions-island-20261024";
void REV;

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));
const CN = ["一", "二", "三", "四", "五", "六", "七", "八"];

const stage = $("#stage");
const qInput = $("#q");
const panel = $("#panel");
const panelBody = $("#panel-body");
const listEl = $("#list");
const listBody = $("#list-body");
const listNote = $("#list-note");
const helpEl = $("#help");
const introEl = $("#intro");
const loadingEl = $("#loading");
const live = $("#live");
const fallbackEl = $("#fallback");
const chipsEl = $("#chips");
const petalBtn = $("#btn-petal");

const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const narrow = () => window.innerWidth < 800;
const byId = Object.fromEntries(ISLANDS.map((island) => [island.id, island]));
const totalDeeds = deedCount();

const state = {
  chip: "all",
  query: "",
  islandId: null,
  deedId: null,
  petalsOn: !reduced.matches,
  flight: null
};

$("#brand-sub").textContent = `一島一法印｜${ISLANDS.length} 座島・${totalDeeds} 則足跡`;
$("#foot-count").textContent = `${totalDeeds} 則足跡・附公開來源`;
petalBtn.setAttribute("aria-pressed", state.petalsOn ? "true" : "false");
petalBtn.textContent = state.petalsOn ? "花瓣開" : "花瓣關";

function say(text) { live.textContent = text; }

function chipLabel(island) {
  if (island.id === "intl") return "賑災";
  if (island.id === "marrow") return "骨髓";
  if (island.id === "community") return "社區";
  return island.name;
}

function renderChips() {
  const buttons = [
    `<button type="button" data-chip="all" aria-pressed="true">全部</button>`,
    `<button type="button" data-chip="mission" class="mission">四大志業</button>`,
    ...ISLANDS.map((island) => `<button type="button" data-chip="${island.id}">${chipLabel(island)}</button>`)
  ];
  chipsEl.innerHTML = buttons.join("");
}

function haystack(island, deed) {
  return [island.name, island.motto, island.blurb, deed.title, deed.summary, deed.heart, ...deed.facts]
    .join(" ")
    .toLowerCase();
}

function queryOk(island, deed) {
  const terms = state.query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = haystack(island, deed);
  return terms.every((term) => hay.includes(term));
}

function islandAllowed(island) {
  if (state.chip === "all") return true;
  if (state.chip === "mission") return island.mission;
  return state.chip === island.id;
}

function deedVisible(island, deed) {
  return islandAllowed(island) && queryOk(island, deed);
}

function visibleDeeds(island) {
  return island.deeds.filter((deed) => deedVisible(island, deed));
}

function eyebrow(island) {
  const n = CN[island.order - 1];
  return island.mission ? `四大志業・八大法印 ${n}` : `八大法印 ${n}`;
}

function cardInner(island, deed) {
  const siblings = island.deeds.map((item) => (
    `<button type="button" data-deed="${item.id}" class="${item.id === deed.id ? "on" : ""}">${esc(item.title)}</button>`
  )).join("");
  const facts = deed.facts.map((fact) => `<li>${esc(fact)}</li>`).join("");
  const sources = deed.sources.map((source) => (
    `<li><a href="${esc(source.url)}" target="_blank" rel="noopener"><b>${esc(source.title)}</b><span>${esc(source.outlet)}</span></a></li>`
  )).join("");
  return `
    <p class="eyebrow">${esc(eyebrow(island))}・${esc(island.motto)}</p>
    <h2>${esc(deed.title)}</h2>
    <p class="summary">${esc(deed.summary)}</p>
    <p class="heart"><b>這一念</b>　${esc(deed.heart)}</p>
    <h3>記得這些</h3>
    <ul>${facts}</ul>
    <h3>同一座島</h3>
    <div class="sib">${siblings}</div>
    <h3>公開來源</h3>
    <ul class="sources">${sources}</ul>
    <p class="fine">年份與數字只寫出處頁面上的內容。若與最新正式文件不同，以原頁為準。本頁由粉絲整理，不是慈濟官方網站。</p>
  `;
}

function renderList() {
  const parts = [];
  let shown = 0;
  for (const island of ISLANDS) {
    const deeds = visibleDeeds(island);
    if (!deeds.length && state.query) continue;
    if (!islandAllowed(island) && !state.query) continue;
    shown += deeds.length;
    const items = (deeds.length ? deeds : island.deeds).map((deed) => `
      <button type="button" class="deed-jump" data-deed="${deed.id}">
        <b>${esc(deed.title)}</b>
        <small>${esc(deed.heart)}</small>
      </button>
    `).join("");
    parts.push(`
      <section class="island-block">
        <button type="button" class="island-jump ${state.islandId === island.id ? "on" : ""}" data-island="${island.id}">
          <span class="seal" style="background:${island.color}">${esc(island.seal)}</span>
          <span>${esc(island.name)}<small style="display:block;color:#5d7082;font-weight:600"> ${esc(island.motto)}</small></span>
        </button>
        ${items}
      </section>
    `);
  }
  listBody.innerHTML = parts.join("") || `<p class="list-note">找不到相關足跡。試試「新芽」、「骨髓」、「冬令」或「環保」。</p>`;
  const filtering = state.chip !== "all" || state.query;
  listNote.textContent = filtering
    ? `目前看得到 ${shown} 則。點一則，鏡頭會飛過去。`
    : "點一則，鏡頭會飛到那棟小屋。";
}

function renderFallback() {
  $("#fallback-body").innerHTML = ISLANDS.map((island) => `
    <section>
      <h2><span class="seal" style="display:inline-grid;margin-right:8px;background:${island.color}">${esc(island.seal)}</span>${esc(island.name)}</h2>
      <p>${esc(island.blurb)}</p>
      ${island.deeds.map((deed) => `<article class="deed-card">${cardInner(island, deed)}</article>`).join("")}
    </section>
  `).join("");
}

function showFallback() {
  loadingEl.classList.add("hide");
  fallbackEl.hidden = false;
  document.body.style.overflow = "auto";
}

renderChips();
renderList();
renderFallback();

function setChip(id) {
  state.chip = id;
  if (id === "all" || id === "mission") state.islandId = null;
  chipsEl.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.chip === id ? "true" : "false");
  });
  renderList();
  applyFilter();
  paintSelection();
  if (byId[id]) focusIsland(id, false);
  say(id === "all" ? "顯示全部法印" : id === "mission" ? "只留下四大志業" : `看${byId[id].name}`);
}

function openList(force) {
  const open = force === true ? true : force === false ? false : listEl.hidden;
  listEl.hidden = !open;
  $("#btn-list").setAttribute("aria-pressed", open ? "true" : "false");
  document.body.classList.toggle("list-open", open);
  if (open) {
    panel.hidden = true;
    document.body.classList.remove("panel-open");
    renderList();
  }
}

function openPanel() {
  panel.hidden = false;
  document.body.classList.add("panel-open");
  listEl.hidden = true;
  document.body.classList.remove("list-open");
  $("#btn-list").setAttribute("aria-pressed", "false");
  panel.classList.remove("full");
}

function closePanel() {
  panel.hidden = true;
  document.body.classList.remove("panel-open");
  state.deedId = null;
  paintSelection();
}

function openDeed(id, fly = true) {
  const found = findDeed(id);
  if (!found) return;
  state.deedId = id;
  state.islandId = found.island.id;
  panelBody.innerHTML = cardInner(found.island, found.deed);
  openPanel();
  paintSelection();
  if (fly) flyToDeed(id);
  say(`${found.island.name}，${found.deed.title}`);
}

chipsEl.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) setChip(button.dataset.chip);
});
$("#search-form").addEventListener("submit", (event) => event.preventDefault());
qInput.addEventListener("input", () => {
  state.query = qInput.value.trim();
  renderList();
  applyFilter();
  if (!listEl.hidden) return;
  if (state.query) openList(true);
});
$("#btn-list").addEventListener("click", () => openList());
$("#list-close").addEventListener("click", () => openList(false));
$("#panel-close").addEventListener("click", closePanel);
$("#panel-expand").addEventListener("click", () => panel.classList.toggle("full"));
$("#btn-help").addEventListener("click", () => { helpEl.hidden = false; });
$("#help-close").addEventListener("click", () => { helpEl.hidden = true; });
$("#intro-go").addEventListener("click", () => {
  introEl.hidden = true;
  try { sessionStorage.setItem("missions-island-intro", "1"); } catch (err) { /* ignore */ }
});
petalBtn.addEventListener("click", () => {
  state.petalsOn = !state.petalsOn;
  petalBtn.setAttribute("aria-pressed", state.petalsOn ? "true" : "false");
  petalBtn.textContent = state.petalsOn ? "花瓣開" : "花瓣關";
  if (petals) petals.visible = state.petalsOn;
});
document.addEventListener("click", (event) => {
  const deed = event.target.closest("[data-deed]");
  if (deed && (panel.contains(deed) || listEl.contains(deed) || fallbackEl.contains(deed))) {
    openDeed(deed.dataset.deed, !fallbackEl.hidden ? false : true);
    return;
  }
  const island = event.target.closest("[data-island]");
  if (island && listEl.contains(island)) focusIsland(island.dataset.island, true);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!helpEl.hidden) helpEl.hidden = true;
    else if (!panel.hidden) closePanel();
    else if (!listEl.hidden) openList(false);
    else if (!introEl.hidden) introEl.hidden = true;
  }
  if (event.key === "/" && document.activeElement !== qInput) {
    event.preventDefault();
    qInput.focus();
  }
});

try {
  if (sessionStorage.getItem("missions-island-intro") === "1") introEl.hidden = true;
} catch (err) { /* keep the welcome */ }

const ISLAND_R = 3.62;
const BEACH_R = 4.28;
const TOP_Y = 0.86;
const pickables = [];
const islandViews = new Map();
const deedViews = new Map();
let petals = null;
let renderer;
let camera;
let controls;
let scene;
let labelRenderer;
let waterUniforms;

function hexShape(radius) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i += 1) {
    const angle = -Math.PI / 2 + i * (Math.PI / 3);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function extrudeHex(radius, depth) {
  const geo = new THREE.ExtrudeGeometry(hexShape(radius), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.12,
    bevelSegments: 2,
    curveSegments: 1
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeBoundingBox();
  geo.translate(0, -geo.boundingBox.max.y, 0);
  return geo;
}

function rnd(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function makeMat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.74,
    metalness: 0.03,
    ...extra
  });
}

function remember(mesh, bucket) {
  const list = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
  for (const material of list) {
    if (!bucket.includes(material)) bucket.push(material);
  }
  return mesh;
}

function makeBuilding(type, palette) {
  const group = new THREE.Group();
  const mats = [];
  const wall = makeMat(palette.wall);
  const roofM = makeMat(palette.roof, { roughness: 0.58 });
  const trim = makeMat(palette.accent, { roughness: 0.5 });
  const glass = makeMat("#c5dde4", { roughness: 0.18, metalness: 0.12, emissive: "#16343c", emissiveIntensity: 0.18 });
  const wood = makeMat("#8d6548", { roughness: 0.84 });
  mats.push(wall, roofM, trim, glass, wood);

  const add = (mesh, shadow = true) => {
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const box = (w, h, d, x, base, z, material, shadow = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, base + h / 2, z);
    return add(mesh, shadow);
  };
  const hip = (radius, height, y, material) => {
    const geo = new THREE.ConeGeometry(radius, height, 4);
    geo.rotateY(Math.PI / 4);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.y = y;
    return add(mesh);
  };
  const win = (w, h, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass);
    mesh.position.set(x, y, z);
    return add(mesh, false);
  };

  let height = 1.4;
  if (type === "hospital") {
    box(1.55, 1.7, 1.05, 0, 0, 0, wall);
    box(0.72, 0.42, 0.55, 0, 1.7, 0, wall);
    win(1.05, 0.72, 0, 0.95, 0.54);
    const mark = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), trim);
    mark.position.set(0, 1.35, 0.56);
    add(mark, false);
    height = 2.2;
  } else if (type === "campus") {
    box(0.7, 1.15, 0.7, -0.55, 0, 0.1, wall);
    box(0.85, 1.65, 0.8, 0.35, 0, -0.05, wall);
    box(0.55, 0.8, 0.55, 0.95, 0, 0.35, wall);
    hip(0.55, 0.42, 1.9, roofM);
    height = 2.15;
  } else if (type === "school") {
    box(1.7, 0.95, 1.05, 0, 0, 0, wall);
    hip(1.25, 0.62, 1.25, roofM);
    box(0.28, 0.7, 0.28, 0.55, 0.95, 0, wall);
    hip(0.28, 0.32, 1.8, trim);
    win(1.15, 0.4, 0, 0.5, 0.54);
    height = 2.05;
  } else if (type === "tower" || type === "temple") {
    if (type === "temple") {
      box(1.45, 0.72, 1.15, 0, 0, 0, wall);
      hip(1.15, 0.42, 0.95, roofM);
      hip(0.82, 0.36, 1.38, trim);
      height = 1.75;
    } else {
      box(0.78, 1.85, 0.78, 0, 0, 0, wall);
      hip(0.62, 0.55, 2.15, roofM);
      win(0.4, 0.7, 0, 1.05, 0.41);
      height = 2.5;
    }
  } else if (type === "studio") {
    box(1.25, 1.15, 0.85, 0, 0, 0, wall);
    box(0.9, 0.62, 0.06, 0, 0.35, 0.46, glass, false);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), trim);
    pole.position.set(0.4, 1.5, 0);
    add(pole);
    height = 1.9;
  } else if (type === "hall") {
    box(1.65, 0.78, 1.15, 0, 0, 0, wall);
    hip(1.2, 0.5, 1.05, roofM);
    win(1.05, 0.32, 0, 0.42, 0.59);
    height = 1.4;
  } else if (type === "warehouse" || type === "factory") {
    box(1.8, 0.7, 1.05, 0, 0, 0, wall);
    hip(1.25, 0.38, 0.9, roofM);
    if (type === "factory") {
      box(0.22, 0.85, 0.22, 0.7, 0.7, -0.2, trim);
    }
    height = type === "factory" ? 1.6 : 1.2;
  } else if (type === "shed" || type === "bins" || type === "kitchen") {
    if (type !== "bins") {
      for (const x of [-0.55, 0.55]) {
        for (const z of [-0.4, 0.4]) box(0.08, 0.7, 0.08, x, 0, z, wood);
      }
      hip(1.05, 0.36, 0.9, roofM);
    }
    const colors = ["#6ea4b8", "#d7b15a", "#7daa86"];
    colors.forEach((color, index) => {
      const bin = makeMat(color);
      mats.push(bin);
      box(0.28, 0.38, 0.28, -0.4 + index * 0.4, 0, type === "bins" ? 0 : 0.7, bin);
    });
    if (type === "kitchen") {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.16, 10), trim);
      pot.position.set(0, 0.2, 0);
      add(pot);
    }
    height = 1.15;
  } else if (type === "lab") {
    box(1.15, 1.05, 0.9, 0, 0, 0, wall);
    const cell = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 18), trim);
    cell.position.set(0, 1.35, 0);
    cell.rotation.x = Math.PI / 2.4;
    add(cell);
    win(0.7, 0.4, 0, 0.6, 0.47);
    height = 1.7;
  } else if (type === "clinic") {
    box(1.05, 0.9, 0.9, 0, 0, 0, wall);
    hip(0.8, 0.42, 1.12, roofM);
    const mark = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), trim);
    mark.position.set(0, 0.7, 0.48);
    add(mark, false);
    height = 1.4;
  } else if (type === "bus") {
    box(1.7, 0.48, 0.62, 0, 0.18, 0, wall);
    box(0.7, 0.28, 0.58, -0.25, 0.66, 0, glass, false);
    for (const x of [-0.55, 0.55]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 10), wood);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.14, 0.28);
      add(wheel);
    }
    height = 1.05;
  } else if (type === "boat") {
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.42, 1.5, 4), wall);
    hull.rotation.z = Math.PI / 2;
    hull.rotation.y = Math.PI / 4;
    hull.position.y = 0.28;
    add(hull);
    box(0.45, 0.35, 0.4, 0.1, 0.4, 0, trim);
    height = 0.9;
  } else if (type === "gate") {
    box(0.22, 1.25, 0.22, -0.48, 0, 0, wall);
    box(0.22, 1.25, 0.22, 0.48, 0, 0, wall);
    box(1.35, 0.18, 0.28, 0, 1.25, 0, roofM);
    hip(0.85, 0.28, 1.52, trim);
    height = 1.75;
  } else if (type === "relief") {
    box(1.15, 0.7, 0.85, -0.15, 0, 0, wall);
    hip(0.85, 0.38, 0.9, roofM);
    box(0.7, 0.28, 0.7, 0.55, 0, 0.15, trim);
    height = 1.2;
  } else if (type === "pavilion") {
    for (const x of [-0.5, 0.5]) {
      for (const z of [-0.4, 0.4]) box(0.08, 0.85, 0.08, x, 0, z, wood);
    }
    hip(1.05, 0.4, 1.05, roofM);
    height = 1.3;
  } else {
    box(0.95, 0.85, 0.85, 0, 0, 0, wall);
    hip(0.75, 0.45, 1.08, roofM);
    win(0.45, 0.28, 0, 0.48, 0.44);
    height = 1.4;
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.035, 8, 28),
    new THREE.MeshBasicMaterial({ color: "#e7c27a" })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.03;
  ring.visible = false;
  group.add(ring);
  group.userData.materials = mats;
  group.userData.ring = ring;
  group.userData.height = height;
  return group;
}

function slotsFor(count) {
  if (count >= 5) {
    return [[-1.7, -1.15], [1.65, -1.2], [0.05, 0.15], [-1.55, 1.45], [1.55, 1.4]];
  }
  return [[-1.5, -1.15], [1.55, -1.05], [-1.4, 1.3], [1.5, 1.35]];
}

function makeLabel(className, html) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = className;
  el.innerHTML = html;
  const obj = new CSS2DObject(el);
  obj.center.set(0.5, 1);
  return { el, obj };
}

function buildScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd7e6ee, 78, 168);
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 400);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setClearColor(0xd5e4ec, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.insertBefore(renderer.domElement, $("#labels"));

  labelRenderer = new CSS2DRenderer({ element: $("#labels") });
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced.matches;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.minDistance = 6;
  controls.maxDistance = 78;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = 1.18;
  controls.maxTargetRadius = 26;
  controls.target.set(0, 0.2, -1);

  scene.add(new THREE.HemisphereLight(0xfff8ef, 0x6d8fa3, 0.92));
  scene.add(new THREE.AmbientLight(0xfff4e8, 0.28));
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.45);
  sun.position.set(-28, 42, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 110;
  sun.shadow.bias = -0.00035;
  scene.add(sun);
  sun.target.position.set(0, 0, 0);
  scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0xd5efe8, 0.35);
  fill.position.set(16, 12, -10);
  scene.add(fill);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(180, 28, 18),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: "varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: `
        varying vec3 vP;
        void main() {
          float h = normalize(vP).y;
          vec3 top = vec3(0.45, 0.68, 0.82);
          vec3 midc = vec3(0.78, 0.88, 0.92);
          vec3 hor = vec3(0.97, 0.91, 0.84);
          float t = smoothstep(-0.04, 0.62, h);
          vec3 col = mix(hor, mix(midc, top, smoothstep(0.15, 0.8, h)), t);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    })
  );
  scene.add(sky);

  waterUniforms = { uTime: { value: 0 } };
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220, 50, 50),
    new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vW;
        void main() {
          vUv = uv;
          vec3 p = position;
          float w = sin(p.x * 0.16 + uTime * 0.55) * 0.045 + cos(p.y * 0.12 + uTime * 0.38) * 0.035;
          p.z += w;
          vW = w;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vW;
        uniform float uTime;
        void main() {
          vec3 deep = vec3(0.10, 0.31, 0.46);
          vec3 midc = vec3(0.34, 0.62, 0.73);
          vec3 foam = vec3(0.86, 0.94, 0.95);
          float rip = 0.5 + 0.5 * sin(vUv.x * 80.0 + uTime) * sin(vUv.y * 64.0 - uTime * 0.7);
          vec3 col = mix(deep, midc, 0.35 + vUv.y * 0.25 + vW * 3.0);
          col = mix(col, foam, smoothstep(0.78, 1.0, rip) * 0.16);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  scene.add(water);

  const beachGeo = extrudeHex(BEACH_R, 0.28);
  const topGeo = extrudeHex(ISLAND_R, 0.62);
  const trunkGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.38, 5);
  const crownGeo = new THREE.SphereGeometry(0.28, 8, 6);
  const treeSpots = [[-1.2, -2.85], [1.25, -2.8], [2.85, -0.15], [2.45, 1.9], [0.1, 2.9], [-2.55, 1.85], [-2.9, -0.35]];

  for (const island of ISLANDS) {
    const group = new THREE.Group();
    group.position.set(island.at[0], 0, island.at[1]);
    const mats = [];
    const beach = new THREE.Mesh(beachGeo, makeMat("#e7d8c2", { roughness: 0.95 }));
    beach.position.y = 0.28;
    beach.receiveShadow = true;
    group.add(beach);
    remember(beach, mats);

    const topMat = makeMat("#f7f4ee");
    topMat.color.lerp(new THREE.Color(island.color), 0.62);
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = TOP_Y;
    top.receiveShadow = true;
    top.castShadow = true;
    top.userData.islandId = island.id;
    top.userData.kind = "island";
    group.add(top);
    pickables.push(top);
    remember(top, mats);

    const rim = new THREE.Mesh(
      new THREE.RingGeometry(ISLAND_R * 0.78, ISLAND_R * 0.92, 6),
      makeMat(island.mission ? "#e4c98a" : island.accent, { roughness: 0.7 })
    );
    rim.rotation.x = -Math.PI / 2;
    rim.rotation.z = Math.PI / 6;
    rim.position.y = TOP_Y + 0.03;
    rim.receiveShadow = true;
    group.add(rim);
    remember(rim, mats);

    const path = new THREE.Mesh(
      new THREE.RingGeometry(1.95, 2.18, 40),
      makeMat("#eadcc4", { roughness: 1 })
    );
    path.rotation.x = -Math.PI / 2;
    path.position.y = TOP_Y + 0.035;
    path.receiveShadow = true;
    group.add(path);

    const leaf = makeMat(island.id === "eco" ? "#3f7d62" : "#4e7a58", { roughness: 0.85 });
    const trunk = makeMat("#7a5a3c", { roughness: 0.9 });
    treeSpots.forEach((spot, index) => {
      const seed = island.order * 10 + index;
      const tree = new THREE.Group();
      const stem = new THREE.Mesh(trunkGeo, trunk);
      stem.position.y = 0.2;
      const crown = new THREE.Mesh(crownGeo, leaf);
      crown.position.y = 0.48;
      crown.scale.set(0.85 + rnd(seed) * 0.45, 0.7, 0.85 + rnd(seed + 3) * 0.4);
      tree.add(stem, crown);
      tree.position.set(spot[0], TOP_Y, spot[1]);
      tree.scale.setScalar(0.85 + rnd(seed + 1) * 0.55);
      group.add(tree);
    });
    mats.push(leaf, trunk);

    const lotus = new THREE.Group();
    const petalMat = makeMat("#f0c2cf", { roughness: 0.45 });
    for (let i = 0; i < 6; i += 1) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), petalMat);
      const angle = (i / 6) * Math.PI * 2;
      petal.scale.set(1, 0.45, 1.7);
      petal.position.set(Math.cos(angle) * 0.18, 0.06, Math.sin(angle) * 0.18);
      petal.lookAt(0, 0.25, 0);
      lotus.add(petal);
    }
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), makeMat("#f6e27a"));
    heart.position.y = 0.1;
    lotus.add(heart);
    lotus.position.set(0, TOP_Y + 0.02, -2.35);
    group.add(lotus);
    mats.push(petalMat);

    const slots = slotsFor(island.deeds.length);
    island.deeds.forEach((deed, index) => {
      const building = makeBuilding(deed.building, island);
      const slot = slots[index] || slots[0];
      building.position.set(slot[0], TOP_Y, slot[1]);
      building.rotation.y = (index - 1.5) * 0.22;
      building.scale.setScalar(1.16);
      building.userData.deedId = deed.id;
      building.userData.islandId = island.id;
      group.add(building);
      pickables.push(building);
      const label = makeLabel("deed-pin", esc(deed.title));
      label.el.dataset.deed = deed.id;
      label.el.addEventListener("click", (event) => {
        event.stopPropagation();
        openDeed(deed.id, true);
      });
      label.obj.position.set(0, building.userData.height + 0.15, 0);
      building.add(label.obj);
      deedViews.set(deed.id, { building, label: label.el, islandId: island.id, materials: building.userData.materials });
    });

    const islandLabel = makeLabel("island-pin", `
      <span class="seal" style="background:${island.color}">${esc(island.seal)}</span>
      <span><b>${esc(island.name)}</b><small>${esc(island.motto)}</small></span>
    `);
    islandLabel.el.dataset.island = island.id;
    islandLabel.el.addEventListener("click", (event) => {
      event.stopPropagation();
      focusIsland(island.id, true);
    });
    islandLabel.obj.position.set(0, 3.15, 0);
    group.add(islandLabel.obj);
    scene.add(group);
    islandViews.set(island.id, { group, label: islandLabel.el, materials: mats, deeds: island.deeds.map((deed) => deed.id) });
  }

  for (const [fromId, toId] of LINKS) {
    const a = byId[fromId];
    const b = byId[toId];
    const dx = b.at[0] - a.at[0];
    const dz = b.at[1] - a.at[1];
    const len = Math.hypot(dx, dz);
    const span = len - BEACH_R * 1.72;
    if (span < 0.5) continue;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.1, span),
      makeMat(a.mission && b.mission ? "#e0b45a" : "#d2c0a2", { roughness: 0.88 })
    );
    mesh.position.set((a.at[0] + b.at[0]) / 2, 0.32, (a.at[1] + b.at[1]) / 2);
    mesh.rotation.y = Math.atan2(dx, dz);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  const north = makeLabel("north-pin", "北");
  north.obj.position.set(0.8, 1.4, -24.2);
  scene.add(north.obj);

  const count = 42;
  {
    const geo = new THREE.PlaneGeometry(0.22, 0.34);
    const mat = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexColors: true
    });
    petals = new THREE.InstancedMesh(geo, mat, count);
    const pink = new THREE.Color("#f0b7c6");
    const white = new THREE.Color("#fffaf6");
    petals.userData.bits = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const bit = {
        x: (rnd(i + 2) - 0.5) * 46,
        y: 1.5 + rnd(i + 4) * 9,
        z: (rnd(i + 6) - 0.5) * 50,
        spin: rnd(i + 8) * Math.PI,
        speed: 0.18 + rnd(i + 9) * 0.4,
        drift: rnd(i + 11) * Math.PI * 2,
        s: 0.55 + rnd(i + 13) * 0.7
      };
      petals.userData.bits.push(bit);
      dummy.position.set(bit.x, bit.y, bit.z);
      dummy.scale.setScalar(bit.s);
      dummy.updateMatrix();
      petals.setMatrixAt(i, dummy.matrix);
      petals.setColorAt(i, i % 4 === 0 ? white : pink);
    }
    petals.visible = state.petalsOn;
    scene.add(petals);
  }

  camera.position.set(0.4, 32, 40);
  window.MISSIONS_BOOTED = true;
}

function resize() {
  if (!renderer) return;
  const w = stage.clientWidth || window.innerWidth;
  const h = stage.clientHeight || window.innerHeight;
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow() ? 1.5 : 1.75));
  renderer.setSize(w, h, false);
  labelRenderer.setSize(w, h);
}

function ease(t) { return t * t * (3 - 2 * t); }

function fly(target, position) {
  if (!camera) return;
  const dur = reduced.matches ? 0 : 900;
  state.flight = {
    fromT: controls.target.clone(),
    toT: target.clone(),
    fromP: camera.position.clone(),
    toP: position.clone(),
    t: 0,
    dur
  };
  controls.enabled = false;
}

function focusIsland(id, openListAfter) {
  const island = byId[id];
  const view = islandViews.get(id);
  if (!island || !view) return;
  state.islandId = id;
  const target = new THREE.Vector3(island.at[0], 0.8, island.at[1]);
  const position = target.clone().add(new THREE.Vector3(-5.2, 8.4, 9.6));
  fly(target, position);
  paintSelection();
  if (openListAfter && narrow()) openList(false);
  say(`${island.name}，${island.blurb}`);
}

function flyToDeed(id) {
  const view = deedViews.get(id);
  if (!view) return;
  const spot = new THREE.Vector3();
  view.building.getWorldPosition(spot);
  const target = spot.clone();
  target.y = 1;
  fly(target, spot.clone().add(new THREE.Vector3(-3.4, 3.8, 5.2)));
}

function setOpacity(materials, opacity) {
  for (const material of materials) {
    const seeThrough = opacity < 0.98;
    material.transparent = seeThrough;
    material.opacity = opacity;
    material.depthWrite = !seeThrough;
    material.needsUpdate = true;
  }
}

function applyFilter() {
  const filtering = state.chip !== "all" || state.query.length > 0;
  for (const island of ISLANDS) {
    const view = islandViews.get(island.id);
    if (!view) continue;
    const deeds = visibleDeeds(island);
    const islandOn = !filtering || deeds.length > 0 || (islandAllowed(island) && !state.query);
    view.label.classList.toggle("dim", filtering && !islandOn);
    setOpacity(view.materials, islandOn ? 1 : 0.28);
    for (const deedId of view.deeds) {
      const deedView = deedViews.get(deedId);
      const found = findDeed(deedId);
      const on = found ? deedVisible(found.island, found.deed) : false;
      const show = !filtering || on;
      setOpacity(deedView.materials, show ? 1 : 0.18);
      deedView.label.classList.toggle("dim", filtering && !on);
    }
  }
}

function paintSelection() {
  for (const [id, view] of deedViews) {
    view.label.classList.toggle("on", id === state.deedId);
    view.building.userData.ring.visible = id === state.deedId;
  }
  for (const [id, view] of islandViews) {
    view.label.classList.toggle("on", id === state.islandId);
  }
}

function onPick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, true);
  for (const hit of hits) {
    let node = hit.object;
    while (node) {
      if (node.userData.deedId) {
        openDeed(node.userData.deedId, false);
        return;
      }
      if (node.userData.kind === "island") {
        focusIsland(node.userData.islandId, false);
        return;
      }
      node = node.parent;
    }
  }
}

function boot() {
  const probe = document.createElement("canvas");
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) throw new Error("no webgl");
  buildScene();
  resize();
  const canvas = renderer.domElement;
  let down = null;
  canvas.addEventListener("pointerdown", (event) => {
    down = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!down) return;
    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (moved > 8) return;
    onPick(event);
  });
  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);
    canvas.style.cursor = raycaster.intersectObjects(pickables, true).length ? "pointer" : "grab";
  });
  $("#btn-home").addEventListener("click", () => {
    state.islandId = null;
    closePanel();
    setChip("all");
    fly(new THREE.Vector3(0, 0.2, -1), new THREE.Vector3(0.4, 32, 40));
    say("回到八座島的全景");
  });
  window.addEventListener("resize", resize);
  const clock = new THREE.Clock();
  const dummy = new THREE.Object3D();
  const frame = () => {
    const dt = Math.min(0.05, clock.getDelta());
    if (!reduced.matches && waterUniforms) waterUniforms.uTime.value += dt;
    if (petals && state.petalsOn && !reduced.matches) {
      const time = waterUniforms.uTime.value;
      petals.userData.bits.forEach((bit, index) => {
        bit.y -= bit.speed * dt;
        if (bit.y < 0.4) bit.y = 10.5;
        bit.spin += dt * 0.6;
        dummy.position.set(bit.x + Math.sin(time + bit.drift) * 0.8, bit.y, bit.z);
        dummy.rotation.set(bit.spin, bit.spin * 0.4, 0);
        dummy.scale.setScalar(bit.s);
        dummy.updateMatrix();
        petals.setMatrixAt(index, dummy.matrix);
      });
      petals.instanceMatrix.needsUpdate = true;
    }
    if (state.flight) {
      state.flight.t += dt * 1000;
      const k = state.flight.dur <= 0 ? 1 : ease(Math.min(1, state.flight.t / state.flight.dur));
      camera.position.lerpVectors(state.flight.fromP, state.flight.toP, k);
      controls.target.lerpVectors(state.flight.fromT, state.flight.toT, k);
      camera.lookAt(controls.target);
      if (k >= 1) {
        state.flight = null;
        controls.enabled = true;
        controls.update();
      }
    } else {
      controls.update();
    }
    const selected = state.deedId && deedViews.get(state.deedId);
    if (selected && !reduced.matches) selected.building.userData.ring.rotation.z += dt * 0.7;
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    const dist = camera.position.distanceTo(controls.target);
    const filtering = state.chip !== "all" || state.query.length > 0;
    for (const [id, view] of deedViews) {
      const found = findDeed(id);
      const matched = found ? deedVisible(found.island, found.deed) : false;
      const show = matched && (
        id === state.deedId
        || filtering
        || state.islandId === view.islandId
        || (!state.islandId && dist < 20)
      );
      view.label.style.visibility = show ? "visible" : "hidden";
      view.label.style.pointerEvents = show ? "auto" : "none";
    }
    requestAnimationFrame(frame);
  };
  loadingEl.classList.add("hide");
  frame();
}

try {
  boot();
} catch (err) {
  console.error(err);
  window.MISSIONS_BOOTED = true;
  showFallback();
}
