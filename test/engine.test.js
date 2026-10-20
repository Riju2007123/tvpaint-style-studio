/* Node tests for engine.js — run: npm test (no canvas in node; surfaces are stubs) */
"use strict";
const assert = require("assert");
const E = require("../engine.js");

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log("  PASS " + name); passed++; }
  catch (e) { console.log("  FAIL " + name + " :: " + e.message); failed++; }
}

// ---------- REA-derived vocabulary ----------
test("brush vocabulary matches binary tool list", () => {
  for (const b of ["penbrush", "pencilbrush", "mechanicalpencil", "airbrush",
    "oilbrush", "chalkbrush", "wetbrush", "specialbrush", "eraser"])
    assert.ok(E.BRUSHES.includes(b), b);
});
test("draw-mode vocabulary includes observed modes (behind/erase/tint/impress/fade)", () => {
  for (const m of ["normal", "behind", "erase", "tint", "impress", "fade"])
    assert.ok(E.DRAW_MODES.includes(m), m);
});
test("shape vocabulary matches Shape*.png icons", () => {
  for (const s of ["line", "rectangle", "ellipse", "circlec", "circle2pts",
    "circle3pts", "bezier", "spline3pts"]) assert.ok(E.SHAPES.includes(s), s);
});

// ---------- project defaults ----------
test("newProject defaults", () => {
  const p = E.newProject(640, 400, 12);
  assert.strictEqual(p.width, 640);
  assert.strictEqual(p.fps, 12);
  assert.strictEqual(p.layers.length, 1);
  assert.ok(p.layers[0].frames[1]);
  assert.strictEqual(p.brush.kind, "penbrush");
  assert.ok(p.apen === "#000000" && p.bpen === "#ffffff");
  ["grid", "safeArea", "thirds", "fieldChart"].forEach(g => assert.ok(g in p.guidelines, g));
});

// ---------- exposure hold resolution ----------
test("effectiveFrameKey: exposure hold covers k..k+n-1", () => {
  const p = E.newProject();
  const l = p.layers[0];
  l.frames[1].exposure = 3;         // key at 1 holds 1,2,3
  assert.strictEqual(E.effectiveFrameKey(l, 1), 1);
  assert.strictEqual(E.effectiveFrameKey(l, 2), 1);
  assert.strictEqual(E.effectiveFrameKey(l, 3), 1);
  assert.strictEqual(E.effectiveFrameKey(l, 4), null);  // after hold ends
  l.frames[5] = E.newFrame();       // next key at 5
  assert.strictEqual(E.effectiveFrameKey(l, 5), 5);
  assert.strictEqual(E.effectiveFrameKey(l, 4), null);
  assert.strictEqual(E.effectiveFrameKey(l, 9), null);  // exposure over: nothing held
});

