const $ = id => document.getElementById(id);
const board = $('board');
const ns = 'http://www.w3.org/2000/svg';
const key = 'court-company-strategy-v1';
const defaults = () => [
  { id: 'A2', x: 108, y: 214 }, { id: 'A1', x: 292, y: 214 },
  { id: 'B2', x: 108, y: 586 }, { id: 'B1', x: 292, y: 586 }
];
let state = { players: defaults(), strokes: [] };
const validPoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 400 && p.y >= 0 && p.y <= 800;
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && saved.players?.length === 4 && saved.players.every((p, i) => p.id === defaults()[i].id && validPoint(p)) && Array.isArray(saved.strokes) && saved.strokes.every(s => /^#[0-9a-f]{6}$/i.test(s.color) && [3, 6, 10].includes(s.width) && Array.isArray(s.points) && s.points.length && s.points.every(validPoint))) state = saved;
} catch { /* The board also works without browser storage. */ }
let tool = 'pen';
let gesture = null;
const past = [], future = [];
const snapshot = () => JSON.stringify(state);
function save() {
  try { localStorage.setItem(key, snapshot()); $('board-status').textContent = ''; }
  catch { $('board-status').textContent = 'Storage is unavailable. Keep this tab open to retain your board.'; }
}
function historyButtons() { $('undo').disabled = !past.length; $('redo').disabled = !future.length; }
function commit(before) {
  if (before === snapshot()) return;
  past.push(before);
  if (past.length > 100) past.shift();
  future.length = 0;
  historyButtons(); save();
}
function svgElement(tag, attributes) {
  const el = document.createElementNS(ns, tag);
  Object.entries(attributes).forEach(([name, value]) => el.setAttribute(name, value));
  return el;
}
const tokenElements = new Map();
state.players.forEach(player => {
  const g = svgElement('g', { class: 'player-token', 'data-player': player.id, tabindex: 0, role: 'button', 'aria-label': `${player.id}, Team ${player.id[0]}. Drag or use arrow keys to move.` });
  g.append(svgElement('circle', { r: 23, fill: player.id[0] === 'A' ? '#56a9e2' : '#d94d4c' }));
  const label = svgElement('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' });
  label.textContent = player.id; g.append(label);
  $('tokens').append(g); tokenElements.set(player.id, g);
});
function renderPlayers() {
  state.players.forEach(p => tokenElements.get(p.id).setAttribute('transform', `translate(${p.x} ${p.y})`));
}
function renderStrokes() {
  $('drawings').replaceChildren(...state.strokes.map(s => svgElement('path', {
    d: s.points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') + (s.points.length === 1 ? ' l0.01 0' : ''),
    stroke: s.color, 'stroke-width': s.width
  })));
}
function render() { renderPlayers(); renderStrokes(); historyButtons(); }
function point(event) {
  const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(board.getScreenCTM().inverse());
  return { x: Math.max(0, Math.min(400, p.x)), y: Math.max(0, Math.min(800, p.y)) };
}
function distance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
function erase(from, to) {
  // Sample along the gesture so fast pointer movement still hits narrow strokes.
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 6));
  state.strokes = state.strokes.filter(s => {
    for (let step = 0; step <= steps; step++) {
      const p = { x: from.x + (to.x - from.x) * step / steps, y: from.y + (to.y - from.y) * step / steps };
      if (s.points.some((a, i) => distance(p, a, s.points[i + 1] || a) <= 12 + s.width / 2)) return false;
    }
    return true;
  });
  renderStrokes();
}
board.addEventListener('pointerdown', event => {
  if (gesture || event.button !== 0) return;
  const p = point(event);
  const token = event.target.closest('[data-player]');
  const player = token && state.players.find(p => p.id === token.dataset.player);
  const gestureTool = player ? 'move' : tool;
  event.preventDefault();
  gesture = { pointerId: event.pointerId, before: snapshot(), tool: gestureTool, last: p, player,
    offset: player ? { x: player.x - p.x, y: player.y - p.y } : null };
  board.setPointerCapture(event.pointerId);
  if (player) token.focus();
  if (gestureTool === 'pen') {
    gesture.stroke = { color: $('ink').value, width: Number($('width').value), points: [p] };
    state.strokes.push(gesture.stroke); renderStrokes();
  }
  if (gestureTool === 'erase') erase(p, p);
});
function move(event) {
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  const p = point(event);
  if (gesture.tool === 'move') {
    gesture.player.x = Math.max(24, Math.min(376, p.x + gesture.offset.x));
    gesture.player.y = Math.max(24, Math.min(776, p.y + gesture.offset.y));
    renderPlayers();
  } else if (gesture.tool === 'pen') {
    gesture.stroke.points.push(p); renderStrokes();
  } else erase(gesture.last, p);
  gesture.last = p;
}
board.addEventListener('pointermove', move);
board.addEventListener('pointerup', event => {
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  move(event);
  const before = gesture.before; gesture = null;
  board.releasePointerCapture(event.pointerId); commit(before);
});
function cancelGesture() {
  if (!gesture) return;
  const { before, pointerId } = gesture;
  gesture = null; state = JSON.parse(before); render();
  if (board.hasPointerCapture(pointerId)) board.releasePointerCapture(pointerId);
}
board.addEventListener('pointercancel', cancelGesture);
board.addEventListener('lostpointercapture', cancelGesture);
$('eraser').addEventListener('click', () => {
  cancelGesture(); tool = tool === 'pen' ? 'erase' : 'pen'; board.dataset.tool = tool;
  $('eraser').setAttribute('aria-pressed', String(tool === 'erase'));
});
function change(action) { cancelGesture(); const before = snapshot(); action(); render(); commit(before); }
$('clear-lines').addEventListener('click', () => change(() => { state.strokes = []; }));
$('reset-players').addEventListener('click', () => change(() => { state.players = defaults(); }));
function travel(source, target) {
  cancelGesture(); if (!source.length) return;
  target.push(snapshot()); state = JSON.parse(source.pop()); render(); save();
}
$('undo').addEventListener('click', () => travel(past, future));
$('redo').addEventListener('click', () => travel(future, past));
board.addEventListener('keydown', event => {
  const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
  const token = event.target.closest('[data-player]');
  if (!delta || !token) return;
  event.preventDefault();
  change(() => {
    const p = state.players.find(p => p.id === token.dataset.player), step = event.shiftKey ? 25 : 8;
    p.x = Math.max(24, Math.min(376, p.x + delta[0] * step));
    p.y = Math.max(24, Math.min(776, p.y + delta[1] * step));
  });
});
render();
