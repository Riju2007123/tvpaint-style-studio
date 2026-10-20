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
- Transport: Mark In/Out, fps dropdown (12/24/25/30), play/stop/step, hand zoom
  group, loop limits (clip / layer / Mark In-Out / image marks / custom)

- Timeline menus captured live from TVPaint 12: the 15-item layer menu and the
  15-item cell menu, with submenus, shortcuts, separators, checked and disabled
  states. Exposure break / remove / set value, insert / duplicate / delete images,
  delete from project, repeat Loop / Ping-Pong / Random, image roles and image
  marks, split, merge, slide, align, reverse order, multi-layer selection.
  (The Move / Align / Merge / Select / Role submenu entries are reconstructed from
  the shipped `english.tvpaint.loc` strings and George commands; the top-level
  menus and the cell submenus were observed directly.)
- New layer ▾ (anim, background, colour & texture, folder, puppet, import footage,
  duplicate structure), 17 blending modes, 13 colour groups, background
  None / Color / Check rendering, start frame, and the footer Notes / Sound /
  Color Group panes. Per-layer lock / light table / preserve-transparency /
  stencil dots, row collapse, global layer flags and image-mark ruler ticks.

31 Node tests cover the timeline operations (`npm test`).

## Tests

```
npm test
```

> Prototype, not affiliated with TVPaint Développement. Recommended for learning and
> workflow study; TVPaint and its icons remain © their owner.
