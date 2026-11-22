// Gilt & Gone — tuning constants for the whole game.
// Everything numeric that more than one file needs lives here so the
// balance can be adjusted in one place.

const VIEW_W = 1280;          // logical canvas width
const VIEW_H = 800;           // logical canvas height
const HUD_H = 64;             // height of the top HUD strip

const THIEF_RADIUS = 13;
const THIEF_SPEED = 178;      // px per second
const GRAB_RANGE = 46;        // how close the thief must be to take loot

const GUARD_RADIUS = 14;
const GUARD_VIEW_RANGE = 215; // vision cone length
const GUARD_VIEW_HALF = 0.56; // vision cone half-angle, radians (~32 deg)
const DETECT_FILL_TIME = 0.8; // seconds in a cone to be fully spotted
const DETECT_DECAY = 0.55;    // detection lost per second when unseen

const CAM_VIEW_RANGE = 265;
const CAM_VIEW_HALF = 0.35;   // narrower than a guard's cone (~20 deg)
const CAM_SWEEP_SPEED = 0.55; // radians per second of sweep motion
const CAM_SWEEP_SPAN = 0.52;  // how far each camera swings from its base aim
const CAM_ALARM_RATE = 42;    // alarm points per second while a camera sees you
const EMP_CAMERA_OFF_TIME = 5; // seconds an EMP keeps cameras dark
const EMP_CHARGES_START = 3;

const ALARM_MAX = 100;
const ALARM_DECAY = 2.4;      // points per second when nothing is raising it
const LASER_ALARM_HIT = 25;   // alarm added for crossing a live laser
const LASER_ON_TIME = 2.3;    // seconds the grid is live
const LASER_OFF_TIME = 1.5;   // seconds the grid sleeps (the timing gap)
const LASER_RETRIGGER = 1.2;  // grace between laser hits on the same thief

const DECOYS_START = 6;
const DECOY_LURE_RADIUS = 330; // guards this close hear a tossed coin
const DECOY_WAIT_TIME = 1.7;   // seconds a guard stares at a coin

const GEM_VALUE = 50000;

// Palette: deep navy room, warm gold loot, red danger, teal thief.
const COL = {
  voidBg: '#05070f',
  wall: '#16264d',
  wallTrim: '#c9a227',
  floorA: '#c8ccd6',
  floorB: '#bcc1cd',
  floorLine: 'rgba(70, 80, 110, 0.25)',
  alcove: '#101c3a',
  pedestal: '#8a6d1f',
  gem: '#57f7ff',
  cash: '#3fae5a',
  paintingFrame: '#c9a227',
  jewel: '#ff7ad9',
  thief: '#19c2b8',
  thiefSack: '#8a5a2b',
  guard: '#d8b13c',
  guardDark: '#7a5c14',
  coneCalm: 'rgba(255, 236, 170, 0.16)',
  coneWarn: 'rgba(255, 166, 0, 0.30)',
  coneHot: 'rgba(255, 48, 48, 0.38)',
  camCone: 'rgba(255, 120, 120, 0.15)',
  laser: '#ff2d55',
  hudBg: 'rgba(8, 12, 26, 0.92)',
  text: '#f2ead2',
};
