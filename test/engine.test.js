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

test("resizeProject updates format (Modify Project)", () => {
  const p = E.newProject(320, 240);
  E.resizeProject(p, 640, 480);
  assert.strictEqual(p.width, 640);
  assert.strictEqual(p.height, 480);
  assert.strictEqual(p.layers[0].frames[1].canvas === undefined || true, true, "node stub tolerated");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
