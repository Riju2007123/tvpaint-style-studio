/* ui.js v4 — TVPaint 12 shell: menu bar, dockable panels (Main Panel /
   "Tool : <name>"), viewport strip, Timeline panel (Project | Clip: Timeline),
   status bar. Same engine + stylus-safe input as v3. */
"use strict";
const E = window.Engine;
// timeline cell width in px (TVPaint's timeline at 1920px shows ~40px frames)
const CW = 40;

let proj = E.newProject(512, 512, 24);
proj.name = "Untitled_(1)";
proj.layers.forEach((l, i) => { l.name = "Anim_0" + (i + 1); });
const hist = E.makeHistory(50);
let view = { zoom: 1, x: 0, y: 0 };
let tool = "penbrush";
let shapePts = [];
let preview = null;
let sel = null;
let cutBrush = null;
let activePtr = null;
let conducting = null;
let penFlip = false;
let nsmooth = 4;
let localSmooth = false;

const $ = (id) => document.getElementById(id);
const art = $("art"), ovl = $("ovl");
const actx = art.getContext("2d"), octx = ovl.getContext("2d");
let ghostTmp = null;

let toastTimer = null;
function toast(m) {
  let s = document.getElementById("toastMsg");
  if (!s) {
    s = document.createElement("div");
    s.id = "toastMsg";
    document.body.appendChild(s);
  }
  s.textContent = m;
  s.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => s.classList.remove("show"), 2200);
}

// ================= shared render pipeline (from v3) =================
function surfaceFromDataURL(url, w, h) {
  const c = E.makeSurface(w || proj.width, h || proj.height);
  const img = new Image();
  img.onload = () => { c.getContext("2d").drawImage(img, 0, 0); renderAll(); };
  img.src = url;
  return c;
}
const restoreFns = {
  restoreFrame(layer, frameNum, payload) {
    layer.frames[frameNum] = { exposure: payload ? payload.exposure : 1,
      canvas: surfaceFromDataURL(payload && payload.data) };
    renderAll();
  },
  rebuildModel(map) {
    proj.layers.forEach(l => Object.keys(l.frames).forEach(k => {
      if (map[l.id + ":" + k]) l.frames[k].canvas = map[l.id + ":" + k];
    }));
    renderAll();
  },
  surfaceFromDataURL
};
function resizeCanvases() {
  const vp = $("viewport");
  if (art.width !== vp.clientWidth || art.height !== vp.clientHeight) {
    art.width = ovl.width = vp.clientWidth;
    art.height = ovl.height = vp.clientHeight;
  }
  if (!ghostTmp || ghostTmp.width !== proj.width) ghostTmp = E.makeSurface(proj.width, proj.height);
}
function fitView() {
  resizeCanvases();
  view.zoom = Math.min(art.width / proj.width, art.height / proj.height) * 0.95;
  view.x = (art.width - proj.width * view.zoom) / 2;
  view.y = (art.height - proj.height * view.zoom) / 2;
  renderAll();
}
function currentKeyOf(layer) {
  const k = E.effectiveFrameKey(layer, proj.currentFrame);
  return k === null ? proj.currentFrame : k;
}
// Per-layer playback behaviour when the playhead passes the layer's last image
// (REA: the small control beside the layer — None / Loop / Ping-Pong / Hold).
function playbackKey(layer, f) {
  const k = E.effectiveFrameKey(layer, f);
  if (k !== null) return k;
  const keys = Object.keys(layer.frames).map(Number).sort((a, b) => a - b);
  if (!keys.length) return null;
  const last = keys[keys.length - 1];
  const lastEnd = last + (layer.frames[last].exposure || 1) - 1;
  if (f <= lastEnd) return k;
  const mode = layer.playback || "None";
  if (mode === "None") return null;
  const timeline = [];
  for (let i = 1; i <= lastEnd; i++) timeline.push(E.effectiveFrameKey(layer, i));
  const len = timeline.length;
  if (!len) return null;
  const idx = f - 1;
  if (mode === "Hold") return timeline[len - 1];
  if (mode === "Loop") return timeline[idx % len];
  if (mode === "Ping-Pong") {
    const cyc = idx % (2 * len);
    return timeline[cyc < len ? cyc : 2 * len - 1 - cyc];
  }
  return null;
}
// Layer playback popup (REA screenshot: ✓ None / Loop / Ping-Pong / Hold)
function openLayerPlayback(i, btn) {
  document.querySelectorAll(".pbmenu").forEach(x => x.remove());
  const cur = proj.layers[i].playback || "None";
  const m = document.createElement("div");
  m.className = "pbmenu";
  const r = btn.getBoundingClientRect();
  m.style.left = r.left + "px";
  m.style.top = (r.bottom + 2) + "px";
  m.innerHTML = `<div class="pbhead">Loop Mode</div>` + ["None", "Loop", "Ping-Pong", "Hold"].map(k =>
    `<div class="pbi${k === cur ? " on" : ""}" data-k="${k}"><span class="chk">${k === cur ? "✓" : ""}</span>${k}</div>`).join("");
  document.body.appendChild(m);
  m.querySelectorAll(".pbi").forEach(el => el.onclick = (ev) => {
    ev.stopPropagation();
    proj.layers[i].playback = el.dataset.k;
    m.remove();
    renderAll();
    toast("playback: " + el.dataset.k);
  });
  const off = (ev) => {
    if (!m.contains(ev.target)) { m.remove(); document.removeEventListener("pointerdown", off, true); }
  };
  document.addEventListener("pointerdown", off, true);
}
function renderArtOnly() {
  actx.setTransform(1, 0, 0, 1, 0, 0);
  actx.fillStyle = "#313136";
  actx.fillRect(0, 0, art.width, art.height);
  actx.translate(view.x, view.y);
  actx.scale(view.zoom, view.zoom);
  actx.imageSmoothingEnabled = proj.antiAlias !== "None";
  // paper background (timeline footer: Background dropdown — loc 25300..25302)
  const bg = proj.background || "none";
  const bgA = proj.bgA || "#ffffff", bgB = proj.bgB || "#cfcfcf";
  if (bg === "check" || bg === "Checkerboard") {
    const s = 16;
    actx.fillStyle = bgA; actx.fillRect(0, 0, proj.width, proj.height);
    actx.fillStyle = bgB;
    for (let y = 0; y < proj.height; y += s)
      for (let x = 0; x < proj.width; x += s)
        if (((x / s) + (y / s)) % 2 === 0) actx.fillRect(x, y, s, s);
  } else if (bg === "color" || bg === "White" || bg === "Black" || bg === "Background") {
    actx.fillStyle = bg === "Black" ? "#000000" : bg === "White" || bg === "Background" ? "#ffffff" : bgA;
    actx.fillRect(0, 0, proj.width, proj.height);
  } else {
    // None = transparent: TVPaint displays transparency as a checkerboard
    const s = 16;
    actx.fillStyle = "#d9d9de"; actx.fillRect(0, 0, proj.width, proj.height);
    actx.fillStyle = "#f4f4f7";
    for (let y = 0; y < proj.height; y += s)
      for (let x = 0; x < proj.width; x += s)
        if (((x / s) + (y / s)) % 2 === 0) actx.fillRect(x, y, s, s);
  }
  const camKeys = proj.cameraKeys && proj.cameraKeys.length;
  // TVPaint: the camera IS the lens — with camera keys present the canvas always
  // renders through the camera (the Camera View toggle only shows/hides the overlay).
  if (camKeys) {
    // render through the camera: fit the camera rect, apply rotate/zoom/flip
    const cam = E.cameraEvaluate(proj, proj.currentFrame);
    const r = E.cameraRect(proj, cam);
    const s = Math.min(art.width / r.w, art.height / r.h) / view.zoom;
    actx.save();
    actx.translate(r.cx, r.cy);
    actx.rotate(-(cam.rotation || 0) * Math.PI / 180);
    actx.scale((cam.flipX ? -s : s), (cam.flipY ? -s : s));
    actx.translate(-r.cx, -r.cy);
  }
  const cur = proj.layers[proj.currentLayer];
  if (proj.onion.enabled) {
    for (let i = 1; i <= proj.onion.before; i++)
      drawGhost(cur, proj.currentFrame - i, proj.onion.tintBefore, 0.35 / i);
    for (let i = proj.onion.after; i >= 1; i--)
      drawGhost(cur, proj.currentFrame + i, proj.onion.tintAfter, 0.35 / i);
  }
  proj.layers.forEach((l, li) => {
    if (!l.visible) return;
    const key = E.effectiveFrameKey(l, proj.currentFrame);
    const surf = key !== null ? l.frames[key].canvas : null;
    if (!surf || !surf.getContext) return;
    actx.globalAlpha = l.opacity * (l.lighttable && li !== proj.currentLayer ? 0.3 : 1);
    const comp = blendToComposite(l.blend);
    if (comp) actx.globalCompositeOperation = comp;
    actx.drawImage(surf, 0, 0);
    actx.globalCompositeOperation = "source-over";
    actx.globalAlpha = 1;
  });
  if (camKeys) actx.restore();
}
function renderOverlayOnly() {
  octx.setTransform(1, 0, 0, 1, 0, 0);
  octx.clearRect(0, 0, ovl.width, ovl.height);
  octx.translate(view.x, view.y);
  octx.scale(view.zoom, view.zoom);
  drawGuidelines();
  if (preview && preview.pts) {
    octx.save();
    octx.strokeStyle = "#6fa8c9"; octx.fillStyle = "rgba(111,168,201,0.2)";
    octx.lineWidth = 1.5 / view.zoom;
    octx.setLineDash([5 / view.zoom, 3 / view.zoom]);
    if (preview.poly) {
      octx.beginPath();
      preview.poly.forEach((p, i) => i ? octx.lineTo(p.x, p.y) : octx.moveTo(p.x, p.y));
      octx.stroke();
    } else drawShapePath(octx, preview.pts, preview.kind, !!preview.fill);
    octx.restore();
  }
  if (sel) drawSelectionOverlay();
  if (proj.cameraKeys && proj.cameraKeys.length) {
    drawCameraOverlay();
    if (panelEls[2] && panelEls[2].querySelector(".pbody")._syncCamera)
      panelEls[2].querySelector(".pbody")._syncCamera();
  }
}
function renderAll() {
  resizeCanvases();
  renderArtOnly();
  renderOverlayOnly();
  renderTimelineSoon();
  renderLayersPanel();
  renderTimelineStatus();
  updateZoomLbl();
}
// FAST paths used during pointer drags (TVPaint paints live, no full re-render):
function fastRenderAll() {   // art changed, but no DOM/timeline work
  resizeCanvases();
  renderArtOnly();
  renderOverlayOnly();
}
function liveStrokePaint() {   // cheapest: blit the frozen under-everything + growing scratch
  if (!strokeBase) return fastRenderAll();
  actx.setTransform(1, 0, 0, 1, 0, 0);
  actx.drawImage(strokeBase, 0, 0);            // screen-space base (opaque, covers all)
  actx.translate(view.x, view.y);
  actx.scale(view.zoom, view.zoom);
  if (drawState.scratch) {
    actx.globalAlpha = Math.max(0, Math.min(1, proj.brush.opacity ?? 1));
    actx.drawImage(drawState.scratch, 0, 0);
    actx.globalAlpha = 1;
  }
  actx.setTransform(1, 0, 0, 1, 0, 0);
}
let strokeBase = null;
function updateZoomLbl() {
  const z = $("zoomLbl"), z2 = $("zoomLbl2");
  const t = (view.zoom * 100).toFixed(2) + "%";
  if (z) z.textContent = t;
  if (z2) z2.textContent = t;
}
function drawSelectionOverlay() {
  octx.save();
  octx.drawImage(sel.img, sel.x + sel.dx, sel.y + sel.dy);
  octx.strokeStyle = "#ffd24a"; octx.lineWidth = 1 / view.zoom;
  octx.setLineDash([4 / view.zoom, 3 / view.zoom]);
  if (sel.poly) {
    octx.beginPath();
    sel.poly.forEach((p, i) => i ? octx.lineTo(p.x + sel.dx, p.y + sel.dy) : octx.moveTo(p.x + sel.dx, p.y + sel.dy));
    octx.closePath(); octx.stroke();
  } else octx.strokeRect(sel.x + sel.dx, sel.y + sel.dy, sel.w, sel.h);
  octx.restore();
}
function drawGhost(layer, f, tint, alpha) {
  if (f < 1) return;
  const k = E.effectiveFrameKey(layer, f);
  if (k === null || k === undefined) return;
  const surf = layer.frames[k] && layer.frames[k].canvas;
  if (!surf || !surf.getContext) return;
  const t = ghostTmp.getContext("2d");
  t.globalCompositeOperation = "source-over";
  t.clearRect(0, 0, proj.width, proj.height);
  t.drawImage(surf, 0, 0);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = tint; t.fillRect(0, 0, proj.width, proj.height);
  actx.globalAlpha = alpha; actx.drawImage(ghostTmp, 0, 0); actx.globalAlpha = 1;
}
function drawGuidelines() {
  octx.save(); octx.lineWidth = 1 / view.zoom;
  if (proj.guidelines.grid) {
    octx.strokeStyle = "rgba(120,160,200,0.25)";
    for (let x = 0; x <= proj.width; x += proj.width / 12) {
      octx.beginPath(); octx.moveTo(x, 0); octx.lineTo(x, proj.height); octx.stroke();
    }
    for (let y = 0; y <= proj.height; y += proj.height / 12) {
      octx.beginPath(); octx.moveTo(0, y); octx.lineTo(proj.width, y); octx.stroke();
    }
  }
  if (proj.guidelines.thirds) {
    octx.strokeStyle = "rgba(255,210,74,0.35)";
    for (let i = 1; i < 3; i++) {
      octx.beginPath(); octx.moveTo(proj.width * i / 3, 0); octx.lineTo(proj.width * i / 3, proj.height); octx.stroke();
      octx.beginPath(); octx.moveTo(0, proj.height * i / 3); octx.lineTo(proj.width, proj.height * i / 3); octx.stroke();
    }
  }
  if (proj.guidelines.safeArea) {
    octx.strokeStyle = "rgba(220,110,110,0.8)";
    octx.setLineDash([6 / view.zoom, 4 / view.zoom]);
    octx.strokeRect(proj.width * .05, proj.height * .05, proj.width * .9, proj.height * .9);
    octx.setLineDash([]); octx.strokeStyle = "rgba(220,110,110,0.45)";
    octx.strokeRect(proj.width * .1, proj.height * .1, proj.width * .8, proj.height * .8);
  }
  octx.restore();
}
function drawShapePath(c, pts, kind, filled) {
  c.beginPath();
  const base = ["fline","frectangle","fellipse","fcirclec","fcircle2pts","fcircle3pts",
    "fspline3pts","fbezier","fbspline","ffreehand"].includes(kind) ? kind.slice(1) : kind;
  switch (base) {
    case "line": if (pts.length < 2) return; c.moveTo(pts[0].x, pts[0].y); c.lineTo(pts[1].x, pts[1].y); break;
    case "rectangle": {
      c.rect(Math.min(pts[0].x, pts[1].x), Math.min(pts[0].y, pts[1].y),
        Math.abs(pts[1].x - pts[0].x), Math.abs(pts[1].y - pts[0].y)); break;
    }
    case "ellipse":
      c.ellipse((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2,
        Math.abs(pts[1].x - pts[0].x) / 2, Math.abs(pts[1].y - pts[0].y) / 2, 0, 0, Math.PI * 2); break;
    case "circlec":
      c.arc(pts[0].x, pts[0].y, Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y), 0, Math.PI * 2); break;
    case "circle2pts":
      c.arc((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2,
        Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) / 2, 0, Math.PI * 2); break;
    case "circle3pts": {
      if (pts.length < 3) return;
      const [a, b, p3] = pts;
      const d = 2 * (a.x * (b.y - p3.y) + b.x * (p3.y - a.y) + p3.x * (a.y - b.y));
      if (!d) return;
      const ux = ((a.x ** 2 + a.y ** 2) * (b.y - p3.y) + (b.x ** 2 + b.y ** 2) * (p3.y - a.y) +
        (p3.x ** 2 + p3.y ** 2) * (a.y - b.y)) / d;
      const uy = ((a.x ** 2 + a.y ** 2) * (p3.x - b.x) + (b.x ** 2 + b.y ** 2) * (a.x - p3.x) +
        (p3.x ** 2 + p3.y ** 2) * (b.x - a.x)) / d;
      c.arc(ux, uy, Math.hypot(a.x - ux, a.y - uy), 0, Math.PI * 2); break;
    }
    case "spline3pts": case "bspline":
      if (pts.length < 3) return;
      c.moveTo(pts[0].x, pts[0].y);
      c.quadraticCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y); break;
    case "bezier":
      if (pts.length < 4) return;
      c.moveTo(pts[0].x, pts[0].y);
      c.bezierCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y); break;
    case "freehand":
      if (!pts.length) return;
      c.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => c.lineTo(p.x, p.y)); break;
    default: return;
  }
  filled ? c.fill() : c.stroke();
}
const FILL_SHAPES = new Set(["fline","frectangle","fellipse","fcirclec","fcircle2pts",
  "fcircle3pts","fspline3pts","fbezier","fbspline","ffreehand"]);
const SHAPE_INFO = {
  freehand: { drag: "freehand" }, ffreehand: { drag: "freehand", fill: true },
  dot: { discrete: true }, dotsingle: { discrete: true, single: true },
  line: { drag: 2 }, fline: { drag: 2, fill: true },
  rectangle: { drag: 2 }, frectangle: { drag: 2, fill: true },
  ellipse: { drag: 2 }, fellipse: { drag: 2, fill: true },
  circlec: { drag: 2 }, fcirclec: { drag: 2, fill: true },
  circle2pts: { drag: 2 }, fcircle2pts: { drag: 2, fill: true },
  circle3pts: { click: 3 }, fcircle3pts: { click: 3, fill: true },
  spline3pts: { click: 3 }, fspline3pts: { click: 3, fill: true },
  bspline: { click: 3 }, fbspline: { click: 3, fill: true },
  bezier: { click: 4 }, fbezier: { click: 4, fill: true }
};
function commitShapePts(color, info) {
  const layer = proj.layers[proj.currentLayer];
  if (layer.locked) return toast("layer is locked");
  const key = currentKeyOf(layer);
  hist.pushFrame(proj, layer, key);
  const surf = E.frameSurface(proj, layer, key, true);
  const c = surf.getContext("2d");
  c.strokeStyle = color; c.fillStyle = color;
  c.lineWidth = proj.brush.size;
  c.lineCap = "round"; c.lineJoin = "round";
  if (info.fill) {
    c.save();
    c.globalAlpha = proj.brush.opacity;   // whole-fill cap (Power remains per-pass)
    if (info.grad) {
      // gradient vector = drag start → drag end (map_gradient vector)
      const v0 = shapePts[0], v1 = shapePts[shapePts.length - 1];
      c.fillStyle = E.gradientFill(c, GRAD_MODES[tool], v0.x, v0.y, v1.x, v1.y, proj.apen, proj.bpen);
    }
    drawShapePath(c, shapePts, tool, true);
    c.restore();
  } else {
    drawShapePath(c, shapePts, tool, false);
  }
  shapePts = []; preview = null;
  hist.sealLast(proj, layer, key);
  renderAll();
}
function stampDot(p, color) {
  const layer = proj.layers[proj.currentLayer];
  const c = E.frameSurface(proj, layer, currentKeyOf(layer), true).getContext("2d");
  E.brushStamp(c, proj.brush, color, p.x, p.y, 1, proj);
}
function applyModes(c) {
  const m = proj.brush.drawMode;
  if (m === "behind") c.globalCompositeOperation = "destination-over";
  else if (m === "erase") c.globalCompositeOperation = "destination-out";
  else if (m === "alpha" || m === "tint") c.globalCompositeOperation = "source-atop";
  else if (m === "multiply") c.globalCompositeOperation = "multiply";
  else if (m === "screen") c.globalCompositeOperation = "screen";
  else if (m === "overlay") c.globalCompositeOperation = "overlay";
}
function stampCutBrush(p) {
  const layer = proj.layers[proj.currentLayer];
  const c = E.frameSurface(proj, layer, currentKeyOf(layer), true).getContext("2d");
  const s = proj.brush.size / cutBrush.size;
  c.save(); applyModes(c);
  c.globalAlpha *= proj.brush.opacity * Math.max(0, Math.min(1, proj.brush.power));
  c.translate(p.x, p.y); c.scale(s, s);
  c.drawImage(cutBrush.img, -cutBrush.img.width / 2, -cutBrush.img.height / 2);
  c.restore();
}
function doFill(p, color, tol) {
  const layer = proj.layers[proj.currentLayer];
  if (layer.locked) return toast("layer is locked");
  const key = currentKeyOf(layer);
  hist.pushFrame(proj, layer, key);
  const n = E.floodFill(proj, layer, key, p, color, tol);
  if (n === 0) { hist.undo(proj, restoreFns); toast("nothing to fill"); }
  else { hist.sealLast(proj, layer, key); toast(`filled ${n} px`); }
  renderAll();
}

