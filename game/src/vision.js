// vision.js — vision cones and line of sight: what a guard or a camera can see,
// and how strongly. A cone is a direction, a range and a half-angle; sight also needs
// an unblocked line (level.blocksSight) and is weaker in shadow and at long range.

import { blocksSight, inShadow } from './level.js';

// Points of a cone fan, for drawing: the origin, then an arc of points.
export function conePoints(ox, oy, angle, range, half) {
  const pts = [[ox, oy]];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const a = angle - half + (2 * half * i) / steps;
    pts.push([ox + Math.cos(a) * range, oy + Math.sin(a) * range]);
  }
  return pts;
}

export function pointInCone(px, py, ox, oy, angle, range, half) {
  const dx = px - ox, dy = py - oy;
  if (dx * dx + dy * dy > range * range) return false;
  let da = Math.atan2(dy, dx) - angle;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  return Math.abs(da) <= half;
}

// True when (tx, ty) is inside the cone and nothing blocks the view.
export function canSee(ox, oy, angle, range, half, tx, ty) {
  if (!pointInCone(tx, ty, ox, oy, angle, range, half)) return false;
  return !blocksSight(ox, oy, tx, ty);
}

// How strongly a watcher at (ox, oy) spots a target: 0 when unseen, above 1 up close.
export function visibility(ox, oy, angle, range, half, tx, ty) {
  if (!canSee(ox, oy, angle, range, half, tx, ty)) return 0;
  const d = Math.hypot(tx - ox, ty - oy);
  const near = d < 110 ? 1.35 : 1;
  const shade = inShadow(tx, ty) ? 0.45 : 1;
  return Math.min(1.4, near * shade);
}
