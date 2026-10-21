/* ------------------------------------------------------------------
   menus.js â€” TVPaint Animation 12.1.0 Pro's menu bar, transcribed from
   live captures (1936 x 1048 window, 2026-10-21).  Every label, shortcut,
   separator, tick mark, disabled state and submenu below is what the live
   app draws; nothing here is guessed except where a comment says so.

   Shape of an item:
     { label, shortcut, cmd, submenu, checked, disabled, panel }
       cmd       id used by ui.js to run the command (see MENU_ACTIONS)
       submenu   array of items, same shape
       checked   boolean or function () -> boolean (tick in the left column)
       disabled  boolean or function () -> boolean
       panel     dock panel key toggled by the item (Windows menu)

   Measured metrics of the live popups: 17 px row pitch, 11 px text,
   ~200 px minimum width, first text column at 22 px, accelerator right
   aligned 10 px from the edge, submenu arrow at the right edge.
   ------------------------------------------------------------------ */

const SEP = { sep: true };
const M = (label, o) => Object.assign({ label }, o || {});

/* Edit > Set Mark palette.  The 31 swatches were sampled from the live
   menu at x=352, y=238..748 (17 px pitch); the letters A..Z are drawn by
   TVPaint next to the swatch.  The last five letters (AA..AE) are inferred
   from the 17 px pitch â€” the capture crops them. */
const TV_IMAGE_MARK_SWATCHES = [
  ["A", "#fa0000"], ["B", "#ff7f00"], ["C", "#ffbf00"], ["D", "#ffff00"],
  ["E", "#bfff00"], ["F", "#3fff00"], ["G", "#00ff9f"], ["H", "#00ffff"],
  ["I", "#009fff"], ["J", "#005fff"], ["K", "#0000ff"], ["L", "#6f7fdf"],
  ["M", "#7f4fbf"], ["N", "#a73fef"], ["O", "#bf3fff"], ["P", "#df00ff"],
  ["Q", "#7f007f"], ["R", "#ff009f"], ["S", "#ff005f"], ["T", "#ff5f5f"],
  ["U", "#ff7f7f"], ["V", "#ffbfbf"], ["W", "#ffdcdc"], ["X", "#646464"],
  ["Y", "#c8c8c8"], ["Z", "#ffffff"], ["AA", "#a0deb7"], ["AB", "#debf8e"],
  ["AC", "#ffaea6"], ["AD", "#42bdff"], ["AE", "#f2f5a9"]
];

// filemenu.js loads after this file and replaces these with the real
// implementations; the defaults keep the tree safe to evaluate early.
if (typeof window !== "undefined") {
  window.tvRecentCount = window.tvRecentCount || function () { return 0; };
  window.tvRecentMenuItems = window.tvRecentMenuItems || function () { return []; };
  window.tvHasProject = window.tvHasProject || function () { return false; };
}