// ================= menu bar =================
const MENUS = [
  ["File", [
    ["New Project…", () => dlgNewProject()], ["Open Project…", () => uiOpen()],
    null, ["Save Project", () => uiSave()], ["Save Project As…", () => uiSaveAs()],
    null, ["Export Current Frame (PNG)", () => exportFrame()],
    ["Export Image Sequence…", () => exportSequence()],
    null, ["RECENT", "recent"]
  ]],
  ["Edit", [
    ["Undo", () => uiUndo()], ["Redo", () => uiRedo()], ["Clear Image (current layer)", () => xop("empty")],
    null, ["Toggle Bookmark", () => toggleBookmark()],
    ["Go to Previous Bookmark", () => gotoBookmark(-1)], ["Go to Next Bookmark", () => gotoBookmark(1)],
    ["Remove Selected Bookmark", () => removeBookmark(proj.currentFrame)],
    ["Remove All Bookmarks", () => { proj.bookmarks = []; renderAll(); }],
    null, ["Set Mark ▸", "mark"],
    ["Go to Previous Image Mark", () => { const m = E.nextImageMark(tvCurrentLayer(), proj.currentFrame, -1); if (m) gotoFrame(m); else toast("no previous image mark"); }],
    ["Go to Next Image Mark", () => { const m = E.nextImageMark(tvCurrentLayer(), proj.currentFrame, 1); if (m) gotoFrame(m); else toast("no next image mark"); }],
    ["Remove All Image Marks", () => { tvCommit(() => { tvCurrentLayer().marks = {}; }); toast("image marks removed"); }],
    null, ["Re Apply", () => { if (sel) applySelection(); }],
    null, ["ClipBoard ▸", "clipboard"],
    ["Shortcuts…", () => alert("Space play\nArrow keys: frame/layer\nCtrl+Z undo · Ctrl+Y redo · Ctrl+S save\nEnter: apply selection · Esc: cancel")],
    ["Preferences…", () => toast("preferences — not in this prototype")]
  ]],
  ["Project", [
    ["Duplicate Project", () => { proj.name = "Untitled_(" + (+(proj.name.match(/\d+/) || [0])[0] + 1) + ")"; renderTimelineStatus(); toast("project duplicated: " + proj.name); }],
    ["Modify Project…", () => dlgNewProject(true)],
    null, ["Render Camera ▸", null, 1],
    null, ["Load Sound…", () => togglePane("sound")],
    ["Add sound from library", () => togglePane("sound")],
    null, ["Project Information", () => alert(
      "Project: " + proj.name + "\nSize: " + proj.width + "x" + proj.height + "\nFrame rate: " + proj.fps +
      "\nLayers: " + proj.layers.length + "\nCamera keys: " + (proj.cameraKeys || []).length)],
    null, ["Go to ▸", "goto"]
  ]],
  ["Clip", [
    ["Rename Clip…", () => { const n = prompt("Clip name:", "Clip_001"); if (n) toast("clip renamed: " + n); }],
    null, ["New Clip", null, 1], ["Duplicate Clip", null, 1], ["Delete Clip", null, 1],
    ["Split Clip", null, 1], ["Merge clips", null, 1],
    null, ["New Scene", null, 1], ["Duplicate Scene", null, 1], ["Delete Scene", null, 1],
    null, ["Load Sound…", () => togglePane("sound")],
    null, ["Send to ▸", null, 1]
  ]],
  ["Layer", [
    ["New Layer", () => layerAdd()],
    ["Open Layer Presets Manager", () => layerPresetsDlg()],
    ["Rename Layer…", () => { const n = prompt("Layer name:", proj.layers[proj.currentLayer].name); if (n) { proj.layers[proj.currentLayer].name = n; renderAll(); } }],
    ["Delete All Layers…", () => toast("use Layer ▸ Delete Layer")],
    ["Delete Layer", () => layerDel()],
    ["Split Layer", null, 1],
    ["Duplicate Layer", () => layerDup()],
    null, ["Lock Layer", () => toggleLayerFlagAt(proj.currentLayer, "locked")],
    ["Lock Position", null, 1],
    null, ["Reverse Order", () => { proj.layers.reverse(); proj.currentLayer = proj.layers.length - 1 - proj.currentLayer; renderAll(); }],
    ["Merge", () => mergeLayerDown()],
    null, ["View All Layers", () => { proj.layers.forEach(l => l.visible = true); renderAll(); }],
    ["View Current Layer Only", () => { proj.layers.forEach((l, i) => l.visible = i === proj.currentLayer); renderAll(); }],
    null, ["Make Anim Layer", null, 1],
    ["Select All Layers", () => selectLayers("all")],
    null, ["Cut Layer", () => { clipboardLayer = proj.layers.splice(proj.currentLayer, 1)[0]; proj.currentLayer = Math.min(proj.currentLayer, proj.layers.length - 1); renderAll(); }],
    ["Copy Layer", () => { clipboardLayer = proj.layers[proj.currentLayer]; toast("layer copied"); }],
    ["Paste Layer (Above)", () => { if (!clipboardLayer) { toast("clipboard empty"); return; } proj.layers.splice(proj.currentLayer, 0, JSON.parse(JSON.stringify(clipboardLayer, (k, v) => k === "canvas" ? undefined : v))); renderAll(); }]
  ]],
  ["Image", [
    ["Add Drawing (after current)", () => xop("add")],
    ["Duplicate Drawing", () => xop("duplicate")],
    ["Remove Drawing", () => xop("remove")],
    null, ["Hold ×2", () => xop("hold")], ["Unhold", () => xop("unhold")],
    ["Empty (clear)", () => xop("empty")], ["Reverse to End", () => xop("reverse")],
    null, ["Increase Layer Length…", () => dlgLayerLength()]
  ]],
  ["Effects", [["(not in this prototype)", null, 1]]],
  ["View", [
    ["Onion Skin", () => toggleOnion()],
    ["Grid", () => toggleGuide("grid", !proj.guidelines.grid)],
    ["Safe Area", () => toggleGuide("safeArea", !proj.guidelines.safeArea)],
    ["Rule of Thirds", () => toggleGuide("thirds", !proj.guidelines.thirds)],
    null, ["Camera View", () => { camView = !camView; toast("camera view " + (camView ? "on" : "off")); renderAll(); }],
    null, ["Fit View", () => fitView()], ["Zoom 100%", () => zoomTo()]
  ]],
  ["Windows", [["Main Panel", () => togglePanel(0)], ["Tool Panel", () => togglePanel(1)], ["Camera Panel", () => togglePanel(2)], ["Timeline", null, 1]]],
  ["Help", [
    ["George Console…", () => {
      const w = $("georgeWin");
      if (!w) return;
      const show = w.style.display !== "flex";
      w.style.display = show ? "flex" : "none";
      if (show) $("georgeIn").focus();
    }],
    ["About my-version", () => alert("my-version — rebuilt from REA analysis of TVPaint Animation 12 Pro. No original code copied.")]
  ]]
];
let menusBuilt = false;
function buildMenubar() {
  if (menusBuilt) return;
  menusBuilt = true;
  const mb = $("menubar");
  mb.innerHTML = "";
  MENUS.forEach(([name, items]) => {
    const t = document.createElement("div");
    t.className = "menu-t"; t.textContent = name;
    const dd = document.createElement("div");
    dd.className = "menu-dd";
    items.forEach(it => {
      if (!it) { const s = document.createElement("div"); s.className = "msep"; dd.appendChild(s); return; }
      const [label, action, dis] = it;
      const mi = document.createElement("div");
      mi.className = "mi" + (dis ? " mdis" : "");
      mi.textContent = label === "RECENT" ? "Recent Projects ▸" : (typeof label === "function" ? label() : label);
      if (!dis) mi.onclick = (ev) => {
        ev.stopPropagation();                       // don't bubble to the title's toggle
        t.classList.remove("open");
        if (action === "recent") { promptRecent(); return; }
        action && action();
      };
      dd.appendChild(mi);
    });
    t.appendChild(dd);
    t.onclick = (e) => {
      e.stopPropagation();
      const was = t.classList.contains("open");
      closeMenus();
      if (!was) t.classList.add("open");
    };
    mb.appendChild(t);
  });
  const purchase = document.createElement("button");
  purchase.id = "purchase"; purchase.textContent = "PURCHASE";
  purchase.onclick = () => toast("(this is a rebuild — nothing to buy)");
  mb.appendChild(purchase);
  document.addEventListener("click", closeMenus);
}
function closeMenus() {
  document.querySelectorAll(".menu-t.open").forEach(t => t.classList.remove("open"));
}
function promptRecent() {
  const list = loadRecent();
  if (!list.length) { toast("no recent projects"); return; }
  const name = prompt("Open recent:\n" + list.map((e, i) => (i + 1) + ". " + e.name).join("\n"), "1");
  const pick = list[+name - 1];
  if (pick) uiOpenRecent(pick.name);
}

// ================= toolbar row =================
function buildToolbar() {
  const tb = $("toolbar");
  const mk = (icon, tip, fn, id) => {
    const b = document.createElement("button");
    b.className = "tib"; b.title = tip;
    if (id) b.id = id;
    b.innerHTML = `<img src="icons/${icon}-x20.png" alt="">`;
    b.onclick = fn;
    tb.appendChild(b);
    return b;
  };
  mk("FileNew", "New project", () => uiNew());
  mk("FileOpen", "Open project", () => uiOpen());
  mk("FileSave", "Save project", () => uiSave());
  mk("FileSave", "Save project as…", () => uiSaveAs());
  const sep1 = document.createElement("div"); sep1.className = "sep"; tb.appendChild(sep1);
  mk("Undo", "Undo (Ctrl+Z)", () => uiUndo());
  mk("Redo", "Redo (Ctrl+Y)", () => uiRedo());
  const sep2 = document.createElement("div"); sep2.className = "sep"; tb.appendChild(sep2);
  mk("Lighttable", "Onion skin (ghosts)", () => toggleOnion(), "tbOnion");
  mk("MiscGuidelineGrid", "Cycle guidelines", () => cycleGuides(), "tbGuides");
  mk("Zoom-Rect", "Fit view", () => fitView());
  mk("MiscLayers", "Timeline focus", () => { $("tlpanel").scrollIntoView(); });
  mk("ColorPicker", "APen color", () => { const c = prompt("APen color (#hex):", proj.apen); if (c) setApen(c); });
  const tab = document.createElement("div");
  tab.id = "projTab";
  tb.appendChild(tab);
}

// ================= left panels =================
const MAINGRID = [
  ["selrect", "Shape-Selection-Rectangle", "Selection: rectangle"],
  ["selfreehand", "Shape-Selection-FreeHand", "Freehand selection"],
  ["cutrect", "Shape-CutBrush-Rectangle", "Cut brush (rect grab)"],
  ["cutfreehand", "Shape-CutBrush-FreeHand", "Cut brush (lasso grab)"],
  ["transform", "Shape-Transform", "Transform (move selection)"],
  ["fill", "Shape-FloodFill", "Flood fill"],
  ["speedfill", "ToolSpeedFill", "Speed fill"],
  ["pick", "Color-Pick", "Color pick"],
  ["panning", "Shape-Panning-Tool", "Panning"],
  ["zoomrect", "Zoom-Rect", "Zoom rectangle"],
  ["crop", "Shape-Crop", "Crop (soon)", 1],
  ["camera", "Shape-Camera", "Camera (keyframe path + locks)"]
];
const TOOLGRID = [
  ["penbrush", "ToolPenBrush", "Freehand — Pen Brush"],
  ["pencilbrush", "ToolPencilBrush", "Pencil Brush"],
  ["mechanicalpencil", "ToolMechanicalPencil", "Mechanical Pencil"],
  ["oilbrush", "ToolOilBrush", "Oil Brush"],
  ["wetbrush", "ToolWetBrush", "Wet Brush"],
  ["airbrush", "ToolAirBrush", "Airbrush"],
  ["chalkbrush", "ToolPencilBrush", "Chalk Brush"],
  ["specialbrush", "ToolSpecialBrush", "Special Brush"],
  ["textbrush", "ToolTextBrush", "Text Brush"],
  ["custombrush", "ToolCustomBrush", "Custom Brush (Bin)"],
  ["eraser", "ToolEraser", "Eraser"],
  ["warpbrush", "ToolWarpBrush", "Warp Brush (Fx — soon)", 1]
];
const GRAPHS = [
  ["freehand", "Shape-FreeHand-Line", "Freehand line"],
  ["dot", "Shape-FreeHand-Dot", "Dots while dragging"],
  ["dotsingle", "Shape-FreeHand-Dot-Single", "Dot (single)"],
  ["line", "Shape-Line", "Line"],
  ["fline", "Shape-Fill-Line", "Fill line"],
  ["rectangle", "Shape-Rectangle", "Rectangle"],
  ["frectangle", "Shape-Fill-Rectangle", "Fill rectangle"],
  ["ellipse", "Shape-Ellipse", "Ellipse"],
  ["fellipse", "Shape-Fill-Ellipse", "Fill ellipse"],
  ["circlec", "Shape-CircleC", "Circle C+pt"],
  ["fcirclec", "Shape-Fill-CircleC", "Fill circle C+pt"],
  ["circle2pts", "Shape-Circle2Pts", "Circle 2 pts"],
  ["fcircle2pts", "Shape-Fill-Circle2Pts", "Fill circle 2pts"],
  ["circle3pts", "Shape-Circle3Pts", "Circle 3 pts"],
  ["fcircle3pts", "Shape-Fill-Circle3Pts", "Fill circle 3pts"],
  ["spline3pts", "Shape-Spline3Pts", "Spline 3"],
  ["fspline3pts", "Shape-Fill-Spline3Pts", "Fill spline"],
  ["bezier", "Shape-Bezier", "Bezier"],
  ["fbezier", "Shape-Fill-Bezier", "Fill bezier"],
  ["bspline", "Shape-B-Spline", "B-Spline"],
  ["fbspline", "Shape-Fill-B-Spline", "Fill B-Spline"],
  ["fgrad01", "Shape-FloodFill-Gradient01", "Gradient: linear"],
  ["fgrad02", "Shape-FloodFill-Gradient02", "Gradient: circle"],
  ["fgrad03", "Shape-FloodFill-Gradient03", "Gradient: radial"],
  ["fgrad04", "Shape-FloodFill-Gradient04", "Gradient: square"],
  ["fgrad05", "Shape-FloodFill-Gradient05", "Gradient: inverted"]
];
const GRAD_MODES = {
  fgrad01: "linear01", fgrad02: "circle02", fgrad03: "radial03",
  fgrad04: "square04", fgrad05: "invert05"
};
const TOOL_LABELS = Object.fromEntries([
  ...TOOLGRID, ...GRAPHS, ...MAINGRID, ["selclear", "Clear Selection"]
].map(([id, , tip]) => [id, (tip || id).split("(")[0].trim()]));
TOOL_LABELS.penbrush = "Pen Brush"; TOOL_LABELS.pencilbrush = "Pencil Brush";
TOOL_LABELS.mechanicalpencil = "Mechanical Pencil"; TOOL_LABELS.oilbrush = "Oil Brush";
TOOL_LABELS.wetbrush = "Wet Brush"; TOOL_LABELS.airbrush = "Airbrush";
TOOL_LABELS.chalkbrush = "Chalk Brush"; TOOL_LABELS.specialbrush = "Special Brush";
TOOL_LABELS.textbrush = "Text Brush"; TOOL_LABELS.custombrush = "Custom Brush";
TOOL_LABELS.eraser = "Eraser"; TOOL_LABELS.speedfill = "Speed Fill";
TOOL_LABELS.fill = "Flood Fill"; TOOL_LABELS.pick = "Color Pick";
TOOL_LABELS.transform = "Transform"; TOOL_LABELS.panning = "Panning";
TOOL_LABELS.zoomrect = "Zoom"; TOOL_LABELS.selrect = "Rectangle Selection";
TOOL_LABELS.selfreehand = "Freehand Selection";
TOOL_LABELS.cutrect = "Cut Brush"; TOOL_LABELS.cutfreehand = "Cut Brush";

