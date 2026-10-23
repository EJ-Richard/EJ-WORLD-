import { LAUNCHERS, GRIPS } from "./data.js";
import {
  BIT_CHOICES,
  RATCHET_CHOICES,
  bitInfo,
  computeStats,
  filterTops,
  getTop,
  ratchetInfo,
  topLabel,
  toLaunch,
} from "./parts.js";
import { STADIUM, ZONES, angleInZone } from "./sim.js";
import { createBattle } from "./battle.js";
import { createAudio } from "./audio.js";

const $ = (id) => document.getElementById(id);
const audio = createAudio();
const FINISH = {
  spin: { zh: "持久終結", en: "Spin Finish", pts: 1 },
  over: { zh: "出場終結", en: "Over Finish", pts: 2 },
  burst: { zh: "爆裂終結", en: "Burst Finish", pts: 2 },
  xtreme: { zh: "極限終結", en: "Xtreme Finish", pts: 3 },
};

const state = {
  screen: "home",
  side: "player",
  series: "ALL",
  type: "ALL",
  query: "",
  difficulty: "normal",
  player: blankSide("bx01"),
  cpu: blankSide("ux03"),
  drop: { x: 0, z: 1, angle: Math.PI, tilt: 0.05 },
  power: null,
  powerLive: 0,
  powerT0: 0,
  pull: 0,
  cpuPlan: null,
  match: freshMatch(),
  record: { wins: 0, losses: 0 },
  fromMatch: false,
  launchToken: 0,
};

let battle = null;
let powerRaf = 0;
let hudAt = 0;
const taps = [];

function blankSide(id) {
  const top = getTop(id);
  return {
    topId: top.id,
    ratchet: top.ratchet,
    bit: top.bit,
    launcherId: "bx18",
    gripId: "bx42",
  };
}

function freshMatch() {
  return { round: 1, player: 0, cpu: 0, history: [], live: false };
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

function sideStats(which) {
  const side = state[which];
  return computeStats(getTop(side.topId), side.ratchet, side.bit, side.launcherId, side.gripId);
}

function show(name) {
  state.screen = name;
  document.querySelectorAll(".screen").forEach((el) => {
    el.classList.toggle("on", el.id === `screen-${name}`);
  });
}

function clampPlace(x, z) {
  const r = Math.hypot(x, z);
  if (r <= STADIUM.place) return { x, z };
  return { x: (x / r) * STADIUM.place, z: (z / r) * STADIUM.place };
}

function renderRecord(node, record) {
  node.textContent = `戰績　勝 ${record.wins}　敗 ${record.losses}`;
}

function renderHome() {
  renderRecord($("record-line"), state.record);
}

function renderVs() {
  const p = sideStats("player");
  const c = sideStats("cpu");
  $("vs-line").textContent = `思語弟弟　${p.label} ${p.combo}　vs　電腦　${c.label} ${c.combo}`;
}

function renderList() {
  const list = $("top-list");
  const prev = list.scrollTop;
  list.replaceChildren();
  const rows = filterTops(state.series, state.type, state.query);
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.textContent = "沒有符合的陀螺";
    list.appendChild(empty);
    return;
  }
  const selected = state[state.side].topId;
  for (const top of rows) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "top-card";
    btn.dataset.id = top.id;
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", top.id === selected ? "true" : "false");
    if (top.id === selected) btn.classList.add("is-on");
    const sw = document.createElement("span");
    sw.className = `swatch ${top.series}`;
    const code = document.createElement("span");
    code.className = "code";
    code.textContent = top.code;
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = topLabel(top);
    const meta = document.createElement("span");
    meta.className = "badge";
    meta.textContent = top.type;
    btn.append(sw, code, nm, meta);
    if (top.left_spin) {
      const left = document.createElement("span");
      left.className = "left-badge";
      left.textContent = "左迴旋";
      btn.append(left);
    }
    list.appendChild(btn);
  }
  list.scrollTop = prev;
}

function choices(list, current) {
  if (list.some((item) => (item.id || item) === current)) return list;
  return [current, ...list];
}

