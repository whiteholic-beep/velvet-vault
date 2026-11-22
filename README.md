# The Velvet Vault — a heist game

A best-heist-game-20261122-0559 entry (Node 22, standard library only): the game is
this directory's game/ folder, plain static files a desktop browser loads offline
(game/index.html and its ES modules, no library and no network request), and main.ts
hands it in.

The game itself, written by the recorded agent in game/src/, is an original top-down
stealth heist: a thief crosses one museum gallery, grabs three stashes (the vault gold
and two jewel cases) and slips out the green door while three guards patrol with
vision cones and two cameras sweep the floor. Spotted thieves feed the alarm meter;
at 100% the museum locks down. Coins distract a guard — at a cost. Shadows hide the
thief; sneaking is slower but harder to spot. Nothing in it comes from any commercial
game: the room, names, art and sounds are all original to this entry.

Serve it locally with `node serve.ts`, then open http://localhost:8080.
Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

Screenshots are real renders of the game's own code, staged with ?shot=cover,
?shot=stealth, ?shot=alarm and ?shot=win.