let panelEls = [];
function buildPanels() {
  const wrap = $("panels"); wrap.innerHTML = ""; panelEls = [];
  const mkPanel = (title) => {
    const p = document.createElement("div"); p.className = "panel";
    p.innerHTML = `<div class="phead"><span class="pt">${title}</span>
      <button class="pw" title="collapse">▼</button>
      <button class="pw" title="close">✕</button>
      <button class="pw" title="lock">⚿</button></div><div class="pbody"></div>`;
    wrap.appendChild(p);
    const [head, body] = [p.querySelector(".phead"), p.querySelector(".pbody")];
    head.querySelector("button[title=collapse]").onclick =
      (e) => { e.stopPropagation(); body.style.display = body.style.display === "none" ? "" : "none"; };
    head.querySelector("button[title=close]").onclick =
      (e) => { e.stopPropagation(); p.style.display = "none"; };
    panelEls.push(p);
    return body;
  };
  // ---- Main Panel ----
  const main = mkPanel("Main Panel");
  main.innerHTML = `<div class="toolgrid g6" id="mainGrid"></div>
    <div class="minirow">
      <button class="minib" id="btnBinClear" title="clear Custom Brush">Clear Bin</button>
      <button class="minib" onclick="toggleLoop()" id="rLoopT">Loop</button>
    </div>`;
  buildBtnGrid($("mainGrid"), MAINGRID);
  $("btnBinClear").onclick = clearBin;
  // ---- Tool : <name> Panel ----
  const tp = mkPanel("Tool : Pen Brush");
  panelEls[1].id = "toolPanel";
  tp.innerHTML = `
    <div class="toolgrid g6" id="toolGrid"></div>
    <h4 style="margin:6px 0 2px;color:#898989;font-size:10px">GRAPHS</h4>
    <div class="toolgrid g6" id="graphGrid" style="max-height:132px;overflow-y:auto"></div>
    <div class="orow"><label>Color</label>
      <select id="colSel" style="flex:1"></select>
      <span id="chipA" style="width:22px;height:16px;border-radius:2px;border:1px solid #000;flex:none"></span></div>
    <div class="tabs"><div class="tab on" data-tab="options">Options</div><div class="tab" data-tab="bin">Bin</div></div>
    <div id="paneOptions">
      <div class="orow"><label>Size</label><span class="badge">P</span>
        <input type="number" id="optSize" min="1" max="200" value="4.5" step="0.5"></div>
      <div class="orow"><label>Power</label><span class="badge">C</span>
        <input type="number" id="optPower" min="5" max="100" value="100"></div>
      <div class="orow"><label>Opacity</label>
        <input type="number" id="optOpacity" min="5" max="100" value="100"></div>
      <div class="orow" id="rowGrain"><label>Grain</label>
        <input type="number" id="optGrain" min="0" max="100" value="0"></div>
      <div class="orow"><label>Drawing Mode</label>
        <select id="dmSel" style="flex:1">
          <option>Normal</option><option>Behind</option><option>Erase</option>
          <option>Alpha</option><option>Tint</option><option>Multiply</option>
          <option>Screen</option><option>Overlay</option>
        </select></div>
      <div class="orow"><label>Drying</label><select id="drySel" disabled>
        <option value="0">Immediate</option><option value="1">Fast</option>
        <option value="3">Wet</option><option value="8">Slow</option></select></div>
      <div class="orow"><label>Gradient</label><input type="text" id="gradIn" value="" disabled></div>
      <div class="orow"><label>AAliasing</label><input type="checkbox" id="chkAA" checked>
        <select id="optAA"><option>None</option><option>Medium</option>
        <option selected>High</option><option>Highest</option></select></div>
      <div class="orow"><label>Preview</label><input type="checkbox" id="chkPreview" checked></div>
      <div class="orow"><label>Use Line Smoothing</label><input type="checkbox" id="chkLS" checked></div>
      <div class="orow"><label>Use Local Smoothing</label><input type="checkbox" id="chkLocal"></div>
      <div class="orow" style="justify-content:center"><button class="revbtn" id="btnReset">Reset</button></div>
    </div>
    <div id="paneBin" style="display:none">
      <div style="text-align:center;color:#898989;margin:8px 0" id="binInfo">Bin stores the
        captured Custom Brush (Cut Brush tool grabs pixels from the canvas).</div>
      <div style="display:flex;justify-content:center"><canvas id="binThumb" width="64" height="64"
        style="background:#2D2D32;border:1px solid #2D2D32;border-radius:3px"></canvas></div>
      <div class="minirow" style="justify-content:center">
        <button class="minib" id="btnBinClear2">Clear Bin</button></div>
    </div>`;
  buildBtnGrid($("toolGrid"), TOOLGRID);
  buildBtnGrid($("graphGrid"), GRAPHS);
  wireToolOptions();
  // tabs
  tp.querySelectorAll(".tabs .tab").forEach(t => {
    t.onclick = () => {
      tp.querySelectorAll(".tabs .tab").forEach(x => x.classList.toggle("on", x === t));
      $("paneOptions").style.display = t.dataset.tab === "options" ? "" : "none";
      $("paneBin").style.display = t.dataset.tab === "bin" ? "" : "none";
      renderBin();
    };
  });
}
function buildBtnGrid(grid, defs) {
  grid.innerHTML = defs.map(([id, icon, tip, dis]) =>
    `<div class="tbtn ${dis ? "dis" : ""}" data-tool="${id}" title="${tip}">
      <img src="icons/${icon}-x20.png" alt=""></div>`).join("");
  grid.querySelectorAll(".tbtn").forEach(b => {
    b.onclick = () => b.classList.contains("dis")
      ? toast(b.title + " — not in this prototype yet")
      : selectTool(b.dataset.tool);
  });
}
function wireToolOptions() {
  const remember = (k, v) => { const ts = proj.toolStates[tool]; if (ts) ts[k] = v; return v; };
  $("optSize").oninput = e => proj.brush.size = remember("size", Math.max(0.5, +e.target.value || 1));
  $("optPower").oninput = e => proj.brush.power = remember("power", Math.max(0, (+e.target.value || 100)) / 100);
  $("optOpacity").oninput = e => proj.brush.opacity = remember("opacity", Math.max(0, (+e.target.value || 100)) / 100);
  $("optGrain").oninput = e => proj.brush.grain = remember("grain", Math.max(0, Math.min(100, +e.target.value || 0)) / 100);
  $("dmSel").onchange = e => proj.brush.drawMode = remember("drawMode", e.target.value.toLowerCase());
  $("drySel").onchange = e => proj.brush.drying = remember("drying", +e.target.value || 0);
  $("chkAA").onchange = e => { proj.antiAlias = e.target.checked ? $("optAA").value : "None"; renderAll(); };
  $("optAA").onchange = e => { if ($("chkAA").checked) proj.antiAlias = e.target.value; renderAll(); };
  $("chkLS").onchange = e => proj.smoothing = e.target.checked ? nsmooth : 0;
  $("chkLocal").onchange = e => localSmooth = e.target.checked;
  $("btnReset").onclick = () => {
    proj.toolStates[tool] = Object.assign({}, E.brushDefaults(tool));
    E.activateToolBrush(proj, tool);
    syncToolPanel();
  };
  // palette for the Color dropdown (matches APen)
  const PAL = ["#000000", "#404040", "#808080", "#bfbfbf", "#ffffff", "#ed1c24", "#ff7f27", "#fff200",
    "#22b14c", "#00a2e8", "#3f48cc", "#a349a4", "#b97a57", "#ffaec9", "#efe4b0", "#d2b48c"];
  const cs = $("colSel");
  cs.innerHTML = PAL.map(c => `<option value="${c}">${c}</option>`).join("");
  cs.onchange = () => setApen(cs.value);
}
function selectTool(id) {
  if (sel && tool !== "transform") applySelection();
  tool = id;
  // TVPaint keeps per-tool options: activating a brush restores ITS state
  if (E.BRUSH_PROFILES[id]) E.activateToolBrush(proj, id);
  $("toolPanel").querySelector(".pt").textContent = "Tool : " + (TOOL_LABELS[id] || id);
  document.querySelectorAll(".tbtn").forEach(b => b.classList.toggle("on", b.dataset.tool === id));
  syncToolPanel();
  toast("tool: " + (TOOL_LABELS[id] || id));
}
function selectToolQuiet(id) { selectTool(id); }
function syncToolPanel() {
  $("optSize").value = proj.brush.size;
  $("optPower").value = Math.round(proj.brush.power * 100);
  $("optOpacity").value = Math.round(proj.brush.opacity * 100);
  $("optGrain").value = Math.round((proj.brush.grain || 0) * 100);
  const gr = $("rowGrain"),
    grainKinds = ["chalkbrush", "oilbrush", "pencilbrush", "mechanicalpencil", "specialbrush", "wetbrush"];
  if (gr) gr.style.display = grainKinds.includes(tool) ? "" : "none";
  const dry = $("drySel");
  if (dry) {
    dry.disabled = !(tool === "wetbrush" || tool === "oilbrush");
    dry.value = String(proj.brush.drying || 0);
  }
  const dm = $("dmSel");
  if (dm) dm.value = (proj.brush.drawMode || "normal").charAt(0).toUpperCase()
    + (proj.brush.drawMode || "normal").slice(1);
  $("chkAA").checked = proj.antiAlias !== "None";
  $("optAA").value = proj.antiAlias === "None" ? "High" : proj.antiAlias;
  $("chkLS").checked = proj.smoothing > 0;
  $("chkLocal").checked = localSmooth;
  const chip = $("chipA"); if (chip) chip.style.background = proj.apen;
  const cs = $("colSel"); if (cs) cs.value = psHex(proj.apen);
}
function psHex(c) { return /^#[0-9a-f]{6}$/i.test(c) ? c.toLowerCase() : "#000000"; }
function setApen(c) {
  proj.apen = psHex(c);
  const chip = $("chipA"); if (chip) chip.style.background = proj.apen;
  const cs = $("colSel"); if (cs) cs.value = proj.apen;
}
function setBpen(c) { proj.bpen = psHex(c); }
window.uiSwapPens = () => { const a = proj.apen, b = proj.bpen; setApen(b); setBpen(a); toast("APen/BPen swapped"); };
function clearBin() {
  cutBrush = null;
  const t = $("binThumb"); t.getContext("2d").clearRect(0, 0, 64, 64);
  $("binInfo").textContent = "Bin empty — grab pixels with a Cut Brush tool.";
  toast("bin cleared");
}
function renderBin() {
  const t = $("binThumb"); if (!t) return;
  const c = t.getContext("2d");
  c.clearRect(0, 0, 64, 64);
  if (cutBrush) {
    $("binInfo").textContent = `Custom Brush ${cutBrush.img.width}×${cutBrush.img.height}`;
    const s = Math.min(64 / cutBrush.img.width, 64 / cutBrush.img.height);
    c.drawImage(cutBrush.img, (64 - cutBrush.img.width * s) / 2, (64 - cutBrush.img.height * s) / 2,
      cutBrush.img.width * s, cutBrush.img.height * s);
  }
}
function togglePanel(i) { panelEls[i].style.display = panelEls[i].style.display === "none" ? "" : "none"; }

// ---------- Camera[Proj] panel (REA screenshot: Command select, Lock All /
// Bookmarks / Toggle all, Mode: interpolation dropdown, Motion Blur, X/Y locks,
// Rotation %, Zoom, Flip X/Y, Parameters...) ----------
let camView = false;         // "View ▸ Camera View" render mode
let camLocks = { x: false, y: false, rotation: false, zoom: false };
function buildCameraPanel() {
  const body = mkThirdPanel("Camera[Proj]");
  body.innerHTML = `
    ${mrow("Command", `<select id="camCmd" style="flex:1"><option>Command</option><option> parameters</option></select>`)}
    ${mrow("Lock All", `<button class="revbtn" id="camLockAll" style="padding:1px 10px">🔒</button>`)}
    ${mrow("Toggle all", `<button class="revbtn" id="camToggle" style="padding:1px 10px">🔑</button>`)}
    ${mrow("Mode", `<select id="camMode" style="flex:1">
        <option value="hold">Hold</option><option value="linear">Linear</option>
        <option value="smooth" selected>Smooth</option></select>`)}
    ${mrow("Motion Blur", `<input type="number" id="camBlur" value="0.00" min="0" max="100" step="0.5"> %`)}
    ${mrow("X", `<input type="number" id="camX" step="1" style="flex:1">`)}
    ${mrow("Y", `<input type="number" id="camY" step="1" style="flex:1">`)}
    ${mrow("Rotation", `<input type="number" id="camRot" step="0.1" value="0.00" style="width:70px"> %`)}
    ${mrow("Zoom", `<input type="number" id="camZoom" step="0.01" value="100.00" style="width:70px"> %`)}
    ${mrow("Flip X", `<input type="checkbox" id="camFlipX">`)}
    ${mrow("Flip Y", `<input type="checkbox" id="camFlipY">`)}
    <div class="orow" style="justify-content:center"><button class="revbtn" onclick="toast('camera fx parameters — not in this prototype')">Parameters ...</button></div>`;
  const sync = () => {
    const cam = E.cameraEvaluate(proj, proj.currentFrame);
    $("camX").value = (proj.width / 2 + cam.x).toFixed(0);   // absolute coords like TVPaint
    $("camY").value = (proj.height / 2 + cam.y).toFixed(0);
    $("camRot").value = cam.rotation.toFixed(2);
    $("camZoom").value = (cam.zoom * 100).toFixed(2);
    $("camFlipX").checked = !!cam.flipX;
    $("camFlipY").checked = !!cam.flipY;
    const k = E.cameraKeyAt(proj, proj.currentFrame);
    $("camMode").value = k ? k.interp : "smooth";
    ["camX", "camY", "camRot", "camZoom", "camMode", "camFlipX", "camFlipY"].forEach(id => {
      $(id).disabled = !(proj.cameraKeys && proj.cameraKeys.length);
    });
  };
  const edit = (patch) => {
    if (!proj.cameraKeys) { proj.cameraKeys = [E.newCameraKey(1, {})]; toast("camera keyframe created"); }
    const f = proj.currentFrame;
    const cur = E.cameraKeyAt(proj, f) || E.cameraEvaluate(proj, f);
    const merged = Object.assign({}, cur, patch);
    // locks keep an axis frozen (REA: padlock per axis)
    if (camLocks.x) delete merged.x, merged.x = (E.cameraKeyAt(proj, f) || cur).x;
    if (camLocks.y) merged.y = (E.cameraKeyAt(proj, f) || cur).y;
    if (camLocks.rotation) merged.rotation = (E.cameraKeyAt(proj, f) || cur).rotation;
    if (camLocks.zoom) merged.zoom = (E.cameraKeyAt(proj, f) || cur).zoom;
    delete merged.frame;
    E.setCameraKey(proj, f, merged);
    sync(); renderAll();
  };
  $("camX").onchange = e => edit({ x: (+e.target.value || 0) - proj.width / 2 });
  $("camY").onchange = e => edit({ y: (+e.target.value || 0) - proj.height / 2 });
  $("camRot").onchange = e => edit({ rotation: +e.target.value || 0 });
  $("camZoom").onchange = e => edit({ zoom: Math.max(0.05, (+e.target.value || 100) / 100) });
  $("camFlipX").onchange = e => edit({ flipX: e.target.checked });
  $("camFlipY").onchange = e => edit({ flipY: e.target.checked });
  $("camMode").onchange = e => {
    const k = E.cameraKeyAt(proj, proj.currentFrame);
    if (k) { k.interp = e.target.value; toast("camera interpolation: " + e.target.value); renderAll(); }
  };
  $("camBlur").onchange = e => { proj.cameraBlur = +e.target.value || 0; toast("motion blur " + proj.cameraBlur + "% (applied on render)"); };
  $("camLockAll").onclick = () => {
    const all = !(camLocks.x && camLocks.y && camLocks.rotation && camLocks.zoom);
    camLocks = { x: all, y: all, rotation: all, zoom: all };
    toast("camera axis locks: " + (all ? "all locked" : "released"));
  };
  $("camToggle").onclick = () => {
    camLocks = { x: !camLocks.x, y: !camLocks.y, rotation: !camLocks.rotation, zoom: !camLocks.zoom };
    toast("camera locks toggled");
  };
  $("camCmd").onchange = (e) => { e.target.value = "Command"; };
  body._syncCamera = sync;   // renderAll hooks this
  return body;
}
function mkThirdPanel(title) {
  const wrap = $("panels");
  const p = document.createElement("div");
  p.className = "panel";
  p.innerHTML = `<div class="phead"><span class="pt">${title}</span>
    <button class="pw" title="collapse">▼</button>
    <button class="pw" title="close">✕</button>
    <button class="pw" title="lock">⚿</button></div><div class="pbody"></div>`;
  wrap.appendChild(p);
  const head = p.querySelector(".phead"), body = p.querySelector(".pbody");
  head.querySelector("button[title=collapse]").onclick =
    (e) => { e.stopPropagation(); body.style.display = body.style.display === "none" ? "" : "none"; };
  head.querySelector("button[title=close]").onclick =
    (e) => { e.stopPropagation(); p.style.display = "none"; };
  panelEls.push(p);
  return body;
}
function drawCameraOverlay() {
  if (!proj.cameraKeys || !proj.cameraKeys.length) return;
  const rects = proj.cameraKeys.map(k => ({ k, r: E.cameraRect(proj, k) }));
  const cur = E.cameraEvaluate(proj, proj.currentFrame);
  const curR = E.cameraRect(proj, cur);
  octx.save();
  // green = drawing area (fixed); camera rect = COLORSchemes mcameraprofile (128,128,255)
  octx.lineWidth = 1.5 / view.zoom;
  octx.strokeStyle = "#3fd25f";
  octx.strokeRect(0, 0, proj.width, proj.height);
  rects.forEach(({ k }) => {
    octx.strokeStyle = k.frame === proj.currentFrame ? "#8080FF" : "rgba(128,128,255,0.45)";
    strokeRotRect(octx, E.cameraRect(proj, k));
  });
  octx.strokeStyle = "#8080FF";
  strokeRotRect(octx, curR);
  // interpolation path between key centers with handle dots
  const kp = proj.cameraKeys.slice().sort((a, b) => a.frame - b.frame);
  if (kp.length > 1) {
    octx.strokeStyle = "#8080FF"; octx.setLineDash([6 / view.zoom, 4 / view.zoom]);
    octx.beginPath();
    for (let f = kp[0].frame; f <= kp[kp.length - 1].frame; f += 0.5) {
      const c = E.cameraEvaluate(proj, f);
      const px = proj.width / 2 + c.x, py = proj.height / 2 + c.y;
      f === kp[0].frame ? octx.moveTo(px, py) : octx.lineTo(px, py);
    }
    octx.stroke(); octx.setLineDash([]);
    kp.forEach(k => {
      const px = proj.width / 2 + k.x, py = proj.height / 2 + k.y;
      octx.fillStyle = "#fff"; octx.strokeStyle = "#4a8cff";
      octx.beginPath(); octx.arc(px, py, 4 / view.zoom, 0, Math.PI * 2); octx.fill(); octx.stroke();
    });
  }
  octx.restore();
}
function strokeRotRect(c, r) {
  c.save();
  c.translate(r.cx, r.cy); c.rotate((r.rot || 0) * Math.PI / 180);
  c.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);
  c.restore();
}
let clipboardLayer = null;
window.toggleBookmark = () => {
  proj.bookmarks = proj.bookmarks || [];
  const f = proj.currentFrame;
  const i = proj.bookmarks.indexOf(f);
  if (i >= 0) { proj.bookmarks.splice(i, 1); toast("bookmark removed at " + f); }
  else { proj.bookmarks.push(f); proj.bookmarks.sort((a, b) => a - b); toast("bookmark set at " + f); }
  renderTimeline();
};
window.removeBookmark = (f) => {
  proj.bookmarks = (proj.bookmarks || []).filter(x => x !== f); renderTimeline();
};
window.gotoBookmark = (dir) => {
  const bm = (proj.bookmarks || []).slice().sort((a, b) => a - b);
  if (!bm.length) { toast("no bookmarks"); return; }
  let f = proj.currentFrame;
  if (dir > 0) f = bm.find(x => x > f) ?? bm[0];
  else f = [...bm].reverse().find(x => x < f) ?? bm[bm.length - 1];
  gotoFrame(f); toast("bookmark " + f);
};
window.mergeLayerDown = () => {
  if (proj.currentLayer === 0) { toast("no layer below to merge into"); return; }
  const top = proj.layers[proj.currentLayer], below = proj.layers[proj.currentLayer - 1];
  hist.pushModel(proj);
  const frames = [...new Set([...Object.keys(top.frames).map(Number), ...Object.keys(below.frames).map(Number)])];
  frames.forEach(f => {
    const kTop = E.effectiveFrameKey(top, f), kBelow = E.effectiveFrameKey(below, f);
    if (kTop === null && kBelow === null) return;
    const target = E.frameSurface(proj, below, f, true);
    const c = target.getContext("2d");
    c.clearRect(0, 0, proj.width, proj.height);
    if (kBelow !== null && below.frames[kBelow].canvas) { c.globalAlpha = below.opacity; c.drawImage(below.frames[kBelow].canvas, 0, 0); }
    if (kTop !== null && top.frames[kTop].canvas) { c.globalAlpha = top.opacity; c.drawImage(top.frames[kTop].canvas, 0, 0); }
    c.globalAlpha = 1;
  });
  proj.layers.splice(proj.currentLayer, 1);
  proj.currentLayer--;
  hist.sealModel(proj);
  renderAll(); toast("merged layer down");
};

// ---------- modal dialog helpers ----------
function openModal(title, bodyHTML, buttons) {
  closeModal();
  const ov = document.createElement("div");
  ov.id = "modalOv";
  ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;display:flex;align-items:center;justify-content:center";
  const box = document.createElement("div");
  box.style.cssText = "background:#2f3237;border:1px solid #2D2D32;border-radius:6px;box-shadow:0 12px 40px #000c;min-width:460px;color:#b9bfc6";
  box.innerHTML = `<div style="display:flex;padding:8px 12px;background:#34383d;border-radius:6px 6px 0 0">
      <b style="flex:1;color:#B6B6B6">${title}</b><button id="mClose" style="background:none;border:0;color:#898989;cursor:pointer">✕</button></div>
    <div id="mBody" style="padding:12px 16px"></div>
    <div id="mBtns" style="display:flex;gap:8px;justify-content:center;padding:10px 16px 14px"></div>`;
  ov.appendChild(box);
  document.body.appendChild(ov);
  box.querySelector("#mBody").innerHTML = bodyHTML;
  buttons.forEach(([label, fn, primary]) => {
    const b = document.createElement("button");
    b.className = "revbtn"; b.textContent = label;
    if (primary) b.style.cssText = "background:#3d5666;border-color:#6fa8c9";
    b.onclick = () => { if (fn() !== false) closeModal(); };
    box.querySelector("#mBtns").appendChild(b);
  });
  box.querySelector("#mClose").onclick = closeModal;
  ov.onclick = (e) => { if (e.target === ov) closeModal(); };
  return box.querySelector("#mBody");
}
function closeModal() { const o = document.getElementById("modalOv"); if (o) o.remove(); }
const mrow = (label, inner) => `<div class="orow"><label style="flex:0 0 130px">${label}</label>${inner}</div>`;

// ---------- New Project dialog (REA screenshot: Template / Project|Project with
// Camera tabs / Camera View presets / Ratio % / Drawing Area / Frame Rate / DPI /
// mm units / Load Library / New Project) ----------
const CAM_PRESETS = {
  "None": [0, 0], "HDTV HD 1080p": [1920, 1080], "HDTV 720p": [1280, 720],
  "HDTV Full HD": [1920, 1080], "4K UHD": [3840, 2160], "SD PAL": [768, 576],
  "NTSC D-1": [720, 486], "Custom": [0, 0]
};
function dlgNewProject(modify) {
  const isCam = !!(proj.cameraKeys || []).length;
  const m = openModal(modify ? "Modify Project" : "New Project", `
    ${mrow("Template:", `<select id="npTemplate" style="flex:1"><option>None</option></select>
      <button class="revbtn" onclick="toast('templates — not in this prototype')">Remove</button>`)}
    <div class="tabs" style="margin-top:8px">
      <div class="tab ${isCam ? "" : "on"}" id="npTabPlain">Project</div>
      <div class="tab ${isCam ? "on" : ""}" id="npTabCam">Project with Camera</div></div>
    <div id="npCamRows">
      ${mrow("Camera View (Final Output)", `<select id="npPreset" style="flex:1">${
        Object.keys(CAM_PRESETS).map(k => `<option>${k}</option>`).join("")}</select>`)}
      ${mrow("Camera View", `<input type="number" id="npCamW" value="1920" min="16"> ×
        <input type="number" id="npCamH" value="1080" min="16">`)}
      ${mrow("Ratio", `<input type="number" id="npRatioX" value="100.00" step="0.01"> % ×
        <input type="number" id="npRatioY" value="100.00" step="0.01"> %`)}
    </div>
    ${mrow("Frame Rate", `<input type="number" id="npFps" value="${proj.fps}" min="1" max="120"> fps`)}
    ${mrow("Drawing Area", `<input type="number" id="npW" value="${proj.width}" min="16">
      × <input type="number" id="npH" value="${proj.height}" min="16"> px`)}
    ${mrow("DPI Resolution", `<input type="number" id="npDpi" value="72" min="1"> dpi`)}
    ${mrow("Load Library File", `<button class="revbtn" onclick="toast('libraries — not in this prototype')">Browse</button>`)}
  `, [[modify ? "Modify" : "New Project", () => {
    const camTab = document.getElementById("npTabCam").classList.contains("on");
    const w = Math.max(16, +document.getElementById("npW").value || 512);
    const h = Math.max(16, +document.getElementById("npH").value || 512);
    const fps = Math.max(1, +document.getElementById("npFps").value || 24);
    if (modify) {
      E.resizeProject(proj, w, h);
      proj.fps = fps;
      if (camTab) {
        proj.cameraView = { w: +document.getElementById("npCamW").value || w / 2, h: +document.getElementById("npCamH").value || h / 2 };
        if (!proj.cameraKeys) proj.cameraKeys = [E.newCameraKey(1, {})];
      }
      ghostTmp = E.makeSurface(w, h);
      fitView(); syncFpsSel(); renderTimelineStatus(); toast("project modified: " + w + " x " + h);
      return;
    }
    proj = E.newProject(w, h, fps);
    proj.name = "Untitled_(1)";
    proj.layers.forEach((l, i) => { l.name = "Anim_0" + (i + 1); });
    if (camTab) {
      proj.cameraView = { w: +document.getElementById("npCamW").value || w / 2, h: +document.getElementById("npCamH").value || h / 2 };
      proj.cameraKeys = [E.newCameraKey(1, {})];   // camera layer present from frame 1
      toast("project with camera");
    } else { proj.cameraView = null; proj.cameraKeys = null; }
    ghostTmp = E.makeSurface(w, h);
    sel = null; cutBrush = null;
    fitView(); syncFpsSel(); syncToolPanel(); renderTimelineStatus(); renderAll();
  }, true], ["Cancel", () => {}]]);
  // preset select fills camera w/h
  m.querySelector("#npPreset").onchange = (e) => {
    const [w, h] = CAM_PRESETS[e.target.value];
    if (w) { m.querySelector("#npCamW").value = w; m.querySelector("#npCamH").value = h; }
  };
  const syncRatio = () => {
    const cw = +m.querySelector("#npCamW").value || 1, ch = +m.querySelector("#npCamH").value || 1;
    const dw = +m.querySelector("#npW").value || 1, dh = +m.querySelector("#npH").value || 1;
    m.querySelector("#npRatioX").value = (cw / dw * 100).toFixed(2);
    m.querySelector("#npRatioY").value = (ch / dh * 100).toFixed(2);
  };
  ["#npCamW", "#npCamH", "#npW", "#npH"].forEach(sel2 => m.querySelector(sel2).oninput = syncRatio);
  m.querySelector("#npTabPlain").onclick = () => { m.querySelector("#npTabCam").classList.remove("on"); m.querySelector("#npTabPlain").classList.add("on"); };
  m.querySelector("#npTabCam").onclick = () => { m.querySelector("#npTabPlain").classList.remove("on"); m.querySelector("#npTabCam").classList.add("on"); };
}

// ---------- Increase Layer Length dialog (REA screenshot: Stretch / Interpolate
// (disabled) / Repeat-mode dropdown "Hold" / Add Empty Instances / Add Empty
// Exposures / Apply / Cancel) ----------
// REA: Resources\data\english.tvpaint.loc @ 0x000025550..25588 (exact labels + tooltips)
//  255550 Increase Layer Length / 255551 Decrease Layer Length
//  255560 Interpolate / 255561 Stretch / 255562 Repeat / 255563 Add Empty Instances
//  255564 Shrink / 255565 Cut Images / 255566 Add Empty Exposures / 255567 Apply / 255568 Cancel
//  255570-255573 repeat modes: Loop / Ping Pong / Hold / Exposure
const LL_TIP = {
  interpolate: "Interpolate or just copy the last image\nInterpolation will try to stretch the layer to the new\nlength, creating new frames where needed. Copy the\nlast image does exactly that for the duration of the layer",
  stretch: "stretch the layer\nWhen extending a layer you can repeat or stretch.",
  repeat: "Repeat modes\nThe different modes available for repeating a sequence.",
  hold: "Repeat the image\nRepeat, hold, repeats the last image to the end of the stretch.",
  instances: "Add Empty Images\nAdds blank frames to the end of the stretch.",
  cut: "Cut the image from the layer.\nWhen shortening a layer you can stretch or cut.",
  apply: "Apply the stretch to the layer",
  cancel: "Cancel the stretch of the layer",
  exposures: "Add Empty Exposures\n\nClick here to add empty exposures.\n\nA popup panel will ask you the number\nof exposures you want to add."
};
function dlgLayerLength(prefill, dir) {
  const inc = dir !== "dec";
  const layer = proj.layers[proj.currentLayer];
  const keys = Object.keys(layer.frames).map(Number).sort((a, b) => a - b);
  const last = keys[keys.length - 1] || 1;
  const total = last + (layer.frames[last] ? (layer.frames[last].exposure || 1) : 1) - 1;
  const count = Math.max(1, Math.round(prefill || proj.outFrame - total || 1));
  const modes = inc
    ? `<label class="llmode dis" title="${LL_TIP.interpolate}"><input type="radio" name="llmode" value="interpolate" disabled> Interpolate</label>
       <label class="llmode" title="${LL_TIP.stretch}"><input type="radio" name="llmode" value="stretch" checked> Stretch</label>
       <label class="llmode" title="${LL_TIP.repeat}"><input type="radio" name="llmode" value="repeat"> Repeat</label>`
    : `<label class="llmode" title="${LL_TIP.stretch}"><input type="radio" name="llmode" value="shrink" checked> Shrink</label>
       <label class="llmode" title="${LL_TIP.cut}"><input type="radio" name="llmode" value="cut"> Cut Images</label>`;
  const m = openModal(inc ? "Increase Layer Length" : "Decrease Layer Length", `
    <div class="llmodes">${modes}</div>
    ${inc ? mrow("Repeat mode", `<select id="llRepeatMode" title="${LL_TIP.hold}" style="flex:1"><option>Loop</option><option>Ping Pong</option><option>Hold</option><option>Exposure</option></select>`) : ""}
    <label class="llopt" title="${LL_TIP.instances}"><input type="checkbox" id="llEmptyInstances"> Add Empty Instances</label>
    <label class="llopt" title="${LL_TIP.exposures}"><input type="checkbox" id="llEmptyExposures"> Add Empty Exposures</label>
    ${mrow("Added frames", `<input type="number" id="llCount" value="${count}" min="1" style="width:70px">`)}
    <div style="color:#898989;font-size:11px;margin-top:6px">Layer length now: ${total} frames</div>
  `, [["Apply", () => {
    const n = Math.max(1, +document.getElementById("llCount").value || 1);
    const op = (m.querySelector("input[name=llmode]:checked") || { value: inc ? "stretch" : "shrink" }).value;
    const rsel = document.getElementById("llRepeatMode");
    const rm = rsel ? rsel.value : "Loop";
    const addInst = document.getElementById("llEmptyInstances").checked;
    const addExp = document.getElementById("llEmptyExposures").checked;
    hist.pushModel(proj);
    E.layerLengthOp(proj, layer, op, n, rm);
    if (addInst) E.layerLengthOp(proj, layer, "instances", 1);
    if (addExp) E.layerLengthOp(proj, layer, "exposures", 1);
    hist.sealModel(proj); renderAll();
    toast((inc ? "+" : "-") + n + " frames (" + op + (op === "repeat" ? " " + rm : "") +
      (addInst ? " + empty instances" : "") + (addExp ? " + empty exposures" : "") + ")");
  }, true], ["Cancel", () => {}]]);
}

// ================= viewport bottom row (canvas scrollbar + zoom/Display) =================
function buildVbRow() {
  if (!$("vbRow")) return;
  $("zoomIn").onclick = () => { view.zoom = Math.min(20, view.zoom * 1.25); renderAll(); };
  $("zoomOut").onclick = () => { view.zoom = Math.max(0.05, view.zoom * 0.8); renderAll(); };
  $("dispSel").onchange = (e) => {
    if (e.target.value === "Fit") fitView();
    else if (e.target.value === "Display 1:1") {
      view.zoom = 1;
      view.x = (art.width - proj.width) / 2;
      view.y = (art.height - proj.height) / 2;
      renderAll();
    }
  };
  updateZoomLbl();
}

