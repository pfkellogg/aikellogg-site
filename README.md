# aikellogg.com

The AIKellogg website: a single-page React site (Vite). First page: the **Mellotron Flute Lab**, the Mellotron flute
from FM-1 Big Screen made from scratch, its whole recipe as sliders, for the flute contest.

- `npm run dev`: work on it locally; `npm run build`: the site in `dist/`.
- Every push to `main` publishes it on GitHub Pages at https://aikellogg.com (`.github/workflows/deploy.yml`).
- The flute's engine: `src/lab/flute.js` (the v7 recipe of pfkellogg/fm1-mirror-spyglass-android's
  `tools/make_mellotron_flute.py`).
