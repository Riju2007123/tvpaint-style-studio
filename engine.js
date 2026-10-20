/* engine.js — drawing engine core (pure-ish; shared with Node tests)
   Rebuilt from REA evidence of TVPaint Animation 12 Pro (see ../SPEC.md):
   tool names, draw modes, layer flags and XSheet operations all come from
   strings/RTTI observed in the binary. No original code copied. */
"use strict";

// ---------- constants from REA ----------
const BRUSHES = ["penbrush", "mechanicalpencil", "pencilbrush", "airbrush",
  "oilbrush", "chalkbrush", "wetbrush", "specialbrush", "eraser"];
// draw-mode vocabulary observed: erase, alpha, behind, tint, impress,
// colorsmear, mixer, replace, force, backup, action, clear, fade, blur...
const DRAW_MODES = ["normal", "behind", "erase", "alpha", "tint", "multiply",
  "screen", "overlay", "impress", "fade"];
const SHAPES = ["freehand", "line", "rectangle", "ellipse", "circlec",
  "circle2pts", "circle3pts", "bezier", "bspline", "spline3pts"];
const LAYER_LOOP_MODES = ["none", "holdbefore", "holdafter", "repeatbefore",
  "repeatafter", "pingpong"];
const XSHEET_OPS = ["add", "duplicate", "remove", "insert", "hold", "unhold",
  "reverse", "shuffle", "empty"];

function uid() { return Math.random().toString(36).slice(2, 10); }

// ---------- model ----------
function newFrame() { return { exposure: 1, canvas: null, id: uid(), name: null, role: null }; }

function newLayer(name) {
  return {
    id: uid(), name: name || "Layer 1",
    visible: true, active: true, locked: false,
    opacity: 1,
    preserveTransparency: false,
    stencil: "off",                    // off | positive | negative (REA)
    loop: "none",                      // LAYER_LOOP_MODES (REA)
    lighttable: false,
    blend: "Normal",                   // layer blending mode (26318/28002 family)
    group: 0,                          // colour group (REA 60300..60312)
    role: null,                        // image role marker (REA 12104150..)
    marks: {},                         // image marks (REA 28471..28484)
    repeatMode: "Loop",                // Repeat Images submenu (REA 28670..)
    repeatValue: 2,
    // live TVPaint layer toggles (tooltips: "Toggle auto break instance." /
    // "Toggle auto create frame."); both are ON by default in the demo.
    autoBreak: true,
    autoCreate: true,
    deleteMode: "stay",                 // Delete from Layer submenu mark
    emptyEnd: 0,                       // keep-empty delete can preserve a trailing gap
    collapsed: false,
    type: "anim",                      // anim | background | ctg | folder | puppet
    frames: { 1: newFrame() }
  };
}

function newProject(w, h, fps) {
  const p = {
    width: w || 512, height: h || 512, fps: fps || 24,
    inFrame: 1, outFrame: 24, currentFrame: 1,
    layers: [newLayer("Layer 1")],
    currentLayer: 0,
    antiAlias: "high",   // REA: antiAliasing None | Medium | High | Highest
    smoothing: 0,          // LineSmoothing stabilizer 0..10
    onion: { enabled: true, before: 1, after: 1, tintBefore: "#4aa3ff", tintAfter: "#ff5a5a" },
    guidelines: { grid: false, safeArea: false, thirds: false, fieldChart: false },
    brush: null,                           // set from the pen profile below (REA: per-tool defaults)
    toolStates: {},                        // per-tool settings, TVPaint-style (each tool keeps its own params)
    apen: "#000000", bpen: "#ffffff",
    name: "untitled.myproj",
    // timeline footer / production state (observed live + REA loc strings)
    background: "color",                    // none | color | check (25300..25302)
    bgA: "#ffffff", bgB: "#cfcfcf",
    startFrame: 1,
    notes: "",
    sound: null,                           // { name, duration, offset }
    groups: [
      { name: "Default", color: "#8f8f95" }, { name: "Dark Blue", color: "#2b3a67" },
      { name: "Dark Green", color: "#2e5b3a" }, { name: "Dark Cyan", color: "#27585b" },
      { name: "Dark Red", color: "#5b2a2a" }, { name: "Purple", color: "#4b2f5e" },
      { name: "Brown", color: "#5e462f" }, { name: "Blue", color: "#3d5a9e" },
      { name: "Green", color: "#3e8a56" }, { name: "Cyan", color: "#3ea0a6" },
      { name: "Red", color: "#b04141" }, { name: "Magenta", color: "#a0418a" },
      { name: "Orange", color: "#c07a3a" }
    ],
    showRoles: false, roleLayerOnly: false,
    timelineTC: false,
    // canvas display options (live TVPaint 12 "Display" popup defaults, read
    // from the live popup: Stencil off, Paper off, Selection on,
    // Animator Disk on, Camera on, Follow Camera off, Timeline Notes off)
    showStencil: false, showPaper: false, showSelection: true,
    showAnimatorDisk: true, showCamera: true, followCamera: false,
    showTimelineNotes: false, showReticule: false, layerAttenuation: false,
    loopLimits: { mode: "mark", start: 1, end: null },
    selectedLayers: [0]
  };
  p.brush = activateToolBrush(p, "penbrush");   // REA: penbrush profile defaults
  return p;
}

// REA evidence: each TVPaint brush shows its own option set; defaults observed per tool family
const BRUSH_PROFILES = {
  penbrush:          { size: 4.5, power: 1.0, opacity: 1.0, hardness: 0.85, grain: 0,    drying: 0, pressure: true },
  pencilbrush:       { size: 4.5, power: 0.85, opacity: 1.0, hardness: 0.6,  grain: 0.35, drying: 0, pressure: true },
  mechanicalpencil:  { size: 2.5, power: 0.9,  opacity: 1.0, hardness: 0.9,  grain: 0.05, drying: 0, pressure: true },
  oilbrush:          { size: 12,  power: 0.5,  opacity: 1.0, hardness: 0.7,  grain: 0.15, drying: 5, pressure: true },
  wetbrush:          { size: 10,  power: 0.4,  opacity: 1.0, hardness: 0.6,  grain: 0,    drying: 3, pressure: true },
  airbrush:          { size: 20,  power: 0.12, opacity: 1.0, hardness: 0.1,  grain: 0,    drying: 0, pressure: false },
  chalkbrush:        { size: 8,   power: 0.35, opacity: 1.0, hardness: 0.5,  grain: 0.7,  drying: 0, pressure: true },
  specialbrush:      { size: 8,   power: 0.6,  opacity: 1.0, hardness: 0.6,  grain: 0.2,  drying: 0, pressure: true },
  textbrush:         { size: 6,   power: 1.0,  opacity: 1.0, hardness: 0.8,  grain: 0,    drying: 0, pressure: false },
  custombrush:       { size: 40,  power: 1.0,  opacity: 1.0, hardness: 0.8,  grain: 0,    drying: 0, pressure: true },
  eraser:            { size: 10,  power: 1.0,  opacity: 1.0, hardness: 0.9,  grain: 0,    drying: 0, pressure: true }
};
function brushDefaults(kind) {
  return Object.assign({ size: 6, power: 1, opacity: 1, hardness: 0.8, grain: 0,
    drying: 0, radius: 1, drawMode: "normal", pressure: true, tolerance: 32 }, BRUSH_PROFILES[kind] || {});
}
function activateToolBrush(proj, kind) {
  // REA: each tool keeps its own options — persist the outgoing tool's live
  // settings into its slot before loading the target's (save-then-load).
  const curKind = proj.brush && proj.brush.kind;
  if (curKind && curKind !== kind) {
    if (!proj.toolStates[curKind]) proj.toolStates[curKind] = brushDefaults(curKind);
    Object.assign(proj.toolStates[curKind], proj.brush);
    delete proj.toolStates[curKind].kind;
  }
  const s = proj.toolStates[kind] || (proj.toolStates[kind] = Object.assign({}, brushDefaults(kind)));
  delete s.kind;
  proj.brush = Object.assign({ kind }, s);
  return proj.brush;
}

// ---------- frame storage (offscreen canvas in browser; plain object in node) ----------
function makeSurface(w, h) {
  if (typeof document !== "undefined") {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c;
  }
  // node/test stub
  return { width: w, height: h, _pixels: null, isTestSurface: true };
}
// ---------- Modify Project: resize the drawing area AND every stored image
// (TVPaint scales the existing image contents proportionally into the new format) ----------
function resizeProject(proj, w, h) {
  const nw = Math.max(16, Math.round(w)), nh = Math.max(16, Math.round(h));
  proj.width = nw; proj.height = nh;
  if (typeof document === "undefined") return;
  proj.layers.forEach(l => {
    Object.entries(l.frames).forEach(([, f]) => {
      if (f.canvas && f.canvas.getContext && f.canvas.width !== undefined &&
          (f.canvas.width !== nw || f.canvas.height !== nh)) {
        const ns = makeSurface(nw, nh);
        ns.getContext("2d").drawImage(f.canvas, 0, 0, f.canvas.width, f.canvas.height, 0, 0, nw, nh);
        f.canvas = ns;
      }
    });
  });
  if (proj.cameraView) { /* camera view size stays as configured in the dialog */ }
  return proj;
}