// ================= timeline panel =================
function buildTlTabs() {
  // tabs now live in the layer header row (real TVPaint 12: 29 px tab row above the icon row)
  document.querySelectorAll(".ltabs .tab").forEach(t =>
    t.onclick = () => document.querySelectorAll(".ltabs .tab").forEach(x => x.classList.toggle("on", x === t)));
}
// A drawing is "empty" when its canvas carries no ink: TVPaint then paints the
// cell as a checkerboard; inked drawings stay white. Same rule as the key-cell
// thumbnail sampler below, shared by every hold cell of the same exposure.
function frameIsEmpty(fr) {
  const surf = fr && fr.canvas;
  if (!surf || !surf.getContext) return false;
  const c = document.createElement("canvas");
  c.width = 16; c.height = 16;
  const cc = c.getContext("2d");
  cc.drawImage(surf, 0, 0, 16, 16);
  const d = cc.getImageData(0, 0, 16, 16).data;
  for (let i = 0; i < d.length; i += 4)
    if (d[i + 3] > 8 && (d[i] < 248 || d[i + 1] < 248 || d[i + 2] < 248)) return false;
  return true;
}
function renderTimeline() {
  const left = $("tlLeft"), track = $("tlTrack");
  // the ruler always fills the visible track (TVPaint shows empty frames past the
  // clip end), then grows with the project or the playhead
  const visFrames = Math.max(2, 2 * Math.floor(((track && track.clientWidth) || 800) / (2 * CW)));
  // even frame count so the 2-frame ruler ticks fill the track without overflow
  const maxF = Math.ceil(Math.max(proj.outFrame + 4, proj.currentFrame + 4, visFrames) / 2) * 2;
  // left column — 355 px layer panel + 40 px separator column (⊘), row-for-row with the track
  const camOn = !!(proj.cameraKeys && proj.cameraKeys.length);
  const cl0 = proj.layers[proj.currentLayer] || {};
  const flagBtn = (flag, on, iconOn, iconOff, title) =>
    `<button class="flag${on ? "" : " off"}" title="${title}" onclick="event.stopPropagation();toggleLayerFlagAt(${proj.currentLayer},'${flag}')">
      <img src="icons/${iconOn}-x20.png"></button>`;
  let lh = `<div class="lhead">
    <div class="ltabs"><div class="tab">Project</div><div class="tab on">Clip: Timeline</div></div>
  </div>
  <div class="lhiconsrow"><div class="lhicons">
      <img class="sq" src="icons/MiscLayers-x20.png" title="All layers (click to filter anim layers)" onclick="event.stopPropagation();toggleLayerFilter('all')">
      <img class="sq" src="icons/LayerAnim-x20.png" title="Animation layers only" onclick="event.stopPropagation();toggleLayerFilter('anim')">
      <span class="vsep"></span>
      <button class="hbtn" onclick="layerAdd()" title="Create a new animation layer."><img src="icons/CreateAnimLayer-x20.png"></button>
      <button class="hbtn" onclick="event.stopPropagation();addTypedLayer('folder')" title="Create a new folder layer"><img src="icons/CreateFolderLayer-x20.png"></button>
      <button class="hbtn" onclick="event.stopPropagation();addTypedLayer('ctg')" title="Create a new CTG layer"><img src="icons/CreateCTGLayer-x20.png"></button>
      <button class="hbtn" onclick="layerDel()" title="Delete the current layer"><img src="icons/DeleteLayer-x20.png"></button>
      <button class="minib newbtn" onclick="event.stopPropagation();newLayerMenu(this)" title="New layer">New <span class="arrow">▾</span></button>
      <span class="hsp"></span>
      <button class="flag${proj.layers.every(l => l.visible !== false) ? "" : " off"}" title="Show/Hide all layers" onclick="event.stopPropagation();toggleAllFlag('visible')"><img src="icons/${proj.layers.every(l => l.visible !== false) ? "LayerActiveOn" : "LayerActiveOff"}-x20.png"></button>
      <button class="flag${proj.layers.every(l => l.locked) ? "" : " off"}" title="Lock/Unlock all layers" onclick="event.stopPropagation();toggleAllFlag('locked')"><img src="icons/${proj.layers.every(l => l.locked) ? "LayerLockOn" : "LayerLockOff"}-x20.png"></button>
      <button class="flag${proj.layers.every(l => l.lighttable) ? "" : " off"}" title="Light table for all layers" onclick="event.stopPropagation();toggleAllFlag('lighttable')"><img src="icons/${proj.layers.every(l => l.lighttable) ? "LayerLighttableOn" : "LayerLighttableOff"}-x20.png"></button>
      <button class="flag${proj.layers.every(l => l.preserveTransparency) ? "" : " off"}" title="Preserve transparency for all layers" onclick="event.stopPropagation();toggleAllFlag('preserveTransparency')"><img src="icons/${proj.layers.every(l => l.preserveTransparency) ? "LayerPreserveTransparencyOn" : "LayerPreserveTransparencyOff"}-x20.png"></button>
      <button class="flag" title="Manage stencils" onclick="event.stopPropagation();stencilMenu(this)"><img src="icons/LayerStencil-x20.png"></button>
      <button class="flag" title="Layer display options" onclick="event.stopPropagation();displayMenu(this)"><img src="icons/LayerSquigglesOn-x20.png"></button>
    </div></div>
  ${camOn ? `<div class="camrow" onclick="selectTool(&quot;camera&quot;)" title="Camera Layer">
      <img class="sq" src="icons/Shape-Camera-x20.png">
      <span class="nm">Camera Layer</span>
      <button class="flag" title="camera keys kept" onclick="event.stopPropagation();toast('camera keys kept')"><img src="icons/ReqLockOff-x20.png"></button>
    </div>` : ""}`;
  proj.layers.forEach((l, i) => {
    const cur = i === proj.currentLayer;
    const g = (proj.groups && proj.groups[l.group || 0]) || { name: "Default", color: "#8f8f95" };
    const typeIcon = l.type === "folder" ? "CreateFolderLayer" : l.type === "ctg" ? "CreateCTGLayer"
      : l.type === "background" ? "LayerColorRendering" : "SketchHand";
    lh += `<div class="llayer${cur ? " cur" : ""}${l.collapsed ? " collapsed" : ""}${(!cur && (proj.selectedLayers || []).includes(i)) ? " selmulti" : ""}" data-layer="${i}" style="height:${l.collapsed ? 24 : 60}px" onclick="pickLayer(${i})">
    <div class="lrowbg"></div>
    <div class="lname">
      <span class="lminus" title="Collapse/Expand" onclick="event.stopPropagation();collapseLayer(${i})">${l.collapsed ? "⊕" : "⊖"}</span>
      <span class="nm" ondblclick="event.stopPropagation();startLayerRename(${i})">${l.name}</span>
      <span class="lmore" title="Layer options" onclick="event.stopPropagation();layerMenu(${i},this)">▾</span>
    </div>
    <div class="lbody">
      <img class="ltype" src="icons/${typeIcon}-x20.png" title="${l.type === "folder" ? "folder layer" : l.type === "ctg" ? "color & texture layer" : l.type === "background" ? "background layer" : "drag to move"}">
      <canvas class="lthumb" data-layer="${i}" width="52" height="26"></canvas>
      <div class="lmid">
        <div class="lplay"><span class="dot" style="background:${g.color}" title="Group: ${g.name}"></span>
          <button title="previous instance" onclick="event.stopPropagation();layerInst(${i},-1)"><img src="icons/Remote-Goto-PreviousInstance-x20.png"></button>
          <button title="next instance" onclick="event.stopPropagation();layerInst(${i},1)"><img src="icons/Remote-Goto-NextInstance-x20.png"></button>
          <button class="looppb" data-pb="${i}" title="Loop Mode" onclick="event.stopPropagation();openLayerPlayback(${i},this)"><img src="icons/${({ None: "LayerLoopNone", Loop: "LayerLoopRepeatAfter", "Ping-Pong": "LayerLoopPingPong", Hold: "LayerLoopHoldAfter" })[l.playback || "None"]}-x20.png"></button>
        </div>
        <div class="lcolor" title="Group selection — click here to select layer's group" onclick="event.stopPropagation();groupMenu(${i},this)">Color</div>
      </div>
      <div class="lflags">
        <button class="flag${l.visible !== false ? "" : " off"}" title="Show/Hide layer" onclick="event.stopPropagation();toggleLayerFlagAt(${i},'visible')"><img src="icons/${l.visible !== false ? "LayerActiveOn" : "LayerActiveOff"}-x20.png"></button>
        <span class="dots">
          <i class="${l.locked ? "on" : ""}" data-flag="locked" title="Lock/Unlock layer"></i>
          <i class="${l.lighttable ? "on" : ""}" data-flag="lighttable" title="Activate/Inactivate Light Table"></i>
          <i class="${l.preserveTransparency ? "on" : ""}" data-flag="preserveTransparency" title="Preserve transparency"></i>
          <i class="${l.stencil !== "off" && l.stencil ? "on" : ""}${l.stencil === "negative" ? " neg" : ""}" data-flag="stencil" title="Stencil: ${l.stencil === "negative" ? "negative" : l.stencil === "positive" ? "positive" : "off"} (click to cycle)"></i>
        </span>
      </div>
      <div class="lop"><span>⊖</span>
        <input type="range" data-lop="${i}" min="0" max="100" value="${Math.round((l.opacity ?? 1) * 100)}">
        <span class="lval">${Math.round((l.opacity ?? 1) * 100)}%</span>
        <span class="lblend" data-blend="${i}" title="Blending mode: ${l.blend || "Normal"}">◢</span></div>
    </div>
  </div>`;
  });
  lh += `<div class="lsep"><span class="pin">⊘</span></div>`;
  left.innerHTML = lh;
  buildTlTabs();
  left.querySelectorAll(".dots i[data-flag]").forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const li = +el.closest(".llayer").dataset.layer;
      const flag = el.dataset.flag;
      const l = proj.layers[li];
      if (flag === "stencil") {
        l.stencil = l.stencil === "positive" ? "negative" : l.stencil === "negative" ? "off" : "positive";
        renderAll();
        toast("stencil: " + l.stencil);
      } else toggleLayerFlagAt(li, flag);
    };
  });
  left.querySelectorAll(".lblend").forEach(el => {
    el.onclick = (e) => { e.stopPropagation(); blendMenu(+el.dataset.blend, el); };
  });
  left.oncontextmenu = (e) => {
    const row = e.target.closest(".llayer");
    if (!row) return;
    e.preventDefault();
    const li = +row.dataset.layer;
    proj.currentLayer = li; renderAll();
    layerMenu(li, null, e.clientX, e.clientY);
  };
  track.oncontextmenu = (e) => {
    const c = e.target.closest(".cell[data-f]");
    if (!c) return;
    const li = +c.dataset.l;
    if (isNaN(li)) return;
    e.preventDefault();
    const f = +c.dataset.f;
    proj.currentLayer = li; proj.currentFrame = f;
    renderAll();
    cellMenu(li, f, e.clientX, e.clientY);
  };
  left.querySelectorAll("[data-lop]").forEach(r => {
    r.oninput = (e) => {
      proj.layers[+r.dataset.lop].opacity = +e.target.value / 100;
      const row = r.closest(".lop"); row.querySelector(".lval").textContent = e.target.value + "%";
      fastRenderAll();
    };
  });
  // track: top ruler + one 64 px row per layer + flexible filler + bottom ruler
  const lastUsed = Math.max(1, ...proj.layers.map(l =>
    Math.max(0, ...Object.keys(l.frames).map(Number).map(k => k + (l.frames[k].exposure || 1) - 1))));
  const inF = proj.inFrame, outF = Math.max(proj.outFrame, inF);
  // one tick per frame (40 px); numbers on odd frames like TVPaint; current frame = blue tick
  let ticks = "";
  for (let f = 1; f <= maxF; f++) {
    const mk = proj.showMarks !== false && proj.layers.some(l => l.marks && l.marks[f]);
    const cls = [f === proj.currentFrame ? "cur" : "", f === proj.inFrame ? "in" : "", mk ? "mark" : ""].join(" ");
    ticks += `<div class="tick ${cls}" data-tf="${f}">${f % 2 === 1 ? f : ""}</div>`;
  }
  // info row (REA/status format): Project / Clip / Layer-count includes camera / Current Image
  const info = $("tlInfoRow");
  if (info) {
    const camOn2 = !!(proj.cameraKeys && proj.cameraKeys.length);
    const N = proj.layers.length + (camOn2 ? 1 : 0);
    const cl = proj.layers[proj.currentLayer];
    const ckeys = Object.keys(cl.frames).map(Number);
    const fK = ckeys.length ? Math.min(...ckeys) : 1;
    const lEnd = ckeys.length ? Math.max(...ckeys.map(k => k + (cl.frames[k].exposure || 1) - 1)) : 1;
    const o = Math.max(proj.outFrame, proj.currentFrame);
    info.innerHTML =
      `<span>Project: ${proj.name} [1 , ${o} (${o})]</span>` +
      `<span>Clip: Clip_001 [1 , ${o} (${o})]</span>` +
      `<span>Layer(${(camOn2 ? proj.currentLayer + 2 : proj.currentLayer + 1)}/${N}): ${cl.name} [${fK} , ${lEnd} (${lEnd - fK + 1})]</span>` +
      `<span>Current Image: ${proj.currentFrame}</span>`;
  }
  const blueBand = `<div class="band" style="left:${(inF - 1) * CW}px;width:${(Math.min(maxF, outF) - inF + 1) * CW}px"></div>`;
  const mkBands = `<div class="band green" style="left:0;width:${Math.min(maxF, lastUsed) * CW}px"></div>${blueBand}`;
  const topPad = camOn ? 46 : 29;
  let th = `<div class="ttopspacer" style="height:${topPad}px"></div><div class="ruler" id="rulerRow">${ticks}${mkBands}</div>`;
  // camera-layer strip: the "+" marks ARE the camera key frames (user-verified)
  if (proj.cameraKeys && proj.cameraKeys.length) {
    const camKeyFrames = new Set(proj.cameraKeys.map(k => Math.round(k.frame)));
    let camCells = "";
    for (let f = 1; f <= maxF; f++) {
      const plus = (camKeyFrames.has(f) || f % 4 === 1)
        ? `<button class="plus always" data-camf="${f}" title="${camKeyFrames.has(f) ? "camera key frame" : "add camera key here"}">+</button>` : "";
      camCells += `<div class="cell" data-f="${f}" data-l="cam">${plus}</div>`;
    }
    th += `<div class="strip cam"><div class="cells">${camCells}</div></div>`;
  }
  proj.layers.forEach((l, li) => {
    const sel = li === proj.currentLayer;
    const keys = Object.keys(l.frames).map(Number).filter(k => k >= 1 && k <= maxF).sort((a, b) => a - b);
    const emptyByKey = new Map(keys.map(k => [k, frameIsEmpty(l.frames[k])]));
    const lastEnd = keys.length ? Math.max(...keys.map(k => k + (l.frames[k].exposure || 1) - 1)) : 0;
    const firstEmpty = keys.length ? lastEnd + 1 : 1;
    let cells = "";
    for (let f = 1; f <= maxF; f++) {
      const k = playbackKey(l, f);
      const isKey = k === f;
      const cls = k !== null ? (isKey ? "keyw" : "hold") + (emptyByKey.get(k) ? " empty" : "") : "";
      let inner = "";
      const fr = isKey ? l.frames[k] : null;
      const role = fr && fr.role ? E.IMAGE_ROLES.find(r => r.id === fr.role) : null;
      if (isKey) {
        inner += `<div class="cellimg${emptyByKey.get(k) ? " empty" : ""}"></div>`;
        inner += `<span class="knum">${keys.indexOf(k) + 1}.</span>`;
        inner += `<span class="dh l" data-k="${k}" data-l="${li}"></span><span class="dh r" data-k="${k}" data-l="${li}"></span>`;
        if (role && proj.showRoles && (!proj.roleLayerOnly || li === proj.currentLayer))
          inner += `<i class="rolemark" style="color:${role.color}" title="${role.label}"></i>`;
        if (l.marks && l.marks[k] && proj.showMarks !== false) inner += `<i class="imgmark" title="image mark"></i>`;
      } else if (k === null && f === firstEmpty) {
        inner += `<span class="empin">⊘</span>`;
      }
      inner += `<button class="plus" title="add drawing here" data-plus="${f}" data-pl="${li}">+</button>`;
      cells += `<div class="cell ${cls}" data-f="${f}" data-l="${li}">${inner}</div>`;
    }
    // exposure line + seam knobs + right-edge length handle
    let overlay = "";
    if (keys.length) {
      const lineW = Math.max(CW, (lastEnd - keys[0] + 1) * CW);
      let knobs = "";
      keys.forEach(k => { knobs += `<i class="knob" style="left:${(k - keys[0]) * CW}px"></i>`; });
      overlay = `<div class="expLine" data-first="${keys[0]}" style="left:${(keys[0] - 1) * CW}px;width:${lineW}px">${knobs}</div>` +
        `<i class="expHandle" style="left:${(lastEnd - 1) * CW + CW - 5}px" data-k="${keys[keys.length - 1]}" data-l="${li}" title="drag right: increase length"></i>`;
    }
    th += `<div class="strip${sel ? " sel" : ""}${l.collapsed ? " collapsed" : ""}" data-layer="${li}"${l.collapsed ? ' style="height:24px"' : ""}><div class="cells">${cells}</div>${overlay}</div>`;
  });
  th += `<div class="tlspacer"></div>`;
  th += `<div class="ruler bot" id="rulerBot">${ticks}${mkBands}</div>`;
  th += `<div id="curCol" style="left:${(proj.currentFrame - 1) * CW}px;top:${topPad}px"></div>`;
  track.innerHTML = th;
  // clamp the red current-image bounds to the bottom ruler
  {
    const col = track.querySelector("#curCol"), bot = track.querySelector("#rulerBot");
    if (col && bot) {
      const tr = track.getBoundingClientRect(), br = bot.getBoundingClientRect();
      col.style.height = Math.max(0, Math.round(br.bottom - tr.top - topPad)) + "px";
    }
  }
  track.querySelectorAll(".cell[data-f]").forEach(c => {
    c.onclick = () => gotoFrame(+c.dataset.f, c.dataset.l === "cam" ? proj.currentLayer : +c.dataset.l);
  });
  // ruler numbers are clickable in TVPaint: click a number to jump to that frame
  track.querySelectorAll(".ruler .tick").forEach(tk => {
    const f = +tk.dataset.tf;
    tk.style.cursor = "pointer";
    tk.title = "go to image " + f;
    tk.onclick = () => gotoFrame(f, proj.currentLayer);
  });
  track.querySelectorAll(".plus[data-plus]").forEach(b => {
    b.onclick = (e) => { e.stopPropagation(); gotoFrame(+b.dataset.plus, +b.dataset.pl);
      hist.pushModel(proj);
      E.xsheetOp(proj, proj.layers[+b.dataset.pl], "add", +b.dataset.plus, null);
      hist.sealModel(proj); renderAll(); };
  });
  track.querySelectorAll(".plus[data-camf]").forEach(b => {
    b.onclick = (e) => { e.stopPropagation();
      const f = +b.dataset.camf;
      const has = (proj.cameraKeys || []).some(k => Math.round(k.frame) === f);
      if (!has) { E.setCameraKey(proj, f, {}); toast(`camera key @ ${f}`); }
      else gotoFrame(f, proj.currentLayer);
      renderAll(); };
  });
  // exposure end handles: drag the square at the exposure end to change the layer length
  track.querySelectorAll(".expHandle").forEach(h => {
    const strip = h.closest(".strip");
    h.onpointerdown = (e) => {
      e.stopPropagation(); e.preventDefault();
      const li = +h.dataset.l, k = +h.dataset.k, l = proj.layers[li];
      const startExp = l.frames[k].exposure || 1;
      const sr = strip.getBoundingClientRect();
      const line = strip.querySelector(".expLine");
      const first = line ? +line.dataset.first : 1;
      strip.classList.add("grabbed");
      try { h.setPointerCapture(e.pointerId); } catch (err) {/* synthetic events */}
      let exp = startExp, moved = false;
      h.dataset.expBound = String(startExp);
      const mv = (ev) => {
        const end = Math.max(k, Math.round((ev.clientX - sr.left) / CW));
        exp = Math.max(1, Math.min(end - k + 1, maxF - k + 1));
        if (exp === +h.dataset.expBound) return;
        moved = true;
        if (line) line.style.width = ((k + exp - first) * CW) + "px";
        h.dataset.expBound = String(exp);
      };
      const up = () => {
        strip.classList.remove("grabbed");
        try { h.releasePointerCapture(e.pointerId); } catch (err) {}
        h.removeEventListener("pointermove", mv);
        h.removeEventListener("pointerup", up);
        h.dataset.expBound = "";
        if (moved && exp !== startExp) {
          const added = exp - startExp;
          renderAll();   // reset the drag preview
          // TVPaint: dragging the layer's right-edge handle opens Increase / Decrease
          // Layer Length, and the dialog decides how the added time is handled.
          dlgLayerLength(Math.abs(added), added > 0 ? "inc" : "dec");
        }
        else renderAll();
      };
      h.addEventListener("pointermove", mv);
      h.addEventListener("pointerup", up);
    };
  });
  // timing handles on key cells: right corner lengthens the exposure,
  // left corner moves the drawing earlier/later (TVPaint cell timing drag)
  track.querySelectorAll(".cell.keyw .dh").forEach(h => {
    const isR = h.classList.contains("r");
    const k = +h.dataset.k, li = +h.dataset.l, l = proj.layers[li];
    const strip = h.closest(".strip");
    h.onpointerdown = (e) => {
      e.stopPropagation(); e.preventDefault();
      const sr = strip.getBoundingClientRect();
      h.classList.add("grab");
      try { h.setPointerCapture(e.pointerId); } catch (err) {}
      const startExp = l.frames[k].exposure || 1;
      const line = strip.querySelector(".expLine");
      const first = line ? +line.dataset.first : 1;
      let exp = startExp, startK = k, moved = false;
      h.dataset.expBound = String(startExp);
      h.dataset.kBound = String(k);
      const mv = (ev) => {
        const pos = Math.round((ev.clientX - sr.left) / CW) + 1;
        if (isR) {
          exp = Math.max(1, Math.min(pos - k + 1, maxF - k + 1));
          if (exp === +h.dataset.expBound) return;
          moved = true;
          if (line) line.style.width = ((k + exp - first) * CW) + "px";
          h.dataset.expBound = String(exp);
        } else {
          const newK = Math.max(1, Math.min(pos, k + startExp - 1));
          if (newK === +h.dataset.kBound) return;
          moved = true;
          if (line) line.style.left = ((newK - 1) * CW) + "px";
          h.dataset.kBound = String(newK);
        }
      };
      const up = () => {
        h.classList.remove("grab");
        try { h.releasePointerCapture(e.pointerId); } catch (err) {}
        h.removeEventListener("pointermove", mv);
        h.removeEventListener("pointerup", up);
        const curExp = isR ? exp : startExp;
        const curK = isR ? k : +h.dataset.kBound;
        h.dataset.expBound = ""; h.dataset.kBound = "";
        if (!moved || (curExp === startExp && curK === startK)) { renderAll(); return; }
        hist.pushModel(proj);
        if (isR) { l.frames[k].exposure = curExp; toast("exposure " + curExp); }
        else {
          const f = l.frames[startK];
          delete l.frames[startK];
          f.exposure = startExp;
          l.frames[curK] = f;
          toast("moved to " + curK);
        }
        hist.sealModel(proj);
        renderAll();
      };
      h.addEventListener("pointermove", mv);
      h.addEventListener("pointerup", up);
    };
  });
  // paint layer thumbnails — white when the drawing has ink, checkerboard when empty
  left.querySelectorAll("canvas.lthumb").forEach(cv => {
    const li = +cv.dataset.layer, l = proj.layers[li];
    const c = cv.getContext("2d");
    c.fillStyle = "#fff"; c.fillRect(0, 0, 52, 26);
    const k = E.effectiveFrameKey(l, proj.currentFrame);
    const surf = k !== null ? l.frames[k].canvas : null;
    if (surf && surf.getContext) c.drawImage(surf, 0, 0, 52, 26);
  });
  // key-cell thumbnails: 40 x 22 beveled drawing previews (checkerboard when empty)
  track.querySelectorAll(".cell.keyw").forEach(cell => {
    const f = +cell.dataset.f, li = +cell.dataset.l;
    const l = proj.layers[li];
    const img = cell.querySelector(".cellimg");
    if (!img) return;
    const surf = l.frames[f] && l.frames[f].canvas;
    if (!surf || !surf.getContext || frameIsEmpty(l.frames[f])) { img.classList.add("empty"); return; }
    const c = document.createElement("canvas");
    c.width = 40; c.height = 22;
    const cc = c.getContext("2d");
    cc.fillStyle = "#fff"; cc.fillRect(0, 0, 40, 22);
    cc.drawImage(surf, 0, 0, 40, 22);
    img.appendChild(c);
  });
  // footer: Notes/Sound/Color Group sit in the left column on the same row as the
  // bottom ruler (real 977..993); Background / Start Frame are the row below (994..1012)
  const foot = $("tlFoot");
  if (foot) foot.innerHTML = `
    <div class="frow2">
      <span class="ftlab">Background</span>
      <button id="ftBgBtn" class="ftfield" title="Selecting none means the background is alpha or transparent (Shift B)">${({ none: "None", color: "Color", check: "Check" })[proj.background] || "None"} ▾</button>
      <span class="ftstart">Start Frame</span>
      <input id="ftStartVal" class="ftnum" type="number" min="0" value="${proj.startFrame ?? 1}">
      <span class="ftclock" title="Start frame of the project">◷</span>
      <img class="ftresize" src="icons/Timeline-Resize-x20.png" title="drag up/down to resize the timeline">
    </div>`;
  const leftFoot = document.createElement("div");
  leftFoot.className = "lfrow1";
  leftFoot.innerHTML = `
    <button class="ftab" id="ftNotes" title="Show timeline notes">Notes</button>
    <button class="ftab" id="ftSound" title="Toggle the Sound panel">Sound</button>
    <button class="ftab" id="ftColor" title="Toggle the Color Group panel">Color Group</button>
    <span class="lfsep"></span>
    <span class="lfgrip" title="drag up/down to resize the timeline">⇔</span>`;
  left.appendChild(leftFoot);
  if (foot) {
    leftFoot.querySelector("#ftNotes").onclick = () => togglePane("notes");
    leftFoot.querySelector("#ftSound").onclick = () => togglePane("sound");
    leftFoot.querySelector("#ftColor").onclick = () => togglePane("color");
    leftFoot.querySelector(".lfgrip").onpointerdown = (e) => startTlResize(e);
    foot.querySelector("#ftBgBtn").onclick = (e) => backgroundMenu(e.currentTarget);
    foot.querySelector("#ftStartVal").onchange = (e) => {
      proj.startFrame = Math.max(0, +e.target.value || 0);
      renderAll();
      toast("start frame: " + proj.startFrame);
    };
    const clk = foot.querySelector(".ftclock");
    if (clk) clk.onclick = () => startFrameMenu();
    foot.querySelector(".ftresize").onpointerdown = (e) => startTlResize(e);
    syncPaneTabs();
  }
  // in/out scrub bar (real: clip 1..outFrame, per-frame tick lines, blue current
  // block + large frame number, green in / magenta out half-frame stripes)
  const ob = $("ovBar");
  if (ob) {
    const bf = Math.max(1, proj.outFrame);
    const cur = Math.min(bf, Math.max(1, proj.currentFrame));
    const curLeft = (cur - 1) / bf * 100;
    const inF = Math.min(bf, Math.max(1, proj.inFrame));
    const outF = Math.min(bf, Math.max(inF, proj.outFrame));
    const half = 50 / bf;
    $("ovCur").style.left = curLeft + "%";
    $("ovCur").style.width = (100 / bf) + "%";
    $("ovIn").style.left = ((inF - 1) / bf * 100) + "%";
    $("ovIn").style.width = half + "%";
    $("ovOut").style.left = (((outF - 1) + 0.5) / bf * 100) + "%";
    $("ovOut").style.width = half + "%";
    let num = $("ovNum");
    if (!num) {
      num = document.createElement("div");
      num.id = "ovNum";
      ob.appendChild(num);
    }
    num.textContent = cur;
    let nl = curLeft + 100 / bf;
    if (nl > 95) nl = 95 - 100 / bf;
    num.style.left = nl + "%";
    num.style.marginLeft = "4px";
    ob.querySelectorAll(".ovt").forEach(e => e.remove());
    for (let f = 3; f <= bf; f += 2) {
      const t = document.createElement("div");
      t.className = "ovt";
      t.style.left = ((f - 1) / bf * 100) + "%";
      ob.appendChild(t);
    }
  }
}
function renderLayersPanel() { /* thumbnails handled in renderTimeline */ }
let tlTimer = null, lastTl = 0;
function renderTimelineSoon() {
  const now = performance.now();
  if (now - lastTl > 180) { lastTl = now; renderTimeline(); return; }
  if (!tlTimer) tlTimer = setTimeout(() => {
    tlTimer = null; lastTl = performance.now(); renderTimeline();
  }, 180);
}
  function renderTimelineStatus() {
  const l = proj.layers[proj.currentLayer];
  const keys = Object.keys(l.frames).map(Number);
  const fK = keys.length ? Math.min(...keys) : 1;
  const lEnd = keys.length ? Math.max(...keys.map(k => k + (l.frames[k].exposure || 1) - 1)) : 1;
  const camOn = !!(proj.cameraKeys && proj.cameraKeys.length);
  const o = Math.max(proj.outFrame, proj.currentFrame);
  $("projTab").innerHTML = `${proj.name.startsWith("*") ? "" : "*"}${proj.name}
    <button onclick="" title="close (demo)">✕</button>`;
  const sb = $("sbInfo");
  if (sb) sb.innerHTML =
    `<span>Project: <b>${proj.name}</b> [1 , ${o} (${o})]</span>` +
    `<span>Clip: <b>Clip_001</b> [1 , ${o} (${o})]</span>` +
    `<span>Layer(${(camOn ? proj.currentLayer + 2 : proj.currentLayer + 1)}/${proj.layers.length + (camOn ? 1 : 0)}): <b>${l.name}</b> [${fK} , ${lEnd} (${lEnd - fK + 1})]</span>` +
    `<span>Current Image: <b>${proj.currentFrame}</b></span>`;
  syncTransport();
}

