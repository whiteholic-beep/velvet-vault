// shots.js — deterministic staged scenes for screenshots: the same game, frozen at
// four moments that show it at its best. The game reads ?shot=<name> from the URL,
// stages the scene, and renders it without advancing the simulation, so every
// screenshot is a real render of the game's own code in a browser.

import { createThief, createGuards, createCameras } from './actors.js';
import { LOOT_SPOTS } from './level.js';

function freshSpots() {
  return LOOT_SPOTS.map((l) => ({ ...l, taken: false }));
}

// Stage one named scene into the shared state S and freeze it for the camera.
export function stageShot(name, S) {
  S.thief = createThief();
  S.guards = createGuards();
  S.cameras = createCameras();
  S.lootSpots = freshSpots();
  S.coinsOnFloor = [];
  S.frozen = true;
  S.time = 42;
  S.alarm = 0;
  S.loot = 0;
  S.exitOpen = false;
  S.message = '';
  S.messageT = 0;

  if (name === 'stealth') {
    // The thief crouched in a shadow pocket while a cone sweeps just past.
    S.thief.x = 222; S.thief.y = 556; S.thief.dir = 0; S.thief.sneak = true;
    const g = S.guards[1];
    g.x = 430; g.y = 520; g.dir = 0; g.state = 'patrol'; g.suspicion = 0;
    S.guards[0].x = 700; S.guards[0].y = 160; S.guards[0].dir = Math.PI / 2;
    S.guards[2].x = 1120; S.guards[2].y = 420; S.guards[2].dir = Math.PI / 2;
    S.cameras[0].angle = Math.PI / 2 + 0.3;
    S.cameras[1].angle = Math.PI / 2 - 0.35;
    S.alarm = 12;
    S.message = 'Stay in the dark. Coins distract.';
    S.messageT = 999;
  } else if (name === 'alarm') {
    // Spotted mid-grab: cones red, a guard closing in, the meter nearly full.
    S.thief.x = 700; S.thief.y = 320; S.thief.dir = -Math.PI / 2;
    const g = S.guards[0];
    g.x = 648; g.y = 262; g.dir = Math.atan2(58, 52);
    g.state = 'chase'; g.suspicion = 1; g.lastSeen = { x: 700, y: 320 };
    S.guards[1].x = 700; S.guards[1].y = 520; S.guards[1].dir = -Math.PI / 2;
    S.guards[1].state = 'suspect'; S.guards[1].suspicion = 0.7;
    S.guards[2].x = 1120; S.guards[2].y = 300; S.guards[2].dir = Math.PI;
    S.cameras[0].angle = Math.PI / 2 + 0.45;
    S.cameras[0].sees = true;
    S.cameras[1].angle = Math.PI / 2 - 0.2;
    S.alarm = 78;
    S.loot = 2;
    S.lootSpots[0].taken = true;
    S.lootSpots[1].taken = true;
    S.message = 'SPOTTED — break line of sight!';
    S.messageT = 999;
  } else if (name === 'win') {
    // The getaway: all three stashes taken, the green door open, thief slipping out.
    S.loot = 3;
    for (const l of S.lootSpots) l.taken = true;
    S.exitOpen = true;
    S.thief.x = 640; S.thief.y = 636; S.thief.dir = Math.PI / 2;
    S.guards[0].x = 300; S.guards[0].y = 160; S.guards[0].dir = 0;
    S.guards[1].x = 980; S.guards[1].y = 520; S.guards[1].dir = Math.PI;
    S.guards[2].x = 1120; S.guards[2].y = 220; S.guards[2].dir = Math.PI / 2;
    S.cameras[0].angle = Math.PI / 2 - 0.4;
    S.cameras[1].angle = Math.PI / 2 + 0.4;
    S.alarm = 22;
    S.status = 'win';
    S.winTime = 192;
  } else {
    // cover: the whole heist in one frame — room, cones, cameras, loot, alarm meter.
    S.thief.x = 640; S.thief.y = 452; S.thief.dir = -Math.PI / 2;
    S.guards[0].x = 520; S.guards[0].y = 160; S.guards[0].dir = 0.9;
    S.guards[1].x = 820; S.guards[1].y = 520; S.guards[1].dir = Math.PI;
    S.guards[2].x = 1120; S.guards[2].y = 360; S.guards[2].dir = Math.PI / 2;
    S.cameras[0].angle = Math.PI / 2 + 0.3;
    S.cameras[1].angle = Math.PI / 2 - 0.35;
    S.alarm = 35;
    S.loot = 1;
    S.lootSpots[0].taken = true;
    S.message = 'Grab the gold. Mind the cones.';
    S.messageT = 999;
  }
}
