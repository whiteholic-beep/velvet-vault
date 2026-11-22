// render.js — everything the player sees, drawn on one canvas: the gallery floor,
// shadow pockets, display cases, the vault, loot, the exit, vision cones, guards,
// cameras, the thief, and the HUD (alarm meter, loot, coins, timer, objective).
// The colour language is deliberate: dark blue is safe cover, red is danger, gold is loot.

import { ROOM, COVERS, VAULT, SHADOWS, EXIT, HUD_H } from './level.js';
import { conePoints } from './vision.js';
import { GUARD_RANGE, GUARD_HALF, CAMERA_RANGE, CAMERA_HALF } from './actors.js';

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

function alarmColor(a) {
  if (a < 40) return '#37d67a';
  if (a < 70) return '#ffd60a';
  return '#ff3355';
}

function drawCone(c, pts, fill, edge) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = edge;
  c.lineWidth = 1.5;
  c.stroke();
}

export function render(c, S) {
  const W = 1280, H = 720;
  c.clearRect(0, 0, W, H);

  // ---- HUD bar ----
  c.fillStyle = '#10182c';
  c.fillRect(0, 0, W, HUD_H);
  c.fillStyle = '#c9a227';
  c.fillRect(0, HUD_H - 3, W, 3);
  c.fillStyle = '#f5d76e';
  c.font = 'bold 24px system-ui, sans-serif';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText('THE VELVET VAULT', 24, 26);
  c.fillStyle = '#8fa3c8';
  c.font = '14px system-ui, sans-serif';
  const objective = S.exitOpen ? 'EXIT OPEN — run for the green door!' : 'Grab all 3 stashes, then reach the exit. Stay out of the cones.';
  c.fillText(objective, 24, 56);

  // Alarm meter, centre-top.
  c.textAlign = 'center';
  c.fillStyle = '#8fa3c8';
  c.font = 'bold 13px system-ui, sans-serif';
  c.fillText('ALARM', 640, 16);
  c.fillStyle = '#0a0e1a';
  c.strokeStyle = '#3a4a6b';
  c.lineWidth = 2;
  c.beginPath();
  c.roundRect(480, 26, 320, 22, 6);
  c.fill();
  c.stroke();
  c.fillStyle = alarmColor(S.alarm);
  const aw = Math.max(0, Math.min(1, S.alarm / 100)) * 316;
  if (aw > 2) {
    c.beginPath();
    c.roundRect(482, 28, aw, 18, 5);
    c.fill();
  }
  c.fillStyle = '#ffffff';
  c.font = 'bold 13px system-ui, sans-serif';
  c.fillText(Math.round(S.alarm) + '%', 640, 37);

  // Loot, coins and timer, right side.
  c.textAlign = 'right';
  c.fillStyle = '#f5d76e';
  c.font = 'bold 20px system-ui, sans-serif';
  c.fillText('◆ ' + S.loot + ' / 3', 1060, 26);
  c.fillStyle = '#e8ecf5';
  c.font = '16px system-ui, sans-serif';
  c.fillText('● coins × ' + S.thief.coins, 1060, 54);
  c.fillStyle = '#8fa3c8';
  c.font = 'bold 20px system-ui, sans-serif';
  c.fillText(fmtTime(S.time), 1256, 26);
  c.fillStyle = '#8fa3c8';
  c.font = '13px system-ui, sans-serif';
  c.fillText(S.best ? 'best ' + fmtTime(S.best) : 'no best time yet', 1256, 54);

  // ---- Room floor ----
  c.fillStyle = '#141b2e';
  c.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  c.strokeStyle = 'rgba(255,255,255,0.05)';
  c.lineWidth = 1;
  for (let x = ROOM.x + 40; x < ROOM.x + ROOM.w; x += 40) {
    c.beginPath(); c.moveTo(x, ROOM.y); c.lineTo(x, ROOM.y + ROOM.h); c.stroke();
  }
  for (let y = ROOM.y + 40; y < ROOM.y + ROOM.h; y += 40) {
    c.beginPath(); c.moveTo(ROOM.x, y); c.lineTo(ROOM.x + ROOM.w, y); c.stroke();
  }
  // Walls.
  c.strokeStyle = '#2e6f6a';
  c.lineWidth = 6;
  c.strokeRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);

  // Shadow pockets.
  for (const s of SHADOWS) {
    c.fillStyle = 'rgba(4, 8, 20, 0.55)';
    c.fillRect(s.x, s.y, s.w, s.h);
    c.strokeStyle = 'rgba(120, 160, 255, 0.25)';
    c.lineWidth = 1;
    c.strokeRect(s.x, s.y, s.w, s.h);
  }

  // Display cases (cover).
  for (const cv of COVERS) {
    c.fillStyle = '#1e2a44';
    c.fillRect(cv.x, cv.y, cv.w, cv.h);
    c.fillStyle = 'rgba(140, 200, 255, 0.14)';
    c.fillRect(cv.x + 4, cv.y + 4, cv.w - 8, cv.h - 8);
    c.strokeStyle = '#c9a227';
    c.lineWidth = 2;
    c.strokeRect(cv.x, cv.y, cv.w, cv.h);
  }

  // The vault.
  c.fillStyle = '#232c42';
  c.fillRect(VAULT.x, VAULT.y, VAULT.w, VAULT.h);
  c.fillStyle = '#c9a227';
  c.fillRect(VAULT.x + 14, VAULT.y + 10, VAULT.w - 28, VAULT.h - 20);
  c.fillStyle = '#232c42';
  c.beginPath();
  c.arc(VAULT.x + VAULT.w / 2, VAULT.y + VAULT.h / 2, 13, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f5d76e';
  c.font = 'bold 12px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText('VAULT', VAULT.x + VAULT.w / 2, VAULT.y + VAULT.h - 4);

  // Loot stashes.
  for (const l of S.lootSpots) {
    if (l.taken) continue;
    const pulse = 1 + 0.15 * Math.sin(S.time * 4 + l.x);
    c.save();
    c.translate(l.x, l.y);
    c.scale(pulse, pulse);
    c.fillStyle = 'rgba(245, 215, 110, 0.25)';
    c.beginPath(); c.arc(0, 0, 20, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f5d76e';
    c.beginPath();
    c.moveTo(0, -11); c.lineTo(9, 0); c.lineTo(0, 11); c.lineTo(-9, 0);
    c.closePath(); c.fill();
    c.fillStyle = '#fff3c4';
    c.beginPath();
    c.moveTo(0, -6); c.lineTo(4, 0); c.lineTo(0, 6); c.lineTo(-4, 0);
    c.closePath(); c.fill();
    c.restore();
  }

  // Exit door.
  c.fillStyle = S.exitOpen ? '#1f9d55' : '#3a2430';
  c.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  c.strokeStyle = S.exitOpen ? '#37d67a' : '#8a4a5a';
  c.lineWidth = 2;
  c.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  c.fillStyle = S.exitOpen ? '#d8ffe9' : '#c98a96';
  c.font = 'bold 13px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText(S.exitOpen ? 'EXIT' : 'LOCKED', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 1);
  if (S.exitOpen) {
    c.fillStyle = 'rgba(55, 214, 122, 0.18)';
    c.fillRect(EXIT.x - 14, EXIT.y - 26, EXIT.w + 28, EXIT.h + 26);
  }

  // Tossed coins.
  for (const coin of S.coinsOnFloor) {
    c.fillStyle = '#f5d76e';
    c.beginPath(); c.arc(coin.x, coin.y, 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(245, 215, 110, 0.6)';
    c.beginPath(); c.arc(coin.x, coin.y, 10 + 4 * Math.sin(S.time * 6), 0, Math.PI * 2); c.stroke();
  }

  // Camera cones.
  for (const cam of S.cameras) {
    const pts = conePoints(cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF);
    drawCone(c, pts, cam.sees ? 'rgba(255, 51, 85, 0.22)' : 'rgba(255, 51, 170, 0.13)', cam.sees ? 'rgba(255, 51, 85, 0.55)' : 'rgba(255, 51, 170, 0.35)');
  }
  // Guard cones.
  for (const g of S.guards) {
    const pts = conePoints(g.x, g.y, g.dir, GUARD_RANGE, GUARD_HALF);
    const col = g.state === 'chase' ? ['rgba(255, 51, 85, 0.24)', 'rgba(255, 51, 85, 0.6)']
      : g.state === 'suspect' ? ['rgba(255, 159, 28, 0.20)', 'rgba(255, 159, 28, 0.5)']
      : ['rgba(255, 214, 10, 0.15)', 'rgba(255, 214, 10, 0.4)'];
    drawCone(c, pts, col[0], col[1]);
  }

  // Cameras (wall mounts).
  for (const cam of S.cameras) {
    c.fillStyle = '#2b3448';
    c.beginPath(); c.arc(cam.x, cam.y, 10, 0, Math.PI * 2); c.fill();
    c.fillStyle = cam.sees ? '#ff3355' : '#ff33aa';
    c.beginPath(); c.arc(cam.x, cam.y, 4, 0, Math.PI * 2); c.fill();
  }

  // Guards.
  for (const g of S.guards) {
    c.fillStyle = '#3b5bdb';
    c.beginPath(); c.arc(g.x, g.y, g.r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#dbe4ff';
    c.lineWidth = 2;
    c.beginPath(); c.arc(g.x, g.y, g.r, 0, Math.PI * 2); c.stroke();
    // Visor facing the patrol direction.
    c.strokeStyle = '#ffffff';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(g.x + Math.cos(g.dir - 0.5) * (g.r - 2), g.y + Math.sin(g.dir - 0.5) * (g.r - 2));
    c.lineTo(g.x + Math.cos(g.dir) * (g.r + 3), g.y + Math.sin(g.dir) * (g.r + 3));
    c.lineTo(g.x + Math.cos(g.dir + 0.5) * (g.r - 2), g.y + Math.sin(g.dir + 0.5) * (g.r - 2));
    c.stroke();
    // Suspicion arc + mark.
    if (g.suspicion > 0.05) {
      c.strokeStyle = g.state === 'chase' ? '#ff3355' : '#ff9f1c';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(g.x, g.y, g.r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.suspicion);
      c.stroke();
    }
    if (g.state === 'chase') {
      c.fillStyle = '#ff3355';
      c.font = 'bold 20px system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillText('!', g.x, g.y - g.r - 10);
    } else if (g.state === 'suspect') {
      c.fillStyle = '#ff9f1c';
      c.font = 'bold 20px system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillText('?', g.x, g.y - g.r - 10);
    }
  }

  // The thief.
  const t = S.thief;
  c.fillStyle = 'rgba(0, 0, 0, 0.35)';
  c.beginPath(); c.ellipse(t.x, t.y + 10, 13, 5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#111827';
  c.beginPath(); c.arc(t.x, t.y, t.r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#f5d76e';
  c.lineWidth = 2.5;
  c.beginPath(); c.arc(t.x, t.y, t.r, 0, Math.PI * 2); c.stroke();
  // Eyes toward the facing direction.
  const ex = Math.cos(t.dir), ey = Math.sin(t.dir);
  const px = -ey, py = ex;
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(t.x + ex * 5 + px * 4, t.y + ey * 5 + py * 4, 2.2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(t.x + ex * 5 - px * 4, t.y + ey * 5 - py * 4, 2.2, 0, Math.PI * 2); c.fill();
  if (t.sneak) {
    c.strokeStyle = 'rgba(245, 215, 110, 0.6)';
    c.setLineDash([4, 4]);
    c.beginPath(); c.arc(t.x, t.y, t.r + 6, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
  }
  // Grab progress ring.
  if (t.grabbing > 0) {
    c.strokeStyle = '#f5d76e';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(t.x, t.y, t.r + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t.grabbing);
    c.stroke();
  }

  // Toast message, tucked at the top-left so the vault stays visible.
  if (S.messageT > 0 && S.message) {
    c.fillStyle = 'rgba(10, 14, 26, 0.85)';
    c.font = 'bold 18px system-ui, sans-serif';
    const w = c.measureText(S.message).width + 36;
    c.beginPath();
    c.roundRect(24, 96, w, 36, 8);
    c.fill();
    c.fillStyle = '#f5d76e';
    c.textAlign = 'left';
    c.fillText(S.message, 42, 114);
  }

  // ---- Overlays ----
  if (S.status === 'menu') {
    c.fillStyle = 'rgba(7, 10, 20, 0.78)';
    c.fillRect(0, 0, W, H);
    c.textAlign = 'center';
    c.fillStyle = '#f5d76e';
    c.font = 'bold 64px system-ui, sans-serif';
    c.fillText('THE VELVET VAULT', W / 2, 250);
    c.fillStyle = '#e8ecf5';
    c.font = '22px system-ui, sans-serif';
    c.fillText('One thief. Three guards. Two cameras. One vault of gold.', W / 2, 300);
    c.fillStyle = '#8fa3c8';
    c.font = '18px system-ui, sans-serif';
    c.fillText('WASD / arrows — move      SHIFT — sneak      E — grab loot (hold)', W / 2, 360);
    c.fillText('Q — toss a coin to distract a guard      P — pause', W / 2, 392);
    c.fillText('Grab all 3 stashes, then slip out the green door. If the alarm', W / 2, 436);
    c.fillText('hits 100% — or a guard lays hands on you — the heist is over.', W / 2, 464);
    c.fillStyle = '#37d67a';
    c.font = 'bold 24px system-ui, sans-serif';
    c.fillText('Press ENTER or click to start', W / 2, 530);
  } else if (S.status === 'caught') {
    c.fillStyle = 'rgba(60, 5, 15, 0.72)';
    c.fillRect(0, 0, W, H);
    c.textAlign = 'center';
    c.fillStyle = '#ff5c73';
    c.font = 'bold 56px system-ui, sans-serif';
    c.fillText('BUSTED!', W / 2, 300);
    c.fillStyle = '#ffd9de';
    c.font = '22px system-ui, sans-serif';
    c.fillText(S.caughtReason, W / 2, 350);
    c.fillStyle = '#8fa3c8';
    c.font = '18px system-ui, sans-serif';
    c.fillText('Loot grabbed: ' + S.loot + ' / 3      Time: ' + fmtTime(S.time), W / 2, 400);
    c.fillStyle = '#37d67a';
    c.font = 'bold 22px system-ui, sans-serif';
    c.fillText('Press R to try again', W / 2, 460);
  } else if (S.status === 'win') {
    c.fillStyle = 'rgba(10, 30, 16, 0.72)';
    c.fillRect(0, 0, W, H);
    c.textAlign = 'center';
    c.fillStyle = '#f5d76e';
    c.font = 'bold 56px system-ui, sans-serif';
    c.fillText('CLEAN GETAWAY!', W / 2, 300);
    c.fillStyle = '#e8ecf5';
    c.font = '22px system-ui, sans-serif';
    c.fillText('All 3 stashes, out the door, no cuffs.', W / 2, 350);
    c.fillStyle = '#8fa3c8';
    c.font = '18px system-ui, sans-serif';
    c.fillText('Time: ' + fmtTime(S.winTime) + (S.best ? '      Best: ' + fmtTime(S.best) : ''), W / 2, 400);
    c.fillStyle = '#37d67a';
    c.font = 'bold 22px system-ui, sans-serif';
    c.fillText('Press R to run it again, faster', W / 2, 460);
  } else if (S.status === 'paused') {
    c.fillStyle = 'rgba(7, 10, 20, 0.6)';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#e8ecf5';
    c.font = 'bold 44px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText('PAUSED', W / 2, 360);
    c.font = '18px system-ui, sans-serif';
    c.fillText('Press P to keep sneaking', W / 2, 400);
  }
}