// ================= selection / cut brush =================
function regionCanvas(surf, rectOrPoly, regionW, regionH, isPoly, offset = { x: 0, y: 0 }) {
  const img = document.createElement("canvas");
  img.width = Math.ceil(regionW); img.height = Math.ceil(regionH);
  const c = img.getContext("2d");
  if (isPoly) {
    c.save(); c.beginPath();
    rectOrPoly.forEach((pt, i) => c.lineTo(pt.x - offset.x, pt.y - offset.y));
    c.closePath(); c.clip();
    c.drawImage(surf, -offset.x, -offset.y);
    c.restore();
  } else c.drawImage(surf, rectOrPoly.x, rectOrPoly.y, rectOrPoly.w, rectOrPoly.h, 0, 0, rectOrPoly.w, rectOrPoly.h);
  return img;
}
function applySelection() {
  if (!sel) return;
  const layer = proj.layers[proj.currentLayer];
  const key = currentKeyOf(layer);
  hist.pushFrame(proj, layer, key);
  E.frameSurface(proj, layer, key, true)
    .getContext("2d").drawImage(sel.img, sel.x + sel.dx, sel.y + sel.dy);
  sel = null; hist.sealLast(proj, layer, key); renderAll();
}
function createSelectionRect(x, y, w, h) {
  const layer = proj.layers[proj.currentLayer];
  const key = currentKeyOf(layer);
  const surf = E.frameSurface(proj, layer, key, true);
  hist.pushFrame(proj, layer, key);
  const img = regionCanvas(surf, { x, y, w, h }, w, h, false);
  surf.getContext("2d").clearRect(x, y, w, h);
  sel = { x, y, w: img.width, h: img.height, img, dx: 0, dy: 0 };
  hist.sealLast(proj, layer, key);
  toast("selection: drag to move · Enter: apply");
}
function createSelectionPoly(poly) {
  if (poly.length < 3) { preview = null; return; }
  const layer = proj.layers[proj.currentLayer];
  const key = currentKeyOf(layer);
  const surf = E.frameSurface(proj, layer, key, true);
  const xs = poly.map(p => p.x), ys = poly.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  const regionW = Math.max(...xs) - x, regionH = Math.max(...ys) - y;
  hist.pushFrame(proj, layer, key);
  const img = regionCanvas(surf, poly, regionW, regionH, true, { x, y });
  const c = surf.getContext("2d");
  c.save(); c.beginPath();
  poly.forEach((pt, i) => i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y));
  c.closePath(); c.clip(); c.clearRect(0, 0, proj.width, proj.height);
  c.restore();
  sel = { poly, x, y, w: img.width, h: img.height, img, dx: 0, dy: 0 };
  hist.sealLast(proj, layer, key);
  toast("lasso selection made");
}
function captureBrushRect(x, y, w, h) {
  const layer = proj.layers[proj.currentLayer];
  const key = currentKeyOf(layer);
  const surf = E.frameSurface(proj, layer, key, true);
  if (!surf) return;
  hist.pushFrame(proj, layer, key);
  const img = regionCanvas(surf, { x, y, w, h }, w, h, false);
  surf.getContext("2d").clearRect(x, y, w, h);
  cutBrush = { img, size: Math.max(w, h) };
  sel = null; hist.sealLast(proj, layer, key);
  selectTool("custombrush"); renderBin(); renderAll();
  toast("brush captured — Custom Brush active (Bin tab shows it)");
}
function captureLassoBrush(poly) {
  if (poly.length < 3) { preview = null; return; }
  const layer = proj.layers[proj.currentLayer];
  const key = currentKeyOf(layer);
  const surf = E.frameSurface(proj, layer, key, true);
  if (!surf) return;
  const xs = poly.map(p => p.x), ys = poly.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  const regionW = Math.max(...xs) - x, regionH = Math.max(...ys) - y;
  hist.pushFrame(proj, layer, key);
  const img = regionCanvas(surf, poly, regionW, regionH, true, { x, y });
  const c = surf.getContext("2d");
  c.save(); c.beginPath();
  poly.forEach((pt, i) => i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y));
  c.closePath(); c.clip(); c.clearRect(0, 0, proj.width, proj.height);
  c.restore();
  cutBrush = { img, size: Math.max(regionW, regionH) };
  sel = null; hist.sealLast(proj, layer, key);
  selectTool("custombrush"); renderBin(); renderAll();
  toast("brush captured — Custom Brush active");
}
function zoomToRect(x, y, w, h) {
  resizeCanvases();
  view.zoom = Math.max(0.05, Math.min(20, Math.min(art.width / w, art.height / h)));
  view.x = -x * view.zoom + (art.width - w * view.zoom) / 2;
  view.y = -y * view.zoom + (art.height - h * view.zoom) / 2;
  renderAll();
}

