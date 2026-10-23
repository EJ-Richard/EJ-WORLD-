// Taiwan old-town layout. x = east, y = north (becomes +Z in the 3D scene).
// District areas follow video counts; each town seed stays inside its own land.

const LON0 = 120.95;
const LAT0 = 23.70;
const COS = Math.cos((LAT0 * Math.PI) / 180);
const SCALE = 6.62;

export function project(lon, lat) {
  return [(lon - LON0) * COS * SCALE, (lat - LAT0) * SCALE];
}

const TAIWAN_LL = [
  [121.538, 25.298], [121.620, 25.268], [121.690, 25.210], [121.748, 25.168],
  [121.800, 25.150], [121.860, 25.142], [121.930, 25.118], [121.992, 25.010],
  [121.900, 24.930], [121.835, 24.820], [121.800, 24.700], [121.855, 24.595],
  [121.790, 24.430], [121.710, 24.250], [121.635, 24.040], [121.555, 23.780],
  [121.500, 23.500], [121.455, 23.240], [121.350, 22.980], [121.200, 22.760],
  [121.070, 22.540], [120.990, 22.340], [120.900, 22.180], [120.850, 21.990],
  [120.835, 21.895], [120.760, 21.960], [120.670, 22.080], [120.620, 22.220],
  [120.580, 22.380], [120.490, 22.500], [120.360, 22.580], [120.260, 22.670],
  [120.190, 22.820], [120.140, 22.980], [120.085, 23.140], [120.065, 23.320],
  [120.095, 23.500], [120.135, 23.680], [120.110, 23.840], [120.200, 23.980],
  [120.360, 24.110], [120.490, 24.260], [120.620, 24.450], [120.760, 24.660],
  [120.920, 24.840], [121.070, 25.000], [121.210, 25.130], [121.360, 25.185],
  [121.445, 25.240], [121.500, 25.285],
];

const RIDGE_LL = [
  [121.48, 25.02, 0.55, 0.55],
  [121.38, 24.72, 0.95, 0.72],
  [121.22, 24.40, 1.25, 0.88],
  [121.08, 24.08, 1.55, 1.00],
  [120.98, 23.72, 1.85, 1.05],
  [120.94, 23.38, 1.65, 0.95],
  [120.92, 23.05, 1.30, 0.82],
  [120.88, 22.72, 0.95, 0.62],
  [120.84, 22.42, 0.62, 0.45],
];

export const TOWNS = {
  internal: { name: "台中舊城", lon: 120.80, lat: 24.05, kind: "market", street: [0.12, 1] },
  basic: { name: "府城台南", lon: 120.30, lat: 23.08, kind: "tainan", street: [0.16, 1] },
  tuina: { name: "大溪", lon: 121.25, lat: 24.78, kind: "arcade", street: [1, 0.12] },
  food: { name: "美濃", lon: 120.50, lat: 22.82, kind: "hakka", street: [1, 0.06] },
  mind: { name: "花蓮鳳林", lon: 121.52, lat: 23.68, kind: "wood", street: [0.08, 1] },
  herb: { name: "大稻埕", lon: 121.51, lat: 25.04, kind: "herb", street: [0.04, 1] },
  skin: { name: "三峽", lon: 121.33, lat: 24.86, kind: "indigo", street: [1, 0.08] },
  season: { name: "宜蘭頭城", lon: 121.76, lat: 24.70, kind: "arcade", street: [0.38, 1] },
  eent: { name: "九份", lon: 121.87, lat: 25.08, kind: "hill", street: [0.62, 0.78] },
  onco: { name: "嘉義諸羅城", lon: 120.46, lat: 23.40, kind: "arcade", street: [1, 0.1] },
  gyn: { name: "安平", lon: 120.18, lat: 23.00, kind: "anping", street: [0.08, 1] },
  ped: { name: "新竹北埔", lon: 121.10, lat: 24.62, kind: "gate", street: [1, 0.12] },
  acu: { name: "淡水", lon: 121.45, lat: 25.16, kind: "tamsui", street: [0.18, 1] },
  formula: { name: "鹿港", lon: 120.50, lat: 24.10, kind: "temple", street: [0.1, 1] },
  diag: { name: "恆春古城", lon: 120.80, lat: 22.06, kind: "hengchun", street: [0.12, 1] },
  other: { name: "澎湖馬公", lon: 119.57, lat: 23.57, kind: "penghu", street: [1, 0.25] },
};

