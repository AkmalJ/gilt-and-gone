// Gilt & Gone — the laser grid guarding the Aurora Gem.
// The grid pulses on a fixed rhythm. The off gap is the fast route to
// the pedestal; crossing while it is live feeds the alarm at once.

function makeLasers() {
  return { timer: 0, on: true, hitCooldown: 0 };
}

function updateLasers(lasers, dt) {
  lasers.timer += dt;
  const cycle = LASER_ON_TIME + LASER_OFF_TIME;
  const phase = lasers.timer % cycle;
  lasers.on = phase < LASER_ON_TIME;
  if (lasers.hitCooldown > 0) lasers.hitCooldown -= dt;
}

// Is the thief's centre inside the beam band right now?
function thiefInLaserBand(thief) {
  return (
    thief.x > LASER_ZONE.x &&
    thief.x < LASER_ZONE.x + LASER_ZONE.w &&
    thief.y > LASER_ZONE.y - 4 &&
    thief.y < LASER_ZONE.y + LASER_ZONE.h + 4
  );
}

// Returns the alarm points a crossing costs this frame (0 when safe).
function laserHitPoints(lasers, thief) {
  if (!lasers.on) return 0;
  if (lasers.hitCooldown > 0) return 0;
  if (!thiefInLaserBand(thief)) return 0;
  lasers.hitCooldown = LASER_RETRIGGER;
  return LASER_ALARM_HIT;
}
