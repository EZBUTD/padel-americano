import { getRounds, standings } from './rotations.js';

const $ = id => document.getElementById(id);
const key = 'court-company-v1';
let data = { count: 6, sessions: {} };
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && [4, 5, 6, 7, 8, 9].includes(saved.count) && saved.sessions && typeof saved.sessions === 'object') data = saved;
} catch { /* A new session also works when storage is unavailable. */ }
let expanded = false;
let session;
let rounds;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const name = id => session.names[id - 1]?.trim() || `Player ${id}`;
const person = id => `<span class="person"><span class="number">${id}</span><span>${escape(name(id))}</span></span>`;
const team = ids => `<span class="team">${ids.map(person).join('<span class="plus">+</span>')}</span>`;
const match = round => `${team(round.a)}<span class="versus">vs</span>${team(round.b)}`;
function save() {
  try { localStorage.setItem(key, JSON.stringify(data)); $('save-status').textContent = '✓ Session saved on this device'; }
  catch { $('save-status').textContent = 'Browser storage is unavailable. Keep this tab open to retain your session.'; }
}
function load() {
  rounds = getRounds(data.count);
  session = data.sessions[data.count];
  if (!session || !Array.isArray(session.names) || !Array.isArray(session.scores)) session = data.sessions[data.count] = { names: [], scores: [], active: 0 };
  session.active = Number.isInteger(session.active) ? Math.max(0, Math.min(rounds.length - 1, session.active)) : 0;
  $('player-count').value = data.count;
  $('rotation-note').textContent = data.count === 6 ? 'Photo clarification: round 39 appears to list player 5 twice. This session uses 5 + 6 vs 4 + 1 so four different players can play.' : '';
  $('players').innerHTML = Array.from({ length: data.count }, (_, i) => `<label class="player-field"><span class="number">${i + 1}</span><input data-player="${i}" aria-label="Player ${i + 1} name" maxlength="30" placeholder="Player ${i + 1}" value="${escape(session.names[i] || '')}"></label>`).join('');
  render();
}
function renderCurrent() {
  const round = rounds[session.active];
  $('current-round').textContent = `ROUND ${session.active + 1} / ${rounds.length}`;
  $('current-match').innerHTML = match(round);
  const resting = Array.from({ length: data.count }, (_, i) => i + 1).filter(id => ![...round.a, ...round.b].includes(id));
  $('resting').textContent = resting.length ? `Taking a breather: ${resting.map(name).join(', ')}` : 'Everyone’s on court.';
  $('next').disabled = session.active === rounds.length - 1;
  $('next').innerHTML = session.active === rounds.length - 1 ? 'Last round reached' : 'Next round <span>→</span>';
  $('up-next').innerHTML = session.active + 1 < rounds.length ? `<span class="eyebrow">UP NEXT · ${session.active + 2}</span><span>${escape(rounds[session.active + 1].a.map(name).join(' + '))} <span class="versus">vs</span> ${escape(rounds[session.active + 1].b.map(name).join(' + '))}</span>` : '<span>Rotation complete. Reset the session to play again.</span>';
}
function renderRounds() {
  const limit = expanded ? rounds.length : Math.min(rounds.length, Math.max(8, session.active + 2));
  $('rounds').innerHTML = rounds.slice(0, limit).map((round, i) => {
    const score = session.scores[i] || ['', ''];
    return `<div class="round-row ${i === session.active ? 'active' : ''}" data-row="${i}"><button class="round-select" data-round="${i}" aria-label="Select round ${i + 1}: ${escape(round.a.map(name).join(' and '))} versus ${escape(round.b.map(name).join(' and '))}" aria-pressed="${i === session.active}"><span class="round-number">${String(i + 1).padStart(2, '0')}<small>${i === session.active ? 'LIVE' : ''}</small></span><span class="row-match">${match(round)}</span></button><div class="score"><input type="number" min="0" max="999" step="1" inputmode="numeric" data-score="${i}" data-side="0" aria-label="Round ${i + 1}, team A score" placeholder="–" value="${escape(score[0] ?? '')}"><span>:</span><input type="number" min="0" max="999" step="1" inputmode="numeric" data-score="${i}" data-side="1" aria-label="Round ${i + 1}, team B score" placeholder="–" value="${escape(score[1] ?? '')}"></div></div>`;
  }).join('');
  $('show-all').textContent = expanded ? 'Show fewer rounds ↑' : `Show all ${rounds.length} rounds ↓`;
}
function renderStandings() {
  const ranked = standings(data.count, rounds, session.scores);
  let rank = 1;
  $('standings').innerHTML = ranked.map((p, i) => {
    if (i && (p.rate !== ranked[i - 1].rate || p.gamesWon !== ranked[i - 1].gamesWon)) rank = i + 1;
    return `<tr><td class="rank">${p.played ? String(rank).padStart(2, '0') : '–'}</td><th scope="row">${person(p.id)}</th><td>${p.played}</td><td>${p.wins}</td><td>${p.draws}</td><td>${p.losses}</td><td>${p.gamesWon}</td><td class="rate">${p.played ? `${Math.round(p.rate * 100)}<small>%</small>` : '–'}</td></tr>`;
  }).join('');
  const completed = session.scores.filter(s => s && s.length === 2 && s.every(v => v !== '' && Number.isInteger(Number(v)) && Number(v) >= 0)).length;
  $('progress').textContent = `${completed} / ${rounds.length} scored`;
  $('leaderboard-note').textContent = completed ? 'Only matches with both scores entered count toward standings.' : 'The first score starts the story. Enter both team scores to see the standings.';
}
function render() { renderCurrent(); renderRounds(); renderStandings(); }
$('player-count').addEventListener('change', event => { data.count = Number(event.target.value); expanded = false; load(); save(); });
$('players').addEventListener('input', event => {
  if (!event.target.matches('[data-player]')) return;
  session.names[Number(event.target.dataset.player)] = event.target.value;
  render(); save();
});
$('rounds').addEventListener('click', event => {
  const button = event.target.closest('[data-round]');
  if (!button) return;
  session.active = Number(button.dataset.round); render(); save();
});
$('rounds').addEventListener('input', event => {
  const input = event.target;
  if (!input.matches('[data-score]')) return;
  const value = input.value;
  input.setCustomValidity(value !== '' && (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 999) ? 'Enter a whole score between 0 and 999.' : '');
  const i = Number(input.dataset.score);
  session.scores[i] ||= ['', ''];
  session.scores[i][Number(input.dataset.side)] = input.validity.valid ? value : '';
  renderStandings(); save();
});
$('next').addEventListener('click', () => { if (session.active < rounds.length - 1) { session.active++; render(); save(); } });
$('show-all').addEventListener('click', () => { expanded = !expanded; renderRounds(); });
$('reset').addEventListener('click', () => $('reset-dialog').showModal());
$('cancel-reset').addEventListener('click', () => $('reset-dialog').close());
$('confirm-reset').addEventListener('click', () => { session.scores = []; session.active = 0; expanded = false; render(); save(); $('reset-dialog').close(); });
load();
