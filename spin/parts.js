import { TOPS, LAUNCHERS, GRIPS } from "./data.js";

export const SERIES_COLOR = {
  BX: "#1f6bff",
  UX: "#ff4b2b",
  CX: "#8a3dff",
};

export const RATCHET_CHOICES = [
  "3-60", "4-60", "4-80", "5-60", "9-60",
  "1-60", "2-60", "2-70", "3-80", "4-70", "5-70", "7-60", "9-80",
];

export const BIT_CHOICES = [
  { id: "F", zh: "平尖", en: "Flat", tip: "平尖會往外滑，容易咬住極限線。" },
  { id: "T", zh: "錐尖", en: "Taper", tip: "錐尖攻守都還可以。" },
  { id: "B", zh: "球尖", en: "Ball", tip: "球尖會輕彈，比較留在盤裡。" },
  { id: "N", zh: "針尖", en: "Needle", tip: "針尖抓住中心，轉比較久。" },
  { id: "R", zh: "衝刺", en: "Rush", tip: "衝刺尖又平又快，極限衝刺很猛。" },
  { id: "GF", zh: "齒輪平", en: "Gear Flat", tip: "齒輪平最會咬極限線。" },
  { id: "HN", zh: "高針", en: "High Needle", tip: "高針最能持久，幾乎不衝線。" },
  { id: "P", zh: "尖錐", en: "Point", tip: "尖錐稍微偏攻擊。" },
  { id: "S", zh: "尖刺", en: "Spike", tip: "尖刺偏防禦，站得比較穩。" },
  { id: "A", zh: "加速", en: "Accel", tip: "加速尖會再快一點。" },
  { id: "DB", zh: "圓盤球", en: "Disc Ball", tip: "圓盤球滑得溫和，適合持久。" },
  { id: "C", zh: "旋風", en: "Cyclone", tip: "旋風尖移動積極，左迴旋也很常見。" },
  { id: "LF", zh: "低平", en: "Low Flat", tip: "低平尖重心低，攻擊時比較貼盤。" },
  { id: "H", zh: "高錐", en: "High", tip: "高錐高度中等，走勢比較均衡。" },
  { id: "L", zh: "直線", en: "Linear", tip: "直線尖會往前衝。" },
];

const BIT_MOD = {
  F: { atk: 6, sta: -6, dash: 14, radial: 0.22, decay: 1.04 },
  R: { atk: 8, sta: -8, dash: 18, radial: 0.28, decay: 1.08 },
  GF: { atk: 7, sta: -5, dash: 20, radial: 0.26, decay: 1.05 },
  LF: { atk: 7, sta: -4, dash: 15, radial: 0.16, decay: 1.03 },
  T: { atk: 2, def: 2, sta: 2, dash: 2, radial: 0.02 },
  P: { atk: 4, sta: -1, dash: 6, radial: 0.08 },
  A: { atk: 5, dash: 10, sta: -3, radial: 0.14, decay: 1.03 },
  H: { sta: 3, def: 2, radial: -0.04 },
  L: { atk: 4, dash: 8, radial: 0.12 },
  B: { def: 3, sta: 6, dash: -4, radial: -0.12, decay: 0.94, bounce: 0.06 },
  DB: { sta: 8, def: 2, dash: -6, radial: -0.2, decay: 0.9 },
  N: { sta: 12, dash: -12, def: 2, radial: -0.34, decay: 0.84 },
  HN: { sta: 14, dash: -14, radial: -0.38, decay: 0.8 },
  GN: { sta: 9, dash: -6, radial: -0.22, decay: 0.9 },
  S: { def: 8, burst: 6, dash: -6, radial: -0.08, decay: 0.96 },
  C: { atk: 6, dash: 8, radial: 0.12, decay: 1.02 },
  U: { sta: 3, def: 2, radial: -0.04 },
  V: { atk: 3, dash: 4, radial: 0.06 },
  FB: { sta: 5, dash: -2, radial: -0.1, decay: 0.93 },
  ATr: { atk: 6, dash: 9, radial: 0.12, decay: 1.02 },
};