function frameSurface(proj, layer, frameNum, create) {
  const key = frameNum;
  if (!layer.frames[key]) {
    if (!create) return null;
    layer.frames[key] = newFrame();
  }
  const fr = layer.frames[key];
  if (!fr.canvas && create) fr.canvas = makeSurface(proj.width, proj.height);
  return fr.canvas || null;
}

// ---------- brush engine ----------
// stamp = ONE pass of paint. alpha depends on power + pressure (+ grain noise),
// never on opacity: Opacity caps the whole stroke (composite step at strokeEnd).
function brushStamp(ctx, brush, color, x, y, pressure, proj, cap) {
  const r = Math.max(0.4, brush.size / 2 * (brush.pressure ? (0.35 + 0.65 * pressure) : 1))
    * (brush.radius || 1);
  const grain = Math.max(0, Math.min(1, brush.grain || 0));
  const p = Math.max(0, Math.min(1, (brush.power ?? 1) * (0.35 + 0.65 * (pressure ?? 1))));
  ctx.save();
  applyDrawMode(ctx, brush.drawMode, brush, color);
  if (cap !== undefined) ctx.globalAlpha *= cap;
  if (grain > 0) {
    x += (Math.random() - .5) * r * 0.08 * grain;
    y += (Math.random() - .5) * r * 0.08 * grain;
  }
  if (brush.kind === "airbrush") {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
    g.addColorStop(0, colorWithAlpha(color, (0.5 * brush.power) * (0.8 + 0.2 * (1 - grain))));
    g.addColorStop(1, colorWithAlpha(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  } else if (brush.kind === "chalkbrush" || brush.kind === "oilbrush") {
    // grainy multi-dot texture (chalk = sparse, oil = dense)
    const dots = brush.kind === "chalkbrush" ? 5 : 9;
    for (let i = 0; i < dots; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * r;
      ctx.fillStyle = colorWithAlpha(color, (0.25 + Math.random() * 0.5) * p * (1 - grain * 0.3) * brush.power *
        (1 - grain + grain * Math.random()));
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * d * (0.4 + wheat(grain)), y + Math.sin(a) * d * (0.4 + wheat(grain)),
        r * (0.12 + Math.random() * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (brush.kind === "mechanicalpencil" || brush.kind === "pencilbrush") {
    ctx.fillStyle = colorWithAlpha(color, 0.85 * p * (1 - grain * 0.3));
    ctx.beginPath(); ctx.arc(x, y, r * (brush.kind === "mechanicalpencil" ? 0.5 : 0.8), 0, Math.PI * 2); ctx.fill();
    if (brush.kind === "pencilbrush") { // graphite side grains
      ctx.fillStyle = colorWithAlpha(color, (0.15 + 0.1 * Math.random()) * p * grain);
      ctx.beginPath(); ctx.arc(x + (Math.random() - .5) * r, y + (Math.random() - .5) * r, r * 0.9, 0, Math.PI * 2); ctx.fill();
    }
  } else if (brush.kind === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, Math.PI * 2); ctx.fill();
  } else { // penbrush / wetbrush / specialbrush / custom: round, hardness + antiAliasing edge
    const aa = (proj && proj.antiAlias) || "High";
    // edge softness factor per REA antiAliasing: None / Medium / High / Highest
    const soft = aa === "None" ? 0 : aa === "Medium" ? 0.25 : aa === "High" ? 0.6 : 1.0;
    const hard = (brush.hardness ?? 0.7) * (1 - soft * 0.15);
    const alpha = p * (grain > 0 ? (1 - grain + grain * Math.random()) : 1);
    if (soft === 0 || hard >= 0.97) {   // fully hard edge (antiAliasing None)
      ctx.fillStyle = colorWithAlpha(color, alpha);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    } else {
      // solid core up to r*hardness, soft edge out to r (the anti-aliasing
      // setting widens the soft edge).  Without the solid core the pen brush
      // never reaches full opacity and the stroke looks faint and broken.
      const g = ctx.createRadialGradient(x, y, r * hard, x, y, r);
      g.addColorStop(0, colorWithAlpha(color, alpha));
      g.addColorStop(1, colorWithAlpha(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}
// grain positional jitter helper (0..1) — same factor used for chalk/oil spread
function wheat(grain) { return grain * 0.9; }

function applyDrawMode(ctx, mode, brush, color) {
  switch (mode) {
    case "behind": ctx.globalCompositeOperation = "destination-over"; break;
    case "erase": ctx.globalCompositeOperation = "destination-out"; break;
    case "alpha": case "tint": ctx.globalCompositeOperation = "source-atop"; break;
    case "multiply": ctx.globalCompositeOperation = "multiply"; break;
    case "screen": ctx.globalCompositeOperation = "screen"; break;
    case "overlay": ctx.globalCompositeOperation = "overlay"; break;
    case "impress": ctx.globalCompositeOperation = "source-over"; break; // simplified
    case "fade": ctx.globalAlpha *= 0.4; break;
    default: ctx.globalCompositeOperation = "source-over";
  }
}

function colorWithAlpha(hex, a) {
  if (hex.startsWith("rgba")) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}

// "Adjust the layer to the animation" (George tv_cameramakelayerfitanim,
// FUN_1401d3510): the drawings follow the camera movement, so the camera
// reveals the right part of the artwork. The camera offset of every key is
// baked into the layer images.
function bakeCameraIntoLayers(proj) {
  if (!(proj.cameraKeys || []).length) return 0;
  let n = 0;
  proj.layers.forEach(layer => {
    Object.keys(layer.frames).forEach(kk => {
      const fr = layer.frames[kk];
      if (!fr.canvas || !fr.canvas.getContext) return;
      const cam = cameraEvaluate(proj, +kk);
      const dx = cam.x || 0, dy = cam.y || 0;
      if (!dx && !dy) return;
      const w = fr.canvas.width, h = fr.canvas.height;
      const out = makeSurface(w, h);
      const c = out.getContext && out.getContext("2d");
      if (!c) return;                       // node test stub: nothing to draw on
      c.translate(w / 2 + dx, h / 2 + dy);
      c.drawImage(fr.canvas, -w / 2, -h / 2);
      fr.canvas = out;
      n++;
    });
  });
  return n;
}

// Render the camera view of every frame into a new project ("Project >
// Render Camera > Into a New Project").
function renderCameraFrames(proj, merged) {
  if (!(proj.cameraKeys || []).length) return null;
  const vw = proj.cameraView ? proj.cameraView.w : proj.width;
  const vh = proj.cameraView ? proj.cameraView.h : proj.height;
  const out = newProject(vw, vh, proj.fps);
  const layer = out.layers[0];
  layer.name = "Camera";
  layer.frames = {};
  const visible = proj.layers.filter(l => l.visible !== false);
  for (let f = 1; f <= proj.outFrame; f++) {
    const cam = cameraEvaluate(proj, f);
    const r = cameraRect(proj, cam);
    const surf = makeSurface(vw, vh);
    const c = surf.getContext && surf.getContext("2d");
    if (c) {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, vw, vh);
      const k = Math.min(vw / r.w, vh / r.h);
      c.save();
      c.translate(vw / 2, vh / 2);
      c.rotate(-(cam.rotation || 0) * Math.PI / 180);
      c.scale((cam.flipX ? -1 : 1) * k, (cam.flipY ? -1 : 1) * k);
      c.translate(-r.cx, -r.cy);
      visible.forEach(l => {
        const key = effectiveFrameKey(l, f);
        const s2 = key !== null ? l.frames[key].canvas : null;
        if (s2 && s2.getContext) c.drawImage(s2, 0, 0);
      });
      c.restore();
    }
    layer.frames[f] = { exposure: 1, canvas: surf, id: uid(), role: null, name: null };
  }
  if (merged) layer.name = "Camera (merged)";
  return out;
}

// Move a camera keyframe to another frame (live: the "+" of a camera key can
// be dragged with the left mouse button in the camera row of the timeline).
function moveCameraKey(proj, from, to) {
  const k = cameraKeyAt(proj, from);
  if (!k) return false;
  const t = Math.max(1, Math.round(to));
  if (t === from) return false;
  if (cameraKeyAt(proj, t)) return false;      // never overwrite another key
  k.frame = t;
  proj.cameraKeys.sort((a, b) => a.frame - b.frame);
  return true;
}

// ---------- camera (REA: reports/decomp_0x1403f1050.c - tv_camerainfo sets
// width/height; camera points stride 0x380 at project+0x300 carry translationX/Y,
// rotation, scale; interpolation modes hold/linear/smooth(=bezier-smoothed)) ----------
function newCameraKey(frame, data) {
  return Object.assign({ frame: Math.round(frame), x: 0, y: 0, rotation: 0, zoom: 1,
    flipX: false, flipY: false, interp: "linear" }, data || {});
}
function cameraEvaluate(proj, frame) {
  const ks = (proj.cameraKeys || []).slice().sort((a, b) => a.frame - b.frame);
  if (!ks.length) return { x: 0, y: 0, rotation: 0, zoom: 1, flipX: false, flipY: false, interp: "smooth" };
  if (ks.length === 1 || frame <= ks[0].frame) return { ...ks[0], frame: undefined };
  let prev = ks[0];
  for (const k of ks) { if (k.frame <= frame) prev = k; else break; }
  const next = ks.find(k => k.frame > frame) || prev;
  if (next === prev || next.frame === prev.frame) return { ...prev, frame: undefined };
  // the movement type of the key the camera leaves governs the segment.
  // Live TVPaint 12 offers: Linear / Spline / Bezier curve / Smart Spline.
  const mode = prev.interp || "linear";
  if (mode === "hold") return { ...prev, frame: undefined };
  let t = (frame - prev.frame) / (next.frame - prev.frame);
  if (mode === "spline") t = t * t * (3 - 2 * t);            // smooth step
  else if (mode === "bezier") t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  else if (mode === "smart") t = (1 - Math.cos(Math.PI * t)) / 2;
  else if (mode === "smooth") t = t * t * (3 - 2 * t);      // legacy alias
  const L = (a, b) => a + (b - a) * t;
  const pick = (a, b) => (t < 1 ? a : b);
  return { x: L(prev.x, next.x), y: L(prev.y, next.y),
    rotation: L(prev.rotation, next.rotation), zoom: L(prev.zoom, next.zoom),
    flipX: pick(prev.flipX, next.flipX), flipY: pick(prev.flipY, next.flipY), frame: undefined };
}
// camera rectangle in drawing-area coordinates: TVPaint camera centers on the
// drawing area; X/Y offsets move the rect, zoom scales its extent, rotation spins it.
function cameraRect(proj, cam) {
  const vw = (proj.cameraView ? proj.cameraView.w : proj.width * 0.5) / cam.zoom;
  const vh = (proj.cameraView ? proj.cameraView.h : proj.height * 0.5) / cam.zoom;
  return { cx: proj.width / 2 + cam.x, cy: proj.height / 2 + cam.y, w: vw, h: vh, rot: cam.rotation || 0 };
}
function cameraKeyAt(proj, frame) {
  if (!proj.cameraKeys) return null;
  return proj.cameraKeys.find(k => k.frame === Math.round(frame)) || null;
}
function setCameraKey(proj, frame, patch) {
  if (!proj.cameraKeys) proj.cameraKeys = [];
  let k = cameraKeyAt(proj, frame);
  if (!k) { k = newCameraKey(frame, cameraEvaluate(proj, frame)); proj.cameraKeys.push(k); }
  Object.assign(k, patch, { frame: Math.round(frame) });
  return k;
}

// ---------- Increase Layer Length (REA dialog: Stretch / Interpolate(disabled) /
// Repeat via Hold dropdown / Add Empty Instances / Add Empty Exposures) ----------
function layerLengthOp(proj, layer, op, count, mode) {
  const n = Math.max(1, Math.round(count || 1));
  const keys = Object.keys(layer.frames).map(Number).sort((a, b) => a - b);
  if (!keys.length) return 0;
  const last = keys[keys.length - 1];
  const total = last + (layer.frames[last].exposure || 1) - 1;   // last occupied frame
  const timeline = [];   // [frame -> drawing key]
  for (let f = 1; f <= total; f++) timeline.push(effectiveFrameKey(layer, f));
  switch (op) {
    case "stretch": {
      // keep every key, spread exposures so the layer reaches total+n
      const newTotal = total + n;
      const ratio = newTotal / total;
      Object.keys(layer.frames).forEach(kk => {
        const e = layer.frames[kk].exposure || 1;
        layer.frames[kk].exposure = Math.max(1, Math.round(e * ratio));
      });
      return newTotal;
    }
    case "hold": {   // "Hold" mode: extend the last exposure n frames
      layer.frames[last].exposure = (layer.frames[last].exposure || 1) + n;
      return total + n;
    }
    case "repeat": {
      // REA 0x000025570..25573: repeat modes Loop / Ping Pong / Hold / Exposure
      const rm = String(mode || "loop").toLowerCase();
      if (rm === "hold") {
        layer.frames[last].exposure = (layer.frames[last].exposure || 1) + n;
        return total + n;
      }
      const seq = timeline.slice();
      if (rm === "ping pong" || rm === "pingpong") {
        for (let i = timeline.length - 2; i >= 0; i--) seq.push(timeline[i]);
      }
      for (let i = 0; i < n; i++) {
        const src = seq[i % seq.length];
        if (src === null) continue;
        layer.frames[total + i + 1] =
          { exposure: 1, canvas: layer.frames[src].canvas, id: uid() };  // same drawing reused
      }
      return total + n;
    }
    case "shrink": {
      // Decrease Layer Length: scale every exposure down to lose n frames
      const target = Math.max(keys.length, total - n);
      const ratio = target / total;
      Object.keys(layer.frames).forEach(kk => {
        const e = layer.frames[kk].exposure || 1;
        layer.frames[kk].exposure = Math.max(1, Math.round(e * ratio));
      });
      return target;
    }
    case "cut": {
      // Decrease Layer Length: Cut Images — drop frames from the end
      let removed = 0;
      const ks = Object.keys(layer.frames).map(Number).sort((a, b) => a - b);
      for (let i = ks.length - 1; i >= 0 && removed < n; i--) {
        const k = ks[i];
        const e = layer.frames[k].exposure || 1;
        if (e <= n - removed) { removed += e; delete layer.frames[k]; }
        else { layer.frames[k].exposure = e - (n - removed); removed = n; }
      }
      return total - n;
    }
    case "instances": {  // add n new EMPTY drawings after the last one
      for (let i = 0; i < n; i++) {
        const f = total + i + 1;
        layer.frames[f] = { exposure: 1, canvas: null, id: uid() };
      }
      return total + n;
    }
    case "exposures": {  // add n empty exposure cells (blank drawings) after the last
      for (let i = 0; i < n; i++) {
        const f = total + i + 1;
        layer.frames[f] = { exposure: 1, canvas: null, id: uid() };
      }
      return total + n;
    }
    default: return 0;
  }
}

// ---------- exposure hold resolution (TVPaint: cell with exposure n covers k..k+n-1) ----------
function effectiveFrameKey(layer, f) {
  const keys = Object.keys(layer.frames).map(Number).sort((a, b) => a - b);
  let best = null;
  for (const k of keys) {
    if (k > f) break;
    if (f < k + (layer.frames[k].exposure || 1)) best = k;
  }
  return best;
}

// stroke state machine — call begin/move/end from UI pointer events.
// REA semantics: "power" = paint per pass (stamps); "opacity" = whole-stroke cap
// applied when the stroke buffer is composited onto the layer.
// Wet/oil brushes pick up underlying color while the Drying timer is running.
const SCRATCH_MODES = new Set(["normal", "fade", "impress"]);
function strokeBegin(state, proj, layer, frameNum, pt, pressure, color) {
  const surf = frameSurface(proj, layer, frameNum, true);
  state.proj = proj; state.layer = layer;
  state.frameNum = frameNum;
  state.frameCtx = surf.getContext("2d");
  state.color = color || proj.apen;   // APen (left mouse) or BPen (right mouse)
  state.points = [{ ...pt, p: pressure }];
  state.last = { ...pt };                    // strokeMove interpolates from here
  state.smoothed = { ...pt };
  state.rawTarget = { ...pt };
  const brush = proj.brush;
  state.scratch = SCRATCH_MODES.has(brush.drawMode || "normal") && brush.kind !== "eraser"
    ? makeSurface(proj.width, proj.height) : null;
  state.ctx = state.scratch ? state.scratch.getContext("2d") : state.frameCtx;
  // drying/wet state: paint in the brush head has a water level that recovers
  // over the Drying seconds (REA string "dry %d").
  const dry = brush.drying || 0;
  state.wet = (brush.kind === "wetbrush" || brush.kind === "oilbrush") && dry > 0
    ? { t0: Date.now(), dryMs: dry * 1000 }
    : null;
  if (state.wet) proj._wetLastStroke = Date.now();
  brushStamp(state.ctx, proj.brush, state.color, pt.x, pt.y, pressure, proj, state.scratch ? undefined : proj.brush.opacity);
}
function wetWaterLevel(proj, state) {
  if (!state.wet) return 0;
  return Math.max(0, 1 - (Date.now() - state.wet.t0) / state.wet.dryMs);
}
function mixHex(a, b, t) {
  const na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16);
  const mix = (sh) => Math.round(((na >> sh) & 255) + (((nb >> sh) & 255) - ((na >> sh) & 255)) * Math.max(0, Math.min(1, t)));
  return "#" + ((mix(16) << 16) | (mix(8) << 8) | mix(0)).toString(16).padStart(6, "0");
}
function strokeMove(state, pt, pressure) {
  if (!state.ctx) return;
  const brush = state.proj.brush;
  // stabilizer (LineSmoothing): smoothing value 0..1 → position EMA with catch-up
  const sv = Math.max(0, Math.min(1, (state.proj.smoothing || 0) / 10));
  const k = sv <= 0 ? 1 : Math.max(0.04, 1 - sv * 0.95);
  state.smoothed.x += (pt.x - state.smoothed.x) * k;
  state.smoothed.y += (pt.y - state.smoothed.y) * k;
  const p2 = { ...state.smoothed };
  const d = Math.hypot(p2.x - state.last.x, p2.y - state.last.y);
  // the stamps are placed close enough to overlap, so the stroke is continuous
  // even for a small brush (TVPaint draws an unbroken line)
  const step = Math.max(0.4, brush.size / 4);
  const n = Math.max(1, Math.ceil(d / step));
  const cap = state.scratch ? undefined : brush.opacity;
  // wet pickup: blend brush color toward the underlying paint while still wet
  let stampColor = state.color;
  if (state.wet && typeof state.frameCtx.getImageData === "function") {
    const w = wetWaterLevel(state.proj, state);
    if (w > 0) {
      const sx = Math.round(p2.x), sy = Math.round(p2.y);
      if (sx >= 0 && sy >= 0 && sx < state.proj.width && sy < state.proj.height) {
        const u = state.frameCtx.getImageData(sx, sy, 1, 1).data;
        if (u[3] > 8) {
          const under = "#" + [u[0], u[1], u[2]].map(v => v.toString(16).padStart(2, "0")).join("");
          stampColor = mixHex(state.color, under, 0.55 * w);
        }
      }
    }
  }
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    brushStamp(state.ctx, brush, stampColor,
      state.last.x + (p2.x - state.last.x) * t,
      state.last.y + (p2.y - state.last.y) * t,
      pressure, state.proj, cap);
  }
  state.last = p2;
  state.points.push({ ...p2, p: pressure });
}
function strokeEnd(state) {
  const pts = state.points || [];
  if (state.scratch && state.ctx) {
    const fctx = state.frameCtx;
    fctx.save();
    applyDrawMode(fctx, state.proj.brush.drawMode, state.proj.brush, state.color);
    fctx.globalAlpha = Math.max(0, Math.min(1, state.proj.brush.opacity ?? 1));
    fctx.drawImage(state.scratch, 0, 0);
    fctx.restore();
  }
  state.ctx = null; state.scratch = null; state.frameCtx = null;
  state.points = null; state.last = null; state.wet = null;
  return pts;
}

// flood fill with tolerance
function floodFill(proj, layer, frameNum, pt, color, tolerance) {
  const surf = frameSurface(proj, layer, frameNum, true);
  const ctx = surf.getContext("2d");
  const W = proj.width, H = proj.height;
  const img = ctx.getImageData(0, 0, W, H), d = img.data;
  const sx = Math.floor(pt.x), sy = Math.floor(pt.y);
  if (sx < 0 || sy < 0 || sx >= W || sy >= H) return 0;
  const at = (x, y) => (y * W + x) * 4;
  const t = d.slice(at(sx, sy), at(sx, sy) + 4);
  const f = colorWithAlpha(color, 1);
  const m = f.match(/\((\d+),(\d+),(\d+),/);
  const fill = [+m[1], +m[2], +m[3], 255];
  if (Math.abs(t[0] - fill[0]) < 2 && Math.abs(t[1] - fill[1]) < 2 &&
      Math.abs(t[2] - fill[2]) < 2 && t[3] === 255) return 0;
  const tol = tolerance ?? proj.brush.tolerance ?? 32;
  const seen = new Uint8Array(W * H);
  const stack = [[sx, sy]];
  let count = 0;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = y * W + x;
    if (seen[i]) continue; seen[i] = 1;
    const o = i * 4;
    if (Math.abs(d[o] - t[0]) > tol || Math.abs(d[o + 1] - t[1]) > tol ||
        Math.abs(d[o + 2] - t[2]) > tol || Math.abs(d[o + 3] - t[3]) > tol) continue;
    d[o] = fill[0]; d[o + 1] = fill[1]; d[o + 2] = fill[2]; d[o + 3] = 255;
    count++;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  ctx.putImageData(img, 0, 0);
  return count;
}

// eyedropper (Color-Pick)
function pickColor(proj, layer, frameNum, pt) {
  const surf = frameSurface(proj, layer, frameNum, false);
  if (!surf || !surf.getContext) return null;
  const d = surf.getContext("2d").getImageData(Math.floor(pt.x), Math.floor(pt.y), 1, 1).data;
  if (d[3] === 0) return null;
  const hex = (v) => v.toString(16).padStart(2, "0");
  return "#" + hex(d[0]) + hex(d[1]) + hex(d[2]);
}

// ---------- XSheet / exposure operations (REA: XSheet-* icons) ----------
function xsheetOp(proj, layer, op, frameNum, arg) {
  const f = Math.round(frameNum);
  const keys = Object.keys(layer.frames).map(Number).sort((a, b) => a - b);
  switch (op) {
    case "add": {
      // TVPaint "Add": a new blank drawing goes right AFTER the current one;
      // everything from f+1 shifts right, the play-head stays on the old drawing.
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i];
        if (k > f) { layer.frames[k + 1] = layer.frames[k]; delete layer.frames[k]; }
      }
      layer.frames[f + 1] = newFrame();
      break;
    }
    case "duplicate": {
      const src = layer.frames[f] || newFrame();
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i];
        if (k > f) { layer.frames[k + 1] = layer.frames[k]; delete layer.frames[k]; }
      }
      layer.frames[f + 1] = { ...src, id: uid() };
      break;
    }
    case "remove": {
      delete layer.frames[f];
      const nk = Object.keys(layer.frames).map(Number).sort((a, b) => a - b);
      if (nk.length === 0) layer.frames[1] = newFrame();
      break;
    }
    case "insert": { // XSheet-InsertData: blank frames n at f
      const n = Math.max(1, arg | 0);
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i];
        if (k >= f) { layer.frames[k + n] = layer.frames[k]; delete layer.frames[k]; }
      }
      for (let j = 0; j < n; j++) layer.frames[f + j] = newFrame();
      break;
    }
    case "hold": { const fr = layer.frames[f] || newFrame(); layer.frames[f] = fr; fr.exposure = Math.max(1, arg | 0 || 2); break; }
    case "unhold": { const fr = layer.frames[f]; if (fr) fr.exposure = 1; break; }
    case "empty": { layer.frames[f] = newFrame(); break; }
    case "reverse": {
      const seq = keys.filter(k => k >= f && k <= (arg || Math.max(...keys)));
      const snaps = seq.map(k => layer.frames[k]);
      seq.forEach((k, i) => { layer.frames[k] = snaps[snaps.length - 1 - i]; });
      break;
    }
    case "shuffle": {
      const seq = keys.filter(k => k >= f && k <= (arg || Math.max(...keys)));
      const snaps = seq.map(k => layer.frames[k]);
      for (let i = seq.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [snaps[i], snaps[j]] = [snaps[j], snaps[i]];
      }
      seq.forEach((k, i) => { layer.frames[k] = snaps[i]; });
      break;
    }
    default: return false;
  }
  proj.outFrame = Math.max(proj.outFrame,
    ...Object.keys(layer.frames).map(Number));
  return true;
}