function fillChips(container, items, key, current, labeler) {
  container.replaceChildren();
  for (const item of items) {
    const value = item.id || item;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.k = key;
    btn.dataset.v = value;
    btn.textContent = labeler(item);
    if (value === current) btn.classList.add("is-on");
    container.appendChild(btn);
  }
}

function renderParts() {
  const side = state[state.side];
  const top = getTop(side.topId);
  const stats = sideStats(state.side);
  const custom = side.ratchet !== top.ratchet || side.bit !== top.bit;
  const bits = choices(BIT_CHOICES, side.bit).map((item) => (typeof item === "string" ? bitInfo(item) : item));
  const ratchets = choices(RATCHET_CHOICES, side.ratchet);
  fillChips($("part-ratchets"), ratchets, "ratchet", side.ratchet, (id) => id);
  fillChips($("part-bits"), bits, "bit", side.bit, (bit) => `${bit.id} ${bit.zh}`);
  fillChips($("part-launchers"), LAUNCHERS, "launcherId", side.launcherId, (item) => item.name_zh || item.name_jp);
  fillChips($("part-grips"), GRIPS, "gripId", side.gripId, (item) => item.name_zh || item.name_jp);
  $("combo-label").textContent = `${stats.label}　${stats.code}　${stats.combo}${stats.left ? "　左迴旋" : ""}${custom ? "　已改裝" : ""}`;
  const bars = [
    ["攻擊", stats.bars.atk, "atk"],
    ["防禦", stats.bars.def, "def"],
    ["持久", stats.bars.sta, "sta"],
    ["重量", stats.bars.wt, "wt"],
    ["極限", stats.bars.dash, "dash"],
    ["抗爆", stats.bars.burst, "burst"],
    ["發射", stats.bars.launch, "launch"],
    ["操控", stats.bars.control, "control"],
  ];
  $("stat-bars").replaceChildren();
  for (const [name, value, cls] of bars) {
    const row = document.createElement("div");
    row.className = `bar ${cls}`;
    const label = document.createElement("span");
    label.textContent = name;
    const track = document.createElement("i");
    const fill = document.createElement("b");
    fill.style.width = `${Math.round(value)}%`;
    track.appendChild(fill);
    const num = document.createElement("em");
    num.textContent = String(Math.round(value));
    row.append(label, track, num);
    $("stat-bars").appendChild(row);
  }
  $("part-tip").textContent = stats.tip;
  renderVs();
  document.querySelectorAll("#series-chips button").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.series === state.series);
  });
  document.querySelectorAll("#type-chips button").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.type === state.type);
  });
  document.querySelectorAll("[data-diff]").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.diff === state.difficulty);
  });
  document.querySelectorAll("[data-side]").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.side === state.side);
  });
  const strip = $("match-strip");
  if (state.match.live) {
    strip.hidden = false;
    strip.textContent = `第 ${state.match.round} 回合　思語弟弟 ${state.match.player}：${state.match.cpu} 電腦`;
  } else {
    strip.hidden = true;
  }
  $("btn-build-back").textContent = state.fromMatch ? "回發射" : "返回";
}

function renderBuild() {
  renderList();
  renderParts();
}

function planCpu() {
  const stats = sideStats("cpu");
  const rng = Math.random;
  let plan;
  if (state.difficulty === "easy") {
    plan = {
      x: (rng() - 0.5) * 0.3,
      z: -0.12,
      angle: 0.55 + (rng() - 0.5) * 0.4,
      tilt: -0.15,
      power: 0.3 + rng() * 0.08,
      pull: 0.32 + rng() * 0.08,
    };
  } else if (state.difficulty === "hard") {
    if (stats.type === "耐久") {
      plan = { x: (rng() - 0.5) * 0.16, z: 0.02, angle: rng() * Math.PI * 2, tilt: -0.3, power: 0.7 + rng() * 0.12, pull: 0.78 + rng() * 0.12 };
    } else {
      const a = 1.1 + (rng() - 0.5) * 0.9;
      const rad = 0.95;
      const spinWay = stats.left ? -1 : 1;
      plan = {
        x: Math.sin(a) * rad,
        z: Math.cos(a) * rad,
        angle: Math.atan2(Math.cos(a) * spinWay, -Math.sin(a) * spinWay),
        tilt: 0.12,
        power: 0.74 + rng() * 0.12,
        pull: 0.8 + rng() * 0.12,
      };
    }
  } else {
    plan = {
      x: (rng() - 0.5) * 0.35,
      z: -0.62,
      angle: 0.45 + (rng() - 0.5) * 0.35,
      tilt: 0,
      power: 0.52 + rng() * 0.1,
      pull: 0.55 + rng() * 0.1,
    };
  }
  const placed = clampPlace(plan.x, plan.z);
  plan.x = placed.x;
  plan.z = placed.z;
  state.cpuPlan = plan;
}

