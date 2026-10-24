/* one-off: make the Camera tool behave like the live one
   - the profile's four corner handles SCALE the field of view
   - the centre / inside drags the camera
   - Lock All and the per-axis padlocks stop the canvas drag
   - every canvas move / scale is one undo step
   - the panel fields key the channel they belong to
   - the FOV punch-out never spills outside the drawing area
*/
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "ui.js");
let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
const N = (s) => s.replace(/\r?\n/g, eol);

function cutRange(from, to, text) {
  const a = src.indexOf(N(from));
  if (a < 0) throw new Error("from not found: " + from.slice(0, 70));
  const b = src.indexOf(N(to), a + 1);
  if (b < 0) throw new Error("to not found: " + to.slice(0, 70));
  src = src.slice(0, a) + N(text) + src.slice(b);
}
function insertBefore(marker, text) {
  const a = src.indexOf(N(marker));
  if (a < 0) throw new Error("marker not found: " + marker.slice(0, 70));
  src = src.slice(0, a) + N(text) + src.slice(a);
}
function sub(from, to) {
  const f = N(from);
  if (src.indexOf(f) < 0) throw new Error("sub target not found: " + from.slice(0, 70));
  src = src.split(f).join(N(to));
}

/* ---- 1. camera profile helpers ---- */
insertBefore("let savedTool = null;", [
  "// ---- the Camera tool's canvas handles ----------------------------------",
  "// The live profile is the field-of-view frame with a 7 px square on every",
  "// corner, a centre square with a cross and a guide to the right edge.  The",
  "// corners SCALE the camera (the opposite corner stays where it is), the",
  "// inside of the frame moves it.",
  "function camCorners(r) {",
  "  const a = (r.rot || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);",
  "  const hw = r.w / 2, hh = r.h / 2;",
  "  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([dx, dy]) => ({",
  "    x: r.cx + dx * ca - dy * sa,",
  "    y: r.cy + dx * sa + dy * ca",
  "  }));",
  "}",
  "// index of the corner under the point (0 TL, 1 TR, 2 BR, 3 BL), or -1",
  "function camCornerAt(p, cam) {",
  "  const pts = camCorners(E.cameraRect(proj, cam));",
  "  const tol = 9 / Math.max(0.02, view.zoom);",
  "  let best = -1, bd = Infinity;",
  "  pts.forEach((q, i) => {",
  "    const d = Math.hypot(q.x - p.x, q.y - p.y);",
  "    if (d < bd) { bd = d; best = i; }",
  "  });",
  "  return bd <= tol ? best : -1;",
  "}",
  "function camInside(p, cam) {",
  "  const r = E.cameraRect(proj, cam);",
  "  const a = -(r.rot || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);",
  "  const dx = p.x - r.cx, dy = p.y - r.cy;",
  "  return Math.abs(dx * ca - dy * sa) <= r.w / 2 && Math.abs(dx * sa + dy * ca) <= r.h / 2;",
  "}",
  "// the Camera tool adds the camera to the project (the live tool keeps the",
  "// drawing area and makes the camera view the drawing area, see the report)",
  "function camEnsure() {",
  "  if (proj.cameraKeys && proj.cameraKeys.length) return;",
  "  const cw = proj.cameraView ? proj.cameraView.w : Math.max(16, proj.width);",
  "  const ch = proj.cameraView ? proj.cameraView.h : Math.max(16, proj.height);",
  "  if (!proj.cameraView) proj.cameraView = { w: cw, h: ch };",
  "  proj.cameraKeys = [E.newCameraKey(1, { w: cw, h: ch })];",
  "  toast(\"camera added to the project\");",
  "}",
  ""
].join("\n"));

