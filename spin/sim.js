// Stadium physics for two Beyblade X tops. No rendering, no DOM.

export const STADIUM = {
  rail: 1.72,
  wall: 2.12,
  mouth: 1.9,
  exit: 2.36,
  place: 1.48,
};

// Angle 0 points toward +Z (near side / bottom of the top-down map).
// The far wall is solid, so a shot up the middle is caught by the rail.
// Xtreme pocket sits upper-left; Over pockets sit on the two sides.
export const ZONES = [
  { id: "xtreme", center: Math.PI * 0.72, half: 0.4, kind: "xtreme" },
  { id: "overL", center: -Math.PI * 0.55, half: 0.28, kind: "over" },
  { id: "overR", center: Math.PI * 0.48, half: 0.28, kind: "over" },
];

export function angleInZone(angle) {
  for (const zone of ZONES) {
    let d = angle - zone.center;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) <= zone.half) return zone;
  }
  return null;
}

const STOP_SPIN = 1.2;

export function createFighter(stats, launch) {
  return {
    x: launch.x,
    z: launch.z,
    vx: launch.vx,
    vz: launch.vz,
    spin: launch.spin,
    mass: stats.mass,
    radius: stats.radius,
    drive: stats.drive,
    decay: stats.decay,
    restitution: stats.restitution,
    agility: stats.agility,
    drag: stats.drag,
    dashAccel: stats.dashAccel,
    atk: stats.atk,
    burstResist: stats.burstResist,
    bitRadial: stats.bitRadial,
    left: !!stats.left,
    type: stats.type,
    wobbleBias: stats.wobbleBias || 0,
    railTime: 0,
    phase: Math.atan2(launch.x, launch.z + 0.001),
    wobble: 0,
    hitWobble: 0,
    stopped: false,
    stopAt: -1,
    burst: false,
    onRail: false,
    alive: true,
    hitCd: 0,
    yeet: 0,
  };
}

export function separateSpawns(a, b) {
  let dx = b.x - a.x;
  let dz = b.z - a.z;
  let d = Math.hypot(dx, dz);
  const min = a.radius + b.radius + 0.2;
  if (d >= min) return;
  if (d < 1e-4) {
    dx = min;
    dz = 0;
    d = min;
  }
  const push = (min - d) / 2 + 0.01;
  a.x -= (dx / d) * push;
  a.z -= (dz / d) * push;
  b.x += (dx / d) * push;
  b.z += (dz / d) * push;
}

