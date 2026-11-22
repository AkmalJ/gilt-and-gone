// Gilt & Gone — all drawing. One frame shows the whole job: the room,
// the cones, the cameras, the lasers, the loot and the alarm, so a
// single screenshot tells the story of the heist.

let floorPattern = null;

function getFloorPattern(ctx) {
  if (floorPattern) return floorPattern;
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const t = tile.getContext('2d');
  t.fillStyle = COL.floorA;
  t.fillRect(0, 0, 160, 160);
  t.fillStyle = COL.floorB;
  t.fillRect(80, 0, 80, 80);
  t.fillRect(0, 80, 80, 80);
  t.strokeStyle = COL.floorLine;
  t.lineWidth = 2;
  t.strokeRect(0, 0, 160, 160);
  t.beginPath();
  t.moveTo(0, 80);
  t.lineTo(160, 80);
  t.moveTo(80, 0);
  t.lineTo(80, 160);
  t.stroke();
  // faint marble veins
  t.strokeStyle = 'rgba(90, 100, 130, 0.13)';
  t.lineWidth = 1;
  t.beginPath();
  t.moveTo(8, 130);
  t.quadraticCurveTo(70, 90, 150, 118);
  t.moveTo(20, 30);
  t.quadraticCurveTo(80, 55, 140, 22);
  t.stroke();
  floorPattern = ctx.createPattern(tile, 'repeat');
  return floorPattern;
}

function moneyText(amount) {
  return '$' + amount.toLocaleString('en-US');
}

