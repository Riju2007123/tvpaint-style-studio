# TVPaint-style Space — my-version

A desktop rebuild of the TVPaint Animation 12 workflow: drawing engine,
timeline with TVPaint-accurate animation cells, camera system, George scripting —
rebuilt feature-by-feature with reverse-engineering evidence (see REA notes in the
project root documentation).

It runs as a **native Windows application** (Electron shell) and, if you prefer,
as a plain page in a browser.

## Run

**As a desktop app** (the real thing — a native window, real file dialogs):

```
npm install
npm start
```

**As a packaged executable** (a folder with `my-version.exe` you can copy and
run anywhere):

```
BUILD_APP.bat
```

**As a web page** (still works, still the same code):

Double-click `START_APP.bat` (starts the server and opens http://localhost:8471),
or serve the folder any static way:

```
node serve.js
```

Works from `file://` too — just open `index.html`.

## What's inside

| File | Role |
|---|---|
| `main.js` | the desktop shell: the 1936x1048 window, the real File dialogs, the PNG export dialog |
| `preload.js` | the bridge between the page and the shell (`window.tv`) |
| `index.html` | Shell: menubar, panels, timeline, transport, statusbar, CSS ported from TVPaint's shipped `colorschemes/Night.ini` values |
| `engine.js` | Pure logic: frames/exposures, stroke engine, wet pickup, gradient flood, camera keys/paths, George handlers |
| `ui.js` | Wiring: dialogs, panels, timeline render, live-paint stroke loop, selection/cut brush |
| `fsafe.js` | Crash-safe saving: atomic file writes and the crash-recovery snapshot |
| `leftdock.js` / `leftdock.css` | The left dock rebuilt from a screen recording of the live app: Main Panel with group menus, Color Panel with the wheel, Tool panel with one option form per tool |
| `serve.js` | Tiny static server (port 8471) |
| `test/engine.test.js` | Node test suite (no dependencies) |
| `tools/make-icon.js` | Builds `build.ico` (16/32/48/256) for the executable |
| `icons/` | UI icon set (TVPaint's own light resources) |

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
  `Camera size`, `Movement Type`), `Adjust the layer to the animation` (bakes
  the camera movement into the drawings), `Cut keyframe` / `Copy keyframe` /
  `Paste keyframe` and `Invert all keys` (inverts the camera path).
- The camera has **four independent channels** - position, rotation, zoom and
  camera size - each with its own keyframes and its own motion curve, exactly
  like TVPaint 12 (the keyframe flag word carries `1 = position, 2 = rotation,
  4 = zoom, 8 = size`).  A keyframe only drives the channels it is keyed for.
  The `Create keyframe` / `Delete keyframe` submenus tick the channels that are
  keyed, and the camera row's menu holds `Create keyframe / Delete keyframe /
  Adjust the layer to the animation / Cut keyframe / Copy keyframe / Paste
  keyframe / Invert all keys`.
- The **Camera[Pro]** panel: `Command` (Invert / Load... / Save... / Reset /
  Reset and Fit to project), `Lock All`, `Time Profile`, `See bookmarks`,
  `Toggle all`, `Mode` (Linear / Spline / Bezier curve / Smart Spline),
  `Motion Blur`, `X`, `Y`, `Width`, `Height`, `Modify ratio`, `Rotation`,
  `Zoom`, `Flip X`, `Flip Y` and `Parameters ...` (the camera parameters
  request: Format, width, height, frame rate, pixel aspect ratio, field order).
  The **Time Profile** is the camera motion curve: a Time x Position graph with
  draggable handles and presets.
- With the Camera tool active the canvas shows the whole camera profile: the
  1 px frame in the camera colour, the four corner handles, the centre handle
  and the guide that runs to the right edge of the frame.
- The project window shows the **drawing area**, always - the camera is a pure
  overlay and never transforms the artwork (measured live, see
  `reports/timeline-evidence.md`): the whole view is dimmed to `126/255` of its
  brightness, the camera's field of view is punched back to full brightness,
  and the field of view is framed with a 1 px line in the camera colour
  `rgb(128,128,255)` plus a 20 canvas pixel centre plus. The project view
  background is `#2d2d32` and the drawing area keeps the project background
  colour. The artwork is drawn over the **whole** drawing area (the live app
  does not clip it).
  `Project > Render Camera` renders the camera view of every frame into a new
  project (`Into a New Project` / `Into a New merged Project`).
- **Canvas footer** (live layout): `Rotate the view` (LMB drag turns the view,
  RMB opens the rotation menu), a fit button, the zoom percentage field, a
  zoom-fit button, `−` / `+` and the `Display ▾` popup. The view can be rotated
  and the artwork, the overlays and the camera follow it.
- **Zoom** follows the live TVPaint ladder (`1 2 2.5 3.33 5 6.67 10 12.5 16.67
  20 25 33.33 50 75 100 150 200 300 400 500 600 700 800 900 1000 1200 1400
  1600 1800 2000 3000 4000 5000 10000 %`); `Fit` fits the drawing area and
  snaps to that ladder, and zooming keeps the **centre of the drawing area**
  at the same screen point.
- **Canvas display options**: the `Display ▾` popup of the canvas footer carries
  the live TVPaint 12 entries and their live states - `Show Stencil`,
  `Show Paper`, `Show Selection` (on), `Show Animator Disk` (on), `Show Camera`
  (on), `Follow Camera`, `Show Timeline Notes` - and they really switch the
  selection overlay, the animator disc, the camera overlay, the camera-follow
  mode and the notes. The overlay colours come from the binary's
  own tokens (`0 0 0 128` selection, `64 64 64 128` animator disk / layer
  attenuation, `255 255 0 255` reticule, `128 128 255 255` camera profile).
- Two more canvas overlays taken from the binary's own tokens: the **reticule**
  (the yellow `255,255,0,255` crosshair that follows the pointer, `View >
  Reticule`) and the **layer attenuation** (`64,64,64,128` - the layers that are
  not the current one are dimmed, `View > Attenuate other layers`).
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

- **Left dock** (matched to a 1920x1080 recording of TVPaint 12): dock order Main /
  Color / Tool, 19 px option rows, flat grey fields with bare check marks, the ten
  brushes in the live order, and the shape tiles as groups (click = current member,
  right click / hold / corner = the group menu with the shipped labels). Forms exist
  for Pen, Pencil-family, Air, Custom, Text, Paint bucket, Filling Shape, Cut Brush,
  Select and Crop. Controls the engine already has (size, power, opacity,
  anti-aliasing, smoothing, fill range) drive it; the rest keep their value per tool
  but do not change the drawing yet.
- **Floating panels** (`panelfloat.js`): drag any dock panel by its title bar and it floats
  over the application; a blue line shows the slot while you drag it back over the dock,
  and dropping it there docks it at that spot (the same drag re-orders docked panels).
  Double click a title bar to dock / undock a panel at its original spot, or use the dot in
  the title bar (Dock / Float / Separate window). In the desktop build, dropping a panel
  outside the application window turns it into a window of its own; drag that window
  back over the application and it floats or docks again. The layout is remembered.
- **Safe saving** (desktop build): every save writes a temp file and renames it over
  the project, so a crash mid-save can't corrupt it. While there are unsaved changes a
  recovery snapshot is written every minute to the app's data folder; after a crash
  the next start offers to restore it. Closing the window with unsaved changes asks
  first, using the same Save / Quit dialog as File > Quit.

50 Node tests cover the timeline operations, exposure ripple/trim/slide, delete
modes, add-exposure, layer order, selected-image reversal, camera
interpolation, camera movement types, camera key moves and the camera render,
auto break/create flags, history and the project window zoom ladder
(`npm test`).

## Tests

```
npm test
```

> Prototype, not affiliated with TVPaint Développement. Recommended for learning and
> workflow study; TVPaint and its icons remain © their owner.