function integrate(f, dt, time) {
  const r = Math.hypot(f.x, f.z);
  const nx = r > 0.001 ? f.x / r : 0;
  const nz = r > 0.001 ? f.z / r : 1;
  const spinSign = f.left ? -1 : 1;
  const tx = (r > 0.001 ? f.z / r : 0) * spinSign;
  const tz = (r > 0.001 ? -f.x / r : -spinSign) * spinSign;
  const energy = Math.max(0, Math.min(1, f.spin / 100));
  const driveNow = f.drive * (0.2 + 0.8 * energy);
  const zone = r > 0.001 ? angleInZone(Math.atan2(f.x, f.z)) : null;
  const inMouth = !!(zone && r > STADIUM.mouth);

  f.escaping = false;
  f.onRail = !inMouth && r > STADIUM.rail && r < STADIUM.wall + 0.08 && f.spin > 16;
  if (f.onRail) f.railTime += dt;
  else if (!inMouth) f.railTime = Math.max(0, f.railTime - dt * 0.35);

  if (f.spin > STOP_SPIN) {
    if (!inMouth) {
      f.vx += -nx * r * 0.38 * dt;
      f.vz += -nz * r * 0.38 * dt;
    }
    f.phase += dt * (1.7 + f.drive * 0.12) * (0.55 + 0.45 * energy);
    const flower = Math.sin(f.phase);
    const amp = 0.5 + Math.max(0, f.bitRadial) * 0.85;
    const prefer = Math.max(0.2, Math.min(1.9, 0.42 + f.bitRadial * 1.45 + flower * amp));
    const radial = f.bitRadial * 0.35 + flower * f.drive * 0.22;
    const targetVx = tx * driveNow + nx * radial;
    const targetVz = tz * driveNow + nz * radial;
    const blend = Math.min(1, f.agility * dt);
    f.vx += (targetVx - f.vx) * blend;
    f.vz += (targetVz - f.vz) * blend;
    const vrNow = f.vx * nx + f.vz * nz;
    f.yeet = Math.max(0, f.yeet - dt);
    const riding = f.onRail && f.dashAccel > 5;
    const springScale = f.yeet > 0 && vrNow > 0.7 ? 0 : (riding ? 0.28 : 1);
    const spring = (prefer - r) * 4.2 * dt * springScale;
    f.vx += nx * spring;
    f.vz += nz * spring;
    const gain = (1 - Math.exp(-6.5 * dt)) * springScale;
    f.x += nx * (prefer - r) * gain;
    f.z += nz * (prefer - r) * gain;
    if (f.onRail) {
      f.vx += tx * f.dashAccel * energy * dt;
      f.vz += tz * f.dashAccel * energy * dt;
    }
    f.hitCd = Math.max(0, f.hitCd - dt);
    if (inMouth) {
      const vr = f.vx * nx + f.vz * nz;
      const knocked = vr > 1.2 || (f.yeet > 0 && vr > 0.55);
      const caught = Math.sin(f.phase * 2.7) > 0.55;
      const dashOut = zone.kind === "xtreme" && f.dashAccel > 6 && f.railTime > 0.8 && energy > 0.5 && caught && vr > -0.05;
      if (knocked || dashOut) {
        f.escaping = true;
        const boost = dashOut ? 8.4 : 3.4;
        f.vx += nx * boost * dt;
        f.vz += nz * boost * dt;
      } else if (vr > 0) {
        f.vx -= vr * nx * 0.65;
        f.vz -= vr * nz * 0.65;
      }
    }
  }

  const sp = Math.hypot(f.vx, f.vz);
  const cap = 8.4;
  if (sp > cap) {
    f.vx *= cap / sp;
    f.vz *= cap / sp;
  }

  f.vx *= Math.exp(-f.drag * dt);
  f.vz *= Math.exp(-f.drag * dt);
  if (f.spin <= STOP_SPIN) {
    const slide = Math.exp(-3.6 * dt);
    f.vx *= slide;
    f.vz *= slide;
  }

  f.x += f.vx * dt;
  f.z += f.vz * dt;

  const wobbleMul = 1 + f.hitWobble * 0.65 + f.wobbleBias;
  let decay = f.decay;
  if (time > 7.5) decay *= 1 + (time - 7.5) * 0.5;
  f.spin = Math.max(0, f.spin - decay * wobbleMul * dt);
  f.hitWobble = Math.max(0, f.hitWobble - dt * 0.9);
  f.wobble = (1 - energy) * 0.62 + f.hitWobble + f.wobbleBias;

  if (!f.stopped && f.spin <= STOP_SPIN && Math.hypot(f.vx, f.vz) < 0.9) {
    f.stopped = true;
  }
}

function constrain(f) {
  const r = Math.hypot(f.x, f.z);
  if (r < 1e-5) return;
  const zone = angleInZone(Math.atan2(f.x, f.z));
  const open = zone && r > STADIUM.mouth && f.escaping;
  if (r > STADIUM.wall && !open) {
    const ux = f.x / r;
    const uz = f.z / r;
    f.x = ux * STADIUM.wall;
    f.z = uz * STADIUM.wall;
    const vr = f.vx * ux + f.vz * uz;
    f.vx -= vr * ux;
    f.vz -= vr * uz;
  }
  const r2 = Math.hypot(f.x, f.z);
  if (r2 > 3.4) {
    f.x *= 3.4 / r2;
    f.z *= 3.4 / r2;
  }
}