/* ---- 2. pointerdown: corners scale, inside moves, locks stop it ---- */
cutRange('  if (tool === "panning") {', '  if (tool === "zoomrect") {', [
  '  if (tool === "panning") { conducting = { mode: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }; return; }',
  '  if (tool === "camera") {',
  '    // the live Camera tool: the four corner handles scale the field of view,',
  '    // a drag inside the frame moves the camera, the padlocks block it',
  '    camEnsure();',
  '    const cam = E.cameraEvaluate(proj, proj.currentFrame);',
  '    const r = E.cameraRect(proj, cam);',
  '    const corner = camCornerAt(p, cam);',
  '    if (camLocksAll) { toast("the camera is locked (Lock All)"); activePtr = null; return; }',
  '    if (corner >= 0) {',
  '      if (camLocks.zoom) { toast("camera zoom is locked"); activePtr = null; return; }',
  '      conducting = { mode: "camScale", corner, r, cam, undo: false };',
  '      return;',
  '    }',
  '    if (!camInside(p, cam)) {',
  '      // outside the field of view only the profile handles act',
  '      activePtr = null;',
  '      return;',
  '    }',
  '    if (camLocks.x && camLocks.y) { toast("camera position is locked"); activePtr = null; return; }',
  '    conducting = { mode: "camDrag", ox: cam.x, oy: cam.y, sx: p.x, sy: p.y, undo: false };',
  '    return;',
  '  }',
  ''
].join("\n"));

/* ---- 3. pointermove: move + scale ---- */
cutRange('  if (conducting.mode === "camDrag") {\n', '  if (conducting.mode === "fgrad") {', [
  '  if (conducting.mode === "camDrag") {',
  '    const c = conducting;',
  '    let nx = c.ox + (p.x - c.sx), ny = c.oy + (p.y - c.sy);',
  '    if (camLocks.x) nx = c.ox;',
  '    if (camLocks.y) ny = c.oy;',
  '    const cur = E.cameraEvaluate(proj, proj.currentFrame);',
  '    if (Math.abs(nx - cur.x) < 0.01 && Math.abs(ny - cur.y) < 0.01) return;',
  '    if (!c.undo) { hist.pushModel(proj); c.undo = true; }',
  '    // a drag keys the POSITION channel only (the live keyframe submenu ticks',
  '    // exactly the channels that were touched)',
  '    E.cameraAddKey(proj, proj.currentFrame, E.CAM_CH.POS);',
  '    E.setCameraKey(proj, proj.currentFrame, { x: nx, y: ny });',
  '    // the live app updates the X / Y fields of the camera panel while dragging',
  '    const cb2 = qAny("[data-panel-key=camera] .pbody");',
  '    if (cb2 && cb2._syncCamera) cb2._syncCamera();',
  '    return renderOverlayOnly();',
  '  }',
  '  if (conducting.mode === "camScale") {',
  '    const c = conducting;',
  '    const cam = E.cameraEvaluate(proj, proj.currentFrame);',
  '    const rot = (cam.rotation || 0) * Math.PI / 180, ca = Math.cos(rot), sa = Math.sin(rot);',
  '    const fixed = camCorners(c.r)[(c.corner + 2) % 4];',
  '    const dx = p.x - fixed.x, dy = p.y - fixed.y;',
  '    const ux = dx * ca + dy * sa;            // in the camera\'s own axes',
  '    const uy = -dx * sa + dy * ca;',
  '    const MIN = 8;',
  '    const baseW = c.cam.w || c.r.w * (c.cam.zoom || 1);',
  '    const baseH = c.cam.h || c.r.h * (c.cam.zoom || 1);',
  '    let W = Math.max(MIN, Math.abs(ux)), H = Math.max(MIN, Math.abs(uy));',
  '    // "Modify ratio" keeps the camera\'s width / height ratio',
  '    if (proj.cameraModifyRatio && baseW && baseH) {',
  '      H = Math.max(MIN, W * (baseH / baseW));',
  '      W = Math.max(MIN, H * (baseW / baseH));',
  '    }',
  '    const zoom = Math.max(0.02, Math.min(50, baseW / W));',
  '    const sx2 = ux >= 0 ? 1 : -1, sy2 = uy >= 0 ? 1 : -1;',
  '    const cx2 = fixed.x + ca * sx2 * W / 2 - sa * sy2 * H / 2;',
  '    const cy2 = fixed.y + sa * sx2 * W / 2 + ca * sy2 * H / 2;',
  '    const cur = E.cameraEvaluate(proj, proj.currentFrame);',
  '    if (Math.abs(cx2 - proj.width / 2 - cur.x) < 0.01 &&',
  '        Math.abs(cy2 - proj.height / 2 - cur.y) < 0.01 &&',
  '        Math.abs(zoom - cur.zoom) < 0.0001) return;',
  '    if (!c.undo) { hist.pushModel(proj); c.undo = true; }',
  '    E.cameraAddKey(proj, proj.currentFrame, E.CAM_CH.ZOOM);',
  '    E.setCameraKey(proj, proj.currentFrame, {',
  '      x: cx2 - proj.width / 2, y: cy2 - proj.height / 2,',
  '      zoom, w: baseW, h: baseH',
  '    });',
  '    const cb3 = qAny("[data-panel-key=camera] .pbody");',
  '    if (cb3 && cb3._syncCamera) cb3._syncCamera();',
  '    return renderOverlayOnly();',
  '  }',
  ''
].join("\n"));

