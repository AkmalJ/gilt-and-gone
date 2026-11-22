// Gilt & Gone — the three guards: waypoint patrols, decoy lures, vision.
// Each guard walks a loop at its own speed. A tossed coin pulls nearby
// guards off their loop to stare at it, which is how new routes open.

function makeGuards() {
  return [
    {
      name: 'Guard Aldo', x: 220, y: 430, r: GUARD_RADIUS, speed: 56,
      waypoints: [[220, 430], [1060, 430], [1060, 430], [220, 430]],
      wp: 1, facing: 0, waitT: 0, pauseT: 0, seesThief: false, decoySeenId: -1,
    },
    {
      name: 'Guard Bima', x: 180, y: 648, r: GUARD_RADIUS, speed: 44,
      waypoints: [[180, 648], [520, 648], [520, 196], [180, 196]],
      wp: 1, facing: -Math.PI / 2, waitT: 0, pauseT: 0, seesThief: false, decoySeenId: -1,
    },
    {
      name: 'Guard Citra', x: 1100, y: 196, r: GUARD_RADIUS, speed: 66,
      waypoints: [[1100, 196], [1100, 648], [760, 648], [760, 196]],
      wp: 1, facing: Math.PI / 2, waitT: 0, pauseT: 0, seesThief: false, decoySeenId: -1,
    },
  ];
}

// Turn a guard's facing toward `target` at a limited rate.
function turnToward(guard, target, dt) {
  const diff = angleDifference(target, guard.facing);
  const maxTurn = 3.4 * dt;
  if (Math.abs(diff) <= maxTurn) guard.facing = target;
  else guard.facing += Math.sign(diff) * maxTurn;
}

// Walk toward a point; returns the distance still to go.
function walkToward(guard, tx, ty, speed, dt) {
  const d = distBetween(guard.x, guard.y, tx, ty);
  if (d < 1) return 0;
  const step = Math.min(d, speed * dt);
  const dir = Math.atan2(ty - guard.y, tx - guard.x);
  guard.x += Math.cos(dir) * step;
  guard.y += Math.sin(dir) * step;
  turnToward(guard, dir, dt);
  return d - step;
}

function updateGuard(guard, dt, decoy) {
  if (guard.waitT > 0) {
    guard.waitT -= dt;
    return;
  }
  // At each waypoint a guard stops and scans for a beat: the pause is
  // the window a watching thief learns to move in.
  if (guard.pauseT > 0) {
    guard.pauseT -= dt;
    guard.facing += Math.sin(guard.pauseT * 5) * 0.9 * dt;
    return;
  }
  // A fresh coin within earshot pulls this guard off patrol.
  if (decoy && decoy.active && guard.decoySeenId !== decoy.id) {
    const d = distBetween(guard.x, guard.y, decoy.x, decoy.y);
    if (d < DECOY_LURE_RADIUS) {
      if (walkToward(guard, decoy.x, decoy.y, guard.speed * 1.25, dt) < 12) {
        guard.waitT = DECOY_WAIT_TIME;
        guard.decoySeenId = decoy.id;
        turnToward(guard, Math.atan2(decoy.y - guard.y, decoy.x - guard.x), dt);
      }
      return;
    }
  }
  const target = guard.waypoints[guard.wp];
  if (walkToward(guard, target[0], target[1], guard.speed, dt) < 9) {
    guard.wp = (guard.wp + 1) % guard.waypoints.length;
    guard.pauseT = 0.85;
  }
}

// Can this guard see the thief right now? Cone plus a clear sight line.
function guardSeesThief(guard, thief) {
  if (!pointInCone(guard.x, guard.y, guard.facing, GUARD_VIEW_HALF, GUARD_VIEW_RANGE, thief.x, thief.y)) {
    return false;
  }
  return lineOfSightClear(guard.x, guard.y, thief.x, thief.y);
}
