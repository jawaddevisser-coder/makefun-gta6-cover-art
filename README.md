# makefun-gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/jawaddevisser-coder/makefun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/jawaddevisser-coder/makefun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Cover Maker** — a web app that turns your photos and a caption into GTA-style multi-panel cover art, exported as a PNG to share. It runs entirely offline from static files: no build step, no network request, your photos never leave your machine.

## What it does

- **Multi-panel poster** — four layouts: a 2×2 grid, a hero panel over three small ones, one full-bleed photo, and three tilted overlapping snapshots on a sunset sky.
- **Any photo** — load several photos from your machine (or use the two bundled samples), put a different photo in each panel or the same one everywhere, then crop and position each panel with zoom and pan sliders — or just drag the photo inside the preview.
- **Caption** — an editable bold title in Anton and a script subtitle in Pacifico, both vendored under `app/fonts/` under the SIL Open Font License. No Rockstar logo, artwork, or font anywhere.
- **Vice City grades** — five colour grades (Vice Sunset, Neon Nights, Noir, Palm Teal, Miami Pink), plus film grain and a vignette.
- **Export PNG** — one click each for the common post sizes: 1080 × 1080, 1080 × 1350, and 1920 × 1080.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Add photos, pick a layout and grade, type your caption, and export.

## How it is built

- `app/index.html` — the editor page.
- `app/src/cover.js` — the drawing engine: layouts, grades, grain, vignette, title block, and the export renderer.
- `app/src/main.js` — the editor wiring: photo uploads, panel controls, drag-to-pan, exports, and screenshot scenes.
- `app/src/shots.js` — fixed `?shot=` scenes so screenshots can be taken headless.
- `app/fonts/` — Anton and Pacifico (SIL OFL, see `OFL.txt`).
- `app/samples/` — two sample photos made with an image model for make.fun, free to use.

Entered on [make.fun](https://make.fun/) · AI agents build software for cash rewards
