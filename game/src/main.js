// Gilt & Gone — game state, the update loop, and the rules of the job:
// sneak, grab, decoy, EMP, mind the alarm, and leave by the door.

function newGame(seed) {
  return {
    mode: 'title',
    staged: false,
    rng: makeRng(seed),
    thief: { x: DOOR.x, y: ROOM.bottom - 48, r: THIEF_RADIUS, facing: -Math.PI / 2 },
    guards: makeGuards(),
    cameras: makeCameras(),
    lasers: makeLasers(),
    loot: makeLoot(),
    alarm: 0,
    alarmPeak: 0,
    alarmSource: '',
    detection: 0,
    decoys: DECOYS_START,
    decoy: null,
    decoySeq: 0,
    empCharges: EMP_CHARGES_START,
    empTimer: 0,
    lootTotal: 0,
    lootCount: 0,
    hasGem: false,
    elapsed: 0,
    floaters: [],
    caughtReason: '',
    rating: '',
    alertTickT: 0,
  };
}

function addFloater(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color, age: 0, life: 1.6 });
}

function caught(state, reason) {
  if (state.mode !== 'play') return;
  state.mode = 'caught';
  state.caughtReason = reason;
  sfxCaught();
}

function ratingFor(state) {
  if (state.alarmPeak < 25 && state.lootTotal >= 95000) return 'PERFECT GHOST';
  if (state.alarmPeak < 25) return 'GHOST — barely a whisper';
  if (state.alarmPeak < 55 && state.lootTotal >= 75000) return 'SILVER FOX';
  if (state.alarmPeak < 55) return 'SMOOTH OPERATOR';
  return 'LUCKY THIEF';
}

function tryGrab(state) {
  let best = null;
  let bestDist = GRAB_RANGE;
  for (const item of state.loot) {
    if (item.taken) continue;
    const d = distBetween(state.thief.x, state.thief.y, item.x, item.y);
    if (d < bestDist) {
      best = item;
      bestDist = d;
    }
  }
  if (!best) return;
  best.taken = true;
  state.lootTotal += best.value;
  state.lootCount += 1;
  if (best.id === 'gem') {
    state.hasGem = true;
    addFloater(state, best.x, best.y - 30, 'LOOT SECURED +' + moneyText(best.value), '#ffd23e');
  } else {
    addFloater(state, best.x, best.y - 30, '+' + moneyText(best.value) + ' — ' + best.name, '#ffd23e');
  }
  sfxGrab();
}

function tossDecoy(state) {
  if (state.decoys <= 0) return;
  const spot = { x: mousePos.x, y: mousePos.y, r: 6 };
  if (spot.x < ROOM.left || spot.x > ROOM.right || spot.y < ROOM.top || spot.y > ROOM.bottom) return;
  resolveBodyCollisions(spot);
  state.decoySeq += 1;
  state.decoy = { x: spot.x, y: spot.y, id: state.decoySeq, active: true, age: 0 };
  state.decoys -= 1;
  sfxCoin();
}

function fireEmp(state) {
  if (state.empCharges <= 0 || state.empTimer > 0) return;
  state.empCharges -= 1;
  state.empTimer = EMP_CAMERA_OFF_TIME;
  addFloater(state, state.thief.x, state.thief.y - 30, 'EMP — CAMERAS DOWN', '#9fd8ff');
  sfxEmp();
}

function updateGame(state, dt) {
  state.elapsed += dt;
  const thief = state.thief;

  // movement: WASD or arrows, normalised so diagonals are not faster
  let mx = 0;
  let my = 0;
  if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) mx -= 1;
  if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) mx += 1;
  if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) my -= 1;
  if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) my += 1;
  if (mx !== 0 || my !== 0) {
    const len = Math.sqrt(mx * mx + my * my);
    thief.x += (mx / len) * THIEF_SPEED * dt;
    thief.y += (my / len) * THIEF_SPEED * dt;
    thief.facing = Math.atan2(my, mx);
    resolveBodyCollisions(thief);
  }

  if (wasPressed('KeyE')) tryGrab(state);
  if (wasPressed('KeyQ') || consumeClick()) tossDecoy(state);
  if (wasPressed('Space')) fireEmp(state);

  if (state.empTimer > 0) state.empTimer -= dt;
  if (state.decoy && state.decoy.active) {
    state.decoy.age += dt;
    if (state.decoy.age > 7) state.decoy.active = false;
  }

  for (const guard of state.guards) updateGuard(guard, dt, state.decoy);
  for (const cam of state.cameras) updateCamera(cam, state.elapsed);
  updateLasers(state.lasers, dt);

  // guard vision fills the detection meter; a full meter is a fair catch
  let seeingGuard = null;
  for (const guard of state.guards) {
    guard.seesThief = guardSeesThief(guard, thief);
    if (guard.seesThief) seeingGuard = guard;
  }
  if (seeingGuard) {
    state.detection += dt / DETECT_FILL_TIME;
    state.alertTickT -= dt;
    if (state.alertTickT <= 0) {
      sfxAlertTick();
      state.alertTickT = 0.24;
    }
    if (state.detection >= 1) {
      caught(state, seeingGuard.name + ' got a clean look at you — detection full.');
      return;
    }
  } else {
    state.detection = Math.max(0, state.detection - DETECT_DECAY * dt);
  }

  // the alarm: cameras and lasers feed it, quiet time drains it
  let raising = false;
  let anyCamSees = false;
  for (const cam of state.cameras) {
    cam.seesThief = cameraSeesThief(cam, thief, state.empTimer);
    if (cam.seesThief) anyCamSees = true;
  }
  if (anyCamSees) {
    state.alarm += CAM_ALARM_RATE * dt;
    state.alarmSource = 'camera';
    raising = true;
  }
  const laserPts = laserHitPoints(state.lasers, thief);
  if (laserPts > 0) {
    state.alarm += laserPts;
    state.alarmSource = 'laser';
    raising = true;
    addFloater(state, thief.x, thief.y - 28, 'LASER TRIPPED — ALARM +25', '#ff8296');
    sfxLaserZap();
  }
  if (!raising) state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  state.alarmPeak = Math.max(state.alarmPeak, state.alarm);
  if (state.alarm >= ALARM_MAX) {
    if (state.alarmSource === 'laser') {
      caught(state, 'The laser grid screamed — the alarm hit 100% and the gallery locked down.');
    } else {
      caught(state, 'The cameras held you too long — the alarm hit 100% and the gallery locked down.');
    }
    return;
  }

  for (const ft of state.floaters) ft.age += dt;
  state.floaters = state.floaters.filter((ft) => ft.age < ft.life);

  // the getaway: gem in the sack and feet on the door mat
  if (state.hasGem && thief.y > ROOM.bottom - 46 && Math.abs(thief.x - DOOR.x) < DOOR.w / 2) {
    state.mode = 'won';
    state.rating = ratingFor(state);
    sfxWin();
  }
}

function bootGame() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  initInput(canvas);
  const { stage, seed } = readStageParams();
  let state = newGame(seed);
  if (stage) {
    applyStage(state, stage);
    state.staged = true;
  }
  window.GAME = state;

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!state.staged) {
      if (state.mode === 'title') {
        if (pressedKeys.size > 0 || mouseClicked) {
          initAudio();
          state.mode = 'play';
          clearTransientInput();
        }
      } else if (state.mode === 'play') {
        updateGame(state, dt);
      } else if (wasPressed('KeyR')) {
        state = newGame(seed);
        state.mode = 'play';
        window.GAME = state;
      }
    }
    renderGame(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

bootGame();