// Add Exposure (loc 28620, George tv_exposureadd). Verified live: pressing
// Backspace on an empty cell creates a new empty animation cell there and the
// layer grows to include it; pressing it on a frame that is already the start
// of an instance does nothing; pressing it inside a hold splits that hold, the
// earlier part keeps the drawing and the new instance takes the remaining
// frames (the new instance is empty, not a copy).
function addExposureAt(layer, frame) {
  if (!layer) return false;
  const f = Math.max(1, Math.round(frame));
  const k = effectiveFrameKey(layer, f);
  if (k != null && k === f) return false;          // an instance already starts here
  if (k == null) {                                  // empty cell -> new 1 frame instance
    const fr = newFrame();
    fr.exposure = 1;
    layer.frames[f] = fr;
    return true;
  }
  const exp = layer.frames[k].exposure || 1;        // inside a hold -> split it
  const before = f - k;
  const after = exp - before;
  if (after < 1) return false;
  layer.frames[k].exposure = before;
  const fr = newFrame();
  fr.exposure = after;
  layer.frames[f] = fr;
  return true;
}

// ---- layer order ----
// "Layer: Move Layer Up" / "Move Layer Down" (loc 20180/20181). The decompiled
// handler (FUN_1407aaa60) swaps the layer with its neighbour in the layer list
// and then fixes the current-layer pointer. moveLayerTo does the same for a
// drag and drop onto another layer row.
function remapLayerIndex(i, from, to) {
  if (i === from) return to;
  if (i === to) return from;
  if (from < to) return (i > from && i < to) ? i - 1 : i;
  return (i > to && i < from) ? i + 1 : i;
}
function moveLayerTo(proj, from, to) {
  const n = proj.layers.length;
  if (from < 0 || from >= n) return false;
  to = Math.max(0, Math.min(n - 1, to));
  if (from === to) return false;
  const [l] = proj.layers.splice(from, 1);
  proj.layers.splice(to, 0, l);
  if (typeof proj.currentLayer === "number") {
    proj.currentLayer = remapLayerIndex(proj.currentLayer, from, to);
  }
  if (Array.isArray(proj.selectedLayers)) {
    proj.selectedLayers = proj.selectedLayers.map(i => remapLayerIndex(i, from, to));
  }
  return true;
}
function moveLayerBy(proj, index, delta) {
  return moveLayerTo(proj, index, index + delta);
}
// Move several layers at once ("Move Selected Layers"): they keep their
// relative order and are dropped as a block on the target position.
function moveLayersTo(proj, indices, to) {
  const n = proj.layers.length;
  const sel = (indices || []).filter(i => i >= 0 && i < n).sort((a, b) => a - b);
  if (!sel.length) return false;
  if (sel.length === 1) return moveLayerTo(proj, sel[0], to);
  const at = Math.max(0, Math.min(sel.length ? n - sel.length : 0, to - sel.filter(s => s < to).length));
  const moved = sel.map(i => proj.layers[i]);
  const keep = proj.layers.filter((_, i) => !sel.includes(i));
  const keepPos = (i) => i - sel.filter(s => s < i).length;
  const map = (i) => {
    if (sel.includes(i)) return at + sel.indexOf(i);
    const p = keepPos(i);
    return p >= at ? p + sel.length : p;
  };
  proj.layers = keep.slice(0, at).concat(moved, keep.slice(at));
  if (typeof proj.currentLayer === "number") proj.currentLayer = map(proj.currentLayer);
  if (Array.isArray(proj.selectedLayers)) proj.selectedLayers = proj.selectedLayers.map(map);
  return true;
}
// "Bring Selected Layers Together" (loc 011025182): the selected layers are
// gathered under the topmost selected one, keeping their relative order.
function bringLayersTogether(proj, indices) {
  const sel = (indices || []).filter(i => i >= 0 && i < proj.layers.length).sort((a, b) => a - b);
  if (sel.length < 2) return false;
  const at = sel[0];
  const moved = sel.map(i => proj.layers[i]);
  const keep = proj.layers.filter((_, i) => !sel.includes(i));
  const next = keep.slice(0, at).concat(moved, keep.slice(at));
  const keepPos = (i) => i - sel.filter(s => s < i).length;
  const map = (i) => {
    if (sel.includes(i)) return at + sel.indexOf(i);
    const p = keepPos(i);
    return p >= at ? p + sel.length : p;
  };
  proj.layers = next;
  if (typeof proj.currentLayer === "number") proj.currentLayer = map(proj.currentLayer);
  if (Array.isArray(proj.selectedLayers)) proj.selectedLayers = proj.selectedLayers.map(map);
  return true;
}
// "Reverse All Layer Order" / "Reverse Selected Layer Order" (loc 011025183/184)
function reverseLayerOrder(proj, indices) {
  const n = proj.layers.length;
  if (!indices || !indices.length) {
    proj.layers.reverse();
    if (typeof proj.currentLayer === "number") proj.currentLayer = n - 1 - proj.currentLayer;
    if (Array.isArray(proj.selectedLayers)) {
      proj.selectedLayers = proj.selectedLayers.map(i => n - 1 - i);
    }
    return true;
  }
  const sel = indices.filter(i => i >= 0 && i < n).sort((a, b) => a - b);
  if (sel.length < 2) return false;
  const picked = sel.map(i => proj.layers[i]).reverse();
  sel.forEach((idx, i) => { proj.layers[idx] = picked[i]; });
  return true;
}

