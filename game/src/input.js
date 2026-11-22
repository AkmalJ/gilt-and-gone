// Gilt & Gone — keyboard and mouse state.
// Other files poll `keysDown` for movement and consume one-shot presses
// from `pressedKeys`, so a tap is never read twice.

const keysDown = new Set();
const pressedKeys = new Set();
const mousePos = { x: VIEW_W / 2, y: VIEW_H / 2 };
let mouseClicked = false;

function initInput(canvas) {
  window.addEventListener('keydown', (ev) => {
    if (!keysDown.has(ev.code)) pressedKeys.add(ev.code);
    keysDown.add(ev.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(ev.code)) {
      ev.preventDefault();
    }
  });
  window.addEventListener('keyup', (ev) => {
    keysDown.delete(ev.code);
  });
  window.addEventListener('blur', () => {
    keysDown.clear();
  });
  canvas.addEventListener('mousemove', (ev) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = ((ev.clientX - rect.left) / rect.width) * VIEW_W;
    mousePos.y = ((ev.clientY - rect.top) / rect.height) * VIEW_H;
  });
  canvas.addEventListener('mousedown', (ev) => {
    if (ev.button === 0) mouseClicked = true;
  });
}

// Returns true once for each physical press of the given key code.
function wasPressed(code) {
  if (!pressedKeys.has(code)) return false;
  pressedKeys.delete(code);
  return true;
}

function consumeClick() {
  const had = mouseClicked;
  mouseClicked = false;
  return had;
}

function clearTransientInput() {
  pressedKeys.clear();
  mouseClicked = false;
}
