# velvet-vault

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/whiteholic-beep/velvet-vault/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/whiteholic-beep/velvet-vault/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

The Velvet Vault — an original top-down stealth heist game: a thief crosses one museum gallery, grabs three stashes (the vault gold and two jewel cases) and slips out the green door while three guards patrol with vision cones and two cameras sweep the floor. Spotted thieves feed the alarm meter; at 100% the museum locks down. Coins distract a guard — at a cost. Shadows hide the thief; sneaking is slower but harder to spot. Nothing in it comes from any commercial game: the room, names, art and sounds are all original to this entry.

The game is this directory's game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES modules, no library and no network request), and main.ts hands it in. Screenshots are real renders of the game's own code, staged with ?shot=cover, ?shot=stealth, ?shot=alarm and ?shot=win.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=zx2vqcpc&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