// Reverse exactly the selected drawings (Ctrl/Shift-click selection), leaving
// every unselected key in place. Frame objects move, so exposures, roles and
// names travel with their drawings. Returns the number of drawings reversed.
function reverseSelectedImages(layer, keys) {
  const ks = (keys || []).map(Number).filter(k => layer.frames[k]).sort((a, b) => a - b);
  if (ks.length < 2) return ks.length;
  const snaps = ks.map(k => layer.frames[k]);
  ks.forEach((k, i) => { layer.frames[k] = snaps[snaps.length - 1 - i]; });
  return ks.length;
}

// ---------- undo (per-frame bitmap snapshots, bounded) ----------
function makeHistory(depth) {
  const undoStack = [], redoStack = [];
  return {
    pushFrame(proj, layer, frameNum) {
      const fr = layer.frames[frameNum];
      undoStack.push({
        type: "frame", layerId: layer.id, frame: frameNum,
        before: fr ? snapshotFrame(proj, fr) : null,
        after: null
      });
      if (undoStack.length > (depth || 40)) undoStack.shift();
      redoStack.length = 0;
    },
    sealLast(proj, layer, frameNum) {
      const rec = undoStack[undoStack.length - 1];
      if (rec) rec.after = snapshotFrame(proj, layer.frames[frameNum]);
    },
    pushModel(proj) {
      undoStack.push({ type: "model", before: modelSnapshot(proj),
        beforeCanvases: collectCanvases(proj), after: null, afterCanvases: null });
      if (undoStack.length > (depth || 40)) undoStack.shift();
      redoStack.length = 0;
    },
    sealModel(proj) {
      const rec = undoStack[undoStack.length - 1];
      if (rec && rec.type === "model") {
        rec.after = modelSnapshot(proj);
        rec.afterCanvases = collectCanvases(proj);
      }
    },
    undo(proj, restoreFns) {
      const rec = undoStack.pop();
      if (!rec) return false;
      redoStack.push(rec);
      applyRecord(proj, rec, "before", restoreFns);
      return true;
    },
    redo(proj, restoreFns) {
      const rec = redoStack.pop();
      if (!rec) return false;
      undoStack.push(rec);
      applyRecord(proj, rec, "after", restoreFns);
      return true;
    },
    clear() { undoStack.length = 0; redoStack.length = 0; },
    debug() {
      const snap = s => {
        const o = JSON.parse(s);
        return o.layers.map(l => ({
          name: l.name,
          keys: Object.keys(l.frames).map(Number).sort((a, b) => a - b),
          exps: Object.fromEntries(Object.entries(l.frames).map(([k, f]) => [k, f.exposure]))
        }));
      };
      const sum = r => r.type === "frame"
        ? { type: "frame", layerId: r.layerId, frame: r.frame, before: !!r.before, after: !!r.after }
        : { type: "model", before: snap(r.before), after: r.after ? snap(r.after) : null };
      return { undo: undoStack.map(sum), redo: redoStack.map(sum) };
    }
  };
}
function snapshotFrame(proj, fr) {
  if (!fr) return null;
  if (fr.canvas && fr.canvas.getContext) {
    return { exposure: fr.exposure, data: fr.canvas.toDataURL("image/png") };
  }
  return { exposure: fr.exposure, data: fr.canvas && fr.canvas.dataURL || null };
}
function modelSnapshot(proj) {
  const p = JSON.parse(JSON.stringify(proj, (k, v) => k === "canvas" ? undefined : v));
  return JSON.stringify(p);
}
function applyRecord(proj, rec, which, restoreFns) {
  const payload = rec[which];
  if (rec.type === "model") {
    const o = JSON.parse(payload);
    const frames = rec[which + "Canvases"] || collectCanvases(proj);
    Object.assign(proj, o);
    restoreFns.rebuildModel(frames);
  } else {
    const layer = proj.layers.find(l => l.id === rec.layerId);
    if (!layer) return;
    restoreFns.restoreFrame(layer, rec.frame, payload);
  }
}
function collectCanvases(proj) {
  const map = {};
  proj.layers.forEach(l => Object.keys(l.frames).forEach(k => {
    const fr = l.frames[k];
    if (!fr.canvas) return;
    map[l.id + ":" + k] = fr.canvas;
    if (fr.id) map["id:" + fr.id] = fr.canvas;   // survives slides / re-keying
  }));
  return map;
}

