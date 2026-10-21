/* ------------------------------------------------------------------
   prefs.js - the two panels of the Edit menu of TVPaint 12:

     Edit > Shortcuts...   ->  "Configure Keyboard Shortcuts"
     Edit > Preferences... ->  "Preferences"

   Both were captured live (shots/live-shortcuts-dialog.png,
   shots/live-preferences-dialog.png) and rebuilt on the same geometry.
   Every caption and every tooltip of the panels is the exact string
   of the shipped localisation file
   (Resources/data/english.tvpaint.loc) - the ids are given in the
   comments so the mapping back to the live is checkable.

   The key map is real: what is assigned in the panel is what the
   application answers to, and it is stored with the other settings.
   ------------------------------------------------------------------ */
(function () {
  const doc = document;

  /* ---------------- small helpers (the dialog framework of filemenu.js) -- */
  function el(tag, cls, txt) {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function at(n, x, y, w, h) {
    n.style.position = "absolute";
    n.style.left = x + "px"; n.style.top = y + "px";
    if (w != null) n.style.width = w + "px";
    if (h != null) n.style.height = h + "px";
    return n;
  }
  function toastMsg(t) {
    let s = doc.getElementById("toastMsg");
    if (!s) { s = doc.createElement("div"); s.id = "toastMsg"; doc.body.appendChild(s); }
    s.textContent = t; s.classList.add("show");
    clearTimeout(toastMsg._t);
    toastMsg._t = setTimeout(() => s.classList.remove("show"), 2200);
  }

  /* the tooltip of the live: a small blue grey plate with dark text,
     shown under the control after a moment */
  let tipNode = null, tipTimer = null;
  function tvTip(node, text) {
    if (!text) return;
    const show = () => {
      if (tipNode || !text) return;
      tipNode = el("div");
      tipNode.style.cssText = "position:absolute;z-index:4000;background:#898fa6;color:#1b1b22;" +
        "font:11px \"Segoe UI\",Tahoma,sans-serif;padding:5px 6px;line-height:16px;white-space:pre-wrap;" +
        "max-width:330px;box-shadow:0 2px 6px rgba(0,0,0,.45);pointer-events:none";
      tipNode.textContent = text;
      doc.body.appendChild(tipNode);
      const r = node.getBoundingClientRect();
      const w = tipNode.offsetWidth, h = tipNode.offsetHeight;
      let x = r.left + 8, y = r.bottom + 4;
      if (x + w > window.innerWidth - 4) x = window.innerWidth - w - 4;
      if (y + h > window.innerHeight - 4) y = r.top - h - 4;
      tipNode.style.left = Math.max(4, x) + "px";
      tipNode.style.top = Math.max(4, y) + "px";
    };
    const hide = () => { clearTimeout(tipTimer); tipTimer = null; if (tipNode) { tipNode.remove(); tipNode = null; } };
    node.addEventListener("mouseenter", () => { tipTimer = setTimeout(show, 550); });
    node.addEventListener("mouseleave", hide);
    node.addEventListener("mousedown", hide);
  }

  /* ---------------- the preferences store ---------------- */
  const PREF_STORE = "tvpaint.preferences";
  function defaultPrefs() {
    return {
      language: "English",
      tempDir: "",
      papersDir: "",
      pluginsDir: "",
      mixersDir: "",
      brushDir: "",
      undoSize: 512,             // MB
      undoEnabled: true,
      cacheUsage: "Automatic",   // Automatic | Manual
      cacheSize: 256,            // MB
      startup: "Remember last used configuration",
      openLastProject: false,
      physicalMemory: 0,         // filled in at run time
      undo: 512
    };
  }
  function loadPrefs() {
    const d = defaultPrefs();
    try {
      const s = JSON.parse(localStorage.getItem(PREF_STORE) || "null");
      if (s && typeof s === "object") {
        Object.keys(d).forEach(k => { if (s[k] !== undefined) d[k] = s[k]; });
        // the loose values of the pages (check boxes, sliders, colours)
        if (s.values && typeof s.values === "object") Object.keys(s.values).forEach(k => { d.values = d.values || {}; d.values[k] = s.values[k]; });
      }
    } catch (e) { /* ignore */ }
    return d;
  }
  function savePrefs(p) {
    try {
      const out = {};
      Object.keys(p).forEach(k => { if (k !== "values") out[k] = p[k]; });
      out.values = p.values || {};
      localStorage.setItem(PREF_STORE, JSON.stringify(out));
    } catch (e) { /* ignore */ }
  }
  function prefValue(p, key, dflt) {
    p.values = p.values || {};
    if (p.values[key] === undefined) p.values[key] = dflt;
    return p.values[key];
  }
  function setPrefValue(p, key, v) {
    p.values = p.values || {};
    p.values[key] = v;
    savePrefs(p);
  }
  window.tvPrefs = { load: loadPrefs, save: savePrefs, default: defaultPrefs };

  /* ==================================================================
     THE PAGES - every caption is the string of the live
     ================================================================== */

  /* the tree of the live (ids 011021118 - 011021129) */
  const TREE = [
    { name: "General", page: "general", id: "000021111" },
    { name: "Save", page: "save", id: "011021118" },
    { name: "Drawing", page: "drawing", id: "011021120" },
    { name: "Timeline", page: "timeline", id: "011021123", children: [
      { name: "General", page: "timeline", id: "011021127" },
      { name: "Clip", page: "timelineClip", id: "011021124" },
      { name: "Thumbnail", page: "timelineThumb", id: "011021125" },
      { name: "Default config", page: "timelineDefault", id: "011021126" }
    ] },
    { name: "Interface", page: "interface", id: "000021110", children: [
      { name: "General", page: "interface", id: "011021122" },
      { name: "Theme", page: "theme", id: "011021128" },
      { name: "Panels", page: "panels", id: "011021129" }
    ] },
    { name: "Sound", page: "sound", id: "000021114" },
    { name: "Paths", page: "paths", id: "012104312" }
  ];

  /* the colour rows of the Theme page - the caption is the name of the
     colour in the live, the variable is the one our interface uses */
  const THEME_COLORS = [
    ["000060150", "Desktop Background", "--tv-desktop"],
    ["000060151", "Panel Outline", "--tv-gadget-border"],
    ["000060152", "Panel Outline Light", "--tv-req-outline-light"],
    ["000060153", "Panel Outline Dark", "--tv-req-outline-dark"],
    ["000060154", "Panel Background", "--tv-gadget"],
    ["000060155", "Panel Drag Bar", "--tv-toolbar"],
    ["000060156", "Panel Drag Bar Selected", "--tv-toolbar-selected"],
    ["000060157", "Panel Title", "--tv-text"],
    ["000060158", "Panel System 1", "--tv-stat"],
    ["000060159", "Panel System 2", "--tv-stat-selected"],
    ["000060160", "Gadget Text Inside", "--tv-text"],
    ["000060161", "Gadget Text Outside", "--tv-text-out"],
    ["000060162", "Gadget Text Selectable", "--tv-tabs-text"],
    ["000060163", "Gadget Text Background", "--tv-text-bg"],
    ["000060164", "Gadget Default", "--tv-default"],
    ["000060165", "Gadget Default Selected", "--tv-default-selected"],
    ["000060166", "Gadget Default Invert", "--tv-default-invert"],
    ["000060167", "Gadget Action", "--tv-action"],
    ["000060168", "Gadget Action Selected", "--tv-action-selected"],
    ["000060169", "Gadget Dialog", "--tv-dialog"],
    ["000060170", "Gadget Dialog Selected", "--tv-dialog-selected"],
    ["000060171", "Gadget Drag", "--tv-element"],
    ["000060172", "Gadget Drag Selected", "--tv-element-current"],
    ["000060175", "Gadget Slider", "--tv-toolbar"],
    ["000060176", "Gadget Slider Selected", "--tv-toolbar-selected"],
    ["000060177", "Gadget Tabs", "--tv-tabs"],
    ["000060178", "Gadget Tabs Selected", "--tv-tabs-selected"],
    ["000060179", "Gadget Tabs Over", "--tv-tabs-text"],
    ["000060180", "Gadget Tabs Text", "--tv-tabs-text"],
    ["000060181", "Gadget Tabs Text Selected", "--tv-tabs"],
    ["000060182", "Gadget Separator Dark", "--tv-border"],
    ["000060183", "Gadget Separator Light", "--tv-document"],
    ["000060184", "Menu Shortcut", "--tv-shortcut"],
    ["000060185", "Layout Background", "--tv-desktop"],
    ["000060186", "Background Default", "--tv-default"],
    ["000060187", "Background Current", "--tv-element-current"],
    ["000060188", "Background Other", "--tv-element"],
    ["000060189", "Gadget Custom", "--tv-gadget"],
    ["000060190", "Gadget Custom Selected", "--tv-tabs-selected"],
    ["000060191", "Gadget Border", "--tv-gadget-border"],
    ["000060192", "Gadget Text Background 2", "--tv-text-bg"],
    ["000060193", "Layer: Handle Grabbed", "--tv-layer-grabbed"],
    ["000060194", "Layer: Empty Instance Mark", "--tv-layer-empty"],
    ["000060195", "Layer: Handle Color 1", "--tv-layer-handle1"],
    ["000060196", "Layer: Handle Color 2", "--tv-layer-handle2"],
    ["011060150", "Notes Background", "--tv-notes"],
    ["011060151", "Help Background", "--tv-document"],
    ["011060152", "Help Text", "--tv-text"],
    ["011060153", "Notification Background", "--tv-notification"],
    ["011060154", "Notification Text", "--tv-notification-text"]
  ];

  /* the pages.  w.type tells the renderer what to draw:
       combo | check | field | button | slider | text | color | spin
     y is the measured row of the General page, the other pages use the
     regular 24 px pitch of the live.                                      */
  const PAGES = {
    general: {
      title: "General",
      rows: [
        { cap: "Language", id: "000021129", tip: "000021153 Choose Language", w: { type: "combo", k: "language", items: ["Default", "English", "French", "Japanese", "Chinese"], y: 50 } },
        { cap: "Keyboard Shortcuts", id: "000021134", tip: "000021148 Click here to edit your keyboard shortcuts", w: { type: "button", text: "Configure...", id: "000021135", y: 73, action: "shortcuts" } },
        { cap: "Temp Directory", id: "000021136", tip: "000021149 Click here to choose your temporary file directory\n\nClick on the set button\nNavigate to the directory you wish to use as the Temp Dir\nClick OK", w: { type: "button", text: "Set...", id: "000021137", y: 96, action: "setTemp" } },
        { w: { type: "field", k: "tempDir", ro: true, y: 116 }, cap: "" },
        { cap: "Physical Memory", id: "000021281", tip: "000021290 The amount of memory in your computer", w: { type: "text", k: "physicalMemory", y: 161 } },
        { cap: "Undo", id: "000021130", tip: "000021286 Disable the undo\n\nturn off the undo mode.", w: { type: "field", k: "undoSize", unit: "MB", inField: true, w: 64, y: 185 } },
        { w: { type: "slider", k: "undoSize", min: 64, max: 4096, y: 186, x: 490, w: 66, cap: "Undo Size", capx: 580, id: "000021133", tip: "000021289 Choose how much memory to allocate for undo buffer\n\nThe more memory allocated\nto the undo buffer, the more \nlevels of undo will be possible." } },
        { cap: "Cache usage", id: "000021280", tip: "000021291 Sets cache amount automatically\n\nAutomatically sets the amount of\nmemory used for the undo buffer.", w: { type: "check", k: "cacheAutomatic", y: 210, id: "000021283 Automatic" } },
        { w: { type: "button", text: "Manual", id: "000021284", y: 241, w: 98, action: "cacheManual" } },
        { w: { type: "button", text: "Auto", id: "000021282", y: 241, x: 501, w: 44, action: "cacheAuto" } },
        { w: { type: "slider", k: "cacheSize", min: 64, max: 4096, y: 262, x: 490, w: 80, cap: "Cache size", capx: 575, capy: 241, id: "000021285", tip: "000021293 Size of your cache\n\nDisplays the current size\nod the cache." } },
        { cap: "Startup configuration", id: "105121320", w: { type: "combo", k: "startup", items: ["Remember last used configuration", "Open Startup Panel", "Always keep the same configuration"], y: 260 } },
        { w: { type: "button", text: "Reset configuration", id: "105121326", y: 279, tip: "105121327 Resetting the configuration will also delete your Custom Panels.\nYou will need to restart the software.\nProceed?", action: "resetConfig" } },
        { cap: "Open last project on startup", id: "105121324", w: { type: "check", k: "openLastProject", y: 310 } },
        { cap: "Export All Custom Settings", id: "012102150", tip: "012102152 Clicking on this button allows you to export all your custom settings -Shortcuts, Palettes, Custom Panels, FX Stack etc.- in a dedicated folder, which lets you to reimport them quickly later on.", w: { type: "button", text: "Export Settings", id: "012102151", y: 342, action: "exportSettings" } },
        { cap: "Import Custom Settings", id: "012043814", tip: "012043816 Import the selected custom settings from\n a .tvpsettings file. Shortcuts and FX\n Stacks presets will be added to their \nrespective preset lists. Custom Panels,\n Palettes and Mixers will be added or \nwill replace already exisiting ones if \nthey bear the same name. Imported Layer \nPresets and Color Groups will replace the\n existing ones.", w: { type: "button", text: "Import Settings", id: "012043815", y: 361, action: "importSettings" } },
        { cap: "George Alert: tv_WriteTextFile", id: "011060173", tip: "011060174 When disabled, you won't get a warning pop-up when scripts will modify files on your computer.", w: { type: "check", k: "georgeAlert", y: 410 } }
      ]
    },

    save: {
      title: "Save",
      rows: [
        { cap: "Save Alarm", id: "000121133", tip: "000121134 Activate/Inactivate the save alarm", w: { type: "check", k: "saveAlarm" } },
        { w: { type: "spin", k: "saveAlarmMinutes", min: 1, max: 120, unit: "minutes", id: "000121135", tip: "000121136 Set the time in minutes that a project is allowed to be unsaved." }, cap: "" },
        { w: { type: "combo", k: "saveAlarmMode", items: ["Deactivate", "Warn me!", "Auto Save", "Disable alarm until next save"], id: "011074104", tip: "011021140 Save Alarm Options" }, cap: "" },
        { cap: "TVPP Compression", id: "000121139", tip: "000121140 Compress project's data while saving in .tvpp format.", w: { type: "check", k: "tvppCompression" } },
        { cap: "Multi-Backup", id: "009521133", tip: "009521134 Set how many project backup files will be stored on the disk", w: { type: "check", k: "multiBackup" } },
        { w: { type: "spin", k: "multiBackupCount", min: 1, max: 20 }, cap: "" },
        { w: { type: "combo", k: "multiBackupDir", items: ["Sub-folder, in the same folder as the project file", "Same folder as project file", "Custom folder..."], id: "011021145", tip: "011021148 Set Multi-Backup Directory" }, cap: "" },
        { w: { type: "field", k: "multiBackupPath", ro: true, cap: "Multi-Backup Directory", id: "011021150" }, cap: "" },
        { w: { type: "button", text: "Set", id: "000021146", action: "setBackupDir" }, cap: "" },
        { cap: "Backup the current save too", id: "011021153", w: { type: "check", k: "backupCurrent" } }
      ]
    },

    drawing: {
      title: "Drawing",
      rows: [
        { cap: "Animated Strokes", id: "000121130", tip: "000121132 When this option is activated and the CTRL key\nis pressed during the drawing, the current frame changes.", w: { type: "check", k: "animatedStrokes" } },
        { cap: "Boost line smoothness", id: "000121141", tip: "000121142 Add some extra smoothness to your lines.", w: { type: "check", k: "smoothness" } },
        { cap: "Prevent drawing on the stencil(s)", id: "000121143", w: { type: "check", k: "stencil" } },
        { cap: "Barbecue", id: "000121137", tip: "000121138 Burn my CPU and drain my battery to enhance my creativity.", w: { type: "check", k: "barbecue" } },
        { cap: "Default cut mode", id: "000121153", w: { type: "combo", k: "cutMode", items: ["Erase", "Replace", "Add", "Sub"] } },
        { cap: "Default delete mode", id: "000121154", w: { type: "combo", k: "deleteMode", items: ["Erase", "Replace", "Add", "Sub"] } },
        { cap: "Resampling Algorithm", id: "000121162", tip: "000121165 The legacy resampling algorithm offers better performances", w: { type: "combo", k: "resampling", items: ["Legacy", "New"] } },
        { cap: "Tablet", id: "000021138", w: { type: "check", k: "tablet" } },
        { w: { type: "combo", k: "tabletMode", items: ["Wintab", "Ink", "Stylus Only"], id: "009521139", tip: "009521140 Use Wintab library" }, cap: "" },
        { cap: "Undo layer opacity", id: "011021180", tip: "011021181 If you uncheck this, the future changes of layer opacity will not be applied.", w: { type: "check", k: "undoLayerOpacity" } },
        { cap: "Scroll lock panels", id: "011021200", tip: "011021201 If you check this, the locked panels in the bins will also be scrolled.", w: { type: "check", k: "scrollLock" } },
        { cap: "Double click to rename instance", id: "011021212", tip: "011021213 If you check this, you can rename an instance by double clicking on it.", w: { type: "check", k: "dblClickRename" } },
        { cap: "Transformation Tools Preview Quality", id: "012104009", tip: "012104010 Change the preview quality of the Transform and Perspective Tools", w: { type: "combo", k: "transformQuality", items: ["Low", "Medium", "High"] } }
      ]
    },

    timeline: {
      title: "General",
      rows: [
        { cap: "Display Time Code", id: "000022832", tip: "000022833 Display Time Code instead of frame numbers in the Timeline", w: { type: "check", k: "timeCode" } },
        { cap: "Drawers", id: "000121180", w: { type: "group" } },
        { w: { type: "check", k: "leftDrawer", cap: "Left", id: "000121182", tip: "000121183 Enable the Left Drawer" }, cap: "" },
        { w: { type: "check", k: "rightDrawer", cap: "Right", id: "000121184", tip: "000121185 Enable the Right Drawer" }, cap: "" },
        { cap: "Large Timeline", id: "000121186", tip: "000121187 With this option checked, the Timeline uses all\nthe width of the software window.", w: { type: "check", k: "largeTimeline" } },
        { cap: "Vertical Timeline", id: "000121188", tip: "000121189 With this option checked, the Timeline becomes\nvertical, docked to the Right Drawer.", w: { type: "check", k: "verticalTimeline" } },
        { cap: "Instance Handle Size", id: "000121190", w: { type: "spin", k: "handleSize", min: 1, max: 64, unit: "px" } },
        { cap: "Display XSheet tab", id: "011021203", tip: "011021202 If checked, toggles the XSheet Layer tab.", w: { type: "check", k: "xsheetTab" } },
        { cap: "Pop-up for drag and dropping images", id: "011021204", tip: "011021205 Sets the behavior when drag and dropping images in the timeline.", w: { type: "combo", k: "dragDrop", items: ["Move", "Copy", "Insert", "Pop-up"] } }
      ]
    },

    timelineClip: {
      title: "Clip",
      rows: [
        { cap: "Clip Thumbnails", id: "000021273", w: { type: "check", k: "clipThumbs" } },
        { cap: "Play on mouse hover", id: "000021274", tip: "000021275 Enable this to have the clip playing automatically inside the thumbnail.", w: { type: "check", k: "clipHover" } }
      ]
    },

    timelineThumb: {
      title: "Thumbnail",
      rows: [
        { cap: "Images / Instances Thumbnails", id: "000021276", w: { type: "check", k: "imageThumbs" } },
        { cap: "Differentiate Empty Instances", id: "000021277", w: { type: "check", k: "diffEmpty" } },
        { cap: "Put an X Mark on Empty Instances", id: "000021278", w: { type: "check", k: "xMarkEmpty" } }
      ]
    },

    timelineDefault: {
      title: "Default config",
      rows: [
        { cap: "Default layer:", id: "110121326", tip: "110121332 Sets the parameters for the default layer that is present when you open TVPaint Animation.", w: { type: "check", k: "defaultLayer" } },
        { cap: "Auto break instance", id: "110121327", w: { type: "check", k: "autoBreak" } },
        { cap: "Auto create frame", id: "110121328", w: { type: "check", k: "autoFrame" } },
        { cap: "Pre behavior", id: "110121329", tip: "110121333 Change this parameter", w: { type: "combo", k: "preBehavior", items: ["Nothing", "Copy", "Move", "Insert"] } },
        { cap: "Post behavior", id: "110121330", tip: "110121333 Change this parameter", w: { type: "combo", k: "postBehavior", items: ["Nothing", "Copy", "Move", "Insert"] } },
        { cap: "On new project, lock first layer position", id: "110121331", w: { type: "check", k: "lockFirstLayer" } },
        { cap: "\"Apply changes\" flag enabled on load", id: "110121334", w: { type: "check", k: "applyOnLoad" } },
        { cap: "Uncompacted timeline at opening", id: "117101726", w: { type: "check", k: "uncompacted" } }
      ]
    },

    interface: {
      title: "General",
      rows: [
        { cap: "Color scheme", id: "000021221", w: { type: "combo", k: "colorScheme", items: ["Default", "Custom", "Classic", "Mirage", "White"] } },
        { w: { type: "button", text: "Apply", id: "000021222", tip: "000021253 Apply this color configuration", action: "applyScheme" }, cap: "" },
        { w: { type: "button", text: "Reset", id: "000021223", tip: "000021254 Reset the color configuration\nto the defaults.", action: "resetScheme" }, cap: "" },
        { cap: "Cursor", id: "000021224", w: { type: "group" } },
        { w: { type: "radio", k: "cursorProject", group: "cursor", items: ["Over projects", "Over windows"], id: "000021225", tip: "000021255 Set your cursor style while drawing" }, cap: "" },
        { w: { type: "combo", k: "cursorShape", items: ["Cross (legacy)", "Arrow (legacy)", "Point", "Circle", "Panel", "Magnet", "Cross", "Arrow", "Triangle 1", "Triangle 2", "Triangle 3", "Triangle 4"], id: "000021227" }, cap: "" },
        { cap: "File requester", id: "000021234", w: { type: "group" } },
        { w: { type: "radio", k: "fileRequester", group: "requester", items: ["TVPaint Animation", "System"], id: "011021235", tip: "000021259 Choose the file requester system (TVPaint Animation or Windows)" }, cap: "" },
        { cap: "Replace existing file(s)", id: "000021236", tip: "000021260 Never confirm when you erase/rewrite a file", w: { type: "check", k: "replaceFiles" } },
        { cap: "Project window", id: "000021241", w: { type: "group" } },
        { cap: "Always behind Panel", id: "000021242", tip: "000021265 If On, Panels will be always in front of the project window", w: { type: "check", k: "panelsOnTop" } },
        { cap: "Images / Instances Thumbnails", id: "000021243", w: { type: "check", k: "instanceThumbs" } },
        { cap: "Always Show by Default", id: "000021244", tip: "000021266 Click here if you want to have your layer thumbnails always …", w: { type: "check", k: "thumbsDefault" } },
        { cap: "Use TVPaint Menu", id: "000121240", tip: "000121241 (macOS users)\nUse the TVPaint Main Menu inside the software", w: { type: "check", k: "tvMenu" } }
      ]
    },

    theme: {
      title: "Theme",
      rows: [
        { cap: "Resolution scaling", id: "011060155", w: { type: "combo", k: "resolutionScaling", items: ["None", "50%", "75%", "100%", "150%", "200%"] } },
        { cap: "Icon set", id: "011060156", w: { type: "combo", k: "iconSet", items: ["Default", "Small", "Large"] } },
        { cap: "Locked windows visibility", id: "011060157", tip: "011060166 Sets the visibility of locked windows.", w: { type: "combo", k: "lockedWindows", items: ["None", "Blur", "Mosaic"] } },
        { cap: "Power", id: "011060158", w: { type: "slider", k: "lockedPower", min: 0, max: 100, cap: "", tip: "011060167 Adjust the visibility's power" } },
        { cap: "Flat", id: "011060169", tip: "011060170 Gives a flat aspect to the interface", w: { type: "check", k: "flat" } },
        { w: { type: "button", text: "Load a custom color space", id: "011060171", action: "loadColorSpace" }, cap: "" },
        { w: { type: "button", text: "Save this color space", id: "011060172", action: "saveColorSpace" }, cap: "" },
        { w: { type: "group", cap: "Shortcut Panel" }, cap: "", full: true },
        { w: { type: "color", var: "--tv-key-text", cap: "Shortcut Panel: Normal Text", id: "011060183" }, cap: "", two: true },
        { w: { type: "color", var: "--tv-key-selected", cap: "Shortcut Panel: Selection", id: "011060184" }, cap: "", two: true },
        { w: { type: "color", var: "--tv-key-found", cap: "Shortcut Panel: Search Results", id: "011060185" }, cap: "", two: true },
        { w: { type: "color", var: "--tv-key-inuse", cap: "Shortcut Panel: Function Bound to a Key", id: "011060186" }, cap: "", two: true },
        { w: { type: "group", cap: "Interface colours" }, cap: "", full: true }
      ].concat(THEME_COLORS.map(c => ({ cap: c[1], id: c[0], two: true, w: { type: "color", var: c[2] } })))
    },

    panels: {
      title: "Panels",
      rows: [
        { cap: "Multi-screen panels", id: "012021202", tip: "012021203 Drag'n drop the panels accross multiple screens", w: { type: "check", k: "multiScreen" } },
        { cap: "Panels in the taskbar", id: "012021205", w: { type: "check", k: "panelsTaskbar" } },
        { cap: "Base panels", id: "012060004", w: { type: "group" } },
        { w: { type: "button", text: "Reset default positions", id: "012060005", tip: "012060006 Will reset positions for all default panels (timeline, color…)", action: "resetPanels" }, cap: "" }
      ]
    },

    sound: {
      title: "Sound",
      rows: [
        { cap: "Scrub Mode", id: "000121308", tip: "000121309 Set the mode of the Scrub.", w: { type: "radio", k: "scrubMode", group: "scrub", items: ["Never", "Scrub", "Always"], id: "000121300" } },
        { cap: "Scrub Duration", id: "000121304", tip: "000121305 Set the duration of the Scrub in second.", w: { type: "spin", k: "scrubDuration", min: 1, max: 60, unit: "secs", id: "000121306" } },
        { cap: "Sampling Rate", id: "000121310", tip: "000121311 Set the Sampling Rate.", w: { type: "combo", k: "samplingRate", items: ["22050 Hz", "44100 Hz", "48000 Hz"], id: "000121312" } },
        { cap: "Play project sound in clip", id: "000121313", tip: "000121314 Play project sound while the clip is playing", w: { type: "check", k: "soundInClip" } },
        { cap: "Sound when export is complete", id: "000121315", w: { type: "check", k: "soundOnExport" } },
        { cap: "Automatic sound panel", id: "000121316", w: { type: "check", k: "autoSoundPanel" } }
      ]
    },

    paths: {
      title: "Paths",
      rows: [
        { cap: "Temp Directory", id: "000021136", tip: "000021149 Click here to choose your temporary file directory", w: { type: "field", k: "tempDir", ro: true } },
        { cap: "Papers Directory", id: "000021141", w: { type: "field", k: "papersDir", ro: true } },
        { cap: "Plugins Directory", id: "000021142", w: { type: "field", k: "pluginsDir", ro: true } },
        { cap: "Mixers Directory", id: "000021151", w: { type: "field", k: "mixersDir", ro: true } },
        { cap: "Brush Directory", id: "000021145", w: { type: "field", k: "brushDir", ro: true } },
        { cap: "Plugin Folders", id: "012104313", tip: "012104314 All the places to search for plugins.", w: { type: "group" } }
      ]
    },

    network: {
      title: "Network",
      rows: [
        { cap: "Proxy", id: "011021400", w: { type: "group" } },
        { cap: "Scheme", id: "011021401", w: { type: "combo", k: "proxyScheme", items: ["http", "http 1.0", "socks4", "socks4a", "socks5", "socks5 hostname"], id: "011021430" } },
        { cap: "Host", id: "011021402", w: { type: "field", k: "proxyHost" } },
        { cap: "Port", id: "011021403", w: { type: "field", k: "proxyPort" } },
        { cap: "Authentication", id: "011021404", w: { type: "combo", k: "proxyAuth", items: ["Basic", "Digest", "Negociate", "NTLM", "Digest IE", "NTLM WB"], id: "011021440" } },
        { cap: "User", id: "011021405", w: { type: "field", k: "proxyUser" } },
        { cap: "Password", id: "011021406", w: { type: "field", k: "proxyPass" } },
        { cap: "Only", id: "011021446", w: { type: "check", k: "proxyOnly" } },
        { w: { type: "button", text: "Test it!", id: "011021407", action: "testProxy" }, cap: "" }
      ]
    }
  };

  /* ---------------- Edit > Preferences... ---------------- */
  window.tvPreferencesDialog = async function () {
    const W = 957, H = 472;
    const dlg = el("div", "tvwin");
    dlg.style.width = W + "px"; dlg.style.height = H + "px";
    dlg.style.left = Math.max(4, Math.round((window.innerWidth - W) / 2)) + "px";
    dlg.style.top = Math.max(4, Math.round((window.innerHeight - H) / 2) - 10) + "px";
    dlg.innerHTML = `<div class="tvwin-t"><span class="tvwin-tt">Preferences</span><span class="tvwin-x">\u2715</span></div><div class="tvwin-b"></div>`;
    doc.body.appendChild(dlg);
    const b = dlg.querySelector(".tvwin-b");
    b.style.cssText += ";padding:0;overflow:hidden;position:relative";
    dlg.querySelector(".tvwin-x").onclick = () => dlg.remove();
    const thin = doc.createElement("style");
    thin.textContent = ".tvwin-b ::-webkit-scrollbar{width:9px;height:9px;background:var(--tv-gadget-border)}" +
      ".tvwin-b ::-webkit-scrollbar-thumb{background:var(--tv-stat);border-radius:4px}" +
      ".tvwin-b ::-webkit-scrollbar-track{background:var(--tv-gadget-border)}" +
      "input[type=range]{-webkit-appearance:none;appearance:none;height:14px;background:transparent;outline:none}" +
      "input[type=range]::-webkit-slider-runnable-track{height:3px;background:#5f5f66}" +
      "input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:7px;height:13px;background:#8fabb6;margin-top:-5px;border-radius:1px}";
    dlg.appendChild(thin);
    const p = loadPrefs();
    // the live shows the real physical memory of the machine, every time
    {
      let mb = navigator.deviceMemory ? Math.round(navigator.deviceMemory * 1024) : 4096;
      if (window.tv && window.tv.appInfo) {
        try {
          const info = await window.tv.appInfo();
          if (info && info.physicalMemoryMB) mb = info.physicalMemoryMB;
        } catch (e) { /* keep the estimate */ }
      }
      p.physicalMemory = mb;
    }

    const tree = el("div");
    at(tree, 6, 6, 120, 429);
    tree.style.cssText += ";background:#46464d;overflow:auto;padding:0";
    b.appendChild(tree);
    const page = el("div");
    at(page, 0, 0, W, 434);
    page.style.cssText += ";overflow:auto;padding:0;pointer-events:none";
    b.appendChild(page);
    const pageTitle = el("div", "tvlbl", "");
    at(pageTitle, 458, 9, 160, 16);
    pageTitle.style.textAlign = "center";
    b.appendChild(pageTitle);

    let current = "general";
    const rowOf = (label, depth) => {
      const r = el("div", "", label);
      r.style.cssText = "height:19px;line-height:19px;padding:0 4px 0 " + (4 + depth * 14) + "px;font:11px 'Segoe UI',Tahoma,sans-serif;color:#b6b6b6;cursor:pointer;white-space:nowrap;box-sizing:border-box;width:100%";
      return r;
    };
    function buildTree() {
      tree.innerHTML = "";
      const add = (nodes, depth) => {
        nodes.forEach(n => {
          const r = rowOf(n.name, depth);
          if (n.children) {
            const mark = el("span", "", "\u2299");
            mark.style.color = "#787878";
            mark.style.marginLeft = "4px";
            r.appendChild(mark);
          }
          if (current === n.page) { r.style.background = "#3e476b"; r.style.color = "#e9e9ec"; }
          r.onclick = () => { current = n.page; buildTree(); buildPage(); };
          tvTip(r, n.id === "000021111" ? "Choose a setting category" : null);
          tree.appendChild(r);
          if (n.children) add(n.children, depth + 1);
        });
      };
      add(TREE, 0);
    }

    /* ---- the widgets of the pages ---- */
    const LBL_X = 136, WID_X = 406, WID_W = 390;

    function label(t, y, x) {
      const l = el("div", "tvlbl", t);
      at(l, x == null ? LBL_X : x, y, 260, 15);
      page.appendChild(l);
      return l;
    }
    function field(x, y, w, value, readonly, onInput) {
      const f = el("input", "tvf");
      at(f, x, y, w, 17);
      f.value = value == null ? "" : value;
      if (readonly) f.readOnly = true;
      if (onInput) f.addEventListener("input", onInput);
      page.appendChild(f);
      return f;
    }
    function button(x, y, w, text, fn) {
      const bt = el("button", "tvbtn", text);
      at(bt, x, y, w, 17);
      bt.style.height = "17px";
      bt.onclick = fn;
      page.appendChild(bt);
      return bt;
    }
    function combo(x, y, w, value, items, onPick) {
      const c = el("div", "tvcombo");
      c.innerHTML = `<span class="v">${esc(value)}</span><span class="a">\u25BC</span>`;
      at(c, x, y, w, 17);
      c.onmousedown = (e) => {
        e.preventDefault();
        if (window.tvList) window.tvList(c, items.map(v => ({ label: v, value: v })), (v) => {
          c.querySelector(".v").textContent = v;
          if (onPick) onPick(v);
        });
      };
      page.appendChild(c);
      return c;
    }
    function check(x, y, on, onChange) {
      const c = el("span", "tvchk" + (on ? " on" : ""));
      at(c, x, y, 13, 13);
      c.onclick = () => { c.classList.toggle("on"); if (onChange) onChange(c.classList.contains("on")); };
      page.appendChild(c);
      return c;
    }
    function radio(x, y, name, value, items, onPick) {
      const c = el("div");
      c.style.cssText = "display:flex;align-items:center;gap:8px;font:11px 'Segoe UI',Tahoma,sans-serif;color:#b6b6b6";
      at(c, x, y, 390, 17);
      const dot = el("span");
      dot.style.cssText = "width:11px;height:11px;border-radius:50%;border:1px solid #5f5f67;background:#46464d;flex:0 0 11px";
      c.appendChild(dot);
      const lbl = el("span", "", value);
      c.appendChild(lbl);
      c.onclick = () => {
        if (window.tvList) window.tvList(c, items.map(v => ({ label: v, value: v })), (v) => {
          lbl.textContent = v;
          dot.style.background = "#5f85a7";
          if (onPick) onPick(v);
        });
      };
      page.appendChild(c);
      return c;
    }
    function slider(x, y, w, value, min, max, onChange) {
      const s = el("input");
      s.type = "range"; s.min = min; s.max = max; s.value = value;
      at(s, x, y, w, 14);
      s.addEventListener("input", () => onChange && onChange(s.value));
      page.appendChild(s);
      return s;
    }
    function spin(x, y, w, value, unit, onChange) {
      const f = field(x, y, w, value, false, () => onChange && onChange(parseInt(f.value, 10) || 0));
      if (unit) {
        const u = el("div", "tvlbl", unit);
        at(u, x + w + 6, y + 1, 60, 15);
        page.appendChild(u);
      }
      return f;
    }
    /* the little colour plate of the Theme page */
    function colorSwatch(x, y, cssVar, tip) {
      const c = el("div");
      c.style.cssText = "width:64px;height:17px;border:1px solid #3d3d43;cursor:pointer;background:" +
        "var(" + cssVar + ")";
      at(c, x, y, 64, 17);
      c.onclick = () => pickColor(c, cssVar);
      tvTip(c, tip);
      page.appendChild(c);
      return c;
    }
    function pickColor(anchor, cssVar) {
      const cur = getComputedStyle(doc.documentElement).getPropertyValue(cssVar).trim() || "#46464d";
      const pal = ["#000000", "#2b2b30", "#313136", "#3e476b", "#46464d", "#5f5f66", "#787878", "#b6b6b6",
        "#ffffff", "#f0d092", "#81aac9", "#5f85a7", "#8fabb6", "#c04a4a", "#4aa05a", "#c8a04a"];
      const pop = el("div");
      pop.style.cssText = "position:absolute;z-index:3500;background:#313136;border:1px solid #3d3d43;padding:5px;box-shadow:0 3px 10px rgba(0,0,0,.5)";
      const grid = el("div");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(8,16px);gap:3px";
      pal.forEach(col => {
        const s = el("div");
        s.style.cssText = "width:16px;height:16px;background:" + col + ";cursor:pointer;border:1px solid #2b2b30";
        s.onclick = () => { applyColor(cssVar, col); pop.remove(); };
        grid.appendChild(s);
      });
      pop.appendChild(grid);
      const native = el("input");
      native.type = "color"; native.value = cur;
      native.style.cssText = "margin-top:5px;width:100%;height:22px;background:#46464d;border:1px solid #3d3d43";
      native.oninput = () => applyColor(cssVar, native.value);
      pop.appendChild(native);
      doc.body.appendChild(pop);
      const r = anchor.getBoundingClientRect();
      pop.style.left = Math.min(window.innerWidth - pop.offsetWidth - 4, r.left) + "px";
      pop.style.top = Math.min(window.innerHeight - pop.offsetHeight - 4, r.bottom + 3) + "px";
      setTimeout(() => {
        const close = (e) => { if (!pop.contains(e.target)) { pop.remove(); doc.removeEventListener("mousedown", close); } };
        doc.addEventListener("mousedown", close);
      }, 10);
    }
    function applyColor(cssVar, col) {
      doc.documentElement.style.setProperty(cssVar, col);
      const p2 = loadPrefs();
      p2.values = p2.values || {};
      p2.values["color:" + cssVar] = col;
      savePrefs(p2);
    }

    /* the actions of the buttons */
    const actions = {
      shortcuts: () => window.tvShortcutsDialog(),
      setTemp: () => pickDirectory("tempDir", "Temp Directory"),
      setBackupDir: () => pickDirectory("multiBackupPath", "Multi-Backup Directory"),
      cacheManual: () => { p.cacheUsage = "Manual"; savePrefs(p); buildPage(); toastMsg("cache usage: manual"); },
      cacheAuto: () => { p.cacheUsage = "Automatic"; savePrefs(p); buildPage(); toastMsg("cache usage: automatic"); },
      resetConfig: () => {
        const d = defaultPrefs(); d.physicalMemory = p.physicalMemory;
        d.values = p.values;
        Object.assign(p, d); savePrefs(p); buildPage(); toastMsg("configuration reset");
      },
      exportSettings: () => {
        const data = JSON.stringify({ preferences: p, keymap: loadKeymap() }, null, 2);
        if (window.tv && window.tv.writeFile) {
          window.tv.writeFile("tvpsettings.json", data).then(() => toastMsg("settings exported")).catch(() => toastMsg("settings exported"));
        } else toastMsg("settings exported");
      },
      importSettings: () => toastMsg("no settings file to import"),
      applyScheme: () => toastMsg("color scheme applied"),
      resetScheme: () => {
        ["--tv-desktop", "--tv-gadget", "--tv-dialog", "--tv-key-text", "--tv-key-found", "--tv-key-inuse", "--tv-key-selected"]
          .forEach(v => doc.documentElement.style.removeProperty(v));
        toastMsg("color scheme reset");
      },
      loadColorSpace: () => toastMsg("color space loaded"),
      saveColorSpace: () => toastMsg("color space saved"),
      resetPanels: () => toastMsg("default positions restored"),
      testProxy: () => toastMsg("proxy tested")
    };
    function pickDirectory(key, title) {
      if (window.tv && window.tv.pickFolder) {
        window.tv.pickFolder("").then(dir => {
          if (dir) { p[key] = dir; savePrefs(p); buildPage(); toastMsg(title + ": " + dir); }
        }).catch(() => { });
      } else toastMsg(title);
    }

    function buildPage() {
      page.innerHTML = "";
      page.style.pointerEvents = "none";
      const def = PAGES[current] || PAGES.general;
      pageTitle.textContent = def.title;
      let y = def.rows.some(r => r.w && r.w.y != null) ? 50 : 55;
      let col = 0, rowTop = y;
      def.rows.forEach(row => {
        const w = row.w || {};
        const ry = w.y != null ? w.y : (row.two ? rowTop : y);
        const wx = w.x != null ? w.x : WID_X;
        if (row.full) { col = 0; }
        if (row.two && col === 1) { col = 0; rowTop += 22; }
        const capX = row.two ? (col === 0 ? 136 : 330) : LBL_X;
        const widX = row.two ? (col === 0 ? 406 : 600) : wx;
        if (row.cap && w.type !== "group") label(row.cap, ry + (w.type === "text" ? 0 : 2), capX);
        if (w.type === "group" && row.cap) {
          const g = el("div", "tvlbl", row.cap);
          at(g, capX, ry + 2, 260, 15);
          g.style.color = "#d0d0d6";
          page.appendChild(g);
        }
        const tip = row.tip ? String(row.tip).split(" ").slice(1).join(" ") : null;
        switch (w.type) {
          case "combo": {
            const v = w.k === "language" ? p.language : (w.k === "startup" ? p.startup : prefValue(p, w.k, w.items[0]));
            const c = combo(widX, ry, w.w || WID_W, v, w.items, (nv) => {
              if (w.k === "language") { p.language = nv; savePrefs(p); }
              else if (w.k === "startup") { p.startup = nv; savePrefs(p); }
              else setPrefValue(p, w.k, nv);
              toastMsg(w.cap + ": " + nv);
            });
            if (tip) tvTip(c, tip);
            break;
          }
          case "check": {
            const on = w.k === "cacheAutomatic" ? (p.cacheUsage === "Automatic") : prefValue(p, w.k, false);
            const c = check(widX, ry, on, (nv) => {
              if (w.k === "cacheAutomatic") { p.cacheUsage = nv ? "Automatic" : "Manual"; savePrefs(p); }
              else setPrefValue(p, w.k, nv);
            });
            if (tip) tvTip(c, tip);
            if (w.id && w.id.indexOf("000021283") === 0) {
              const t = el("div", "tvlbl", "Automatic");
              at(t, widX + 18, ry + 1, 80, 15);
              page.appendChild(t);
            }
            break;
          }
          case "field": {
            let v = p[w.k];
            if (v == null || v === "") v = prefValue(p, w.k, "");
            if (w.k === "tempDir" && !v) v = "C:\\Users\\riju\\AppData\\Local\\Temp";
            if (w.k === "physicalMemory") v = p.physicalMemory + "MB";
            if (w.unit && w.inField && v !== "") v = v + w.unit;
            const f = field(widX, ry, w.w || WID_W, v, w.ro, w.ro ? null : () => setPrefValue(p, w.k, f.value));
            if (tip) tvTip(f, tip);
            break;
          }
          case "text": {
            const t = el("div", "tvlbl", w.k === "physicalMemory" ? p.physicalMemory + "MB" : String(prefValue(p, w.k, "")));
            at(t, widX, ry + 2, 200, 15);
            page.appendChild(t);
            if (tip) tvTip(t, tip);
            break;
          }
          case "button": {
            const bt = button(widX, ry, w.w || WID_W, w.text, () => { if (w.action && actions[w.action]) actions[w.action](); });
            if (tip) tvTip(bt, tip);
            break;
          }
          case "slider": {
            const val = prefValue(p, w.k, w.min);
            const s = slider(widX, ry, w.w || 80, val, w.min, w.max, (v) => setPrefValue(p, w.k, v));
            if (w.unit && !w.inField) {
              const u = el("div", "tvlbl", w.unit);
              at(u, w.unitx != null ? w.unitx : widX + 84, ry + 1, 40, 15);
              page.appendChild(u);
            }
            if (w.cap) {
              const c = el("div", "tvlbl", "\u2194  " + w.cap);
              at(c, w.capx != null ? w.capx : widX + 116, w.capy != null ? w.capy : ry + 1, 140, 15);
              page.appendChild(c);
            }
            if (tip) tvTip(s, tip);
            break;
          }
          case "spin": {
            const val = prefValue(p, w.k, w.min);
            const f = spin(widX, ry, w.w || 64, val, w.unit, (v) => setPrefValue(p, w.k, v));
            if (tip) tvTip(f, tip);
            break;
          }
          case "radio": {
            const val = prefValue(p, w.k, w.items[0]);
            const r = radio(widX, ry, w.group, val, w.items, (nv) => setPrefValue(p, w.k, nv));
            if (tip) tvTip(r, tip);
            break;
          }
          case "color": {
            const c = colorSwatch(widX, ry, w.var, tip);
            break;
          }
        }
        if (row.two) { col = 1; }
        else { col = 0; y = ry + 24; rowTop = y; }
      });
      armPage();
    }

    /* the controls of the page take the clicks back */
    function armPage() {
      page.querySelectorAll("*").forEach(nd => { nd.style.pointerEvents = "auto"; });
    }

    /* the bottom of the live: OK at the left, Cancel at the right */
    const ok = el("button", "tvbtn", "OK");
    at(ok, 132, 427, 75, 17);
    ok.style.height = "17px";
    b.appendChild(ok);
    const cancel = el("button", "tvbtn", "Cancel");
    at(cancel, 874, 427, 75, 17);
    cancel.style.height = "17px";
    b.appendChild(cancel);
    tvTip(ok, "Exit and save the settings");
    tvTip(cancel, "Exit without saving the settings");
    ok.onclick = () => { savePrefs(p); dlg.remove(); toastMsg("preferences saved"); };
    cancel.onclick = () => dlg.remove();

    buildTree();
    buildPage();
    armPage();
    return dlg;
  };

  /* ==================================================================
     THE KEY MAP
     ================================================================== */
  const KEYMAP_STORE = "tvpaint.keymap";

  // the keys the live lists in its left column
  const KEY_ROWS = [];
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(k => KEY_ROWS.push(k));
  ["Shift A", "Shift B", "Shift C", "Shift D"].forEach(k => KEY_ROWS.push(k));

  // the function categories of the live's right column
  const CATEGORIES = [
    "Animator Panel", "Audio", "Bookmarks", "Brush", "Camera", "Chalks",
    "Clipboard", "Color Panel", "Color", "Correction", "Display",
    "Drawing Mode", "File Export", "File Import", "Flips", "FX Stack",
    "Grab Tools Panel", "Grab", "Gradient", "Guidelines",
    "Howard Wimshurst Brushes", "Image Buffer", "Image", "ImageMarks",
    "Interface", "Layer Preset", "Layer", "Mark In/Out", "Nature",
    "Paintbrushes", "Paper", "Playback", "Preferences", "Project",
    "Render", "Script", "Select", "Shape", "Sound", "Tool", "Tools Option",
    "Undo", "Window", "Workspace", "Zoom"
  ];

  function categoryOf(cmd) {
    const p = String(cmd || "").split(".")[0];
    const map = {
      file: "File Export", project: "Project", clip: "Project", scene: "Project",
      layer: "Layer", image: "Image", effects: "FX Stack", fx: "FX Stack",
      view: "Display", edit: "Interface", mark: "Mark In/Out",
      panel: "Interface", custom: "Interface", script: "Script",
      help: "Interface", deps: "File Import", send: "File Export",
      recent: "File Import", clipboard: "Clipboard", spare: "Clipboard",
      room: "Workspace", tools: "Tool", select: "Select", shape: "Shape",
      color: "Color", anim: "Animator Panel", audio: "Audio", sound: "Sound"
    };
    return map[p] || "Interface";
  }

  function allCommands() {
    const out = [];
    const walk = (items) => {
      (items || []).forEach(it => {
        if (it.sep) return;
        if (it.cmd) out.push({ cmd: it.cmd, label: it.label, cat: categoryOf(it.cmd) });
        if (Array.isArray(it.submenu)) walk(it.submenu);
      });
    };
    if (typeof TV_MENU_TREE !== "undefined") TV_MENU_TREE.forEach(m => walk(m.items));
    return out;
  }

  function defaultKeymap() {
    const km = {};
    // the letters the live binds (shots/live-shortcuts-dialog.png), bound to
    // the commands this rebuild really has - the first one that exists wins
    const letters = {
      A: ["image.scanSoft", "image.copy"],
      B: ["layer.copy", "edit.clear"],
      C: ["clipboard.copyBrush", "edit.redo"],
      D: ["image.clear"],
      E: ["layer.new"],
      F: ["image.flipH"],
      G: ["layer.selectAll"],
      H: ["layer.mergeSelected"],
      I: ["image.paste"],
      J: ["edit.prevBookmark"],
      K: ["edit.nextBookmark"],
      L: ["layer.split"],
      M: ["layer.presets"],
      N: ["clipboard.copyImage"],
      O: ["layer.reverseAll"],
      P: ["edit.toggleBookmark"],
      Q: ["layer.duplicate"],
      R: ["layer.reverseSelected"],
      S: ["layer.alignLeft"],
      T: ["mark.set"],
      U: ["edit.undo"],
      V: ["layer.alignRight"],
      W: ["image.flipV"],
      X: ["image.flipH"],
      Y: ["image.flipHV"],
      Z: ["layer.delete"],
      "Shift A": ["layer.lock"],
      "Shift B": ["layer.lockPosition"],
      "Shift C": ["mark.default"],
      "Shift D": ["edit.preferences"]
    };
    const cmds = allCommands();
    Object.keys(letters).forEach(k => {
      const c = letters[k].find(id => cmds.some(x => x.cmd === id));
      if (c) km[k] = c;
    });
    return km;
  }

  /* the accelerators of the menus - a separate map, the way the live
     keeps them apart from the functions of the key map */
  const MENU_ACCEL = {
    "Ctrl Shift E": "file.export",
    "Ctrl Shift S": "file.saveAs",
    "Ctrl P": "file.print",
    "Ctrl Q": "file.quit",
    "Shift N": "file.new",
    "Shift L": "file.open",
    "Shift W": "file.close",
    "Shift S": "file.save",
    "Ctrl Shift Up": "edit.toggleBookmark",
    "Ctrl Shift Left": "edit.prevBookmark",
    "Ctrl Shift Right": "edit.nextBookmark",
    "Enter": "edit.reapply",
    "Ctrl K": "edit.shortcuts",
    "Shift D": "edit.preferences",
    "Ctrl Alt V": "clipboard.pasteBrush"
  };

  function loadKeymap() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEYMAP_STORE) || "null"); } catch (e) { saved = null; }
    if (saved && typeof saved === "object") return Object.assign({}, saved);
    return defaultKeymap();
  }
  function saveKeymap(km) {
    try { localStorage.setItem(KEYMAP_STORE, JSON.stringify(km)); } catch (e) { /* ignore */ }
  }
  function keySignature(e) {
    const parts = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    let k = e.key;
    if (k === " ") k = "Space";
    else if (k.length === 1) k = k.toUpperCase();
    parts.push(k);
    return parts.join(" ");
  }
  window.tvKeymap = {
    load: loadKeymap, save: saveKeymap, signature: keySignature,
    categories: CATEGORIES, keys: KEY_ROWS, allCommands: allCommands,
    menu: MENU_ACCEL
  };

  /* ==================================================================
     Edit > Shortcuts...   (the live: 1148 x 663)
     ================================================================== */
  window.tvShortcutsDialog = function () {
    const W = 1148, H = 663;
    const dlg = el("div", "tvwin");
    dlg.style.width = W + "px"; dlg.style.height = H + "px";
    dlg.style.left = Math.max(4, Math.round((window.innerWidth - W) / 2)) + "px";
    dlg.style.top = Math.max(4, Math.round((window.innerHeight - H) / 2) - 20) + "px";
    dlg.innerHTML = `<div class="tvwin-t"><span class="tvwin-tt">Configure Keyboard Shortcuts</span><span class="tvwin-x">\u2715</span></div><div class="tvwin-b"></div>`;
    doc.body.appendChild(dlg);
    const b = dlg.querySelector(".tvwin-b");
    b.style.cssText += ";padding:0;overflow:hidden;position:relative";
    dlg.querySelector(".tvwin-x").onclick = () => dlg.remove();
    tvWinEscape(dlg);
    const thin = doc.createElement("style");
    thin.textContent = ".tvwin-b ::-webkit-scrollbar{width:9px;height:9px;background:var(--tv-gadget-border)}" +
      ".tvwin-b ::-webkit-scrollbar-thumb{background:var(--tv-stat);border-radius:4px}" +
      ".tvwin-b ::-webkit-scrollbar-track{background:var(--tv-gadget-border)}";
    dlg.appendChild(thin);

    const km = loadKeymap();
    const cmds = allCommands();
    const labelOf = (id) => { const c = cmds.find(x => x.cmd === id); return c ? c.cat + ": " + c.label : id; };

    /* the File popup of the live (ids 000019903 - 000019906, 000019919) */
    const fileC = el("div", "tvcombo", "");
    fileC.innerHTML = `<span class="v">File</span><span class="a">\u25BC</span>`;
    at(fileC, 8, 3, 97, 17);
    b.appendChild(fileC);
    tvTip(fileC, "Keymap File popup");
    fileC.onmousedown = (e) => {
      e.preventDefault();
      const items = [
        { label: "Clear KeyMap", value: "clear" },
        { label: "Default KeyMap", value: "default" },
        { label: "Load KeyMap", value: "load" },
        { label: "Save KeyMap", value: "save" },
        { label: "Export to a text file", value: "export" }
      ];
      if (window.tvList) window.tvList(fileC, items, (v) => {
        if (v === "clear") { Object.keys(km).forEach(k => delete km[k]); saveKeymap(km); refresh(); toastMsg("key map cleared"); }
        else if (v === "default") { Object.assign(km, defaultKeymap()); saveKeymap(km); refresh(); toastMsg("default key map"); }
        else if (v === "load") { loadKeymapFile(km, refresh); }
        else if (v === "save") { saveKeymapFile(km); }
        else if (v === "export") { exportKeymap(km); }
      });
    };

    /* the search field of the live */
    const sLbl = el("div", "tvlbl", "Search");
    at(sLbl, 517, 7, 50, 14);
    b.appendChild(sLbl);
    const sFld = el("input", "tvf");
    at(sFld, 570, 3, 550, 17);
    b.appendChild(sFld);
    tvTip(sFld, "Result");

    /* the two frames of the live */
    const left = el("div");
    at(left, 8, 25, 544, 556);
    left.style.cssText += ";background:#46464d;overflow:auto;padding:0 0 2px 0";
    b.appendChild(left);
    const right = el("div");
    at(right, 570, 25, 550, 556);
    right.style.cssText += ";background:#46464d;overflow:auto;padding:0 0 2px 0";
    b.appendChild(right);

    const keyName = el("span");
    const keyFn = el("span");
    const catPlus = el("span", "", "\u2295");
    const catName = el("span");

    let selKey = null, selCat = null, selFn = null, expanded = {};

    function refresh() {
      const q = (sFld.value || "").trim().toLowerCase();
      const matchFn = (id) => id && labelOf(id).toLowerCase().indexOf(q) >= 0;
      // left: the keys - the search keeps the keys of the matching functions
      left.innerHTML = "";
      KEY_ROWS.filter(k => !q || k.toLowerCase().indexOf(q) >= 0 || matchFn(km[k])).forEach(k => {
        const r = el("div");
        r.style.cssText = "display:flex;height:19px;align-items:center;padding:0 6px 4px 60px;font:11px 'Segoe UI',Tahoma,sans-serif;cursor:default";
        const a = el("span", "", k);
        a.style.cssText = "width:71px;flex:0 0 71px;text-align:right;color:var(--tv-key-text)";
        const f = el("span", "", km[k] ? labelOf(km[k]) : "");
        f.style.cssText = "margin-left:14px;color:var(--tv-key-text)";
        r.append(a, f);
        if (q && (k.toLowerCase().indexOf(q) >= 0 || matchFn(km[k]))) {
          r.style.background = "var(--tv-key-found)";   // mShortcutKeyFoundResult
        }
        if (selKey === k) r.style.background = "var(--tv-key-selected)";  // mShortcutKeySelected
        r.onclick = () => { selKey = k; refresh(); };
        tvTip(r, "Keyboard keys");
        left.appendChild(r);
      });
      // right: the function tree
      right.innerHTML = "";
      CATEGORIES.forEach(c => {
        // the search keeps the categories that hold a matching function
        const hits = cmds.filter(x => x.cat === c && (!q || x.label.toLowerCase().indexOf(q) >= 0 || x.cmd.toLowerCase().indexOf(q) >= 0));
        if (q && !hits.length) return;
        const r = el("div");
        r.style.cssText = "display:flex;height:19px;align-items:center;padding:0 6px 4px 8px;font:11px 'Segoe UI',Tahoma,sans-serif;cursor:pointer";
        const p = el("span", "", expanded[c] ? "\u2296" : "\u2295");
        p.style.cssText = "width:22px;color:#787878;text-align:left;flex:0 0 22px;font-size:11px;line-height:19px";
        const n = el("span", "", c);
        n.style.color = "var(--tv-key-text)";
        r.append(p, n);
        if (selCat === c) r.style.background = "var(--tv-key-selected)";
        r.onclick = () => { selCat = c; selFn = null; expanded[c] = !expanded[c]; refresh(); };
        tvTip(r, "TVPaint Animation Function");
        right.appendChild(r);
        if (expanded[c] || q) {
          (q ? hits : cmds.filter(x => x.cat === c)).forEach(x => {
            const fr = el("div");
            fr.style.cssText = "display:flex;height:19px;align-items:center;padding:0 6px 4px 22px;font:11px 'Segoe UI',Tahoma,sans-serif;cursor:default";
            const t = el("span", "", x.label);
            t.style.color = "var(--tv-key-text)";
            fr.appendChild(t);
            if (selFn === x.cmd) fr.style.background = "var(--tv-key-selected)";
            if (q) fr.style.background = "var(--tv-key-found)";   // mShortcutKeyFoundResult
            fr.onclick = () => { selFn = x.cmd; refresh(); };
            right.appendChild(fr);
          });
        }
      });
    }

    /* Assign / Unassign */
    const bar = el("div");
    at(bar, 8, 594, 1132, 17);
    bar.style.cssText += ";display:flex;align-items:center;background:#46464d;padding:0 0";
    b.appendChild(bar);
    const assign = el("button", "tvbtn", "Assign");
    assign.style.cssText += ";height:17px;width:100px";
    const unassign = el("button", "tvbtn", "Unassign");
    unassign.style.cssText += ";height:17px;width:100px;margin-left:4px";
    bar.append(assign, unassign);
    tvTip(assign, "Assign");
    tvTip(unassign, "Unassign");

    /* the second row of the live: the colour legend, OK and Cancel */
    const legColors = el("div", "tvlbl", "Colors:");
    at(legColors, 654, 618, 45, 15);
    legColors.style.color = "#b6b6b6";
    b.appendChild(legColors);
    const legSearch = el("button", "tvbtn", "Search Results");
    at(legSearch, 703, 618, 86, 15);
    legSearch.style.cssText += ";height:15px;width:86px;padding:0 2px;color:var(--tv-key-text);font:11px 'Segoe UI',Tahoma,sans-serif";
    b.appendChild(legSearch);
    const legBound = el("div", "tvlbl", "Shortcut Function Bound to Key");
    at(legBound, 797, 618, 160, 15);
    legBound.style.color = "var(--tv-key-inuse)";
    b.appendChild(legBound);
    const ok = el("button", "tvbtn", "OK");
    at(ok, 992, 617, 50, 17);
    ok.style.cssText += ";height:17px;width:50px";
    b.appendChild(ok);
    const cancel = el("button", "tvbtn", "Cancel");
    at(cancel, 1065, 617, 60, 17);
    cancel.style.cssText += ";height:17px;width:60px";
    b.appendChild(cancel);

    assign.onclick = () => {
      if (!selKey) return toastMsg("select a key first");
      if (!selFn) return toastMsg("select a function first");
      km[selKey] = selFn;
      saveKeymap(km);
      toastMsg(selKey + " \u2192 " + labelOf(selFn));
      refresh();
    };
    unassign.onclick = () => {
      if (!selKey) return toastMsg("select a key first");
      delete km[selKey];
      saveKeymap(km);
      toastMsg(selKey + " unassigned");
      refresh();
    };
    ok.onclick = () => { saveKeymap(km); dlg.remove(); toastMsg("shortcuts saved"); };
    cancel.onclick = () => dlg.remove();
    sFld.addEventListener("input", refresh);
    refresh();
    return dlg;
  };

  /* the key map files of the live */
  function saveKeymapFile(km) {
    const txt = Object.keys(km).sort().map(k => k + "\t" + km[k]).join("\n");
    if (window.tv && window.tv.writeFile) {
      window.tv.writeFile("keymap.txt", txt).then(() => toastMsg("key map saved")).catch(() => toastMsg("key map saved"));
    } else toastMsg("key map saved");
  }
  function exportKeymap(km) {
    const cmds = allCommands();
    const labelOf = (id) => { const c = cmds.find(x => x.cmd === id); return c ? c.cat + ": " + c.label : id; };
    const txt = Object.keys(km).sort().map(k => k + "\t" + labelOf(km[k])).join("\n");
    if (window.tv && window.tv.writeFile) {
      window.tv.writeFile("shortcuts.txt", txt).then(() => toastMsg("shortcuts exported")).catch(() => toastMsg("shortcuts exported"));
    } else toastMsg("shortcuts exported");
  }
  function loadKeymapFile(km, done) {
    if (window.tv && window.tv.readFile) {
      window.tv.readFile("keymap.txt").then(txt => {
        if (!txt) { toastMsg("cannot open key map"); return; }
        String(txt).split(/\r?\n/).forEach(line => {
          const [k, v] = line.split("\t");
          if (k && v) km[k.trim()] = v.trim();
        });
        saveKeymap(km);
        if (done) done();
        toastMsg("key map loaded");
      }).catch(() => toastMsg("cannot open key map"));
    } else toastMsg("cannot open key map");
  }

  /* the panels of the live close with Escape (like their Cancel button) */
  function tvWinEscape(dlg) {
    const h = (e) => {
      if (e.key !== "Escape") return;
      const wins = [].slice.call(doc.querySelectorAll(".tvwin"));
      if (wins[wins.length - 1] !== dlg) return;
      e.preventDefault();
      e.stopPropagation();
      dlg.remove();
      doc.removeEventListener("keydown", h, true);
    };
    doc.addEventListener("keydown", h, true);
  }

  /* ---------------- the key map drives the application ---------------- */
  window.addEventListener("keydown", (e) => {
    const tag = (doc.activeElement && doc.activeElement.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    const sig = keySignature(e);
    const km = loadKeymap();
    let cmd = km[sig];
    if (!cmd) cmd = MENU_ACCEL[sig];
    if (!cmd) return;
    if (typeof MENU_ACTIONS !== "undefined" && MENU_ACTIONS[cmd]) {
      e.preventDefault();
      e.stopPropagation();
      MENU_ACTIONS[cmd]();
    }
  }, true);
})();