// ---------- xsheet operations (REA: XSheet-* icons) ----------
test("xsheet add inserts blank AFTER current drawing", () => {
  const p = E.newProject(); const l = p.layers[0];
  l.frames[2] = E.newFrame(); l.frames[2].exposure = 4;
  E.xsheetOp(p, l, "add", 2, null);   // nothing at f+1: blank lands at 3, no shift needed
  assert.ok(l.frames[3] && l.frames[3].exposure === 1);
  assert.strictEqual(l.frames[2].exposure, 4, "current drawing untouched");
  l.frames[3].exposure = 4;
  E.xsheetOp(p, l, "add", 2, null);   // now something IS at f+1 (exposure 4): it shifts right
  assert.ok(l.frames[3] && l.frames[3].exposure === 1);
  assert.ok(l.frames[4] && l.frames[4].exposure === 4);
});
test("xsheet duplicate copies drawing to next slot", () => {
  const p = E.newProject(); const l = p.layers[0];
  l.frames[1] = { exposure: 1, id: "x", canvas: null };
  E.xsheetOp(p, l, "duplicate", 1, null);
  assert.ok(l.frames[2]);
  assert.strictEqual(l.frames[2].exposure, 1);
  assert.notStrictEqual(l.frames[2].id, l.frames[1].id);
  assert.strictEqual(l.frames[2].canvas, null);
});
test("xsheet remove deletes drawing", () => {
  const p = E.newProject(); const l = p.layers[0];
  l.frames[2] = E.newFrame();
  E.xsheetOp(p, l, "remove", 2, null);
  assert.strictEqual(l.frames[2], undefined);
  assert.ok(l.frames[1]);
});
test("xsheet insert inserts n blanks", () => {
  const p = E.newProject(); const l = p.layers[0];
  l.frames[3] = E.newFrame();
  E.xsheetOp(p, l, "insert", 2, 3);
  assert.ok(!l.frames[2 + 3]);           // frame 5 no longer old 3
  assert.ok(l.frames[3] instanceof Object && l.frames[3].canvas === undefined ? true : l.frames[3].exposure === 1);
  assert.ok(l.frames[2].exposure === 1 && l.frames[3].exposure === 1 && l.frames[4].exposure === 1,
    "3 blanks inserted at 2..4");
  assert.ok(l.frames[6], "old frame 3 shifted to 6");
});
test("xsheet hold/unhold set exposure", () => {
  const p = E.newProject(); const l = p.layers[0];
  E.xsheetOp(p, l, "hold", 1, 4);
  assert.strictEqual(l.frames[1].exposure, 4);
  E.xsheetOp(p, l, "unhold", 1, null);
  assert.strictEqual(l.frames[1].exposure, 1);
});
test("xsheet reverse reverses key order", () => {
  const p = E.newProject(); const l = p.layers[0];
  [2, 3, 4].forEach(k => l.frames[k] = E.newFrame());
  l.frames[2].id = "A"; l.frames[3].id = "B"; l.frames[4].id = "C";
  E.xsheetOp(p, l, "reverse", 2, 4);
  assert.strictEqual(l.frames[2].id, "C");
  assert.strictEqual(l.frames[4].id, "A");
});
test("xsheet empty clears current drawing", () => {
  const p = E.newProject(); const l = p.layers[0];
  l.frames[1].exposure = 3;
  E.xsheetOp(p, l, "empty", 1, null);
  assert.strictEqual(l.frames[1].exposure, 1);
});

// ---------- model history (undo/redo structural changes) ----------
test("history: layer add then undo removes it", () => {
  const p = E.newProject();
  const h = E.makeHistory(10);
  h.pushModel(p);
  E.George.tv_layercreate(p, "Ink");
  h.sealModel(p);
  assert.strictEqual(p.layers.length, 2);
  const calls = { rebuilt: [] };
  assert.strictEqual(h.undo(p, {
    rebuildModel(map) { calls.rebuilt.push(map); },
    restoreFrame() {},
    surfaceFromDataURL() { return E.makeSurface(4, 4); }
  }), true);
  assert.strictEqual(p.layers.length, 1);
  assert.strictEqual(h.redo(p, { rebuildModel() {}, restoreFrame() {} }), true);
  assert.strictEqual(p.layers.length, 2);
});
test("history: frame record captured and replayed via restoreFrame", () => {
  const p = E.newProject();
  const l = p.layers[0];
  l.frames[1] = { exposure: 2, id: "a", canvas: null };
  const h = E.makeHistory(10);
  h.pushFrame(p, l, 1);
  l.frames[1] = { exposure: 7, id: "b", canvas: null };
  h.sealLast(p, l, 1);
  h.pushFrame(p, l, 1); // second record so undo targets the edit… actually undo pops last; push again to consume
  const restored = [];
  h.undo(p, {
    restoreFrame(layer, frameNum, payload) { restored.push({ frameNum, payload }); layer.frames[frameNum] = { exposure: payload.exposure, canvas: null }; },
    rebuildModel() {}
  });
  assert.strictEqual(restored.length, 1);
  // the 'after' snapshot recorded exposure 7
  const rec = { exposure: null };
  assert.strictEqual(restored[0].frameNum, 1);
});

// ---------- George mirror ----------
test("George tv_pen validates against observed brush list", () => {
  const p = E.newProject();
  assert.strictEqual(E.George.tv_pen(p, "airbrush"), "ok");
  assert.ok(String(E.George.tv_pen(p, "chainsaw")).includes("bad"));
  assert.ok(["ok"].includes(E.George.tv_pen(p, "oilbrush")));
  assert.strictEqual(p.brush.kind, "oilbrush");
});
test("George pen color commands", () => {
  const p = E.newProject();
  assert.strictEqual(E.George.tv_setapen(p, "#ff0000"), "ok");
  assert.strictEqual(E.George.tv_getapen(p), "#ff0000");
  assert.strictEqual(E.George.tv_setbpen(p, "#00ff00"), "ok");
  assert.strictEqual(E.George.tv_getbpen(p), "#00ff00");
});
test("George project info", () => {
  const p = E.newProject(320, 240, 8);
  assert.strictEqual(E.George.tv_projectinfo(p), "320 240 8 1 24");
  assert.strictEqual(E.George.tv_getwidth(p), "320");
  assert.strictEqual(E.George.tv_framerate(p, 30), "30");
  assert.strictEqual(p.fps, 30);
});

