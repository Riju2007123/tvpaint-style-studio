# REA evidence bank — Timeline (TVPaint Animation 12 Pro Demo.exe, sha c998c6fe…)

## v10 pass — layout constants decompiled from the real code
- FUN_14054f790 (LayerPanel layout, 4006 B, decompiled): panel geometry uses scaled
  constants via FUN_140045210(x) — row heights 0x18=24 and 0x13=19, spacing 0x19=25
  (DAT_140cf9224 = 25*2 = 50), minimum widths 0x11=17 / 0x37=55 / 0x32=50. Cell width
  convention 0x20=32. These feed the timeline row geometry in the app.
- FUN_14040ddc0 = George "Exposure %d %d" printer: per-cell (index, exposure) from
  DAT_140cf4a80 — exposure model confirmed as (frame, count) pairs.
- Ported: per-key timing handles (gray 7x7 squares at top corners of every key cell;
  right drag lengthens exposure, left drag moves the drawing) — verified 12→5 by drag
  to screen-frame 9 and drawing moved 1→2; green mark-in tick; borderless ruler;
  strip-start add button. 23/23 tests, 0 console errors, pushed (cd2be75).

## v9 pass — structure verified against the live render (screenshot comparison)
- Left column rebuilt to mirror the track row-for-row: `.lhead` (41px = ruler 20 +
  camera strip 20 + border) and one `.llayer` (56px = strip 40 + label margin 15 + border)
  per drawing layer; blue selected name row, thumbnail, dot toggles, Color, ⊖ opacity.
- Transport consolidated: the duplicated viewport-bottom bar was REMOVED; the timeline
  transport now uses TVPaint's own icon files (Remote-Goto-FirstImage/-PreviousImage/
  -PlaySmall/-NextImage/-LastImage, Remote-LoopOn) — verified against icons/ inventory.
- Hold cells: single horizontal dash per cell (was striped fill) — matches the reference.
- tv_exposureinfo George printer decompiled: FUN_14040ddc0 → emits "Exposure %d %d"
  (cell index, exposure) from DAT_140cf4a80; exposure model = per-cell (frame, count).
- Live screenshot loop now in use: capture → compare → fix; all colors re-sampled equal
  to colorschemes\Night.ini. 23/23 node tests, 0 console errors, stroke + drag verified.

## v8 pass — THE ACTUAL UI COLORS EXTRACTED (no source exists; this is the real definition)
- FUN_14062a0c0 (0x14062a0c0–0x1406303bc, 25 341 B) is the CSS composer: it builds
  "style_generated" rules by concatenating selector strings
  (`div#tvp_body div.clip_scene_pair\n`, …) with the fragment
  ` background-color: #` (0x140a7d0f8 / 0x140a7d178) and colors formatted through
  `L"%02X%02X%02X"` read from a theme struct at offsets +0x11c/+0x11d/+0x11e (R,G,B bytes).
- The binary also references `style_screen.css` / `style_print.css` under
  `export_data_global` — on disk these ship only for Storyboard HTML export
  (Resources\storyboard\export_data_global\style.css etc.), NOT the animation timeline.
- **Resources\colorschemes\{Dawn,Day,Dusk,Night}.ini = the real shipped theme values.**
  Night (matches user screenshots): mdesktopbackground 49,49,54=#313136;
  mdocumentbackground 45,45,50=#2D2D32; mgadgetborder 43,43,48=#2B2B30;
  mgadgettabsselected 62,71,107=#3E476B; mgadgettabstext(selected) 182=#B6B6B6;
  mlayerhandlecolor1 90,90,97=#5A5A61; mlayerhandlecolor2 110,110,117=#6E6E75;
  mlayerhandlegrabbed 90,102,204=#5A66CC; mlayeremptymarkcolor 49,49,54;
  mcameraprofile 128,128,255=#8080FF; mshortcutkeyinuse 240,208,146=#F0D092;
  mgadgettoolbarbutton 92,92,92 / selected 115,115,115; mnotesbackground 80,80,87.
- App is Qt6 (Qt6Core/Gui/Widgets DLLs + styles\qwindowsvistastyle.dll); the animation
  timeline is natively drawn (these scheme values + drawing code), storyboard panel is HTML.
- PORTED & verified live: panel #313136, tabs/selected rows #3E476B, text #B6B6B6,
  blocks/knobs #5A5A61, knobs+border turn #5A66CC while dragging the exposure handle,
  inputs #2D2D32, borders #2B2B30, camera overlay rect #8080FF. Computed styles sampled
  against the ini: EXACT match on every ported value.

## v7 pass (user's third screenshot, annotations processed)
- "Camera key frames": the "+" marks on the thin upper strip render AT camera keyframes
  (plus sparse insert spots); clicking an existing key navigates to it, an empty spot
  seeds a key via E.setCameraKey(proj, f, {}).
- "Animation cells": exposure end-handle (.expHandle) on the LAST drawing block — drag
  right to increase, left to decrease the drawing's exposure; live block-width + badge
  update during the drag, committed to model on release with one undo entry
  (verified 12→16→14).
