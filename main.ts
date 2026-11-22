// Gilt & Gone — the hand-in program for the make.fun heist bounty.
// Copies the static game and its screenshots into the output directory
// and writes the dossier the judge reads, using the vendored library.
// Runs on Node 22+ with the standard library only:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function listFiles(dir, prefix) {
  const names = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? prefix + '/' + entry.name : entry.name;
    if (entry.isDirectory()) names.push(...listFiles(join(dir, entry.name), rel));
    else names.push(rel);
  }
  return names.sort();
}

// Sanity-check the hand-in before copying: the game must have its page
// and the screenshots folder must hold the four staged shots.
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('game/index.html is missing — there is no game to hand in');
}
const shotNames = existsSync(shotsDir) ? readdirSync(shotsDir).filter((n) => /\.jpe?g$/i.test(n)) : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error('screenshots/ must hold 3 or 4 JPEG shots, found ' + shotNames.length);
}
for (const name of shotNames) {
  const bytes = statSync(join(shotsDir, name)).size;
  if (bytes > 262144) throw new Error('screenshot ' + name + ' is ' + bytes + ' bytes, over the 256 KiB cap');
}

mkdirSync(outputDir, { recursive: true });
cpSync(gameDir, join(outputDir, 'game'), { recursive: true });
cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });

const gameFiles = listFiles(join(outputDir, 'game'), '');
console.log('Gilt & Gone hand-in: ' + gameFiles.length + ' game files, ' + shotNames.length + ' screenshots');
for (const rel of gameFiles) console.log('  game/' + rel);

// The caps are the scorer's own: passing them makes this program refuse
// exactly what the gate would refuse.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log('dossier.json written: ' + dossier.length + ' bytes');