// ---------- save / load ----------
function serializeProject(proj) {
  const o = {
    app: "my-version", version: 2,
    project: JSON.parse(JSON.stringify(proj, (k, v) => {
      if (k === "canvas") return v && v.toDataURL ? { dataURL: v.toDataURL("image/png") } : undefined;
      return v;
    }))
  };
  return JSON.stringify(o);
}
function deserializeProject(json, restoreFns) {
  const o = JSON.parse(json);
  if (!o || o.app !== "my-version") throw new Error("not a my-version project");
  const proj = o.project;
  proj.layers.forEach(l => Object.keys(l.frames).forEach(k => {
    const fr = l.frames[k];
    fr.canvas = restoreFns.surfaceFromDataURL(fr.canvas && fr.canvas.dataURL || null, proj.width, proj.height);
  }));
  return proj;
}

// ---------- gradient fills (REA: Shape-FloodFill-Gradient01..05 + map_gradient
// linear/circle/radial/square — APen → BPen ramp in five shape variants) ----------
function gradientFill(ctx, mode, x0, y0, x1, y1, colorA, colorB) {
  const A = colorA || "#000000", B = colorB || "#ffffff";
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const hasGradients = typeof ctx.createLinearGradient === "function";
  const mk = (g) => { g.addColorStop(0, A); g.addColorStop(1, B); return g; };
  if (!hasGradients) return A; // node/test stub
  switch (mode) {
    case "linear01":
      return mk(ctx.createLinearGradient(x0, y0, x1, y1));
    case "circle02":
      return mk(ctx.createRadialGradient(x0, y0, 0, x0, y0, dist));
    case "radial03": {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const r = Math.max(dist / 2, 1);
      return mk(ctx.createRadialGradient(cx, cy, 0, cx, cy, r));
    }
    case "square04": {
      if (ctx.createConicGradient) {
        const g = ctx.createConicGradient(Math.atan2(dy, dx), x0, y0);
        g.addColorStop(0, A); g.addColorStop(0.5, B); g.addColorStop(1, A);
        return g;
      }
      return mk(ctx.createRadialGradient(x0, y0, 0, x0, y0, dist));
    }
    case "invert05": {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, B); g.addColorStop(1, A);
      return g;
    }
    default:
      return A;
  }
}