function mapScale(canvas) {
  return (Math.min(canvas.width, canvas.height) * 0.46) / 2.55;
}

function worldToCanvas(canvas, x, z) {
  const scale = mapScale(canvas);
  return [canvas.width / 2 + x * scale, canvas.height / 2 + z * scale];
}

function canvasToWorld(canvas, px, py) {
  const rect = canvas.getBoundingClientRect();
  const x = ((px - rect.left) / rect.width) * canvas.width;
  const y = ((py - rect.top) / rect.height) * canvas.height;
  const scale = mapScale(canvas);
  return { x: (x - canvas.width / 2) / scale, z: (y - canvas.height / 2) / scale };
}

function drawMap() {
  const canvas = $("drop-map");
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = Math.max(240, Math.floor(Math.min(rect.width || 320, rect.height || 320)));
  canvas.width = Math.floor(size * dpr);
  canvas.height = canvas.width;
  const g = canvas.getContext("2d");
  const scale = mapScale(canvas);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = "#c8f1ff";
  g.fillRect(0, 0, canvas.width, canvas.height);
  const edge = (a, r) => [cx + Math.sin(a) * r * scale, cy + Math.cos(a) * r * scale];
  for (const zone of ZONES) {
    g.beginPath();
    const a0 = zone.center - zone.half;
    const a1 = zone.center + zone.half;
    const start = edge(a0, STADIUM.wall);
    g.moveTo(start[0], start[1]);
    for (let i = 0; i <= 10; i += 1) {
      const p = edge(a0 + ((a1 - a0) * i) / 10, STADIUM.wall + 0.85);
      g.lineTo(p[0], p[1]);
    }
    const end = edge(a1, STADIUM.wall);
    g.lineTo(end[0], end[1]);
    g.closePath();
    g.fillStyle = zone.kind === "xtreme" ? "#ff4ad8" : "#3ddc7a";
    g.fill();
    const label = edge(zone.center, STADIUM.wall + 0.45);
    g.fillStyle = "#1b1b3a";
    g.font = `700 ${Math.floor(canvas.width * 0.035)}px "WenQuanYi Micro Hei", sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(zone.kind === "xtreme" ? "極限區" : "出場區", label[0], label[1]);
  }
  g.beginPath();
  g.arc(cx, cy, STADIUM.wall * scale, 0, Math.PI * 2);
  g.fillStyle = "#eaf9ff";
  g.fill();
  g.lineWidth = Math.max(4, canvas.width * 0.012);
  g.strokeStyle = "#ffe14a";
  g.beginPath();
  g.arc(cx, cy, (STADIUM.rail + 0.18) * scale, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "#ff7a22";
  g.lineWidth = Math.max(3, canvas.width * 0.01);
  g.beginPath();
  g.moveTo(cx - 28 * dpr, cy - 28 * dpr);
  g.lineTo(cx + 28 * dpr, cy + 28 * dpr);
  g.moveTo(cx + 28 * dpr, cy - 28 * dpr);
  g.lineTo(cx - 28 * dpr, cy + 28 * dpr);
  g.stroke();
  drawMarker(g, canvas, state.cpuPlan, "#ff8bd2", "電");
  drawMarker(g, canvas, state.drop, "#ffe14a", "思", true);
}

function drawMarker(g, canvas, spot, color, text, arrow) {
  if (!spot) return;
  const [x, y] = worldToCanvas(canvas, spot.x, spot.z);
  g.beginPath();
  g.fillStyle = color;
  g.strokeStyle = "#1b1b3a";
  g.lineWidth = 4;
  g.arc(x, y, canvas.width * 0.035, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = "#1b1b3a";
  g.font = `800 ${Math.floor(canvas.width * 0.03)}px "WenQuanYi Micro Hei", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, x, y);
  if (!arrow) return;
  const len = canvas.width * 0.08;
  const dx = Math.sin(spot.angle) * len;
  const dy = Math.cos(spot.angle) * len;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + dx, y + dy);
  g.stroke();
  g.beginPath();
  g.arc(x + dx, y + dy, 6, 0, Math.PI * 2);
  g.fill();
}