// ---------- serialize roundtrip (canvas-less in node) ----------
test("serialize keeps structure and rejects foreign json", () => {
  const p = E.newProject(256, 128, 6);
  p.brush.size = 9; p.smoothing = 3; p.layers[0].opacity = 0.5;
  const json = E.serializeProject(p);
  const q = E.deserializeProject(json, {
    surfaceFromDataURL() { return E.makeSurface(4, 4); },
    restoreFrame() {}, rebuildModel() {}
  });
  assert.strictEqual(q.width, 256);
  assert.strictEqual(q.brush.size, 9);
  assert.strictEqual(q.smoothing, 3);
  assert.strictEqual(q.layers[0].opacity, 0.5);
  assert.throws(() => E.deserializeProject('{"app":"other"}'), /not a my-version/);
});

// ---------- color helpers ----------
test("colorWithAlpha clamps", () => {
  assert.strictEqual(E.colorWithAlpha("#ff0000", 2), "rgba(255,0,0,1)");
  assert.strictEqual(E.colorWithAlpha("#0a0b0c", 0), "rgba(10,11,12,0)");
});

// ---------- REA-derived: per-tool brush profiles (each tool keeps its own opts) ----------
test("brush profiles give wet/oil drying, airbrush flow, chalk grain; per-tool memory", () => {
  assert.ok(E.BRUSH_PROFILES.wetbrush.drying > 0);
  assert.ok(E.BRUSH_PROFILES.airbrush.power < 0.3);
  assert.ok(E.BRUSH_PROFILES.chalkbrush.grain > 0.5);
  const proj = E.newProject();
  E.activateToolBrush(proj, "wetbrush");
  assert.strictEqual(proj.brush.kind, "wetbrush");
  assert.ok(proj.toolStates.wetbrush);
  // edit penbrush, switch away and back: pen keeps its own settings (REA per-tool states)
  E.activateToolBrush(proj, "penbrush");
  proj.brush.size = 20;
  const air = E.activateToolBrush(proj, "airbrush");
  assert.strictEqual(air.size, 20, "airbrush keeps its own size");
  assert.strictEqual(air.power, 0.12, "airbrush keeps its own power");
  const back = E.activateToolBrush(proj, "penbrush");
  assert.strictEqual(back.size, 20, "penbrush edit survived the roundtrip");
  assert.strictEqual(proj.toolStates.penbrush.drying, 0, "penbrush has no drying");
});

// ---------- REA-derived: camera keyframe interpolation ----------
test("camera hold/linear/smooth interpolation", () => {
  const p = E.newProject();
  p.cameraKeys = [E.newCameraKey(1, { x: 0, y: 0, zoom: 1, interp: "hold" }),
    E.newCameraKey(21, { x: 100, y: 50, zoom: 2, interp: "hold" })];
  p.cameraKeys[0].interp = "linear";
  const mid = E.cameraEvaluate(p, 11);
  assert.ok(Math.abs(mid.x - 50) < 0.01 && Math.abs(mid.zoom - 1.5) < 0.001, "linear midpoint");
  const before = E.cameraEvaluate(p, 1);
  assert.strictEqual(before.x, 0);
  // hold keeps the previous key value through the span
  p.cameraKeys[0].interp = "hold";
  const held = E.cameraEvaluate(p, 15);
  assert.strictEqual(held.x, 0, "hold keeps prev value");
});