// ================= layers / xsheet / remote =================
window.pickLayer = (i) => { proj.currentLayer = i; renderAll(); };
// jump to the previous / next drawing (instance) of a layer
window.layerInst = (i, dir) => {
  const keys = Object.keys(proj.layers[i].frames).map(Number).sort((a, b) => a - b);
  const f = dir < 0 ? keys.filter(k => k < proj.currentFrame).pop() : keys.find(k => k > proj.currentFrame);
  if (f !== undefined) gotoFrame(f, i);
};
// small layer context menu (⋯ in the layer row)
window.layerMenu = (i, btn) => {
  document.querySelectorAll(".pbmenu").forEach(x => x.remove());
  const m = document.createElement("div");
  m.className = "pbmenu";
  const r = btn.getBoundingClientRect();
  m.style.left = r.left + "px";
  m.style.top = (r.bottom + 2) + "px";
  m.innerHTML = `<div class="pbi" data-a="rename">Rename…</div>
    <div class="pbi" data-a="dup">Duplicate Layer</div>
    <div class="pbi" data-a="del">Delete Layer</div>`;
  document.body.appendChild(m);
  m.querySelectorAll(".pbi").forEach(el => el.onclick = (ev) => {
    ev.stopPropagation();
    m.remove();
    proj.currentLayer = i;
    if (el.dataset.a === "rename") {
      const n = prompt("Layer name:", proj.layers[i].name);
      if (n) { proj.layers[i].name = n; renderAll(); }
    } else if (el.dataset.a === "dup") layerDup();
    else layerDel();
  });
  const off = (ev) => {
    if (!m.contains(ev.target)) { m.remove(); document.removeEventListener("pointerdown", off, true); }
  };
  document.addEventListener("pointerdown", off, true);
};
// drag the timeline resize handle (transport ⋯ / footer ⋯) to change the timeline height
function startTlResize(e) {
  e.preventDefault();
  const app = $("app");
  const startY = e.clientY;
  const startH = parseInt(getComputedStyle(app).gridTemplateRows.split(" ")[3], 10) || 320;
  const mv = (ev) => {
    const h = Math.max(180, Math.min(window.innerHeight - 240, startH - (ev.clientY - startY)));
    app.style.gridTemplateRows = `24px 32px 1fr ${h}px 26px`;
    renderTimeline();
  };
  const up = () => {
    window.removeEventListener("pointermove", mv);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", mv);
  window.addEventListener("pointerup", up);
}
function startTlScroll(e) {
  e.preventDefault();
  const tr = $("tlTrack"), th = $("tsThumb");
  if (!tr || !th) return;
  const startX = e.clientX, startScroll = tr.scrollLeft;
  const maxScroll = Math.max(1, tr.scrollWidth - tr.clientWidth);
  const thumbW = th.getBoundingClientRect().width || 1;
  const range = Math.max(1, th.parentElement.getBoundingClientRect().width - thumbW);
  th.classList.add("drag");
  const mv = (ev) => {
    tr.scrollLeft = Math.max(0, Math.min(maxScroll, startScroll + (ev.clientX - startX) * maxScroll / range));
  };
  const up = () => {
    th.classList.remove("drag");
    window.removeEventListener("pointermove", mv);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", mv);
  window.addEventListener("pointerup", up);
}
window.toggleLayerFlagAt = (i, flag, v) => {
  const l = proj.layers[i]; l[flag] = v === undefined ? !l[flag] : v; renderAll();
};
window.layerAdd = () => {
  hist.pushModel(proj);
  proj.layers.push(E.newLayer("Anim_0" + (proj.layers.length + 1)));
  proj.currentLayer = proj.layers.length - 1;
  hist.sealModel(proj); renderAll();
};
window.layerDel = () => {
  if (proj.layers.length <= 1) { toast("cannot delete last layer"); return; }
  hist.pushModel(proj);
  proj.layers.splice(proj.currentLayer, 1);
  proj.currentLayer = Math.min(proj.currentLayer, proj.layers.length - 1);
  hist.sealModel(proj); renderAll();
};
window.layerDup = () => {
  const src = proj.layers[proj.currentLayer];
  const copy = JSON.parse(JSON.stringify(src, (k, v) => k === "canvas" ? undefined : v));
  copy.id = Math.random().toString(36).slice(2, 10);
  copy.name = src.name + " copy"; copy.frames = {};
  Object.keys(src.frames).forEach(kk => {
    copy.frames[kk] = { exposure: src.frames[kk].exposure, id: Math.random().toString(36).slice(2, 10), canvas: null };
    if (src.frames[kk].canvas && src.frames[kk].canvas.getContext) {
      const cc = E.makeSurface(proj.width, proj.height);
      cc.getContext("2d").drawImage(src.frames[kk].canvas, 0, 0);
      copy.frames[kk].canvas = cc;
    }
  });
  proj.layers.splice(proj.currentLayer + 1, 0, copy);
  proj.currentLayer++; renderAll();
};
// ================= TVPaint timeline command layer =================
// All labels/order below were captured live from the real TVPaint 12 Pro demo
// (right-click on layer name / timeline cell, New ▾, Background field) and
// matched to the shipped english.tvpaint.loc string table.
function blendToComposite(m) {
  return ({
    Normal: "source-over", Add: "lighter", Multiply: "multiply", Screen: "screen",
    Overlay: "overlay", "Soft Light": "soft-light", "Hard Light": "hard-light",
    "Color Dodge": "color-dodge", "Color Burn": "color-burn", Darken: "darken",
    Lighten: "lighten", Difference: "difference", Exclusion: "exclusion",
    Hue: "hue", Saturation: "saturation", Color: "color", Luminosity: "luminosity"
  })[m] || "source-over";
}
let tvMenus = [];
function closeTvMenus() {
  tvMenus.forEach(m => m.remove());
  tvMenus = [];
}
function buildTvMenu(items) {
  const m = document.createElement("div");
  m.className = "tvmenu";
  let sub = null;
  const closeSub = () => {
    if (sub) { sub.remove(); tvMenus = tvMenus.filter(x => x !== sub); sub = null; }
  };
  items.forEach(it => {
    if (it.sep) {
      const s = document.createElement("div"); s.className = "tvmi sep"; m.appendChild(s); return;
    }
    const d = document.createElement("div");
    d.className = "tvmi" + (it.disabled ? " dis" : "") + (it.danger ? " danger" : "");
    d.innerHTML = `<span class="chk">${it.checked ? "✓" : ""}</span>` +
      (it.sw ? `<span class="sw" style="background:${it.sw}"></span>` : "") +
      `<span class="lbl">${it.label}</span>` +
      (it.shortcut ? `<span class="sc">${it.shortcut}</span>` : "") +
      (it.submenu ? `<span class="arrow">›</span>` : "");
    if (it.submenu && !it.disabled) {
      d.addEventListener("mouseenter", () => {
        closeSub();
        sub = buildTvMenu(it.submenu);
        document.body.appendChild(sub);
        sub.style.left = "0px"; sub.style.top = "0px";
        const r = d.getBoundingClientRect(), sr = sub.getBoundingClientRect();
        let sx = r.right - 3, sy = r.top - 3;
        if (sx + sr.width > innerWidth - 2) sx = Math.max(2, r.left - sr.width + 3);
        if (sy + sr.height > innerHeight - 2) sy = Math.max(2, innerHeight - sr.height - 2);
        sub.style.left = sx + "px"; sub.style.top = sy + "px";
        tvMenus.push(sub);
      });
    } else if (!it.disabled) {
      d.addEventListener("mouseenter", closeSub);
      d.addEventListener("click", ev => {
        ev.stopPropagation(); closeTvMenus();
        if (it.action) it.action();
      });
    }
    m.appendChild(d);
  });
  return m;
}
function openTvMenu(items, x, y) {
  closeTvMenus();
  const m = buildTvMenu(items);
  m.style.left = "0px"; m.style.top = "0px";
  document.body.appendChild(m);
  const r = m.getBoundingClientRect();
  let nx = x, ny = y;
  if (nx + r.width > innerWidth - 4) nx = Math.max(4, innerWidth - r.width - 4);
  if (ny + r.height > innerHeight - 4) ny = Math.max(4, innerHeight - r.height - 4);
  if (ny < 4) ny = 4;
  if (nx < 4) nx = 4;
  m.style.left = nx + "px"; m.style.top = ny + "px";
  tvMenus = [m];
}
document.addEventListener("pointerdown", e => {
  if (!e.target.closest(".tvmenu")) closeTvMenus();
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeTvMenus(); });

function tvCommit(fn) { hist.pushModel(proj); fn(); hist.sealModel(proj); renderAll(); }
function tvCloneSurface(src) {
  if (!src || !src.getContext) return null;
  const s = E.makeSurface(src.width || proj.width, src.height || proj.height);
  s.getContext("2d").drawImage(src, 0, 0);
  return s;
}
function tvCloneLayer(src, name) {
  const c = Object.assign({}, src, {
    id: Math.random().toString(36).slice(2, 10),
    name: name || src.name,
    frames: {}, marks: Object.assign({}, src.marks || {})
  });
  Object.keys(src.frames).forEach(k => {
    const fr = src.frames[k];
    c.frames[k] = { exposure: fr.exposure || 1, role: fr.role || null,
      id: Math.random().toString(36).slice(2, 10), canvas: tvCloneSurface(fr.canvas) };
  });
  return c;
}
function tvCurrentLayer() { return proj.layers[proj.currentLayer]; }
const TV_GROUPS = [
  { name: "Default", color: "#8f8f95" }, { name: "Dark Blue", color: "#2b3a67" },
  { name: "Dark Green", color: "#2e5b3a" }, { name: "Dark Cyan", color: "#27585b" },
  { name: "Dark Red", color: "#5b2a2a" }, { name: "Purple", color: "#4b2f5e" },
  { name: "Brown", color: "#5e462f" }, { name: "Blue", color: "#3d5a9e" },
  { name: "Green", color: "#3e8a56" }, { name: "Cyan", color: "#3ea0a6" },
  { name: "Red", color: "#b04141" }, { name: "Magenta", color: "#a0418a" },
  { name: "Orange", color: "#c07a3a" }
];
function ensureGroups() {
  if (!Array.isArray(proj.groups) || !proj.groups.length) proj.groups = TV_GROUPS.map(g => ({ ...g }));
}

// ---- layer name operations ----
window.pickLayerKeep = window.pickLayer;
window.startLayerRename = function (i) {
  const nm = document.querySelector(`.llayer[data-layer="${i}"] .nm`);
  if (!nm) return;
  const inp = document.createElement("input");
  inp.className = "lnm-input"; inp.value = proj.layers[i].name;
  nm.replaceWith(inp); inp.focus(); inp.select();
  const done = (ok) => {
    const v = inp.value.trim();
    inp.onblur = null;
    if (ok && v) proj.layers[i].name = v;
    renderAll();
  };
  inp.onkeydown = (e) => {
    e.stopPropagation();
    if (e.key === "Enter") { e.preventDefault(); done(true); }
    else if (e.key === "Escape") { e.preventDefault(); done(false); }
  };
  inp.onblur = () => done(true);
};
window.collapseLayer = function (i) {
  const l = proj.layers[i]; l.collapsed = !l.collapsed; renderAll();
};
window.toggleLayerFilter = function (mode) {
  proj.layerFilter = mode;
  toast(mode === "anim" ? "animation layers only" : "all layers");
};
window.toggleAllFlag = function (flag) {
  const on = proj.layers.every(l => flag === "visible" ? l.visible !== false : !!l[flag]);
  tvCommit(() => proj.layers.forEach(l => { l[flag] = !on; }));
  toast(flag + ": " + (!on ? "on (all)" : "off (all)"));
};

// ---- layer create menu (captured: New ▾) ----
window.addTypedLayer = function (type) {
  const names = { background: "Background", ctg: "CTG", folder: "Folder", puppet: "Puppet" };
  tvCommit(() => {
    const l = E.newLayer(names[type] || "Anim");
    l.type = type;
    if (type === "folder" || type === "puppet") l.frames = {};
    if (type === "background") {
      const cv = E.makeSurface(proj.width, proj.height);
      const c = cv.getContext("2d");
      c.fillStyle = proj.background === "none" ? "#ffffff" : (proj.bgA || "#ffffff");
      c.fillRect(0, 0, proj.width, proj.height);
      l.frames = { 1: { exposure: 1, canvas: cv, id: Math.random().toString(36).slice(2, 10) } };
    }
    proj.layers.splice(proj.currentLayer, 0, l);
  });
  toast((names[type] || "Anim") + " layer created");
};
window.newLayerMenu = function (btn) {
  const r = btn.getBoundingClientRect();
  openTvMenu([
    { label: "Anim Layer", action: () => layerAdd() },
    { label: "Background Layer", action: () => addTypedLayer("background") },
    { label: "Color & Texture Layer", action: () => addTypedLayer("ctg") },
    { label: "Duplicate Structure Anim", action: () => dvDupStructure("anim") },
    { label: "Duplicate Structure Folder", action: () => dvDupStructure("folder") },
    { label: "Folder", action: () => addTypedLayer("folder") },
    { label: "Puppet Layer", action: () => addTypedLayer("puppet") },
    { sep: true },
    { label: "Import Footage", action: () => importFootage() },
    { sep: true },
    { label: "Open Layer Presets Manager", action: () => layerPresetsDlg() }
  ], r.left, r.bottom + 2);
};
function dvDupStructure(type) {
  const src = tvCurrentLayer();
  const l = tvCloneLayer(src, src.name + " structure");
  l.type = type === "folder" ? "folder" : src.type;
  if (type === "folder") l.frames = {};
  else Object.keys(l.frames).forEach(k => l.frames[k].canvas = null);
  l.name = src.name + " structure";
  tvCommit(() => proj.layers.splice(proj.currentLayer, 0, l));
  toast("structure duplicated");
}
function importFootage() {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*"; inp.multiple = true;
  inp.onchange = () => {
    [...inp.files].forEach(file => {
      const img = new Image();
      img.onload = () => {
        tvCommit(() => {
          const l = E.newLayer(file.name.replace(/\.[^.]+$/, ""));
          const cv = E.makeSurface(proj.width, proj.height);
          const c = cv.getContext("2d");
          const s = Math.min(proj.width / img.width, proj.height / img.height);
          c.drawImage(img, (proj.width - img.width * s) / 2, (proj.height - img.height * s) / 2,
            img.width * s, img.height * s);
          l.frames[1].canvas = cv;
          proj.layers.splice(proj.currentLayer, 0, l);
        });
      };
      img.src = URL.createObjectURL(file);
    });
  };
  inp.click();
}
function layerPresetsDlg() {
  const p = proj.layerPresets || (proj.layerPresets = { autoBreak: false, autoCreate: true, lockPosition: false });
  const b = openModal("Layer Presets Manager", `
    <label style="display:block;margin:4px 0"><input type="checkbox" id="lpAutoBreak" ${p.autoBreak ? "checked" : ""}> Auto Break Instance</label>
    <label style="display:block;margin:4px 0"><input type="checkbox" id="lpAutoCreate" ${p.autoCreate ? "checked" : ""}> Auto Create Instance</label>
    <label style="display:block;margin:4px 0"><input type="checkbox" id="lpLock" ${p.lockPosition ? "checked" : ""}> Lock Position</label>
    <div style="color:#898f96;margin-top:8px">Layer presets control how new drawings, exposures and positions are created on the timeline.</div>`,
    [["Close", () => {}], ["Apply", () => {
      p.autoBreak = b.querySelector("#lpAutoBreak").checked;
      p.autoCreate = b.querySelector("#lpAutoCreate").checked;
      p.lockPosition = b.querySelector("#lpLock").checked;
      toast("layer presets saved");
    }, true]]);
}
window.stencilMenu = function (btn) {
  const r = btn.getBoundingClientRect();
  openTvMenu([
    { label: "Disable all stencils", action: () => { tvCommit(() => proj.layers.forEach(l => l.stencil = "off")); } },
    { label: "Invert positive / negative", action: () => { tvCommit(() => proj.layers.forEach(l => { if (l.stencil === "positive") l.stencil = "negative"; else if (l.stencil === "negative") l.stencil = "positive"; })); } },
    { sep: true },
    { label: "Manage Stencils…", action: () => toast("click the 4th dot on a layer to cycle off / positive / negative") }
  ], r.left, r.bottom + 2);
};
window.displayMenu = function (btn) {
  const r = btn.getBoundingClientRect();
  openTvMenu([
    { label: "Show-Hide Roles on Timeline", checked: !!proj.showRoles, action: () => { proj.showRoles = !proj.showRoles; renderAll(); } },
    { label: "Show-Hide Roles on Current Layer only", checked: !!proj.roleLayerOnly, action: () => { proj.roleLayerOnly = !proj.roleLayerOnly; renderAll(); } },
    { sep: true },
    { label: "Show Image Marks", checked: proj.showMarks !== false, action: () => { proj.showMarks = proj.showMarks === false; renderAll(); } },
    { sep: true },
    { label: "Show Timeline Notes", action: () => togglePane("notes") }
  ], r.left, r.bottom + 2);
};

// ---- layer context menu (captured 15 items) ----
let layerClip = null, imageClip = null;
function deleteLayers(list) {
  if (proj.layers.length - list.length < 1) { toast("cannot delete last layer"); return; }
  tvCommit(() => {
    [...list].sort((a, b) => b - a).forEach(i => proj.layers.splice(i, 1));
    proj.currentLayer = Math.min(proj.currentLayer, proj.layers.length - 1);
    proj.selectedLayers = [proj.currentLayer];
  });
}
function copyLayerToClip(i) {
  layerClip = tvCloneLayer(proj.layers[i], proj.layers[i].name);
  toast("layer copied");
}
function splitLayerAt(i) {
  const l = proj.layers[i], f = proj.currentFrame;
  const right = tvCloneLayer(l, l.name + "_2");
  right.frames = {};
  const keys = E.layerKeys(l);
  keys.forEach(k => {
    const fr = l.frames[k], exp = fr.exposure || 1, end = k + exp - 1;
    if (k >= f) {
      right.frames[k] = { exposure: exp, role: fr.role || null, id: Math.random().toString(36).slice(2, 10), canvas: fr.canvas };
      delete l.frames[k];
    } else if (end >= f) {
      fr.exposure = f - k;
      right.frames[f] = { exposure: end - f + 1, role: fr.role || null, id: Math.random().toString(36).slice(2, 10), canvas: tvCloneSurface(fr.canvas) };
    }
  });
  if (!E.layerKeys(right).length) { toast("nothing to split at this frame"); return; }
  tvCommit(() => { proj.layers.splice(i, 0, right); proj.currentLayer = i; });
  toast("layer split");
}
function mergeLayers(which) {
  let idxs;
  if (which === "all") idxs = proj.layers.map((_, i) => i);
  else if (which === "visible") idxs = proj.layers.map((_, i) => i).filter(i => proj.layers[i].visible !== false);
  else idxs = (proj.selectedLayers && proj.selectedLayers.length ? proj.selectedLayers : [proj.currentLayer]).slice();
  if (idxs.length < 2) { toast("select at least 2 layers to merge"); return; }
  const ls = idxs.map(i => proj.layers[i]);
  const min = Math.min(...ls.map(l => E.layerKeys(l)[0] || 1));
  const max = Math.max(...ls.map(l => E.layerEnd(l) || 1));
  const composeAt = (f) => {
    const cv = E.makeSurface(proj.width, proj.height);
    const c = cv.getContext("2d");
    ls.forEach(l => {
      const k = E.effectiveFrameKey(l, f);
      if (k == null || !l.frames[k].canvas) return;
      c.globalAlpha = l.opacity ?? 1;
      c.drawImage(l.frames[k].canvas, 0, 0);
    });
    return cv;
  };
  const frames = {};
  let runStart = null, runSig = null, runCv = null;
  for (let f = min; f <= max; f++) {
    const sig = ls.map(l => E.effectiveFrameKey(l, f) ?? "-").join(",");
    if (sig !== runSig) {
      if (runStart != null) frames[runStart] = { exposure: f - runStart, canvas: runCv, id: Math.random().toString(36).slice(2, 10) };
      runStart = f; runSig = sig; runCv = composeAt(f);
    }
  }
  if (runStart != null) frames[runStart] = { exposure: max - runStart + 1, canvas: runCv, id: Math.random().toString(36).slice(2, 10) };
  const merged = E.newLayer(ls[0].name + " merged");
  merged.frames = frames;
  const at = Math.min(...idxs);
  tvCommit(() => {
    [...idxs].sort((a, b) => b - a).forEach(i => proj.layers.splice(i, 1));
    proj.layers.splice(at, 0, merged);
    proj.currentLayer = at;
    proj.selectedLayers = [at];
  });
  toast("layers merged");
}
function selectLayers(mode) {
  const cur = tvCurrentLayer();
  let sel = [];
  if (mode === "all") sel = proj.layers.map((_, i) => i);
  else if (mode === "visible") sel = proj.layers.map((_, i) => i).filter(i => proj.layers[i].visible !== false);
  else if (mode === "group") sel = proj.layers.map((_, i) => i).filter(i => (proj.layers[i].group || 0) === (cur.group || 0));
  else if (mode === "other") sel = proj.layers.map((_, i) => i).filter(i => (proj.layers[i].group || 0) !== (cur.group || 0));
  proj.selectedLayers = sel;
  renderAll();
  toast(sel.length ? sel.length + " layer(s) selected" : "selection cleared");
}
window.layerMenu = function (i, btn, mx, my) {
  const l = proj.layers[i];
  const r = btn ? btn.getBoundingClientRect() : null;
  const x = mx != null ? mx : (r ? r.left : 70);
  const y = my != null ? my : (r ? r.bottom + 2 : 860);
  openTvMenu([
    { label: "Rename", action: () => startLayerRename(i) },
    { label: "Cut Layer", shortcut: "Ctrl X", action: () => { copyLayerToClip(i); deleteLayers([i]); } },
    { label: "Copy Layer", shortcut: "Ctrl C", action: () => copyLayerToClip(i) },
    { label: "Duplicate", action: () => {
      const c = tvCloneLayer(l, l.name + " copy");
      tvCommit(() => { proj.layers.splice(i + 1, 0, c); proj.currentLayer = i + 1; });
    } },
    { sep: true },
    { label: "Delete", danger: true, action: () => deleteLayers([i]) },
    { sep: true },
    { label: "Split", action: () => splitLayerAt(i) },
    { label: "Move", submenu: [
      { label: "Go to Image…", action: () => numDialog("Go to Image", "Image", proj.currentFrame, v => gotoFrame(v, i), 1, 9999) },
      { label: "Slide Layer…", action: () => numDialog("Slide Layer", "Offset (frames)", 1, v => tvCommit(() => E.slideLayer(proj.layers[i], v)), -999, 999) },
      { label: "Slide Layer to Image…", action: () => numDialog("Slide Layer to Image", "Target image", proj.currentFrame, v => tvCommit(() => E.slideLayer(proj.layers[i], v - (E.layerKeys(proj.layers[i])[0] || 1))), 1, 9999) }
    ] },
    { label: "Align", submenu: [
      { label: "Align Left", action: () => tvCommit(() => E.alignLayer(proj, proj.layers[i], "start")) },
      { label: "Align Right", action: () => tvCommit(() => E.alignLayer(proj, proj.layers[i], "end")) }
    ] },
    { label: "Merge", submenu: [
      { label: "Merge Selected", action: () => mergeLayers("selected") },
      { label: "Merge Visible", action: () => mergeLayers("visible") },
      { label: "Merge All", action: () => mergeLayers("all") }
    ] },
    { sep: true },
    { label: "Select Layer(s)", submenu: [
      { label: "All", action: () => selectLayers("all") },
      { label: "Same Color Group", action: () => selectLayers("group") },
      { label: "Other Color Groups", action: () => selectLayers("other") },
      { label: "Visible", action: () => selectLayers("visible") },
      { label: "None", action: () => selectLayers("none") }
    ] },
    { sep: true },
    { label: "Reverse Order", action: () => {
      tvCommit(() => {
        proj.layers.reverse();
        proj.currentLayer = proj.layers.length - 1 - proj.currentLayer;
      });
    } },
    { sep: true },
    { label: "Transform into CTG Layer", action: () => {
      tvCommit(() => {
        l.type = l.type === "ctg" ? "anim" : "ctg";
        l.name = l.type === "ctg" ? "CTG " + l.name.replace(/^CTG /, "") : l.name.replace(/^CTG /, "");
      });
      toast(l.type === "ctg" ? "transformed into CTG layer" : "transformed into anim layer");
    } },
    { label: "Create folder in Image Library", action: () => toast("image library folder: " + l.name) },
    { sep: true },
    { label: "Show-Hide Roles on Timeline", checked: !!proj.showRoles, action: () => { proj.showRoles = !proj.showRoles; renderAll(); } },
    { label: "Show-Hide Roles on Current Layer only", checked: !!proj.roleLayerOnly, action: () => { proj.roleLayerOnly = !proj.roleLayerOnly; renderAll(); } }
  ], x, y);
};

// ---- cell context menu (captured from right-click on timeline cell) ----
function numDialog(title, label, val, cb, min = 1, max = 9999) {
  const b = openModal(title, `<label style="display:flex;gap:10px;align-items:center">${label}
      <input id="ndVal" type="number" min="${min}" max="${max}" value="${val}" style="width:120px"></label>`,
    [["Cancel", () => {}], ["Apply", () => {
      const v = +b.querySelector("#ndVal").value;
      if (!isFinite(v) || v < min || v > max) { toast("invalid value"); return false; }
      cb(Math.round(v));
    }, true]]);
  setTimeout(() => { const el = b.querySelector("#ndVal"); if (el) { el.focus(); el.select(); } }, 40);
}
function cellFrame(li, f) {
  const l = proj.layers[li];
  const k = E.effectiveFrameKey(l, f);
  return { l, k, fr: k != null ? l.frames[k] : null };
}
function cellOp(op, li, f) {
  const { l } = cellFrame(li, f);
  if (!l) return;
  if (op === "break") {
    const ok = (() => { let r = false; tvCommit(() => { r = E.breakExposure(proj, l, f); }); return r; })();
    toast(ok ? "instance broken" : "cannot break this exposure");
  } else if (op === "unexpose") {
    tvCommit(() => E.removeExposures(l, f)); toast("exposure removed");
  } else if (op === "exposure") {
    dlgExposure(li, f);
  } else if (op === "delete-layer") {
    tvCommit(() => E.deleteImageAt(l, f)); toast("image deleted from layer");
  } else if (op === "delete-project") {
    tvCommit(() => E.deleteFrameColumn(proj, f)); toast("frame deleted from project");
  } else if (op === "repeat") {
    const added = (() => { let n = 0; tvCommit(() => { n = E.repeatImages(proj, l, l.repeatValue || 2, l.repeatMode || "Loop"); }); return n; })();
    toast(added ? `repeated ${l.repeatMode} (${l.repeatValue})` : "nothing to repeat");
  } else if (op === "reverse") {
    tvCommit(() => E.xsheetOp(proj, l, "reverse", f)); toast("images reversed");
  } else if (op === "copy") {
    const { k, fr } = cellFrame(li, f);
    if (k == null) { toast("empty cell"); return; }
    imageClip = { exposure: fr.exposure || 1, role: fr.role || null, canvas: tvCloneSurface(fr.canvas) };
    toast("image copied");
  } else if (op === "cut") {
    const { k, fr } = cellFrame(li, f);
    if (k == null) { toast("empty cell"); return; }
    imageClip = { exposure: fr.exposure || 1, role: fr.role || null, canvas: tvCloneSurface(fr.canvas) };
    tvCommit(() => E.deleteImageAt(l, f));
    toast("image cut");
  }
}
function dlgExposure(li, f) {
  const { k, fr } = cellFrame(li, f);
  numDialog("Layer: Set Exposure Value", "Exposure", fr ? (fr.exposure || 1) : 1,
    v => tvCommit(() => E.setExposureValue(proj.layers[li], k != null ? k : f, v)), 1, 999);
}
function dlgInsert(li, f, mode) {
  numDialog(mode === "before" ? "Insert Images (before)" : "Insert Images (after)", "Number of images", 1,
    n => tvCommit(() => E.insertImages(proj.layers[li], f, n, mode)), 1, 120);
}
function dlgDuplicate(li, f) {
  numDialog("Duplicate Images", "Number of copies", 1,
    n => tvCommit(() => E.insertImages(proj.layers[li], f, n, "duplicate", tvCloneSurface)), 1, 120);
}
function dlgRepeatValue(l) {
  numDialog("Repeat Images", "Repeat value", l.repeatValue || 2, v => { l.repeatValue = v; toast("repeat value: " + v); }, 1, 120);
}
function setImageRole(li, f, roleId) {
  const { l, k } = cellFrame(li, f);
  if (k == null) { toast("empty cell"); return; }
  tvCommit(() => { l.frames[k].role = roleId; proj.showRoles = true; });
  toast(roleId ? "role: " + roleId : "role cleared");
}
window.cellMenu = function (li, f, mx, my) {
  const { l, k, fr } = cellFrame(li, f);
  const markKey = k != null ? k : f;
  openTvMenu([
    { label: "Exposure", submenu: [
      { label: "Break Instance", action: () => cellOp("break", li, f) },
      { label: "Remove exposures", action: () => cellOp("unexpose", li, f) },
      { sep: true },
      { label: "Set Exposure Value…", action: () => dlgExposure(li, Math.max(f, k != null ? k : f)) }
    ] },
    { label: "Insert Images", submenu: [
      { label: "Insert Images (after)…", action: () => dlgInsert(li, f, "after") },
      { label: "Insert Images (before)…", action: () => dlgInsert(li, f, "before") },
      { label: "Duplicate Images…", action: () => dlgDuplicate(li, f) }
    ] },
    { sep: true },
    { label: "Delete from Layer", action: () => cellOp("delete-layer", li, f) },
    { label: "Delete from Project", shortcut: "Shift F5", danger: true, action: () => cellOp("delete-project", li, f) },
    { sep: true },
    { label: "Repeat Images", submenu: [
      { label: "Set the Repeat Images Value…", action: () => dlgRepeatValue(l) },
      { label: "Reset", action: () => { l.repeatValue = 2; toast("repeat value reset to 2"); } },
      { sep: true },
      ...["Loop", "Ping-Pong", "Random"].map(m => ({
        label: m, checked: (l.repeatMode || "Loop") === m,
        action: () => { l.repeatMode = m; cellOp("repeat", li, f); }
      }))
    ] },
    { sep: true },
    { label: "Rename", action: () => startLayerRename(li) },
    { label: "Image Marks", submenu: [
      { label: "Set Mark", action: () => { tvCommit(() => E.setImageMark(l, markKey, true)); } },
      { label: "Clear Mark", disabled: !(l.marks && l.marks[markKey]), action: () => { tvCommit(() => E.setImageMark(l, markKey, false)); } },
      { sep: true },
      { label: "Go to Previous Image Mark", action: () => { const m = E.nextImageMark(l, proj.currentFrame, -1); if (m) gotoFrame(m); else toast("no previous image mark"); } },
      { label: "Go to Next Image Mark", action: () => { const m = E.nextImageMark(l, proj.currentFrame, 1); if (m) gotoFrame(m); else toast("no next image mark"); } },
      { label: "Remove All Image Marks", action: () => { tvCommit(() => { l.marks = {}; }); toast("image marks removed"); } }
    ] },
    { sep: true },
    { label: "Select All", shortcut: "Ctrl A", action: () => {
      proj.inFrame = 1;
      proj.outFrame = Math.max(proj.outFrame, ...proj.layers.map(x => E.layerEnd(x) || 1));
      renderAll(); toast("all images selected");
    } },
    { label: "Select Image from Key", disabled: true },
    { sep: true },
    { label: "Split", action: () => cellOp("break", li, f) },
    { sep: true },
    { label: "Cut Image", shortcut: "Ctrl X", action: () => cellOp("cut", li, f) },
    { label: "Copy Image", shortcut: "Ctrl C", action: () => cellOp("copy", li, f) },
    { sep: true },
    { label: "Reverse Selected Images", action: () => cellOp("reverse", li, f) },
    { sep: true },
    { label: "Role", submenu: [
      ...E.IMAGE_ROLES.map(r => ({
        label: r.label, sw: r.color, checked: !!(fr && fr.role === r.id),
        action: () => setImageRole(li, f, r.id)
      })),
      { sep: true },
      { label: "None", checked: !(fr && fr.role), action: () => setImageRole(li, f, null) }
    ] },
    { label: "Define Loop Limits", action: () => dlgLoopLimits() }
  ], mx, my);
};
function pasteImageClip() {
  if (!imageClip) { toast("no image copied"); return; }
  const l = tvCurrentLayer();
  let at = proj.currentFrame;
  if (E.effectiveFrameKey(l, at) != null) at = E.layerEnd(l) + 1;
  tvCommit(() => {
    l.frames[at] = { exposure: imageClip.exposure, role: imageClip.role,
      canvas: tvCloneSurface(imageClip.canvas), id: Math.random().toString(36).slice(2, 10) };
  });
  toast("image pasted @ " + at);
}
function pasteLayerClip() {
  if (!layerClip) { toast("no layer copied"); return; }
  const c = tvCloneLayer(layerClip, layerClip.name + " copy");
  tvCommit(() => { proj.layers.splice(proj.currentLayer + 1, 0, c); proj.currentLayer++; });
  toast("layer pasted");
}
function dlgLoopLimits() {
  const lim = proj.loopLimits || (proj.loopLimits = { mode: "mark", start: 1, end: null });
  const b = openModal("Define Loop Limits", `
    <div class="orow"><label style="flex:0 0 140px">Limits</label>
      <select id="llMode" style="flex:1">
        <option value="clip">Clip duration</option>
        <option value="layer">Current layer</option>
        <option value="mark">Mark In / Mark Out</option>
        <option value="bookmarks">Bookmarks</option>
        <option value="marks">Image Marks</option>
        <option value="custom">Custom limits</option>
      </select></div>
    <div class="orow" style="margin-top:8px"><label style="flex:0 0 140px">Custom</label>
      <input id="llStart" type="number" min="1" value="${lim.start || 1}" style="width:90px"> –
      <input id="llEnd" type="number" min="1" value="${lim.end || proj.outFrame}" style="width:90px"></div>
    <div style="color:#898f96;margin-top:10px;line-height:1.35">The limits can be the duration of the clip or the current layer, the Mark In/Out values, the Bookmarks, the Image Marks, or you can set your own limits.</div>`,
    [["Cancel", () => {}], ["Apply", () => {
      lim.mode = b.querySelector("#llMode").value;
      lim.start = Math.max(1, +b.querySelector("#llStart").value || 1);
      lim.end = Math.max(lim.start, +b.querySelector("#llEnd").value || proj.outFrame);
      toast("loop limits: " + lim.mode);
    }, true]]);
  b.querySelector("#llMode").value = lim.mode || "mark";
}
function playRange() {
  const lim = proj.loopLimits || { mode: "mark" };
  if (lim.mode === "clip") return { a: 1, b: Math.max(1, proj.outFrame) };
  if (lim.mode === "layer") {
    const l = tvCurrentLayer();
    const ks = E.layerKeys(l);
    return { a: ks[0] || 1, b: E.layerEnd(l) || proj.outFrame };
  }
  if (lim.mode === "custom") return { a: Math.max(1, lim.start || 1), b: Math.max(lim.start || 1, lim.end || proj.outFrame) };
  if (lim.mode === "marks") {
    const ms = Object.keys(tvCurrentLayer().marks || {}).map(Number).sort((a, b) => a - b);
    if (ms.length > 1) return { a: ms[0], b: ms[ms.length - 1] };
  }
  return { a: proj.inFrame, b: proj.outFrame };
}

// ---- background / blending / color group popups ----
window.backgroundMenu = function (btn) {
  const r = btn.getBoundingClientRect();
  const set = (v) => { proj.background = v; renderAll(); toast("background: " + v); };
  openTvMenu([
    { label: "None", shortcut: "Shift B", checked: proj.background === "none", action: () => set("none") },
    { label: "Color", shortcut: "Shift B", checked: proj.background === "color", action: () => set("color") },
    { label: "Check", shortcut: "Shift B", checked: proj.background === "check", action: () => set("check") }
  ], r.left, r.top - 70);
};
window.startFrameMenu = function () {
  const el = $("ftStartVal");
  const r = el ? el.getBoundingClientRect() : { left: 250, top: 1000 };
  openTvMenu([
    { label: "0", checked: proj.startFrame === 0, action: () => { proj.startFrame = 0; renderAll(); } },
    { label: "1", checked: proj.startFrame === 1, action: () => { proj.startFrame = 1; renderAll(); } },
    { label: "Custom…", action: () => numDialog("Start Frame", "Start frame", proj.startFrame ?? 1, v => { proj.startFrame = v; renderAll(); }, 0, 99999) }
  ], r.left, r.top - 72);
};
window.blendMenu = function (i, el) {
  const l = proj.layers[i];
  const r = el.getBoundingClientRect();
  openTvMenu(E.BLEND_MODES.map(m => ({
    label: m, checked: (l.blend || "Normal") === m,
    action: () => { tvCommit(() => l.blend = m); toast("blending: " + m); }
  })), r.left - 80, r.bottom + 2);
};
window.groupMenu = function (i, el) {
  ensureGroups();
  const l = proj.layers[i];
  const r = el.getBoundingClientRect();
  const items = proj.groups.map((g, gi) => ({
    label: g.name, sw: g.color, checked: (l.group || 0) === gi,
    action: () => { tvCommit(() => l.group = gi); toast("color group: " + g.name); }
  }));
  items.push({ sep: true });
  items.push({ label: "Edit Groups…", action: () => { togglePane("color"); } });
  openTvMenu(items, r.left, r.top - 220);
};

// ---- footer panes: Notes / Sound / Color Group (captured tabs) ----
let paneOpen = null;
let paneAudio = null;
function syncPaneTabs() {
  [["notes", "ftNotes"], ["sound", "ftSound"], ["color", "ftColor"]].forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("on", paneOpen === k);
  });
}
window.togglePane = function (kind) {
  const old = document.getElementById("tlPane");
  if (old) old.remove();
  if (paneOpen === kind) { paneOpen = null; syncPaneTabs(); return; }
  paneOpen = kind;
  const p = document.createElement("div");
  p.id = "tlPane";
  const title = { notes: "Notes", sound: "Sound", color: "Color Group" }[kind];
  const sub = { notes: "Timeline notes", sound: "Sound track", color: "Groups edition" }[kind];
  p.innerHTML = `<div class="ph"><b>${title}</b><span style="color:#8a8a90">${sub}</span><button id="paneX" title="Close">✕</button></div><div class="pb" id="paneBody"></div>`;
  document.body.appendChild(p);
  p.querySelector("#paneX").onclick = () => togglePane(kind);
  const body = p.querySelector("#paneBody");
  if (kind === "notes") {
    body.innerHTML = `<textarea id="paneNotes" placeholder="Timeline notes">${(proj.notes || "").replace(/</g, "&lt;")}</textarea>
      <div class="prow"><span>Size</span><input type="range" min="1" max="14" value="3">
        <span>Grid</span><input type="range" min="0" max="20" value="0">
        <button class="revbtn" id="paneNotesClear" style="font-size:10px;padding:1px 7px">Clear</button></div>`;
    const ta = body.querySelector("#paneNotes");
    ta.oninput = () => { proj.notes = ta.value; };
    body.querySelector("#paneNotesClear").onclick = () => { proj.notes = ""; ta.value = ""; };
  } else if (kind === "sound") {
    body.innerHTML = `<div class="prow"><button class="revbtn" id="paneSndLoad" style="font-size:10px;padding:1px 7px">Load Sound…</button>
        <span id="paneSndName" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${proj.sound ? proj.sound.name : "No sound loaded"}</span></div>
      <canvas class="sndwave" width="352" height="64"></canvas>
      <div class="prow"><span>Offset</span><input id="paneSndOffset" type="number" value="${proj.sound ? proj.sound.offset || 0 : 0}" style="width:64px"> frames
        <button class="revbtn" id="paneSndPlay" style="font-size:10px;padding:1px 7px">Play</button>
        <button class="revbtn" id="paneSndStop" style="font-size:10px;padding:1px 7px">Stop</button></div>`;
    const drawWave = (peaks) => {
      const cv = body.querySelector("canvas.sndwave"); if (!cv) return;
      const c = cv.getContext("2d");
      c.clearRect(0, 0, cv.width, cv.height);
      c.strokeStyle = "#8fbf8f"; c.lineWidth = 1; c.beginPath();
      const n = peaks.length || 1;
      for (let x = 0; x < cv.width; x++) {
        const i = Math.floor(x / cv.width * n);
        const v = peaks[i] || 0;
        c.moveTo(x + .5, cv.height / 2 - v * cv.height * .45);
        c.lineTo(x + .5, cv.height / 2 + v * cv.height * .45);
      }
      c.stroke();
    };
    if (proj.sound && proj.sound.peaks) drawWave(proj.sound.peaks);
    body.querySelector("#paneSndLoad").onclick = () => {
      const inp = document.createElement("input"); inp.type = "file"; inp.accept = "audio/*";
      inp.onchange = async () => {
        const file = inp.files[0]; if (!file) return;
        try {
          const buf = await file.arrayBuffer();
          const ac = new (window.AudioContext || window.webkitAudioContext)();
          const audio = await ac.decodeAudioData(buf.slice(0));
          const ch = audio.getChannelData(0);
          const N = 352, peaks = new Array(N).fill(0);
          const step = Math.max(1, Math.floor(ch.length / N));
          for (let i = 0; i < N; i++) {
            let m = 0;
            for (let j = i * step; j < Math.min(ch.length, (i + 1) * step); j++) m = Math.max(m, Math.abs(ch[j]));
            peaks[i] = m;
          }
          proj.sound = { name: file.name, duration: audio.duration, offset: 0, peaks };
          body.querySelector("#paneSndName").textContent = file.name;
          drawWave(peaks);
          if (paneAudio) { paneAudio.pause(); paneAudio = null; }
          paneAudio = new Audio(URL.createObjectURL(file));
          try { ac.close(); } catch (e) {}
          toast("sound loaded: " + file.name);
        } catch (err) { toast("cannot decode this audio file"); }
      };
      inp.click();
    };
    body.querySelector("#paneSndOffset").onchange = (e) => {
      if (proj.sound) proj.sound.offset = Math.round(+e.target.value || 0);
    };
    body.querySelector("#paneSndPlay").onclick = () => { if (paneAudio) { paneAudio.currentTime = 0; paneAudio.play(); } else toast("load a sound first"); };
    body.querySelector("#paneSndStop").onclick = () => { if (paneAudio) paneAudio.pause(); };
  } else {
    ensureGroups();
    body.innerHTML = `<div style="color:#898f96">Click a group to assign it to the current layer. Names are editable.</div>
      <div id="paneGroups">${proj.groups.map((g, gi) => `
        <div class="cgrow" data-g="${gi}"><i style="background:${g.color}"></i>
          <span class="nm">${g.name}</span>
          <button class="revbtn" data-use="${gi}" style="font-size:10px;padding:1px 6px">Use</button>
        </div>`).join("")}</div>
      <div class="prow"><button class="revbtn" id="paneGroupReset" style="font-size:10px;padding:1px 7px">Reset</button>
        <span style="color:#898f96">current layer: ${tvCurrentLayer().name}</span></div>`;
    body.querySelectorAll("[data-use]").forEach(b => {
      b.onclick = () => { const gi = +b.dataset.use; tvCommit(() => { tvCurrentLayer().group = gi; }); toast("color group: " + proj.groups[gi].name); };
    });
    body.querySelectorAll(".cgrow").forEach(row => {
      row.ondblclick = () => {
        const gi = +row.dataset.g;
        const nm = row.querySelector(".nm");
        const inp = document.createElement("input");
        inp.value = proj.groups[gi].name;
        inp.style.cssText = "flex:1;background:#26262a;color:#c9c9cf;border:1px solid #4a4a51;border-radius:2px;font-size:11px";
        nm.replaceWith(inp); inp.focus(); inp.select();
        const done = () => { const v = inp.value.trim(); if (v) proj.groups[gi].name = v; togglePane("color"); };
        inp.onkeydown = (e) => { if (e.key === "Enter") done(); if (e.key === "Escape") togglePane("color"); };
        inp.onblur = done;
      };
    });
    body.querySelector("#paneGroupReset").onclick = () => {
      tvCommit(() => proj.groups.forEach((g, gi) => {
        const def = [{ name: "Default", color: "#8f8f95" }, { name: "Dark Blue", color: "#2b3a67" },
          { name: "Dark Green", color: "#2e5b3a" }, { name: "Dark Cyan", color: "#27585b" },
          { name: "Dark Red", color: "#5b2a2a" }, { name: "Purple", color: "#4b2f5e" },
          { name: "Brown", color: "#5e462f" }, { name: "Blue", color: "#3d5a9e" },
          { name: "Green", color: "#3e8a56" }, { name: "Cyan", color: "#3ea0a6" },
          { name: "Red", color: "#b04141" }, { name: "Magenta", color: "#a0418a" },
          { name: "Orange", color: "#c07a3a" }][gi];
        if (def) { g.name = def.name; g.color = def.color; }
      }));
      toast("color groups reset");
    };
  }
  syncPaneTabs();
};