function updateLaunchReadout() {
  const powerText = state.power === null ? "指針移動中，按「停！」" : `力道 ${Math.round(state.power * 100)}%`;
  $("power-readout").textContent = powerText;
  $("btn-power").textContent = state.power === null ? "停！決定力道" : "重測力道";
  const pullPct = Math.round(state.pull * 100);
  $("pull-readout").textContent = state.pull > 0 ? `拉速 ${pullPct}%` : "還沒拉繩";
  $("pull-gauge").firstElementChild.style.width = `${pullPct}%`;
  $("pull-pad").setAttribute("aria-valuenow", String(pullPct));
  $("check-drop").classList.add("ok");
  $("check-power").classList.toggle("ok", state.power !== null);
  $("check-pull").classList.toggle("ok", state.pull >= 0.12);
  $("btn-shoot").disabled = !(state.power !== null && state.pull >= 0.12);
  const p = sideStats("player");
  const c = sideStats("cpu");
  $("player-plan").textContent = `思語弟弟　${p.label} ${p.code} ${p.combo}`;
  const plan = state.cpuPlan;
  $("cpu-plan").textContent = plan
    ? `電腦　${c.label}　力道 ${Math.round(plan.power * 100)}%・拉速 ${Math.round(plan.pull * 100)}%`
    : "";
  $("tilt-val").textContent = state.drop.tilt.toFixed(2);
}

function powerLoop(now) {
  if (state.screen !== "launch" || state.power !== null) return;
  state.powerLive = (Math.sin((now - state.powerT0) / 1000 * 2.15) + 1) / 2;
  $("power-cursor").style.left = `${state.powerLive * 100}%`;
  powerRaf = requestAnimationFrame(powerLoop);
}

function enterLaunch() {
  state.power = null;
  state.pull = 0;
  state.powerT0 = performance.now();
  planCpu();
  saveJSON("spin-x-loadout", {
    difficulty: state.difficulty,
    player: state.player,
    cpu: state.cpu,
  });
  show("launch");
  requestAnimationFrame(() => {
    drawMap();
    updateLaunchReadout();
    cancelAnimationFrame(powerRaf);
    powerRaf = requestAnimationFrame(powerLoop);
  });
}

function stopPower() {
  if (state.power !== null) {
    state.power = null;
    state.powerT0 = performance.now();
    updateLaunchReadout();
    cancelAnimationFrame(powerRaf);
    powerRaf = requestAnimationFrame(powerLoop);
    return;
  }
  state.power = state.powerLive;
  audio.blip(640);
  updateLaunchReadout();
}

function setPull(value) {
  state.pull = Math.max(state.pull, Math.max(0, Math.min(1, value)));
  updateLaunchReadout();
}

function resetPull() {
  state.pull = 0;
  updateLaunchReadout();
}

function ensureBattle() {
  if (!battle) battle = createBattle($("battle-view"));
  return battle;
}

function applyDifficulty(launch, stats) {
  if (state.difficulty === "easy") {
    return {
      launch: { ...launch, spin: launch.spin * 0.48, vx: launch.vx * 0.62, vz: launch.vz * 0.62 },
      stats: { ...stats, decay: stats.decay * 1.7 },
    };
  }
  if (state.difficulty === "hard") {
    return {
      launch: { ...launch, spin: Math.min(100, launch.spin * 1.06), vx: launch.vx * 1.05, vz: launch.vz * 1.05 },
      stats,
    };
  }
  return { launch, stats };
}

