# Stretch24

<p align="center">
  <img src="icon.svg" alt="Stretch24 logo" width="120">
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/tag/xenofex7/stretch24?label=version" alt="Version">
  <a href="https://github.com/xenofex7/stretch24/actions/workflows/pages.yml"><img src="https://github.com/xenofex7/stretch24/actions/workflows/pages.yml/badge.svg" alt="Deploy"></a>
  <img src="https://img.shields.io/badge/dependencies-none-brightgreen" alt="No dependencies">
  <img src="https://img.shields.io/github/license/xenofex7/stretch24" alt="License">
  <img src="https://img.shields.io/github/last-commit/xenofex7/stretch24" alt="Last commit">
  <img src="https://img.shields.io/github/commit-activity/m/xenofex7/stretch24" alt="Commit activity">
</p>

<p align="center">
  <a href="https://xenofex7.github.io/stretch24/"><strong>Open the app</strong></a>
</p>

Stretch24 is a free web app with 24 guided stretching exercises - no account, no
ads, no tracking. Everything runs in the browser, works offline and stays on your
device. Available in German, English, French, Italian, Spanish and Portuguese.

## Features

- 24 exercises with instructions and flat illustrations, sorted by body region
- Guided player with countdown ring, automatic left/right switch, rest phases,
  spoken cues and signal tones
- 8 ready-made routines, from a 4-minute wake-up to a 15-minute full body session
- Custom routines: pick the exercises and the seconds per exercise
- Six languages, picked from your browser settings and switchable in the footer
- Streak and stats, stored on your device only (localStorage)
- Installable PWA, usable offline, keeps the screen on during a session
- Dark mode following your system, switchable to light or dark in the footer
- Keyboard shortcuts, responsive, respects `prefers-reduced-motion`

## Installation

Any static web server works. For example:

```bash
git clone https://github.com/xenofex7/stretch24.git
cd stretch24
python3 -m http.server 8000
```

The app is now running at `http://localhost:8000`. Opening `index.html` directly
works too, but the service worker stays inactive.

## Development

No framework, no build step, no runtime dependencies - plain HTML, CSS and
vanilla JavaScript. Exercises and routines live in
[`assets/data.js`](assets/data.js) as pure structure, all texts in
[`assets/i18n.js`](assets/i18n.js), icons in
[`assets/icons.js`](assets/icons.js). Design tokens are documented in
[`DESIGN.md`](DESIGN.md).

Adding a language means copying one block in `assets/i18n.js`, translating it and
listing it in `LANGS` plus the `<select>` in `index.html`. Run
`node tools/check-consistency.mjs` to verify that exercises, images, precache
list, prompts and all translations still line up - it also runs in CI.

Bump `CACHE` in [`sw.js`](sw.js) whenever an app file or an image changes,
otherwise the cache-first service worker keeps serving the old version.

Pull requests are welcome. The binding conventions (Swiss orthography, commit
format, cache discipline) are documented in [`CLAUDE.md`](CLAUDE.md).

### Exercise illustrations

One PNG per exercise ID in `assets/img/`, 512 px, flat mint background, plus a
256 px version in `assets/img/thumb/` for the exercise grid. Both are quantised
with pngquant without dithering, which keeps the whole set around 300 KB. The app
crops them round and mirrors left/right exercises with CSS, so only one direction
is generated.

Missing images are created by the **Generate exercise images** workflow (run it
from the *Actions* tab), which needs the `OPENAI_API_KEY` repo secret. It only
generates what is missing, compresses the result with pngquant, commits it and
triggers the Pages deployment. Locally:

```bash
OPENAI_API_KEY=... node tools/generate-images.mjs --only=neck-side --quality=high
```

### Deployment

Every push to `main` deploys to GitHub Pages via
[`pages.yml`](.github/workflows/pages.yml). Nothing is built, the repo content is
the app.

## Disclaimer

Stretch24 is not a substitute for medical advice. Only stretch to a comfortable
pull, never into pain.

## Credits

- UI icons: [Lucide](https://lucide.dev), ISC licensed, inlined as SVG - see
  [NOTICE](NOTICE)
- Exercise illustrations generated with OpenAI `gpt-image-1`

## License

MIT, see [LICENSE](LICENSE).