window.gotoFrame = (f, li) => {
  if (li !== undefined) proj.currentLayer = li;
  proj.currentFrame = Math.max(1, f);
  renderAll();
};
function markIn() { proj.inFrame = proj.currentFrame; proj.outFrame = Math.max(proj.outFrame, proj.inFrame); renderAll(); }
function markOut() { proj.outFrame = proj.currentFrame; proj.inFrame = Math.min(proj.inFrame, proj.outFrame); renderAll(); }
window.xop = (op) => {
  const layer = proj.layers[proj.currentLayer];
  hist.pushModel(proj);
  const arg = op === "insert" ? 3 : (op === "hold" ? 2 : null);
  E.xsheetOp(proj, layer, op, proj.currentFrame, arg);
  hist.sealModel(proj); renderAll(); toast("xsheet: " + op);
};
let loop = true, playing = null, soundOn = true;
window.remote = (cmd) => {
  if (cmd === "first") { proj.currentFrame = proj.inFrame; renderAll(); }
  else if (cmd === "prev") gotoFrame(Math.max(1, proj.currentFrame - 1));
  else if (cmd === "next") gotoFrame(proj.currentFrame + 1);
  else if (cmd === "last") { proj.currentFrame = proj.outFrame; renderAll(); }
  else if (cmd === "play") togglePlay();
};
function stepPlay(f) {
  const r = playRange();
  if (f < r.a || f > r.b) {
    if (loop && playing) f = f > r.b ? r.a : r.b;
    else return;
  }
  proj.currentFrame = f; renderAll();
}
window.togglePlay = function () {
  if (playing) {
    stopPlayback();
    return;
  }
  setPlayIcon(true);
  const r = playRange();
  if (proj.currentFrame < r.a || proj.currentFrame > r.b) proj.currentFrame = r.a;
  playing = setInterval(() => {
    let f = proj.currentFrame + 1;
    if (f > r.b) {
      if (loop) f = r.a; else { stopPlayback(); return; }
    }
    proj.currentFrame = f; renderAll();
  }, 1000 / proj.fps);
};
window.toggleLoop = () => {
  loop = !loop;
  if ($("rLoop")) $("rLoop").innerHTML = `<img src="icons/Remote-Loop${loop ? "On" : "Off"}-x20.png">`;
  const t = $("tLoop");
  if (t) t.classList.toggle("ton", loop);
};

// ================= input (stylus-safe; from v3) =================
function toProj(e) {
  const r = art.getBoundingClientRect();
  return { x: (e.clientX - r.left - view.x) / view.zoom,
           y: (e.clientY - r.top - view.y) / view.zoom };
}
let gesturePts = new Map(), gestureBase = null, panBase = null;
function trackGesture(e, phase) {
  if (e.pointerType !== "touch") return false;
  if (phase === "down") gesturePts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  else if (phase === "up") gesturePts.delete(e.pointerId);
  else if (gesturePts.has(e.pointerId)) gesturePts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (gesturePts.size >= 2) {
    const pts = [...gesturePts.values()];
    const mx = (pts[0].x + pts[1].x) / 2, my = (pts[0].y + pts[1].y) / 2;
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    if (!gestureBase) gestureBase = { mx, my, dist, zoom: view.zoom };
    else {
      view.zoom = Math.max(0.05, Math.min(20, gestureBase.zoom * dist / gestureBase.dist));
      view.x = mx - gestureBase.mx * view.zoom / gestureBase.zoom;
      view.y = my - gestureBase.my * view.zoom / gestureBase.zoom;
    }
    renderAll();
    return true;
  }
  return gesturePts.size === 1 && gesturePan(e);
}
function gesturePan(e) {
  if (!panBase) { panBase = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; return true; }
  view.x = panBase.vx + e.clientX - panBase.x;
  view.y = panBase.vy + e.clientY - panBase.y;
  renderAll();
  return true;
}
function isPenEraser(e) {
  return e.pointerType === "pen" && ((e.buttons & 32) || e.button === 5);
}
function pressureOf(e) {
  if (e.pointerType !== "pen" || !proj.brush.pressure) return 1;
  return Math.max(0.05, Math.min(1, e.pressure || 0.5) * 1.25);
}
let savedTool = null;
function endPenFlip() {
  if (penFlip) { penFlip = false; if (savedTool) { selectToolQuiet(savedTool); savedTool = null; } }
}
let drawState = {};
ovl.addEventListener("contextmenu", e => e.preventDefault());
ovl.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") {
    trackGesture(e, "down"); conducting = { mode: "gesture" };
    try { ovl.setPointerCapture(e.pointerId); } catch (err) {}
    return;
  }
  if (activePtr !== null) return;
  if (e.pointerType === "pen" && e.buttons === 0) return;
  try { ovl.setPointerCapture(e.pointerId); } catch (err) {}
  activePtr = e.pointerId;
  const p = toProj(e);
  const layer = proj.layers[proj.currentLayer];
  penFlip = isPenEraser(e);
  if (penFlip) { savedTool = tool; selectToolQuiet("eraser"); }
  const color = e.button === 2 ? proj.bpen : proj.apen;
  const info = SHAPE_INFO[tool];

  if (tool === "panning") { conducting = { mode: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }; return; }
  if (tool === "camera") {
    // drag = move the camera center; a keyframe is created/updated at this frame
    if (!proj.cameraKeys) { proj.cameraKeys = [E.newCameraKey(1, {})]; toast("camera keyframe created"); }
    const cam = E.cameraEvaluate(proj, proj.currentFrame);
    conducting = { mode: "camDrag", ox: cam.x, oy: cam.y, sx: p.x, sy: p.y };
    return;
  }
  if (tool === "zoomrect") { conducting = { mode: "zoom", x0: p.x, y0: p.y, x1: p.x, y1: p.y }; return; }
  if (tool === "pick") {
    const c = E.pickColor(proj, layer, currentKeyOf(layer), p);
    if (c) { (e.button === 2 ? setBpen : setApen)(c); toast("picked " + c); }
    return;
  }
  if (tool === "fill" || tool === "speedfill") {
    doFill(p, color, tool === "speedfill" ? Math.min(96, proj.brush.tolerance + 32) : proj.brush.tolerance);
    return;
  }
  // gradient flood fill (Shape-FloodFill-Gradient01..05): flood the region,
  // drag sets the gradient vector, release fills APen→BPen ramp inside it
  if (GRAD_MODES[tool]) {
    if (layer.locked) { toast("layer is locked"); activePtr = null; return; }
    const key = currentKeyOf(layer);
    const scratch = E.makeSurface(proj.width, proj.height);
    const shim = { frames: { 0: { exposure: 1, canvas: scratch } } };
    const n = E.floodFill(proj, shim, 0, p, "#010203", proj.brush.tolerance);
    if (!n) { toast("nothing to fill"); activePtr = null; return; }
    hist.pushFrame(proj, layer, key);
    conducting = { mode: "fgrad", scratch, seed: p, v: p, key };
    preview = { pts: [p, p], kind: "line" };
    toast("gradient: drag vector then release (" + n + " px region)");
    return;
  }
  if (tool === "textbrush") {
    const txt = prompt("Text:");
    if (!txt) return;
    if (layer.locked) { toast("layer is locked"); activePtr = null; return; }
    const key = currentKeyOf(layer);
    hist.pushFrame(proj, layer, key);
    const c = E.frameSurface(proj, layer, key, true).getContext("2d");
    c.fillStyle = color;
    c.font = `${Math.max(8, proj.brush.size * 4)}px sans-serif`;
    c.fillText(txt, p.x, p.y);
    hist.sealLast(proj, layer, key); renderAll();
    return;
  }
  if (tool === "selclear") { sel = null; renderAll(); return; }
  if (info) {
    if (layer.locked) { toast("layer is locked"); activePtr = null; return; }
    if (info.drag) {
      if (info.drag === "freehand") {
        conducting = { mode: "fshape", color, pts: [p] };
        preview = { pts: [p], kind: tool, fill: true, poly: true };
      } else {
        shapePts = [p];
        conducting = { mode: "shapeDrag", color };
        preview = { pts: [p, p], kind: tool, fill: info.fill };
      }
    } else {
      shapePts.push(p);
      preview = { pts: shapePts.slice(), kind: tool, fill: info.fill };
      if (shapePts.length >= info.click) commitShapePts(color, info);
    }
    renderAll();
    return;
  }
  if (tool === "dot" || tool === "dotsingle") {
    if (layer.locked) { toast("layer is locked"); activePtr = null; return; }
    const key = currentKeyOf(layer);
    hist.pushFrame(proj, layer, key);
    stampDotNow(p, color);
    conducting = { mode: "dots", color, last: p };
    renderAll();
    return;
  }
  if (["selrect", "selfreehand", "transform"].includes(tool)) {
    if (sel && p.x >= sel.x + sel.dx && p.x <= sel.x + sel.dx + sel.w &&
        p.y >= sel.y + sel.dy && p.y <= sel.y + sel.dy + sel.h) {
      conducting = { mode: "move", ox: p.x - sel.dx, oy: p.y - sel.dy };
    } else if (tool === "selfreehand") {
      conducting = { mode: "lasso", pts: [p] };
      preview = { pts: [p], kind: "freehand", poly: true };
    } else {
      if (sel) applySelection();
      conducting = { mode: "marquee", x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    }
    return;
  }
  if (["cutrect", "cutfreehand"].includes(tool)) {
    if (sel) applySelection();
    if (tool === "cutrect") conducting = { mode: "marquee", x0: p.x, y0: p.y, x1: p.x, y1: p.y, cut: true };
    else { conducting = { mode: "lasso", pts: [p], cut: true }; preview = { pts: [p], kind: "freehand", poly: true }; }
    return;
  }
  // brushes
  if (layer.locked) { toast("layer is locked"); activePtr = null; return; }
  const key = currentKeyOf(layer);
  hist.pushFrame(proj, layer, key);
  conducting = { mode: "stroke", color, freehand: false };
  E.strokeBegin(drawState, proj, layer, key, p, pressureOf(e), color);
  // TVPaint-paint-live: freeze the current screen as the under-stroke base; the
  // growing scratch buffer composites over it on every move (liveStrokePaint).
  strokeBase = E.makeSurface(art.width, art.height);
  strokeBase.getContext("2d").drawImage(art, 0, 0);
});
let lastStamp = null;
function stampDotNow(p, color) {
  const layer = proj.layers[proj.currentLayer];
  const c = E.frameSurface(proj, layer, currentKeyOf(layer), true).getContext("2d");
  E.brushStamp(c, proj.brush, color, p.x, p.y, 1, proj);
}
ovl.addEventListener("pointermove", (e) => {
  if (conducting?.mode === "gesture") { trackGesture(e, "move"); return; }
  hoverStatus(e);
  if (e.pointerId !== activePtr && !conducting) return;
  const p = toProj(e);
  if (!conducting) return;
  if (conducting.mode === "pan") {
    view.x = conducting.vx + e.clientX - conducting.sx;
    view.y = conducting.vy + e.clientY - conducting.sy;
    return fastRenderAll();
  }
  if (conducting.mode === "stroke") {
    const evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    (evs.length ? evs : [e]).forEach(ev => {
      const pt = toProj(ev);
      if (tool === "custombrush" && cutBrush) stampCutBrush(pt);
      else E.strokeMove(drawState, pt, pressureOf(ev));
    });
    // live painting: the scratch buffer composites over the pre-stroke base
    return drawState.scratch ? liveStrokePaint() : fastRenderAll();
  }
  if (conducting.mode === "dots") {
    const step = Math.max(4, proj.brush.size * 0.8);
    if (tool === "dot" && Math.hypot(p.x - conducting.last.x, p.y - conducting.last.y) >= step) {
      stampDotNow(p, conducting.color); conducting.last = p;
    }
    return fastRenderAll();
  }
  if (conducting.mode === "fshape") {
    conducting.pts.push(p);
    preview = { pts: conducting.pts, kind: tool, fill: true, poly: true };
    return renderOverlayOnly();
  }
  if (conducting.mode === "camDrag") {
    E.setCameraKey(proj, proj.currentFrame,
      { x: conducting.ox + (p.x - conducting.sx), y: conducting.oy + (p.y - conducting.sy) });
    return renderOverlayOnly();
  }
  if (conducting.mode === "fgrad") {
    conducting.v = p;
    preview = { pts: [conducting.seed, p], kind: "line" };
    return renderOverlayOnly();
  }
  if (conducting.mode === "shapeDrag") { preview.pts = [shapePts[0], p]; return renderOverlayOnly(); }
  if (conducting.mode === "lasso") {
    conducting.pts.push(p);
    preview = { pts: conducting.pts, kind: "freehand", poly: true };
    return renderOverlayOnly();
  }
  if (conducting.mode === "marquee" || ((conducting.mode === "zoom"))) {
    conducting.x1 = p.x; conducting.y1 = p.y;
    octx.setTransform(1, 0, 0, 1, view.x, view.y); octx.scale(view.zoom, view.zoom);
    octx.clearRect(-view.x / view.zoom, -view.y / view.zoom, ovl.width / view.zoom, ovl.height / view.zoom);
    drawGuidelines();
    octx.strokeStyle = conducting.mode === "zoom" ? "#6fa8c9" : "#ffd24a";
    octx.lineWidth = 1 / view.zoom;
    octx.setLineDash(conducting.mode === "zoom" ? [] : [4 / view.zoom, 3 / view.zoom]);
    octx.strokeRect(Math.min(conducting.x0, conducting.x1), Math.min(conducting.y0, conducting.y1),
      Math.abs(conducting.x1 - conducting.x0), Math.abs(conducting.y1 - conducting.y0));
    octx.setLineDash([]);
    return;
  }
  if (conducting.mode === "move") {
    sel.dx = p.x - conducting.ox; sel.dy = p.y - conducting.oy;
    return renderOverlayOnly();
  }
});
function hoverStatus(e) {
  const p = toProj(e);
  $("statusXY").textContent = `X:${Math.round(p.x)} Y:${Math.round(p.y)}`;
  updateRGBA(p);
}
let lastRgba = 0;
function updateRGBA(p) {
  const now = performance.now();
  if (now - lastRgba < 60) return;
  lastRgba = now;
  const lbl = $("rgbaLbl");
  if (!lbl) return;
  const x = p.x | 0, y = p.y | 0;
  if (x < 0 || y < 0 || x >= proj.width || y >= proj.height) { lbl.textContent = "R:000 G:000 B:000 A:000"; return; }
  try {
    const layer = proj.layers[proj.currentLayer];
    const k = E.effectiveFrameKey(layer, proj.currentFrame);
    const surf = k !== null ? layer.frames[k].canvas : null;
    if (!surf || !surf.getContext) { lbl.textContent = "R:255 G:255 B:255 A:255"; return; }
    const d = surf.getContext("2d").getImageData(x, y, 1, 1).data;
    const f = n => String(n).padStart(3, "0");
    lbl.textContent = `R:${f(d[0])} G:${f(d[1])} B:${f(d[2])} A:${f(d[3])}`;
  } catch (err) { /* tainted canvas — ignore */ }
}
ovl.addEventListener("pointerup", (e) => {
  const c = conducting;
  if (conducting?.mode === "gesture") { trackGesture(e, "up"); conducting = null; gestureBase = null; return; }
  if (!c && activePtr === null) return;
  if (e.pointerId !== activePtr && activePtr !== null) return;
  try { ovl.releasePointerCapture(e.pointerId); } catch (err) {}
  activePtr = null;
  if (!c) { endPenFlip(); return; }
  const p = toProj(e);
  const layer = proj.layers[proj.currentLayer];
  if (c.mode === "stroke" || c.mode === "dots") {
    if (c.mode === "stroke") E.strokeEnd(drawState);
    hist.sealLast(proj, layer, currentKeyOf(layer));
  } else if (c.mode === "shapeDrag") {
    shapePts = [shapePts[0], preview.pts[1]];
    commitShapePts(c.color, SHAPE_INFO[tool]);
  } else if (c.mode === "fshape") {
    shapePts = c.pts.slice();
    commitShapePts(c.color, SHAPE_INFO[tool]);
  } else if (c.mode === "lasso") {
    if (c.cut) captureLassoBrush(c.pts); else createSelectionPoly(c.pts);
    preview = null;
  } else if (c.mode === "fgrad") {
    // gradient flood: composite the ramp masked by the flooded region
    const grad = E.makeSurface(proj.width, proj.height);
    const g = grad.getContext("2d");
    g.drawImage(c.scratch, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = E.gradientFill(g, GRAD_MODES[tool], c.seed.x, c.seed.y, p.x, p.y, proj.apen, proj.bpen);
    g.fillRect(0, 0, proj.width, proj.height);
    const fc = E.frameSurface(proj, layer, c.key, true).getContext("2d");
    fc.save();
    fc.globalAlpha = proj.brush.opacity;
    fc.drawImage(grad, 0, 0);
    fc.restore();
    hist.sealLast(proj, layer, c.key);
  } else if (c.mode === "marquee") {
    const x = Math.min(c.x0, c.x1), y = Math.min(c.y0, c.y1);
    const w = Math.abs(c.x1 - c.x0), h = Math.abs(c.y1 - c.y0);
    if (!c.cut && !c.zoom && w > 2 && h > 2) createSelectionRect(x, y, w, h);
    if (c.cut && w > 2 && h > 2) captureBrushRect(x, y, w, h);
  } else if (c.mode === "zoom") {
    const x = Math.min(c.x0, c.x1), y = Math.min(c.y0, c.y1);
    const w = Math.abs(c.x1 - c.x0), h = Math.abs(c.y1 - c.y0);
    if (w > 2 && h > 2) zoomToRect(x, y, w, h);
  }
  conducting = null; preview = null; strokeBase = null; endPenFlip(); renderAll();
});
ovl.addEventListener("pointercancel", (e) => {
  if (drawState.ctx) {
    E.strokeEnd(drawState);
    try { hist.sealLast(proj, proj.layers[proj.currentLayer], currentKeyOf(proj.layers[proj.currentLayer])); } catch (err) {}
  }
  conducting = null; activePtr = null; preview = null; strokeBase = null; renderAll();
});

// ================= files / recent =================
const RECENT_KEY = "my_v2_recent";
function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; }
}
function pushRecent(name, data) {
  let list = loadRecent().filter(e => e.name !== name);
  list.unshift({ name, ts: Date.now(), data });
  while (list.length > 8) list.pop();
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) {}
}
window.uiClearRecent = () => { try { localStorage.removeItem(RECENT_KEY); } catch (e) {} };
window.uiSave = function () {
  const data = E.serializeProject(proj);
  pushRecent(proj.name, data);
  toast("saved: " + proj.name);
  renderTimelineStatus();
};
window.uiSaveAs = function () {
  const name = prompt("Save Project As:", proj.name);
  if (!name) return;
  proj.name = name.endsWith(".myproj") ? name : name + ".myproj";
  const data = E.serializeProject(proj);
  pushRecent(proj.name, data);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  a.download = proj.name; a.click();
  toast("saved as: " + proj.name);
  renderTimelineStatus();
};
window.uiOpen = function () {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = ".myproj,application/json";
  inp.onchange = () => {
    const file = inp.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        openProjectData(rd.result);
        proj.name = file.name; pushRecent(proj.name, rd.result);
        toast("opened " + file.name);
      } catch (e) { toast("open failed: " + e.message); }
    };
    rd.readAsText(file);
  };
  inp.click();
};
function openProjectData(json) {
  sel = null;
  proj = E.deserializeProject(json, restoreFns);
  ghostTmp = E.makeSurface(proj.width, proj.height);
  fitView(); syncToolPanel(); renderAll();
}
window.uiOpenRecent = (name) => {
  if (!name) return;
  const e = loadRecent().find(x => x.name === name);
  if (!e) return;
  try { openProjectData(e.data); proj.name = name; toast("opened recent: " + name); }
  catch (err) { toast("recent load failed: " + err.message); }
};
window.uiNew = function () {
  if (!confirm("Discard current project and start a new one?")) return;
  proj = E.newProject(512, 512, 24);
  ghostTmp = E.makeSurface(proj.width, proj.height);
  sel = null; fitView(); syncToolPanel(); renderAll();
  toast("new project");
};