function beginBattle() {
  const pStats = sideStats("player");
  const cpuTuned = applyDifficulty(toLaunch(sideStats("cpu"), state.cpuPlan), sideStats("cpu"));
  const pLaunch = toLaunch(pStats, { ...state.drop, power: state.power, pull: state.pull });
  const cStats = cpuTuned.stats;
  const cLaunch = cpuTuned.launch;
  show("battle");
  $("finish-banner").hidden = true;
  $("go-flash").hidden = false;
  $("go-flash").textContent = "Go Shoot!";
  setTimeout(() => {
    $("go-flash").hidden = true;
  }, 700);
  $("hud-round").textContent = `第 ${state.match.round} 回合`;
  $("hud-p-score").textContent = String(state.match.player);
  $("hud-c-score").textContent = String(state.match.cpu);
  $("hud-p-name").textContent = pStats.label;
  $("hud-c-name").textContent = cStats.label;
  $("hud-p-code").textContent = `${pStats.code}　${pStats.combo}${pStats.left ? "　左迴旋" : ""}`;
  $("hud-c-code").textContent = `${cStats.code}　${cStats.combo}${cStats.left ? "　左迴旋" : ""}`;
  audio.launch();
  ensureBattle().start({
    player: { stats: pStats, launch: pLaunch, plate: "思語" },
    cpu: { stats: cStats, launch: cLaunch, plate: "電腦" },
  }, {
    onHud: updateHud,
    onHit: (impulse) => audio.hit(impulse),
    onFinish: onFinish,
  });
}

function updateHud(snap) {
  const now = performance.now();
  if (now - hudAt < 80) return;
  hudAt = now;
  const p = Math.max(0, Math.min(100, snap.playerSpin));
  const c = Math.max(0, Math.min(100, snap.cpuSpin));
  $("hud-p-spin").style.width = `${p}%`;
  $("hud-c-spin").style.width = `${c}%`;
  $("hud-p-rpm").textContent = String(Math.round(p * 80));
  $("hud-c-rpm").textContent = String(Math.round(c * 80));
  $("hud-p-dash").hidden = !snap.playerRail;
  $("hud-c-dash").hidden = !snap.cpuRail;
}

function onFinish(info) {
  const row = FINISH[info.kind] || FINISH.spin;
  const scorer = info.scorer === "a" ? "player" : "cpu";
  state.match[scorer] += row.pts;
  state.match.history.push({
    round: state.match.round,
    kind: info.kind,
    zh: row.zh,
    en: row.en,
    pts: row.pts,
    scorer,
  });
  const who = scorer === "player" ? "思語弟弟 得分！" : "電腦 得分！";
  $("banner-who").textContent = who;
  $("banner-zh").textContent = row.zh;
  $("banner-en").textContent = row.en;
  $("banner-pts").textContent = `+${row.pts}`;
  $("hud-p-score").textContent = String(state.match.player);
  $("hud-c-score").textContent = String(state.match.cpu);
  const done = state.match.player >= 4 || state.match.cpu >= 4;
  $("btn-next").textContent = done ? "查看結果" : "下一回合";
  $("btn-retune").hidden = done;
  $("finish-banner").hidden = false;
  audio.finish(info.kind);
}

function showResult() {
  if (battle) battle.stop();
  const playerWins = state.match.player >= state.match.cpu;
  if (playerWins) state.record.wins += 1;
  else state.record.losses += 1;
  saveJSON("spin-x-record", state.record);
  $("result-title").textContent = playerWins ? "思語弟弟 獲勝！" : "電腦 獲勝！";
  $("result-score").textContent = `${state.match.player} : ${state.match.cpu}`;
  const list = $("history");
  list.replaceChildren();
  for (const row of state.match.history) {
    const li = document.createElement("li");
    const name = row.scorer === "player" ? "思語弟弟" : "電腦";
    li.textContent = `第${row.round}回合　${row.zh} ${row.en}　${name} +${row.pts}`;
    list.appendChild(li);
  }
  renderRecord($("record-after"), state.record);
  state.match.live = false;
  show("result");
}

async function countdownAndLaunch() {
  if ($("btn-shoot").disabled) return;
  const token = ++state.launchToken;
  state.match.live = true;
  const el = $("countdown");
  el.hidden = false;
  const steps = ["3", "2", "1", "Go Shoot!"];
  for (const step of steps) {
    if (token !== state.launchToken) return;
    el.textContent = step;
    audio.blip(step === "Go Shoot!" ? 720 : 480);
    await new Promise((resolve) => setTimeout(resolve, step === "Go Shoot!" ? 620 : 520));
  }
  if (token !== state.launchToken) return;
  el.hidden = true;
  beginBattle();
}