function timeText(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// A vision cone clipped by real occlusion: fan of rays, each stopped by
// the first occluder or wall it meets.
function drawCone(ctx, x, y, facing, halfAngle, range, fillStyle) {
  const steps = 26;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= steps; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / steps;
    const d = raycastDistance(x, y, a, range);
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function drawRoomShell(ctx) {
  ctx.fillStyle = COL.voidBg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // marble floor
  ctx.fillStyle = getFloorPattern(ctx);
  ctx.fillRect(ROOM.left, ROOM.top, ROOM.right - ROOM.left, ROOM.bottom - ROOM.top);
  // vault alcove floor
  ctx.fillStyle = COL.alcove;
  ctx.fillRect(512, ROOM.top, 256, 138);
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(512, ROOM.top, 256, 138);
  // walls with a gold trim line
  ctx.strokeStyle = COL.wall;
  ctx.lineWidth = 18;
  ctx.strokeRect(ROOM.left - 9, ROOM.top - 9, ROOM.right - ROOM.left + 18, ROOM.bottom - ROOM.top + 18);
  ctx.strokeStyle = COL.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.left - 1, ROOM.top - 1, ROOM.right - ROOM.left + 2, ROOM.bottom - ROOM.top + 2);
  // the entry door: a lit gap in the south wall
  ctx.fillStyle = '#0a2e2a';
  ctx.fillRect(DOOR.x - DOOR.w / 2, ROOM.bottom - 12, DOOR.w, 24);
  ctx.strokeStyle = COL.thief;
  ctx.lineWidth = 3;
  ctx.strokeRect(DOOR.x - DOOR.w / 2, ROOM.bottom - 12, DOOR.w, 24);
  ctx.fillStyle = COL.thief;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT — GETAWAY', DOOR.x, ROOM.bottom - 20);
}

function drawOccluder(ctx, rect) {
  if (rect.kind === 'pillar') {
    ctx.fillStyle = '#2a3d6e';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#3b5494';
    ctx.fillRect(rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 10);
    ctx.strokeStyle = COL.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  } else if (rect.kind === 'desk') {
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#654628';
    ctx.fillRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
    ctx.fillStyle = 'rgba(242, 234, 210, 0.75)';
    ctx.fillRect(rect.x + 18, rect.y + 10, 44, 7);
    ctx.fillRect(rect.x + rect.w - 62, rect.y + 10, 44, 7);
  } else {
    // statue plinth with a golden bust
    ctx.fillStyle = '#39466a';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = COL.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = COL.wallTrim;
    ctx.beginPath();
    ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2 - 6, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(rect.x + rect.w / 2 - 13, rect.y + rect.h / 2 + 6, 26, 12);
  }
}

function drawLootItem(ctx, item, elapsed) {
  const glow = 26 + Math.sin(elapsed * 2.4 + item.x) * 6;
  if (!item.taken) {
    const g = ctx.createRadialGradient(item.x, item.y, 4, item.x, item.y, glow + 22);
    g.addColorStop(0, 'rgba(255, 205, 60, 0.35)');
    g.addColorStop(1, 'rgba(255, 205, 60, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(item.x, item.y, glow + 22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textAlign = 'center';
  if (item.kind === 'gem') {
    // pedestal
    ctx.fillStyle = COL.pedestal;
    ctx.beginPath();
    ctx.moveTo(PEDESTAL.x - 26, PEDESTAL.y + 26);
    ctx.lineTo(PEDESTAL.x + 26, PEDESTAL.y + 26);
    ctx.lineTo(PEDESTAL.x + 16, PEDESTAL.y - 2);
    ctx.lineTo(PEDESTAL.x - 16, PEDESTAL.y - 2);
    ctx.closePath();
    ctx.fill();
    if (!item.taken) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = COL.gem;
      ctx.shadowColor = COL.gem;
      ctx.shadowBlur = 18;
      ctx.fillRect(-11, -11, 22, 22);
      ctx.restore();
      ctx.fillStyle = '#dffcff';
      ctx.beginPath();
      ctx.arc(item.x - 3, item.y - 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COL.text;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('AURORA GEM', PEDESTAL.x, ROOM.top + 24);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(item.taken ? 'TAKEN' : moneyText(item.value), PEDESTAL.x, PEDESTAL.y + 48);
    return;
  }
  if (item.kind === 'cash') {
    ctx.fillStyle = 'rgba(20, 40, 30, 0.85)';
    ctx.fillRect(item.x - 34, item.y - 24, 68, 48);
    ctx.strokeStyle = '#9fd8ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(item.x - 34, item.y - 24, 68, 48);
    if (!item.taken) {
      ctx.fillStyle = COL.cash;
      ctx.fillRect(item.x - 24, item.y + 2, 30, 13);
      ctx.fillRect(item.x - 6, item.y - 10, 30, 13);
      ctx.fillRect(item.x - 20, item.y - 20, 30, 13);
      ctx.fillStyle = '#eaffea';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('$', item.x - 9, item.y + 13);
      ctx.fillText('$', item.x + 9, item.y + 1);
    }
  } else if (item.kind === 'painting') {
    ctx.fillStyle = COL.paintingFrame;
    ctx.fillRect(item.x - 27, item.y - 36, 54, 72);
    if (!item.taken) {
      ctx.fillStyle = '#274b73';
      ctx.fillRect(item.x - 21, item.y - 30, 42, 60);
      ctx.fillStyle = '#f4c542';
      ctx.beginPath();
      ctx.arc(item.x + 8, item.y - 14, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f7d4e';
      ctx.beginPath();
      ctx.moveTo(item.x - 21, item.y + 30);
      ctx.lineTo(item.x - 4, item.y + 6);
      ctx.lineTo(item.x + 7, item.y + 30);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#1b2745';
      ctx.fillRect(item.x - 21, item.y - 30, 42, 60);
    }
  } else if (item.kind === 'jewels') {
    ctx.fillStyle = 'rgba(30, 24, 44, 0.88)';
    ctx.fillRect(item.x - 32, item.y - 22, 64, 44);
    ctx.strokeStyle = '#9fd8ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(item.x - 32, item.y - 22, 64, 44);
    if (!item.taken) {
      ctx.fillStyle = COL.jewel;
      const gems = [[-16, -6], [0, 8], [16, -8], [-6, -14], [10, 12]];
      for (const [gx, gy] of gems) {
        ctx.save();
        ctx.translate(item.x + gx, item.y + gy);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-4.5, -4.5, 9, 9);
        ctx.restore();
      }
    }
  }
  ctx.fillStyle = item.taken ? 'rgba(242,234,210,0.4)' : '#ffd23e';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(item.taken ? 'EMPTY' : moneyText(item.value), item.x, item.y + 44);
}

function drawLasers(ctx, lasers, elapsed) {
  // emitters along the alcove mouth
  ctx.fillStyle = '#39466a';
  for (let x = LASER_ZONE.x + 8; x < LASER_ZONE.x + LASER_ZONE.w; x += 32) {
    ctx.fillRect(x - 4, LASER_ZONE.y - 7, 8, 7);
    ctx.fillRect(x - 4, LASER_ZONE.y + LASER_ZONE.h, 8, 7);
  }
  if (lasers.on) {
    ctx.save();
    ctx.strokeStyle = COL.laser;
    ctx.shadowColor = COL.laser;
    ctx.shadowBlur = 9;
    ctx.lineWidth = 2.5;
    const flicker = 0.75 + Math.sin(elapsed * 31) * 0.25;
    ctx.globalAlpha = flicker;
    ctx.beginPath();
    for (let x = LASER_ZONE.x + 8; x < LASER_ZONE.x + LASER_ZONE.w; x += 32) {
      ctx.moveTo(x, LASER_ZONE.y);
      ctx.lineTo(x, LASER_ZONE.y + LASER_ZONE.h);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ffb3c2';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LASERS LIVE', LASER_ZONE.x + LASER_ZONE.w + 44, LASER_ZONE.y + 15);
  } else {
    ctx.fillStyle = 'rgba(120, 255, 170, 0.9)';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LASERS DOWN — GO', LASER_ZONE.x + LASER_ZONE.w + 58, LASER_ZONE.y + 15);
  }
}

function drawGuard(ctx, guard, detection) {
  // body: mustard uniform, cap, facing tick
  ctx.fillStyle = COL.guardDark;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.r + 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COL.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#20305a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * (guard.r + 5), guard.y + Math.sin(guard.facing) * (guard.r + 5));
  ctx.stroke();
  ctx.fillStyle = '#20305a';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 6, Math.PI * 0.9, Math.PI * 2.1);
  ctx.fill();
  if (guard.seesThief && detection > 0.55) {
    ctx.fillStyle = '#ff3131';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 26);
  } else if (guard.waitT > 0) {
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 24);
  }
}

function drawCamera(ctx, camera, empTimer) {
  const off = empTimer > 0;
  ctx.fillStyle = '#39466a';
  ctx.fillRect(camera.x - 10, camera.y - 10, 20, 20);
  ctx.fillStyle = off ? '#555f75' : '#ff5252';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#dfe6f5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(camera.x, camera.y);
  ctx.lineTo(camera.x + Math.cos(camera.angle) * 16, camera.y + Math.sin(camera.angle) * 16);
  ctx.stroke();
  if (off) {
    ctx.fillStyle = '#9fb4d8';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFLINE', camera.x, camera.y + 26);
  }
}

function drawThief(ctx, state) {
  const thief = state.thief;
  // loot sack grows behind him once he carries anything
  if (state.lootCount > 0) {
    ctx.fillStyle = COL.thiefSack;
    ctx.beginPath();
    ctx.arc(thief.x - Math.cos(thief.facing) * 13, thief.y - Math.sin(thief.facing) * 13, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', thief.x - Math.cos(thief.facing) * 13, thief.y - Math.sin(thief.facing) * 13 + 3);
  }
  ctx.fillStyle = '#0b5e58';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.r + 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COL.thief;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.r, 0, Math.PI * 2);
  ctx.fill();
  // eye mask stripe across the facing side
  ctx.strokeStyle = '#062a33';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(thief.x - Math.cos(thief.facing) * 3 - Math.sin(thief.facing) * 6, thief.y - Math.sin(thief.facing) * 3 + Math.cos(thief.facing) * 6);
  ctx.lineTo(thief.x + Math.cos(thief.facing) * 8, thief.y + Math.sin(thief.facing) * 8);
  ctx.stroke();
  if (state.hasGem) {
    ctx.save();
    ctx.translate(thief.x + 14, thief.y - 12);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COL.gem;
    ctx.shadowColor = COL.gem;
    ctx.shadowBlur = 10;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }
}

function drawDecoy(ctx, decoy, elapsed) {
  if (!decoy || !decoy.active) return;
  const pulse = 10 + Math.sin(elapsed * 6) * 3;
  ctx.strokeStyle = 'rgba(255, 210, 62, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(decoy.x, decoy.y, pulse + 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffd23e';
  ctx.beginPath();
  ctx.arc(decoy.x, decoy.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a5c14';
  ctx.font = 'bold 8px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$', decoy.x, decoy.y + 3);
}

function drawHud(ctx, state) {
  ctx.fillStyle = COL.hudBg;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = COL.wallTrim;
  ctx.font = 'bold 21px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('GILT & GONE', 16, 40);
  // alarm: the big bar
  ctx.fillStyle = COL.text;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('ALARM', 196, 26);
  ctx.fillStyle = '#232c49';
  ctx.fillRect(196, 32, 360, 20);
  const alarm = state.alarm;
  ctx.fillStyle = alarm < 40 ? '#37c978' : alarm < 75 ? '#ffb020' : '#ff3131';
  ctx.fillRect(196, 32, (360 * Math.min(100, alarm)) / 100, 20);
  ctx.strokeStyle = '#5a6a94';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(196, 32, 360, 20);
  ctx.fillStyle = COL.text;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(Math.floor(alarm) + '%', 564, 47);
  // loot total
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('LOOT ' + moneyText(state.lootTotal), 640, 42);
  // tools and time, right side
  ctx.fillStyle = COL.text;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('DECOY × ' + state.decoys, 986, 40);
  ctx.fillText('EMP × ' + state.empCharges, 1096, 40);
  ctx.fillText(timeText(state.elapsed), 1252, 40);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(242, 234, 210, 0.65)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('WASD move · E grab · Q / click decoy · SPACE emp', 640, 58);
}

function drawBanner(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(4, 6, 16, 0.72)';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  ctx.fillStyle = '#0d1730';
  ctx.fillRect(340, 268, 600, 252);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(340, 268, 600, 252);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, 338);
  ctx.fillStyle = COL.text;
  ctx.font = '19px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 384 + i * 30);
  });
}