- Blue current-frame column (#curCol) full track height through both rulers with red
  image-bound edges (replaces the old red line + yellow playhead).
- Info row (#tlInfoRow) above the ruler, TVPaint format:
  `Project U [1 , 21 (21)]  Clip: Clip_001 [1 , 21 (21)]  Layer(2/2): Anim_01 [1 , 16 (16)]  Current Image:3`
  — layer index counts the camera layer (2/2 when the camera project is on); layer
  bracket = [firstKey, lastExposureEnd (span)].
- Transport row (#tlTransport, REA: Mark In/Mark Out boxes, sound/loop toggles, fps
  dropdown, first/prev/play/stop/next/last, zoom −/%/+, Display): play & stop drive the
  existing togglePlay/setInterval loop at proj.fps (verified 12 fps advance), Mark In/Out
  inputs set proj.inFrame/outFrame, zoom +/− and % input drive view.zoom.
- Statusbar/t-status bracket format updated to TVPaint's `[a , b (c)]`.
- syncTransport() called from renderTimelineStatus so remote data changes (Modify
  Project etc.) refresh Mark In/Out/fps/zoom displays.

## v6 pass (animation cells rebuilt per second screenshot)
- Implemented (all live-verified): per-drawing rounded block container (left = key*32,
  width = exposure*32) with gray knob at the seam and black exposure badge ("12" reproduced
  with an actual 12-exposure drawing); drawing number labels "1. 3. 5." BELOW the strip;
  white key cell when the drawing has ink, 8px checkerboard when the drawing is empty (ink
  detected on the rendered thumbnail); small ⊘ sigil inside the first key cell; ∅/⊘ pins at
  both strip ends; thin camera-layer strip above drawing strips with always-visible "+"
  inserts every 4th frame that seed camera keyframes (E.setCameraKey(proj, f, {}) uses the
  evaluated value at that frame); red current-image vertical line through both rulers;
  blue gradient on the selected layer row; green content band + blue mark band on both
  rulers; statusbar "Color" chip.
- George handler pair banked: tv_exposureinfo→0x140d84070 / tv_exposurebreak→0x140dd40c0
  (table entries 0x140a5ff58/0x140a5ff68; invoked indirectly — a proper decompile needs a
  forced-function pass, deferred).
- Cell click → gotoFrame; cell "+" insert keeps TVPaint after-current semantics (keys 1,3).


2026-10-20 session. Found via search_strings (literal/regex) on the Ghidra provider.

## Big architectural find: TVPaint 12's UI is an embedded HTML/CSS engine
- CSS selector strings embedded in the binary, e.g.
  `div#tvp_body div.clip-inner-layout-vertical-1-1 div.preview img` (0x140a7d650),
  `div.clip div.comments div.notes` (0x140a7d430),
  with per-rule inline property fragments ` background-color: #` (0x140a7d0f8/0x140a7d178).
  The complete rule text is composed from fragments — extraction of every rule would take a
  dedicated pass; banked here as the styling model for parity.

## Timeline panel internals (config keys prove pane structure)
- `LayerPanel-TimelineNotesHeight` (0x140a717e0) — Notes pane height persisted
- `LayerPanel-TimelineAudioHeight` (0x140a71820) — Sound/Audio pane persisted
- `TimelineAudio` (0x140a71ad0), `TLNotesOpen`/`TLNotesClose`/`TLNoteShowHud` (0x140a78ec8-ee8)
- `Timeline-Resize.png`, `Remote-Recenter-Timeline.png` — timeline resizer + recenter icons
- `TimelineDnDImagePopup` (0x140a6b6e0) — dragging/dropping images onto cells opens a popup
- `ToggleTimelinePanel` (0x140a6f6c0) — the panel is toggleable

## Exposure model (cells + holds)
- `Exposure %d %d` (0x140a5e8c8), `exposure` (0x140a5e9b0), `exposurelabel`/`exposurecells`
  (0x140a5dee0/0x140a5dff8), `CSVExposureLabel`/`AEExposureCells` (CSV/AE exchange formats)
- George: `tv_exposureinfo`, `tv_exposurebreak` (0x140a62268/0x140a62278),
  `tv_layerrecomputeexposure` (0x140a61ef8) — exposure aware enough to be recomputable

## Notes
- `Notes` (0x140a41e70), `tv_projectheadernotes` (0x140a62ce8), `NoteSize`, `ShowNotes`,
  `mNotesBackground` — notes are project-header notes (stored in the project file).

## Not found as strings (dynamically composed likely)
- "Current image", "Color Group", "Start Frame" statusbar labels; the
  "Project: Untitled_(2) [1, 13 (13)] / Clip: Clip_001 [1, 13 (13)] / Layer(1/2): Camera Layer
  [1, 10 (10)]" formats — likely built via several `%s`/`%d` fragments at runtime.

## Exposure command handlers (table pair, invoked indirectly)
- George table entry at 0x140a5ff58: { handler 0x140d84070, "tv_exposureinfo" }
- 0x140a5ff68: { handler 0x140dd40c0, "tv_exposurebreak" }
- Ghidra has no function symbol at either entry (indirect dispatch), so a decompile requires a
  forced-function pass; deferred. Layout of the table = handler-pointer/string-pointer pairs.

## Applied to my-version (v5 timeline)
- Header tabs Project | **Clip: Timeline**; top ruler + mirrored bottom ruler; current frame
  highlighted in both (blue chip).
- Bands: green = used content range, blue = IN/OUT mark range (both rulers).
- Exposure cells: key cells with thumbnails, hold cells as dash rows, black badge = exposure
  count at block end (`data-exp`), ∅ pins at strip ends, hover "+" inserts a drawing.
- Left: Camera Layer row (live when camera project), layer name row with eye/preserve/
  lighttable/lock + ✏, block with thumbnail, ❋/S≡/▨/⧉ cluster, Color + dot toggles, ⊖ opacity
  slider row (mirrors 100% readout).
- Footer: Notes (working — persists in proj.notes, REA: project header notes), Sound (stub),
  Color Group (stub), Background (stub), ⇤ Start Frame = sets IN mark at current frame.
- Statusbar: Room 1 selector (Rooms 2-4 stubs), Proxy: 100%, Project/Clip/Layer/Current Image,
  x/y + live RGBA.

## v11 pass — exposure recompute + break handlers decompiled and ported
- tv_layerrecomputeexposure handler @ 0x140412f40 (George table @ 0x140a5fca0):
  parses N double args → int array (DAT_140cf4a80) + double array (DAT_140cf4b00).
  Dispatches to FUN_1400dd1a0 (count<1, recompute from current frame) or
  FUN_1400dcf50 (count>=1, recompute with frame+count+value). Layer types 2/5 only.
  Core: FUN_1404aa960 (set exposure range) + FUN_1404aac70 (set with value).
- tv_exposurebreak handler @ 0x14040dc50 (George table @ 0x140a5ff70):
  parses 1 double (target frame), gets current/end frame, splits exposure at target.
  Split = FUN_1404a5e60: find exposure at frame, copy next exposure's data into
  current, mark current deleted → effectively splits one exposure into two.
- tv_exposureinfo printer @ 0x14040ddc0: "Exposure %d %d" (cell index, exposure).
- Ported: recomputeExposure() + breakExposure() in engine.js, exposed as
  George.tv_layerrecomputeexposure / George.tv_exposurebreak. 23/23 tests pass.

## Known approximations (to refine with the composed-style extraction pass)
- Red band segment and exact band color semantics, R/T room switch layout per room,
- the `12` black badge exact styling, DnD image popup behavior.

## v11 pass — layer length / playback identifiers located in the shipped binary (offline PE pass)

The MCP `rea.*` tools were unavailable in the resumed session, and CLI Ghidra re-imports of the
14 MB binary cost 15-30 min per query. Built an offline pass instead (tools/pe-xref.js,
pe-func.js, pe-disasm.js) and verified it against known addresses: `tv_exposureinfo` ->
0x140a62268, `Exposure %d %d` -> 0x140a5e8c8, `LayerPanel-TimelineNotesHeight` ->
0x140a717e0 (reproduces the previously banked values exactly).

### Dialog labels are not in the executable
`Increase Layer Length`, `Add Empty Instances`, `Add Empty Exposures` occur **zero** times as
ASCII or UTF-16 in the .exe (exhaustive Buffer scan). The visible labels come from the Qt
translation/resource layer; only the internal tokens are in the binary. So porting the *behaviour*
from tokens + the user's screenshots is the correct route, not string matching.

### Real internal mode tokens (UTF-16 unless noted)
- `timestretch`  @0x140a5e958   ("Stretch" = time-stretch the layer)
- `stretchlayer` @0x140a3a1c2
- `pingpong`     @0x140a5e988 (UTF-16) and @0x140a5ea48 (ASCII, in the same block as `hold`/`repeat`)
- ASCII block @0x140a5d600: `... pingpong | hold | repeat | hold ...` — the value table for the
  layer end-behaviour / length mode enums.
- `_autostretchlayer` @0x140a3a1b8 and `_autobreakinstance` @0x140a3a1e0 — layer-preset keys
  (the "Add Empty Instances"/auto options family).
- Related tokens in the same tables: `end`, `cut`, `last`, `exposure`, `fast`,
  `direction`, `timestretch`.

### Code sites (verified RIP-relative lea xrefs, function bounds from .pdata)
- 0x140412a80..0x140412cd7 — option getter; sentinel strings `"-1"` @0x140a412cc and `"-2"`
  @0x140a5c72c; dispatches on a mode field at `+0x70` (0/1/2 -> pingpong/hold/repeat paths).
- 0x140412ce0..0x140412f37 — twin setter (same size 599 B, mirrors the getter).
- 0x140413ab0..0x140413de4 — exposure accessor reading `DAT_140cf4a80` (the same array used by the
  `Exposure %d %d` printer) and comparing `timestretch` @0x140413c9d.
- 0x140414170..0x140414513 — the matching writer, `timestretch` @0x140414244.
- 0x1400a88d0..0x1400a912c — layer-preset handler using `_autostretchlayer`/`_autobreakinstance`.

### Ported / confirmed in my-version
- Playback popup: `✓ None | Loop | Ping-Pong | Hold` (checked current item), values `None/Loop/
  Ping-Pong/Hold`; `Ping-Pong`/`Hold` resolve cells past the layer end from the layer timeline.
- Increase Layer Length: radio modes Stretch / Interpolate(disabled) / Repeat / Hold + optional
  Add Empty Instances / Add Empty Exposures + Apply/Cancel; the drag count prefills the dialog and
  Cancel discards. Verified live: exposure 4 -> 7 (Stretch, +3), Cancel unchanged.

## v12 pass — FOUND THE OFFICIAL STRING TABLE: Resources\data\english.tvpaint.loc
The visible UI labels are NOT compiled into the .exe (confirmed: zero ASCII/UTF-16 hits for
"Increase Layer Length"). They ship as a text localization table:

  C:\Program Files\TVPaint Developpement\TVPaint Animation 12 Pro Demo\Resources\data\english.tvpaint.loc

Format: `$<id> "text"` with `\n` escapes. This is the exact, authoritative UI wording.

### Increase / Decrease Layer Length (IDs 0x000025550..0x000025588)
- 25550 Increase Layer Length / 25551 Decrease Layer Length
- 25560 Interpolate / 25561 Stretch / 25562 Repeat
- 25563 Add Empty Instances / 25564 Shrink / 25565 Cut Images
- 25566 Add Empty Exposures / 25567 Apply / 25568 Cancel
- 25570 Loop / 25571 Ping Pong / 25572 Hold / 25573 Exposure  (repeat-mode list #1)
- 25575..25578 the same four again (second list)
- Tooltips: 25580 Interpolate ("...will try to stretch the layer to the new length, creating new
  frames where needed..."), 25581 Stretch, 25582 "Repeat modes", 25583 Hold ("repeats the last image
  to the end of the stretch"), 25584 "Add Empty Images / Adds blank frames", 25585 Cut Images,
  25586 Apply, 25587 Cancel, 25588 Add Empty Exposures ("a popup panel will ask you the number of
  exposures").

### Layer playback / repeat menus elsewhere
- 28473..28476 Repeat Images / Repeat / Ping-Pong / Random
- 86270..86273 Repeat Images / Loop / Ping-Pong / Random

### Ported (a1b72ee)
- Dialog now uses those exact strings + tooltips, ordered Interpolate(disabled) / Stretch / Repeat,
  repeat-mode dropdown Loop|Ping Pong|Hold|Exposure, Add Empty Instances, Add Empty Exposures,
  Apply, Cancel; Decrease variant with Shrink / Cut Images.
- engine layerLengthOp: repeat modes loop / ping pong / hold / exposure; shrink + cut for decrease.
- Verified live: Repeat+Ping Pong on [A,A,B,B] +3 frames -> cells 5,6,7 = A,A,B (bounce);
  Cut Images on total 9 by 2 -> 7.

### How to use this next
Grep the .loc for any label to get the exact wording/ID, and the ID ordering groups related
controls (e.g. 255xx = layer length family). Remaining: "None" first item of the playback popup is
not in the 25570..25573 block (those are Loop/Ping Pong/Hold/Exposure) — locate its ID by searching
the loc file around the layer-status group before changing the popup text.

### Layer playback control — exact IDs found
In the same .loc table (line ~9635):
- 25127 "Change to preloaded layer"
- **25128 "Loop Mode"**, 25129 None, 25130 Loop, 25131 Ping-Pong, 25132 Hold  <-- the control beside a layer
- 25140 None / 25141 Loop / 25142 Ping Pong / 25143 Hold (alternate spelling group)
Our popup already used exactly None / Loop / Ping-Pong / Hold; the control title is now "Loop Mode"
(25128). This confirms the user's screenshot 4 is the Loop Mode menu.

## v12 pass - live timeline gestures, auto toggles, delete modes (2026-10-20)

Reference app: installed TVPaint Animation 12 Pro Demo, 1936x1048 canvas area, 40 px/frame,
Anim_3 row y=845..905, key starts at frames 1 / 3 / 5 with exposures 2 / 2 / 3.

### Per-image handles (live)
- **End square (bottom-right of an instance), drag +1 frame**: key 1 exposure 2 -> 3,
  key 2 moved 3 -> 4, key 3 moved 5 -> 6; Project/Clip grew [1,7] -> [1,8].
  Drag -1 frame: key 1 3 -> 2, key 2 4 -> 3, key 3 6 -> 5; Project/Clip shrank to [1,7].
  So the end square changes that exposure and ripples every later instance.
- **Start square (top-left of instance 2), drag +1 frame**: key 1 exposure 2 -> 3,
  key 2 exposure 2 -> 1, key 3 stayed at frame 5; total layer length stayed 7.
  Later keys do not move and the layer length does not change.
- **Vertical bar past the layer end**: separate from the last end square; opens the
  Increase/Decrease Layer Length dialog (Stretch / Repeat / Hold etc.).
- The exposure count badge sits immediately before the bottom-right end square.

### Horizontal cell drag (live)
- Dragging key 2 from frame 3 to frame 4 moved every key +1 ([1,3,5] -> [2,4,6]),
  Project/Clip [1,7] -> [1,8], and the playhead followed the dragged cell.
- Dragging back restored [1,3,5] / [1,7].
- Ctrl+drag still slid the layer in the live app; vertical drag to the layer above did
  nothing. Modifier-based Move/Copy/Insert drag was not reproduced by the app.

### Auto Break Instance / Auto Create Frame (live)
- Per-layer toggles in the layer row. Tooltips exactly:
  `Toggle auto break instance.` and `Toggle auto create frame.`
- ON uses the shipped `LayerAutoBreakOn-x20.png` / `LayerAutoCreateOn-x20.png` icons;
  OFF uses `LayerAutoBreakOff-x20.png` / `LayerAutoCreateOff-x20.png` (dot glyph).
- Drawing on a held frame with auto break ON copies the image, splits the exposure,
  and shifts later **image indices** but not their frame numbers; the stroke only
  changes the copy. Undo once removes the stroke, undo again removes the break.
- Drawing on the last held frame creates a new 1-frame image at that frame; total
  length stays the same. Auto break takes precedence over auto create.
- Drawing on an empty cell with auto create ON creates a new 1-frame image at the
  playhead; undo twice removes the frame.
- Turning auto create OFF blocks drawing in an empty cell (no history entry).
  Turning auto break OFF draws directly on the held image (one undo step).

### Delete from Layer (captured submenu, live Keep empty)
Captured order and exact labels:
1. `Stay put`
2. `Keep empty`
3. `Fill gap from left`
4. `Fill gap from right`

- Live `Keep empty` on key 2 of [1,2][3,4][5,7]: frames 3-4 became empty, key 3 stayed
  at frame 5, layer/project length stayed 7. This is the verified anchor.
- Implemented semantics:
  - `stay`: remove the image and leave the followed cells empty; a trailing gap is
    closed (layer length follows the previous image).
  - `keep`: same gap, but a trailing empty range is preserved (`emptyEnd`).
  - `fill-left`: extend the previous image over the removed exposure.
  - `fill-right`: move the next image back over the removed exposure, keeping its
    total time and every later key in place.
- The layer remembers the last chosen mode; default is `Stay put`.

### Exact cell menu tree (captured top level)
`Exposure >`, `Insert Images >`, `Delete from Layer >`,
`Delete from Project` (Shift F5, red), separator, `Repeat Images >`, separator,
`Rename >`, `Image Marks >`, separator, `Select All` (Ctrl A),
`Select Image from Key` (/, gray at a key start), separator, `Split`,
separator, `Cut Image` (Ctrl X), `Copy Image` (Ctrl C), separator,
`Reverse Selected Images`, separator, `Role >`, separator,
`Define Loop Limits` (gray when no images are selected).

- `Select Image from Key` is gray on a key start (right-clicked key 2 with the
  playhead at image 3). The prototype enables it on a hold, selects the held image
  at its key start and moves the playhead there. The loc calls the related George
  command `$000020086 "Layer: Select Image From Keyframes"`, which is why this is
  treated as a selection command rather than plain navigation; the live hold state
  was not captured.
- `Cut Image`, `Copy Image` and `Reverse Selected Images` are gray with no image
  selection. The singular labels are loc `$000028608 "Cut Image"` and
  `$000028609 "Copy Image"`; the loc also contains the plural
  `$000028606 "Cut Selected Images"` and `$000028607 "Copy Selected Images"`.
  The prototype keeps the captured singular labels with no selection and switches
  to the plural labels when `proj.imageSel` is non-empty. Only the gray
  no-selection state was captured live.
- `Define Loop Limits` is gray with no image selection. The prototype enables it
  after `Select All` and opens the loop-limits dialog.
- `Split` is **enabled at a key start**, so it is not Break Instance (which is
  gray there). The prototype maps it to splitting the layer at the clicked frame.
  Live verification of the resulting layer order is still pending.
- The Delete from Layer submenu uses paired direction arrows, not checkmarks:
  `> Stay put <`, `< Keep empty >`, `> Fill gap from left >`,
  `< Fill gap from right <`. The active mode is white; inactive modes are gray
  but still selectable.

Exposure submenu: `Break Instance`, `Remove exposures`, separator,
`Set Exposure Value...`.
- In the captured menu (keys 1/3/5, exposures 2/2/3, no gaps), `Break Instance`
  and `Remove exposures` are gray, while `Set Exposure Value...` is enabled.
  This indicates `Remove exposures` removes empty exposures (gaps), not held
  exposure counts; the prototype now implements that and disables it on a
  gap-free layer.

Insert Images submenu: `Insert Images (after)`, `Insert Images (before)`,
`Duplicate Images...`.

Repeat Images submenu (captured):
`Set the Repeat Images Value...`, separator, `Reset`, separator, `Loop` (checked),
`Ping-Pong`, `Random`.

Image Marks submenu (captured):
`Set Mark`, `Clear Mark` (gray with no mark), separator,
`Go to Previous Image Mark`, `Go to Next Image Mark`, `Remove All Image Marks`.

Rename: selecting an instance opened the live dialog titled `Instance Name`,
with an empty text field and OK / Cancel buttons.

### Image selection and multi-image clipboard (v13 pass)
- Command registration found in `FUN_1405dde70` (`0x1405dde70`, ~16 KB handler
  table builder): `LayerSelectAll`, `LayerSelectAllActive`, `LayerSelectAllEmpty`,
  `LayerSelectAllInactive`, `LayerSelectAllImage`, `LayerSelectAllKey`,
  `LayerSelectCurrentFrame`, and `LayerSelectImageFromKeys` (command slot
  `0x4e76` / 20086). The display string for 20086 is loc
  `$000020086 "Layer: Select Image From Keyframes"`; `$000028605` is
  `"Select All Images"`.
- Local model: `proj.imageSel = { layerId, keys }`. Selection is per layer and
  survives a right-click on the same layer; a plain cell click clears it, so the
  captured gray Cut/Copy/Reverse state is still the no-selection state.
- Inferred gesture (not captured live): Shift-click extends a contiguous key
  range from the last anchor, Ctrl-click toggles one key, and `Ctrl A` / `Select
  All` selects every key on the current layer. Selected images highlight every
  cell covered by their exposure, not just the key cell.
- Multi-image clipboard: `Cut Selected Images` / `Copy Selected Images` capture
  all selected frame objects (exposure, role, instance name and canvas). Cut
  deletes keys right-to-left inside a single `tvCommit`, so earlier keys remain
  addressable and the whole cut is one undo step. Paste writes the images
  consecutively at the first empty cell (or after the layer end when the clip
  would overlap a later key).
- `Reverse Selected Images` now calls `Engine.reverseSelectedImages(layer, keys)`:
  it swaps only the selected frame objects, leaving unselected keys in place;
  exposures, roles and names travel with the drawings.
- Tests: 38 pass, including selected-key reversal, multi-key cut ordering and
  the previously banked exposure/delete/slide/history cases.

### v14 pass - timeline zoom ratio, Fit popup, time code (loc driven)
- The shipped `english.tvpaint.loc` carries the whole timeline command family
  that the prototype was missing:
  - `$000025330` "Fit popup\nAllows user to fit the clip to the timeline window.\nAlso allows for fitting to keys and selections."
  - `$000025331` "Interactive Zoom Ratio\nClick and drag on this icon to interactively\nchange the zoom level on the timeline."
  - `$000025317` "Display number/Time Code\n\nClick here to switch display between number of fields or frames and Time Code."
  - Fit popup entries `$000025001` "Fit to Clip", `$000025002` "Fit to Layer",
    `$000025003` "Fit to Selection", `$000025004` "Fit to Frames", `$000025005`
    "Fit to Keys", `$000025006` "Fit to Sound", `$000025007` "Fit to View All",
    `$000025008` "Fit to Exposures", plus `$012102323` "Fit to Mark In-Mark Out".
  - Command names: `$000020132` "Timeline: Zoom In", `$000020133` "Timeline: Zoom
    Out", `$000020910`..`$000020913` "Timeline: Fit To Clip / Selection / Layer /
    Keyframes", `$000020920` "Timeline: Fit To Sound", `$000020922` "Timeline: Fit
    To Frame", `$951920922` "Timeline: Fit To Exposure Handle", `$000020125`
    "Timeline: Expand / Collapse Current Layer", `$000020112` "Timeline: Toggle
    Frames/Time Code", `$012104118`/`$012104119` role visibility on the timeline
    and on the current layer only.
- The interactive zoom ratio icon ships with the app:
  `Resources/icons/LayerZoomRatio-x20.png` (a magnifier with a horizontal
  double arrow). The prototype uses that exact asset in the timeline footer and
  drags the frame width with it; `Fit` sits next to it.
- Implementation: the frame width is a runtime value (`CW`) exposed to the CSS
  as `--cw` on `#tlTrack`, so cells, ruler ticks, exposure bars, the exposure
  badges, the current-image column and the thumbnails all follow the zoom. Every
  timeline gesture (exposure end-handle ripple, start-handle trim, cell slide,
  selection, layer-end bar) divides by the same live value, so they stay
  frame-accurate at any zoom - verified at 40 px, 59 px, 64 px and 80 px.
- Fit entries compute the width that makes the requested frame range fill the
  track and centre the playhead there. `Fit to Sound` is disabled (no sound in
  the prototype).
- Time code: `frameTimeCode()` formats `HH:MM:SS:FF` from the project frame
  rate with frame 1 at `00:00:00:00`; the ruler shows it when the switch is on
  and the cells are wide enough to read it.
- Scrubbing, from loc 25320 "Timeline: Left clicking and dragging in this area
  will scrub the clip. A clip can only be scrubbed to the end of the selected
  layer. A single left click in this area jumps to that frame.": dragging either
  ruler scrubs the playhead and is clamped to the end of the selected layer
  (verified live-prototype: a click at frame 12 on a layer that ends at frame 7
  lands on frame 7, a drag from frame 6 back to frame 2 lands on frame 2), while
  a single click on a ruler number jumps straight to that frame. The transport
  bar under the canvas scrubs the whole clip.
- The live app's own ruler context menu was never captured (the automation was
  flaky around the cell strip), so the menu is labelled from the loc strings
  rather than from a screenshot.

### v15 pass - Add Exposure / Delete Image / layer order (live + decompiled)
Live session in the TVPaint 12 Pro Demo (test document, layer `Anim_2` and
`Anim_3`):

- **Backspace on an empty cell creates a new animation cell.** The playhead was
  on frame 25, an empty cell of `Anim_2` (the layer ran `[1, 12 (12)]`).
  Pressing Backspace produced a new empty (checkerboard) instance at frame 25
  with the exposure badge `1` and the layer became `[1, 25 (25)]`. Pressing
  Backspace again on that cell changed nothing - a frame that already starts an
  instance is left alone.
- **Backspace inside a hold splits the exposure.** The playhead was on frame 10,
  which was the second frame of the exposure `9..11` of `Anim_3`. After
  Backspace a new *empty* instance `4.` appeared at frame 10, the earlier part
  of the hold kept the drawing and the new instance took the remaining frames
  (badge `2`), and the instance numbering shifted (`4.` -> `5.`).
- **Delete removes the drawing of the current frame.** With the new instance at
  frame 25 selected, `Delete` removed it and the layer went back to
  `[1, 24 (24)]`.
- The timeline tooltip was captured live and matches loc 25320: *"Timeline -
  Left clicking and dragging in this area will scrub the clip. A clip can only
  be scrubbed to the end of the selected layer. A single left click in this area
  jumps to that frame."*
- Re-verified: a horizontal drag on a cell thumbnail slides the **whole layer**
  (keys `1`/`12` of `Anim_2` became `5`/`16`, the layer end `24` -> `28`).
- The live document used for these tests is a scratch document; it was already
  modified by earlier automation and is not a reference artwork.

Decompiled (REA, `TVPaint Animation 12 Pro Demo.exe`):
- `tv_exposureadd` handler at `0x14040dbe0` (George table entry
  `0x140a5ff80`): parses two arguments, then calls
  `FUN_1400d4460(currentLayer, frame, count)` and refreshes the UI - it only
  runs when the current layer type is `6` (animation layer). The UI count
  default lives in `DAT_140cf4a84` (zero in the file image, set at runtime).
- `LayerMoveUp` / `LayerMoveDown` are registered in the command table builder
  `FUN_1405dde70` with command ids `0x4ed4` / `0x4ed5` (= loc 20180 / 20181,
  "Layer: Move Layer Up" / "Move Layer Down"). `LayerMoveUp` jumps to
  `FUN_1407aaa60`, which finds the layer in the layer array, swaps it with its
  neighbour (`FUN_140690520(layer, other, 1)`) and then fixes the current-layer
  pointer - a pure swap of two neighbours, which is what the prototype's
  `moveLayerBy` does.
- The v12 layer `Move` submenu is loc `011025178`..`011025184`: `Move Selected
  Layers`, `Up`, `Down`, `Bring Selected Layers Together`, `Reverse All Layer
  Order`, `Reverse Selected Layer Order`. The prototype's Move submenu was
  rebuilt with exactly these entries; the previous entries (`Go to Image`,
  `Slide Layer`, `Slide Layer to Image`) live in the older 25167..25169 string
  family and were moved to the top `Layer` menu.
- loc `011021204` / `011021205` document the drag-and-drop preference: *"Pop-up
  for drag and dropping images - Sets the behavior when drag and dropping
  images in the timeline. If checked, a pop-up will appear ... and you will be
  able to choose between Move, Copy and Insert. If unchecked, you will need to
  hold Ctrl to copy images and Shift to insert images. If no key is held, images
  will be moved."* The Move/Copy/Insert image drag itself was **not** reproduced
  live (the automation kept landing on the scrub area), so it is still listed
  as unknown; the prototype only implements the layer-row drag and drop that
  was requested and matches the "Move Selected Layers" command.

### Image drag and drop (loc driven, not reproduced live)
- The shipped preference text (loc `011021204` / `011021205`) is the only
  description of the gesture: *"Pop-up for drag and dropping images - Sets the
  behavior when drag and dropping images in the timeline. If checked, a pop-up
  will appear when drag and dropping images and you will be able to choose
  between Move, Copy and Insert. If unchecked, you will need to hold Ctrl to
  copy images and Shift to insert images. If no key is held, images will be
  moved."*
- The prototype implements the modifier variant on a **cross layer** drag (the
  live automation kept landing in the scrub strip, so the cross layer drag
  itself could not be triggered in the app):
  - plain drag -> the drawing is *moved* into the target layer at the hovered
    frame (its exposure, role and instance name travel with it),
  - Ctrl -> the drawing is *copied* (the source keeps it),
  - Shift -> the drawing is *inserted* and the target layer's later images are
    pushed right by its exposure.
  A horizontal drag inside one layer keeps sliding the whole layer, which is
  what the live app does (verified again in this session: `Anim_2` keys `1`
  and `12` became `5` and `16` and the layer end grew from 24 to 28).
- `Modify > Flip Horizontally / Flip Vertically / Flip Horizontally &
  Vertically` (loc 28612..28614) mirrors the drawing of the current image.

### Camera keyframe menu (captured live)
Right clicking the camera row of the live timeline opens a menu that was never
captured before:

```
Create keyframe          >
Delete keyframe          >
-------------------------
Adjust the layer to the animation
-------------------------
Cut keyframe             (gray)
Copy keyframe            (gray)
Paste keyframe           (gray)
-------------------------
Invert all keys
```

Both submenus (`Create keyframe` and `Delete keyframe`) contain exactly:
`All`, separator, `Position`, `Rotation`, `Zoom`, `Camera size`,
`Movement Type`. The camera row itself is always the first row of the TVPaint
timeline (it was only shown in the prototype when camera keys existed), and the
live row shows the yellow `+` keyframe marks. `Invert all keys` is documented
in loc 009582200: *"Invert: invert the path of the camera"* - the prototype
reverses the camera key values along the path.

### v16 pass - the camera project (live New Project dialog + decompiled camera commands)
Live session (the app crashed at the end of it and restarted, so the projects
had to be re-created; the captures below were taken before that).

- **`File > New Project...` (Shift N)** opens a dialog with two tabs:
  - `Project`: *Project Size* (`HDTV HD 1080p`), *Ratio* (100.00% x 100.00%),
    *Drawing Area* (1920 x 1080), *Frame Rate* 24.000, *DPI Resolution* 72,
    Width 677.33 mm / Height 381.00 mm, *Load Library File*, `New Project`.
  - `Project with Camera`: the same fields but the first block is
    **Camera View (Final Output)** (1920 x 1080), the *Ratio* becomes
    **200.00% x 200.00%** and the *Drawing Area* becomes **3840 x 2160** - the
    camera view is a 200% crop of a twice as large drawing area.
- A **normal project** has no camera row in the timeline and no camera row in
  the layer list. A **camera project** adds:
  - a `Camera Layer` row (camera icon, collapse arrow, clip icon, the name, a
    `⊘` button) and a `Speed curve` row above the layer list,
  - a **camera row** at the top of the timeline: the camera key frames are
    marked with a **green bar in both rulers**, the key cell carries a green
    square and the current frame shows a yellow `+` (add camera key).
  - the tool panel switches to `Tool : Camera[Pro]` with: `Command` (dropdown),
    `Lock All`, `See bookmarks`, `Toggle all`, `Mode` (**Linear**), `Motion Blur`
    0.00%, `X` / `Y` (each with its own padlock), `Modify ratio`, `Rotation`
    0.00 deg, `Zoom` 100.00, `Flip X`, `Flip Y` and a `Parameters ...` button.
  - the canvas shows the **camera frame**: the blue rectangle
    (`COLORSchemes` `mcameraprofile` = 128,128,255) with the square corner
    handles and the centre cross with its horizontal line.
- **Adding a camera to a normal project**: picking the `Camera` tool in the
  Main Panel (the movie camera shape, tooltip "Camera") adds the camera to the
  current project - the `Camera Layer` and `Speed curve` rows appear, the
  camera row appears in the timeline and the tool panel becomes
  `Tool : Camera[Pro]`. The drawing area keeps its size; the camera view is
  then the drawing area itself.
- Dragging the camera cross in the canvas moves the camera (the tool panel X/Y
  follow). With a single camera key the drag modifies that key.

Decompiled (REA, `TVPaint Animation 12 Pro Demo.exe`): the whole camera command
family exists - `tv_cameraenumpoints`, `tv_camerainterpolation`,
`tv_camerainsertpoint`, `tv_cameraremovepoint`, `tv_camerasetpoint`,
`tv_camerainfo`, `tv_camerapath`, **`tv_cameramakelayerfitanim`** (the
"Adjust the layer to the animation" command), `tv_cameraaddcurvepoint`,
`tv_camerasetcurvepoint`, `tv_camerasetcurvetype`, `tv_cameraremovecurvepoint`
and `tv_camerainfoframe`.
- The camera state lives in the application object at `+0x2f0`: the key point
  vector at `+0x2f8`, the interpolation mode at `+0x308`, the curve point vector
  at `+0x328` and the curve type at `+0x338`.
- `tv_camerainfoframe` (`0x1403f1360`) evaluates the camera at a frame: it
  normalises the frame inside the **camera layer's range**
  (`(frame - start) / (end - start)`) and then evaluates the path at that
  ratio. It answers `No camera Layer` or `Given frame out of camera layer's
  range` when the frame is outside the camera layer. The result is printed as
  `x y zoom rotation ...` with the zoom in percent.
- `tv_camerainterpolation` (`0x1403f17b0`) prints the same six values for the
  current camera state, `tv_cameramakelayerfitanim` (`0x1403f1950`) calls
  `FUN_1401d3510(app + 0x2f0)` - the layer fit operation.

Prototype: the camera row is drawn only when the project has a camera, the
`Camera Layer` and `Speed curve` rows are shown in the layer list, the camera
key frames are marked in both rulers and in the camera row, the `+` on the
camera row creates a camera key at that frame, the camera frame is drawn on the
canvas and dragging it moves the camera key of the current frame.

### v17 pass - the camera row and the New Project dialog, pixel by pixel
Live captures (TVPaint 12.1.0 Pro Demo, a fresh "Project with Camera"):

- **The camera row is a thin strip** (about 20 px, half the height of a layer
  row) that sits between the top ruler and the layer rows. Every camera key is
  drawn as a **thin `+` glyph** centred in its cell - the glyph of the key on
  the current image is **yellow**, the others are **grey/white**. The keys are
  framed by a thin rectangle that spans the camera layer's range, and the row
  carries the same `⊘` layer type / layer end symbols as a normal layer row.
- **The `+` of a camera key can be dragged with the left mouse button**: a drag
  from frame 1 to frame 5 moved the camera key to frame 5 (the glyph followed
  the pointer and the camera layer range became `[1, 8 (8)]`).
- The **New Project** dialog was captured field by field:
  - `Template:` `[None ▾]` `[Remove]`
  - tabs `Project` / `Project with Camera`
  - `Project` tab: *Project Size* `[HDTV HD 1080p ▾]`, *Width* 1920 /
    *Height* 1080, *Ratio* 100.00% / 100.00% (greyed out), *Drawing Area*
    1920 / 1080, *Frame Rate* 24.000, *DPI Resolution* 72 with Width 677.33 /
    Height 381.00 **mm**, *Load Library File* `[Browse]`, `[New Project]`.
  - `Project with Camera` tab: the first block becomes *Camera View (Final
    Output)* 1920 / 1080, the *Ratio* becomes **200.00% / 200.00%** and the
    *Drawing Area* becomes **3840 / 2160** - the ratio is
    *drawing area / camera view*.
- The camera tool panel of the live app (`Tool : Camera[Pro]`): `Command`
  (dropdown), `Lock All`, `See bookmarks`, `Toggle all` (wrench), `Mode`
  (**Linear**), `Motion Blur` 0.00 %, `X` 1920.0 and `Y` 1080.0 (each with its
  own padlock), `Modify ratio`, `Rotation` 0.00 deg, `Zoom` 100.00 (padlock),
  `Flip X`, `Flip Y`, `Parameters ...`.
- The layer row's playback popup is `None / Loop / Ping-Pong / Hold`.

Prototype: the camera row is now a 20 px strip with the `+` glyphs (yellow on
the current image), the keys are framed by the range rectangle, the `+` is
draggable (`E.moveCameraKey`, a key is never written over another one), and the
New Project dialog reproduces the live layout (Template row, the two tabs, the
size block / Ratio / Drawing Area columns, the read-only ratio in the plain
tab, the 200 % ratio and the twice as large drawing area in the camera tab).

- The camera **Mode** dropdown (movement type) is `Linear` (checked) / `Spline` /
  `Bezier curve` / `Smart Spline` - the prototype implements exactly those four
  eases (linear, smooth step, ease-in-out cubic, cosine ease).
- The camera **Command** dropdown is `Invert`, separator, `Load...`, `Save...`,
  separator, `Reset`, `Reset and Fit to project` (loc 009582200: *"Invert:
  invert the path of the camera / Load: load camera settings / Save: save the
  current camera settings / Reset: reset the current camera"*). The prototype
  implements all of them: Invert reverses the camera path, Save/Load use the
  browser storage, Reset clears the camera keys, Reset and Fit to project also
  resets the camera view to the drawing area.

### v18 pass - the camera actually does something now
The earlier prototype drew the artwork *through* the camera while the overlay
drew the camera frame in drawing coordinates, so the two never matched (the
canvas showed a huge drawing next to a small frame). The live app settles it:
**the project window shows the drawing area** - the live camera project showed
the whole 3840x2160 area at 27.13 % with the 1920x1080 camera frame drawn
inside it - and `View > Camera View` is what switches to the camera view.

Implemented from the live behaviour and the decompiled commands:
- The artwork is rendered in the drawing area again and the **camera frame is
  drawn over it in red** (the live camera project), with the blue camera
  profile (corner squares + the centre cross) when the camera is being edited.
- `View > Camera View` renders the camera view itself (the camera rect fills
  the window, with the rotation, zoom and flips applied).
- `Project > Render Camera` is live: the live menu has `Render Camera >` with
  `Into a New Project` and `Into a New merged Project`; the prototype renders
  the camera view of every frame into a new project of the camera view size.
- `Adjust the layer to the animation` (George `tv_cameramakelayerfitanim` ->
  `FUN_1401d3510(app + 0x2f0)`) bakes the camera movement into the drawings:
  every layer image is offset by the camera position of its key, so the camera
  reveals the right part of the artwork (verified in the prototype: a mark at
  (1900, 1000) with a camera at (-400, 200) moves to (1500, 1200)).

### v19 pass - the camera canvas, measured against the live app
The live TVPaint camera project (drawing area 3840x2160, camera view 1920x1080,
zoom 26.76 %) was captured and the pixels sampled:

- The project window shows the **whole drawing area** (the canvas area is
  1027x578 px = the full 3840x2160 area at 26.76 %).
- The area **inside the camera view** is **RGB 255,255,255** (the paper / the
  artwork) and the area **outside the camera view** is a solid
  **RGB 126,126,126** - the camera view is the final output, everything the
  camera does not see is covered with grey.
- The **camera profile** is drawn in the camera profile colour
  (`COLORSchemes` `mcameraprofile` = 128,128,255): a rectangle with the four
  **corner squares** and a **centre square** plus a **horizontal line** from the
  centre to the right edge of the profile.
- The camera keys are joined by a dashed line with a handle dot on each key.

The prototype now does exactly that: the artwork is rendered in the drawing
area, the region outside the camera view is covered with the same grey
(`rgb(126,126,126)`, drawn with an even-odd fill so the rotated camera view
stays a hole), and the blue profile with its corner squares, centre square and
horizontal line is drawn on top - the same picture as the live app.

### v20 pass - the canvas display options (live popup + binary tokens)
The live **Display** popup of the project window was captured:

```
Show Stencil
Show Paper
Show Selection        (checked)
----------------------
Show Animator Disk    (checked)
Show Camera           (checked)
Follow Camera
----------------------
Show Timeline Notes
```

The binary carries the matching internal commands and overlay tokens:
- `ToggleShowStencil`, `ToggleShowPaper`, `ToggleShowSelection`,
  `ToggleAnimatorDisk`, `ToggleShowCamera`, `ToggleFollowCamera`,
  `TLNoteToggleHud`, `ToggleLayerAttenuation`, `ToggleReticule`
  (`0x140a3b4a8`..`0x140a3b4e8`, `0x140a71428`, `0x140a71438`,
  `0x140a76718`, `0x140a76730`)
- the overlay colours as RGBA strings next to their colour tokens:
  `64 64 64 128` (animator disk / layer attenuation), `255 255 0 255`
  (reticule), `128 128 255 255` (camera profile = `mcameraprofile`),
  `0 0 0 128` (selection) at `0x140a71460`..`0x140a71510`
- the display style ids `L@DisplayOptions-`, `Coord-`, `PicColor`,
  `PicBColor`, `COLORANIMATORDISK`, `COLORRETICULE`, `SHOWANIMATORDISK`,
  `SHOWRETICULE`

Prototype: the status bar now has the `Display ▾` popup with exactly those
seven entries and the live default states (Show Stencil off, Show Paper off,
Show Selection on, Show Animator Disk on, Show Camera on, Follow Camera off,
Show Timeline Notes off). They drive the real rendering: the paper, the
selection overlay (now `rgba(0,0,0,0.5)` like the token), the animator disc,
the camera overlay, the camera-follow mode and the notes on the canvas. With a
camera the artwork is clipped to the camera view, the rest of the drawing area
is covered with the measured `rgb(126,126,126)` and the camera view keeps its
white paper - the same picture as the live app.

### v21 pass - the canvas footer widget
The live canvas footer (bottom right of the project window) was captured and
copied item by item:

```
[⊘] [✥] [26.76%] [◄►] [−] [+] [Display ▾]
```

- the first button is the **rotate the view** control - its tooltip reads
  *"Rotate the view / Click with LMB and drag to modify view angle. / Click with
  RMB to display rotation menu"*
- the second one fits the view, then the zoom percentage field, a zoom-fit
  button, the zoom out / zoom in buttons (tooltip: *"Decrease the zoom factor /
  Zooms out on the image in the project window."*) and the `Display` combo
  (the canvas display popup captured in v20).

Prototype: the same widget row is in the canvas footer; the zoom field edits the
zoom, `−` / `+` zoom by 1.25, the fit buttons call `fitView()` and the rotate
button turns the whole canvas (artwork, overlays, camera) around the viewport
centre, with the rotation menu on the right click.

### v22 pass - reticule and layer attenuation
The binary's canvas overlay table (next to the display options tokens) also
carries:
- `ToggleReticule` (`0x140a71428`) with `COLORRETICULE` / `SHOWRETICULE` and
  the default colour `255 255 0 255` - the yellow crosshair that follows the
  pointer in the drawing area.
- `ToggleLayerAttenuation` (`0x140a71438`) with the default colour
  `64 64 64 128` - the layers that are not the current one are dimmed with a
  translucent dark grey.
- `ToggleAnimatorDisk` with `COLORANIMATORDISK` / `SHOWANIMATORDISK` and the
  same `64 64 64 128` colour for the disc ring.

Prototype: the reticule follows the pointer (View > Reticule), the layer
attenuation dims the other layers (View > Attenuate other layers) and the
animator disc is drawn in the canvas corner with the same ring colour.

### v23 pass - the camera canvas, captured with artwork (this corrected v19)
The live app was re-captured in a project that **had artwork** and a camera
added with the Camera tool:

- The whole drawing area is shown. The paper **outside the camera view** is
  covered with a solid grey (**RGB 126,126,126**, sampled) and the camera view
  keeps the **white paper** and is framed in **green (RGB 0,255,0)**, sampled on
  the border pixel.
- The **artwork is NOT clipped** to the camera view: the black strokes continue
  over the grey outside. (v19 had clipped it and painted a white camera view -
  both were wrong.)
- The camera profile is drawn in the camera colour `128,128,255` with the four
  corner squares, the centre square and the horizontal line, and the camera
  centre is marked with a small red circle.

Prototype fixed accordingly: the grey cover keeps the paper visible only inside
the camera view, the artwork is drawn over the whole drawing area, the camera
view is framed in green, the paper is always drawn again (the `Show Paper`
default was flipped back on - the live default is off but the live app still
shows the white paper) and the animator disk is no longer drawn on the canvas
(the live app does not draw it there either).

Zoom in/out now zoom **around the centre of the project window** (the live
"Decrease the zoom factor / Zooms out on the image in the project window"
button keeps the image centred while the percentage changes).

### v24 pass - the project canvas measured pixel by pixel (this corrects v19 and v23)
The live app was driven again on the same project (`Untitled_(3)`, drawing area
**3840x2160**, camera = **1920x1080** because the user set
`Config/CameraMultiplierWidth = 2`) and every value below is a **sampled pixel**
from a screenshot of `TVPaint Animation 12.1.0 Pro Demo`, not an inference.

**The camera does not touch the artwork.** A/B of the same stroke row
(`y = 350`) with the camera on and off:

| camera | viewport | paper | stroke edge samples |
|---|---|---|---|
| off | `45,45,50` | `255,255,255` | `229 179 128 78 27 0 12 60 112 164 217 255` |
| on  | `22,22,24` | `126,126,126` | `113 88 63 38 13 0 5 29 55 81 107 126` |

The stroke pixels are at **exactly the same screen positions** in both states
(the stroke is not scaled, cropped or moved) and every value is the camera-off
value **times 126/255 with the fraction truncated**:
`229*126/255 = 113.15 -> 113`, `78*126/255 = 38.5 -> 38`, `12*126/255 = 5.9 -> 5`.
So TVPaint **dims the whole project view to 126/255** and keeps the camera's
field of view at full brightness.  The camera is an *overlay*, not a render
transform - which is exactly what the user said ("the camera don't effect the
canvas itself").  v19 (clipped artwork) and v23 (a solid grey cover painted
under the artwork) were both wrong.

**Geometry of the camera overlay** (20 % zoom, 3840x2160 drawing area):
- drawing area on screen: `x 671..1438`, `y 190..621` (768x432 px = 20 %)
- camera field of view: `x 863..1247`, `y 298..514` (384x216 px = 1920x1080)
- it is **exactly centred** in the drawing area (192/191 px and 108/107 px of
  margin) and the camera colour line `128,128,255` is **1 px** wide
- the camera centre carries a small **plus sign** in the same colour, **20
  canvas pixels** long (measured 241 screen px at 1200 % zoom = 20 canvas px,
  21 screen px at 100 % = 21 canvas px, 1 px at 5 %)
- there is **no green frame, no corner squares and no key path** on the canvas

**Colours**
- project view background: **`45,45,50`** (`#2d2d32`) - not `#313136`
- paper / project background: `255,255,255`
- camera colour: `128,128,255` (the binary token `128 128 255 255`)
- camera dim: black at `129/255` (everything becomes `x*126/255`)

**The zoom ladder** (canvas footer `+` / `-` buttons, captured from 1 % to
10000 %): 1 2 2.5 3.33 5 6.67 10 12.5 16.67 20 25 33.33 50 75 100 150 200 300
400 500 600 700 800 900 1000 1200 1400 1600 1800 2000 3000 4000 5000 10000 %.
The exact fractions are `1/100 1/50 1/40 1/30 1/20 1/15 1/10 1/8 1/6 1/5 1/4 1/3
1/2 3/4 1 3/2 2 3 4 5 6 7 8 9 10 12 14 16 18 20 30 40 50 100`.

**Fit** fits the **drawing area** and snaps to that ladder: the 3840x2160 area
in the 1670x506 project window fitted at **20 %** (the next ladder value, 25 %,
would need 540 px of height and does not fit).

**The zoom anchor is the centre of the drawing area**, not the centre of the
window: the drawing area's centre stayed at `x = 1054.5, y = 405.5` for every
zoom from 1 % to 1200 %.

**`Show Paper` does not touch the paper.** The live `Display` popup has
`Show Stencil / Show Paper / Show Selection / Show Animator Disk / Show
Camera / Follow Camera / Show Timeline Notes`; toggling `Show Paper` on left
the canvas **unchanged** (`126,126,126` outside the camera, `255,255,255`
inside) because TVPaint's paper is an *image*, and this project has none.  The
white area is the project's **Background** colour, not the paper.

**Toggling `Show Camera` off** removes the dim *and* the blue frame and the
centre plus: the drawing area becomes plain white paper again
(`255,255,255` everywhere, viewport `45,45,50`).

Prototype now: the project view is `#2d2d32`, the drawing area keeps the
project background, the camera is drawn as an overlay (dim `126/255` over the
whole view, the field of view punched back to full brightness, a 1 px
`128,128,255` frame and a 20 canvas pixel centre plus), the artwork is never
transformed by the camera, the zoom steps along the ladder, the fit snaps to
the ladder and the zoom keeps the centre of the drawing area fixed.

### v26 pass - the camera, decompiled and re-implemented channel by channel

**The live Camera[Pro] tool panel** (captured on TVPaint Animation 12.1.0 with the
Camera tool selected) is exactly:

```
Tool : Camera[Pro]
  Command            (dropdown)
  Lock All           [checkbox]
  Time Profile       (button)
  See bookmarks      [checkbox]
  Toggle all         (button)
  Mode               Linear | Spline | Bezier curve | Smart Spline
  Motion Blur        0.00 %
  X            [lock]  1920.0
  Y            [lock]  1080.0
  Modify ratio [ ]
  Rotation    [lock]   0.00 degrees
  Zoom        [lock] 100.00
  Flip X      [ ]
  Flip Y      [ ]
  Parameters ...
```
The `Command` dropdown holds **Invert / Load... / Save... / Reset / Reset and
Fit to project** and the `Mode` dropdown holds **Linear / Spline / Bezier curve
/ Smart Spline**.

TVPaint's own localisation file gives the semantics of every control
(`english.tvpaint.loc`):
- `009582205` "Lock all the Camera parameters. With this option checked, it is
  no more possible to change the camera parameters."
- `009582225` "X value of the current position", `009582226` "Y value of the
  current position", `009582227` "Current angle of the current position",
  `009582228` "Current zoom of the current position"
- `009582230` "Set the value of the Motion Blur. This option adds a 'Motion
  Blur' effect on the camera move."
- `009582260` "Lock the ratio of the camera size during its modification."
- `009582210` the **Time Profile**: "the time axis begins to the first frame
  and ends to the last frame, the position axis begins to the first key point
  and ends to the last key point of the path"
- `009582235` "Open the global camera parameters request" -> `009582150`
  "Camera parameters" with `009582255` Format, `009582265` width, `009582270`
  height, `009582275` frame rate, `009582280` pixel aspect ratio, `009582285`
  field order.

**The camera keyframe menu** (live, right click on the camera row) is exactly
`Create keyframe / Delete keyframe / Adjust the layer to the animation /
Cut keyframe / Copy keyframe / Paste keyframe (disabled) / Invert all keys`, and
the `Create keyframe` submenu is **All / [tick]Position / [tick]Rotation /
[tick]Zoom / [tick]Camera size / Movement Type** - the ticks show which channels
are keyed at that frame.

**REA - the camera has FOUR INDEPENDENT CHANNELS.**  The command table builder
`FUN_1405d30e0` registers fourteen camera commands:

| command | handler | id |
|---|---|---|
| CameraAddKey | `FUN_1405bb0d0` | 0xb76bdc |
| CameraAddPositionKey | `FUN_1405bb210` | 0xb76bdd |
| CameraAddRotationKey | `FUN_1405bb360` | 0xb76bde |
| CameraAddZoomKey | `FUN_1405bb5e0` | 0xb76bdf |
| CameraAddSizeKey | `FUN_1405bb4a0` | 0xb76be0 |
| CameraDeleteKey | `FUN_1405bb720` | 0xb76be1 |
| CameraDeletePositionKey | `FUN_1405bb8a0` | 0xb76be2 |
| CameraDeleteRotationKey | `FUN_1405bb9f0` | 0xb76be3 |
| CameraDeleteZoomKey | `FUN_1405bbc90` | 0xb76be4 |
| CameraDeleteSizeKey | `FUN_1405bbb40` | 0xb76be5 |
| CameraMoveToNextKey | `FUN_1405bbe90` | 0xb76be6 |
| CameraMoveToPreviousKey | `FUN_1405bbf00` | 0xb76be7 |
| CameraMoveToFirstKey | `FUN_1405bbde0` | 0xb76be8 |
| CameraMoveToLastKey | `FUN_1405bbe30` | 0xb76be9 |

The keyframes live in the container at `app + 0x2f0` (count `app + 0x2f8`,
array `app + 0x300`) and every keyframe is **0x380 bytes**.  The decompiled
`FUN_1405bb0d0` (CameraAddKey) writes `0xf` into the flag word at `key + 0x48`,
while `FUN_1405bb210` (AddPositionKey) calls `FUN_1401dac50` which sets **bit 1**
and `FUN_1405bb360` (AddRotationKey) calls `FUN_1401dad20` which sets **bit 2**.
`FUN_1401ea550` maps the bits: **1 = position, 2 = rotation, 4 = zoom,
8 = size**.  The four motion curves of a keyframe sit at `+0x80`, `+0x140`,
`+0x200` and `+0x2c0` (`FUN_1401ea470` clears all four), the rotation value is
at `+0x18` and the zoom value at `+0x20`.  `FUN_1401ea670` then folds the
position, the sizes and the zoom into the final camera rectangle.

So: **a keyframe only drives the channels it is keyed for**, and each channel
interpolates on its own curve - the prototype had a single keyframe with one
interpolation mode, which was wrong.

**The live camera parameters** measured on the user's project (drawing area
3840x2160, `Config/CameraMultiplierWidth = 2`): the camera panel shows
**X = 1920.0, Y = 1080.0** (the centre of the camera in the drawing area) and
the camera frame drawn on the canvas is **1920x1080** - exactly half the
drawing area, centred, which is the same rectangle the camera panel reports.

The prototype now has the four channels (`E.CAM_CH`), the fourteen commands
(`cameraAddKey` / `cameraDeleteKey` / `cameraMoveKey` / `cameraMoveKeyRelative`),
a per channel interpolation with its own mode, the **Time Profile** curve
editor (a Time x Position graph with draggable handles and presets) and the
**Camera parameters** dialog (Format / Width / Height / Frame rate / Pixel
aspect ratio / Field order).  The keyframe submenu shows the same ticks as the
live menu.

**The camera profile on the canvas.**  With the **Camera tool active** the
live app draws the whole profile in the camera colour: the 1 px frame, the
**four corner handles** (7 px squares on the frame corners), the **centre
handle** (a small square with a cross in it) and a **horizontal guide** that
runs from the centre handle to the right edge of the frame and ends in a small
triangle.  The prototype draws exactly that (and only the frame plus the centre
plus when the Camera tool is not active, which is what the live app shows).

### v27 pass - the TVPaint window layout and the top menus

**The window frame** (sampled pixel by pixel from a 1936x1048 capture of
`TVPaint Animation 12.1.0 Pro Demo`):

| row | y | background | content |
|---|---|---|---|
| document tab bar | 0..7 | dark tab strip | the MDI tabs |
| title bar | 8..30 | `244,241,249` | the OS title bar |
| **menu bar** | 31..47 | `45,45,50` | File Edit Project Clip Layer Image Effects View Windows Custom Panels Help |
| **tool bar** | 48..80 | `49,49,54` | the tool icons, the selected one on `62,71,107` |
| **panel header / info bar** | 83..107 | `49,49,54` | the panel tab, its buttons and the information bar |

The menu items start at x = 13 (File), 49 (Edit), 86 (Project), 141 (Clip),
179 (Layer), 225 (Image), 273 (Effects), 325 (View), 368 (Windows),
435 (Custom Panels), 532 (Help).  The information bar reads

```
Project: "Untitled_(3)"  Clip: "Clip_001"  20.00%  0°  Current Layer: "Anim_01"  Current Image: 1
```
in the muted blue grey `99,125,137` (`#637D89`).

**The Effects menu** (captured live, with its submenus):
- **Blur** - Cubic Blur, Gaussian Blur, |, Directional Blur, Center Blur, Radial
  Blur, Motion Blur, |, Chroma Blur, Median Blur
- **Color** - Black And White Converter, Color Replacer, Multi Color Replacer,
  Color Adjust, Curves, |, Color Desaturator
- **Distortion** - Perspective : 4 Points, Warp Grid, Optical Flow, |, Tornado, Wave
- **Keying** - Color Keyer, Cross Keyer, |, Chroma Keyer, Advanced Keyer
- **Motion** - KeyFramer, |, Multi Plane Camera
- **Rendering** - Auto Paint, |, Brush Spreading
- **Stylize** - Drop Shadow, Toon Shading
- **Transition** - Blind

**The Windows menu** (captured live): `Main` / `Color Panel` (P) / `Tools`
(Shift A) / `Timeline` / | / `Animation` / `Drawing` / `Show` / `FX Tools` /
`Others` (FX Stack, Path Recorder, Pixel Tracker, Path Manager) / | / `Plugins`
/ `Scripts`.

**The Custom Panels menu** (captured live): Animator Panel, Chalks, Correction,
Grab Tools Panel, Howard Wimshurst Brushes, Nature, Paintbrushes, Paintbrushs,
Pencils, Pens, Shading, Sketch Panel, Smudge & Spread, Timesheet, Tool Presets
Legacy, Tutorial Recorder, |, New Custom Panel, New Embedded Custom Panel, Load
a Custom Panel..., |, Open All, Hide All.

The prototype now draws the menu bar with the TVPaint background (`#2d2d32`),
the 18 px metrics, the same menus in the same order, the same submenus with
the same separators and the same ticks, the project window information bar and
the TVPaint panel header (25 px, background `#313136`, title in `#637D89`).

### v28 pass - the tool bar of the TVPaint window

The tool bar of the live app (1936 px window) is the row **y 48..80** on the
background `49,49,54`.  Its icons were located by scanning the row for the
light pixels and grouping them into boxes:

| icon | box (x) | in the prototype |
|---|---|---|
| New | 26..40 | `Toolbar-New.png` |
| Open | 48..68 | `Toolbar-Open.png` |
| Undo | 115..135 | `Toolbar-Undo.png` |
| Redo | 140..160 | `Toolbar-Redo.png` |
| Project (toolbox) | 183..201 | `Toolbar-Project.png` |
| Chromatic wheel | 207..227 | `Toolbar-ColorWheel.png` |
| Out of pegs | 232..252 | `Toolbar-Pen.png` |
| Layers | 257..277 | `Toolbar-Layers.png` |
| Bulb | 286..298 | `Toolbar-Bulb.png` |
| Table | 308..326 | `Toolbar-Table.png` |
| Remote | 337..346 | `Toolbar-Remote.png` |
| Magnifier | 384..427 | `Toolbar-Search.png` |
| Nature (plant) | 432..452 | `Toolbar-Nature.png` |
| Paper plane | 458..476 | `Toolbar-Send.png` |
| Brush + ruler | 500..516 | `Toolbar-BrushRuler.png` |
| Help (notebook) | - | `Help-x20.png` |
| PURCHASE | 539..687 | the purchase button |

The four buttons in the middle (**project, chromatic wheel, out of pegs,
layers**) share **one** selected background `62,71,107` that runs from x 183 to
x 278 - the prototype draws the same single block.

TVPaint draws these icons itself (they are not in its icon resources), so the
prototype takes the very pixels of the live app: the icon images were cut out
of a screenshot of the running program, and the four on the selected background
were de-blued (the background colour 62,71,107 became transparent).  The rest
of the icon set is the **light** variant of TVPaint's own resources
(`Resources/icons/light`, 2194 files in five sizes) - the prototype had the
dark variant, which is why the tool bar looked wrong.

The prototype now places every icon at the measured x position (verified: the
DOM offsets are within 0-3 px of the live app) and the row is 33 px high with
the `49,49,54` background.

### v29 pass - what every tool bar button really does (the tool bar source)

The tool bar is **not** a set of unrelated icons: it is a row of **panel
toggles** plus the four document commands.  REA found the builder:
**`FUN_140555d80`** creates one action per button and then binds it to the
panel with `FUN_140071450(toolbar, id, &panelState)`, so the button is lit
while its panel is open.  The same commands are used by the **Windows menu**
(**`FUN_140530e10`**, which adds each item with the checked state
`panelState != 0`) and by the command registry, which is why the tool bar and
the menu can never disagree.

The decompiled builder, verbatim in structure:

```
FUN_1406f8a70(local_res18,&DAT_140a376f1);            // the tooltip
FUN_140078610(local_res10,param_1,<id>,local_38,local_res18);   // add the action
...
uVar4 = FUN_1400468c0(L"FileNew.png");
FUN_1400710d0(param_1,10,uVar4);
uVar4 = FUN_1404950a0(0x6ebe);
FUN_140075ba0(param_1,10,uVar4,"NewProject");
```

The last part of the function assigns **every icon and command name**:

| id | icon | command | what it does | panel state |
|---|---|---|---|---|
| 10 | FileNew.png | **NewProject** | new project | - |
| 0x14 | FileOpen.png | **LoadProject** | open project | - |
| 0x2a | Undo.png | Undo | undo | - |
| 0x2b | Redo.png | **MultiRedo** | redo | - |
| 350 | Help.png | **Online Help** | the help button | - |
| 500 | MiscMainPanel.png | **ToggleMainPanel** | show / hide the Main Panel | `DAT_140cf933c` |
| 430 | ColorPicker.png | **TogglePalettePanel** | show / hide the Color Panel | `DAT_140cf9324` |
| 460 | DrawingTool.png | **ToggleToolPanel** | show / hide the Tool Panel | `DAT_140cf9320` |
| 420 | MiscLayers.png | **ToggleTimelinePanel** | show / hide the Timeline | `DAT_140cf9330` |
| 490 | Lighttable.png | **ToggleLTPanel** | show / hide the Light Table | `DAT_140cf9368` |
| 480 | FX.png | **ToggleEffectPanel** | show / hide the Effects | `DAT_140cf9364` |
| 410 | MiscNavigator.png | **ToggleNavigatorPanel** | show / hide the Navigator | `DAT_140cf9328` |
| 470 | MiscRemote.png | **ToggleRemotePanel** | show / hide the Remote control | `DAT_140cf932c` |
| 325 | LibraryImage.png | **ToggleLibraryImagePanel** | show / hide the Library | `DAT_140cf9338` |
| 320 | MiscGuideline.png | **ToggleGuidelinePanel** | show / hide the Guidelines | `DAT_140cf9334` |
| 330 | MiscShareServices.png | **ToggleShareServicesPanel** | show / hide the Share services | `DAT_140cf9370` |
| 485 | Timesheet.png | **Key_ToggleTimesheetPanel** | show / hide the Timesheet | `DAT_140cf9374` |
| 340 | SystemPopup.png | (0xa84795) | the overflow menu, only when the bar overflows | - |
| 666 | buy_now.png | - | the purchase button (only in the demo) | - |

**This also explains the live look.**  The four buttons that are lit in the
running app (x 183..278, the shared background `62,71,107`) are exactly the
four panels that are open: **Main, Color, Tools and Timeline**.  The remaining
icons in the live bar are the same buttons in a different order (the bar order
is restored from the user configuration) plus the custom panels that TVPaint
loads from `Resources/custompanels` (Nature, Chalks, ...) - those names are
not in the executable at all, which is why the plant and the film strip could
not be found in the icon resources.

The prototype now has:
- the **real** TVPaint icons for every button (the light resource set),
- a **panel registry** with the command names of the table above,
- the buttons really open and close their panel, and the blue block grows and
  shrinks over the open ones exactly like the live app,
- the **Windows menu** uses the same commands, so the menu and the tool bar
  stay in sync,
- the missing TVPaint panels were created with real content: Color Panel (the
  APen / BPen boxes), Light Table (the light table of every layer),
  Timesheet (the images of the clip), Remote Control (the transport), Navigator
  (a small view of the drawing area with the viewport rectangle), Effects (the
  effect groups), Share Services (the export list), Guidelines (the guideline
  options) and Library (the recent files).

### v30 pass - every tool bar button, identified by clicking the live app

Every button of the live tool bar was **clicked in the running program** and its
own tool tip captured, so nothing below is an inference:

| x | icon | tool tip (live) | command (REA) |
|---|---|---|---|
| 26 | page + | **New Project** | NewProject |
| 48 | folder | **Open/Import Project** | LoadProject |
| 115 | undo | **Undo the last operation** | Undo |
| 140 | redo | **Redo the last operation undone** | MultiRedo |
| 183 | toolbox | **Open/Close Main Panel** | ToggleMainPanel |
| 207 | colour wheel | **Open/Close Color panel** | TogglePalettePanel |
| 232 | hand with a pen | **Open/close Tool panel** | ToggleToolPanel |
| 257 | stacked sheets | **Open/Close Timeline** | ToggleTimelinePanel |
| 286 | light bulb | **Open/Close Light Table Panel** | ToggleLTPanel |
| 308 | table | **Open/Close the Timesheet Panel** | Key_ToggleTimesheetPanel |
| 337 | remote control | **Open/Close Remote panel** | ToggleRemotePanel |
| 384 | magnifier | **Open/Close FX Stack Panel** | ToggleEffectPanel |
| 432 | plant in a pot | **Open/Close Guidelines Panel** | ToggleGuidelinePanel |
| 458 | paper plane | **Open/Close Share Manager Panel** | ToggleShareServicesPanel |
| 500 | ? notebook | **Online Documentation** | Online Help |
| 540+ | PURCHASE | - | the demo's buy_now.png button |

What the buttons actually open, seen on screen:
- the **light bulb** floats a **Light Table** panel next to the left column
  (Color / Instance / Bin drop downs, the 10..1 value scale, a gradient bar and
  the swatches),
- the **table** docks a **Timesheet** panel at the bottom of the window
  (Page Menu, the scene / page list),
- the **remote** floats the **Remote Control** panel (the transport, the frame
  rate, Mark In / Mark Out, Flip X / Flip Y),
- the four lit buttons are the four panels that are open: **Main, Color, Tools
  and Timeline**; their shared background `62,71,107` runs from x 183 to 278.

The prototype uses exactly these tool tips, the same commands, the same icons
(taken from the running program) and the same behaviour: the button opens and
closes its panel and the shared blue block grows and shrinks over the open
ones.  The Windows menu uses the same commands, so the menu ticks follow the
tool bar.

### v31 pass - the panels float and dock like TVPaint

Every panel of TVPaint can be **docked in the left column** or **floated over
the project window**; the chevron in the panel header switches between the two
and a floating panel is dragged by its title bar.  The live app was opened and
both states were captured:

- **docked** (left column, 215 px wide, with a scroll bar): `Main Panel`,
  `Color Panel`, `Chromatic Wheel`, `Light Table`, `Remote Control`,
  `Tool : Pen Brush` - each header carries the title, a dot, the chevron and
  the cross.
- **floated**: the `Remote Control` and the `Light Table` as separate windows
  over the canvas, each with the title, a dot, the chevron and the cross in its
  own title bar.

The content of the three panels that were visible:

- **Color Panel** - `APen` and `BPen` colour boxes with their pickers, a
  swap button and the `Colour #000000` line.
- **Chromatic Wheel** - the big colour wheel with the value triangle and the
  `R:000 G:000 B:000` line under it.
- **Light Table** - a `Color` / `Instance` / `Bin` row with the green and
  orange swatches, the `10 9 8 7 6 5 4 3 2 1` value scale with the lamp and
  the `1 2 3 4 5 6 7 8 9 10` instance scale, the swatch grid whose dashes
  form the staircase of the exposures, the `• • • • •` / `X` line and the
  `Attenuate` box.
- **Remote Control** - the layer field, the colour bar, the two transport
  rows, `Frame rate 24 fps` with the `3 6 8 10 12 / 12.5 15 24 25 30` grid,
  `Mark In` / `Mark Out` with their spinners and `Flip X / Flip Y / P`.

The prototype now has all of that: the panels float and dock, the Chromatic
Wheel is a real wheel, the Light Table and the Remote Control have the live
layout, and the left column is the 215 px of the live app.

### v32 pass - the panels were used, not guessed

The live program was **used**: the floating panels were dragged by their title
bars, the header buttons were clicked and their tool tips read, a floating panel
was dropped on the left column and the colour wheel was clicked.

**The title bar is draggable** - TVPaint says so itself: *"Title bar / Contains
the menu title. / Click and drag on this bar to move the menu."*

**The header buttons of a panel are [dot][chevron][cross]**
- the **dot** opens the panel's own options,
- the **chevron COLLAPSES the body** - the panel shrinks to its title bar (it
  does *not* float the panel; the prototype had it wrong),
- the **cross** closes the panel.

**A floating window** has the title bar plus [float][maximize][cross]; the
maximize button's tool tip is *"Maximize/minimize / Click to enlarge the
window to its maximum size / reduce it to its minimum size."*

**The left column is a dock with a TAB BAR on top.**  Dragging the floating
`Light Table` onto the `Main Panel` tab turned it into a **tab** next to it
(`Main Panel | Light Table`), and the tab label is a title bar of its own.
So the left column is not a plain stack: the first row is a tab bar and the
panels below are the stacked sections (`Color Panel`, `Chromatic Wheel`,
`Tool : ...`).

**The Chromatic Wheel sets the APen colour** when it is clicked (the swatch in
the Color Panel follows).

The prototype now has: the tab bar (with the dropped panel becoming a tab and
the tab switching the content), the chevron collapsing the body, the float and
maximize buttons on a floating window, a draggable title bar, the drop-on-the-
tab-bar docking, and a working colour wheel.

### v33 pass - the panels were really moved, and the colour wheel was read

The live program was used again: the `Main Panel` was dragged out of the dock,
the floating panel was dragged back, the wheel was clicked and the tool tips
were read.

**The left dock is a TAB BAR, not a stack.**  Dragging the `Main Panel` tab out
of the dock turned the panel into a **floating window** over the project window
and the tab bar lost it (`Color Panel | Light Table` were left).  Dragging that
floating window back onto the tab bar made it a tab again
(`Main Panel | Light Table`).  So:

- the dock's first row is a **tab bar**; the tabs are panels,
- **dragging a tab out floats its panel as a window**,
- **dropping a floating window on the tab bar docks it as a tab**,
- a floating panel is dragged by its title bar (*"Title bar / Contains the menu
  title. / Click and drag on this bar to move the menu."*), it has its own
  title bar and a fixed size (dragging a corner does not resize it).

**The Chromatic Wheel** is described by TVPaint itself: *"Chromatic Wheel.
Right-click to access additional colors. **The inner ring is saturated, and the
outside ring handles luminosity.**"*

Measured on the live wheel: the ring is the **hue**, fully saturated on its
inside and falling off to almost black at the rim (the luminosity); inside it
sits a **triangle of the current hue** - the top vertex is the pure hue, the
bottom left corner is black and the bottom right corner is white - and **two
black round markers** show the current position (one on the ring for the hue,
one in the triangle for the saturation and the value).  The `R:000 G:000 B:000`
line under the wheel follows the pick.

The prototype now has the real wheel (the hue ring with the luminosity
falloff, the barycentric triangle of the current hue, the two markers, the
right click) and the real dock (tab bar, drag a tab out to float it, drop a
floating panel on the tab bar to dock it, the title bar of a floating panel is
its drag handle and the docked tab bar carries the title).

### Still not captured
- Exact Role submenu appearance/order. The labels are known from the loc's role
  assignment commands: `Keyframe`, `Breakdown`, `Inbetween (To Do)`,
  `Inbetween (Done)`, `Special Inbetween (To Do)`, `Special Inbetween (Done)`,
  and `None`; the live submenu itself was not opened.
- The live gesture used to create a timeline image selection (Shift/Ctrl click is
  an inference; the app's own automation was flaky around the cell strip).
- Live semantics of `Split` (the menu entry is enabled at a key start; the
  prototype splits the layer at the clicked frame).
- The precise trigger for Auto Create Frame beyond empty-cell drawing.
- Modifier Move/Copy/Insert drag semantics documented in the .loc but not observed
  live; the prototype implements the documented modifier behaviour for a cross
  layer drag.