// ---------- exposure recompute (REA: tv_layerrecomputeexposure @ 0x140412f40) ----------
// The handler parses N double args into an int array (DAT_140cf4a80) and a double
// array (DAT_140cf4b00), then dispatches to one of two recompute paths:
//   - count < 1  → recompute from current frame (FUN_1400dd1a0)
//   - count >= 1 → recompute from frame with count+value (FUN_1400dcf50)
// Layer types 2 (drawing) and 5 (another drawing variant) are supported.
function recomputeExposure(proj, layer, frame, count, value) {
  const f = Math.round(frame);
  const n = Math.max(0, Math.round(count || 0));
  const v = value || 0;
  if (!layer || !layer.frames) return false;
  const keys = Object.keys(layer.frames).map(Number).sort((a, b) => a - b);
  if (!keys.length) return false;
  const firstFrame = keys[0];
  const lastKey = keys[keys.length - 1];
  const lastFrame = lastKey + (layer.frames[lastKey].exposure || 1) - 1;
  if (f < firstFrame || f > lastFrame) return false;
  if (n < 1) {
    // Recompute from current frame: set exposure starting at frame 0 (relative)
    // FUN_1404aa960(list, 0, count) — sets exposure for the range
    const targetKey = effectiveFrameKey(layer, f);
    if (targetKey === null) return false;
    const exp = layer.frames[targetKey];
    const curExp = exp.exposure || 1;
    const remaining = lastFrame - f + 1;
    exp.exposure = Math.max(1, Math.min(remaining, Math.round(v || curExp)));
    return true;
  }
  // FUN_1400dcf50: recompute with frame + count + value
  // Loop count times setting exposure for each frame, then finalize
  const targetKey = effectiveFrameKey(layer, f);
  if (targetKey === null) return false;
  const exp = layer.frames[targetKey];
  const remaining = lastFrame - f + 1;
  exp.exposure = Math.max(1, Math.min(remaining, n));
  return true;
}

// ---------- exposure break (REA: tv_exposurebreak @ 0x14040dc50) ----------
// Splits an exposure at the given frame. The handler:
//   1. Parses 1 double arg (target frame) into DAT_140cf4a80
//   2. Gets current layer, current frame (FUN_14078ce20), end frame (FUN_14078e200)
//   3. If current <= target <= end and layer type != 6:
//      - FUN_14068f700: create "break instances" command
//      - FUN_14078aa30: execute the split
// The split (FUN_1404a5e60) finds the exposure at the target frame, gets the
// next exposure, copies its data into the current one, and marks the current
// as deleted — effectively splitting one exposure into two.
// Split a held exposure at frame f into two independent instances. Live
// observation: auto-break at the last frame of a hold works too, later
// instances keep their image numbers, and drawing on the new instance does
// not change the earlier frames. `copyCanvas` gives the new instance its own
// bitmap (the browser passes tvCloneSurface).
function splitExposure(layer, f, copyCanvas) {
  f = Math.round(f);
  if (!layer || !layer.frames) return null;
  const k = effectiveFrameKey(layer, f);
  if (k == null || k === f) return null;                 // empty cell / key start
  const fr = layer.frames[k];
  const exp = fr.exposure || 1;
  if (f <= k || f >= k + exp) return null;               // outside the hold
  const splitPoint = f - k;
  const nf = Object.assign({}, fr, {
    exposure: exp - splitPoint,
    id: uid(),
    name: null,             // the new instance gets a fresh number
    canvas: copyCanvas ? copyCanvas(fr.canvas) : fr.canvas
  });
  fr.exposure = splitPoint;
  layer.frames[f] = nf;
  return nf;
}
function breakExposure(proj, layer, frame) {
  return !!splitExposure(layer, frame, cloneSurface);
}
// End-handle drag: change one exposure and ripple every later instance by the
// same delta. Live: extending key 1 pushed keys 2/3 right and grew the clip;
// shrinking pulled them left and shrank it.
function rippleExposure(layer, k, newExp) {
  k = Math.round(k);
  newExp = Math.max(1, Math.round(newExp || 1));
  const ks = layerKeys(layer);
  const i = ks.indexOf(k);
  if (i < 0) return 0;
  const oldExp = layer.frames[k].exposure || 1;
  const delta = newExp - oldExp;
  if (!delta) return 0;
  const later = ks.slice(i + 1);
  if (delta > 0) later.slice().reverse().forEach(x => { layer.frames[x + delta] = layer.frames[x]; delete layer.frames[x]; });
  else later.forEach(x => { layer.frames[x + delta] = layer.frames[x]; delete layer.frames[x]; });
  layer.frames[k].exposure = newExp;
  return delta;
}
// Start-handle drag: move the boundary between this instance and the previous
// one. Live: dragging key 2's start +1 frame made key 1 a 3-frame hold and key 2
// a 1-frame hold; total layer length and later keys did not move.
function trimExposureStart(layer, k, newStart) {
  k = Math.round(k); newStart = Math.round(newStart);
  const ks = layerKeys(layer);
  const i = ks.indexOf(k);
  if (i <= 0) return false;                              // first instance has no left neighbour
  const prev = ks[i - 1];
  const end = k + (layer.frames[k].exposure || 1) - 1;
  newStart = Math.max(prev + 1, Math.min(newStart, end));
  if (newStart === k) return false;
  layer.frames[prev].exposure = newStart - prev;
  const fr = layer.frames[k];
  delete layer.frames[k];
  fr.exposure = end - newStart + 1;
  layer.frames[newStart] = fr;
  return true;
}
// ---------- timeline cell commands (live-observed cell menu, loc 254xx/286xx) ----------
const IMAGE_ROLES = [
  { id: "key",            label: "Keyframe",                       color: "#d05a5a" },
  { id: "breakdown",      label: "Breakdown",                      color: "#d09a4a" },
  { id: "inbetween-todo", label: "Inbetween (To Do)",              color: "#4a7fd0" },
  { id: "inbetween-done", label: "Inbetween (Done)",               color: "#4ab06a" },
  { id: "special-todo",   label: "Special Inbetween (To Do)",      color: "#9a5ad0" },
  { id: "special-done",   label: "Special Inbetween (Done)",       color: "#3ab0a0" }
];
const BLEND_MODES = ["Normal", "Add", "Multiply", "Screen", "Overlay", "Soft Light",
  "Hard Light", "Color Dodge", "Color Burn", "Darken", "Lighten", "Difference",
  "Exclusion", "Hue", "Saturation", "Color", "Luminosity"];

function frameEndOf(k, fr) { return k + ((fr && fr.exposure) || 1) - 1; }
function layerKeys(layer) { return Object.keys(layer.frames).map(Number).sort((a, b) => a - b); }
function layerEnd(layer) {
  const ks = layerKeys(layer);
  const keyEnd = ks.length ? frameEndOf(ks[ks.length - 1], layer.frames[ks[ks.length - 1]]) : 0;
  // "Delete Image (Keep empty)" leaves a trailing gap; emptyEnd remembers it
  return Math.max(keyEnd, layer.emptyEnd || 0);
}
// Deep-enough surface copy for the browser and the Node test stub.
function cloneSurface(src) {
  if (!src) return null;
  if (typeof document !== "undefined" && src.getContext) {
    const c = makeSurface(src.width, src.height);
    c.getContext("2d").drawImage(src, 0, 0);
    return c;
  }
  return Object.assign({}, src);   // node stub
}
function shiftKeys(layer, from, delta, includeFrom) {
  const ks = layerKeys(layer).filter(k => includeFrom ? k >= from : k > from);
  if (delta >= 0) ks.slice().reverse().forEach(k => { layer.frames[k + delta] = layer.frames[k]; delete layer.frames[k]; });
  else ks.forEach(k => { layer.frames[k + delta] = layer.frames[k]; delete layer.frames[k]; });
  if (layer.emptyEnd) layer.emptyEnd = Math.max(0, layer.emptyEnd + delta);
}
function blankFrame() { return newFrame(); }
function copyFrameObj(src) {
  return { exposure: src.exposure || 1, canvas: src.canvas, id: uid(),
    role: src.role || null, name: src.name || null };
}
// Project length observed live: stretching the long layer grew Project/Clip,
// shrinking it pulled both back. A project longer than every layer (an empty
// tail) is preserved; only a fitted out-point follows the layers.
function projectMaxEnd(proj) {
  return Math.max(1, ...proj.layers.map(layerEnd));
}
function syncProjectOut(proj, oldMax, oldOut) {
  const nm = projectMaxEnd(proj);
  if (nm > proj.outFrame) proj.outFrame = nm;
  else if (oldOut != null && oldMax != null && oldOut === oldMax) proj.outFrame = nm;
  proj.outFrame = Math.max(proj.outFrame, proj.inFrame || 1, 1);
  proj.currentFrame = Math.max(1, Math.min(proj.currentFrame, proj.outFrame));
  return nm;
}