const TYPE = {
  攻擊: {
    atk: 86, def: 36, sta: 44, wt: 50, burst: 46, dash: 82,
    mass: 0.86, drive: 3.45, decay: 8.4, restitution: 0.72,
    agility: 1.25, drag: 0.16, dashAccel: 7.4, bitRadial: 0.16, radius: 0.4,
  },
  防禦: {
    atk: 40, def: 88, sta: 60, wt: 88, burst: 80, dash: 30,
    mass: 1.4, drive: 1.62, decay: 6.6, restitution: 0.33,
    agility: 0.85, drag: 0.48, dashAccel: 1.3, bitRadial: -0.08, radius: 0.44,
  },
  耐久: {
    atk: 32, def: 52, sta: 90, wt: 58, burst: 66, dash: 24,
    mass: 1.02, drive: 1.42, decay: 5.5, restitution: 0.4,
    agility: 1.05, drag: 0.2, dashAccel: 0.7, bitRadial: -0.48, radius: 0.4,
  },
  平衡: {
    atk: 62, def: 60, sta: 68, wt: 64, burst: 62, dash: 52,
    mass: 1.05, drive: 2.4, decay: 6.8, restitution: 0.5,
    agility: 1.12, drag: 0.26, dashAccel: 3.4, bitRadial: 0.06, radius: 0.4,
  },
};

const TYPE_TIP = {
  攻擊: "攻擊型跑得快、撞下去很彈，咬到極限線會衝刺。",
  防禦: "防禦型比較重、比較穩，不容易被打出去或爆裂。",
  耐久: "耐久型轉得比較久，放在戰鬥盤中間最厲害。",
  平衡: "平衡型的速度、重量、持久都在中間。",
};

const LAUNCH = {
  bx11: { power: 1, rpm: 0.98, left: false, note: "入門握把，力道和轉速都普通。" },
  bx18: { power: 1.04, rpm: 1.12, left: false, note: "線軸發射器，拉繩轉速比較高。" },
  bx28: { power: 1.04, rpm: 1.12, left: false, note: "白色線軸，拉繩轉速比較高。" },
  bx40: { power: 1.08, rpm: 1.02, left: true, note: "左迴旋旋鈕，左迴旋陀螺會稍微轉更快。" },
  bx47: { power: 1.05, rpm: 1.14, left: true, note: "左迴旋線軸，左迴旋陀螺的拉速更好。" },
  "bx00-sl": { power: 1.05, rpm: 1.1, left: false, note: "限定配色線軸，出力稍微高一點。" },
  bx51: { power: 1.07, rpm: 1.12, left: false, note: "黑綠線軸，力道穩、轉速高。" },
  bx56: { power: 1.05, rpm: 1.15, left: true, note: "白紫左迴旋線軸，拉速很高。" },
};

const GRIP = {
  bx29: { control: 1.05, note: "自訂握把，瞄準稍微準一點。" },
  bx30: { control: 1.05, note: "自訂握把，瞄準稍微準一點。" },
  "bx00-cg": { control: 1.07, note: "透明黑握把，發射比較穩。" },
  bx41: { control: 1.13, note: "橡膠握把，力道和角度更聽話。" },
  bx42: { control: 1.13, note: "橡膠握把，力道和角度更聽話。" },
};

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function ratchetInfo(id) {
  const parts = String(id || "4-60").split("-");
  const height = parseInt(parts[1], 10) || 60;
  const bladesMatch = (parts[0] || "").match(/\d+/);
  const blades = bladesMatch ? parseInt(bladesMatch[0], 10) : 4;
  return { height, blades };
}

export function bitInfo(id) {
  const known = BIT_CHOICES.find((b) => b.id === id);
  const mod = BIT_MOD[id];
  if (known || mod) {
    return {
      id,
      zh: known?.zh || id,
      en: known?.en || id,
      tip: known?.tip || "特殊尖軸。",
      ...(mod || {}),
    };
  }
  let h = 0;
  for (const ch of String(id)) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return {
    id,
    zh: id,
    en: id,
    tip: "特殊尖軸，性能接近平衡。",
    atk: (h % 5) - 2,
    sta: ((h >> 3) % 5) - 2,
    dash: ((h >> 6) % 5) - 2,
    radial: ((h % 5) - 2) * 0.04,
  };
}

export function topLabel(top) {
  if (!top) return "陀螺";
  return top.name_zh || top.name_en || top.name_jp || top.code;
}

export function getTop(id) {
  return TOPS.find((top) => top.id === id) || TOPS[0];
}

export function launcherById(id) {
  return LAUNCHERS.find((item) => item.id === id) || LAUNCHERS[0];
}

export function gripById(id) {
  return GRIPS.find((item) => item.id === id) || GRIPS[0];
}

