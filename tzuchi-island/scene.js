import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FILL, SIDE, HEX_SIZE } from "./layout.js";
import { TOPIC_BY_ID } from "./data.js";

const RADIUS = HEX_SIZE * 0.9;

function colorOf(hex) {
  return parseInt(hex.slice(1), 16);
}

function lotusMark(tint) {
  const group = new THREE.Group();
  const petalGeo = new THREE.SphereGeometry(0.085, 8, 6);
  const petalMat = new THREE.MeshLambertMaterial({ color: tint });
  for (let i = 0; i < 6; i += 1) {
    const petal = new THREE.Mesh(petalGeo, petalMat);
    const angle = (i / 6) * Math.PI * 2;
    petal.position.set(Math.cos(angle) * 0.15, 0.05, Math.sin(angle) * 0.15);
    petal.scale.set(1, 0.42, 0.62);
    group.add(petal);
  }
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xfff7ea }),
  );
  core.position.y = 0.07;
  group.add(core);
  return group;
}

export function mountScene(stage, hexes, { reduced, onPick }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (err) {
    return { ok: false, error: err };
  }
  if (!renderer.getContext()) {
    renderer.dispose();
    return { ok: false, error: new Error("no webgl context") };
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd5e8f4);
  scene.fog = new THREE.Fog(0xd5e8f4, 32, 78);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.08, 240);
  renderer.setClearColor(0xd5e8f4, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.id = "gl";
  stage.insertBefore(renderer.domElement, stage.firstChild);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.85;
  controls.minDistance = 5.5;
  controls.maxDistance = 46;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = 1.18;
  if ("maxTargetRadius" in controls) controls.maxTargetRadius = 16;

  scene.add(new THREE.HemisphereLight(0xf7fbff, 0x6d93b0, 0.95));
  scene.add(new THREE.AmbientLight(0xf3f7fb, 0.28));
  const sun = new THREE.DirectionalLight(0xfff8ef, 1.15);
  sun.position.set(-14, 22, -10);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xd5e8f6, 0.38);
  fill.position.set(10, 8, 12);
  scene.add(fill);

  const waterUniforms = {
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color(0x1d5c90) },
    uShallow: { value: new THREE.Color(0x8ec4e6) },
  };
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(42, 64),
    new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uDeep;
        uniform vec3 uShallow;
        varying vec2 vUv;
        void main() {
          vec2 p = vUv - 0.5;
          float r = length(p);
          float wave = sin((p.x * 28.0) + (p.y * 22.0) + uTime * 0.55) * 0.012;
          float shore = smoothstep(0.46, 0.08, r + wave);
          vec3 col = mix(uDeep, uShallow, shore);
          float edge = smoothstep(0.5, 0.34, r);
          gl_FragColor = vec4(col, edge);
        }
      `,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.08;
  scene.add(water);

  const bodyGeo = new THREE.CylinderGeometry(RADIUS, RADIUS * 0.94, 1, 6);
  bodyGeo.translate(0, 0.5, 0);
  bodyGeo.rotateY(Math.PI / 2);
  const topGeo = new THREE.CylinderGeometry(RADIUS * 0.97, RADIUS * 0.97, 0.07, 6);
  topGeo.rotateY(Math.PI / 2);

  const island = new THREE.Group();
  const pickables = [];
  const nodes = new Map();

  hexes.forEach((hex) => {
    const base = hex.topic ? 0.86 : hex.kind === "ridge" ? 0.58 : hex.kind === "lotus" ? 0.34 : hex.kind === "penghu" ? 0.22 : hex.kind === "coast" ? 0.18 : 0.28;
    const height = base + (hex.topic ? 0 : hex.lift);
    const group = new THREE.Group();
    group.position.set(hex.x, 0.02, hex.z);
    const sideMat = new THREE.MeshLambertMaterial({ color: colorOf(SIDE[hex.topic ? "topic" : hex.kind]) });
    const topMat = new THREE.MeshLambertMaterial({ color: colorOf(FILL[hex.topic ? "topic" : hex.kind]) });
    const body = new THREE.Mesh(bodyGeo, sideMat);
    body.scale.y = height;
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = height + 0.035;
    group.add(body, top);
    if (hex.topic || hex.kind === "lotus") {
      const mark = lotusMark(hex.topic ? 0xe7a0b4 : 0xd98aa6);
      mark.position.y = height + 0.1;
      mark.name = "lotus";
      group.add(mark);
    }
    body.userData.hex = hex;
    top.userData.hex = hex;
    pickables.push(body, top);
    island.add(group);
    nodes.set(hex.index, { group, body, top, sideMat, topMat, hex, height, baseY: 0 });
  });
  scene.add(island);

  const labelRoot = stage.querySelector("#labels");
  const labels = [];
  const projected = new THREE.Vector3();
  nodes.forEach((node) => {
    const topic = node.hex.topic ? TOPIC_BY_ID[node.hex.topic] : null;
    if (!topic && node.hex.kind !== "penghu") return;
    const el = document.createElement(topic ? "button" : "span");
    el.className = topic ? "pin" : "pin quiet";
    el.type = topic ? "button" : undefined;
    if (topic) {
      el.dataset.id = topic.id;
      el.innerHTML = `<span class="seal">${topic.seal}</span><span class="nm">${topic.short}</span>`;
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        onPick(node.hex);
      });
    } else if (!labelRoot.querySelector(".pin.quiet")) {
      el.textContent = "澎湖";
      labels.push({ el, node });
      labelRoot.appendChild(el);
      return;
    } else {
      return;
    }
    labels.push({ el, node });
    labelRoot.appendChild(el);
  });

  const home = { biasX: 0 };
  let flight = null;
  let selected = null;
  let hot = null;
  const clock = { t: 0 };

  function framedHome() {
    const box = new THREE.Box3().setFromObject(island);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const aspect = Math.max(0.4, camera.aspect);
    const fov = (camera.fov * Math.PI) / 180;
    const distForHeight = (size.z * 0.55) / Math.tan(fov / 2);
    const distForWidth = (size.x * 0.62) / (Math.tan(fov / 2) * aspect);
    const dist = Math.max(distForHeight, distForWidth) * 1.18;
    return {
      p: new THREE.Vector3(center.x + home.biasX * 0.15, dist * 0.58, center.z + dist * 0.72),
      t: new THREE.Vector3(center.x - home.biasX, size.y * 0.25, center.z),
    };
  }

  function applyPose(pose, animate) {
    if (!animate || reduced) {
      flight = null;
      camera.position.copy(pose.p);
      controls.target.copy(pose.t);
      controls.update();
      return;
    }
    flight = {
      fromP: camera.position.clone(),
      fromT: controls.target.clone(),
      toP: pose.p.clone(),
      toT: pose.t.clone(),
      t0: performance.now(),
      dur: 680,
    };
  }

  function focusHome(animate) {
    applyPose(framedHome(), animate);
  }

  function focusHex(hex, animate) {
    const node = [...nodes.values()].find((item) => item.hex === hex);
    const y = node ? node.height : 0.4;
    applyPose({
      p: new THREE.Vector3(hex.x + 1.6, y + 4.4, hex.z + 5.4),
      t: new THREE.Vector3(hex.x, y * 0.35, hex.z),
    }, animate);
  }

  function paint() {
    nodes.forEach((node) => {
      const id = node.hex.topic;
      const on = id && id === selected;
      const match = !hot || (id && hot.has(id));
      const dim = hot && !match;
      node.sideMat.transparent = dim;
      node.topMat.transparent = dim;
      node.sideMat.opacity = dim ? 0.28 : 1;
      node.topMat.opacity = dim ? 0.34 : 1;
      if (node.hex.topic) {
        node.topMat.color.set(on ? 0xfde8ef : match && hot ? 0xfff4f7 : 0xf8fbfe);
      }
      node.group.position.y = 0.02 + (on ? 0.16 : 0);
    });
    labels.forEach((label) => {
      const id = label.node.hex.topic;
      const on = Boolean(id && id === selected);
      label.el.classList.toggle("on", on);
      label.el.classList.toggle("dim", Boolean(hot && (!id || !hot.has(id))));
      if (label.el.tagName === "BUTTON") label.el.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;

  function hexAt(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    return hit ? hit.object.userData.hex : null;
  }

  renderer.domElement.addEventListener("pointerdown", (event) => {
    down = { x: event.clientX, y: event.clientY };
  });
  renderer.domElement.addEventListener("pointerup", (event) => {
    if (!down) return;
    const dx = event.clientX - down.x;
    const dy = event.clientY - down.y;
    down = null;
    if (dx * dx + dy * dy > 64) return;
    const hex = hexAt(event);
    if (hex) onPick(hex);
  });
  renderer.domElement.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const hex = hexAt(event);
    renderer.domElement.style.cursor = hex ? "pointer" : "";
  });

  function resize() {
    const width = stage.clientWidth || window.innerWidth;
    const height = stage.clientHeight || window.innerHeight;
    camera.aspect = width / Math.max(1, height);
    const portrait = width / height < 0.9;
    camera.fov = portrait ? 48 : 34;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, portrait ? 1.35 : 1.6));
    renderer.setSize(width, height, false);
  }

  resize();
  focusHome(false);
  paint();

  let running = true;
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = 0.016;
    if (!reduced) clock.t += dt;
    waterUniforms.uTime.value = clock.t;
    if (!reduced) {
      nodes.forEach((node) => {
        const mark = node.group.getObjectByName("lotus");
        if (mark && node.hex.topic) mark.rotation.y = clock.t * 0.25;
      });
    }
    if (flight) {
      const k = Math.min(1, (now - flight.t0) / flight.dur);
      const eased = k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2;
      camera.position.lerpVectors(flight.fromP, flight.toP, eased);
      controls.target.lerpVectors(flight.fromT, flight.toT, eased);
      if (k >= 1) flight = null;
    }
    controls.update();
    renderer.render(scene, camera);
    const width = stage.clientWidth || 1;
    const height = stage.clientHeight || 1;
    labels.forEach((label) => {
      projected.set(label.node.hex.x, label.node.group.position.y + label.node.height + 0.5, label.node.hex.z);
      projected.project(camera);
      const behind = projected.z > 1;
      label.el.hidden = behind;
      if (behind) return;
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      label.el.style.transform = `translate(-50%, -130%) translate(${x}px, ${y}px)`;
    });
  }
  requestAnimationFrame(frame);

  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    running = false;
    stage.classList.add("fallback");
  });

  return {
    ok: true,
    resize,
    focusHome,
    focusHex,
    setBias(x) {
      home.biasX = x;
    },
    setSelected(id) {
      selected = id;
      paint();
    },
    setHot(ids) {
      hot = ids;
      paint();
    },
    destroy() {
      running = false;
      renderer.dispose();
      controls.dispose();
    },
  };
}
