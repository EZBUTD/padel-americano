// Tap to type; hold still for 400ms, then slide vertically 16px per score point.
export function attachScoreScrubbing(container, indicator) {
  let gesture = null;
  let suppressClick = false;
  function finish(cancelled = false) {
    if (!gesture) return;
    const g = gesture;
    gesture = null;
    clearTimeout(g.timer);
    g.input.classList.remove('scrubbing');
    indicator.hidden = true;
    if (g.input.hasPointerCapture(g.id)) g.input.releasePointerCapture(g.id);
    if (g.active) {
      suppressClick = true;
      if (cancelled) {
        g.input.value = g.original;
        g.input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else if (!cancelled) g.input.focus();
  }
  container.addEventListener('pointerdown', event => {
    const input = event.target;
    if (gesture || event.button !== 0 || !input.matches('[data-score]')) return;
    suppressClick = false;
    // Delay focus until release so holding on a phone does not open the keyboard.
    event.preventDefault();
    const g = gesture = { input, id: event.pointerId, x: event.clientX, y: event.clientY,
      original: input.value, base: Math.max(0, Math.min(999, Math.round(Number(input.value) || 0))), active: false };
    input.setPointerCapture(g.id);
    g.timer = setTimeout(() => {
      if (gesture !== g) return;
      g.active = true;
      input.blur();
      input.classList.add('scrubbing');
      indicator.textContent = `${g.base} · Slide up + / down −`;
      indicator.hidden = false;
    }, 400);
  });
  container.addEventListener('pointermove', event => {
    const g = gesture;
    if (!g || event.pointerId !== g.id) return;
    if (!g.active) {
      if (Math.hypot(event.clientX - g.x, event.clientY - g.y) > 8) finish(true);
      return;
    }
    event.preventDefault();
    const value = String(Math.max(0, Math.min(999, g.base + Math.round((g.y - event.clientY) / 16))));
    indicator.textContent = `${value} · Slide up + / down −`;
    if (g.input.value !== value) {
      g.input.value = value;
      g.input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  container.addEventListener('pointerup', event => { if (gesture?.id === event.pointerId) finish(); });
  container.addEventListener('pointercancel', event => { if (gesture?.id === event.pointerId) finish(true); });
  container.addEventListener('lostpointercapture', event => { if (gesture?.id === event.pointerId) finish(true); });
  container.addEventListener('click', event => {
    if (!suppressClick || !event.target.matches('[data-score]')) return;
    event.preventDefault();
    suppressClick = false;
  });
  container.addEventListener('contextmenu', event => {
    if (event.target.matches('[data-score]')) event.preventDefault();
  });
  return () => finish(true);
}
