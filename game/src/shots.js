// Gilt & Gone — staged scenes for the maker's screenshots.
// With ?stage=<name>&seed=<n> the game builds its normal world, then
// poses everyone mid-action and freezes: the render loop still draws,
// but nothing updates, so the picture is the game's own frame.

function readStageParams() {
  const params = new URLSearchParams(window.location.search);
  const stage = params.get('stage');
  const seed = parseInt(params.get('seed') || '7', 10);
  return { stage, seed: Number.isFinite(seed) ? seed : 7 };
}

function poseGuard(guard, x, y, facing) {
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.waitT = 0;
  guard.seesThief = false;
}

function applyStage(state, stage) {
  state.mode = 'play';
  if (stage === 'cover') {
    // The thief slips mid-room behind a pillar; everything is on show.
    state.thief.x = 384;
    state.thief.y = 366;
    state.thief.facing = -Math.PI / 2;
    poseGuard(state.guards[0], 716, 430, Math.PI);
    poseGuard(state.guards[1], 316, 196, 0.3);
    poseGuard(state.guards[2], 1010, 520, -Math.PI / 2);
    state.cameras[0].angle = 0.75;
    state.cameras[1].angle = Math.PI - 0.75;
    state.alarm = 35;
    state.alarmPeak = 35;
    state.elapsed = 47;
    state.lasers.timer = 0.6; // beams live
    state.lasers.on = true;
  } else if (stage === 'spotted') {
    // Caught at a cone's edge: the cone burns red, the guard shouts.
    state.thief.x = 556;
    state.thief.y = 430;
    state.thief.facing = 0;
    poseGuard(state.guards[0], 706, 430, Math.PI);
    state.guards[0].seesThief = true;
    poseGuard(state.guards[1], 300, 300, 0.7);
    poseGuard(state.guards[2], 1004, 286, 2.7);
    state.cameras[0].angle = 0.5;
    state.cameras[1].angle = Math.PI - 0.4;
    state.detection = 0.85;
    state.alarm = 70;
    state.alarmPeak = 70;
    state.elapsed = 73;
    state.lasers.timer = 0.9;
    state.lasers.on = true;
  } else if (stage === 'loot') {
    // The gem lifts off its pedestal in the lasers' off gap.
    state.thief.x = 640;
    state.thief.y = 234;
    state.thief.facing = -Math.PI / 2;
    const gem = state.loot.find((item) => item.id === 'gem');
    gem.taken = true;
    state.hasGem = true;
    state.lootTotal = GEM_VALUE;
    state.lootCount = 1;
    poseGuard(state.guards[0], 300, 430, 0);
    poseGuard(state.guards[1], 184, 420, -1.1);
    poseGuard(state.guards[2], 1052, 430, Math.PI);
    state.cameras[0].angle = 0.35;
    state.cameras[1].angle = Math.PI - 0.35;
    state.alarm = 20;
    state.alarmPeak = 44;
    state.elapsed = 88;
    state.lasers.timer = LASER_ON_TIME + 0.5; // inside the off gap
    state.lasers.on = false;
    state.floaters.push({ x: 640, y: 312, text: 'LOOT SECURED +$50,000', color: '#ffd23e', age: 0.4, life: 3 });
  } else if (stage === 'escape') {
    // Out the door with everything: the getaway banner over the room.
    state.thief.x = 640;
    state.thief.y = 722;
    state.thief.facing = Math.PI / 2;
    for (const item of state.loot) item.taken = true;
    state.hasGem = true;
    state.lootTotal = 95000;
    state.lootCount = 4;
    poseGuard(state.guards[0], 420, 430, 0);
    poseGuard(state.guards[1], 300, 300, 1.2);
    poseGuard(state.guards[2], 940, 380, Math.PI);
    state.cameras[0].angle = 0.8;
    state.cameras[1].angle = Math.PI - 0.8;
    state.alarm = 58;
    state.alarmPeak = 62;
    state.elapsed = 96;
    state.lasers.timer = 0.4;
    state.lasers.on = true;
    state.rating = 'SILVER FOX';
    state.mode = 'won';
  }
}
