// Gilt & Gone — the two wall cameras: sweeping arcs, narrow cones.
// A camera that sees the thief feeds the alarm meter directly, fast.
// An EMP pulse blacks both cameras out for a few seconds.

function makeCameras() {
  return [
    { name: 'Camera West', x: 92, y: 148, baseAngle: 0.62, phase: 0, angle: 0.62, seesThief: false },
    { name: 'Camera East', x: 1188, y: 148, baseAngle: Math.PI - 0.62, phase: 2.4, angle: Math.PI - 0.62, seesThief: false },
  ];
}

function updateCamera(camera, elapsed) {
  camera.angle = camera.baseAngle + Math.sin(elapsed * CAM_SWEEP_SPEED + camera.phase) * CAM_SWEEP_SPAN;
}

// Cameras are dark while the EMP timer runs.
function cameraSeesThief(camera, thief, empTimer) {
  if (empTimer > 0) return false;
  if (!pointInCone(camera.x, camera.y, camera.angle, CAM_VIEW_HALF, CAM_VIEW_RANGE, thief.x, thief.y)) {
    return false;
  }
  return lineOfSightClear(camera.x, camera.y, thief.x, thief.y);
}
