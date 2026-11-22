// game.js — The Velvet Vault: a top-down stealth heist in one museum gallery.
// The thief crosses the room, grabs three stashes and slips out the green door while
// guards patrol with vision cones and cameras sweep the floor. Spotted thieves feed
// the alarm meter; at 100% the museum locks down. Coins distract a guard — at a cost.
// Keyboard: WASD/arrows move, SHIFT sneaks, E grabs (hold), Q tosses a coin, P pauses.
// A ?shot=<cover|stealth|alarm|win> URL stages a frozen scene for screenshots.

import { ROOM, LOOT_SPOTS, EXIT, ENTRANCE, blockedAt, inShadow } from './level.js';
import { createThief, createGuards, createCameras, updateThief, updateGuard, updateCamera } from './actors.js';
import { render } from './render.js';
import { sfx } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);

function freshState() {
  return {
    status: 'menu',
    time: 0, alarm: 0, loot: 0,
    thief: createThief(),
    guards: createGuards(),
    cameras: createCameras(),
    lootSpots: LOOT_SPOTS.map((l) => ({ ...l, taken: false })),
    coinsOnFloor: [],
    exitOpen: false,
    message: '', messageT: 0,
    caughtReason: '', winTime: 0,
    frozen: false, best: 0,
  };
}

let S = freshState();
try { S.best = +(localStorage.getItem('velvet-vault-best') || 0); } catch (e) { S.best = 0; }

const input = { up: false, down: false, left: false, right: false, sneak: false, grab: false };

function setMessage(text) {
  S.message = text;
  S.messageT = 3;
}

function endCaught(reason) {
  if (S.status !== 'playing') return;
  S.status = 'caught';
  S.caughtReason = reason;
  sfx.caught();
}

function endWin() {
  if (S.status !== 'playing') return;
  S.status = 'win';
  S.winTime = S.time;
  if (!S.best || S.time < S.best) {
    S.best = S.time;
    try { localStorage.setItem('velvet-vault-best', String(S.best)); } catch (e) { /* no storage, no problem */ }
  }
  sfx.win();
}

function startGame() {
  const best = S.best;
  S = freshState();
  S.best = best;
  S.status = 'playing';
  setMessage('Grab all 3 stashes. Stay out of the cones.');
}

function tossCoin() {
  const t = S.thief;
  if (S.status !== 'playing' || t.coins <= 0) return;
  t.coins -= 1;
  let lx = t.x + Math.cos(t.dir) * 130;
  let ly = t.y + Math.sin(t.dir) * 130;
  lx = Math.max(ROOM.x + 16, Math.min(ROOM.x + ROOM.w - 16, lx));
  ly = Math.max(ROOM.y + 16, Math.min(ROOM.y + ROOM.h - 16, ly));
  if (blockedAt(lx, ly, 8)) { lx = t.x; ly = t.y; }
  S.coinsOnFloor.push({ x: lx, y: ly, t: 0 });
  sfx.coin();
  // The nearest guard in earshot goes to look at the coin.
  let bestG = null, bestD = 320;
  for (const g of S.guards) {
    const d = Math.hypot(g.x - lx, g.y - ly);
    if (d < bestD) { bestD = d; bestG = g; }
  }
  if (bestG) {
    bestG.coinPoint = { x: lx, y: ly };
    bestG.suspicion = Math.max(bestG.suspicion, 0.45);
    bestG.lastSeen = { x: lx, y: ly };
  }
  setMessage('Coin tossed — a guard goes to look.');
}

function update(dt) {
  if (S.status !== 'playing' || S.frozen) return;
  S.time += dt;

  updateThief(S.thief, input, dt);

  // Holding E near a stash grabs it (0.7 s channel).
  const t = S.thief;
  let near = null;
  for (const l of S.lootSpots) {
    if (!l.taken && Math.hypot(t.x - l.x, t.y - l.y) < 46) { near = l; break; }
  }
  if (input.grab && near) {
    t.grabbing += dt / 0.7;
    t.grabTarget = near;
    if (t.grabbing >= 1) {
      near.taken = true;
      S.loot += 1;
      t.grabbing = 0;
      t.grabTarget = null;
      sfx.pickup();
      setMessage(S.loot >= 3 ? 'Last stash! The exit is open — RUN!' : 'Stash grabbed — ' + S.loot + ' of 3.');
    }
  } else {
    t.grabbing = Math.max(0, t.grabbing - dt * 3);
  }

  for (const g of S.guards) {
    if (updateGuard(g, dt, S) === 'caught') return endCaught('A guard grabbed you in the gallery.');
  }
  for (const c of S.cameras) updateCamera(c, dt, S, S.time);

  // The alarm cools when nobody is watching the thief.
  S.alarm = Math.max(0, S.alarm - dt * 2.5);
  if (S.alarm >= 100) return endCaught('The alarm hit 100% — the museum locked down.');

  if (S.loot >= 3 && !S.exitOpen) {
    S.exitOpen = true;
    sfx.alert();
  }
  if (S.exitOpen && t.x > EXIT.x - 6 && t.x < EXIT.x + EXIT.w + 6 && t.y > EXIT.y - 10 && t.y < EXIT.y + EXIT.h + 6) {
    return endWin();
  }
  if (S.messageT > 0) S.messageT -= dt;
  for (const coin of S.coinsOnFloor) coin.t += dt;
  S.coinsOnFloor = S.coinsOnFloor.filter((coin) => coin.t < 6);
}

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (KEYMAP[e.code]) input[KEYMAP[e.code]] = true;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = true;
  if (e.code === 'KeyE') input.grab = true;
  if (e.code === 'KeyQ' && !e.repeat) tossCoin();
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (S.status === 'playing') S.status = 'paused';
    else if (S.status === 'paused') S.status = 'playing';
  }
  if (e.code === 'Enter') {
    if (S.status === 'menu') { startGame(); sfx.click(); }
  }
  if (e.code === 'KeyR') {
    if (S.status === 'caught' || S.status === 'win') startGame();
  }
});

window.addEventListener('keyup', (e) => {
  if (KEYMAP[e.code]) input[KEYMAP[e.code]] = false;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = false;
  if (e.code === 'KeyE') input.grab = false;
});

canvas.addEventListener('click', () => {
  if (S.status === 'menu') { startGame(); sfx.click(); }
});

// A ?shot= URL stages a frozen scene for screenshots instead of the menu.
if (params.has('shot')) {
  const name = params.get('shot') || 'cover';
  S.status = 'playing';
  stageShot(name, S);
  if (name !== 'win') S.status = 'playing';
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(ctx, S);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