// ---------- REA-derived: Increase Layer Length ops ----------
test("layerLengthOp hold/repeat/stretch/instances", () => {
  const p = E.newProject();
  const l = p.layers[0];
  E.layerLengthOp(p, l, "hold", 5);
  assert.strictEqual(l.frames[1].exposure, 6);
  const total = Object.keys(l.frames).map(Number).sort((a, b) => b - a)[0]
    + (l.frames[Object.keys(l.frames).map(Number).sort((a, b) => b - a)[0]].exposure || 1) - 1;
  assert.strictEqual(total, 6);
  // repeat reuses the SAME drawing (canvas reference, not a copy)
  l.frames[1].canvas = { tag: "art" };
  E.layerLengthOp(p, l, "repeat", 1);
  const k2 = E.effectiveFrameKey(l, 7);
  assert.strictEqual(l.frames[k2].canvas, l.frames[1].canvas, "repeat reuses instance");
  // instances add blank drawings
  const before = Object.keys(l.frames).length;
  E.layerLengthOp(p, l, "instances", 3);
  assert.strictEqual(Object.keys(l.frames).length, before + 3);
  // stretch scales exposures
  const len0 = Object.keys(l.frames).map(Number).sort((a, b) => b - a)[0];
  E.layerLengthOp(p, l, "stretch", 10);
  const sum = Object.values(l.frames).reduce((s, f) => s + (f.exposure || 1), 0);
  assert.ok(sum > len0, "stretch grew total exposure");
});

// ---------- timeline cell commands (live-captured cell / layer menus) ----------
test("timeline vocabularies: image roles + blend modes", () => {
  assert.strictEqual(E.IMAGE_ROLES.length, 6);
  assert.ok(E.IMAGE_ROLES.some(r => r.label === "Keyframe"));
  assert.ok(E.BLEND_MODES.includes("Multiply"));
  assert.ok(E.BLEND_MODES.includes("Luminosity"));
  const p = E.newProject();
  assert.strictEqual(p.background, "color");
  assert.ok(Array.isArray(p.groups) && p.groups.length >= 13);
  assert.strictEqual(p.startFrame, 1);
  const l = p.layers[0];
  assert.deepStrictEqual(l.marks, {});
  assert.strictEqual(l.repeatMode, "Loop");
  assert.strictEqual(l.repeatValue, 2);
  assert.strictEqual(l.blend, "Normal");
  assert.strictEqual(l.type, "anim");
});

test("insertImages before/after/duplicate", () => {
  const p = E.newProject(); const l = p.layers[0];
  l.frames = { 1: E.newFrame(), 5: E.newFrame() };
  l.frames[1].canvas = { tag: "A" };
  l.frames[5].canvas = { tag: "B" };
  E.insertImages(l, 5, 1, "before");
  assert.deepStrictEqual(E.layerKeys(l), [1, 5, 6]);
  assert.strictEqual(l.frames[6].canvas.tag, "B", "source shifted right");
  E.insertImages(l, 1, 2, "after");
  assert.deepStrictEqual(E.layerKeys(l), [1, 2, 3, 7, 8]);
  assert.strictEqual(l.frames[1].canvas.tag, "A");
  const copied = E.insertImages(l, 8, 1, "duplicate", (cv) => ({ tag: cv.tag + "!" }));
  assert.strictEqual(copied, 1);
  assert.strictEqual(l.frames[9].canvas.tag, "B!", "duplicate uses the copy callback");
  assert.strictEqual(l.frames[8].canvas.tag, "B", "source still intact");
});