// Insert / duplicate images (cell menu ▸ Insert Images).
// mode: "after" (blank), "before" (blank) or "duplicate" (copy the image at frame f).
function insertImages(layer, f, n, mode, copyCanvas) {
  n = Math.max(1, Math.round(n || 1));
  const srcKey = effectiveFrameKey(layer, f);
  let cut;
  if (mode === "before") cut = (srcKey == null ? f : srcKey) - 1;
  else cut = (srcKey == null ? f : srcKey);
  if (mode === "after" || mode === "duplicate") {
    const fr = srcKey == null ? null : layer.frames[srcKey];
    cut = fr ? frameEndOf(srcKey, fr) : f;
  }
  shiftKeys(layer, cut, n, false);
  for (let i = 1; i <= n; i++) {
    const at = cut + i;
    if (mode === "duplicate" && srcKey != null) {
      const src = layer.frames[srcKey];
      let cv = src.canvas;
      if (copyCanvas && cv) cv = copyCanvas(cv);
      layer.frames[at] = { exposure: src.exposure || 1, canvas: cv, id: uid(),
        role: src.role || null, name: src.name || null };
    } else {
      layer.frames[at] = blankFrame();
    }
  }
  return n;
}
function duplicateImages(layer, f, n, copyCanvas) {
  return insertImages(layer, f, n, "duplicate", copyCanvas);
}
// Delete from Layer (cell menu ▸ Delete from Layer). Live submenu:
//   > Stay put <   < Keep empty >   > Fill gap from left >   < Fill gap from right <
// "Keep empty" was observed live: key 2 disappeared, its 2 cells stayed empty,
// key 3 stayed at frame 5 and the layer/Project length stayed 7.
function deleteImageAt(layer, f, mode) {
  mode = mode || layer.deleteMode || "stay";
  const k = effectiveFrameKey(layer, f);
  if (k == null) return false;
  const ks = layerKeys(layer);
  const i = ks.indexOf(k);
  const span = layer.frames[k].exposure || 1;
  const end = k + span - 1;
  const prev = i > 0 ? ks[i - 1] : null;
  const next = i >= 0 ? ks[i + 1] : null;
  delete layer.frames[k];
  if (mode === "fill-left" && prev != null) {
    layer.frames[prev].exposure = (layer.frames[prev].exposure || 1) + span;
  } else if (mode === "fill-right" && next != null) {
    const nf = layer.frames[next];
    delete layer.frames[next];
    nf.exposure = (nf.exposure || 1) + span;   // image reaches back over the gap
    layer.frames[k] = nf;
  } else if (mode === "keep") {
    // Keep the old end when the last image was removed; the cells stay empty.
    if (next == null) layer.emptyEnd = Math.max(layer.emptyEnd || 0, end);
  } else if (mode === "stay") {
    // Stay put: remove the image; a trailing gap is not preserved.
    if (next == null) layer.emptyEnd = 0;
  }
  // Only Keep empty preserves a trailing gap. Fill modes and Stay put close it.
  if (next == null && mode !== "keep") layer.emptyEnd = 0;
  if (!layerKeys(layer).length && !(layer.emptyEnd > 0)) layer.frames[1] = blankFrame();
  return true;
}
// Delete from Project: remove one frame column across every layer.
function deleteFrameColumn(proj, f) {
  proj.layers.forEach(layer => {
    const ks = layerKeys(layer);
    if (!ks.length) return;
    ks.forEach(k => {
      const fr = layer.frames[k];
      if (k === f) {
        // the key sits on the deleted column: keep its drawing for the rest
        // of the hold, or drop the key when it was a single frame
        if ((fr.exposure || 1) > 1) fr.exposure -= 1;
        else delete layer.frames[k];
      } else if (k < f && frameEndOf(k, fr) >= f) {
        fr.exposure = Math.max(1, (fr.exposure || 1) - 1);
      }
    });
    // every key after the column moves one frame left, even on layers that
    // have no drawing at f (deleting a project frame compacts the whole xsheet)
    ks.filter(k => k > f).forEach(k => {
      layer.frames[k - 1] = layer.frames[k];
      delete layer.frames[k];
    });
    if (!layerKeys(layer).length) layer.frames[1] = blankFrame();
  });
  proj.outFrame = Math.max(1, proj.outFrame - 1);
  proj.currentFrame = Math.max(1, Math.min(proj.currentFrame, proj.outFrame));
  return true;
}
function setExposureValue(layer, f, n) {
  const k = effectiveFrameKey(layer, f);
  if (k == null) return false;
  n = Math.max(1, Math.round(n || 1));
  rippleExposure(layer, k, n);   // same ripple as dragging the exposure end
  return true;
}
// Remove empty exposures (the gaps between held images) from the layer.
// Live menu evidence: the item is grayed on a layer whose images fill 1..7
// with no gaps (keys at 1/3/5, exposures 2/2/3).
function layerHasGaps(layer) {
  const ks = layerKeys(layer);
  for (let i = 1; i < ks.length; i++) {
    const prevEnd = frameEndOf(ks[i - 1], layer.frames[ks[i - 1]]);
    if (ks[i] > prevEnd + 1) return true;
  }
  const last = ks[ks.length - 1];
  const lastEnd = last != null ? frameEndOf(last, layer.frames[last]) : 0;
  return !!(layer.emptyEnd && layer.emptyEnd > lastEnd);
}
function removeExposures(layer, f) {
  const ks = layerKeys(layer);
  let changed = false;
  for (let i = ks.length - 1; i > 0; i--) {
    const prevEnd = frameEndOf(ks[i - 1], layer.frames[ks[i - 1]]);
    const gap = ks[i] - prevEnd - 1;
    if (gap > 0) {
      shiftKeys(layer, ks[i], -gap, true);
      changed = true;
    }
  }
  const rest = layerKeys(layer);
  const last = rest[rest.length - 1];
  const lastEnd = last != null ? frameEndOf(last, layer.frames[last]) : 0;
  if (layer.emptyEnd && layer.emptyEnd > lastEnd) {
    layer.emptyEnd = 0;
    changed = true;
  }
  return changed;
}
// Repeat Images: repeat the layer's drawings (or the marked range) count times.
function repeatImages(proj, layer, n, mode) {
  n = Math.max(1, Math.round(n || layer.repeatValue || 2));
  mode = mode || layer.repeatMode || "Loop";
  const ks = layerKeys(layer);
  if (!ks.length) return 0;
  const a = Math.max(1, Math.min(proj.inFrame || ks[0], ks[0]));
  const b = Math.min(layerEnd(layer), Math.max(proj.outFrame || layerEnd(layer), ks[ks.length - 1]));
  const seq = ks.filter(k => k >= a && k <= b).map(k => ({ exp: layer.frames[k].exposure || 1, src: layer.frames[k] }));
  if (!seq.length) return 0;
  // repeat the drawings (with their exposures), not the empty gaps between them
  const loopLen = seq.reduce((s, it) => s + it.exp, 0);
  const added = loopLen * (n - 1);
  shiftKeys(layer, b, added, false);
  let x = b + 1;
  for (let rep = 0; rep < n - 1; rep++) {
    let order = seq.slice();
    if (mode === "Ping-Pong" && (rep % 2 === 1)) order.reverse();
    if (mode === "Random") {
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    }
    order.forEach(it => {
      layer.frames[x] = { exposure: it.exp, canvas: it.src.canvas, id: uid(),
        role: it.src.role || null, name: it.src.name || null };
      x += it.exp;
    });
  }
  return added;
}
// Drag any cell/spine horizontally: the whole layer's exposure block slides.
// Live: one frame right moved every key and grew Project/Clip to the new end;
// dragging back restored the old range. The layer can never start before 1.
function slideLayer(layer, delta) {
  delta = Math.round(delta || 0);
  const ks = layerKeys(layer);
  if (!ks.length) return 0;
  delta = Math.max(1 - ks[0], delta);
  if (!delta) return 0;
  shiftKeys(layer, 0, delta, true);
  return delta;
}
function alignLayer(proj, layer, edge) {
  const ks = layerKeys(layer);
  if (!ks.length) return false;
  if (edge === "end") return slideLayer(layer, proj.outFrame - layerEnd(layer));
  return slideLayer(layer, 1 - ks[0]);
}
function setImageMark(layer, f, on) {
  layer.marks = layer.marks || {};
  if (on) layer.marks[Math.round(f)] = true; else delete layer.marks[Math.round(f)];
  return true;
}
function nextImageMark(layer, f, dir) {
  const ms = Object.keys(layer.marks || {}).map(Number).sort((a, b) => a - b);
  return dir < 0 ? (ms.filter(x => x < f).pop() ?? null) : (ms.find(x => x > f) ?? null);
}