// ================= exports =================
window.exportFrame = function () {
  const out = E.makeSurface(proj.width, proj.height);
  const c = out.getContext("2d");
  c.fillStyle = "#ffffff"; c.fillRect(0, 0, proj.width, proj.height);
  proj.layers.forEach(l => {
    if (!l.visible) return;
    const k = E.effectiveFrameKey(l, proj.currentFrame);
    const surf = k !== null ? l.frames[k].canvas : null;
    if (surf && surf.getContext) { c.globalAlpha = l.opacity; c.drawImage(surf, 0, 0); c.globalAlpha = 1; }
  });
  const a = document.createElement("a");
  a.href = out.toDataURL("image/png");
  a.download = `frame_${String(proj.currentFrame).padStart(4, "0")}.png`;
  a.click();
  toast("exported " + a.download);
};
window.exportSequence = function () {
  const span = proj.outFrame - proj.inFrame + 1;
  if (span > 30 && !confirm(`Export ${span} files?`)) return;
  const f0 = proj.currentFrame;
  let i = proj.inFrame;
  const step = () => {
    if (i > proj.outFrame) { proj.currentFrame = f0; renderAll(); toast("sequence exported"); return; }
    proj.currentFrame = i;
    const out = E.makeSurface(proj.width, proj.height);
    const c = out.getContext("2d");
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, proj.width, proj.height);
    proj.layers.forEach(l => {
      if (!l.visible) return;
      const k = E.effectiveFrameKey(l, i);
      const surf = k !== null ? l.frames[k].canvas : null;
      if (surf && surf.getContext) { c.globalAlpha = l.opacity; c.drawImage(surf, 0, 0); c.globalAlpha = 1; }
    });
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = `seq_f${String(i).padStart(4, "0")}.png`;
    a.click();
    i++; setTimeout(step, 250);
  };
  step();
};

// ================= toggles =================
window.toggleOnion = function () {
  proj.onion.enabled = !proj.onion.enabled;
  const b = $("tbOnion"); if (b) b.classList.toggle("on", proj.onion.enabled);
  renderAll();
};
function cycleGuides() {
  const g = proj.guidelines;
  if (!g.grid && !g.safeArea) g.grid = true;
  else if (g.grid && !g.safeArea) g.safeArea = true;
  else if (g.grid && g.safeArea) g.grid = false;
  else g.safeArea = false;
  window.toggleGuide("grid", g.grid);
  window.toggleGuide("safeArea", g.safeArea);
}
window.cycleGuides = cycleGuides;
window.toggleGuide = (g, v) => { proj.guidelines[g] = v; renderAll(); };

// ================= undo =================
window.uiUndo = () => { if (sel) applySelection(); hist.undo(proj, restoreFns); renderAll(); };
window.uiRedo = () => { hist.redo(proj, restoreFns); renderAll(); };

// ================= George =================
window.georgeRun = function (lineIn) {
  const out = $("georgeOut");
  if (!out) return;
  try {
    const m = lineIn.match(/^(tv_[a-z0-9_]+)\s*(.*)$/);
    if (!m) throw new Error("unknown command (expect tv_*)");
    const fn = E.George[m[1]];
    if (!fn) throw new Error("not implemented: " + m[1]);
    const args = (m[2].match(/-?\d+(?:\.\d+)?|#[0-9a-fA-F]{6}|"[^"]*"|\S+/g) || [])
      .map(s => s.replace(/^"|"$/g, ""));
    const res = fn(proj, ...args);
    out.textContent = "> " + lineIn + " → " + res;
    out.title = (out.title + "\n" + "> " + lineIn + "\n" + res).split("\n").slice(-20).join("\n");
    syncToolPanel(); renderAll();
  } catch (e) {
    out.textContent = "> " + lineIn + " → ERROR: " + e.message;
    out.title = (out.title + "\nERROR: " + e.message).split("\n").slice(-20).join("\n");
  }
};

// ================= timeline transport (two-line Mark In/Out + TVPaint remote row) =================
function buildTransport() {
  const T = $("tlTransport");
  if (!T) return;
  T.innerHTML = `
    <div class="tr-spacer"></div>
    <div class="tr-mark left">
      <div class="lbl"><span class="mk">◉</span>Mark In</div>
      <input id="tMarkIn" type="number" min="1">
    </div>
    <div class="tr-center">
      <div class="tr-scroll"><div id="tsThumb"></div></div>
      <div id="ovBar"><div id="ovFill"></div><div id="ovCur"></div><div id="ovIn"></div><div id="ovOut"></div></div>
      <div class="tr-btns">
        <button class="tib" id="rSound" title="Sound"><img src="icons/Remote-SoundOn-x20.png"></button>
        <button class="tib" id="rLoop" title="Loop"><img src="icons/Remote-Loop${loop ? "On" : "Off"}-x20.png"></button>
        <button class="tib" id="rPlayClip" title="Play Clip"><img src="icons/Remote-Play-Clip-x20.png"></button>
        <span class="fpswrap"><select id="fpsSel" class="fps">
          ${[12, 24, 25, 30, 50, 60].map(f => `<option ${f === 24 ? "selected" : ""}>${f} fps</option>`).join("")}
        </select><span class="fpsarrow">▾</span></span>
        <span class="tr-hand" title="Interactive zoom ratio">
          <button class="arw" id="rZoomOut" title="Zoom out">◀</button>
          <button class="tib" id="rHand" title="Hand — fit the drawing to the view"><img src="icons/Zoom-Hand-x20.png"></button>
          <button class="arw" id="rZoomIn" title="Zoom in">▶</button>
        </span>
        <button class="tib" id="rPlay" title="Play/Stop (Space)"><img src="icons/Remote-PlaySmall-x20.png"></button>
        <button class="tib" id="rStop" title="Stop"><img src="icons/Remote-Stop-x20.png"></button>
        <button class="tib" id="rFirst" title="First image"><img src="icons/Remote-Goto-FirstImage-x20.png"></button>
        <button class="tib" id="rLast" title="Last image"><img src="icons/Remote-Goto-LastImage-x20.png"></button>
        <button class="tib" id="rPrevInst" title="Previous instance"><img src="icons/Remote-Goto-PreviousInstance-x20.png"></button>
        <button class="tib" id="rNextInst" title="Next instance"><img src="icons/Remote-Goto-NextInstance-x20.png"></button>
        <button class="tib" id="rPrev" title="Previous image"><img src="icons/Remote-Goto-PreviousImage-x20.png"></button>
        <button class="tib" id="rNext" title="Next image"><img src="icons/Remote-Goto-NextImage-x20.png"></button>
        <button class="tib" id="rPin" title="Recenter timeline"><img src="icons/Remote-Recenter-Timeline-x20.png"></button>
        <button class="tib" id="rResize" title="Drag up/down to resize the timeline"><img src="icons/Timeline-Resize-x20.png"></button>
      </div>
    </div>
    <div class="tr-mark right">
      <div class="lbl">Mark Out<span class="mk">◉</span></div>
      <input id="tMarkOut" type="number" min="1">
    </div>`;
  $("rFirst").onclick = () => remote("first");
  $("rLast").onclick = () => remote("last");
  $("rPrev").onclick = () => remote("prev");
  $("rNext").onclick = () => remote("next");
  // previous / next *instance* = previous / next drawing of the current layer
  $("rPrevInst").onclick = () => {
    const keys = Object.keys(proj.layers[proj.currentLayer].frames).map(Number).sort((a, b) => a - b);
    const prev = keys.filter(k => k < proj.currentFrame).pop();
    if (prev) gotoFrame(prev);
  };
  $("rNextInst").onclick = () => {
    const keys = Object.keys(proj.layers[proj.currentLayer].frames).map(Number).sort((a, b) => a - b);
    const next = keys.find(k => k > proj.currentFrame);
    if (next) gotoFrame(next);
  };
  $("rPlay").onclick = () => togglePlay();
  $("rPlayClip").onclick = () => togglePlay();
  $("rZoomOut").onclick = () => { view.zoom = Math.max(0.05, view.zoom / 1.2); renderArtOnly(); updateZoomLbl(); };
  $("rZoomIn").onclick = () => { view.zoom = Math.min(20, view.zoom * 1.2); renderArtOnly(); updateZoomLbl(); };
  $("rHand").onclick = () => { fitView(); toast("fit to view"); };
  $("rStop").onclick = () => stopPlayback();
  $("rLoop").onclick = () => toggleLoop();
  $("rPin").onclick = () => {
    const tr = $("tlTrack");
    if (tr) tr.scrollLeft = Math.max(0, (proj.currentFrame - 1) * CW - tr.clientWidth / 2 + CW);
  };
  $("rResize").onpointerdown = (e) => startTlResize(e);
  const thumb = $("tsThumb");
  if (thumb) thumb.onpointerdown = (e) => startTlScroll(e);
  $("rSound").onclick = () => {
    soundOn = !soundOn;
    $("rSound").innerHTML = `<img src="icons/Remote-Sound${soundOn ? "On" : "Off"}-x20.png">`;
  };
  $("fpsSel").onchange = (e) => { proj.fps = parseInt(e.target.value) || 24; renderTimeline(); renderTimelineStatus(); };
  $("tMarkIn").onchange = (e) => { proj.inFrame = Math.max(1, +e.target.value || 1); renderAll(); };
  $("tMarkOut").onchange = (e) => { proj.outFrame = Math.max(proj.inFrame, +e.target.value || 25); renderAll(); };
  window.syncFpsSel = () => {   // keep the fps select in sync (Modify Project / New Project)
    const s = $("fpsSel");
    if (!s) return;
    const want = proj.fps + " fps";
    if (![...s.options].some(o => o.textContent === want))
      s.add(new Option(want, want, true, true));
    s.value = want;
  };
  syncFpsSel();
  syncTransport();
}
function stopPlayback() {
  if (playing) { clearInterval(playing); playing = null; setPlayIcon(false); }
}
function setPlayIcon(on) {
  if ($("rPlay")) $("rPlay").innerHTML = `<img src="icons/Remote-${on ? "Pause" : "PlaySmall"}-x20.png">`;
  const t = $("tPlay");
  if (t) { t.textContent = on ? "⏸" : "▶"; t.classList.toggle("ton", on); }
}
function syncTransport() {
  const mi = $('tMarkIn'), mo = $('tMarkOut'), fps = $('fpsSel'), z = $('zoomLbl');
  if (mi && document.activeElement !== mi) mi.value = proj.inFrame;
  if (mo && document.activeElement !== mo) mo.value = proj.outFrame;
  if (fps && document.activeElement !== fps) fps.value = proj.fps + ' fps';
  if (z) z.textContent = (view.zoom * 100).toFixed(2) + '%';
}
// ================= status bar (TVPaint: coords / RGBA / proxy / project info / room) =================
function buildStatusbar() {
  $("statusbar").innerHTML =
    `<span id="statusXY">X:0 Y:0</span>
     <span id="rgbaLbl">R:000 G:000 B:000 A:000</span>
     <span id="proxyLbl">Proxy: 100%</span>
     <span id="sbInfo"></span>
     <span class="right">
       <span id="zoomLbl2" style="display:none"></span>
       <select id="roomSel" title="workspace room">
         <option>⌂ Room 1</option><option>Room 2</option><option>Room 3</option><option>Room 4</option></select>
     </span>`;
  const room = $("roomSel");
  if (room) room.onchange = (e) => toast(e.target.value + " — rooms are not in this prototype");
  buildGeorgeWin();
  renderTimelineStatus();
}
function buildGeorgeWin() {
  if ($("georgeWin")) return;
  const d = document.createElement("div");
  d.id = "georgeWin";
  d.innerHTML = `<div class="gw-head">George console
      <button onclick="document.getElementById('georgeWin').style.display='none'">✕</button></div>
    <div id="georgeOut"></div>
    <input id="georgeIn" placeholder="tv_pen penbrush"
      onkeydown="if(event.key==='Enter'){georgeRun(this.value);this.value=''}">`;
  document.body.appendChild(d);
}

// ================= keyboard / wheel =================
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement.tagName;
  if (/INPUT|TEXTAREA|SELECT/.test(tag) && e.key !== "Enter") return;
  if (e.ctrlKey && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? uiRedo() : uiUndo(); return; }
  if (e.ctrlKey && e.key.toLowerCase() === "y") { e.preventDefault(); uiRedo(); return; }
  if (e.ctrlKey && e.key.toLowerCase() === "s") { e.preventDefault(); e.shiftKey ? uiSaveAs() : uiSave(); return; }
  if (e.ctrlKey && e.key.toLowerCase() === "a") {
    e.preventDefault();
    proj.inFrame = 1;
    proj.outFrame = Math.max(proj.outFrame, ...proj.layers.map(x => E.layerEnd(x) || 1));
    renderAll(); toast("all images selected"); return;
  }
  if (e.ctrlKey && e.key.toLowerCase() === "c") { e.preventDefault(); cellOp("copy", proj.currentLayer, proj.currentFrame); return; }
  if (e.ctrlKey && e.key.toLowerCase() === "x") { e.preventDefault(); cellOp("cut", proj.currentLayer, proj.currentFrame); return; }
  if (e.ctrlKey && e.key.toLowerCase() === "v") {
    e.preventDefault();
    if (e.shiftKey) pasteLayerClip(); else pasteImageClip();
    return;
  }
  if (e.shiftKey && e.key === "F5") { e.preventDefault(); cellOp("delete-project", proj.currentLayer, proj.currentFrame); return; }
  switch (e.key) {
    case " ": e.preventDefault(); togglePlay(); break;
    case "ArrowLeft": gotoFrame(Math.max(1, proj.currentFrame - 1)); break;
    case "ArrowRight": gotoFrame(proj.currentFrame + 1); break;
    case "ArrowUp": pickLayer(Math.max(0, proj.currentLayer - 1)); break;
    case "ArrowDown": pickLayer(Math.min(proj.layers.length - 1, proj.currentLayer + 1)); break;
    case "Home": gotoFrame(1); break;
    case "End": gotoFrame(Math.max(1, proj.outFrame)); break;
    case "Insert": {
      tvCommit(() => E.insertImages(proj.layers[proj.currentLayer], proj.currentFrame, 1, "after"));
      toast("image inserted"); break;
    }
    case "+": case "=": {
      const l = proj.layers[proj.currentLayer];
      const k = E.effectiveFrameKey(l, proj.currentFrame);
      if (k != null) { const cur = l.frames[k].exposure || 1; tvCommit(() => E.setExposureValue(l, k, cur + 1)); }
      break;
    }
    case "-": {
      const l = proj.layers[proj.currentLayer];
      const k = E.effectiveFrameKey(l, proj.currentFrame);
      if (k != null) { const cur = l.frames[k].exposure || 1; tvCommit(() => E.setExposureValue(l, k, cur - 1)); }
      break;
    }
    case "Enter": if (sel) applySelection(); break;
    case "Escape": if (sel) { sel = null; renderAll(); } else if (cutBrush) { clearBin(); selectToolQuiet("penbrush"); } break;
    case "Delete": case "Backspace":
      if (sel) { sel = null; renderAll(); toast("selection discarded"); }
      else cellOp("delete-layer", proj.currentLayer, proj.currentFrame);
      break;
  }
});
window.addEventListener("wheel", (e) => {
  if (e.target !== ovl) return;
  e.preventDefault();
  const r = art.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  const z0 = view.zoom;
  view.zoom = Math.max(0.05, Math.min(20, view.zoom * (e.deltaY < 0 ? 1.12 : 0.89)));
  view.x = mx - (mx - view.x) * view.zoom / z0;
  view.y = my - (my - view.y) * view.zoom / z0;
  renderAll();
}, { passive: false });
window.addEventListener("resize", () => renderAll());

// ================= boot =================
boot();
function boot() {
  buildMenubar();
  buildToolbar();
  buildPanels();
  buildCameraPanel();
  buildTlTabs();
  buildVbRow();
  buildTransport();
  buildStatusbar();
  syncToolPanel();
  fitView();
  toast("left = APen · right = BPen · touch pans, never paints · flip pen = eraser");
}

window.__dbg = {
  get proj() { return proj; },
  get hist() { return hist; },
  get camView() { return camView; },
  get view() { return view; },
  renderAll, selectTool, applySelection,
  get selection() { return sel; },
  get cutBrush() { return cutBrush; }
};
