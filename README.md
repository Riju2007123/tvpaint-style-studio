# TVPaint-style Space — my-version

A browser-based prototype of the TVPaint Animation 12 workflow: drawing engine,
timeline with TVPaint-accurate animation cells, camera system, George scripting —
rebuilt feature-by-feature with reverse-engineering evidence (see REA notes in the
project root documentation).

## Run

Double-click `START_APP.bat` (starts the server and opens http://localhost:8471),
or serve the folder any static way:

```
node serve.js
```

Works from `file://` too — just open `index.html`.

## What's inside

| File | Role |
|---|---|
| `index.html` | Shell: menubar, panels, timeline, transport, statusbar, CSS ported from TVPaint's shipped `colorschemes/Night.ini` values |
| `engine.js` | Pure logic: frames/exposures, stroke engine, wet pickup, gradient flood, camera keys/paths, George handlers |
| `ui.js` | Wiring: dialogs, panels, timeline render, live-paint stroke loop, selection/cut brush |
| `serve.js` | Tiny static server (port 8471) |
| `test/engine.test.js` | Node test suite (no dependencies) |
| `icons/` | UI icon set |

## Features (verified)

- Three-panel TVPaint shell, 10 menus, tool panels with per-tool brush memory
- Pen/brush with per-pass **power** and whole-stroke **opacity**, dry-time wet pickup,
  grain/smoothing, live painting (ink visible while drawing)
- Timeline: Project / Clip: Timeline tabs, ruler pair, blue current-frame column with red
  image bounds, exposure blocks with number labels + checkerboard empties + "n" badge,
  drag the last block edge to lengthen exposure, `+` inserts (after-current semantics)
- Camera layer: keyframes on canvas drag and via the camera strip `+` marks,
  hold/linear/smooth interp, View ▸ Camera View render-through, Camera[Proj] panel
- George input: `tv_pen`, `power`, `opacity`, `tv_wetbrush`, `tv_camerainfo`, …
- Transport: Mark In/Out, fps dropdown (12/24/25/30), play/stop/step, zoom

## Tests

```
npm test
```

> Prototype, not affiliated with TVPaint Développement. Recommended for learning and
> workflow study; TVPaint and its icons remain © their owner.
