// Transcribed top-to-bottom from the supplied one-court rotation sheet.
// Each four-digit entry is team A followed by team B.
export const ROTATIONS = {
  4: Array.from({ length: 40 }, (_, i) => ['1234', '1324', '1423'][i % 3]),
  5: '1234 1523 2435 1345 1425 1324 1235 2345 1534 1245 1423 1325 2534 1524 1435 1234 1325 1524 2345 1435 1523 1324 2534 1245 1534 1235 2435 1345 1423 1425 1345 2435 1523 1234 1425 1534 1324 2534 1235 1524'.split(' '),
  // Round 39 appears to repeat player 5 in the photo. Use resting player 1
  // instead so each match has four distinct players; disclosed in the UI.
  6: '1234 1526 3546 1324 1625 3645 1423 1256 3456 1325 1426 1635 2345 1246 1536 2435 1624 2356 1534 2436 1456 1235 2634 1546 1523 1436 2546 1345 1623 2456 1356 2634 1435 2536 1324 1236 1425 1523 5641 2346'.split(' '),
  7: '1234 1756 2345 1627 3546 1237 4567 1325 1647 2635 1437 2567 1346 2457 1536 2647 1435 2736 1524 3457 1726 1356 2347 1527 1634 2546 1735 2467 1256 3745 1467 2356 1327 1457 2436 1526 3547 1423 1657 2746'.split(' '),
  8: '1234 5678 1324 5768 1425 3867 1526 3748 1635 2847 1357 2468 1758 2346 1867 2534 1647 2358 1478 2635 1238 4567 1836 2457 1682 3584 1728 3456 1548 2736 1836 2547 1436 2758 1635 2846 1256 3478 1854 2637'.split(' '),
  9: '1234 5678 1923 4758 2639 1457 2986 3745 1869 2735 1649 2837 1569 2438 1967 2548 1732 4589 1627 3859 1246 1358 2947 3568 1249 1879 1546 1728 3459 4678 2357 1567 1834 2569 1478 2468 1529 3647 1978 2695'.split(' '),
};

export function getRounds(count) {
  return ROTATIONS[count].map(code => ({ a: [...code.slice(0, 2)].map(Number), b: [...code.slice(2)].map(Number) }));
}

export function standings(count, rounds, scores) {
  const players = Array.from({ length: count }, (_, i) => ({ id: i + 1, played: 0, wins: 0, draws: 0, losses: 0, gamesWon: 0, rate: 0 }));
  rounds.forEach((round, i) => {
    const score = scores[i];
    if (!score || score.some(value => value === '' || !Number.isInteger(Number(value)) || Number(value) < 0)) return;
    const [a, b] = score.map(Number);
    for (const [team, own, other] of [[round.a, a, b], [round.b, b, a]]) {
      team.forEach(id => {
        const p = players[id - 1];
        p.played++;
        p.gamesWon += own;
        if (own > other) p.wins++;
        else if (own === other) p.draws++;
        else p.losses++;
        p.rate = (p.wins + p.draws / 2) / p.played;
      });
    }
  });
  return players.sort((a, b) => b.rate - a.rate || b.gamesWon - a.gamesWon || a.id - b.id);
}