const TV_MENU_TREE = [
  /* ---------------- File ---------------- */
  { label: "File", items: [
    M("New Project...", { shortcut: "Shift N", cmd: "file.new" }),
    // live 12.1.0 crop: "Open / Import...   Shift L"
    M("Open / Import...", { shortcut: "Shift L", cmd: "file.open" }),
    SEP,
    // the three recents submenus are greyed in 12 while empty and become
    // enabled as soon as they hold an entry (menuItems is built on open)
    M("Recent projects", { cmd: "recent.projects", submenu: () => tvRecentMenuItems("projects"), disabled: () => !tvRecentCount("projects") }),
    M("Recent folders", { cmd: "recent.folders", submenu: () => tvRecentMenuItems("folders"), disabled: () => !tvRecentCount("folders") }),
    M("Recent files", { cmd: "recent.files", submenu: () => tvRecentMenuItems("files"), disabled: () => !tvRecentCount("files") }),
    SEP,
    M("Close Project", { shortcut: "Shift W", cmd: "file.close", disabled: () => !tvHasProject() }),
    SEP,
    // 12 Demo greys these because the trial cannot save; the full product
    // (11 Pro, live) keeps them enabled with these accelerators, which is
    // what the rebuild follows.
    M("Save Project", { shortcut: "Shift S", cmd: "file.save" }),
    M("Save Project as...", { shortcut: "Ctrl Shift S", cmd: "file.saveAs" }),
    M("Save Project as Template...", { cmd: "file.saveTemplate" }),
    SEP,
    M("Export to...", { shortcut: "Ctrl Shift E", cmd: "file.export" }),
    M("Publish...", { cmd: "file.publish" }),
    SEP,
    M("Configure printer...", { cmd: "file.printer" }),
    M("Print...", { shortcut: "Ctrl P", cmd: "file.print" }),
    SEP,
    M("Open Multi-Backup directory", { cmd: "file.backupDir" }),
    SEP,
    M("Quit", { shortcut: "Ctrl Q", cmd: "file.quit" })
  ] },

  /* ---------------- Edit ---------------- */
  { label: "Edit", items: [
    M("Undo", { cmd: "edit.undo" }),
    M("Redo", { cmd: "edit.redo" }),
    M("Clear", { shortcut: "Shift K", cmd: "edit.clear" }),
    SEP,
    M("Toggle Bookmark", { shortcut: "Ctrl Shift Up", cmd: "edit.toggleBookmark" }),
    M("Go to Previous Bookmark", { shortcut: "Ctrl Shift Left", cmd: "edit.prevBookmark" }),
    M("Go to Next Bookmark", { shortcut: "Ctrl Shift Right", cmd: "edit.nextBookmark" }),
    M("Remove selected Bookmarks", { cmd: "edit.removeBookmark" }),
    M("Remove All Bookmarks", { cmd: "edit.removeAllBookmarks" }),
    SEP,
    M("Set Mark", { submenu: [
      M("Default", { checked: true, cmd: "mark.default" }),
      ...TV_IMAGE_MARK_SWATCHES.map(([k, sw]) => M(k, { sw, cmd: "mark.set", markKey: k }))
    ] }),
    M("Clear Marks", { cmd: "mark.clear" }),
    M("Go to Previous Image Mark", { cmd: "mark.prev" }),
    M("Go to Next Image Mark", { cmd: "mark.next" }),
    M("Remove All Image Marks", { cmd: "mark.removeAll" }),
    SEP,
    M("Re Apply", { shortcut: "Enter", cmd: "edit.reapply" }),
    SEP,
    M("ClipBoard", { submenu: [
      M("Copy Brush", { cmd: "clipboard.copyBrush" }),
      M("Paste Brush", { shortcut: "Ctrl Alt V", cmd: "clipboard.pasteBrush" }),
      M("Copy Image", { cmd: "clipboard.copyImage" }),
      M("Paste Image (new layer)", { shortcut: "Ctrl Shift V", cmd: "clipboard.pasteImage" })
    ] }),
    M("Spare Image", { submenu: [
      M("Swap spare", { cmd: "spare.swap" }),
      M("Copy to spare", { shortcut: "Shift J", cmd: "spare.copy" }),
      M("Delete spare", { cmd: "spare.delete" }),
      M("Spare viewer", { cmd: "spare.viewer" })
    ] }),
    SEP,
    M("Shortcuts...", { shortcut: "Ctrl K", cmd: "edit.shortcuts" }),
    M("Preferences...", { shortcut: "Shift D", cmd: "edit.preferences" })
  ] },

  /* ---------------- Project ---------------- */
  { label: "Project", items: [
    M("Duplicate Project", { cmd: "project.duplicate" }),
    M("Modify Project...", { cmd: "project.modify" }),
    M("Dependencies", { submenu: [
      M("Images", { cmd: "deps.images" }),
      M("Sound Tracks", { cmd: "deps.sounds" })
    ] }),
    SEP,
    M("Render Camera", { submenu: [
      M("Into a New Project", { cmd: "project.renderCamera" }),
      M("Into a new merged Project", { cmd: "project.renderCameraMerged" })
    ] }),
    SEP,
    M("Load Sound...", { cmd: "project.loadSound" }),
    M("Add sound from library", { cmd: "project.soundLibrary" }),
    SEP,
    M("Send to", { submenu: [
      M("Refresh List", { cmd: "send.refresh" })
    ] }),
    SEP,
    M("Project Information", { submenu: [
      M("Project settings", { cmd: "project.info" })
    ] }),
    M("Go to", { submenu: [
      M("Untitled_(1)", { checked: true, cmd: "project.goto" })
    ] })
  ] },

  /* ---------------- Clip ---------------- */
  { label: "Clip", items: [
    M("Rename Clip...", { cmd: "clip.rename" }),
    SEP,
    M("New Clip", { cmd: "clip.new" }),
    M("Duplicate Clip", { cmd: "clip.duplicate" }),
    M("Delete Clip", { cmd: "clip.delete" }),
    M("Split Clip", { cmd: "clip.split" }),
    M("Merge Clips", { cmd: "clip.merge" }),
    SEP,
    M("New Scene", { cmd: "scene.new" }),
    M("Duplicate Scene", { cmd: "scene.duplicate" }),
    M("Delete Scene", { cmd: "scene.delete" }),
    SEP,
    M("Dependencies", { submenu: [
      M("Images", { cmd: "deps.images" }),
      M("Sound Tracks", { cmd: "deps.sounds" })
    ] }),
    M("All layers", { submenu: [
      M("Insert Instances Before Current Image...", { shortcut: "Shift I", cmd: "instances.insertBefore" }),
      M("Insert Instances After Current Image...", { cmd: "instances.insertAfter" }),
      M("Duplicate Image...", { cmd: "instances.duplicate" }),
      M("Delete exposure cell", { shortcut: "Shift F5", cmd: "exposure.deleteCell" }),
      M("Add Exposures...", { cmd: "exposure.add" })
    ] }),
    M("Background", { submenu: [
      M("None", { shortcut: "Shift B", cmd: "bg.none" }),
      M("Color", { shortcut: "Shift B", checked: true, cmd: "bg.color" }),
      M("Check", { shortcut: "Shift B", cmd: "bg.check" })
    ] }),
    SEP,
    M("Load Sound...", { cmd: "clip.loadSound" }),
    M("Add sound from library", { cmd: "clip.soundLibrary" }),
    SEP,
    M("Send to", { submenu: [
      M("Refresh List", { cmd: "send.refresh" })
    ] })
  ] },

  /* ---------------- Layer ---------------- */
  { label: "Layer", items: [
    M("New Layer", { cmd: "layer.new" }),
    M("Open Layer Presets Manager", { cmd: "layer.presets" }),
    SEP,
    M("Rename Layer...", { cmd: "layer.rename" }),
    SEP,
    M("Delete All Layers...", { submenu: [
      M("Empty Layers", { cmd: "layer.deleteEmpty" }),
      M("Inactive Layers", { cmd: "layer.deleteInactive" }),
      SEP,
      M("Empty+Inactive Layers", { cmd: "layer.deleteEmptyInactive" })
    ] }),
    M("Delete Layer", { cmd: "layer.delete" }),
    M("Split Layer", { cmd: "layer.split" }),
    M("Duplicate Layer", { cmd: "layer.duplicate" }),
    SEP,
    M("Move", { submenu: [
      M("Up", { cmd: "layer.moveUp" }),
      M("Down", { cmd: "layer.moveDown" })
    ] }),
    M("Align", { submenu: [
      M("Align Left", { cmd: "layer.alignLeft" }),
      M("Align Right", { cmd: "layer.alignRight" })
    ] }),
    SEP,
    M("Lock Layer", { cmd: "layer.lock" }),
    M("Lock Position", { cmd: "layer.lockPosition" }),
    SEP,
    M("Reverse Order", { submenu: [
      M("Reverse Selected Layer Order", { cmd: "layer.reverseSelected" }),
      M("Reverse All Layer Order", { cmd: "layer.reverseAll" })
    ] }),
    M("Merge", { submenu: [
      M("Merge Selected Layers", { cmd: "layer.mergeSelected" }),
      M("Merge Visible Layers", { cmd: "layer.mergeVisible" }),
      M("Merge All Layers", { cmd: "layer.mergeAll" })
    ] }),
    SEP,
    M("View All Layers", { checked: true, cmd: "layer.viewAll" }),
    M("View Current Layer Only", { cmd: "layer.viewCurrent" }),
    SEP,
    M("Make Anim Layer", { disabled: true, cmd: "layer.makeAnim" }),
    SEP,
    M("Select All Layers", { cmd: "layer.selectAll" }),
    SEP,
    M("Cut Layer", { shortcut: "Ctrl X", cmd: "layer.cut" }),
    M("Copy Layer", { shortcut: "Ctrl C", cmd: "layer.copy" }),
    M("Paste Layer (Above)", { shortcut: "Ctrl V", cmd: "layer.paste" })
  ] },

  /* ---------------- Image ---------------- */
  { label: "Image", items: [
    M("Select All Images", { cmd: "image.selectAll" }),
    M("Reverse Order", { cmd: "image.reverse" }),
    SEP,
    M("Cut Image", { shortcut: "Ctrl X", cmd: "image.cut" }),
    M("Copy Image", { shortcut: "Ctrl C", cmd: "image.copy" }),
    M("Paste Image", { shortcut: "Ctrl V", cmd: "image.paste" }),
    SEP,
    M("Modify", { submenu: [
      M("Flip Horizontally", { cmd: "image.flipH" }),
      M("Flip Vertically", { cmd: "image.flipV" }),
      M("Flip Horizontally & Vertically", { cmd: "image.flipHV" })
    ] }),
    SEP,
    M("Clear", { shortcut: "Shift K", cmd: "image.clear" }),
    SEP,
    M("Instances", { submenu: [
      M("Go to Previous Instance", { shortcut: "Ctrl Left", cmd: "instances.prev" }),
      M("Go to Next Instance", { shortcut: "Ctrl Right", cmd: "instances.next" }),
      M("Go to Instance Head", { cmd: "instances.head" }),
      M("Go to Instance Tail", { cmd: "instances.tail" }),
      M("Break Instance", { cmd: "instances.break" }),
      M("Insert Instances Before Current Image", { cmd: "instances.insertBefore" }),
      M("Insert Instances After Current Image", { cmd: "instances.insertAfter" }),
      M("Delete Selected Instances", { cmd: "instances.delete" })
    ] }),
    M("Exposure", { submenu: [
      M("Add Exposure", { cmd: "exposure.add" }),
      M("Remove Exposure", { cmd: "exposure.remove" }),
      M("Remove all Exposures", { cmd: "exposure.removeAll" }),
      M("Delete instance head", { cmd: "exposure.deleteHead" }),
      M("Recompute Exposure", { cmd: "exposure.recompute" }),
      M("Recompute Exposure with Threshold", { cmd: "exposure.recomputeThreshold" }),
      M("Repeat Images", { submenu: [
        M("Repeat 2", { cmd: "exposure.repeat2" }),
        M("Repeat 3", { cmd: "exposure.repeat3" }),
        M("Repeat 4", { cmd: "exposure.repeat4" }),
        M("Custom...", { cmd: "exposure.repeatCustom" })
      ] })
    ] }),
    SEP,
    M("Scan Cleaner (soft)", { cmd: "image.scanSoft" }),
    M("Scan Cleaner (stronger)", { cmd: "image.scanStrong" })
  ] },

  /* ---------------- Effects ---------------- */
  { label: "Effects", items: [
    M("Blur", { submenu: [
      M("Cubic Blur", { cmd: "fx.blur.cubic" }),
      M("Gaussian Blur", { cmd: "fx.blur.gaussian" }),
      SEP,
      M("Directional Blur", { cmd: "fx.blur.directional" }),
      M("Center Blur", { cmd: "fx.blur.center" }),
      M("Radial Blur", { cmd: "fx.blur.radial" }),
      M("Motion Blur", { cmd: "fx.blur.motion" }),
      SEP,
      M("Chroma Blur", { cmd: "fx.blur.chroma" }),
      M("Median Blur", { cmd: "fx.blur.median" })
    ] }),
    /* Color is a TWO-COLUMN popup in the live app (17 px rows, both columns
       aligned).  Order below is column by column, as read from the capture. */
    M("Color", { cols: 2, submenu: [
      M("Black And White", { cmd: "fx.color.bw" }),
      M("Black And White Converter", { cmd: "fx.color.bwConverter" }),
      M("Color Replacer", { cmd: "fx.color.replacer" }),
      M("Multi Color Replacer", { cmd: "fx.color.multiReplacer" }),
      M("Color Adjust", { cmd: "fx.color.adjust" }),
      M("Curves", { cmd: "fx.color.curves" }),
      M("Color Desaturator", { cmd: "fx.color.desaturator" }),
      M("Color Eraser", { cmd: "fx.color.eraser" }),
      M("Tint Replacer", { cmd: "fx.color.tintReplacer" }),
      M("Sliders", { cmd: "fx.color.sliders" }),
      M("Histogram", { cmd: "fx.color.histogram" }),
      M("Image Source", { cmd: "fx.color.imageSource" }),
      M("Scan Cleaner Color", { cmd: "fx.color.scanColor" }),
      M("Scan Cleaner Black and White", { cmd: "fx.color.scanBW" }),
      M("Dust Cleaner", { cmd: "fx.color.dust" }),
      M("Expand", { cmd: "fx.color.expand" }),
      M("Line Colorize", { cmd: "fx.color.lineColorize" }),
      M("Line Colorize Enhanced", { cmd: "fx.color.lineColorizeEnhanced" })
    ] }),
    M("Distortion", { submenu: [
      M("Perspective : 4 Points", { cmd: "fx.dist.perspective4" }),
      M("Warp Grid", { cmd: "fx.dist.warpGrid" }),
      M("Optical Flow", { cmd: "fx.dist.opticalFlow" }),
      SEP,
      M("Tornado", { cmd: "fx.dist.tornado" }),
      M("Wave", { cmd: "fx.dist.wave" }),
      SEP,
      M("Bump", { cmd: "fx.dist.bump" }),
      M("Displacement Mapping", { cmd: "fx.dist.displacement" }),
      SEP,
      M("Flip", { cmd: "fx.dist.flip" }),
      M("Mirror", { cmd: "fx.dist.mirror" }),
      M("Kaleidoscope", { cmd: "fx.dist.kaleidoscope" })
    ] }),
    M("Keying", { submenu: [
      M("Color Keyer", { cmd: "fx.key.color" }),
      M("Cross Keyer", { cmd: "fx.key.cross" }),
      SEP,
      M("Chroma Keyer", { cmd: "fx.key.chroma" }),
      M("Advanced Keyer", { cmd: "fx.key.advanced" }),
      M("Luma Keyer", { cmd: "fx.key.luma" }),
      M("Alpha Control", { cmd: "fx.key.alpha" })
    ] }),
    M("Motion", { submenu: [
      M("Keyframer", { cmd: "fx.motion.keyframer" }),
      M("Multi Plane Camera", { cmd: "fx.motion.multPlane" }),
      SEP,
      M("Shaker", { cmd: "fx.motion.shaker" }),
      M("Stabilization 1 Point", { cmd: "fx.motion.stab1" }),
      M("Stabilization 2 Points", { cmd: "fx.motion.stab2" })
    ] }),
    M("Rendering", { submenu: [
      M("Auto Paint", { cmd: "fx.render.autoPaint" }),
      M("Brush Spreading", { cmd: "fx.render.brushSpreading" }),
      M("Inlay Texture", { cmd: "fx.render.inlayTexture" }),
      SEP,
      M("Particles Generator", { cmd: "fx.render.particles" }),
      SEP,
      M("Background Generator", { cmd: "fx.render.background" }),
      M("Perlin Noise", { cmd: "fx.render.perlin" }),
      M("Plasma", { cmd: "fx.render.plasma" }),
      M("Pattern Generator", { cmd: "fx.render.pattern" }),
      SEP,
      M("Lens Flare", { cmd: "fx.render.lensFlare" }),
      M("Lighting", { cmd: "fx.render.lighting" }),
      M("Volumetric Light", { cmd: "fx.render.volumetric" }),
      SEP,
      M("Healing Tracker", { cmd: "fx.render.healing" }),
      M("RotoTracking", { cmd: "fx.render.rototracking" }),
      SEP,
      M("Simple Text", { cmd: "fx.render.simpleText" }),
      M("Multiline Text", { cmd: "fx.render.multilineText" }),
      M("Time Code Generator", { cmd: "fx.render.timecode" })
    ] }),
    M("Stylize", { submenu: [
      M("Drop Shadow", { cmd: "fx.stylize.dropShadow" }),
      M("Toon Shading", { cmd: "fx.stylize.toon" }),
      M("Highlight", { cmd: "fx.stylize.highlight" }),
      SEP,
      M("Mosaic", { cmd: "fx.stylize.mosaic" }),
      M("Noise", { cmd: "fx.stylize.noise" }),
      M("Blender", { cmd: "fx.stylize.blender" }),
      SEP,
      M("Anti-Aliasing", { cmd: "fx.stylize.antiAliasing" }),
      M("Bevel", { cmd: "fx.stylize.bevel" }),
      M("Border", { cmd: "fx.stylize.border" }),
      M("Glow", { cmd: "fx.stylize.glow" }),
      M("Erode", { cmd: "fx.stylize.erode" }),
      SEP,
      M("Grain", { cmd: "fx.stylize.grain" }),
      M("HalfTone", { cmd: "fx.stylize.halftone" }),
      M("Print", { cmd: "fx.stylize.print" }),
      SEP,
      M("Bloom", { cmd: "fx.stylize.bloom" }),
      M("Color Range", { cmd: "fx.stylize.colorRange" }),
      M("Lumix", { cmd: "fx.stylize.lumix" }),
      M("Negative", { cmd: "fx.stylize.negative" }),
      M("Posterize", { cmd: "fx.stylize.posterize" }),
      M("Solarize", { cmd: "fx.stylize.solarize" }),
      SEP,
      M("Convolution", { cmd: "fx.stylize.convolution" })
    ] }),
    M("Transition", { submenu: [
      M("Blind", { cmd: "fx.trans.blind" }),
      M("Block", { cmd: "fx.trans.block" }),
      M("Classic", { cmd: "fx.trans.classic" }),
      M("Fade", { cmd: "fx.trans.fade" }),
      M("Page Turn", { cmd: "fx.trans.pageTurn" }),
      M("Rotary", { cmd: "fx.trans.rotary" }),
      M("Slide", { cmd: "fx.trans.slide" })
    ] })
  ] },

  /* ---------------- View ---------------- */
  { label: "View", items: [
    M("New Project Window", { cmd: "view.newWindow" }),
    SEP,
    M("Zoom In", { cmd: "view.zoomIn" }),
    M("Zoom Out", { cmd: "view.zoomOut" }),
    M("Fit", { shortcut: "Ctrl Pad 0", cmd: "view.fit" }),
    M("1:1", { cmd: "view.oneToOne" }),
    SEP,
    M("Rotate counter clockwise", { shortcut: "Shift Page Up", cmd: "view.rotateCCW" }),
    M("Rotate clockwise", { shortcut: "Shift Page Down", cmd: "view.rotateCW" }),
    M("Reset", { shortcut: "Insert", cmd: "view.reset" }),
    SEP,
    M("Flip", { submenu: [
      M("Keep Position", { checked: true, cmd: "view.flipKeep" }),
      M("Flip Horizontally", { cmd: "view.flipH" }),
      M("Flip Vertically", { cmd: "view.flipV" })
    ] }),
    SEP,
    M("Display with Aspect Ratio", { checked: true, cmd: "view.aspect" }),
    M("Display with Video", { cmd: "view.video" }),
    SEP,
    M("Inlay View", { cmd: "view.inlay" }),
    SEP,
    M("Show Full Page", { shortcut: "Shift V", cmd: "view.fullPage" }),
    SEP,
    M("Workspaces", { submenu: [
      M("Room 1", { shortcut: "Ctrl Pad 1", checked: true, cmd: "view.room1" }),
      M("Room 2", { shortcut: "Ctrl Pad 3", cmd: "view.room2" }),
      M("Room 3", { shortcut: "Ctrl Pad 7", cmd: "view.room3" }),
      M("Room 4", { shortcut: "Ctrl Pad 9", cmd: "view.room4" })
    ] })
  ] },

  /* ---------------- Windows (dockable panels) ---------------- */
  { label: "Windows", items: [
    M("Main", { panel: "main" }),
    M("Color Panel", { panel: "color" }),
    M("Tools", { shortcut: "Shift A", panel: "tool" }),
    M("Timeline", { panel: "timeline" }),
    SEP,
    M("Animaton", { submenu: [           /* TVPaint spells it "Animaton" */
      M("Light Table", { panel: "lt" }),
      M("Stopwatch", { panel: "chrono" }),
      M("Image Mark", { panel: "imagemark" }),
      M("Flips", { panel: "flip" }),
      M("Remote", { panel: "remote" }),
      M("Preview Settings", { panel: "previewset" }),
      M("Video In Settings", { panel: "videoin" }),
      M("Pep-Holes Registration", { cmd: "panel.pegholes" }),
      M("Timesheet", { panel: "xsheet" })
    ] }),
    M("Drawing", { submenu: [
      M("Papers", { cmd: "panel.papers" }),
      M("Gradient", { cmd: "panel.gradient" }),
      M("Line smoothing", { panel: "smoothing" }),
      M("Guidelines", { panel: "guideline" }),
      M("Drawing Recorder", { panel: "projectrecorder" }),
      M("Shape Settings", { panel: "shapesettings" }),
      M("Connection Settings", { cmd: "panel.connection" })
    ] }),
    M("Show", { submenu: [
      M("Menu bar", { panel: "menu" }),
      M("Notes", { cmd: "panel.notes" }),
      M("Sound", { cmd: "panel.sound" }),
      M("Navigator", { panel: "navigator" }),
      M("Color Group", { panel: "colorgroup" }),
      M("Coordinates", { cmd: "panel.coordinates" }),
      M("Display Settings", { panel: "displayoption" }),
      M("Color Checker", { panel: "colorchecker" })
    ] }),
    M("FX Tools", { submenu: [
      M("FX Stack", { panel: "fxstack" }),
      M("Path Recorder", { panel: "strokerecorder" }),
      M("Pixel Tracker", { panel: "pixeltracker" }),
      M("Path Manager", { panel: "pathmanager" })
    ] }),
    M("Others", { submenu: [
      M("History", { panel: "undo" }),
      M("Share Manager", { panel: "sharemanager" }),
      M("Image Library", { panel: "library" }),
      M("Search", { shortcut: "Ctrl F", cmd: "panel.search" })
    ] }),
    SEP,
    M("Plugins", { submenu: [
      M("Direct Show", { cmd: "plugin.directshow" })
    ] }),
    M("Scripts", { submenu: [
      M("AnimatorPanel.grg", { cmd: "script.animator" }),
      M("Timesheet.grg", { cmd: "script.timesheet" })
    ] })
  ] },

  /* ---------------- Custom Panels ---------------- */
  /* The 16 entries below are the app's own list (Paintbrushes appears twice:
     PaintBrushes_v1.bin is registered under both spellings).  The names are
     resolved against TV_CUSTOM_PANELS in ui.js. */
  { label: "Custom Panels", items: [
    M("Animator Panel", { custom: "Animator Panel" }),
    M("Chalk", { custom: "Chalks" }),
    M("Correction", { custom: "Correction" }),
    M("Grab Tools Panel", { custom: "Grab Tools Panel" }),
    M("Howard Wimshurst Brushes", { custom: "Howard Wimshurst Brushes" }),
    M("Nature", { custom: "Nature" }),
    M("Paintbrushes", { custom: "Paintbrushes" }),
    M("Paintbrushs", { custom: "Paintbrushs" }),
    M("Pencils", { custom: "Pencils" }),
    M("Pens", { custom: "Pens" }),
    M("Shading", { custom: "Shading" }),
    M("Sketch Panel", { custom: "Sketch Panel" }),
    M("Smudge & Spread", { custom: "Smudge & Spread" }),
    M("Timesheet", { custom: "Timesheet" }),
    M("Tool Presets Legacy", { custom: "Tool Presets Legacy" }),
    M("Tutorial Recorder", { cmd: "panel.tutorialRecorder" }),
    SEP,
    M("New Custom Panel", { cmd: "custom.new" }),
    M("New Embedded Custom Panel", { cmd: "custom.newEmbedded" }),
    M("Load a Custom Panel...", { cmd: "custom.load" }),
    SEP,
    M("Open All", { cmd: "custom.openAll" }),
    M("Hide All", { cmd: "custom.hideAll" })
  ] },

  /* ---------------- Help ---------------- */
  { label: "Help", items: [
    M("Tooltips", { submenu: [
      M("None", { cmd: "help.tooltipsNone" }),
      M("Short", { cmd: "help.tooltipsShort" }),
      M("Full", { checked: true, cmd: "help.tooltipsFull" })
    ] }),
    M("Online Tutorials", { submenu: [
      M("Aaron Blaise video tutorials", { cmd: "help.tutAaron" }),
      M("Howard Wimshurst Animator Guide", { cmd: "help.tutHoward" }),
      M("TVPaint Animation 12 Tutorials", { cmd: "help.tutTvpaint" }),
      M("Bloop Animation", { cmd: "help.tutBloop" })
    ] }),
    M("Online Documentation", { cmd: "help.docs" }),
    M("Download the examples", { cmd: "help.examples" }),
    SEP,
    M("Tech support forums", { cmd: "help.forums" }),
    SEP,
    M("Social networks", { submenu: [
      M("Vimeo", { cmd: "help.vimeo" }),
      M("Bluesky", { cmd: "help.bluesky" }),
      M("Facebook", { cmd: "help.facebook" }),
      M("Youtube", { cmd: "help.youtube" }),
      M("Instagram", { cmd: "help.instagram" })
    ] }),
    SEP,
    M("Buy TVPaint Animation Now", { cmd: "help.buy" }),
    SEP,
    M("About TVPaint Animation...", { cmd: "help.about" }),
    M("TVPaint Developpement's website", { cmd: "help.website" })
  ] }
];

