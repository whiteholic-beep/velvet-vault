// level.js — the Velvet Vault floor plan: one museum gallery the thief must cross.
// Walls, display cases (cover that blocks movement and sight), shadow pockets where the
// thief is harder to spot, the vault, three loot stashes, the exit, guard patrol routes
// and camera mounts. Everything is plain data; collision and sight use it.

export const VIEW = { w: 1280, h: 720 };
export const HUD_H = 84;

// Playable room interior (the HUD bar sits above it).
export const ROOM = { x: 36, y: 96, w: 1208, h: 588 };

// Display cases and the central pedestal: solid cover, blocks movement and line of sight.
export const COVERS = [
  { x: 300, y: 200, w: 140, h: 52 },
  { x: 840, y: 200, w: 140, h: 52 },
  { x: 300, y: 478, w: 140, h: 52 },
  { x: 840, y: 478, w: 140, h: 52 },
  { x: 590, y: 330, w: 100, h: 96 },
];

// The vault: a big safe on the north wall. Its gold is the main prize.
export const VAULT = { x: 580, y: 112, w: 120, h: 64 };

// Dark floor pockets: standing in one makes the thief much harder to spot.
export const SHADOWS = [
  { x: 96, y: 500, w: 220, h: 140 },
  { x: 964, y: 500, w: 220, h: 140 },
  { x: 96, y: 140, w: 180, h: 110 },
];

// Three loot stashes: the vault gold and two jewel cases.
export const LOOT_SPOTS = [
  { x: 640, y: 204, kind: 'vault' },
  { x: 370, y: 226, kind: 'case' },
  { x: 910, y: 226, kind: 'case' },
];

// The exit door on the south wall. Locked until all three stashes are taken.
export const EXIT = { x: 600, y: 652, w: 80, h: 32 };

// Where the thief slips in.
export const ENTRANCE = { x: 140, y: 620 };

// Guard patrol routes: [waypoints]. Guards walk them, pausing at each end.
export const GUARD_ROUTES = [
  [[300, 160], [980, 160]],
  [[980, 520], [300, 520]],
  [[1120, 220], [1120, 520]],
];

// Cameras hang on the north wall and sweep their cones up and down the room.
export const CAMERA_MOUNTS = [
  { x: 430, y: 100, sweep: 1.0, speed: 0.45, phase: 0 },
  { x: 850, y: 100, sweep: 1.0, speed: 0.45, phase: 1.6 },
];

function circleHitsRect(cx, cy, r, rc) {
  const nx = Math.max(rc.x, Math.min(cx, rc.x + rc.w));
  const ny = Math.max(rc.y, Math.min(cy, rc.y + rc.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// True when a circle of radius r at (x, y) would overlap a wall, a case or the vault.
export function blockedAt(x, y, r) {
  if (x - r < ROOM.x || x + r > ROOM.x + ROOM.w) return true;
  if (y - r < ROOM.y || y + r > ROOM.y + ROOM.h) return true;
  for (const c of COVERS) if (circleHitsRect(x, y, r, c)) return true;
  if (circleHitsRect(x, y, r, VAULT)) return true;
  return false;
}

// Move a circle by (dx, dy), sliding along obstacles axis by axis.
export function moveCircle(x, y, dx, dy, r) {
  let nx = x + dx;
  if (blockedAt(nx, y, r)) nx = x;
  let ny = y + dy;
  if (blockedAt(nx, ny, r)) ny = y;
  return [nx, ny];
}

export function inShadow(x, y) {
  return SHADOWS.some((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
}

function segHitsRect(x1, y1, x2, y2, rc) {
  const dx = x2 - x1, dy = y2 - y1;
  let tmin = 0, tmax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rc.x || x1 > rc.x + rc.w) return false;
  } else {
    let t1 = (rc.x - x1) / dx, t2 = (rc.x + rc.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rc.y || y1 > rc.y + rc.h) return false;
  } else {
    let t1 = (rc.y - y1) / dy, t2 = (rc.y + rc.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// True when a display case or the vault stands between two points.
export function blocksSight(x1, y1, x2, y2) {
  for (const c of COVERS) if (segHitsRect(x1, y1, x2, y2, c)) return true;
  if (segHitsRect(x1, y1, x2, y2, VAULT)) return true;
  return false;
}