function wire() {
  $("btn-mute").textContent = audio.muted ? "已靜音" : "音效開";
  $("btn-mute").setAttribute("aria-pressed", audio.muted ? "true" : "false");
  $("btn-mute").addEventListener("click", () => {
    const muted = audio.toggle();
    $("btn-mute").textContent = muted ? "已靜音" : "音效開";
    $("btn-mute").setAttribute("aria-pressed", muted ? "true" : "false");
  });
  document.body.addEventListener("pointerdown", () => audio.unlock(), { once: true });
  $("btn-start").addEventListener("click", () => {
    audio.blip();
    if (!state.match.live) state.match = freshMatch();
    state.fromMatch = false;
    show("build");
    renderBuild();
  });
  $("btn-help").addEventListener("click", () => {
    $("help").hidden = false;
  });
  $("btn-help-close").addEventListener("click", () => {
    $("help").hidden = true;
  });
  $("help").addEventListener("click", (event) => {
    if (event.target.id === "help") $("help").hidden = true;
  });
  document.querySelectorAll("[data-side]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.side = btn.dataset.side;
      renderBuild();
    });
  });
  document.querySelectorAll("[data-diff]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.difficulty = btn.dataset.diff;
      renderParts();
    });
  });
  $("series-chips").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-series]");
    if (!btn) return;
    state.series = btn.dataset.series;
    renderList();
    renderParts();
  });
  $("type-chips").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-type]");
    if (!btn) return;
    state.type = btn.dataset.type;
    renderList();
    renderParts();
  });
  $("top-search").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderList();
  });
  $("top-list").addEventListener("click", (event) => {
    const btn = event.target.closest(".top-card");
    if (!btn) return;
    const top = getTop(btn.dataset.id);
    const side = state[state.side];
    side.topId = top.id;
    side.ratchet = top.ratchet;
    side.bit = top.bit;
    audio.blip(560);
    renderBuild();
  });
  $("part-col").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-k]");
    if (!btn) return;
    state[state.side][btn.dataset.k] = btn.dataset.v;
    renderParts();
  });
  $("btn-random-cpu").addEventListener("click", () => {
    const rows = filterTops("ALL", "ALL", "").filter((top) => top.id !== state.player.topId);
    const top = rows[Math.floor(Math.random() * rows.length)];
    state.cpu.topId = top.id;
    state.cpu.ratchet = top.ratchet;
    state.cpu.bit = top.bit;
    state.cpu.launcherId = LAUNCHERS[Math.floor(Math.random() * LAUNCHERS.length)].id;
    state.cpu.gripId = GRIPS[Math.floor(Math.random() * GRIPS.length)].id;
    state.side = "cpu";
    renderBuild();
  });
  $("btn-build-back").addEventListener("click", () => {
    if (state.fromMatch) enterLaunch();
    else show("home");
  });
  $("btn-to-launch").addEventListener("click", () => {
    state.fromMatch = false;
    enterLaunch();
  });
  $("btn-launch-back").addEventListener("click", () => {
    state.launchToken += 1;
    $("countdown").hidden = true;
    show("build");
    renderBuild();
  });
  $("tilt").addEventListener("input", (event) => {
    state.drop.tilt = Number(event.target.value) / 100;
    updateLaunchReadout();
    drawMap();
  });
  const map = $("drop-map");
  let dragging = false;
  let moved = false;
  map.addEventListener("pointerdown", (event) => {
    map.setPointerCapture(event.pointerId);
    dragging = true;
    moved = false;
    const spot = clampPlace(canvasToWorld(map, event.clientX, event.clientY).x, canvasToWorld(map, event.clientX, event.clientY).z);
    state.drop.x = spot.x;
    state.drop.z = spot.z;
    const aim = Math.atan2(-state.drop.x, -state.drop.z || -0.001);
    if (!Number.isNaN(aim)) state.drop.angle = aim;
    drawMap();
  });
  map.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    moved = true;
    const world = canvasToWorld(map, event.clientX, event.clientY);
    state.drop.angle = Math.atan2(world.x - state.drop.x, world.z - state.drop.z);
    drawMap();
  });
  map.addEventListener("pointerup", () => {
    dragging = false;
    if (!moved) drawMap();
  });
  $("btn-power").addEventListener("click", () => stopPower());
  const pad = $("pull-pad");
  let pullStart = null;
  pad.addEventListener("pointerdown", (event) => {
    pad.setPointerCapture(event.pointerId);
    pullStart = { x: event.clientX, y: event.clientY, t: performance.now() };
  });
  pad.addEventListener("pointermove", (event) => {
    if (!pullStart) return;
    const dt = Math.max(0.04, (performance.now() - pullStart.t) / 1000);
    const dist = Math.hypot(event.clientX - pullStart.x, event.clientY - pullStart.y);
    const speed = dist / dt;
    const pull = Math.max(0, Math.min(1, (speed - 220) / 1500));
    $("pull-cord").style.transform = `translateY(${Math.max(-70, event.clientY - pullStart.y)}px)`;
    if (dist > 36) setPull(Math.max(pull, dist > 70 ? 0.5 : 0));
  });
  pad.addEventListener("pointerup", (event) => {
    if (!pullStart) return;
    const dt = Math.max(0.04, (performance.now() - pullStart.t) / 1000);
    const dist = Math.hypot(event.clientX - pullStart.x, event.clientY - pullStart.y);
    const speed = dist / dt;
    let pull = Math.max(0, Math.min(1, (speed - 220) / 1500));
    if (dist > 48) pull = Math.max(pull, 0.46);
    setPull(pull);
    pullStart = null;
    $("pull-cord").style.transform = "";
  });
  $("btn-repull").addEventListener("click", () => resetPull());
  $("btn-shoot").addEventListener("click", () => countdownAndLaunch());
  window.addEventListener("keydown", (event) => {
    if (state.screen !== "launch") return;
    if (event.code === "Space") event.preventDefault();
    if (event.code === "Space" && !event.repeat && state.power === null) {
      stopPower();
      return;
    }
    if ((event.code === "Space" || event.code === "ArrowUp") && state.power !== null && !event.repeat) {
      const now = performance.now();
      taps.push(now);
      while (taps.length && now - taps[0] > 700) taps.shift();
      if (taps.length >= 3) {
        const gap = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
        setPull(Math.max(0, Math.min(1, 1 - (gap - 40) / 220)));
      }
    }
    if (event.code === "Enter") countdownAndLaunch();
  });
  $("btn-next").addEventListener("click", () => {
    const done = state.match.player >= 4 || state.match.cpu >= 4;
    $("finish-banner").hidden = true;
    if (done) {
      showResult();
      return;
    }
    state.match.round += 1;
    if (battle) battle.stop();
    enterLaunch();
  });
  $("btn-retune").addEventListener("click", () => {
    state.fromMatch = true;
    $("finish-banner").hidden = true;
    if (battle) battle.stop();
    show("build");
    renderBuild();
  });
  $("btn-rematch").addEventListener("click", () => {
    state.match = freshMatch();
    state.match.live = true;
    enterLaunch();
  });
  $("btn-rebuild").addEventListener("click", () => {
    state.match = freshMatch();
    state.fromMatch = false;
    show("build");
    renderBuild();
  });
  window.addEventListener("resize", () => {
    if (state.screen === "launch") drawMap();
    if (battle) battle.resize();
  });
}

function boot() {
  const record = loadJSON("spin-x-record", null);
  if (record && Number.isFinite(record.wins) && Number.isFinite(record.losses)) state.record = record;
  const saved = loadJSON("spin-x-loadout", null);
  if (saved && saved.player && saved.cpu && getTop(saved.player.topId) && getTop(saved.cpu.topId)) {
    state.player = { ...blankSide(saved.player.topId), ...saved.player };
    state.cpu = { ...blankSide(saved.cpu.topId), ...saved.cpu };
    if (["easy", "normal", "hard"].includes(saved.difficulty)) state.difficulty = saved.difficulty;
  }
  $("tilt").value = String(Math.round(state.drop.tilt * 100));
  renderHome();
  wire();
  renderBuild();
}

boot();

void ratchetInfo;
void angleInZone;