/* cursor feedback over the profile when the camera tool is idle */
insertBefore("  if (e.pointerId !== activePtr && !conducting) return;", [
  "  if (!conducting && tool === \"camera\" && proj.cameraKeys && proj.cameraKeys.length) {",
  "    const p0 = toProj(e);",
  "    const cam = E.cameraEvaluate(proj, proj.currentFrame);",
  "    const i = camCornerAt(p0, cam);",
  "    ovl.style.cursor = i < 0 ? (camInside(p0, cam) ? \"move\" : \"default\")",
  "      : (i === 0 || i === 2 ? \"nwse-resize\" : \"nesw-resize\");",
  "  }",
  ""
].join("\n"));

/* ---- 4. pointerup: the camera drag is one undo step ---- */
insertBefore('  conducting = null; preview = null; strokeBase = null; endPenFlip(); renderAll();', [
  '  if (c.mode === "camDrag" || c.mode === "camScale") {',
  '    if (c.undo) hist.sealModel(proj);',
  '  }',
  ''
].join("\n"));

/* ---- 5. panel edits key the channel they belong to ---- */
sub("  const edit = (patch) => {", "  const edit = (patch, ch) => {");
sub("    delete merged.frame;\n    E.setCameraKey(proj, f, merged);",
  "    delete merged.frame;\n    if (ch) E.cameraAddKey(proj, f, ch);\n    E.setCameraKey(proj, f, merged);");
sub('  $("camX").onchange = e => edit({ x: (+e.target.value || 0) - proj.width / 2 });\n  $("camY").onchange = e => edit({ y: (+e.target.value || 0) - proj.height / 2 });',
  '  $("camX").onchange = e => edit({ x: (+e.target.value || 0) - proj.width / 2 }, E.CAM_CH.POS);\n  $("camY").onchange = e => edit({ y: (+e.target.value || 0) - proj.height / 2 }, E.CAM_CH.POS);');
sub('  $("camRot").onchange = e => edit({ rotation: +e.target.value || 0 });\n  $("camZoom").onchange = e => edit({ zoom: Math.max(0.05, (+e.target.value || 100) / 100) });',
  '  $("camRot").onchange = e => edit({ rotation: +e.target.value || 0 }, E.CAM_CH.ROT);\n  $("camZoom").onchange = e => edit({ zoom: Math.max(0.05, (+e.target.value || 100) / 100) }, E.CAM_CH.ZOOM);');

/* ---- 6. the FOV punch-out stays inside the drawing area ---- */
sub('    // Punch out the camera field of view (destination-out removes the dim)\n    octx.globalCompositeOperation = "destination-out";',
  '    // Punch out the camera field of view (destination-out removes the dim); the\n    // clip keeps the erase inside the drawing area, so a camera that hangs over\n    // the edge never brightens the viewport around it.\n    octx.globalCompositeOperation = "destination-out";\n    octx.save();\n    octx.beginPath();\n    octx.rect(0, 0, proj.width, proj.height);\n    octx.clip();');
sub('    octx.fill();\n    octx.globalCompositeOperation = "source-over";\n    // Back to screen coordinates for the frame stroke',
  '    octx.fill();\n    octx.restore();\n    octx.globalCompositeOperation = "source-over";\n    // Back to screen coordinates for the frame stroke');

fs.writeFileSync(file, src);
console.log("patched ui.js");
