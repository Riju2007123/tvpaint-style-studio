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
  image bounds, exposure blocks with number labels + checkerboard empties + exposure badge.
  Per-image handles match the live app: the top-left square trims the start against the
  previous instance without moving later keys, the bottom-right square changes that
  exposure and ripples every later image, the vertical bar past the layer end opens the
  Increase/Decrease Layer Length dialog. Horizontal drag on any key, hold or spine slides
  the whole layer (Project/Clip follow a fitted out-point); `+` inserts (after-current
  semantics). Auto Break Instance and Auto Create Frame are per-layer icon toggles
  (default ON, tooltips `Toggle auto break instance.` / `Toggle auto create frame.`);
  drawing on a hold copies the image and splits the exposure, drawing on an empty cell
  creates a frame, and each structural change has its own undo step.
- Camera layer: keyframes on canvas drag and via the camera strip `+` marks,
  hold/linear/smooth interp, View ▸ Camera View render-through, Camera[Proj] panel
- George input: `tv_pen`, `power`, `opacity`, `tv_wetbrush`, `tv_camerainfo`, …
- Transport: Mark In/Out, fps dropdown (12/24/25/30), play/stop/step, hand zoom
  group, loop limits (clip / layer / Mark In-Out / image marks / custom)

- Timeline menus captured live from TVPaint 12: the 15-item layer menu and the
  15-item cell menu, with submenus, shortcuts, separators, checked and disabled
  states. Exposure break / remove empty exposures / set value, insert / duplicate /
  delete images, Delete from Layer with the captured mode arrows and order
  `Stay put`, `Keep empty`, `Fill gap from left`, `Fill gap from right` (Keep empty
  verified live on key 2: frames became empty, the next image stayed at frame 5,
  and the layer/project length stayed 7), delete from project, repeat
  `Set the Repeat Images Value...` / `Reset` / Loop / Ping-Pong / Random, image
  roles and image marks, Split (enabled at a key start: splits the layer at the
  clicked frame), reverse selected images, multi-layer selection, and the
  restored `Define Loop Limits` entry at the bottom. `Select Image from Key` is
  grayed at a key start, matching the live menu; it is enabled on a hold and
  selects the held image at its key start.
- Scrubbing: dragging the timeline ruler scrubs the clip and stops at the end
  of the selected layer (the rule TVPaint documents for the timeline area); a
  single click on a ruler number jumps straight to that frame. The transport
  bar under the canvas scrubs the whole clip.
- Keyboard editing in the timeline: **Backspace** is *Add Exposure* (loc
  28620 / George `tv_exposureadd`) - on an empty cell it creates a new empty
  animation cell there and the layer grows to include it, inside a hold it
  splits the exposure (the earlier part keeps the drawing, the new instance
  takes the remaining frames) and on a frame that already starts an instance it
  does nothing. **Delete** is *Delete Image* (loc 28602) and removes the
  drawing of the current frame using the layer's delete mode. Both are also in
  the Image menu (`Add Exposure`, `Delete Image`, `Delete Selection from
  Layer`, `Delete Selection from all Layers`).
- Camera layer: a project gets a camera either from `File > New Project... >
  Project with Camera` (the dialog then has a *Camera View (Final Output)*, a
  ratio and a larger *Drawing Area*) or by picking the **Camera** tool in the
  Main Panel, which adds the camera to the current project. The live app then
  shows a `Camera Layer` row and a `Speed curve` row above the layer list, a
  camera row at the top of the timeline (a thin strip where every camera key
  is a `+` glyph - yellow on the current image, grey elsewhere - and the `+`
  can be **dragged with the left mouse button to move the keyframe**), and
  switches the tool panel to `Tool : Camera[Pro]` with the camera options
  (Command: `Invert`, `Load...`, `Save...`, `Reset`, `Reset and Fit to
  project`; Lock All, See bookmarks, Toggle all, Mode: `Linear` / `Spline` /
  `Bezier curve` / `Smart Spline`, Motion Blur, X/Y with axis locks, Modify
  ratio, Rotation, Zoom, Flip X/Y, Parameters...). Right
  clicking the camera row opens the captured keyframe menu - `Create keyframe` /
  `Delete keyframe` (each with `All`, `Position`, `Rotation`, `Zoom`,
  `Camera size`, `Movement Type`), `Adjust the layer to the animation`,
  `Cut keyframe` / `Copy keyframe` / `Paste keyframe` and `Invert all keys`
  (inverts the camera path).
