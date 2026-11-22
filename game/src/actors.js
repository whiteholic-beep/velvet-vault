// actors.js — the people and machines in the room: the thief, the patrolling guards
// and the sweeping cameras. Guards patrol, grow suspicious when they glimpse the thief,
// investigate, then chase; cameras sweep and feed the alarm directly.

import { moveCircle, GUARD_ROUTES, CAMERA_MOUNTS, ENTRANCE } from './level.js';
import { canSee, visibility } from './vision.js';

export const GUARD_RANGE = 215;
export const GUARD_HALF = 0.56;
export const CAMERA_RANGE = 250;
export const CAMERA_HALF = 0.44;

export function createThief() {
  return {
    x: ENTRANCE.x, y: ENTRANCE.y, r: 13,
    dir: -Math.PI / 2, sneak: false, moving: false,
    coins: 3, grabbing: 0, grabTarget: null,
  };
}

export function createGuards() {
  return GUARD_ROUTES.map((route, i) => ({
    x: route[0][0], y: route[0][1], r: 14,
    dir: 0, route, wp: 1,
    speed: 52 + i * 5, baseSpeed: 52 + i * 5,
    suspicion: 0, state: 'patrol',
    lastSeen: null, investT: 0, coinPoint: null, pauseT: 0,
  }));
}

export function createCameras() {
  return CAMERA_MOUNTS.map((m) => ({
    x: m.x, y: m.y, baseAngle: Math.PI / 2,
    sweep: m.sweep, speed: m.speed, phase: m.phase,
    angle: Math.PI / 2, sees: false,
  }));
}

function moveToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 6) return true;
  g.dir = Math.atan2(dy, dx);
  const step = Math.min(d, speed * dt);
  const [nx, ny] = moveCircle(g.x, g.y, (dx / d) * step, (dy / d) * step, g.r);
  g.x = nx; g.y = ny;
  return false;
}

// Move the thief with the input flags; sneak is slower but harder to spot.
export function updateThief(t, input, dt) {
  let dx = 0, dy = 0;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  t.moving = dx !== 0 || dy !== 0;
  if (!t.moving) return;
  const len = Math.hypot(dx, dy);
  t.dir = Math.atan2(dy, dx);
  const speed = input.sneak ? 95 : 172;
  t.sneak = !!input.sneak;
  const [nx, ny] = moveCircle(t.x, t.y, (dx / len) * speed * dt, (dy / len) * speed * dt, t.r);
  t.x = nx; t.y = ny;
}

// One guard tick. Returns 'caught' when the guard lays hands on the thief.
export function updateGuard(g, dt, S) {
  const t = S.thief;
  const vis = visibility(g.x, g.y, g.dir, GUARD_RANGE, GUARD_HALF, t.x, t.y);
  if (vis > 0) {
    g.suspicion = Math.min(1, g.suspicion + dt * 0.9 * vis * (t.sneak ? 0.55 : 1));
    g.lastSeen = { x: t.x, y: t.y };
  } else {
    g.suspicion = Math.max(0, g.suspicion - dt * 0.28);
  }
  g.state = g.suspicion >= 1 ? 'chase' : g.suspicion >= 0.5 ? 'suspect' : 'patrol';
  if (g.state === 'chase') S.alarm = Math.min(100, S.alarm + dt * 22);
  else if (g.state === 'suspect') S.alarm = Math.min(100, S.alarm + dt * 9);

  if (g.pauseT > 0) {
    g.pauseT -= dt;
    if (g.pauseT <= 0 && g.coinPoint) g.coinPoint = null;
  } else if (g.state === 'chase' && g.lastSeen) {
    moveToward(g, g.lastSeen.x, g.lastSeen.y, 132, dt);
  } else if (g.coinPoint) {
    if (moveToward(g, g.coinPoint.x, g.coinPoint.y, 82, dt)) g.pauseT = 3.5;
  } else if (g.state === 'suspect' && g.lastSeen) {
    moveToward(g, g.lastSeen.x, g.lastSeen.y, 78, dt);
  } else {
    const wp = g.route[g.wp];
    if (moveToward(g, wp[0], wp[1], g.speed, dt)) {
      g.wp = (g.wp + 1) % g.route.length;
      g.pauseT = 0.8;
    }
  }

  if (Math.hypot(t.x - g.x, t.y - g.y) < 26) return 'caught';
  return null;
}

// One camera tick: sweep the cone; a spotted thief feeds the alarm.
export function updateCamera(c, dt, S, time) {
  c.angle = c.baseAngle + Math.sin(time * c.speed + c.phase) * c.sweep * 0.5;
  const t = S.thief;
  c.sees = canSee(c.x, c.y, c.angle, CAMERA_RANGE, CAMERA_HALF, t.x, t.y);
  if (c.sees) S.alarm = Math.min(100, S.alarm + dt * 14);
}