const MAIN_IDS = Object.keys(TOWNS).filter((id) => id !== "other");

export const LAND = {
  internal: 0xd2c09a, basic: 0xcbb892, tuina: 0xb7c48a, food: 0xc5d29a,
  mind: 0xa8c09a, herb: 0xd8c8a4, skin: 0x9bb48a, season: 0xb5d0a0,
  eent: 0x8ea37a, onco: 0xcfc4a2, gyn: 0xe0d2ae, ped: 0xc2c896,
  acu: 0xd8cfae, formula: 0xe4d8b4, diag: 0xd0c098, other: 0xe6d7b4,
};

const PENGHU_LOCAL = [
  [0.00, 0.62], [0.38, 0.48], [0.70, 0.18], [0.62, -0.18], [0.28, -0.42],
  [-0.08, -0.55], [-0.42, -0.30], [-0.62, 0.02], [-0.40, 0.36], [-0.12, 0.55],
];

function shoelace(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

export function pointInPoly(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi) inside = !inside;
  }
  return inside;
}

function ensureCCW(poly) {
  return shoelace(poly) < 0 ? poly.slice().reverse() : poly.slice();
}

function dedupe(poly) {
  const out = [];
  for (const p of poly) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-5) out.push(p);
  }
  if (out.length > 2 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 1e-4) out.pop();
  return out;
}

function rdp(points, eps) {
  if (points.length < 3) return points.slice();
  let maxD = 0, idx = 0;
  const a = points[0], b = points[points.length - 1];
  const abx = b[0] - a[0], aby = b[1] - a[1];
  const ab = Math.hypot(abx, aby) || 1;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const d = Math.abs((p[0] - a[0]) * aby - (p[1] - a[1]) * abx) / ab;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) return rdp(points.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(points.slice(idx), eps));
  return [a, b];
}

function simplifyClosed(poly, eps) {
  if (poly.length < 8) return poly;
  const s = rdp(poly.concat([poly[0]]), eps);
  if (s.length > 1 && Math.hypot(s[0][0] - s[s.length - 1][0], s[0][1] - s[s.length - 1][1]) < 1e-6) s.pop();
  return s.length >= 3 ? s : poly;
}

function expandPoly(poly, dist) {
  const n = poly.length;
  const sign = shoelace(poly) >= 0 ? 1 : -1;
  const out = [];
  for (let i = 0; i < n; i++) {
    const prev = poly[(i - 1 + n) % n], curr = poly[i], next = poly[(i + 1) % n];
    const e1x = curr[0] - prev[0], e1y = curr[1] - prev[1];
    const e2x = next[0] - curr[0], e2y = next[1] - curr[1];
    const l1 = Math.hypot(e1x, e1y) || 1, l2 = Math.hypot(e2x, e2y) || 1;
    let nx = (e1y / l1 + e2y / l2) * sign;
    let ny = (-e1x / l1 - e2x / l2) * sign;
    const nl = Math.hypot(nx, ny) || 1;
    out.push([curr[0] + (nx / nl) * dist, curr[1] + (ny / nl) * dist]);
  }
  return out;
}

function chaikin(poly) {
  const out = [];
  for (let i = 0, n = poly.length; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n];
    out.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25]);
    out.push([p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]);
  }
  return out;
}

function nudgeInside(poly, x, y) {
  if (pointInPoly(poly, x, y)) return [x, y];
  let cx = 0, cy = 0;
  for (const p of poly) { cx += p[0]; cy += p[1]; }
  cx /= poly.length; cy /= poly.length;
  let lo = 0, hi = 1;
  for (let k = 0; k < 28; k++) {
    const m = (lo + hi) / 2;
    if (pointInPoly(poly, x * (1 - m) + cx * m, y * (1 - m) + cy * m)) hi = m;
    else lo = m;
  }
  const m = Math.min(1, hi + 0.02);
  return [x * (1 - m) + cx * m, y * (1 - m) + cy * m];
}