function drawFloatingTexts(ctx, state) {
  ctx.textAlign = 'center';
  for (const ft of state.floaters) {
    const a = 1 - ft.age / ft.life;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(ft.text, ft.x, ft.y - ft.age * 26);
  }
  ctx.globalAlpha = 1;
}

// The detection meter rides above the thief's head: the moment a cone
// warms up, the player can see exactly how much grace is left.
function drawDetectionMeter(ctx, state) {
  if (state.detection <= 0.02 || state.mode !== 'play') return;
  const thief = state.thief;
  const w = 52;
  const x = thief.x - w / 2;
  const y = thief.y - 34;
  ctx.fillStyle = 'rgba(5, 8, 18, 0.8)';
  ctx.fillRect(x - 2, y - 2, w + 4, 11);
  ctx.fillStyle = state.detection > 0.7 ? '#ff3131' : '#ffb020';
  ctx.fillRect(x, y, w * Math.min(1, state.detection), 7);
  ctx.fillStyle = COL.text;
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SEEN', thief.x, y - 6);
}

function renderGame(ctx, state) {
  drawRoomShell(ctx);
  for (const item of state.loot) drawLootItem(ctx, item, state.elapsed);
  for (const rect of OCCLUDERS) drawOccluder(ctx, rect);
  // cones under the actors: cameras first, then guards
  if (state.empTimer <= 0) {
    for (const cam of state.cameras) {
      drawCone(ctx, cam.x, cam.y, cam.angle, CAM_VIEW_HALF, CAM_VIEW_RANGE, COL.camCone);
    }
  }
  for (const guard of state.guards) {
    const fill = !guard.seesThief
      ? COL.coneCalm
      : state.detection > 0.7
        ? COL.coneHot
        : state.detection > 0.3
          ? COL.coneWarn
          : COL.coneCalm;
    drawCone(ctx, guard.x, guard.y, guard.facing, GUARD_VIEW_HALF, GUARD_VIEW_RANGE, fill);
  }
  drawLasers(ctx, state.lasers, state.elapsed);
  drawDecoy(ctx, state.decoy, state.elapsed);
  for (const cam of state.cameras) drawCamera(ctx, cam, state.empTimer);
  for (const guard of state.guards) drawGuard(ctx, guard, state.detection);
  drawThief(ctx, state);
  drawDetectionMeter(ctx, state);
  drawFloatingTexts(ctx, state);
  drawHud(ctx, state);
  if (state.mode === 'title') {
    drawBanner(ctx, 'GILT & GONE', [
      'One room. One gem. Three guards, two cameras,',
      'a laser grid with a heartbeat.',
      'Grab the Aurora Gem, fill your sack on the way,',
      'and walk out the door you came in.',
      'Press any key or click to start the job.',
    ], COL.wallTrim);
  } else if (state.mode === 'won') {
    drawBanner(ctx, 'CLEAN GETAWAY', [
      'Loot hauled: ' + moneyText(state.lootTotal),
      'Time inside: ' + timeText(state.elapsed),
      'Closest call: alarm peaked at ' + Math.floor(state.alarmPeak) + '%',
      'Rating: ' + state.rating,
      'Press R to run it again.',
    ], '#37c978');
  } else if (state.mode === 'caught') {
    drawBanner(ctx, 'CAUGHT', [
      state.caughtReason,
      'Loot lost: ' + moneyText(state.lootTotal),
      'Time inside: ' + timeText(state.elapsed),
      '',
      'Press R to try the job again.',
    ], '#ff3131');
  }
}