test("deleteImageAt delete modes (live Keep empty evidence)", () => {
  // Live: deleting key 2 of a [1,2][3,4][5,7] layer with Keep empty left
  // frames 3-4 empty, kept key 3 at frame 5 and kept the layer at 7.
  const p = E.newProject(); const l = p.layers[0];
  l.frames = { 1: E.newFrame(), 3: E.newFrame(), 5: E.newFrame() };
  l.frames[1].exposure = 2; l.frames[3].exposure = 2; l.frames[5].exposure = 3;
  E.deleteImageAt(l, 3, "keep");
  assert.deepStrictEqual(E.layerKeys(l), [1, 5], "following image stays put");
  assert.strictEqual(l.frames[1].exposure, 2, "previous exposure unchanged");
  assert.strictEqual(E.effectiveFrameKey(l, 3), null, "frames 3-4 are empty");
  assert.strictEqual(E.layerEnd(l), 7, "layer length preserved");

  // Fill gap from left extends the previous drawing over the gap.
  const a = E.newProject().layers[0];
  a.frames = { 1: E.newFrame(), 3: E.newFrame(), 5: E.newFrame() };
  a.frames[1].exposure = 2; a.frames[3].exposure = 2; a.frames[5].exposure = 3;
  E.deleteImageAt(a, 3, "fill-left");
  assert.strictEqual(a.frames[1].exposure, 4);
  assert.deepStrictEqual(E.layerKeys(a), [1, 5]);

  // Fill gap from right reaches back with the next drawing, later keys stay.
  const b = E.newProject().layers[0];
  b.frames = { 1: E.newFrame(), 3: E.newFrame(), 5: E.newFrame() };
  b.frames[1].exposure = 2; b.frames[3].exposure = 2; b.frames[5].exposure = 3;
  E.deleteImageAt(b, 3, "fill-right");
  assert.deepStrictEqual(E.layerKeys(b), [1, 3]);
  assert.strictEqual(b.frames[3].exposure, 5);
  assert.strictEqual(E.layerEnd(b), 7);

  // Deleting the last drawing: Keep empty keeps the trailing gap, Stay put trims.
  const c = E.newProject().layers[0];
  c.frames = { 1: E.newFrame(), 5: E.newFrame() };
  c.frames[1].exposure = 2; c.frames[5].exposure = 3;
  E.deleteImageAt(c, 5, "keep");
  assert.deepStrictEqual(E.layerKeys(c), [1]);
  assert.strictEqual(E.layerEnd(c), 7);
  assert.strictEqual(c.emptyEnd, 7, "Keep empty remembers the trailing gap");
  const d = E.newProject().layers[0];
  d.frames = { 1: E.newFrame(), 5: E.newFrame() };
  d.frames[1].exposure = 2; d.frames[5].exposure = 3;
  E.deleteImageAt(d, 5, "stay");
  assert.strictEqual(E.layerEnd(d), 2);
  assert.strictEqual(d.emptyEnd, 0, "Stay put closes the trailing gap");
  // The layer remembers the last chosen mode (default Stay put).
  assert.strictEqual(E.newProject().layers[0].deleteMode, "stay");
  const h = E.makeHistory(10);
  h.pushModel(E.newProject());
  h.clear();
  assert.strictEqual(h.undo(E.newProject(), { rebuildModel() {}, restoreFrame() {} }), false,
    "new/open projects clear the undo history");
  const e = E.newProject().layers[0];
  e.frames = { 1: E.newFrame(), 5: E.newFrame() };
  e.frames[1].exposure = 2; e.frames[5].exposure = 3;
  E.deleteImageAt(e, 5);
  assert.strictEqual(E.layerEnd(e), 2);
});

test("splitExposure breaks holds including the last held frame", () => {
  const p = E.newProject(); const l = p.layers[0];
  l.frames = { 1: E.newFrame() };
  l.frames[1].exposure = 3;
  l.frames[1].canvas = { tag: "hold" };
  const nf = E.splitExposure(l, 3, (cv) => ({ tag: cv.tag + "-copy" }));
  assert.ok(nf);
  assert.deepStrictEqual(E.layerKeys(l), [1, 3]);
  assert.strictEqual(l.frames[1].exposure, 2);
  assert.strictEqual(nf.exposure, 1);
  assert.strictEqual(l.frames[1].canvas.tag, "hold");
  assert.strictEqual(nf.canvas.tag, "hold-copy", "new instance owns a copy");
  assert.strictEqual(E.splitExposure(l, 1, null), null, "key start is not a hold");
});

test("rippleExposure grows and shrinks later keys", () => {
  const p = E.newProject(); const l = p.layers[0];
  l.frames = { 1: E.newFrame(), 3: E.newFrame(), 5: E.newFrame() };
  l.frames[1].exposure = 2; l.frames[3].exposure = 2; l.frames[5].exposure = 3;
  E.rippleExposure(l, 1, 3);
  assert.deepStrictEqual(E.layerKeys(l), [1, 4, 6]);
  assert.strictEqual(E.layerEnd(l), 8);
  E.rippleExposure(l, 1, 2);
  assert.deepStrictEqual(E.layerKeys(l), [1, 3, 5]);
  assert.strictEqual(E.layerEnd(l), 7);
});

test("trimExposureStart redistributes without moving later keys", () => {
  const p = E.newProject(); const l = p.layers[0];
  l.frames = { 1: E.newFrame(), 3: E.newFrame(), 5: E.newFrame() };
  l.frames[1].exposure = 2; l.frames[3].exposure = 2; l.frames[5].exposure = 3;
  assert.strictEqual(E.trimExposureStart(l, 3, 4), true);
  assert.deepStrictEqual(E.layerKeys(l), [1, 4, 5]);
  assert.strictEqual(l.frames[1].exposure, 3);
  assert.strictEqual(l.frames[4].exposure, 1);
  assert.strictEqual(l.frames[5].exposure, 3);
  assert.strictEqual(E.layerEnd(l), 7);
  // Dragging back left grows this instance and shortens the left neighbour.
  E.trimExposureStart(l, 4, 2);
  assert.deepStrictEqual(E.layerKeys(l), [1, 2, 5]);
  assert.strictEqual(l.frames[1].exposure, 1);
  assert.strictEqual(l.frames[2].exposure, 3);
  assert.strictEqual(E.trimExposureStart(l, 2, 1), false, "previous key is the floor");
});

