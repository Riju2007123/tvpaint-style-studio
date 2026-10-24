/* one-off: the camera render gets its motion blur, the size ratio locks and a
   running playback can never leak into a new project */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

function patch(file, fn) {
  const p = path.join(root, file);
  let src = fs.readFileSync(p, "utf8");
  const eol = src.includes("\r\n") ? "\r\n" : "\n";
  const N = (s) => s.replace(/\r?\n/g, eol);
  src = fn(src, N);
  fs.writeFileSync(p, src);
  console.log("patched", file);
}
function cut(src, N, from, to, text) {
  const a = src.indexOf(N(from));
  if (a < 0) throw new Error("from not found: " + from.slice(0, 60));
  const b = src.indexOf(N(to), a + 1);
  if (b < 0) throw new Error("to not found: " + to.slice(0, 60));
  return src.slice(0, a) + N(text) + src.slice(b);
}

/* ---- engine: the camera view drawing as one helper + motion blur ---- */
patch("engine.js", (src, N) => {
  src = cut(src, N,
    "function renderCameraFrames(proj, merged) {",
    "// Move a camera keyframe to another frame",
    [
      "// draw the artwork through one camera state (used by the render pass)",
      "function drawCameraView(c, proj, cam, vw, vh, visible, f) {",
      "  const r = cameraRect(proj, cam);",
      "  const k = Math.min(vw / r.w, vh / r.h);",
      "  c.save();",
      "  c.translate(vw / 2, vh / 2);",
      "  c.rotate(-(cam.rotation || 0) * Math.PI / 180);",
      "  c.scale((cam.flipX ? -1 : 1) * k, (cam.flipY ? -1 : 1) * k);",
      "  c.translate(-r.cx, -r.cy);",
      "  visible.forEach(l => {",
      "    const key = effectiveFrameKey(l, f);",
      "    const s2 = key !== null ? l.frames[key].canvas : null;",
      "    if (s2 && s2.getContext) c.drawImage(s2, 0, 0);",
      "  });",
      "  c.restore();",
      "}",
      "",
      "// Render the camera view of every frame into a new project (\"Project >",
      "// Render Camera > Into a New Project\").  Motion Blur (loc 009582230 \"adds a",
      "// 'Motion Blur' effect on the camera move\") averages the camera along its",
      "// path around every image.",
      "function renderCameraFrames(proj, merged) {",
      "  if (!(proj.cameraKeys || []).length) return null;",
      "  const vw = proj.cameraView ? proj.cameraView.w : proj.width;",
      "  const vh = proj.cameraView ? proj.cameraView.h : proj.height;",
      "  const out = newProject(vw, vh, proj.fps);",
      "  const layer = out.layers[0];",
      "  layer.name = \"Camera\";",
      "  layer.frames = {};",
      "  const visible = proj.layers.filter(l => l.visible !== false);",
      "  const blur = Math.max(0, Math.min(100, +proj.cameraBlur || 0));",
      "  for (let f = 1; f <= proj.outFrame; f++) {",
      "    const cam = cameraEvaluate(proj, f);",
      "    const surf = makeSurface(vw, vh);",
      "    const c = surf.getContext && surf.getContext(\"2d\");",
      "    if (c) {",
      "      c.fillStyle = \"#ffffff\";",
      "      c.fillRect(0, 0, vw, vh);",
      "      if (blur > 0) {",
      "        const n = Math.max(2, Math.min(16, Math.round(blur / 6) + 2));",
      "        const span = (blur / 100);",
      "        c.globalAlpha = 1 / n;",
      "        for (let i = 0; i < n; i++) {",
      "          const t = (i / (n - 1) - 0.5) * span;",
      "          drawCameraView(c, proj, cameraEvaluate(proj, f + t), vw, vh, visible, f);",
      "        }",
      "        c.globalAlpha = 1;",
      "      } else {",
      "        drawCameraView(c, proj, cam, vw, vh, visible, f);",
      "      }",
      "    }",
      "    layer.frames[f] = { exposure: 1, canvas: surf, id: uid(), role: null, name: null };",
      "  }",
      "  if (merged) layer.name = \"Camera (merged)\";",
      "  return out;",
      "}",
      "",
      ""
    ].join("\n"));
  return src;
});

/* ---- ui: Modify ratio locks the size in the parameters request ---- */
patch("ui.js", (src, N) => {
  const anchor = N("    [\"OK\", () => {\n      const fmt = m.querySelector(\"#cpFormat\").value;");
  if (src.indexOf(anchor) < 0) throw new Error("params dialog marker not found");
  src = src.replace(anchor, N([
    "    [\"OK\", () => {",
    "      const fmt = m.querySelector(\"#cpFormat\").value;"
  ].join("\n")));
  const afterModal = N("  ]);\n}\nfunction dlgExposure(li, f) {");
  if (src.indexOf(afterModal) < 0) throw new Error("dlg end marker not found");
  src = src.replace(afterModal, N([
    "  ]);",
    "  // \"Modify ratio\" (009582260: lock the ratio of the camera size during its",
    "  // modification): the width and the height follow each other",
    "  const cpW = m.querySelector(\"#cpW\"), cpH = m.querySelector(\"#cpH\");",
    "  if (cpW && cpH) {",
    "    const ar = (w && h) ? w / h : 1;",
    "    cpW.onchange = () => {",
    "      if (!proj.cameraModifyRatio) return;",
    "      cpH.value = Math.max(1, Math.round((+cpW.value || w) / ar));",
    "    };",
    "    cpH.onchange = () => {",
    "      if (!proj.cameraModifyRatio) return;",
    "      cpW.value = Math.max(1, Math.round((+cpH.value || h) * ar));",
    "    };",
    "  }",
    "}",
    "function dlgExposure(li, f) {"
  ].join("\n")));
  return src;
});

/* ---- ui: a running playback must not survive a project change ---- */
patch("ui.js", (src, N) => {
  const targets = [
    "window.uiNew = function () {\n  if (!confirm(\"Discard current project and start a new one?\")) return;",
    "  proj = E.deserializeProject(json, restoreFns);"
  ];
  targets.forEach(t => {
    const a = src.indexOf(N(t));
    if (a < 0) throw new Error("target not found: " + t.slice(0, 50));
    src = src.slice(0, a) + N(t) + N("\n  if (typeof stopPlayback === \"function\") stopPlayback();") + src.slice(a + N(t).length);
  });
  return src;
});