- Layer order: the layer rows can be dragged onto each other to reorder them
  (with `Move Selected Layers` armed, the whole selection travels as a block),
  and the layer menu's `Move` submenu now carries the exact TVPaint 12 entries
  (`Move Selected Layers`, `Up`, `Down`, `Bring Selected Layers Together`,
  `Reverse All Layer Order`, `Reverse Selected Layer Order`).
- Image drag and drop between layers, with the behaviour the shipped
  preference describes (loc 011021204/011021205): dragging a drawing onto
  another layer row **moves** it, **Ctrl** copies it and **Shift** inserts it
  (pushing the target layer's later images). A horizontal drag inside one layer
  still slides the whole layer, exactly as in the live app. The Image menu also
  has `Modify > Flip Horizontally / Flip Vertically / Flip Horizontally &
  Vertically` (loc 28612-28614).
- Timeline zoom and fit: the timeline footer carries TVPaint's interactive
  zoom ratio (shipped `LayerZoomRatio` icon, drag left/right to change the frame
  width) and a `Fit` popup with the shipped loc entries `Fit to Clip`, `Fit to
  Layer`, `Fit to Selection`, `Fit to Frames`, `Fit to Keys`, `Fit to Sound`,
  `Fit to View All`, `Fit to Exposures` and `Fit to Mark In-Mark Out`. Right
  clicking the ruler or a layer strip opens the `Timeline:` command menu
  (zoom in/out, the fit entries, role visibility, expand/collapse and the
  frame-number / time-code switch). The ruler can display SMPTE-style time code
  (`00:00:00:00` at frame 1). Cell width is a live CSS variable, so every
  timeline gesture (exposure ripple, trim, slide, selection) follows the zoom.
- Image selection and multi-image clipboard: plain cell clicks clear the
  selection, Shift-click extends a key range from the anchor, Ctrl-click toggles
  one key, `Select All` (Ctrl A) selects every key on the current layer, and a
  selection highlight follows each image's exposed cells. `Cut Image` / `Copy
  Image` become `Cut Selected Images` / `Copy Selected Images` when a selection
  exists (the singular and plural labels are both in the shipped loc), cut and
  paste handle every selected drawing as one undo step, and `Reverse Selected
  Images` reverses only the selected keys while unselected keys stay in place.
  (The live interaction used to create a selection was not captured; Shift/Ctrl
  click is the inferred timeline gesture. The Move / Align / Merge / Select /
  Role submenu entries are reconstructed from the shipped `english.tvpaint.loc`
  strings and George commands; the top-level menus and the cell submenus were
  observed directly.)
- New layer ▾ (anim, background, colour & texture, folder, puppet, import footage,
  duplicate structure), 17 blending modes, 13 colour groups, background
  None / Color / Check rendering, start frame, and the footer Notes / Sound /
  Color Group panes. Per-layer lock / light table / preserve-transparency /
  stencil dots, row collapse, global layer flags and image-mark ruler ticks.

44 Node tests cover the timeline operations, exposure ripple/trim/slide, delete
modes, add-exposure, layer order, selected-image reversal, camera
interpolation, camera movement types and camera key moves, auto break/create
flags and history (`npm test`).

## Tests

```
npm test
```

> Prototype, not affiliated with TVPaint Développement. Recommended for learning and
> workflow study; TVPaint and its icons remain © their owner.