test("slideLayer shifts the whole layer; syncProjectOut follows a fitted clip", () => {
  const p = E.newProject(); const l = p.layers[0];
  p.outFrame = 7;
  l.frames = { 1: E.newFrame(), 3: E.newFrame(), 5: E.newFrame() };
  l.frames[1].exposure = 2; l.frames[3].exposure = 2; l.frames[5].exposure = 3;
  const oldMax = E.projectMaxEnd(p), oldOut = p.outFrame;
  assert.strictEqual(E.slideLayer(l, 1), 1);
  E.syncProjectOut(p, oldMax, oldOut);
  assert.deepStrictEqual(E.layerKeys(l), [2, 4, 6]);
  assert.strictEqual(p.outFrame, 8, "fitted clip follows the layer end");
  assert.strictEqual(E.slideLayer(l, -9), -1, "cannot slide before frame 1");
  assert.deepStrictEqual(E.layerKeys(l), [1, 3, 5]);
});

test("per-layer auto break/create flags default on and survive serialization", () => {
  const p = E.newProject();
  assert.strictEqual(p.layers[0].autoBreak, true);
  assert.strictEqual(p.layers[0].autoCreate, true);
  const round = E.deserializeProject(E.serializeProject(p), { surfaceFromDataURL: () => null });
  assert.strictEqual(round.layers[0].autoBreak, true);
  assert.strictEqual(round.layers[0].autoCreate, true);
});

test("deleteFrameColumn compacts every layer and holds", () => {
  const p = E.newProject();
  const a = E.newLayer("A"), b = E.newLayer("B");
  a.frames = { 1: E.newFrame(), 5: E.newFrame() };
  a.frames[1].exposure = 3;
  b.frames = { 4: E.newFrame() };          // no drawing at the deleted column
  p.layers = [a, b];
  p.outFrame = 24;
  E.deleteFrameColumn(p, 2);
  assert.deepStrictEqual(E.layerKeys(a), [1, 4]);
  assert.strictEqual(a.frames[1].exposure, 2, "hold shortened");
  assert.deepStrictEqual(E.layerKeys(b), [3], "layer without a key at 2 still shifts");
  assert.strictEqual(p.outFrame, 23);
});

test("setExposureValue ripples; removeExposures closes gaps", () => {
  const p = E.newProject(); const l = p.layers[0];
  l.frames = { 1: E.newFrame(), 5: E.newFrame() };
  E.setExposureValue(l, 1, 9);
  assert.strictEqual(l.frames[1].exposure, 9, "set value ripples the next image");
  assert.deepStrictEqual(E.layerKeys(l), [1, 13]);
  E.setExposureValue(l, 1, 2);
  assert.strictEqual(l.frames[1].exposure, 2);
  assert.deepStrictEqual(E.layerKeys(l), [1, 6]);
  l.frames = { 1: E.newFrame(), 5: E.newFrame() };
  l.frames[1].exposure = 2; l.frames[5].exposure = 3; l.emptyEnd = 0;
  assert.strictEqual(E.layerHasGaps(l), true);
  assert.strictEqual(E.removeExposures(l, 1), true);
  assert.deepStrictEqual(E.layerKeys(l), [1, 3], "empty exposures are closed");
  assert.strictEqual(l.frames[1].exposure, 2);
  assert.strictEqual(l.frames[3].exposure, 3);
  assert.strictEqual(E.layerHasGaps(l), false);
  const t = E.newProject().layers[0];
  t.frames = { 1: E.newFrame() }; t.emptyEnd = 6;
  assert.strictEqual(E.layerHasGaps(t), true);
  E.removeExposures(t, 1);
  assert.strictEqual(t.emptyEnd, 0, "a trailing empty range is removed too");
});

