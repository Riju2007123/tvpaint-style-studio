/* ------------------------------------------------------------------
   leftdock.js - the left dock of TVPaint 12 rebuilt from the screen
   recording of the live application (1920x1080, 2026-10-23):

     * dock order  Main Panel / Color Panel / Tool : <name>
     * Main Panel  18 tiles; the shape tiles are GROUPS (click = current
                    member, right click / hold / corner = the group menu)
     * Color Panel eyedroppers, APen / BPen boxes, "Chromatic Wheel" selector,
                    wheel, R:G:B read-out
     * Tool panel  the ten brushes, the Color selector, Options / Bin tabs and
                    one option form per tool, laid out on the measured grid
                    (19 px rows, 70..183 px controls)

   This file only ADDS to ui.js: the old inputs stay in the page (hidden) and
   every control that has an engine counterpart drives it through them, so
   the existing wiring keeps working. Controls the engine has no use for yet
   keep their value per tool (so the panel behaves like the live one) but do
   not change the drawing - they are marked `ui` below.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  if (typeof proj === "undefined" || typeof selectTool !== "function") return;
  const doc = document;
  // panels may live in another window (see panelfloat.js): search every document
  const q = (s, r) => (r ? r.querySelector(s) : qAny(s));
  const qa = (s, r) => (r ? Array.from(r.querySelectorAll(s))
    : allDocs().reduce((a, d) => a.concat(Array.from(d.querySelectorAll(s))), []));
  const el = (tag, cls, html) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ------------------------------------------------------------------
     data
     ------------------------------------------------------------------ */
  // the ten brushes of the live Tool panel, in its order (icons Brush-01..10)
  const BRUSH_ORDER = ["penbrush", "pencilbrush", "eraser", "mechanicalpencil", "oilbrush",
    "airbrush", "wetbrush", "specialbrush", "textbrush", "custombrush"];
  const BRUSH_NAME = {
    penbrush: "Pen Brush", pencilbrush: "Pencil Brush", eraser: "Eraser Brush",
    mechanicalpencil: "Mechanical Pencil", oilbrush: "Oil Brush", airbrush: "Air Brush",
    wetbrush: "Wet Brush", specialbrush: "Special Brush", textbrush: "Text Brush", custombrush: "Custom Brush"
  };
  // labels / tool tips: Resources/data/english.tvpaint.loc $0095811xx
  const I = (icon) => "icons/" + icon + "-x15.png";
  const G = {
    dot: {
      def: "dotsingle", items: [
        { id: "freehand", label: "Stroke", icon: I("Shape-FreeHand-Line"), key: "D" },
        { id: "ffreehand", label: "Filled Stroke", icon: I("Shape-Fill-FreeHand-Line") },
        { id: "dot", label: "Dot", icon: I("Shape-FreeHand-Dot"), key: "S" },
        { id: "dotsingle", label: "One Point Dot", icon: I("Shape-FreeHand-Dot-Single") }]
    },
    line: {
      def: "fline", items: [
        { id: "line", label: "Line", icon: I("Shape-Line") },
        { id: "fline", label: "Filled Line", icon: I("Shape-Fill-Line") }]
    },
    rect: {
      def: "rectangle", items: [
        { id: "rectangle", label: "Rectangle", icon: I("Shape-Rectangle") },
        { id: "frectangle", label: "Filled Rectangle", icon: I("Shape-Fill-Rectangle") }]
    },
    ellipse: {
      def: "ellipse", items: [
        { id: "ellipse", label: "Ellipse", icon: I("Shape-Ellipse") },
        { id: "fellipse", label: "Filled Ellipse", icon: I("Shape-Fill-Ellipse") },
        { id: "circlec", label: "Circle", icon: I("Shape-CircleC") },
        { id: "fcirclec", label: "Filled Circle", icon: I("Shape-Fill-CircleC") },
        { id: "circle2pts", label: "2 Pts Circle", icon: I("Shape-Circle2Pts") },
        { id: "fcircle2pts", label: "Filled 2 Pts Circle", icon: I("Shape-Fill-Circle2Pts") },
        { id: "circle3pts", label: "3 Pts Circle", icon: I("Shape-Circle3Pts") },
        { id: "fcircle3pts", label: "Filled 3 Pts Circle", icon: I("Shape-Fill-Circle3Pts") }]
    },
    spline: {
      def: "spline3pts", items: [
        { id: "spline3pts", label: "3 Pts Spline", icon: I("Shape-Spline3Pts") },
        { id: "bezier", label: "Bezier Spline", icon: I("Shape-Bezier") },
        { id: "bspline", label: "B-Spline Spline", icon: I("Shape-B-Spline") },
        { id: "fbezier", label: "Filled Bezier Spline", icon: I("Shape-Fill-Bezier") },
        { id: "fbspline", label: "Filled B-Spline Spline", icon: I("Shape-Fill-B-Spline") }]
    },
    cut: {
      def: "cutrect", items: [
        { id: "cutrect", label: "Cutting tool: Rectangle", icon: I("Shape-CutBrush-Rectangle") },
        { id: "cutpoly", label: "Cutting tool: Polygon", icon: I("Shape-CutBrush-Polygon"), stub: 1 },
        { id: "cutfreehand", label: "Cutting tool: FreeHand", icon: I("Shape-CutBrush-FreeHand") },
        { id: "cutmagic", label: "Cutting tool: Magic Wand", icon: I("Shape-Brush-Magicstick"), stub: 1 }]
    },
    sel: {
      def: "selrect", clear: true, items: [
        { id: "selrect", label: "Selection: Rectangle", icon: I("Shape-Selection-Rectangle") },
        { id: "selpoly", label: "Selection: Polygon", icon: I("Shape-Selection-Polygon"), stub: 1 },
        { id: "selellipse", label: "Selection: Ellipse", icon: I("Shape-Selection-Circle"), stub: 1 },
        { id: "selfreehand", label: "Selection: FreeHand", icon: I("Shape-Selection-FreeHand") },
        { id: "selmagic", label: "Selection: Magic Wand", icon: I("Shape-Selection-Magicstick"), stub: 1 },
        { id: "selcolor", label: "Selection: Color", icon: I("Shape-Selection-Color"), stub: 1 },
        { id: "selbezier", label: "Selection: Bezier", icon: I("Shape-Selection-Bezier"), stub: 1 },
        { id: "selbspline", label: "Selection: B-Spline", icon: I("Shape-Selection-B-Spline"), stub: 1 },
        { id: "selpen", label: "Selection: Pen Brush", icon: I("Shape-Selection-Brush"), stub: 1 }]
    }
  };
  // the 18 tiles. grp = a group; tool = a single tool; old = the icon the
  // application already shipped for it (Main-NN.png, cropped from the live app)
  const TILES = [
    { grp: "dot" }, { grp: "line" }, { grp: "rect" }, { grp: "ellipse" }, { grp: "spline" },
    { tool: "fill", old: 6, tip: "Paint bucket" },
    { grp: "cut" }, { grp: "sel" },
    { tool: "crop", old: 9, tip: "Crop", stub: 1 },
    { tool: "puppet", old: 10, tip: "Puppet", stub: 1, dim: 1 },
    { tool: "transform", old: 11, tip: "Transform", tri: 1 },
    { tool: "camera", old: 12, tip: "Camera" },
    { tool: "selclear", old: 13, tip: "Clear Selection" },
    null,
    { tool: "warp", old: 15, tip: "Warp", stub: 1 },
    { tool: "pick", old: 16, tip: "Color picker" },
    { tool: "perspective", old: 17, tip: "Perspective", stub: 1 },
    { tool: "texture", old: 18, tip: "Texturizer", stub: 1 }
  ];
  // measured tile positions (left, top) inside the Main Panel body
  const COLX = [18, 43, 68, 94, 119, 148], ROWY = [3, 29, 60];
  const groupOf = {};
  Object.keys(G).forEach(g => G[g].items.forEach(it => { groupOf[it.id] = g; }));
  const FILLED = new Set(["ffreehand", "fline", "frectangle", "fellipse", "fcirclec", "fcircle2pts",
    "fcircle3pts", "fspline3pts", "fbezier", "fbspline"]);
  const cur = { dot: "freehand", line: G.line.def, rect: G.rect.def, ellipse: G.ellipse.def, spline: G.spline.def,
    cut: G.cut.def, sel: G.sel.def };

  /* ------------------------------------------------------------------
     small state helpers
     ------------------------------------------------------------------ */
  let lastBrush = "penbrush";
  const store = () => (proj.ldState = proj.ldState || {});
  const S = (k) => (store()[k] = store()[k] || {});
  const stub = (what) => toast(what + " - not in this prototype yet");
  // drive an existing (hidden) input of ui.js
  function drive(id, value, evt) {
    const e = $(id); if (!e) return;
    if (e.type === "checkbox") e.checked = !!value; else e.value = value;
    e.dispatchEvent(new Event(evt || (e.type === "checkbox" || e.tagName === "SELECT" ? "change" : "input"), { bubbles: true }));
  }

  /* ------------------------------------------------------------------
     menus (group menus and drop downs share one look)
     ------------------------------------------------------------------ */
  let openMenu = null;
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  const hooked = new WeakSet();
  function hookDoc(d) {
    if (hooked.has(d)) return; hooked.add(d);
    d.addEventListener("pointerdown", (e) => { if (openMenu && !openMenu.contains(e.target)) closeMenu(); }, true);
    d.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }
  hookDoc(doc);
  // ref = the element the menu hangs from, so the menu opens in ITS window
  function showMenu(x, y, rows, minW, ref) {
    const md = (ref && ref.ownerDocument) || doc, mw = md.defaultView || window;
    hookDoc(md);
    closeMenu();
    const m = el("div", "ldmenu");
    if (minW) m.style.minWidth = minW + "px";
    rows.forEach(r => {
      if (r === "-") { m.appendChild(el("div", "ldsep")); return; }
      const it = el("div", "ldi" + (r.dis ? " dis" : ""));
      it.innerHTML = `<span class="ldck">${r.checked ? "&#10003;" : ""}</span>` +
        (r.icon ? `<span class="ldic"><img src="${r.icon}" alt=""></span>` : "") +
        `<span class="ldlb">${r.label}</span>` + (r.key ? `<span class="ldsc">${r.key}</span>` : "");
      it.onclick = () => { closeMenu(); if (!r.dis && r.act) r.act(); };
      m.appendChild(it);
    });
    md.body.appendChild(m);
    const w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.max(0, Math.min(x, mw.innerWidth - w - 2)) + "px";
    m.style.top = Math.max(0, Math.min(y, mw.innerHeight - h - 2)) + "px";
    openMenu = m;
    return m;
  }

  /* ------------------------------------------------------------------
     panels: order and chrome
     ------------------------------------------------------------------ */
  function arrangeDock() {
    const host = $("panels");
    // the Chromatic Wheel lives inside the Color Panel in the live app
    const wheel = q('[data-panel-key="wheel"]');
    if (wheel) wheel.style.display = "none";
    ["main", "color", "tool"].forEach(k => { const p = q('[data-panel-key="' + k + '"]'); if (p) host.appendChild(p); });
    ["tool", "main", "color"].forEach(k => {
      const p = q('[data-panel-key="' + k + '"]');
      if (!p) return;
      const h = q(".phead", p); if (h) h.style.display = "";
    });
    // the tab bar of the old dock is replaced by the real header row
    const bar = $("tabbar"); if (bar) bar.style.display = "none";
    // title of the panels as shown by the live app
    const set = (k, t) => { const p = q('[data-panel-key="' + k + '"] .pt'); if (p) p.textContent = t; };
    set("main", "Main Panel"); set("color", "Color Panel");
    // the padlock to the right of the Main Panel header
    const mh = q('[data-panel-key="main"] .phead');
    if (mh && !q(".padlock", mh)) { const l = el("img", "padlock"); l.src = "icons/Lock-x10.png"; l.alt = ""; mh.appendChild(l); }
  }

  /* ------------------------------------------------------------------
     Main Panel
     ------------------------------------------------------------------ */
  let mainGrid = null;
  function tileIcon(t) {
    if (t.grp) { const it = G[t.grp].items.find(x => x.id === cur[t.grp]); return it.icon; }
    return "icons/Main-" + String(t.old).padStart(2, "0") + ".png";
  }
  function buildMain() {
    const body = q('[data-panel-key="main"] .pbody');
    body.innerHTML = "";
    mainGrid = el("div", "maingrid ld");
    mainGrid.id = "mainGrid";
    mainGrid.style.height = "88px";
    TILES.forEach((t, i) => {
      if (!t) return;
      const c = el("div", "mgcell"); c.dataset.tile = i;
      c.style.left = COLX[i % 6] + "px"; c.style.top = ROWY[Math.floor(i / 6)] + "px";
      if (t.tool) c.dataset.tool = t.tool;
      if (t.dim) c.classList.add("dis");
      const img = el("img"); img.alt = ""; img.src = tileIcon(t); c.appendChild(img);
      if (t.grp || t.tri) c.appendChild(el("span", "grptri"));
      if (t.tip) c.title = t.tip;
      if (t.grp) c.title = G[t.grp].items.find(x => x.id === cur[t.grp]).label;
      wireTile(c, t);
      mainGrid.appendChild(c);
    });
    body.appendChild(mainGrid);
    refreshMain();
  }
  function openGroupMenu(c, t) {
    const g = G[t.grp];
    const r = c.getBoundingClientRect();
    const rows = g.items.map(it => ({
      label: it.label, icon: it.icon, key: it.key, checked: cur[t.grp] === it.id,
      act: () => chooseMember(t.grp, it.id)
    }));
    if (g.clear) { rows.push("-"); rows.push({ label: "Clear Selection", icon: "icons/SelectionClear-x15.png", act: clearSelection }); }
    else { rows.push("-"); rows.push({ label: "Shape Settings", icon: "icons/Shape-Options-x15.png", act: () => stub("Shape Settings") }); }
    showMenu(r.left + 13, r.bottom - 2, rows, 190, c);
  }
  function chooseMember(grp, id) {
    const it = G[grp].items.find(x => x.id === id);
    cur[grp] = id;
    const c = q('.mgcell[data-tile="' + TILES.findIndex(t => t && t.grp === grp) + '"]', mainGrid);
    if (c) { q("img", c).src = it.icon; c.title = it.label; }
    if (it.stub) { stub(it.label); refreshMain(); return; }
    selectTool(id);
  }
  function clearSelection() { try { sel = null; } catch (e) { /* ignore */ } renderAll(); toast("selection cleared"); }
  function wireTile(c, t) {
    let hold = null, held = false;
    c.addEventListener("pointerdown", (e) => {
      held = false;
      if (e.button === 2) return;
      if (t.grp) hold = setTimeout(() => { held = true; openGroupMenu(c, t); }, 380);
    });
    const stopHold = () => { if (hold) { clearTimeout(hold); hold = null; } };
    c.addEventListener("pointerup", stopHold); c.addEventListener("pointerleave", stopHold);
    c.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); if (t.grp) openGroupMenu(c, t); });
    c.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      if (held) { held = false; return; }
      if (t.grp) {
        const it = G[t.grp].items.find(x => x.id === cur[t.grp]);
        const r = c.getBoundingClientRect();
        if (e.clientX > r.right - 8 && e.clientY > r.bottom - 8) { openGroupMenu(c, t); return; }
        if (it.stub) { stub(it.label); return; }
        selectTool(it.id); return;
      }
      if (t.tool === "selclear") { clearSelection(); return; }
      if (t.stub || t.dim) { stub(t.tip); return; }
      selectTool(t.tool);
    }, true);
  }
  function refreshMain() {
    if (!mainGrid) return;
    qa(".mgcell", mainGrid).forEach(c => {
      const t = TILES[+c.dataset.tile];
      let on = false;
      if (t.grp) on = groupOf[tool] === t.grp ? cur[t.grp] === tool : (t.grp === "dot" && cur.dot === "freehand" && BRUSH_ORDER.includes(tool));
      else on = t.tool === tool;
      c.classList.toggle("on", on);
    });
  }

  /* ------------------------------------------------------------------
     Color Panel
     ------------------------------------------------------------------ */
  function buildColor() {
    const p = q('[data-panel-key="color"]');
    const body = q(".pbody", p);
    const wcv = $("wheelCv"), wrgb = $("wheelRGB");
    body.innerHTML = "";
    const box = el("div", "cpanel");
    box.innerHTML = `
      <div class="cp-eye" style="left:2px;top:6px" id="ldPickA" title="Pick the APen color"><img src="icons/Color-Pick-x10.png" style="width:13px;height:20px;margin:0 3px" alt=""></div>
      <span class="cp-sw" id="cpAPen" style="left:22px;width:62px"></span>
      <span class="cp-mid" id="ldMid1" style="left:87px;top:1px" title="Swap APen and BPen">&#9670;</span>
      <span class="cp-mid" id="ldMid2" style="left:87px;top:17px;opacity:.55" title="Add the colors to the palette">+</span>
      <span class="cp-sw" id="cpBPen" style="left:105px;width:62px"></span>
      <div class="cp-eye" style="left:170px;top:6px" id="ldPickB" title="Pick the BPen color"><img src="icons/Color-Pick-x10.png" style="width:13px;height:20px;margin:0 3px;transform:scaleX(-1)" alt=""></div>
      <span class="cp-down" style="left:4px;top:15px" title="APen menu"></span>
      <span class="cp-down" style="left:170px;top:15px" title="BPen menu"></span>
      <div class="ldsel" id="ldColMode" style="left:5px;top:34px;width:178px;position:absolute">Chromatic Wheel</div>`;
    body.appendChild(box);
    if (wcv) { box.appendChild(wcv); }
    if (wrgb) { box.appendChild(wrgb); }
    $("ldMid1").onclick = () => { const a = proj.apen; setApen(proj.bpen); setBpen(a); toast("APen/BPen swapped"); renderAll(); };
    $("ldMid2").onclick = () => stub("Add to palette");
    $("ldPickA").onclick = () => { const c = prompt("APen colour (#hex):", proj.apen); if (c) { setApen(c); renderAll(); } };
    $("ldPickB").onclick = () => { const c = prompt("BPen colour (#hex):", proj.bpen); if (c) { setBpen(c); renderAll(); } };
    $("cpAPen").onclick = () => $("ldPickA").onclick();
    $("cpBPen").onclick = () => $("ldPickB").onclick();
    $("ldColMode").onclick = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      showMenu(r.left, r.bottom, ["Chromatic Wheel", "Color Sliders", "Palette", "Colors Mixer", "Harmony"].map(n => ({
        label: n, checked: n === "Chromatic Wheel", act: () => { if (n !== "Chromatic Wheel") stub(n); }
      })), r.width, e.currentTarget);
    };
    if (typeof syncTVPanels === "function") syncTVPanels();
  }

  /* ------------------------------------------------------------------
     Tool panel
     ------------------------------------------------------------------ */
  const fmtInt = (v) => String(Math.round(v));
  const fmtF2 = (v) => (+v).toFixed(2);
  const fmtP0 = (v) => Math.round(v) + "%";
  const fmtP2 = (v) => (+v).toFixed(2) + "%";
  const fmtDeg0 = (v) => Math.round(v) + "°";
  const fmtDeg2 = (v) => (+v).toFixed(2) + "°";
  const fmtF1 = (v) => (+v).toFixed(1);
  const fmtP1 = (v) => (+v).toFixed(1) + "%";

  // form layouts: A = the brush forms (curve column), B = the plain forms
  const LA = { lr: 62, box: 70, dd: 70, ddw: 113, btn: 70, btnw: 113, fx: 95 };
  const LB = { lr: 89, box: 97, dd: 63, ddw: 120, btn: 5, btnw: 178, fx: 95 };

  function brushBinds() {
    return {
      size: { get: () => proj.brush.size, set: (v) => drive("optSize", v) },
      power: { get: () => proj.brush.power * 100, set: (v) => drive("optPower", v) },
      opacity: { get: () => proj.brush.opacity * 100, set: (v) => drive("optOpacity", v) },
      aa: { get: () => proj.antiAlias !== "None", set: (v) => drive("chkAA", v) },
      ls: { get: () => proj.smoothing > 0, set: (v) => drive("chkLS", v) },
      local: { get: () => !!localSmooth, set: (v) => drive("chkLocal", v) }
    };
  }
  // ---- the forms (from the screen recording) ----
  const PEN_TAIL = [
    { k: "chk", label: "Use Line Smoothing", bind: "ls", lr: 158, box: 165, plain: 1, h: 20, gapTop: 6 },
    { k: "chk", label: "Use Local Smoothing", bind: "local", lr: 158, box: 165, h: 20 },
    { k: "btn", label: "Reset", x: 70, w: 113, act: "reset", gapTop: 5 }];
  const FORMS = {
    pen: [
      { k: "num", label: "Size", curve: "F1", bind: "size", fmt: fmtF2, step: 0.5, min: 0.5 },
      { k: "num", label: "Power", curve: "C", bind: "power", fmt: fmtP0, step: 1, min: 0, max: 100 },
      { k: "num", label: "Opacity", bind: "opacity", fmt: fmtP0, step: 1, min: 0, max: 100 },
      { k: "chk", label: "Drying", key: "drying", def: true },
      { k: "grad", label: "Gradient" },
      { k: "chk", label: "AAliasing", bind: "aa" },
      { k: "chk", label: "Preview", key: "preview", def: true },
      ...PEN_TAIL],
    pencil: [
      { k: "prev2" },
      { k: "dd", label: "Grain", key: "grain", items: ["Hard", "Soft", "Paper", "Canvas", "Rough"], def: "Hard" },
      { k: "num", label: "Size", curve: "P", bind: "size", fmt: fmtF2, step: 0.5, min: 0.5 },
      { k: "num", label: "Power", curve: "P", bind: "power", fmt: fmtP0, step: 1, min: 0, max: 100 },
      { k: "num", label: "Opacity", bind: "opacity", fmt: fmtP0, step: 1, min: 0, max: 100 },
      { k: "num", label: "Aspect", curve: "C", key: "aspect", def: 100, fmt: fmtP0, step: 1, min: 1, max: 1000 },
      { k: "num", label: "Angle", curve: "C", key: "angle", def: 0, fmt: fmtDeg0, step: 1, min: -360, max: 360 },
      { k: "num", label: "Step", curve: "chk", key: "step", def: 12.5, fmt: fmtP2, step: 0.5, min: 1, max: 100, chk: true },
      { k: "chk", label: "Drying", key: "drying", def: true },
      { k: "grad", label: "Gradient" },
      { k: "chk", label: "Preview", key: "preview", def: true },
      ...PEN_TAIL],
    air: [
      { k: "prev2", ratio: "1:3" },
      { k: "num", label: "Size", curve: "C", bind: "size", fmt: fmtF2, step: 1, min: 0.5 },
      { k: "num", label: "Power", curve: "P", bind: "power", fmt: fmtP0, step: 1, min: 0, max: 100 },
      { k: "num", label: "Opacity", bind: "opacity", fmt: fmtP0, step: 1, min: 0, max: 100 },
      { k: "num", label: "Aspect", curve: "C", key: "aspect", def: 100, fmt: fmtP0, step: 1, min: 1, max: 1000 },
      { k: "num", label: "Angle", curve: "C", key: "angle", def: 0, fmt: fmtDeg0, step: 1, min: -360, max: 360 },
      { k: "num", label: "Step", curve: "chk", key: "step", def: 12.5, fmt: fmtP2, step: 0.5, min: 1, max: 100, chk: true },
      { k: "chk", label: "Drying", key: "drying", def: true },
      { k: "grad", label: "Gradient" },
      { k: "chk", label: "Preview", key: "preview", def: true },
      ...PEN_TAIL],
    custom: [
      { k: "custom" },
      { k: "num", label: "Size", curve: "C", key: "csize", def: 100, fmt: fmtP2, step: 1, min: 1, max: 1000 },
      { k: "num", label: "Shift", curve: "C", key: "shift", def: 0, fmt: fmtP2, step: 1, min: 0, max: 100 },
      { k: "num", label: "Jitter", curve: "C", key: "jitter", def: 0, fmt: fmtP2, step: 1, min: 0, max: 100 },
      { k: "num", label: "Opacity", curve: "C", key: "copacity", def: 100, fmt: fmtP2, step: 1, min: 0, max: 100 },
      { k: "num", label: "Angle", curve: "C", key: "cangle", def: 0, fmt: fmtDeg2, step: 1, min: -360, max: 360 },
      { k: "num", label: "Step", curve: "chk", key: "cstep", def: 12.5, fmt: fmtP2, step: 0.5, min: 1, max: 100, chk: true },
      { k: "dd", label: "AAliasing", key: "caa", items: ["None", "Low", "Medium", "High"], def: "None", x: 70, w: 113, lr: 62 },
      { k: "chk", label: "Warp", key: "warp", def: false, off: true },
      { k: "chk", label: "Projection", key: "projection", def: false, off: true },
      { k: "chk", label: "Drying", key: "drying", def: true },
      { k: "chk", label: "Preview", key: "preview", def: true },
      { k: "dd", label: "Handle", key: "handle", items: ["Center", "Top Left", "Top Right", "Bottom Left", "Bottom Right", "Origin"], def: "Center", x: 70, w: 113, lr: 62 },
      { k: "chk", label: "Revert", key: "revert", def: false },
      { k: "dd", label: "Anim", key: "anim", items: ["Loop", "Ping-Pong", "Once", "Random"], def: "Loop", x: 70, w: 113, lr: 62 }],
    text: [
      { k: "textin" },
      { k: "font" },
      { k: "dd", label: "Script", key: "script", items: ["Western", "Greek", "Cyrillic", "Japanese"], def: "Western", lr: 55, x: 63, w: 120 },
      { k: "dd", label: "Style", key: "tstyle", items: ["Regular", "Bold", "Italic", "Bold Italic"], def: "Regular", lr: 55, x: 63, w: 120 },
      { k: "dd", label: "Dir.", key: "tdir", items: ["Left to Right", "Right to Left", "Top to Bottom"], def: "Left to Right", lr: 55, x: 63, w: 120 },
      { k: "seg", items: ["Letter", "Word"], key: "tmode", def: "Word" },
      { k: "num", label: "Size", curve: "P", key: "tsize", def: 50, fmt: fmtF1, step: 1, min: 1, max: 500, lr: 55, cx: 87, fx: 112, fw: 46 },
      { k: "num", label: "XScale", curve: "C", key: "xscale", def: 50, fmt: fmtP1, step: 1, min: 1, max: 500, lr: 55, pre: 1, cx: 87, fx: 112, fw: 46 },
      { k: "num", label: "Space", curve: "C", key: "space", def: 0, fmt: fmtP1, step: 1, min: -100, max: 500, lr: 55, pre: 1, cx: 87, fx: 112, fw: 46 },
      { k: "num", label: "Italic", curve: "C", key: "italic", def: 50, fmt: fmtP1, step: 1, min: 0, max: 100, lr: 55, pre: 1, cx: 87, fx: 112, fw: 46 },
      { k: "plus" }, { k: "plus" },
      { k: "chk", label: "Preview", key: "preview", def: true, lr: 55, box: 70 },
      { k: "btn", label: "Reset", x: 87, w: 96, act: "reset", gapTop: 4 },
      { k: "create" }],
    bucket: [
      { k: "num", label: "Smooth", key: "smooth", def: 0, fmt: fmtF2, step: 0.25, min: 0, max: 20 },
      { k: "num", label: "Opacity", key: "bopacity", def: 100, fmt: fmtP2, step: 1, min: 0, max: 100 },
      { k: "chk", label: "AAliasing", bind: "aa" },
      { k: "dd", label: "Source", key: "source", items: ["Layer", "Image", "Clip", "Project"], def: "Layer", lr: 55, x: 63, w: 120 },
      { k: "dd", label: "Fill", key: "fillmode", items: ["Color & Density", "Color", "Density"], def: "Color & Density", lr: 55, x: 63, w: 120 },
      { k: "chk", label: "Contiguous", key: "contiguous", def: true },
      { k: "num", label: "Gap Closer", key: "gap", def: 0, fmt: fmtInt, step: 1, min: 0, max: 100 },
      { k: "num", label: "Expand", key: "expand", def: 0, fmt: fmtInt, step: 1, min: 0, max: 100 },
      { k: "num", label: "Range", bind: "range", fmt: fmtInt, step: 1, min: 0, max: 255 },
      { k: "chk", label: "AutoPick Color", key: "autopick", def: false, lr: 89 },
      { k: "chk", label: "Include borders", key: "borders", def: false, lr: 154, box: 162, wide: 1 },
      { k: "chk", label: "Gradient", key: "bgrad", def: false, lr: 154, box: 162, wide: 1 },
      { k: "chk", label: "Brush Warping", key: "bwarp", def: false, lr: 154, box: 162, wide: 1 },
      { k: "chk", label: "Opacity Mapping", key: "bmap", def: false, lr: 154, box: 162, wide: 1 },
      { k: "chk", label: "Preserve Opacity", key: "bpres", def: false, lr: 154, box: 162, wide: 1 },
      { k: "btn", label: "Reset", x: 5, w: 178, act: "reset", gapTop: 4 }],
    fillshape: [
      { k: "num", label: "Smooth", key: "smooth", def: 0, fmt: fmtF2, step: 0.25, min: 0, max: 20 },
      { k: "num", label: "Opacity", bind: "opacity", fmt: fmtP2, step: 1, min: 0, max: 100 },
      { k: "chk", label: "AAliasing", bind: "aa" },
      { k: "chk", label: "Fill Inside", key: "fillinside", def: false, lr: 154, box: 162, wide: 1 },
      { k: "chk", label: "Gradient", key: "bgrad", def: false, lr: 154, box: 162, wide: 1 },
      { k: "chk", label: "Brush Warping", key: "bwarp", def: false, lr: 154, box: 162, wide: 1 },
      { k: "chk", label: "Opacity Mapping", key: "bmap", def: false, lr: 154, box: 162, wide: 1 },
      { k: "chk", label: "Preserve Opacity", key: "bpres", def: false, lr: 154, box: 162, wide: 1 },
      { k: "btn", label: "Reset", x: 5, w: 178, act: "reset", gapTop: 4 }],
    cut: [
      { k: "num", label: "Smooth", key: "smooth", def: 0, fmt: fmtInt, step: 1, min: 0, max: 20 },
      { k: "dd", label: "Match", key: "match", items: ["Color & Density", "Color", "Density"], def: "Color & Density", lr: 55, x: 63, w: 120, wand: 1 },
      { k: "chk", label: "Contiguous", key: "contiguous", def: true, wand: 1 },
      { k: "num", label: "Gap Closer", key: "gap", def: 0, fmt: fmtInt, step: 1, min: 0, max: 100, wand: 1 },
      { k: "num", label: "Expand", key: "expand", def: 0, fmt: fmtInt, step: 1, min: 0, max: 100, wand: 1 },
      { k: "num", label: "Range", key: "crange", def: 25, fmt: fmtInt, step: 1, min: 0, max: 255, wand: 1 },
      { k: "chk", label: "AAliasing", bind: "aa" },
      { k: "chk", label: "Optimize", key: "optimize", def: false, lr: 89 },
      { k: "chk", label: "Display", key: "display", def: false, lr: 89 },
      { k: "chk", label: "Keep", key: "keep", def: false, lr: 89 }],
    select: [
      { k: "num", label: "Smooth", key: "smooth", def: 0, fmt: fmtInt, step: 1, min: 0, max: 20 },
      { k: "chk", label: "AAliasing", bind: "aa" },
      { k: "btn", label: "Invert", x: 5, w: 178, act: () => stub("Invert selection") },
      { k: "btn", label: "Clear", x: 5, w: 178, act: () => clearSelection() },
      { k: "gap", h: 8 },
      { k: "btn", label: "Copy to Layer", x: 5, w: 178, act: () => stub("Copy to Layer") },
      { k: "btn", label: "Cut to Layer", x: 5, w: 178, act: () => stub("Cut to Layer") },
      { k: "btn", label: "Copy to Brush", x: 5, w: 178, act: () => stub("Copy to Brush") },
      { k: "btn", label: "Cut to Brush", x: 5, w: 178, act: () => stub("Cut to Brush") },
      { k: "gap", h: 8 },
      { k: "btn", label: "Crop", x: 5, w: 178, act: () => stub("Crop selection") }],
    crop: [
      { k: "num", label: "Center X", key: "cx", def: 877, fmt: fmtInt, step: 1 },
      { k: "num", label: "Center Y", key: "cy", def: 620, fmt: fmtInt, step: 1 },
      { k: "num", label: "Angle", key: "cangle2", def: 0, fmt: fmtInt, step: 1 },
      { k: "chk", label: "Lock Aspect", key: "lockaspect", def: false, lr: 89 },
      { k: "num", label: "Width", key: "cw", def: 877, fmt: fmtInt, step: 1 },
      { k: "num", label: "Height", key: "ch", def: 620, fmt: fmtInt, step: 1 },
      { k: "num", label: "Pivot X", key: "px", def: 877, fmt: fmtInt, step: 1 },
      { k: "num", label: "Pivot Y", key: "py", def: 620, fmt: fmtInt, step: 1 },
      { k: "num", label: "Pivot Angle", key: "pa", def: 0, fmt: fmtInt, step: 1 },
      { k: "dd", label: "AAliasing", key: "craa", items: ["None", "Low", "Medium", "High"], def: "None", lr: 89, x: 97, w: 86 },
      { k: "btn", label: "Reset", x: 97, w: 86, act: "reset" },
      { k: "gap", h: 6 },
      { k: "btn", label: "Crop", x: 97, w: 86, act: () => stub("Crop") }]
  };
  const FORM_FOR = {
    penbrush: "pen", pencilbrush: "pencil", eraser: "pencil", mechanicalpencil: "pencil", oilbrush: "pencil",
    wetbrush: "pencil", specialbrush: "pencil", airbrush: "air", textbrush: "text", custombrush: "custom",
    fill: "bucket", cutrect: "cut", cutfreehand: "cut", selrect: "select", selfreehand: "select",
    crop: "crop", transform: "crop"
  };
  const TITLE = Object.assign({}, BRUSH_NAME, {
    fill: "Paint bucket", cutrect: "Cut Brush", cutfreehand: "Cut Brush", selrect: "Select", selfreehand: "Select",
    crop: "Crop", transform: "Transform", camera: "Camera[Pro]", pick: "Color Pick", panning: "Panning", zoomrect: "Zoom"
  });

  // ---- building one form ----
  let formEl = null, tabsOn = "options";
  function formKey(id) {
    if (FILLED.has(id)) return "fillshape";
    if (FORM_FOR[id]) return FORM_FOR[id];
    return FORM_FOR[lastBrush] || "pen";
  }
  function titleFor(id) {
    if (FILLED.has(id)) return "Filling Shape";
    if (TITLE[id]) return TITLE[id];
    return BRUSH_NAME[lastBrush] || "Pen Brush";
  }
  const isWand = () => /magic/.test(tool);

  function buildForm(fk, id) {
    const binds = brushBinds();
    // range binds to the flood fill tolerance
    binds.range = { get: () => { const v = S("fill").range; return v === undefined ? 25 : v; },
      set: (v) => { S("fill").range = v; proj.brush.tolerance = v; } };
    const root = el("div"); root.id = "ldForm";
    const rows = FORMS[fk];
    const st = S(fk === "pen" || fk === "pencil" || fk === "air" ? id : fk);
    const get = (r) => r.bind ? binds[r.bind].get() : (st[r.key] === undefined ? r.def : st[r.key]);
    const put = (r, v) => { if (r.bind) binds[r.bind].set(v); else st[r.key] = v; };
    const L = (fk === "pen" || fk === "pencil" || fk === "air" || fk === "custom") ? LA : LB;
    let y = 0;
    // Options / Bin tabs are part of the brush forms only
    if (["pen", "pencil", "air", "custom", "text"].includes(fk)) {
      const t = el("div", "ldtabs");
      t.innerHTML = `<div class="ldtab on" style="left:5px;width:52px;top:0">Options</div><div class="ldtab off" style="left:57px;width:26px;top:2px;height:19px">Bin</div>`;
      root.appendChild(t); y = 24;
      const [to, tb] = qa(".ldtab", t);
      to.onclick = () => { tabsOn = "options"; showBin(false); };
      tb.onclick = () => { tabsOn = "bin"; showBin(true); };
    }
    const wrap = el("div"); wrap.id = "ldRows"; wrap.style.cssText = "position:relative;width:192px";
    root.appendChild(wrap);
    let ry = 0;
    const abs = (cls, css, html) => { const e = el("div", cls, html); e.style.cssText = "position:absolute;" + css; wrap.appendChild(e); return e; };
    rows.forEach(r => {
      if (r.wand && !isWand()) return;
      ry += r.gapTop || 0;
      const lr = r.lr != null ? r.lr : L.lr;
      const label = (txt) => abs("ldlab", `position:absolute;right:${192 - lr}px;top:${ry}px;line-height:19px;color:var(--ld-text);white-space:nowrap;text-align:right`, txt);
      switch (r.k) {
        case "num": {
          label(r.label);
          const hasCurve = r.curve && r.curve !== "chk";
          const cx = r.cx != null ? r.cx : 72, fx = r.fx != null ? r.fx : 95, fw = r.fw != null ? r.fw : 63;
          if (hasCurve) {
            const cv = abs("ldcurve", `left:${cx}px;top:${ry + 1}px`, r.curve);
          }
          if (r.curve === "chk") {
            const on = st["on_" + r.key] === undefined ? true : st["on_" + r.key];
            const c = abs("ldchk" + (on ? "" : " off"), `left:${r.cx != null ? r.cx : 70}px;top:${ry + 1}px;width:21px`, on ? "&#10003;" : "");
            c.onclick = () => { st["on_" + r.key] = !on; rebuild(); };
          }
          if (r.pre) abs("ldchk off", `left:63px;top:${ry + 1}px;width:21px`, "");
          const inp = el("input", "ldnum"); inp.type = "text"; inp.spellcheck = false;
          inp.style.cssText = `left:${fx}px;top:${ry + 1}px;width:${fw}px`;
          const show = () => { inp.value = r.fmt(get(r)); };
          show();
          const apply = (v) => {
            if (!isFinite(v)) { show(); return; }
            if (r.min != null) v = Math.max(r.min, v);
            if (r.max != null) v = Math.min(r.max, v);
            put(r, v); show();
          };
          inp.onkeydown = (e) => { if (e.key === "Enter") { apply(parseFloat(inp.value)); inp.blur(); } e.stopPropagation(); };
          inp.onchange = () => apply(parseFloat(inp.value));
          inp.onfocus = () => inp.select();
          wrap.appendChild(inp);
          const arr = abs("ldarr", `left:${fx + fw + 8}px;top:${ry + 3}px`, "");
          const stepBy = (d) => apply((+get(r) || 0) + d * (r.step || 1));
          // the two triangles are pseudo-elements of .ldarr, so the left / right half decides
          arr.onclick = (e) => { const b = arr.getBoundingClientRect(); stepBy(e.clientX - b.left < b.width / 2 ? -1 : 1); };
          ry += 19; break;
        }
        case "chk": {
          label(r.label);
          const on = !!get(r);
          const left = r.box != null ? r.box : L.box;
          const c = abs("ldchk" + (on ? "" : " off"), `left:${left}px;top:${ry + 1}px;width:${r.wide || r.off || (!on) ? 21 : 21}px`, on ? "&#10003;" : "");
          if (r.plain && !on) c.classList.add("off");
          c.onclick = () => { put(r, !on); rebuild(); };
          ry += r.h || 19; break;
        }
        case "grad": {
          label(r.label);
          abs("ldchk off", `left:70px;top:${ry + 1}px;width:21px`, "");
          abs("ldgrad", `left:92px;top:${ry + 1}px;width:91px`, "");
          ry += 19; break;
        }
        case "dd": {
          label(r.label);
          const v = get(r);
          const x = r.x != null ? r.x : L.dd, w = r.w != null ? r.w : L.ddw;
          const d = abs("ldsel", `left:${x}px;top:${ry}px;width:${w}px`, v);
          d.onclick = (e) => {
            const b = d.getBoundingClientRect();
            showMenu(b.left, b.bottom, r.items.map(n => ({ label: n, checked: n === v, act: () => { put(r, n); rebuild(); } })), b.width, d);
          };
          ry += 19; break;
        }
        case "btn": {
          const b = abs("ldbtn" + (r.dis ? " dis" : ""), `left:${r.x}px;top:${ry}px;width:${r.w}px`, r.label);
          b.onclick = () => {
            if (r.act === "reset") { doReset(fk, id); return; }
            if (typeof r.act === "function") r.act();
          };
          ry += 19; break;
        }
        case "gap": ry += r.h; break;
        case "prev2": {
          const a = abs("ldprev", `left:6px;top:${ry}px;width:83px;height:83px`, `<canvas width="83" height="83"></canvas>${r.ratio ? `<span class="ratio">${r.ratio}</span>` : ""}`);
          const b = abs("ldprev", `left:100px;top:${ry}px;width:83px;height:83px`, `<canvas width="83" height="83"></canvas>`);
          drawBrushPreview(q("canvas", a), id === "airbrush");
          drawCurvePreview(q("canvas", b), id === "airbrush");
          ry += 86; break;
        }
        case "custom": {
          abs("ldprev", `left:6px;top:${ry}px;width:83px;height:83px;background:#2b2a2f`, `<div class="ldstrip"></div>`);
          abs("ldbtn", `left:92px;top:${ry + 1}px;width:91px`, "Edit").onclick = () => stub("Custom brush editor");
          abs("ldlab", `position:absolute;left:96px;top:${ry + 53}px;color:var(--ld-text)`, "Wet Profile");
          abs("ldwedge", `left:169px;top:${ry + 54}px`, "");
          abs("ldsel", `left:92px;top:${ry + 64}px;width:91px`, "Origin");
          ry += 86; break;
        }
        case "textin": {
          const t = el("input", "ldtext"); t.type = "text"; t.value = st.text || "Enter Text Here";
          t.style.cssText = `left:5px;top:${ry + 1}px;width:136px;height:19px`;
          t.oninput = () => { st.text = t.value; }; t.onkeydown = (e) => e.stopPropagation();
          wrap.appendChild(t);
          abs("ldsel", `left:146px;top:${ry + 1}px;width:19px;padding:0`, "").style.borderRadius = "9px";
          abs("ldbtn", `left:166px;top:${ry + 1}px;width:17px;height:19px;line-height:19px;font-weight:700`, "B");
          ry += 23; break;
        }
        case "font": {
          const d = abs("ldsel", `left:5px;top:${ry}px;width:158px`, st.font || "Arial");
          d.onclick = () => { const b = d.getBoundingClientRect(); showMenu(b.left, b.bottom, ["Arial", "Segoe UI", "Times New Roman", "Courier New", "Verdana"].map(n => ({ label: n, checked: n === (st.font || "Arial"), act: () => { st.font = n; rebuild(); } })), b.width, d); };
          abs("ldbtn", `left:166px;top:${ry}px;width:17px;height:19px;line-height:15px`, "...").onclick = () => stub("Font requester");
          ry += 23; break;
        }
        case "seg": {
          const v = get(r), w = 89;
          r.items.forEach((n, i) => {
            const b = abs("ldbtn", `left:${5 + i * 90}px;top:${ry}px;width:${w}px;border-radius:0;${n === v ? "background:var(--ld-tile)" : ""}`, n);
            b.onclick = () => { put(r, n); rebuild(); };
          });
          ry += 24; break;
        }
        case "plus": {
          abs("", `left:7px;top:${ry + 1}px;width:15px;height:15px;border-radius:50%;background:#55545b;color:var(--tv-desktop);text-align:center;line-height:15px;font-weight:700;cursor:pointer`, "+").onclick = () => stub("Add parameter");
          ry += 18; break;
        }
        case "create": {
          abs("", `left:5px;top:${ry + 3}px;width:80px;line-height:19px;text-align:center;color:var(--ld-text);background:var(--ld-field-dark)`, "289.2");
          abs("ldbtn", `left:92px;top:${ry + 3}px;width:91px`, "Create Brush").onclick = () => stub("Create Brush");
          ry += 26; break;
        }
      }
    });
    wrap.style.height = (ry + 4) + "px";
    root.style.height = (y + ry + 4) + "px";
    wrap.style.top = "0";
    if (y) { wrap.style.position = "relative"; }
    return root;
  }
  function drawBrushPreview(cv, soft) {
    const g = cv.getContext("2d"), n = cv.width;
    g.fillStyle = "#fff"; g.fillRect(0, 0, n, n);
    const r = soft ? 36 : 18;
    const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, r);
    gr.addColorStop(0, soft ? "rgba(0,0,0,.55)" : "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(n / 2, n / 2, r, 0, 7); g.fill();
  }
  function drawCurvePreview(cv, soft) {
    const g = cv.getContext("2d"), n = cv.width;
    g.fillStyle = "#000"; g.fillRect(0, 0, n, n);
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(0, n);
    if (soft) { g.bezierCurveTo(n * .35, n, n * .5, n * .6, n, 0); } else g.lineTo(n, 0);
    g.lineTo(n, n); g.closePath(); g.fill();
  }
  function showBin(on) {
    const r = $("ldRows"), bin = $("paneBin");
    if (r) r.style.display = on ? "none" : "";
    if (bin) { bin.style.display = on ? "" : "none"; if (typeof renderBin === "function") renderBin(); }
    qa("#ldForm .ldtab").forEach((t, i) => { t.classList.toggle("on", on ? i === 1 : i === 0); t.classList.toggle("off", on ? i === 0 : i === 1); });
  }
  function doReset(fk, id) {
    const key = (fk === "pen" || fk === "pencil" || fk === "air") ? id : fk;
    delete store()[key];
    if (fk === "pen" || fk === "pencil" || fk === "air") drive("btnReset", 0, "click");
    rebuild();
  }

  // ---- the Tool panel shell ----
  let toolBody = null, brushGrid = null, colorBtn = null;
  function buildToolShell() {
    const p = $("toolPanel"); toolBody = q(".pbody", p);
    const toolOpts = $("toolOpts"), old = $("toolGrid");
    if (toolOpts) toolOpts.style.setProperty("display", "none", "important");
    if (old) old.style.setProperty("display", "none", "important");
    brushGrid = el("div", "brushgrid"); brushGrid.id = "ldBrushes";
    brushGrid.style.height = "58px";
    BRUSH_ORDER.forEach((id, i) => {
      const c = el("div", "bcell"); c.dataset.tool = id; c.title = BRUSH_NAME[id];
      c.style.left = (26 + (i % 5) * 28.5) + "px"; c.style.top = (3 + Math.floor(i / 5) * 27) + "px";
      c.innerHTML = `<img src="icons/Brush-${String(i + 1).padStart(2, "0")}.png" alt="">`;
      c.onclick = () => selectTool(id);
      brushGrid.appendChild(c);
    });
    colorBtn = el("div", "ldsel", "Color"); colorBtn.style.cssText = "position:absolute;left:27px;top:56px;width:136px";
    colorBtn.onclick = () => {
      const b = colorBtn.getBoundingClientRect();
      showMenu(b.left, b.bottom, ["Color", "Brush Texture", "Pattern"].map(n => ({ label: n, checked: n === "Color", act: () => { if (n !== "Color") stub(n); } })), b.width, colorBtn);
    };
    brushGrid.appendChild(colorBtn);
    brushGrid.style.height = "74px";
    toolBody.insertBefore(brushGrid, toolBody.firstChild);
  }
  function rebuild() {
    if (!toolBody) return;
    const old = $("ldForm"); if (old) old.remove();
    if (tool === "camera") return;
    const fk = formKey(tool);
    const f = buildForm(fk, BRUSH_ORDER.includes(tool) ? tool : lastBrush);
    toolBody.appendChild(f);
    if (tabsOn === "bin" && q(".ldtab", f)) showBin(true);
    // the header shows the same name the live app uses
    const pt = q("#toolPanel .pt"); if (pt) pt.textContent = "Tool : " + titleFor(tool);
    const flag = ["pen", "pencil", "air", "custom", "text"].includes(fk);
    if (colorBtn) colorBtn.style.display = (flag || fk === "bucket" || fk === "cut" || fk === "select" || fk === "fillshape") ? "" : "none";
    if (brushGrid) brushGrid.style.display = (flag) ? "" : "none";
    if (colorBtn && !flag) {
      // the plain forms show only the selector row
      if (brushGrid.style.display === "none") { brushGrid.style.display = ""; }
    }
    qa(".bcell", brushGrid).forEach(c => { c.style.display = flag ? "" : "none"; c.classList.toggle("on", c.dataset.tool === tool); });
    brushGrid.style.height = flag ? "74px" : "22px";
    colorBtn.style.top = flag ? "56px" : "2px";
    colorBtn.textContent = fk === "cut" ? "Copy" : fk === "select" ? "Replace" : "Color";
    if (fk === "cut" || fk === "select") colorBtn.style.left = "5px", colorBtn.style.width = "178px";
    else colorBtn.style.left = flag ? "27px" : "5px", colorBtn.style.width = flag ? "136px" : "178px";
    if (colorBtn.parentNode !== brushGrid) brushGrid.appendChild(colorBtn);
  }

  /* ------------------------------------------------------------------
     hook into the application
     ------------------------------------------------------------------ */
  const origSelectTool = selectTool;
  selectTool = function (id) {
    if (BRUSH_ORDER.includes(id)) { lastBrush = id; tabsOn = "options"; }
    origSelectTool(id);
    if (id === "fill") { const v = S("fill").range; proj.brush.tolerance = v === undefined ? 25 : v; }
    if (id === "camera") {
      const pt = q("#toolPanel .pt"); if (pt) pt.textContent = "Tool : Camera[Pro]";
      const f = $("ldForm"); if (f) f.remove();
      if (brushGrid) brushGrid.style.display = "none";
      refreshMain(); return;
    }
    rebuild(); refreshMain();
  };
  const origSync = syncToolPanel;
  syncToolPanel = function () {
    origSync();
    const f = $("ldForm");
    if (f && tool !== "camera") { const ae = doc.activeElement; if (!ae || !f.contains(ae)) rebuild(); }
  };

  function boot() {
    proj.brush.tolerance = 25;                 // the live "Range" default
    arrangeDock();
    buildMain();
    buildColor();
    buildToolShell();
    rebuild();
    refreshMain();
    const ws = q("#workarea"); if (ws) ws.style.gridTemplateColumns = "205px 1fr";
  }
  boot();
  window.__ldMenu = showMenu;
  window.__leftdock = { rebuild, refreshMain, G, TILES, FORMS, cur };
})();