function scaleToArea(poly, area) {
  const a = Math.abs(shoelace(poly)) || 1;
  const s = Math.sqrt(Math.max(area, 0.01) / a);
  let cx = 0, cy = 0;
  for (const p of poly) { cx += p[0]; cy += p[1]; }
  cx /= poly.length; cy /= poly.length;
  return poly.map((p) => [cx + (p[0] - cx) * s, cy + (p[1] - cy) * s]);
}

function contourOf(labels, id, nw, nh, ox, oy, res, seed) {
  const segs = [];
  const isIn = (x, y) => x >= 0 && y >= 0 && x < nw && y < nh && labels[y * nw + x] === id;
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      if (!isIn(x, y)) continue;
      const x0 = ox + x * res, x1 = x0 + res, y0 = oy + y * res, y1 = y0 + res;
      if (!isIn(x, y + 1)) segs.push([x1, y1, x0, y1]);
      if (!isIn(x + 1, y)) segs.push([x1, y0, x1, y1]);
      if (!isIn(x, y - 1)) segs.push([x0, y0, x1, y0]);
      if (!isIn(x - 1, y)) segs.push([x0, y1, x0, y0]);
    }
  }
  if (!segs.length) return null;
  const key = (x, y) => `${Math.round(x * 400)},${Math.round(y * 400)}`;
  const map = new Map();
  segs.forEach((s, i) => {
    const k = key(s[0], s[1]);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(i);
  });
  const used = new Uint8Array(segs.length);
  let best = null;
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    const loop = [];
    let cur = i;
    for (let guard = 0; guard < segs.length + 2 && !used[cur]; guard++) {
      used[cur] = 1;
      const s = segs[cur];
      loop.push([s[0], s[1]]);
      const nxts = map.get(key(s[2], s[3])) || [];
      let n = -1;
      for (const j of nxts) if (!used[j]) { n = j; break; }
      if (n < 0) break;
      cur = n;
    }
    if (!best || loop.length > best.length) best = loop;
  }
  if (!best || best.length < 6) return null;
  let poly = ensureCCW(dedupe(best));
  if (seed && !pointInPoly(poly, seed[0], seed[1])) return null;
  const grown = simplifyClosed(dedupe(expandPoly(poly, res * 0.35)), 0.05);
  if (grown.length >= 3 && (!seed || pointInPoly(grown, seed[0], seed[1]))) return ensureCCW(grown);
  return poly;
}