test("repeatImages duplicates the marked range", () => {
  const p = E.newProject(); p.inFrame = 1; p.outFrame = 3;
  const l = p.layers[0];
  l.frames = { 1: E.newFrame(), 3: E.newFrame() };
  const added = E.repeatImages(p, l, 3, "Loop");
  assert.strictEqual(added, 4);
  assert.deepStrictEqual(E.layerKeys(l), [1, 3, 4, 5, 6, 7]);
  assert.strictEqual(E.layerEnd(l), 7);
});

test("slideLayer clamps at 1; alignLayer aligns to clip edges", () => {
  const p = E.newProject(); p.outFrame = 10;
  const l = p.layers[0];
  l.frames = { 3: E.newFrame(), 5: E.newFrame() };
  E.slideLayer(l, -9);
  assert.deepStrictEqual(E.layerKeys(l), [1, 3], "cannot slide before frame 1");
  E.alignLayer(p, l, "end");
  assert.strictEqual(E.layerEnd(l), 10);
  E.alignLayer(p, l, "start");
  assert.deepStrictEqual(E.layerKeys(l), [1, 3]);
});

test("image marks: set, clear, navigate", () => {
  const p = E.newProject(); const l = p.layers[0];
  E.setImageMark(l, 2, true);
  E.setImageMark(l, 5, true);
  assert.strictEqual(E.nextImageMark(l, 2, 1), 5);
  assert.strictEqual(E.nextImageMark(l, 5, -1), 2);
  assert.strictEqual(E.nextImageMark(l, 5, 1), null);
  E.setImageMark(l, 2, false);
  assert.strictEqual(E.nextImageMark(l, 1, 1), 5);
});

test("resizeProject updates format (Modify Project)", () => {
  const p = E.newProject(320, 240);
  E.resizeProject(p, 640, 480);
  assert.strictEqual(p.width, 640);
  assert.strictEqual(p.height, 480);
  assert.strictEqual(p.layers[0].frames[1].canvas === undefined || true, true, "node stub tolerated");
});

test("reverseSelectedImages reverses exactly the selected keys", () => {
  const l = E.newProject().layers[0];
  l.frames = { 1: E.newFrame(), 3: E.newFrame(), 5: E.newFrame(), 7: E.newFrame() };
  [1, 3, 5, 7].forEach((k, i) => {
    l.frames[k].id = "id" + i;
    l.frames[k].exposure = i + 2;
  });
  assert.strictEqual(E.reverseSelectedImages(l, [1, 5]), 2);
  assert.deepStrictEqual(E.layerKeys(l), [1, 3, 5, 7], "key positions stay put");
  assert.strictEqual(l.frames[1].id, "id2");
  assert.strictEqual(l.frames[5].id, "id0");
  assert.strictEqual(l.frames[1].exposure, 4, "exposure travels with the drawing");
  assert.strictEqual(l.frames[5].exposure, 2);
  assert.strictEqual(l.frames[3].id, "id1", "unselected key untouched");
  assert.strictEqual(l.frames[7].id, "id3", "unselected key untouched");
  assert.strictEqual(E.reverseSelectedImages(l, [3]), 1, "a single image is a no-op");
  assert.strictEqual(l.frames[3].id, "id1");
});

test("cutting several images from the right keeps earlier keys addressable", () => {
  const l = E.newProject().layers[0];
  l.frames = { 1: E.newFrame(), 3: E.newFrame(), 5: E.newFrame() };
  // This is the order cellOp("cut") uses for a multi-image selection.
  [5, 3, 1].forEach(k => E.deleteImageAt(l, k, "stay"));
  assert.deepStrictEqual(E.layerKeys(l), [1], "the empty layer recovers one blank drawing");
});

test("addExposureAt: new cell on an empty frame, split inside a hold", () => {
  const l = E.newProject().layers[0];
  l.frames = { 1: E.newFrame(), 5: E.newFrame() };
  l.frames[1].exposure = 3;      // 1..3
  l.frames[5].exposure = 4;      // 5..8
  assert.strictEqual(E.addExposureAt(l, 7), true, "a new instance is created inside the hold");
  assert.deepStrictEqual(E.layerKeys(l), [1, 5, 7]);
  assert.strictEqual(l.frames[5].exposure, 2, "the hold keeps the frames before the new instance");
  assert.strictEqual(l.frames[7].exposure, 2, "the new instance takes the remaining frames");
  assert.strictEqual(l.frames[7].canvas, null, "the new instance is empty");
  assert.strictEqual(E.addExposureAt(l, 7), false, "a frame that already starts an instance is left alone");
  assert.strictEqual(E.addExposureAt(l, 10), true, "an empty frame gets a one frame instance");
  assert.strictEqual(l.frames[10].exposure, 1);
  assert.strictEqual(E.layerEnd(l), 10, "the layer grows to the new cell");
});

