import * as THREE from "three";
import { STADIUM, ZONES, angleInZone, createFighter, separateSpawns, stepPair } from "./sim.js";

const FONT = '"WenQuanYi Micro Hei","PingFang TC","Microsoft JhengHei",sans-serif';

function canvasTex(draw, w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeFloorTexture() {
  return canvasTex((g, w, h) => {
    const c = w / 2;
    const grd = g.createRadialGradient(c, c, 20, c, c, c);
    grd.addColorStop(0, "#fffef6");
    grd.addColorStop(0.45, "#d9f6ff");
    grd.addColorStop(0.78, "#7fd0ff");
    grd.addColorStop(1, "#3aa0ef");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,255,255,0.85)";
    g.lineWidth = 10;
    g.beginPath();
    g.arc(c, c, w * 0.28, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "rgba(255,122,40,0.9)";
    g.lineWidth = 18;
    g.beginPath();
    g.arc(c, c, w * 0.18, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "#ff7a22";
    g.lineWidth = 22;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(c - 70, c - 70);
    g.lineTo(c + 70, c + 70);
    g.moveTo(c + 70, c - 70);
    g.lineTo(c - 70, c + 70);
    g.stroke();
  }, 512, 512);
}

function makeLabelTexture(text, color) {
  return canvasTex((g, w, h) => {
    roundRect(g, 8, 6, w - 16, h - 12, 22);
    g.fillStyle = color;
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = "#1b1b3a";
    g.stroke();
    g.fillStyle = "#1b1b3a";
    g.font = `700 36px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, w / 2, h / 2 + 2);
  }, 256, 80);
}

function makeDecal(ch, color) {
  return canvasTex((g, w) => {
    g.fillStyle = color;
    g.beginPath();
    g.arc(w / 2, w / 2, w / 2 - 4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#fffef8";
    g.font = `700 78px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(ch, w / 2, w / 2 + 4);
  }, 128, 128);
}

function makePocketTexture(title, sub, a, b) {
  return canvasTex((g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, a);
    grd.addColorStop(1, b);
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.font = `800 42px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(title, w / 2, h * 0.42);
    g.font = `700 22px ${FONT}`;
    g.fillText(sub, w / 2, h * 0.72);
  }, 256, 128);
}

function buildStadium(scene) {
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(STADIUM.wall - 0.02, 64),
    new THREE.MeshStandardMaterial({ map: makeFloorTexture(), roughness: 0.62, metalness: 0.08 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  const lipMat = new THREE.MeshStandardMaterial({ color: "#7ec8ff", roughness: 0.35, metalness: 0.18 });
  const gearMatA = new THREE.MeshStandardMaterial({ color: "#ffe14a", roughness: 0.4, metalness: 0.2, emissive: "#ffb000", emissiveIntensity: 0.18 });
  const gearMatB = new THREE.MeshStandardMaterial({ color: "#1b1b3a", roughness: 0.45, metalness: 0.4 });
  for (let i = 0; i < 48; i += 1) {
    const a = ((i + 0.5) / 48) * Math.PI * 2;
    if (angleInZone(a)) continue;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.24), lipMat);
    const r = STADIUM.wall + 0.2;
    wall.position.set(Math.sin(a) * r, 0.2, Math.cos(a) * r);
    wall.rotation.y = -a;
    scene.add(wall);
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.14), i % 2 ? gearMatA : gearMatB);
    const tr = STADIUM.rail + 0.22;
    tooth.position.set(Math.sin(a) * tr, 0.08, Math.cos(a) * tr);
    tooth.rotation.y = -a;
    scene.add(tooth);
  }

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(STADIUM.rail + 0.18, 0.035, 8, 64),
    gearMatA,
  );
  rail.rotation.x = Math.PI / 2;
  rail.position.y = 0.05;
  scene.add(rail);

  const pocketInfo = {
    xtreme: ["極限區", "XTREME", "#ff4ad8", "#ffd23a"],
    over: ["出場區", "OVER", "#3ddc7a", "#b6ff6a"],
  };
  for (const zone of ZONES) {
    const info = pocketInfo[zone.kind];
    const len = 0.95;
    const width = Math.max(0.7, 2 * Math.sin(zone.half) * (STADIUM.wall + 0.2));
    const mat = new THREE.MeshStandardMaterial({
      map: makePocketTexture(info[0], info[1], info[2], info[3]),
      roughness: 0.55,
      metalness: 0.05,
      emissive: info[2],
      emissiveIntensity: 0.08,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, len), mat);
    const rr = STADIUM.wall + len * 0.35;
    mesh.position.set(Math.sin(zone.center) * rr, 0.02, Math.cos(zone.center) * rr);
    mesh.rotation.y = -zone.center;
    scene.add(mesh);
  }

  const xMat = new THREE.MeshStandardMaterial({ color: "#ff7a22", roughness: 0.35, metalness: 0.2, emissive: "#ff7a22", emissiveIntensity: 0.15 });
  for (const rot of [Math.PI / 4, -Math.PI / 4]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.03, 0.14), xMat);
    bar.rotation.y = rot;
    bar.position.y = 0.03;
    scene.add(bar);
  }

  const mat = new THREE.MeshStandardMaterial({ color: "#b7f27a", roughness: 0.9 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(8.5, 48), mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.04;
  scene.add(ground);

  const flagColors = ["#c2410c", "#ffe14a", "#1d4ed8", "#7e22ce", "#3ddc7a", "#ff7ad9", "#ff9f1c", "#5ce1ff"];
  flagColors.forEach((color, i) => {
    const a = (i / flagColors.length) * Math.PI * 2 + 0.2;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: "#fffef8", roughness: 0.4 }),
    );
    pole.position.set(Math.sin(a) * 3.15, 0.35, Math.cos(a) * 3.15);
    scene.add(pole);
    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.22, 0.03),
      new THREE.MeshStandardMaterial({ color, roughness: 0.45, emissive: color, emissiveIntensity: 0.15 }),
    );
    flag.position.set(Math.sin(a) * 3.15 + Math.cos(a) * 0.16, 0.58, Math.cos(a) * 3.15 - Math.sin(a) * 0.16);
    flag.rotation.y = -a;
    scene.add(flag);
  });
}

function makeBit(bitId, metal) {
  if (bitId === "B" || bitId === "DB" || bitId === "FB") {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), metal);
    mesh.position.y = 0.06;
    return mesh;
  }
  if (bitId === "N" || bitId === "HN" || bitId === "GN") {
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 10), metal);
    mesh.position.y = 0.1;
    return mesh;
  }
  if (bitId === "F" || bitId === "R" || bitId === "GF" || bitId === "LF") {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.08, 12), metal);
    mesh.position.y = 0.05;
    return mesh;
  }
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 12), metal);
  mesh.position.y = 0.08;
  return mesh;
}

function makeBlades(stats, plastic, metal) {
  const group = new THREE.Group();
  const type = stats.type;
  if (type === "耐久") {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.07, 28), plastic);
    group.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 24), metal);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    return group;
  }
  const count = type === "攻擊" ? 3 : type === "防禦" ? 6 : 4;
  const len = type === "攻擊" ? 0.36 : type === "防禦" ? 0.24 : 0.3;
  const thick = type === "防禦" ? 0.11 : 0.065;
  const wide = type === "攻擊" ? 0.08 : 0.13;
  const dir = stats.left ? -1 : 1;
  for (let i = 0; i < count; i += 1) {
    const a = dir * (i / count) * Math.PI * 2;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(len, thick, wide), i % 2 ? metal : plastic);
    fin.position.set(Math.cos(a) * len * 0.42, 0, Math.sin(a) * len * 0.42);
    fin.rotation.y = -a;
    group.add(fin);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, thick + 0.02, 12), metal);
  group.add(hub);
  return group;
}

function buildBey(stats, plate, plateColor) {
  const root = new THREE.Group();
  const spinner = new THREE.Group();
  root.add(spinner);
  const color = new THREE.Color(stats.color);
  const plastic = new THREE.MeshStandardMaterial({
    color,
    roughness: stats.type === "防禦" ? 0.48 : 0.32,
    metalness: stats.type === "攻擊" ? 0.72 : 0.42,
    emissive: color,
    emissiveIntensity: 0.12,
  });
  const metal = new THREE.MeshStandardMaterial({ color: "#e7eef8", metalness: 0.86, roughness: 0.24 });
  const bit = makeBit(stats.bitId, metal);
  spinner.add(bit);
  const rH = 0.08 + Math.max(0, stats.height - 52) * 0.0032;
  const sides = Math.max(3, Math.min(stats.blades || 4, 10));
  const ratchet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, rH, sides), plastic);
  ratchet.position.y = 0.12 + rH / 2;
  spinner.add(ratchet);
  for (let i = 0; i < sides; i += 1) {
    const a = (i / sides) * Math.PI * 2;
    const nub = new THREE.Mesh(new THREE.BoxGeometry(0.04, rH * 0.7, 0.04), metal);
    nub.position.set(Math.cos(a) * 0.15, ratchet.position.y, Math.sin(a) * 0.15);
    spinner.add(nub);
  }
  const blades = makeBlades(stats, plastic, metal);
  blades.position.y = ratchet.position.y + rH / 2 + 0.05;
  spinner.add(blades);
  const ringMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.7,
    roughness: 0.25,
    metalness: 0.3,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.028, 8, 28), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = blades.position.y + 0.08;
  spinner.add(ring);
  const ch = (stats.label || stats.code || "陀").trim().slice(0, 1);
  const decal = new THREE.Mesh(
    new THREE.CircleGeometry(0.11, 20),
    new THREE.MeshBasicMaterial({ map: makeDecal(ch, stats.color), toneMapped: false }),
  );
  decal.rotation.x = -Math.PI / 2;
  decal.position.y = blades.position.y + 0.07;
  spinner.add(decal);
  const team = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.03, 8, 24),
    new THREE.MeshStandardMaterial({ color: plateColor, emissive: plateColor, emissiveIntensity: 0.45, roughness: 0.35 }),
  );
  team.rotation.x = Math.PI / 2;
  team.position.y = 0.03;
  root.add(team);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabelTexture(plate, plateColor), transparent: true, depthWrite: false }));
  sprite.scale.set(1.15, 0.36, 1);
  sprite.position.y = 0.95;
  root.add(sprite);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 20),
    new THREE.MeshBasicMaterial({ color: "#1b1b3a", transparent: true, opacity: 0.22, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  return { root, spinner, ringMat, shadow };
}

function makeSparks() {
  const count = 72;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) positions[i * 3 + 1] = -8;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 0.14, vertexColors: true, transparent: true, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  const pool = Array.from({ length: count }, (_, i) => ({ i, life: 0, vx: 0, vy: 0, vz: 0 }));
  return { points, pool, positions, colors, geo };
}

export function createBattle(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x8fd8ff, 1);
  renderer.domElement.id = "battle-canvas";
  renderer.domElement.setAttribute("aria-label", "極限戰鬥盤對戰畫面");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
  const base = new THREE.Vector3();
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb7e7a4, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 1.35);
  sun.position.set(4, 9, 5);
  scene.add(sun);
  const pink = new THREE.PointLight(0xff4ad8, 8, 12);
  pink.position.set(-2.2, 1.4, -1.2);
  scene.add(pink);
  const blue = new THREE.PointLight(0x5ce1ff, 6, 12);
  blue.position.set(2.4, 1.2, 1.6);
  scene.add(blue);
  buildStadium(scene);

  const sparks = makeSparks();
  scene.add(sparks.points);

  let raf = 0;
  let running = false;
  let last = 0;
  let acc = 0;
  let simTime = 0;
  let timeScale = 1;
  let actors = [];
  let finish = null;
  let bannerSent = false;
  let finishAt = 0;
  let shake = 0;
  let shakePhase = 0;
  let hooks = {};
  let burstActor = null;

  function frameCamera() {
    const aspect = camera.aspect || 1;
    if (aspect < 0.72) {
      base.set(0.1, 8.1, 8.4);
      camera.fov = 50;
    } else if (aspect < 1.15) {
      base.set(0.15, 6.4, 7.1);
      camera.fov = 44;
    } else {
      base.set(0.2, 5.15, 6.35);
      camera.fov = 38;
    }
    camera.updateProjectionMatrix();
  }

  function resize() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    frameCamera();
  }

  function emit(x, y, z, n, color) {
    const c = new THREE.Color(color);
    for (let k = 0; k < n; k += 1) {
      const slot = sparks.pool.find((p) => p.life <= 0);
      if (!slot) return;
      slot.life = 0.35 + Math.random() * 0.25;
      slot.vx = (Math.random() - 0.5) * 3.2;
      slot.vy = 1.2 + Math.random() * 2.4;
      slot.vz = (Math.random() - 0.5) * 3.2;
      const i = slot.i * 3;
      sparks.positions[i] = x;
      sparks.positions[i + 1] = y;
      sparks.positions[i + 2] = z;
      sparks.colors[i] = c.r;
      sparks.colors[i + 1] = c.g;
      sparks.colors[i + 2] = c.b;
    }
  }

  function clearActors() {
    for (const actor of actors) {
      scene.remove(actor.root);
      scene.remove(actor.shadow);
      actor.root.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        const mats = node.material ? [].concat(node.material) : [];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      });
      actor.shadow.geometry.dispose();
      actor.shadow.material.dispose();
    }
    actors = [];
    burstActor = null;
  }

  function place(actor) {
    const f = actor.fighter;
    actor.root.position.set(f.x, 0, f.z);
    actor.shadow.position.set(f.x, 0.015, f.z);
    const dir = f.left ? -1 : 1;
    const energy = Math.max(0, Math.min(1, f.spin / 100));
    actor.spinAngle += dir * (0.4 + energy * 10.5) * 0.016;
    actor.phase += (0.8 + energy * 6) * 0.016;
    const lay = f.spin < 10 ? (10 - f.spin) / 10 : 0;
    const wob = Math.min(1.15, f.wobble * 0.85 + lay * 1.15);
    actor.spinner.rotation.y = actor.spinAngle;
    actor.spinner.rotation.x = Math.sin(actor.phase) * wob;
    actor.spinner.rotation.z = Math.cos(actor.phase * 0.8) * wob * 0.65;
    actor.ringMat.emissiveIntensity = 0.25 + energy * 0.9;
    if (f.onRail && energy > 0.25 && Math.random() < 0.25) {
      emit(f.x, 0.12, f.z, 1, "#ffe14a");
    }
  }

  function resizeObserver() {
    if (typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(() => resize());
    obs.observe(container);
  }
  resizeObserver();
  resize();

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const real = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (!finish) {
      acc += real * timeScale;
      const step = 1 / 60;
      let guard = 0;
      while (acc >= step && guard < 4) {
        acc -= step;
        simTime += step;
        guard += 1;
        const result = stepPair(actors[0].fighter, actors[1].fighter, step, simTime);
        if (result.hit && result.hit.impulse > 0.9) {
          shake = Math.min(1, shake + result.hit.impulse * 0.08);
          emit(result.hit.x, 0.2, result.hit.z, result.hit.impulse > 3 ? 16 : 8, result.hit.opposite ? "#ff4ad8" : "#ffe14a");
          if (hooks.onHit) hooks.onHit(result.hit.impulse);
        }
        if (result.finish && !finish) {
          finish = result.finish;
          finishAt = now;
          timeScale = 0.3;
          const loser = finish.scorer === "a" ? actors[1] : actors[0];
          if (finish.kind === "burst") burstActor = loser;
        }
      }
    } else if (!bannerSent && now - finishAt > 850) {
      bannerSent = true;
      timeScale = 0;
      if (hooks.onFinish) hooks.onFinish(finish);
    }

    for (const actor of actors) place(actor);
    if (burstActor && burstActor.spinner.scale.x < 2.2) {
      burstActor.spinner.position.y += real * 1.4;
      burstActor.spinner.rotation.x += real * 6;
      burstActor.spinner.scale.multiplyScalar(1 + real * 0.7);
      emit(burstActor.fighter.x, 0.4, burstActor.fighter.z, 2, "#ffffff");
    }
    for (const slot of sparks.pool) {
      if (slot.life <= 0) continue;
      slot.life -= real;
      slot.vy -= real * 5;
      const i = slot.i * 3;
      sparks.positions[i] += slot.vx * real;
      sparks.positions[i + 1] += slot.vy * real;
      sparks.positions[i + 2] += slot.vz * real;
      if (slot.life <= 0) sparks.positions[i + 1] = -8;
    }
    sparks.geo.attributes.position.needsUpdate = true;
    sparks.geo.attributes.color.needsUpdate = true;

    shake = Math.max(0, shake - real * 1.6);
    shakePhase += real * 38;
    const mag = shake * shake * 0.32;
    camera.position.set(
      base.x + Math.sin(shakePhase) * mag,
      base.y + Math.cos(shakePhase * 0.7) * mag * 0.35,
      base.z + Math.cos(shakePhase) * mag * 0.2,
    );
    camera.lookAt(0, 0.05, 0);
    renderer.render(scene, camera);
    if (hooks.onHud && actors.length === 2) {
      const [p, c] = actors;
      hooks.onHud({
        playerSpin: p.fighter.spin,
        cpuSpin: c.fighter.spin,
        playerRail: p.fighter.onRail,
        cpuRail: c.fighter.onRail,
        time: simTime,
      });
    }
  }

  return {
    resize,
    start(payload, nextHooks) {
      hooks = nextHooks || {};
      clearActors();
      finish = null;
      bannerSent = false;
      simTime = 0;
      acc = 0;
      timeScale = 1;
      shake = 0;
      last = 0;
      const specs = [
        [payload.player, "#ffe14a"],
        [payload.cpu, "#ff8bd2"],
      ];
      for (const [side, plateColor] of specs) {
        const view = buildBey(side.stats, side.plate, plateColor);
        const fighter = createFighter(side.stats, side.launch);
        scene.add(view.root);
        scene.add(view.shadow);
        actors.push({ ...view, fighter, spinAngle: Math.random() * 0.2, phase: Math.random() });
      }
      separateSpawns(actors[0].fighter, actors[1].fighter);
      for (const actor of actors) place(actor);
      resize();
      running = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
