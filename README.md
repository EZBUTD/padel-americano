https://ezbutd.github.io/padel-americano/

# Court & Company — Padel Americano

A buildless static site for a one-court padel session. Select 4–9 players (default: 6), name players, select the active round, advance to the next pairing, and optionally enter both team scores. The individual leaderboard ranks by `(wins + ties / 2) / played`, then total games won (the sum of individual team scores across completed matches, including losses and ties). Each round is one match; the score records games won. Resting players and incomplete scores do not count. Sessions for each player count save separately in browser local storage.

## Strategy board

Open **Strategy board** in the app navigation for a bird's-eye padel whiteboard. Move the four player tokens with a mouse or touch, or focus a token and use arrow keys (Shift moves farther). Hold and drag a player to move them; drag anywhere else on the court to draw. Compact controls sit below the court. Toggle Eraser to erase, and expand Board options for line color, width, clearing, and resetting. The eraser removes whole strokes without affecting players or court markings. Undo and redo cover drawings, erasing, clearing, and player movement. Clear drawings and reset player positions separately. The board saves on this device independently of rotation sessions; undo history lasts for the current page visit.

## GitHub Pages

Push these files to your GitHub repository. Under **Settings → Pages**, choose **Deploy from a branch**, select your branch and **/ (root)**, then save. No build, dependencies, server, or environment variables are required. Relative asset paths work on repository Pages URLs. `.nojekyll` bypasses Jekyll processing.

## Rotation source

`rotations.js` contains 40 rounds per player count, transcribed from the supplied photograph. Four players repeat the three available team combinations. Ten players are excluded because that column is cropped.

The six-player column's round 39 appears to repeat player 5 (`5 + 6 vs 4 + 5`). The app substitutes resting player 1 (`5 + 6 vs 4 + 1`), explicitly disclosed below the rotation. This is an interpretation, not a confirmed transcription; edit the entry if a clearer source is available.

Scores accept whole numbers from 0 to 999, including 0–0 ties. Selecting or advancing a round does not create a result. Reset clears the selected session's player names and scores and returns to round 1. Tap a score to type, or hold for 400ms and slide up/down (up increases, down decreases) to adjust it (16px per point, from 0 to 999). Saved sessions are local to the current browser and site URL.