// ------------------------------------------------------------------
// Commands that exist in the live TVPaint menu bar but whose behaviour
// is not built in this rebuild yet.  Clicking one shows the generic
// "command present, behaviour not built yet" toast.  The list is
// explicit on purpose: every command of the tree must either have a
// real action in ui.js / filemenu.js or appear here, and an entry must
// be removed from here as soon as the command is implemented
// (test/menus.test.js checks both directions).
// ------------------------------------------------------------------
const STUB_COMMANDS = [
  "clip.delete", "clip.duplicate", "clip.merge", "clip.new", "clip.split",
  "custom.load", "custom.new", "custom.newEmbedded",
  "deps.images", "deps.sounds",
  "help.bluesky", "help.docs", "help.examples", "help.facebook", "help.forums",
  "help.instagram", "help.tooltipsFull", "help.tooltipsNone", "help.tooltipsShort",
  "help.tutAaron", "help.tutBloop", "help.tutHoward", "help.tutTvpaint",
  "help.vimeo", "help.website", "help.youtube",
  "panel.connection", "panel.coordinates", "panel.gradient", "panel.notes",
  "panel.papers", "panel.pegholes", "panel.search", "panel.sound",
  "panel.tutorialRecorder",
  "plugin.directshow",
  "project.goto",
  "script.animator", "script.timesheet",  "send.refresh",
  "view.newWindow", "view.room1", "view.room2", "view.room3", "view.room4",
  "view.video"
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TV_MENU_TREE, TV_IMAGE_MARK_SWATCHES, STUB_COMMANDS };
}