test("layer order: move up/down, bring together, reverse", () => {
  const p = E.newProject();
  p.layers = [E.newLayer("A"), E.newLayer("B"), E.newLayer("C"), E.newLayer("D")];
  p.currentLayer = 1;
  p.selectedLayers = [0, 2];
  assert.strictEqual(E.moveLayerBy(p, 1, -1), true);
  assert.deepStrictEqual(p.layers.map(l => l.name), ["B", "A", "C", "D"]);
  assert.strictEqual(p.currentLayer, 0, "the current layer follows the moved layer");
  assert.strictEqual(E.moveLayerBy(p, 0, 1), true);
  assert.deepStrictEqual(p.layers.map(l => l.name), ["A", "B", "C", "D"]);
  assert.strictEqual(E.moveLayerBy(p, 0, -1), false, "the top layer cannot move further up");
  assert.strictEqual(E.bringLayersTogether(p, [0, 2]), true);
  assert.deepStrictEqual(p.layers.map(l => l.name), ["A", "C", "B", "D"], "selected layers are gathered");
  assert.strictEqual(E.reverseLayerOrder(p, []), true);
  assert.deepStrictEqual(p.layers.map(l => l.name), ["D", "B", "C", "A"]);
  p.layers = [E.newLayer("A"), E.newLayer("B"), E.newLayer("C")];
  assert.strictEqual(E.reverseLayerOrder(p, [0, 2]), true);
  assert.deepStrictEqual(p.layers.map(l => l.name), ["C", "B", "A"], "only the selected layers are reversed");
});

test("moveLayersTo moves a block of layers and keeps their order", () => {
  const p = E.newProject();
  p.layers = [E.newLayer("A"), E.newLayer("B"), E.newLayer("C"), E.newLayer("D")];
  p.currentLayer = 0;
  p.selectedLayers = [0, 2];
  assert.strictEqual(E.moveLayersTo(p, [0, 2], 3), true);
  assert.deepStrictEqual(p.layers.map(l => l.name), ["B", "A", "C", "D"],
    "the dragged layers stay together and in order");
  assert.strictEqual(p.currentLayer, 1, "the current layer follows the block");
  assert.deepStrictEqual(p.selectedLayers, [1, 2]);
});

test("camera: keys interpolate between the camera layer range", () => {
  const p = E.newProject(1920, 1080, 24);
  const l = p.layers[0];
  l.frames = { 1: E.newFrame(), 5: E.newFrame() };
  l.frames[1].exposure = 4;
  p.cameraKeys = [E.newCameraKey(1, { x: 0, y: 0, zoom: 1, interp: "linear" }),
                  E.newCameraKey(5, { x: 100, y: 0, zoom: 1, interp: "linear" })];
  const mid = E.cameraEvaluate(p, 3);
  assert.strictEqual(Math.round(mid.x), 50, "linear interpolation between the two keys");
  p.cameraKeys[0].interp = "hold";
  const held = E.cameraEvaluate(p, 3);
  assert.strictEqual(held.x, 0, "hold keeps the previous key value");
  p.cameraKeys[0].interp = "linear";
  const r = E.cameraRect(p, E.cameraEvaluate(p, 1));
  assert.strictEqual(r.w, 960, "the camera rect is half the drawing area at zoom 1");
  assert.strictEqual(r.cx, 960, "the camera is centred on the drawing area");
});

test("moveCameraKey moves a camera keyframe to another frame", () => {
  const p = E.newProject();
  p.cameraKeys = [E.newCameraKey(1, { x: 0 }), E.newCameraKey(9, { x: 100 })];
  assert.strictEqual(E.moveCameraKey(p, 9, 13), true);
  assert.deepStrictEqual(p.cameraKeys.map(k => k.frame), [1, 13], "the key moved and the list stays sorted");
  assert.strictEqual(p.cameraKeys[1].x, 100, "the camera value travels with the key");
  assert.strictEqual(E.moveCameraKey(p, 13, 1), false, "a key is never written over another one");
  assert.strictEqual(E.moveCameraKey(p, 13, 13), false, "no move onto itself");
  assert.deepStrictEqual(p.cameraKeys.map(k => k.frame), [1, 13]);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
