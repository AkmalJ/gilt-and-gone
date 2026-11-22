# Gilt & Gone

A one-room gallery heist in a single frame. Slip past three patrolling guards
and two sweeping cameras, time the laser grid's heartbeat, lift the Aurora Gem
off its pedestal, fill your sack with the side loot if you dare — and walk out
the door you came in. Get stared at too long and you are caught; let the
cameras or the lasers feed the alarm to 100% and the gallery locks down.

[![bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/AkmalJ/gilt-and-gone/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/AkmalJ/gilt-and-gone/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

## Play

Serve the game folder with any static server — for example:

```
node serve.ts
```

then open http://localhost:8080 in a desktop browser. No build step, no
network: every file the game loads lives under `game/`.

## Controls

- **WASD / arrow keys** — move
- **E** — grab loot when close
- **Q** or **mouse click** — toss a decoy coin at the cursor; nearby guards
  leave their patrol to stare at it
- **Space** — EMP pulse: both cameras go dark for 5 seconds (3 charges)
- **R** — restart after a getaway or a capture

## The room

Three routes in: the west gallery past a camera for the cash stacks, the
centre straight through the laser timing gap to the gem (fastest, riskiest),
or the east side behind the desks under a guard patrol for the portrait and
the jewel case. Vision cones are cut by real occlusion — pillars, desks and
the statue plinth are safe cover. Standing in a cone fills a detection meter
over about 0.8 seconds (the cone warms amber, then red) before the catch, so
every mistake is fair.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` via `vendor/makefun-game.ts`
- `serve.ts` — a small static server for local play
- `game/` — the game itself: `index.html` plus one-job-each sources in
  `game/src/` (config, input, random, world, guards, cameras, lasers, audio,
  render, shots, main), all classic scripts, no libraries
- `screenshots/` — four staged shots of the game, posed by `game/src/shots.js`
  through `?stage=` URLs listed in `shots.json`
