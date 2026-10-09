import test from 'node:test';
import assert from 'node:assert/strict';
import { ROTATIONS, getRounds, standings } from './rotations.js';

test('Every schedule has 40 valid one-court matches', () => {
  for (const count of Object.keys(ROTATIONS).map(Number)) {
    const rounds = getRounds(count);
    assert.equal(rounds.length, 40, `${count} players`);
    rounds.forEach((r, i) => {
      const ids = [...r.a, ...r.b];
      assert.equal(new Set(ids).size, 4, `${count} players, round ${i + 1}`);
      assert.ok(ids.every(id => id >= 1 && id <= count));
    });
  }
});
test('Five-player opening follows the supplied example', () => {
  assert.deepEqual(getRounds(5).slice(0, 2), [{ a: [1, 2], b: [3, 4] }, { a: [1, 5], b: [2, 3] }]);
});
test('Wins, ties, resting players and incomplete scores are handled individually', () => {
  const result = standings(5, getRounds(5), [['4', '0'], ['2', '2'], ['3', '']]);
  const byId = id => result.find(p => p.id === id);
  assert.deepEqual(byId(1), { id: 1, played: 2, wins: 1, draws: 1, losses: 0, gamesWon: 6, rate: .75 });
  assert.equal(byId(5).rate, .5);
  assert.equal(byId(4).played, 1);
  assert.equal(byId(3).losses, 1);
});
test('Win rate ranks first and total games won breaks ties', () => {
  const result = standings(6, [
    { a: [1, 2], b: [3, 4] },
    { a: [1, 2], b: [3, 4] },
    { a: [3, 4], b: [5, 6] },
  ], [['1', '0'], ['0', '1'], ['0', '1']]);
  assert.deepEqual(result.map(p => p.id), [5, 6, 1, 2, 3, 4]);
  const tiedRate = standings(6, [
    { a: [1, 2], b: [3, 4] },
    { a: [1, 2], b: [3, 4] },
    { a: [3, 4], b: [5, 6] },
  ], [['1', '0'], ['0', '1'], ['2', '2']]);
  assert.deepEqual(tiedRate.map(p => p.id), [3, 4, 5, 6, 1, 2]);
  assert.ok(tiedRate.every(p => p.rate === .5));
  assert.deepEqual(tiedRate.map(p => p.gamesWon), [3, 3, 2, 2, 1, 1]);
});
test('Games won includes losing and tied matches and recalculates after score edits', () => {
  const rounds = getRounds(5);
  const scores = [['3', '2'], ['1', '1']];
  assert.equal(standings(5, rounds, scores).find(p => p.id === 3).gamesWon, 3);
  scores[0] = ['4', '0'];
  assert.equal(standings(5, rounds, scores).find(p => p.id === 3).gamesWon, 1);
  scores[1] = ['1', ''];
  assert.equal(standings(5, rounds, scores).find(p => p.id === 3).gamesWon, 0);
});