// ---------- George subset for drawing ----------
const George = {
  tv_getapen: (p) => p.apen,
  tv_setapen: (p, c) => { p.apen = c; return "ok"; },
  tv_getbpen: (p) => p.bpen,
  tv_setbpen: (p, c) => { p.bpen = c; return "ok"; },
  tv_getactivetool: (p) => p.brush.kind,
  tv_pen: (p, kind) => { if (!BRUSHES.includes(kind)) return "bad tool"; p.brush.kind = kind; return "ok"; },
  tv_layercreate: (p, name) => { p.layers.push(newLayer(name || "Layer " + (p.layers.length + 1))); p.currentLayer = p.layers.length - 1; return "ok"; },
  tv_layerinfo: (p, i) => { const l = p.layers[i ?? p.currentLayer]; return `${l.name} visible=${l.visible} opacity=${l.opacity}`; },
  tv_framerate: (p, f) => { if (f) p.fps = +f; return String(p.fps); },
  tv_projectinfo: (p) => `${p.width} ${p.height} ${p.fps} ${p.inFrame} ${p.outFrame}`,
  tv_getwidth: (p) => String(p.width),
  tv_getheight: (p) => String(p.height),
  // brush parameter commands (REA strings: size %f, power %f, opacity %f,
  // hardness, grain %d, dry %d, smooth %d, tv_wet)
  tv_size: (p, v) => { if (v !== undefined) p.brush.size = +v; return String(p.brush.size); },
  tv_power: (p, v) => {
    if (v !== undefined) {
      const s = String(v), n = parseFloat(s);
      p.brush.power = s.includes("%") ? Math.max(0, Math.min(100, n)) / 100
        : Math.max(0, Math.min(1, n));
    }
    return String(p.brush.power);
  },
  tv_opacity: (p, v) => { if (v !== undefined) p.brush.opacity = Math.max(0, Math.min(1, +v)); return String(p.brush.opacity); },
  tv_hardness: (p, v) => { if (v !== undefined) p.brush.hardness = Math.max(0, Math.min(1, +v / 100)); return String(p.brush.hardness); },
  tv_dry: (p, v) => { if (v !== undefined) p.brush.drying = Math.max(0, +v); return String(p.brush.drying); },
  tv_grain: (p, v) => { if (v !== undefined) p.brush.grain = Math.max(0, Math.min(100, +v)) / 100; return String(p.brush.grain); },
  tv_smooth: (p, v) => { if (v !== undefined) p.smoothing = Math.max(0, Math.min(10, +v)); return String(p.smoothing); },
  tv_wet: (p, v) => { p.brush.kind = "wetbrush"; if (v !== undefined) p.brush.drying = Math.max(0, +v); return "wet on, drying " + p.brush.drying; },
  // camera commands (handler names from REA: tv_camerainfo etc.)
  tv_camerainfo: (p, f) => {
    const cam = cameraEvaluate(p, f ?? p.currentFrame);
    return `x ${cam.x.toFixed(2)} y ${cam.y.toFixed(2)} rotation ${cam.rotation.toFixed(2)} zoom ${cam.zoom.toFixed(3)}`;
  },
  tv_camerakey: (p, f, x, y, rotation, zoom) => {
    const k = setCameraKey(p, f ?? p.currentFrame,
      { x: +x || 0, y: +y || 0, rotation: +rotation || 0, zoom: +zoom || 1 });
    return `key set at ${k.frame}`;
  },
  // exposure commands (REA: tv_layerrecomputeexposure, tv_exposurebreak)
  tv_layerrecomputeexposure: (p, frame, count, value) => {
    const layer = p.layers[p.currentLayer];
    const ok = recomputeExposure(p, layer, frame, count, value);
    return ok ? "ok" : "no change";
  },
  tv_exposurebreak: (p, frame) => {
    const layer = p.layers[p.currentLayer];
    const ok = breakExposure(p, layer, frame);
    return ok ? "ok" : "no change";
  }
};

// ---------- project window zoom (captured live from TVPaint 12.1.0 Pro Demo) ----------
// The + / - buttons of the project window footer step along this ladder:
// 1 2 2.5 3.33 5 6.67 10 12.5 16.67 20 25 33.33 50 75 100 150 200 300 400 500
// 600 700 800 900 1000 1200 1400 1600 1800 2000 3000 4000 5000 10000 (%).
// The exact fractions are 1/100 1/50 1/40 1/30 1/20 1/15 1/10 1/8 1/6 1/5 1/4
// 1/3 1/2 3/4 1 3/2 2 3 4 5 6 7 8 9 10 12 14 16 18 20 30 40 50 100.
const ZOOM_LADDER = [1 / 100, 1 / 50, 1 / 40, 1 / 30, 1 / 20, 1 / 15, 1 / 10, 1 / 8,
  1 / 6, 1 / 5, 1 / 4, 1 / 3, 1 / 2, 3 / 4, 1, 3 / 2, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  12, 14, 16, 18, 20, 30, 40, 50, 100];
// The project view background of TVPaint 12 (measured live: 45,45,50).
const VIEW_BG = "#2d2d32";
// The camera overlay colour of TVPaint 12 (binary token "128 128 255 255").
const CAMERA_COL = "rgb(128,128,255)";
// When a camera is shown TVPaint dims the whole project view to 126/255 of its
// brightness (measured live: white paper 255 -> 126, viewport 45,45,50 ->
// 22,22,24) and keeps the camera field of view at full brightness.
const CAMERA_DIM = 126 / 255;
// Next / previous ladder value.  dir = +1 zooms in, -1 zooms out.
function zoomStep(zoom, dir) {
  const eps = 1e-9;
  let i = ZOOM_LADDER.findIndex(v => Math.abs(v - zoom) < 1e-6);
  if (i < 0) {
    if (dir > 0) {
      i = ZOOM_LADDER.findIndex(v => v > zoom + eps);
      if (i < 0) i = ZOOM_LADDER.length - 1;
    } else {
      i = 0;
      for (let j = 0; j < ZOOM_LADDER.length; j++) if (ZOOM_LADDER[j] < zoom - eps) i = j;
    }
  } else i = Math.max(0, Math.min(ZOOM_LADDER.length - 1, i + dir));
  return ZOOM_LADDER[i];
}
// "Fit": the largest ladder value that still shows the whole drawing area.
function fitZoom(needed, maxZoom) {
  const cap = maxZoom === undefined ? 1 : maxZoom;
  let z = ZOOM_LADDER[0];
  for (const v of ZOOM_LADDER) if (v <= needed + 1e-9 && v <= cap) z = v;
  return z;
}

// exports
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BRUSHES, DRAW_MODES, SHAPES, LAYER_LOOP_MODES, XSHEET_OPS,
    BRUSH_PROFILES, brushDefaults, activateToolBrush, gradientFill,
    ZOOM_LADDER, VIEW_BG, CAMERA_COL, CAMERA_DIM, zoomStep, fitZoom,
    newCameraKey, cameraEvaluate, cameraRect, cameraKeyAt, setCameraKey, moveCameraKey,
    bakeCameraIntoLayers, renderCameraFrames,
    layerLengthOp,
    newProject, newLayer, newFrame, frameSurface, makeSurface,
    resizeProject,
    brushStamp, strokeBegin, strokeMove, strokeEnd,
    floodFill, pickColor, xsheetOp, makeHistory, effectiveFrameKey, reverseSelectedImages,
    serializeProject, deserializeProject, George, colorWithAlpha,
    recomputeExposure, breakExposure, splitExposure, rippleExposure,
    trimExposureStart, cloneSurface, projectMaxEnd, syncProjectOut,
    IMAGE_ROLES, BLEND_MODES, frameEndOf, layerKeys, layerEnd, shiftKeys,
    insertImages, duplicateImages, deleteImageAt, deleteFrameColumn,
    setExposureValue, removeExposures, layerHasGaps, repeatImages, slideLayer, alignLayer,
    reverseSelectedImages, addExposureAt, moveLayerTo, moveLayerBy, moveLayersTo,
    bringLayersTogether, reverseLayerOrder,
    setImageMark, nextImageMark
  };
}
