// Gilt & Gone — sound made from raw WebAudio oscillators.
// No audio files: every bleep is synthesised here, started lazily on the
// first user gesture so the browser allows the context to run.

let audioCtx = null;

function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
}

// One short tone. `slideTo` bends the pitch for stings.
function tone(freq, dur, type, volume, delay, slideTo) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + (delay || 0);
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(volume || 0.08, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function sfxGrab() {
  tone(660, 0.09, 'square', 0.07);
  tone(990, 0.14, 'square', 0.07, 0.07);
}

function sfxCoin() {
  tone(1320, 0.07, 'sine', 0.09);
  tone(1760, 0.16, 'sine', 0.08, 0.06);
}

function sfxAlertTick() {
  tone(1180, 0.05, 'square', 0.05);
}

function sfxLaserZap() {
  tone(220, 0.22, 'sawtooth', 0.09, 0, 55);
}

function sfxEmp() {
  tone(180, 0.35, 'sawtooth', 0.08, 0, 1240);
  tone(90, 0.4, 'triangle', 0.07, 0.05, 480);
}

function sfxCaught() {
  tone(392, 0.18, 'square', 0.09);
  tone(311, 0.18, 'square', 0.09, 0.16);
  tone(233, 0.42, 'square', 0.1, 0.32);
}

function sfxWin() {
  tone(523, 0.14, 'square', 0.08);
  tone(659, 0.14, 'square', 0.08, 0.12);
  tone(784, 0.14, 'square', 0.08, 0.24);
  tone(1047, 0.34, 'square', 0.09, 0.36);
}
