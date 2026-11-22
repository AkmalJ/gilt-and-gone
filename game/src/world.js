// Gilt & Gone — the gallery room: geometry, loot, and sight math.
// One room holds everything: walls, the vault alcove, occluders that
// block both movement and vision, and the loot waiting to be taken.

const ROOM = { left: 48, top: 108, right: 1232, bottom: 764 };
const DOOR = { x: 640, y: ROOM.bottom, w: 108, h: 26 };
const PEDESTAL = { x: 640, y: 182 };
const LASER_ZONE = { x: 512, y: 246, w: 256, h: 18 };

// Solid furniture: pillars, desks and a statue plinth. These block the
// thief's movement and cut every vision cone that crosses them.
const OCCLUDERS = [
  { x: 404, y: 300, w: 46, h: 130, kind: 'pillar' },
  { x: 830, y: 300, w: 46, h: 130, kind: 'pillar' },
  { x: 250, y: 520, w: 190, h: 38, kind: 'desk' },
  { x: 840, y: 520, w: 190, h: 38, kind: 'desk' },
  { x: 600, y: 470, w: 80, h: 80, kind: 'plinth' },
];

// Optional risk-and-reward loot in the side displays. The gem is apart.
function makeLoot() {
  return [
    { id: 'cash', name: 'Cash Stacks', kind: 'cash', x: 196, y: 336, value: 15000, taken: false },
    { id: 'painting', name: 'Gilded Portrait', kind: 'painting', x: 1084, y: 336, value: 20000, taken: false },
    { id: 'jewels', name: 'Jewel Case', kind: 'jewels', x: 1084, y: 648, value: 10000, taken: false },
    { id: 'gem', name: 'The Aurora Gem', kind: 'gem', x: PEDESTAL.x, y: PEDESTAL.y - 14, value: GEM_VALUE, taken: false },
  ];
}

function distBetween(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleDifference(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Does the segment (x1,y1)-(x2,y2) cross this rectangle? Slab test.
function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

// True when no occluder stands between two points.
function lineOfSightClear(x1, y1, x2, y2) {
  for (const rect of OCCLUDERS) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

// Distance from (x, y) along `angle` to the first occluder or room wall.
function raycastDistance(x, y, angle, maxDist) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = maxDist;
  for (const rect of OCCLUDERS) {
    let tMin = 0;
    let tMax = best;
    let ok = true;
    if (Math.abs(dx) < 1e-9) {
      if (x < rect.x || x > rect.x + rect.w) ok = false;
    } else {
      let t1 = (rect.x - x) / dx;
      let t2 = (rect.x + rect.w - x) / dx;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) ok = false;
    }
    if (ok) {
      if (Math.abs(dy) < 1e-9) {
        if (y < rect.y || y > rect.y + rect.h) ok = false;
      } else {
        let t1 = (rect.y - y) / dy;
        let t2 = (rect.y + rect.h - y) / dy;
        if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) ok = false;
      }
    }
    if (ok && tMin > 0.01 && tMin < best) best = tMin;
  }
  // The room walls stop the ray too.
  if (dx > 1e-9) best = Math.min(best, (ROOM.right - x) / dx);
  if (dx < -1e-9) best = Math.min(best, (ROOM.left - x) / dx);
  if (dy > 1e-9) best = Math.min(best, (ROOM.bottom - y) / dy);
  if (dy < -1e-9) best = Math.min(best, (ROOM.top - y) / dy);
  return Math.max(0, best);
}

// Is (px, py) inside a vision cone cast from (ox, oy)?
function pointInCone(ox, oy, facing, halfAngle, range, px, py) {
  const d = distBetween(ox, oy, px, py);
  if (d > range) return false;
  if (d < 4) return true;
  const to = Math.atan2(py - oy, px - ox);
  return Math.abs(angleDifference(to, facing)) <= halfAngle;
}

// Push a circle out of every occluder and keep it inside the room.
function resolveBodyCollisions(body) {
  body.x = Math.min(ROOM.right - body.r, Math.max(ROOM.left + body.r, body.x));
  body.y = Math.min(ROOM.bottom - body.r, Math.max(ROOM.top + body.r, body.y));
  for (const rect of OCCLUDERS) {
    const nearX = Math.min(rect.x + rect.w, Math.max(rect.x, body.x));
    const nearY = Math.min(rect.y + rect.h, Math.max(rect.y, body.y));
    const dx = body.x - nearX;
    const dy = body.y - nearY;
    const d2 = dx * dx + dy * dy;
    if (d2 >= body.r * body.r) continue;
    if (d2 > 0.0001) {
      const d = Math.sqrt(d2);
      body.x = nearX + (dx / d) * body.r;
      body.y = nearY + (dy / d) * body.r;
    } else {
      // Centre inside the rect: leave by the shortest side.
      const left = body.x - rect.x;
      const right = rect.x + rect.w - body.x;
      const top = body.y - rect.y;
      const bottom = rect.y + rect.h - body.y;
      const min = Math.min(left, right, top, bottom);
      if (min === left) body.x = rect.x - body.r;
      else if (min === right) body.x = rect.x + rect.w + body.r;
      else if (min === top) body.y = rect.y - body.r;
      else body.y = rect.y + rect.h + body.r;
    }
  }
}
