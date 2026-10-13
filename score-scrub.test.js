import test from 'node:test';
import assert from 'node:assert/strict';
import { attachScoreScrubbing } from './score-scrub.js';

function setup(t, initial = '') {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const handlers = {};
  const values = [];
  const input = {
    value: initial, focused: false, captured: null,
    matches: () => true, focus() { this.focused = true; }, blur() { this.focused = false; },
    classList: { add() {}, remove() {} },
    setPointerCapture(id) { this.captured = id; },
    hasPointerCapture(id) { return this.captured === id; },
    releasePointerCapture() { this.captured = null; },
    dispatchEvent() { values.push(this.value); }
  };
  const indicator = { hidden: true };
  const cancel = attachScoreScrubbing({ addEventListener(name, fn) { handlers[name] = fn; } }, indicator);
  const fire = (name, x = 100, y = 100) => handlers[name]({ target: input, button: 0, pointerId: 1, clientX: x, clientY: y, preventDefault() {} });
  return { input, indicator, fire, values, cancel };
}

test('A short tap focuses score input without changing its value', t => {
  const ui = setup(t, '6');
  ui.fire('pointerdown'); t.mock.timers.tick(100); ui.fire('pointerup');
  assert.equal(ui.input.focused, true);
  assert.deepEqual(ui.values, []);
  assert.equal(ui.indicator.hidden, true);
});

test('Holding and sliding updates scores in both directions within bounds', t => {
  const ui = setup(t, '6');
  ui.fire('pointerdown'); t.mock.timers.tick(400);
  assert.equal(ui.indicator.hidden, false);
  ui.fire('pointermove', 148); assert.equal(ui.input.value, '9');
  ui.fire('pointermove', 68); assert.equal(ui.input.value, '4');
  ui.fire('pointermove', -1000); assert.equal(ui.input.value, '0');
  ui.fire('pointermove', 20000); assert.equal(ui.input.value, '999');
  ui.fire('pointerup'); assert.equal(ui.indicator.hidden, true);
  assert.equal(ui.input.focused, false);
});

test('Scrolling before the hold cancels scrubbing without focusing the input', t => {
  const ui = setup(t);
  ui.fire('pointerdown'); ui.fire('pointermove', 100, 120);
  t.mock.timers.tick(500); ui.fire('pointerup');
  assert.equal(ui.indicator.hidden, true);
  assert.equal(ui.input.focused, false);
  assert.deepEqual(ui.values, []);
});

test('Cancelled scrubbing restores an empty score rather than scoring a zero', t => {
  const ui = setup(t);
  ui.fire('pointerdown'); t.mock.timers.tick(400);
  ui.fire('pointermove', 148); assert.equal(ui.input.value, '3');
  ui.fire('pointercancel'); assert.equal(ui.input.value, '');
  assert.deepEqual(ui.values, ['3', '']);
});
