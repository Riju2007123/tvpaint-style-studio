/* ------------------------------------------------------------------
   prefs.js - the two panels of the Edit menu of TVPaint 12:

     Edit > Shortcuts...   ->  "Configure Keyboard Shortcuts"
     Edit > Preferences... ->  "Preferences"

   Both were captured live (shots/live-shortcuts-dialog.png,
   shots/live-preferences-dialog.png) and rebuilt on the same geometry:

   * Configure Keyboard Shortcuts (1148x663): a "File" combo and a
     "Search" field on the first line, the key column on the left, the
     function tree on the right, Assign / Unassign at the bottom left and
     the colour legend with OK / Cancel at the bottom right.
   * Preferences (957x472): a tree of pages on the left, the page on the
     right, OK at the bottom left and Cancel at the bottom right.

   The key map is real: what is assigned here is what the application
   answers to, and it is stored with the other settings.
   ------------------------------------------------------------------ */
(function () {
  const doc = document;

  /* ---------------- the key map ---------------- */
  const KEYMAP_STORE = "tvpaint.keymap";

  // the keys the live lists in its left column
  const KEY_ROWS = [];
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(k => KEY_ROWS.push(k));
  ["Shift A", "Shift B", "Shift C", "Shift D"].forEach(k => KEY_ROWS.push(k));

  // the function categories of the live's right column (captured live)
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

  // which category a command belongs to (the id prefix of the tree)
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

  // every command of the tree with its label
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
    // the accelerators of our own menus (live 11 Pro / 12)
    const add = (key, cmd) => { if (cmd) km[key] = cmd; };
    add("Ctrl Shift E", "file.export");
    add("Ctrl Shift S", "file.saveAs");
    add("Ctrl P", "file.print");
    add("Ctrl Q", "file.quit");
    add("Shift N", "file.new");
    add("Shift L", "file.open");
    add("Shift W", "file.close");
    add("Shift S", "file.save");
    add("Ctrl Shift Up", "edit.toggleBookmark");
    add("Ctrl Shift Left", "edit.prevBookmark");
    add("Ctrl Shift Right", "edit.nextBookmark");
    add("Enter", "edit.reapply");
    add("Ctrl K", "edit.shortcuts");
    add("Shift D", "edit.preferences");
    add("Ctrl Alt V", "clipboard.pasteBrush");
    add("Ctrl Shift V", "clipboard.pasteImage");
    add("Shift J", "spare.copy");
    // the letters the live binds (shots/live-shortcuts-dialog.png): the
    // function names of TVPaint mapped onto the commands of this rebuild
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

  function loadKeymap() {
    const def = defaultKeymap();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEYMAP_STORE) || "null"); } catch (e) { saved = null; }
    const km = Object.assign({}, def);
    if (saved && typeof saved === "object") Object.keys(saved).forEach(k => {
      if (saved[k]) km[k] = saved[k]; else delete km[k];
    });
    return km;
  }
  function saveKeymap(km) {
    try { localStorage.setItem(KEYMAP_STORE, JSON.stringify(km)); } catch (e) { /* ignore */ }
  }

  // the signature of a keyboard event, the way the live writes them
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

  /* ---------------- the Preferences store ---------------- */
  const PREF_STORE = "tvpaint.preferences";
  function defaultPrefs() {
    return {
      language: "English",
      tempDir: "",
      undoSize: 512,             // MB
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
      if (s && typeof s === "object") Object.keys(d).forEach(k => { if (s[k] !== undefined) d[k] = s[k]; });
    } catch (e) { /* ignore */ }
    return d;
  }
  function savePrefs(p) { try { localStorage.setItem(PREF_STORE, JSON.stringify(p)); } catch (e) { /* ignore */ } }
  window.tvPrefs = { load: loadPrefs, save: savePrefs, default: defaultPrefs };
  window.tvKeymap = { load: loadKeymap, save: saveKeymap, signature: keySignature, categories: CATEGORIES, keys: KEY_ROWS, allCommands: allCommands };

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

  /* ---------------- Edit > Shortcuts... ---------------- */
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
      ".tvwin-b ::-webkit-scrollbar-track{background:var(--tv-gadget-border)}" +
      "input[type=range]{-webkit-appearance:none;appearance:none;height:14px;background:transparent;outline:none}" +
      "input[type=range]::-webkit-slider-runnable-track{height:3px;background:#5f5f66}" +
      "input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:7px;height:13px;background:#8fabb6;margin-top:-5px;border-radius:1px}";
    dlg.appendChild(thin);

    const km = loadKeymap();
    const cmds = allCommands();
    const labelOf = (id) => { const c = cmds.find(x => x.cmd === id); return c ? c.cat + ": " + c.label : id; };

    /* the File combo (load / save a key map) */
    const fileC = el("div", "tvcombo", "");
    fileC.innerHTML = `<span class="v">File</span><span class="a">\u25BC</span>`;
    at(fileC, 8, 3, 97, 17);
    b.appendChild(fileC);
    fileC.onmousedown = (e) => {
      e.preventDefault();
      const items = [{ label: "Export Shortcuts", value: "export" }, { label: "Import Shortcuts", value: "import" }, { label: "Reset Shortcuts", value: "reset" }];
      if (typeof tvList === "function") tvList(fileC, items, (v) => {
        if (v === "export") { saveKeymap(km); toastMsg("shortcuts exported"); }
        else if (v === "import") { toastMsg("no shortcut file to import"); }
        else { Object.assign(km, defaultKeymap()); saveKeymap(km); toastMsg("shortcuts reset"); refresh(); }
      });
    };

    /* the search field */
    const sLbl = el("div", "tvlbl", "Search");
    at(sLbl, 517, 7, 50, 14);
    b.appendChild(sLbl);
    const sFld = el("input", "tvf");
    at(sFld, 570, 3, 550, 17);
    b.appendChild(sFld);

    /* the two columns */
    const left = el("div");
    at(left, 8, 25, 544, 556);
    left.style.cssText += ";background:#46464d;overflow:auto;padding:0 0 2px 0";
    b.appendChild(left);
    const right = el("div");
    at(right, 570, 25, 550, 556);
    right.style.cssText += ";background:#46464d;overflow:auto;padding:0 0 2px 0";
    b.appendChild(right);

    const keyRow = el("div");
    keyRow.style.cssText = "display:flex;height:19px;align-items:center;padding:0 6px 4px 60px;font:11px 'Segoe UI',Tahoma,sans-serif;cursor:default";
    const keyName = el("span");
    keyName.style.cssText = "width:95px;color:#b6b6b6;flex:0 0 95px";
    keyRow.appendChild(keyName);
    const keyFn = el("span");
    keyFn.style.color = "#a6b6a7";
    keyRow.appendChild(keyFn);

    const catRow = el("div");
    catRow.style.cssText = "display:flex;height:19px;align-items:center;padding:0 6px 4px 8px;font:11px 'Segoe UI',Tahoma,sans-serif;cursor:pointer";
    const catPlus = el("span", "", "\u2295");
    catPlus.style.cssText = "width:22px;color:#787878;text-align:left;flex:0 0 22px;font-size:11px;line-height:19px";
    catRow.appendChild(catPlus);
    const catName = el("span");
    catName.style.color = "#b6b6b6";
    catRow.appendChild(catName);

    let selKey = null, selCat = null, selFn = null, expanded = false;

    function refresh() {
      const q = (sFld.value || "").trim().toLowerCase();
      // left: the keys
      keyName.textContent = "";
      keyFn.textContent = "";
      const rows = KEY_ROWS.map(k => {
        const r = el("div");
        r.style.cssText = "display:flex;height:19px;align-items:center;padding:0 6px 4px 60px;font:11px 'Segoe UI',Tahoma,sans-serif;cursor:default";
        const a = el("span", "", k);
        a.style.cssText = "width:71px;flex:0 0 71px;text-align:right;color:var(--tv-key-text)";
        const f = el("span", "", km[k] ? labelOf(km[k]) : "");
        f.style.cssText = "margin-left:14px;color:var(--tv-key-text)";
        r.append(a, f);
        if (q && (k.toLowerCase().indexOf(q) >= 0 || (km[k] && labelOf(km[k]).toLowerCase().indexOf(q) >= 0))) {
          r.style.background = "var(--tv-key-found)";   // mShortcutKeyFoundResult
        }
        if (selKey === k) r.style.background = "var(--tv-key-selected)";  // mShortcutKeySelected
        r.onclick = () => { selKey = k; selFn = null; refresh(); };
        return r;
      });
      rows.forEach(r => left.appendChild(r));
      // right: the categories
      catName.textContent = "";
      catPlus.textContent = "\u2295";
      const cats = CATEGORIES.filter(c => !q || c.toLowerCase().indexOf(q) >= 0);
      cats.forEach(c => {
        const r = el("div");
        r.style.cssText = "display:flex;height:19px;align-items:center;padding:0 6px 4px 8px;font:11px 'Segoe UI',Tahoma,sans-serif;cursor:pointer";
        const p = el("span", "", "\u2295");
        p.style.cssText = "width:22px;color:#787878;text-align:left;flex:0 0 22px;font-size:11px;line-height:19px";
        const n = el("span", "", c);
        n.style.color = "var(--tv-key-text)";
        r.append(p, n);
        if (selCat === c) r.style.background = "#5f5f66";
        r.onclick = () => { selCat = c; selFn = null; refresh(); };
        right.appendChild(r);
        if (expanded && selCat === c) {
          cmds.filter(x => x.cat === c).forEach(x => {
            const fr = el("div");
            fr.style.cssText = "display:flex;height:19px;align-items:center;padding:0 6px 4px 22px;font:11px 'Segoe UI',Tahoma,sans-serif;cursor:default";
            const t = el("span", "", x.label);
            t.style.color = "var(--tv-key-text)";
            fr.appendChild(t);
            if (selFn === x.cmd) fr.style.background = "#5f5f66";
            fr.onclick = () => { selFn = x.cmd; refresh(); };
            right.appendChild(fr);
          });
        }
      });
    }
    catPlus.onclick = () => { expanded = !expanded; refresh(); };
    catRow.onclick = () => { if (selCat) { expanded = true; refresh(); } };

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
    cancel.onclick = () => { dlg.remove(); };
    sFld.addEventListener("input", refresh);
    refresh();
    return dlg;
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
    tvWinEscape(dlg);
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

    /* the tree of pages (live: General / Save / Drawing / Timeline /
       Interface / Sound / Paths) */
    const TREE = [
      { name: "General", page: "general" },
      { name: "Save", page: "save", parent: "General" },
      { name: "Drawing", page: "drawing", parent: "General" },
      { name: "Timeline", page: "timeline", parent: "General", children: [
        { name: "General", page: "timeline" },
        { name: "Clip", page: "timelineClip" },
        { name: "Thumbnail", page: "timelineThumb" },
        { name: "Default config", page: "timelineDefault" }
      ] },
      { name: "Interface", page: "interface", children: [
        { name: "General", page: "interface" },
        { name: "Theme", page: "theme" },
        { name: "Panels", page: "panels" }
      ] },
      { name: "Sound", page: "sound" },
      { name: "Paths", page: "paths" }
    ];
    const tree = el("div");
    at(tree, 6, 6, 120, 429);
    tree.style.cssText += ";background:#46464d;overflow:auto;padding:0";
    b.appendChild(tree);
    const page = el("div");
    at(page, 0, 0, W, 434);
    page.style.cssText += ";overflow:auto;padding:0";
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
            // the live marks the branches with a circle
            const mark = el("span", "", "\u2299");
            mark.style.color = "#787878";
            mark.style.marginLeft = "4px";
            r.appendChild(mark);
          }
          if (current === n.page) { r.style.background = "#3e476b"; r.style.color = "#e9e9ec"; }
          r.onclick = () => { current = n.page; buildTree(); buildPage(); };
          tree.appendChild(r);
          if (n.children) add(n.children, depth + 1);
        });
      };
      add(TREE, 0);
    }
    function label(t, y, x) {
      const l = el("div", "tvlbl", t);
      at(l, x == null ? 136 : x, y, 260, 15);
      page.appendChild(l);
      return l;
    }
    function field(x, y, w, value, readonly) {
      const f = el("input", "tvf");
      at(f, x, y, w, 17);
      f.value = value == null ? "" : value;
      if (readonly) f.readOnly = true;
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
        if (typeof tvList === "function") tvList(c, items.map(v => ({ label: v, value: v })), (v) => {
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
    function slider(x, y, w, value, min, max, onChange) {
      const s = el("input");
      s.type = "range"; s.min = min; s.max = max; s.value = value;
      at(s, x, y, w, 14);
      s.style.cssText += ";accent-color:#5f85a7";
      s.addEventListener("input", () => onChange && onChange(s.value));
      page.appendChild(s);
      return s;
    }
    /* the little horizontal arrow the live draws before a slider */
    function arrow(x, y, text) {
      const l = el("div", "tvlbl", text);
      at(l, x, y, 120, 15);
      page.appendChild(l);
      return l;
    }

    function buildPage() {
      page.innerHTML = "";
      const find = (nodes, page_id) => {
        for (const n of nodes) {
          if (n.page === page_id) return n;
          if (n.children) { const r = find(n.children, page_id); if (r) return r; }
        }
        return null;
      };
      const node = find(TREE, current) || TREE[0];
      pageTitle.textContent = node.name;
      if (current === "general") {
        label("Language", 55);
        combo(406, 50, 390, p.language, ["English", "French", "German", "Spanish", "Italian", "Chinese", "Japanese"],
          v => { p.language = v; savePrefs(p); toastMsg("language: " + v); });
        label("Keyboard Shortcuts", 79);
        button(406, 73, 390, "Configure...", () => { window.tvShortcutsDialog(); });
        label("Temp Directory", 103);
        button(406, 96, 390, "Set...", () => toastMsg("temp directory: " + (p.tempDir || "system default")));
        field(407, 116, 388, p.tempDir || "C:\\Users\\riju\\AppData\\Local\\Temp", true);
        label("Physical Memory", 165);
        const mem = el("div", "tvlbl", p.physicalMemory + "MB");
        at(mem, 406, 161, 200, 15);
        page.appendChild(mem);
        label("Undo", 189);
        const uf = field(406, 185, 64, p.undoSize + "MB");
        uf.addEventListener("input", () => { p.undoSize = parseInt(uf.value, 10) || 512; savePrefs(p); });
        slider(478, 186, 80, p.undoSize, 64, 4096, v => { p.undoSize = parseInt(v, 10); uf.value = v + "MB"; savePrefs(p); });
        arrow(562, 189, "\u2194  Undo Size");
        label("Cache usage", 213);
        check(406, 210, p.cacheUsage === "Automatic", on => { p.cacheUsage = on ? "Automatic" : "Manual"; savePrefs(p); manualBtn.disabled = on; });
        const autoLbl = el("div", "tvlbl", "Automatic");
        at(autoLbl, 424, 210, 80, 15);
        page.appendChild(autoLbl);
        const manualBtn = button(406, 230, 64, "Manual", () => { p.cacheUsage = "Manual"; savePrefs(p); toastMsg("cache usage: manual"); });
        manualBtn.disabled = p.cacheUsage === "Automatic";
        const autoBtn = button(478, 230, 40, "Auto", () => { p.cacheUsage = "Automatic"; savePrefs(p); toastMsg("cache usage: automatic"); });
        arrow(524, 230, "\u2194  Cache size");
        slider(478, 248, 80, p.cacheSize, 64, 4096, v => { p.cacheSize = parseInt(v, 10); savePrefs(p); });
        label("Startup configuration", 269);
        combo(406, 260, 390, p.startup, ["Remember last used configuration", "Always start with the default configuration"],
          v => { p.startup = v; savePrefs(p); });
        button(406, 279, 390, "Reset configuration", () => {
          const d = defaultPrefs(); d.physicalMemory = p.physicalMemory;
          Object.assign(p, d); savePrefs(p); buildPage(); toastMsg("configuration reset");
        });
        label("Open last project on startup", 313);
        check(406, 310, p.openLastProject, on => { p.openLastProject = on; savePrefs(p); });
        label("Export All Custom Settings", 345);
        button(406, 342, 390, "Export Settings", () => toastMsg("settings exported"));
        label("Import Custom Settings", 365);
        button(406, 361, 390, "Import Settings", () => toastMsg("no settings file to import"));
        label("George Alert: tv_WriteTextFile", 413);
        check(406, 410, true, () => { });
      } else if (current === "paths") {
        label("Temp Directory", 55);
        field(406, 51, 390, p.tempDir || "C:\\Users\\riju\\AppData\\Local\\Temp", true);
        label("Papers Directory", 79);
        field(406, 75, 390, "C:\\Program Files\\TVPaint\\Resources\\papers", true);
        label("Plugins Directory", 103);
        field(406, 99, 390, "C:\\Program Files\\TVPaint\\Resources\\plugins", true);
        label("Mixers Directory", 127);
        field(406, 123, 390, "C:\\Program Files\\TVPaint\\Resources\\mixers", true);
        label("Brush Directory", 151);
        field(406, 147, 390, "C:\\Program Files\\TVPaint\\Resources\\brushes", true);
      } else if (current === "interface" || current === "theme" || current === "panels") {
        label("Display", 55);
        check(406, 51, true, () => { });
        label("Theme", 79);
        combo(406, 75, 390, "TVPaint dark", ["TVPaint dark", "Light", "System"], v => toastMsg("theme: " + v));
        label("Panels", 103);
        check(406, 99, true, () => { });
      } else if (current === "sound") {
        label("Audio", 55);
        check(406, 51, true, () => { });
        label("Enable sound on playback", 79);
        check(406, 75, true, () => { });
      } else {
        label("Auto save", 55);
        check(406, 51, true, () => { });
        label("Save the project on exit", 79);
        check(406, 75, true, () => { });
        label("Large Timeline", 103);
        check(406, 99, false, () => { });
        label("Vertical Timeline", 127);
        check(406, 123, false, () => { });
      }
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
    ok.onclick = () => { savePrefs(p); dlg.remove(); toastMsg("preferences saved"); };
    cancel.onclick = () => dlg.remove();

    buildTree();
    buildPage();
    return dlg;
  };

  /* ---------------- the key map drives the application ---------------- */
  window.addEventListener("keydown", (e) => {
    const tag = (doc.activeElement && doc.activeElement.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    const km = loadKeymap();
    const sig = keySignature(e);
    const cmd = km[sig];
    if (!cmd) return;
    if (typeof MENU_ACTIONS !== "undefined" && MENU_ACTIONS[cmd]) {
      e.preventDefault();
      e.stopPropagation();
      MENU_ACTIONS[cmd]();
    }
  }, true);
})();