export function computeStats(top, ratchetId, bitId, launcherId, gripId) {
  const base = TYPE[top.type] || TYPE["平衡"];
  const bit = bitInfo(bitId);
  const ratchet = ratchetInfo(ratchetId);
  const launcher = LAUNCH[launcherId] || LAUNCH.bx18;
  const grip = GRIP[gripId] || GRIP.bx42;
  const launcherItem = launcherById(launcherId);
  const gripItem = gripById(gripId);
  const heightNorm = (ratchet.height - 60) / 20;

  let atk = base.atk + (bit.atk || 0) + (ratchet.blades <= 3 ? 3 : ratchet.blades >= 9 ? -2 : 0);
  let def = base.def + (bit.def || 0) + (ratchet.blades >= 5 && ratchet.blades <= 7 ? 3 : 0);
  let sta = base.sta + (bit.sta || 0) - 5 * heightNorm + (ratchet.blades >= 9 ? 4 : 0);
  let wt = base.wt + (ratchet.blades >= 7 ? 3 : 0);
  let burst = base.burst + (bit.burst || 0) - 14 * heightNorm;
  let dash = base.dash + (bit.dash || 0) + 3 * Math.max(0, heightNorm);
  atk = clamp(atk, 8, 99);
  def = clamp(def, 8, 99);
  sta = clamp(sta, 8, 99);
  wt = clamp(wt, 8, 99);
  burst = clamp(burst, 8, 99);
  dash = clamp(dash, 5, 99);

  const launcherRpm = launcher.rpm * (launcher.left ? (top.left_spin ? 1.06 : 0.97) : 1);
  const launchBar = clamp(48 + (launcher.power - 1) * 180 + (launcherRpm - 1) * 150, 36, 97);
  const controlBar = clamp(42 + (grip.control - 0.98) * 300, 36, 96);

  const heightText = ratchet.height >= 75
    ? "重心偏高，比較容易被打翻，也比較容易爆裂。"
    : ratchet.height <= 60
      ? "重心偏低，站得比較穩，比較不怕爆裂。"
      : "高度中等，穩定和爆發都還可以。";

  return {
    bars: { atk, def, sta, wt, burst, dash, launch: launchBar, control: controlBar },
    mass: clamp(base.mass * (0.94 + wt / 320), 0.72, 1.72),
    radius: base.radius,
    drive: base.drive * (0.94 + dash / 520),
    decay: base.decay * (1.18 - sta / 170) * (bit.decay || 1),
    restitution: clamp(base.restitution + (bit.bounce || 0), 0.22, 0.86),
    agility: base.agility,
    drag: base.drag,
    dashAccel: base.dashAccel * (0.78 + dash / 150),
    atk,
    burstResist: burst,
    bitRadial: base.bitRadial + (bit.radial || 0),
    wobbleBias: Math.max(0, heightNorm) * 0.1,
    left: !!top.left_spin,
    type: top.type,
    series: top.series,
    color: SERIES_COLOR[top.series] || SERIES_COLOR.BX,
    label: topLabel(top),
    code: top.code,
    combo: `${ratchetId}${bitId}`,
    height: ratchet.height,
    blades: ratchet.blades,
    bitId,
    ratchetId,
    launcherPower: launcher.power,
    launcherRpm,
    launcherLeft: !!launcher.left,
    gripControl: grip.control,
    launcherName: launcherItem.name_zh || launcherItem.name_jp,
    gripName: gripItem.name_zh || gripItem.name_jp,
    tip: [
      TYPE_TIP[top.type] || TYPE_TIP["平衡"],
      `棘輪 ${ratchetId}，${heightText}`,
      bit.tip,
      launcher.note,
      grip.note,
      top.left_spin ? "這顆是左迴旋，跟右迴旋對撞時會搶轉速、撞得更大力。" : "",
    ].filter(Boolean).join(""),
  };
}

export function toLaunch(stats, input, rng = Math.random) {
  const scatter = (1.22 - stats.gripControl) * 0.34;
  const angle = input.angle + (rng() * 2 - 1) * scatter;
  let power = input.power * stats.launcherPower;
  power *= 1 - (1.22 - stats.gripControl) * 0.12 * rng();
  let pull = input.pull * stats.launcherRpm;
  power = clamp(power, 0.08, 1.28);
  pull = clamp(pull, 0.08, 1.32);
  const speed = 1.35 + power * 4.15;
  const spin = clamp(34 + pull * 66, 12, 100);
  const r = Math.hypot(input.x, input.z) || 1;
  const tilt = input.tilt || 0;
  return {
    x: input.x,
    z: input.z,
    vx: Math.sin(angle) * speed + (input.x / r) * tilt * 1.55,
    vz: Math.cos(angle) * speed + (input.z / r) * tilt * 1.55,
    spin,
  };
}

export function filterTops(series, type, query) {
  const q = query.trim().toLowerCase();
  return TOPS.filter((top) => {
    if (series !== "ALL" && top.series !== series) return false;
    if (type !== "ALL" && top.type !== type) return false;
    if (!q) return true;
    const blob = `${top.code} ${top.name_zh} ${top.name_en} ${top.name_jp} ${top.type} ${top.series}`.toLowerCase();
    return blob.includes(q);
  });
}
