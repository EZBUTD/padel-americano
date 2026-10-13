import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Exercise the page's event handlers with court-space pointer coordinates.
function setup(saved) {
  class Element {
    constructor(tagName = 'DIV') { this.tagName = tagName; this.attributes = {}; this.dataset = {}; this.children = []; this.events = {}; }
    setAttribute(k, v) { this.attributes[k] = String(v); if (k === 'data-player') this.dataset.player = v; }
    append(el) { this.children.push(el); }
    replaceChildren(...els) { this.children = els; }
    addEventListener(name, fn) { this.events[name] = fn; }
    closest() { return this.dataset.player ? this : null; }
    focus() {}
    setPointerCapture(id) { this.capture = id; }
    releasePointerCapture() { this.capture = null; }
    hasPointerCapture(id) { return this.capture === id; }
    getScreenCTM() { return { inverse() {} }; }
    fire(name, extra = {}) { this.events[name]?.({ button: 0, pointerId: 1, clientX: 100, clientY: 100, target: this, preventDefault() {}, ...extra }); }
  }
  const elements = Object.fromEntries(['board', 'tokens', 'drawings', 'undo', 'redo', 'board-status', 'ink', 'width', 'clear-lines', 'reset-players', 'tool-help', 'eraser'].map(id => [id, new Element()]));
  elements.ink.value = '#f4e994'; elements.width.value = '6';
  let stored = saved || null;
  runInNewContext(readFileSync(new URL('./strategy.js', import.meta.url), 'utf8'), {
    document: { getElementById: id => elements[id], createElementNS: (_, tag) => new Element(tag) },
    localStorage: { getItem: () => stored, setItem: (_, value) => { stored = value; } },
    DOMPoint: class { constructor(x, y) { this.x = x; this.y = y; } matrixTransform() { return this; } }
  });
  return { ...elements, toggleEraser: () => elements.eraser.fire('click'), saved: () => JSON.parse(stored) };
}

test('Drawing, whole-stroke erasing, undo and redo preserve the board', () => {
  const ui = setup();
  ui.board.fire('pointerdown');
  ui.board.fire('pointerup', { clientX: 200 });
  assert.equal(ui.saved().strokes.length, 1);
  ui.toggleEraser();
  ui.board.fire('pointerdown', { clientX: 150 }); ui.board.fire('pointerup', { clientX: 150 });
  assert.equal(ui.saved().strokes.length, 0);
  ui.undo.fire('click'); assert.equal(ui.saved().strokes.length, 1);
  ui.redo.fire('click'); assert.equal(ui.saved().strokes.length, 0);
  assert.equal(ui.saved().players.length, 4);
});

test('Dragging stays inside court boundaries and player resets can be undone', () => {
  const ui = setup(), token = ui.tokens.children[0];
  ui.board.fire('pointerdown', { target: token, clientX: 108, clientY: 214 });
  ui.board.fire('pointerup', { clientX: 900, clientY: -100 });
  assert.deepEqual(ui.saved().players[0], { id: 'A2', x: 376, y: 24 });
  assert.equal(ui.saved().strokes.length, 0);
  ui['reset-players'].fire('click'); assert.equal(ui.saved().players[0].x, 108);
  ui.undo.fire('click'); assert.equal(ui.saved().players[0].x, 376);
});

test('Players move while erasing, and toggling the eraser off resumes drawing', () => {
  const ui = setup(), token = ui.tokens.children[0];
  ui.toggleEraser();
  ui.board.fire('pointerdown', { target: token, clientX: 108, clientY: 214 });
  ui.board.fire('pointerup', { clientX: 150, clientY: 250 });
  assert.equal(ui.saved().players[0].x, 150);
  assert.equal(ui.saved().strokes.length, 0);
  ui.toggleEraser();
  ui.board.fire('pointerdown'); ui.board.fire('pointerup');
  assert.equal(ui.saved().strokes.length, 1);
});

test('Drawing across a player keeps drawing without moving the player', () => {
  const ui = setup(), token = ui.tokens.children[0];
  ui.board.fire('pointerdown');
  ui.board.fire('pointermove', { target: token, clientX: 108, clientY: 214 });
  ui.board.fire('pointerup', { target: token, clientX: 108, clientY: 214 });
  assert.equal(ui.saved().strokes.length, 1);
  assert.equal(ui.saved().players[0].x, 108);
  assert.equal(ui.saved().players[0].y, 214);
});

test('Cancelled gestures are discarded and persisted boards reload', () => {
  const ui = setup();
  ui.board.fire('pointerdown'); ui.board.fire('pointercancel');
  assert.equal(ui.drawings.children.length, 0);
  ui.board.fire('pointerdown'); ui.board.fire('pointerup');
  const reloaded = setup(JSON.stringify(ui.saved()));
  assert.equal(reloaded.drawings.children.length, 1);
  assert.equal(reloaded.undo.disabled, true);
  reloaded['clear-lines'].fire('click'); assert.equal(reloaded.saved().strokes.length, 0);
  reloaded.undo.fire('click'); assert.equal(reloaded.saved().strokes.length, 1);
});
