// Gilt & Gone — a tiny seeded random number generator.
// Patrol jitter and staged screenshots must be reproducible, so the game
// never calls Math.random for anything that affects play or pictures.

function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  return function nextRandom() {
    // mulberry32: small, fast, good enough for guard jitter.
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(rng, low, high) {
  return low + rng() * (high - low);
}

function randPick(rng, list) {
  return list[Math.floor(rng() * list.length) % list.length];
}
