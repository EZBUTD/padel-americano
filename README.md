# Court & Company — Padel Americano

A buildless static site for a one-court padel session. Select 4–9 players (default: 6), name players, select the active round, advance to the next pairing, and optionally enter both team scores. The individual leaderboard ranks by `(wins + ties / 2) / played`, then total games won (the sum of individual team scores across completed matches, including losses and ties). Each round is one match; the score records games won. Resting players and incomplete scores do not count. Sessions for each player count save separately in browser local storage.

## GitHub Pages

Push these files to your GitHub repository. Under **Settings → Pages**, choose **Deploy from a branch**, select your branch and **/ (root)**, then save. No build, dependencies, server, or environment variables are required. Relative asset paths work on repository Pages URLs. `.nojekyll` bypasses Jekyll processing.

## Preview and checks

With Node.js installed, run `npm start` and open http://127.0.0.1:4173. Run `npm test` for rotation validity and scoring checks. Google Fonts are optional; system fonts work without them.

## Rotation source

`rotations.js` contains 40 rounds per player count, transcribed from the supplied photograph. Four players repeat the three available team combinations. Ten players are excluded because that column is cropped.

The six-player column's round 39 appears to repeat player 5 (`5 + 6 vs 4 + 5`). The app substitutes resting player 1 (`5 + 6 vs 4 + 1`), explicitly disclosed below the rotation. This is an interpretation, not a confirmed transcription; edit the entry if a clearer source is available.

Scores accept whole numbers from 0 to 999, including 0–0 ties. Selecting or advancing a round does not create a result. Reset clears only the selected session's scores and active round, preserving names. Saved sessions are local to the current browser and site URL.