function collide(a, b) {
  let dx = b.x - a.x;
  let dz = b.z - a.z;
  let d = Math.hypot(dx, dz);
  const min = a.radius + b.radius;
  if (d < 1e-5) {
    dx = min;
    dz = 0;
    d = min;
  }
  if (d >= min) return null;
  const nx = dx / d;
  const nz = dz / d;
  const pen = min - d;
  const invA = 1 / a.mass;
  const invB = 1 / b.mass;
  const inv = invA + invB;
  a.x -= nx * pen * (invA / inv);
  a.z -= nz * pen * (invA / inv);
  b.x += nx * pen * (invB / inv);
  b.z += nz * pen * (invB / inv);

  const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
  const opposite = a.left !== b.left;
  let j = 0;
  if (rv < 0) {
    const eBase = Math.max(a.restitution, b.restitution);
    const e = Math.min(0.94, eBase * (opposite ? 1.14 : 0.9));
    j = -(1 + e) * rv / inv;
    if (opposite) j *= 1.18;
  }
  if (a.hitCd <= 0 && b.hitCd <= 0 && a.spin > 10 && b.spin > 10) {
    const spinPush = ((a.spin + b.spin) / 100) * (1.05 + (a.atk + b.atk) / 240) * (opposite ? 1.55 : 1);
    j += spinPush;
    a.hitCd = 0.32;
    b.hitCd = 0.32;
  }
  if (j <= 0.05) {
    return { impulse: 0, x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, opposite };
  }
  a.vx -= j * nx * invA;
  a.vz -= j * nz * invA;
  b.vx += j * nx * invB;
  b.vz += j * nz * invB;

  const impulse = Math.abs(j);
  const steal = impulse * (opposite ? 1.15 : 0.22);
  if (a.spin >= b.spin) {
    const take = Math.min(b.spin, steal);
    b.spin -= take;
    a.spin = Math.min(100, a.spin + take * (opposite ? 0.34 : 0.06));
  } else {
    const take = Math.min(a.spin, steal);
    a.spin -= take;
    b.spin = Math.min(100, b.spin + take * (opposite ? 0.34 : 0.06));
  }
  a.spin = Math.max(0, a.spin - impulse * 0.48 * (b.atk / 78));
  b.spin = Math.max(0, b.spin - impulse * 0.48 * (a.atk / 78));
  if (impulse > 2.4) {
    a.yeet = Math.max(a.yeet, 0.42);
    b.yeet = Math.max(b.yeet, 0.42);
  }
  const wob = Math.min(0.8, impulse * 0.05);
  a.hitWobble = Math.min(0.95, a.hitWobble + wob * (0.75 + b.atk / 140));
  b.hitWobble = Math.min(0.95, b.hitWobble + wob * (0.75 + a.atk / 140));
  return { impulse, x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, opposite };
}

function shouldBurst(defender, impulse, attacker) {
  if (impulse < 4.6) return false;
  const power = impulse * (0.62 + attacker.atk / 160);
  const need = 7.4 + defender.burstResist * 0.042;
  return power > need;
}

function exited(f) {
  const r = Math.hypot(f.x, f.z);
  if (r < STADIUM.exit) return null;
  const zone = angleInZone(Math.atan2(f.x, f.z));
  return zone ? zone.kind : null;
}

function spinWinner(a, b) {
  if (a.stopped && b.stopped) {
    if (Math.abs(a.stopAt - b.stopAt) < 0.08) return a.spin >= b.spin ? "a" : "b";
    return a.stopAt > b.stopAt ? "a" : "b";
  }
  if (a.stopped && !b.stopped && b.spin > 7) return "b";
  if (b.stopped && !a.stopped && a.spin > 7) return "a";
  return null;
}

function detect(a, b, time) {
  const ax = exited(a);
  const bx = exited(b);
  if (ax || bx) {
    if (ax && bx) {
      const ar = Math.hypot(a.x, a.z);
      const br = Math.hypot(b.x, b.z);
      return ar >= br ? { kind: ax, scorer: "b" } : { kind: bx, scorer: "a" };
    }
    return ax ? { kind: ax, scorer: "b" } : { kind: bx, scorer: "a" };
  }
  if (time > 0.85) {
    const sw = spinWinner(a, b);
    if (sw) return { kind: "spin", scorer: sw };
  }
  if (time > 14.5) return { kind: "spin", scorer: a.spin >= b.spin ? "a" : "b" };
  return null;
}

export function stepPair(a, b, dt, time) {
  const n = 2;
  const h = dt / n;
  let hit = null;
  let finish = null;
  for (let i = 0; i < n; i += 1) {
    const t = time + h * (i + 1);
    integrate(a, h, t);
    integrate(b, h, t);
    if (a.stopped && a.stopAt < 0) a.stopAt = t;
    if (b.stopped && b.stopAt < 0) b.stopAt = t;
    const contact = collide(a, b);
    if (contact && (!hit || contact.impulse > hit.impulse)) hit = contact;
    constrain(a);
    constrain(b);
    if (!finish && contact && contact.impulse > 0 && time > 0.35) {
      if (shouldBurst(a, contact.impulse, b)) {
        a.burst = true;
        finish = { kind: "burst", scorer: "b" };
      } else if (shouldBurst(b, contact.impulse, a)) {
        b.burst = true;
        finish = { kind: "burst", scorer: "a" };
      }
    }
    if (!finish) finish = detect(a, b, t);
    if (finish) break;
  }
  if (!Number.isFinite(a.x) || !Number.isFinite(a.z)) {
    a.x = 0;
    a.z = 0;
    a.vx = 0;
    a.vz = 0;
  }
  if (!Number.isFinite(b.x) || !Number.isFinite(b.z)) {
    b.x = 0;
    b.z = 0;
    b.vx = 0;
    b.vz = 0;
  }
  return { finish, hit };
}