export function buildIsland(counts) {
  const taiwan = ensureCCW(dedupe(TAIWAN_LL.map(([lon, lat]) => project(lon, lat))));
  const sumMain = MAIN_IDS.reduce((s, id) => s + (counts[id] || 0), 0) || 1;
  const islandArea = Math.abs(shoelace(taiwan));
  const seeds = MAIN_IDS.map((id) => {
    const t = TOWNS[id];
    const p = project(t.lon, t.lat);
    return nudgeInside(taiwan, p[0], p[1]);
  });

  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const p of taiwan) {
    minx = Math.min(minx, p[0]); miny = Math.min(miny, p[1]);
    maxx = Math.max(maxx, p[0]); maxy = Math.max(maxy, p[1]);
  }
  const res = 0.072;
  const pad = 0.4;
  const ox = minx - pad, oy = miny - pad;
  const nw = Math.ceil((maxx - minx + pad * 2) / res);
  const nh = Math.ceil((maxy - miny + pad * 2) / res);
  const inside = [];
  for (let y = 0; y < nh; y++) {
    const wy = oy + (y + 0.5) * res;
    for (let x = 0; x < nw; x++) {
      if (pointInPoly(taiwan, ox + (x + 0.5) * res, wy)) inside.push(y * nw + x);
    }
  }
  const N = MAIN_IDS.length;
  const labels = new Int16Array(nw * nh);
  labels.fill(-1);
  for (const i of inside) {
    const x = i % nw, y = (i / nw) | 0;
    const wx = ox + (x + 0.5) * res, wy = oy + (y + 0.5) * res;
    let best = 0, bd = Infinity;
    for (let k = 0; k < N; k++) {
      const dx = wx - seeds[k][0], dy = wy - seeds[k][1];
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = k; }
    }
    labels[i] = best;
  }
  const lock = new Uint8Array(nw * nh);
  for (let k = 0; k < N; k++) {
    let bi = inside[0], bd = Infinity;
    for (const i of inside) {
      const x = i % nw, y = (i / nw) | 0;
      const dx = ox + (x + 0.5) * res - seeds[k][0];
      const dy = oy + (y + 0.5) * res - seeds[k][1];
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; bi = i; }
    }
    labels[bi] = k;
    lock[bi] = 1;
  }
  const got = new Array(N).fill(0);
  for (const i of inside) got[labels[i]]++;
  const target = MAIN_IDS.map((id) => (inside.length * (counts[id] || 0)) / sumMain);
  const neigh = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const ring = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
  const rel = (k) => (got[k] - target[k]) / Math.max(1, target[k]);
  // Only hand over a pixel when its town stays in one piece.
  function simplePoint(i, lab) {
    const x = i % nw, y = (i / nw) | 0;
    const p = ring.map(([dx, dy]) => {
      const xx = x + dx, yy = y + dy;
      return xx >= 0 && yy >= 0 && xx < nw && yy < nh && labels[yy * nw + xx] === lab ? 1 : 0;
    });
    let trans = 0;
    for (let t = 0; t < 8; t++) if (p[t] === 0 && p[(t + 1) % 8] === 1) trans++;
    const sum = p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + p[7];
    return trans === 1 && sum > 0;
  }

  let stuck = 0;
  for (let iter = 0; iter < 520 && stuck < 2; iter++) {
    let moved = 0;
    let uk = 0;
    for (let k = 1; k < N; k++) if (target[k] - got[k] > target[uk] - got[uk]) uk = k;
    if (target[uk] - got[uk] > 1) {
      const cands = [];
      const sx = seeds[uk][0], sy = seeds[uk][1];
      for (const i of inside) {
        if (labels[i] === uk || lock[i]) continue;
        const x = i % nw, y = (i / nw) | 0;
        let touch = false;
        for (let n = 0; n < 4; n++) {
          const xx = x + neigh[n][0], yy = y + neigh[n][1];
          if (xx >= 0 && yy >= 0 && xx < nw && yy < nh && labels[yy * nw + xx] === uk) { touch = true; break; }
        }
        if (!touch) continue;
        const o = labels[i];
        if (!(got[o] > target[o] + 0.5 || rel(uk) < rel(o) - 0.015)) continue;
        if (!simplePoint(i, o)) continue;
        const wx = ox + (x + 0.5) * res, wy = oy + (y + 0.5) * res;
        const dx = wx - sx, dy = wy - sy;
        cands.push([dx * dx + dy * dy, i]);
      }
      cands.sort((a, b) => a[0] - b[0]);
      const take = Math.min(cands.length, 48, Math.ceil(target[uk] - got[uk]));
      for (let t = 0; t < take; t++) {
        const i = cands[t][1];
        const o = labels[i];
        if (o === uk || lock[i] || !simplePoint(i, o)) continue;
        labels[i] = uk;
        got[o]--; got[uk]++;
        moved++;
      }
    }
    let ok = 0;
    for (let k = 1; k < N; k++) if (got[k] - target[k] > got[ok] - target[ok]) ok = k;
    if (got[ok] > target[ok] + 1) {
      const cands = [];
      const sx = seeds[ok][0], sy = seeds[ok][1];
      for (const i of inside) {
        if (labels[i] !== ok || lock[i]) continue;
        const x = i % nw, y = (i / nw) | 0;
        let bestN = -1, bestR = Infinity;
        for (let n = 0; n < 4; n++) {
          const xx = x + neigh[n][0], yy = y + neigh[n][1];
          if (xx < 0 || yy < 0 || xx >= nw || yy >= nh) continue;
          const L = labels[yy * nw + xx];
          if (L >= 0 && L !== ok && rel(L) < bestR) { bestR = rel(L); bestN = L; }
        }
        if (bestN < 0 || !(rel(bestN) < rel(ok) - 0.015)) continue;
        if (!simplePoint(i, ok)) continue;
        const wx = ox + (x + 0.5) * res, wy = oy + (y + 0.5) * res;
        const dx = wx - sx, dy = wy - sy;
        cands.push([-(dx * dx + dy * dy), i, bestN]);
      }
      cands.sort((a, b) => a[0] - b[0]);
      const give = Math.min(cands.length, 48, Math.floor(got[ok] - target[ok]));
      for (let t = 0; t < give; t++) {
        const i = cands[t][1];
        if (labels[i] !== ok || lock[i] || !simplePoint(i, ok)) continue;
        const x = i % nw, y = (i / nw) | 0;
        let n = -1, bestR = Infinity;
        for (let nn = 0; nn < 4; nn++) {
          const xx = x + neigh[nn][0], yy = y + neigh[nn][1];
          if (xx < 0 || yy < 0 || xx >= nw || yy >= nh) continue;
          const L = labels[yy * nw + xx];
          if (L >= 0 && L !== ok && rel(L) < bestR) { bestR = rel(L); n = L; }
        }
        if (n < 0) continue;
        labels[i] = n;
        got[ok]--; got[n]++;
        moved++;
      }
    }
    stuck = moved ? 0 : stuck + 1;
  }

  const cells = {};
  for (let k = 0; k < N; k++) {
    const id = MAIN_IDS[k];
    let poly = contourOf(labels, k, nw, nh, ox, oy, res, seeds[k]);
    if (!poly || !pointInPoly(poly, seeds[k][0], seeds[k][1])) {
      const s = seeds[k];
      poly = ensureCCW([[s[0] - 0.45, s[1] - 0.36], [s[0] + 0.45, s[1] - 0.3], [s[0] + 0.36, s[1] + 0.4], [s[0] - 0.4, s[1] + 0.32]]);
    }
    cells[id] = {
      id,
      poly,
      anchor: seeds[k],
      area: Math.abs(shoelace(poly)),
      target: ((counts[id] || 0) / sumMain) * islandArea,
    };
  }

  const penghuTarget = islandArea * ((counts.other || 0) / sumMain);
  let penghu = scaleToArea(ensureCCW(PENGHU_LOCAL.map((p) => [p[0], p[1]])), Math.max(0.35, penghuTarget));
  const pc = project(TOWNS.other.lon, TOWNS.other.lat);
  let pcx = 0, pcy = 0;
  for (const p of penghu) { pcx += p[0]; pcy += p[1]; }
  pcx /= penghu.length; pcy /= penghu.length;
  penghu = penghu.map((p) => [p[0] - pcx + pc[0], p[1] - pcy + pc[1]]);
  cells.other = {
    id: "other",
    poly: penghu,
    anchor: pc,
    area: Math.abs(shoelace(penghu)),
    target: penghuTarget,
  };

  const ridge = RIDGE_LL.map(([lon, lat, h, w]) => {
    const p = project(lon, lat);
    return { x: p[0], y: p[1], h, w };
  });

  let bminx = Infinity, bminy = Infinity, bmaxx = -Infinity, bmaxy = -Infinity;
  for (const c of Object.values(cells)) {
    for (const p of c.poly) {
      bminx = Math.min(bminx, p[0]); bminy = Math.min(bminy, p[1]);
      bmaxx = Math.max(bmaxx, p[0]); bmaxy = Math.max(bmaxy, p[1]);
    }
  }

  return {
    taiwan,
    cells,
    ridge,
    islandArea,
    bbox: { minx: bminx, miny: bminy, maxx: bmaxx, maxy: bmaxy },
  };
}
