/* ------------------------------------------------------------------
   profiles.js - the tool input profiles of TVPaint 12.

   Every numeric tool option (Size, Power, Opacity, Aspect, Angle, Step ...)
   has a small badge to the left of its field in the live application.  The
   badge carries the abbreviation of the *input* that drives the option:

     C  Constant        R  Random          A  Azimuth
     S  Speed           P  Pressure        TW Twist
     D  Direction       T  Altitude        F1 F2 F3  Finger Wheel 1..3
     O  Orientation     F  Fade

   These are the shipped strings 000024231..000024243 of english.tvpaint.loc
   (C S D O F R P T A F1 F2 F3 TW).  Clicking the badge opens the input menu
   captured live (Invert / Profile Editor / Constant / Speed ... / Pressure ...
   / Options...), the menu item "Profile Editor" opens the curve editor whose
   layout is the live "Profile :Size" window (Bin, Flip X, Flip Y, Delete,
   curve mode Linear/Spline/Polynomial and the editable graph, loc
   000022600..000022657).

   The curve maps the input value (0..1) to a multiplier for the option:
   the engine asks TVProfiles.value() before every stamp, so Size can follow
   pressure, Power can fade with distance, etc.
   ------------------------------------------------------------------ */
(function (root) {
  "use strict";

  var doc = document;

  // ---- the input table (order of the live menu) ----
  var INPUTS = [
    { id: "constant",    label: "Constant",       abbr: "C" },
    { id: "speed",       label: "Speed",          abbr: "S" },
    { id: "direction",   label: "Direction",      abbr: "D" },
    { id: "orientation", label: "Orientation",    abbr: "O" },
    { id: "fade",        label: "Fade",           abbr: "F" },
    { id: "random",      label: "Random",         abbr: "R" },
    { id: "pressure",    label: "Pressure",       abbr: "P" },
    { id: "altitude",    label: "Altitude",       abbr: "T" },
    { id: "azimuth",     label: "Azimuth",        abbr: "A" },
    { id: "twist",       label: "Twist",          abbr: "TW" },
    { id: "fw1",         label: "Finger Wheel 01", abbr: "F1" },
    { id: "fw2",         label: "Finger Wheel 02", abbr: "F2" },
    { id: "fw3",         label: "Finger Wheel 03", abbr: "F3" }
  ];
  var INPUT_BY_ID = {};
  INPUTS.forEach(function (i) { INPUT_BY_ID[i.id] = i; });

  var CURVE_MODES = ["Linear", "Spline", "Polynomial"];

  // the default curve of the live "Profile :Size" window: four points, the
  // middle ones slightly below the diagonal (a soft S)
  function defaultPoints() {
    return [
      { x: 0, y: 0 },
      { x: 0.28, y: 0.34 },
      { x: 0.62, y: 0.63 },
      { x: 1, y: 1 }
    ];
  }
  function identityPoints() {
    return [{ x: 0, y: 0 }, { x: 1, y: 1 }];
  }

  // ---- per-project storage ----
  function project() {
    if (typeof proj !== "undefined" && proj) return proj;
    return root.proj || null;
  }
  function store(p) {
    p = p || project();
    if (!p) return null;
    if (!p.profiles) p.profiles = {};
    return p.profiles;
  }
  function activeTool() {
    if (typeof tool !== "undefined" && tool) return tool;
    var p = project();
    return (p && p.brush && p.brush.kind) || "penbrush";
  }
  function keyFor(opt, p) {
    var t = activeTool();
    if (p && p.brush && p.brush.kind && p.brush.kind !== t) {
      // brushes keep their own profiles even while another tool is active
      var isBrush = /brush$/.test(t) || t === "eraser";
      if (!isBrush) t = p.brush.kind;
    }
    return t + "." + opt;
  }
  function profile(p, opt) {
    var s = store(p); if (!s) return null;
    var k = keyFor(opt, p);
    if (!s[k]) {
      s[k] = {
        input: opt === "size" ? "pressure" : "constant",
        invert: false,
        mode: "Linear",
        points: opt === "size" ? defaultPoints() : identityPoints()
      };
    }
    return s[k];
  }
  function abbr(prof) {
    var i = INPUT_BY_ID[(prof && prof.input) || "constant"];
    return i ? i.abbr : "C";
  }
  function label(prof) {
    var i = INPUT_BY_ID[(prof && prof.input) || "constant"];
    return i ? i.label : "Constant";
  }

  // ---- curve maths ----
  function sortPts(pts) { return pts.slice().sort(function (a, b) { return a.x - b.x; }); }
  function curveAt(prof, x) {
    var pts = sortPts(prof.points || identityPoints());
    if (!pts.length) return x;
    if (x <= pts[0].x) return pts[0].y;
    if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
    var i = 0;
    while (i < pts.length - 2 && x > pts[i + 1].x) i++;
    var a = pts[i], b = pts[i + 1];
    var t = (x - a.x) / ((b.x - a.x) || 1);
    if (prof.mode === "Spline" || prof.mode === "Polynomial") {
      // Catmull-Rom through the neighbouring points, clamped to 0..1
      var p0 = pts[i - 1] || a, p3 = pts[i + 2] || b;
      var t2 = t * t, t3 = t2 * t;
      var y = 0.5 * ((2 * a.y) + (-p0.y + b.y) * t +
        (2 * p0.y - 5 * a.y + 4 * b.y - p3.y) * t2 +
        (-p0.y + 3 * a.y - 3 * b.y + p3.y) * t3);
      return Math.max(0, Math.min(1, y));
    }
    return a.y + (b.y - a.y) * t;
  }

  // value of one input at this stamp (0..1)
  function inputValue(id, ctx) {
    ctx = ctx || {};
    switch (id) {
      case "pressure": return clamp01(ctx.pressure == null ? 1 : ctx.pressure);
      case "speed": return clamp01(ctx.speed == null ? 0.5 : ctx.speed);
      case "direction": return clamp01(ctx.direction == null ? 0.5 : ctx.direction);
      case "orientation": return clamp01(ctx.altitude == null ? 0.5 : ctx.altitude);
      case "fade": {
        var fl = ctx.fadeLength == null ? 40 : ctx.fadeLength;
        return clamp01(1 - (ctx.distance || 0) / Math.max(1, fl));
      }
      case "random": return Math.random();
      case "altitude": return clamp01(ctx.altitude == null ? 0.5 : ctx.altitude);
      case "azimuth": return clamp01(ctx.azimuth == null ? 0.5 : ctx.azimuth);
      case "twist": return clamp01(ctx.twist == null ? 0.5 : ctx.twist);
      case "fw1": return clamp01(ctx.wheel == null ? 0.5 : ctx.wheel);
      case "fw2": return clamp01(ctx.wheel2 == null ? 0.5 : ctx.wheel2);
      case "fw3": return clamp01(ctx.wheel3 == null ? 0.5 : ctx.wheel3);
      default: return 1;                      // Constant
    }
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : (isFinite(v) ? v : 0); }

  /* the engine hook: returns the effective value of an option for one stamp.
     base = the value typed in the field; ctx = pointer/stroke state */
  function value(opt, base, ctx, p) {
    p = p || project();
    if (!p) return base;
    var prof = profile(p, opt);
    if (!prof) return base;
    if ((prof.input === "constant") && !prof.invert) return base;
    var v = curveAt(prof, inputValue(prof.input, ctx));
    if (prof.invert) v = 1 - v;
    return base * v;
  }

  // ---- small DOM helpers ----
  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function fmt(v) { return (Math.round(v * 100) / 100).toString(); }

  // ==================================================================
  //  the input menu (live: Invert / Profile Editor / Constant / ... )
  // ==================================================================
  function openInputMenu(anchor, opt, onChange) {
    closeAll();
    var p = project(); if (!p) return;
    var prof = profile(p, opt);
    var m = el("div", "ldmenu tvimenu");
    m.style.minWidth = "196px";
    function row(label, checked, act, isSep) {
      if (isSep) { m.appendChild(el("div", "ldsep")); return; }
      var it = el("div", "ldi");
      it.innerHTML = '<span class="ldck">' + (checked ? "&#10003;" : "") + '</span><span class="ldlb">' + label + "</span>";
      it.onclick = function (ev) { ev.stopPropagation(); closeAll(); act(); };
      m.appendChild(it);
    }
    row("Invert", prof.invert, function () { prof.invert = !prof.invert; onChange && onChange(); });
    row("Profile Editor", false, function () { openEditor(anchor, opt, prof, onChange); });
    row("", false, null, true);
    row("Constant", prof.input === "constant", function () { prof.input = "constant"; onChange && onChange(); });
    row("", false, null, true);
    ["speed", "direction", "orientation", "fade", "random"].forEach(function (id) {
      row(INPUT_BY_ID[id].label, prof.input === id, function () { prof.input = id; onChange && onChange(); });
    });
    row("", false, null, true);
    ["pressure", "altitude", "azimuth", "twist", "fw1", "fw2", "fw3"].forEach(function (id) {
      row(INPUT_BY_ID[id].label, prof.input === id, function () { prof.input = id; onChange && onChange(); });
    });
    row("", false, null, true);
    row("Options...", false, function () { openOptions(anchor, prof, onChange); });

    doc.body.appendChild(m);
    place(m, anchor);
    openMenu = m;
  }

  // ==================================================================
  //  the profile editor (live window "Profile :Size")
  // ==================================================================
  var openMenu = null, openWin = null, dragInfo = null, selPoint = 2;

  function closeAll() {
    if (openMenu) { openMenu.remove(); openMenu = null; }
    if (openWin) { openWin.remove(); openWin = null; }
    if (dragInfo && dragInfo.move) {
      doc.removeEventListener("pointermove", dragInfo.move);
      doc.removeEventListener("pointerup", dragInfo.up);
      dragInfo = null;
    }
  }
  doc.addEventListener("pointerdown", function (e) {
    if (openMenu && !openMenu.contains(e.target)) { openMenu.remove(); openMenu = null; }
    if (openWin && !openWin.contains(e.target) && !e.target.closest(".ldcurve")) { /* keep the editor */ }
  }, true);
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(); });

  function place(m, anchor) {
    var r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: 40, top: 40, bottom: 60, right: 160 };
    m.style.left = Math.max(2, Math.min(innerWidth - 210, r.left)) + "px";
    m.style.top = Math.max(2, Math.min(innerHeight - 210, r.bottom + 2)) + "px";
  }

  function openEditor(anchor, opt, prof, onChange) {
    if (openWin) openWin.remove();
    var win = el("div", "tvprof");
    var title = optLabel(opt);
    win.innerHTML =
      '<div class="tvprof-title"><span>Profile :' + title + '</span><b class="tvprof-x">&times;</b></div>' +
      '<div class="tvprof-body">' +
      '<div class="tvprof-left">' +
      '<div class="tvprof-combo tvprof-bin">Bin<span class="tvprof-arrow">&#9660;</span></div>' +
      '<button class="tvprof-btn tvprof-flipx">Flip X</button>' +
      '<button class="tvprof-btn tvprof-flipy">Flip Y</button>' +
      '<button class="tvprof-btn tvprof-del">Delete</button>' +
      '<div class="tvprof-combo tvprof-mode">' + prof.mode + '<span class="tvprof-arrow">&#9660;</span></div>' +
      '</div>' +
      '<div class="tvprof-graph"><canvas width="208" height="150"></canvas>' +
      '<span class="tvprof-ylab">' + title + '</span>' +
      '<span class="tvprof-xlab">' + label(prof) + '</span></div>' +
      '</div>';
    doc.body.appendChild(win);
    var r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: 60, top: 60 };
    win.style.left = Math.max(2, Math.min(innerWidth - win.offsetWidth - 4, r.right + 4)) + "px";
    win.style.top = Math.max(2, Math.min(innerHeight - win.offsetHeight - 4, r.top - 8)) + "px";
    openWin = win;

    var cv = win.querySelector("canvas");
    var selected = Math.min(selPoint, (prof.points || []).length - 1);
    if (selected < 0) selected = 0;

    function draw() {
      drawGraph(cv, prof, selected, opt);
    }
    draw();

    win.querySelector(".tvprof-x").onclick = function () { closeAll(); };

    win.querySelector(".tvprof-flipx").onclick = function () {
      prof.points = sortPts((prof.points || []).map(function (q) { return { x: 1 - q.x, y: q.y }; }));
      draw(); onChange && onChange();
    };
    win.querySelector(".tvprof-flipy").onclick = function () {
      prof.points = (prof.points || []).map(function (q) { return { x: q.x, y: 1 - q.y }; });
      draw(); onChange && onChange();
    };
    win.querySelector(".tvprof-del").onclick = function () {
      var pts = sortPts(prof.points || []);
      if (pts.length > 2 && selected > 0 && selected < pts.length - 1) {
        pts.splice(selected, 1);
        prof.points = pts; selected = Math.max(0, selected - 1);
        draw(); onChange && onChange();
      }
    };
    win.querySelector(".tvprof-mode").onclick = function (e) {
      var b = e.currentTarget.getBoundingClientRect();
      var m = el("div", "ldmenu");
      CURVE_MODES.forEach(function (mo) {
        var it = el("div", "ldi");
        it.innerHTML = '<span class="ldck">' + (prof.mode === mo ? "&#10003;" : "") + '</span><span class="ldlb">' + mo + "</span>";
        it.onclick = function () {
          m.remove(); prof.mode = mo;
          win.querySelector(".tvprof-mode").firstChild.textContent = mo;
          draw(); onChange && onChange();
        };
        m.appendChild(it);
      });
      doc.body.appendChild(m);
      m.style.left = b.left + "px"; m.style.top = b.bottom + "px";
    };
    win.querySelector(".tvprof-bin").onclick = function (e) {
      var b = e.currentTarget.getBoundingClientRect();
      var m = el("div", "ldmenu");
      [["Default", defaultPoints], ["Linear", identityPoints], ["Ease In", function () {
        return [{ x: 0, y: 0 }, { x: 0.7, y: 0.3 }, { x: 1, y: 1 }];
      }], ["Ease Out", function () {
        return [{ x: 0, y: 0 }, { x: 0.3, y: 0.7 }, { x: 1, y: 1 }];
      }], ["S-Curve", function () {
        return [{ x: 0, y: 0 }, { x: 0.3, y: 0.15 }, { x: 0.7, y: 0.85 }, { x: 1, y: 1 }];
      }], ["Reset Profile", identityPoints]].forEach(function (it) {
        var row = el("div", "ldi");
        row.innerHTML = '<span class="ldck"></span><span class="ldlb">' + it[0] + "</span>";
        row.onclick = function () {
          m.remove(); prof.points = it[1](); selected = 1;
          draw(); onChange && onChange();
        };
        m.appendChild(row);
      });
      doc.body.appendChild(m);
      m.style.left = b.left + "px"; m.style.top = b.bottom + "px";
    };

    // ---- graph interaction: drag a point, click to add, right-click to delete
    function toGraph(e) {
      var b = cv.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(1, (e.clientX - b.left - 12) / (b.width - 22))),
        y: Math.max(0, Math.min(1, 1 - (e.clientY - b.top - 10) / (b.height - 26)))
      };
    }
    function near(g) {
      var pts = sortPts(prof.points || []);
      for (var i = 0; i < pts.length; i++) {
        if (Math.hypot(pts[i].x - g.x, pts[i].y - g.y) < 0.075) return i;
      }
      return -1;
    }
    var dragIdx = -1;
    cv.onpointerdown = function (e) {
      var g = toGraph(e);
      var i = near(g);
      if (e.button === 2) {
        var pts = sortPts(prof.points || []);
        if (i > 0 && i < pts.length - 1) {
          pts.splice(i, 1); prof.points = pts; selected = Math.max(0, i - 1);
          draw(); onChange && onChange();
        }
        e.preventDefault(); return;
      }
      if (i < 0) {
        var arr = sortPts(prof.points || []);
        arr.push(g); prof.points = sortPts(arr);
        i = near(g); selected = i;
        draw(); onChange && onChange();
      }
      dragIdx = i; selected = i;
      selPoint = i;
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      draw();
    };
    cv.onpointermove = function (e) {
      if (dragIdx < 0) return;
      var g = toGraph(e), pts = sortPts(prof.points || []);
      var pnt = pts[dragIdx];
      if (!pnt) return;
      var edge = dragIdx === 0 || dragIdx === pts.length - 1;
      pnt.y = g.y;
      if (!edge) {
        // do not let a middle point cross its neighbours
        var lo = pts[dragIdx - 1].x + 0.01, hi = pts[dragIdx + 1].x - 0.01;
        pnt.x = Math.max(lo, Math.min(hi, g.x));
      }
      draw(); onChange && onChange();
    };
    cv.onpointerup = function () { dragIdx = -1; };
    cv.oncontextmenu = function (e) { e.preventDefault(); };

    // window dragging
    var tb = win.querySelector(".tvprof-title"), dx = 0, dy = 0, dragging = false;
    tb.onpointerdown = function (e) {
      if (e.target.classList.contains("tvprof-x")) return;
      dragging = true; dx = e.clientX - win.offsetLeft; dy = e.clientY - win.offsetTop;
      try { tb.setPointerCapture(e.pointerId); } catch (err) {}
    };
    tb.onpointermove = function (e) {
      if (!dragging) return;
      win.style.left = Math.max(0, Math.min(innerWidth - win.offsetWidth, e.clientX - dx)) + "px";
      win.style.top = Math.max(0, Math.min(innerHeight - win.offsetHeight, e.clientY - dy)) + "px";
    };
    tb.onpointerup = function () { dragging = false; };

    selPoint = selected;
  }

  function optLabel(opt) {
    var map = { size: "Size", power: "Power", opacity: "Opacity", aspect: "Aspect",
      angle: "Angle", step: "Step", smooth: "Smooth", range: "Range", gap: "Gap Closer",
      expand: "Expand", csize: "Size", shift: "Shift", jitter: "Jitter", cangle: "Angle",
      tsize: "Size", xscale: "XScale", space: "Space", italic: "Italic" };
    return map[opt] || (opt.charAt(0).toUpperCase() + opt.slice(1));
  }

  function drawGraph(cv, prof, selected, opt) {
    var g = cv.getContext("2d"), W = cv.width, H = cv.height;
    var x0 = 12, y0 = 10, gw = W - 22, gh = H - 26;
    g.clearRect(0, 0, W, H);
    g.fillStyle = "#2b2b30"; g.fillRect(0, 0, W, H);
    // grid 4x4 (live window)
    g.strokeStyle = "#3a3a41"; g.lineWidth = 1;
    for (var i = 0; i <= 4; i++) {
      var gx = x0 + gw * i / 4, gy = y0 + gh * i / 4;
      g.beginPath(); g.moveTo(gx, y0); g.lineTo(gx, y0 + gh); g.stroke();
      g.beginPath(); g.moveTo(x0, gy); g.lineTo(x0 + gw, gy); g.stroke();
    }
    g.strokeStyle = "#4a4a52";
    g.strokeRect(x0, y0, gw, gh);
    // axis labels (live: option name vertically on the left, input name at the bottom right)
    g.save();
    g.translate(10, y0 + 4);
    g.rotate(-Math.PI / 2);
    g.fillStyle = "#c9c9c9"; g.font = "11px Segoe UI";
    g.fillText(optLabel(opt || "size"), -gh + 10, 0);
    g.restore();
    g.fillStyle = "#c9c9c9"; g.font = "11px Segoe UI";
    var lab = label(prof);
    g.fillText(lab, x0 + gw - g.measureText(lab).width - 2, y0 + gh + 14);
    // curve
    var pts = sortPts(prof.points || identityPoints());
    g.strokeStyle = "#4a5bff"; g.lineWidth = 1.5;
    g.beginPath();
    for (var s = 0; s <= 100; s++) {
      var xx = s / 100, yy = curveAt(prof, xx);
      var px = x0 + xx * gw, py = y0 + (1 - yy) * gh;
      if (s === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.stroke();
    // points
    pts.forEach(function (q, k) {
      var px = x0 + q.x * gw, py = y0 + (1 - q.y) * gh;
      g.fillStyle = k === selected ? "#f2e600" : "#ffffff";
      g.strokeStyle = "#111";
      g.fillRect(px - 3, py - 3, 6, 6);
      g.strokeRect(px - 3, py - 3, 6, 6);
    });
  }

  // ---- Options... (random seed / fade length) ----
  function openOptions(anchor, prof, onChange) {
    var d = el("div", "tvopt");
    d.innerHTML = '<div class="tvprof-title"><span>Options :' + label(prof) + '</span><b class="tvprof-x">&times;</b></div>' +
      '<div class="tvopt-body">' +
      '<label>Fade length <input type="number" class="tvopt-fade" min="1" max="2000" value="' +
      (prof.fadeLength || 40) + '"></label>' +
      '<label>Random seed <input type="number" class="tvopt-seed" min="0" max="99999" value="' +
      (prof.seed || 1) + '"></label>' +
      '</div>';
    doc.body.appendChild(d);
    var r = anchor.getBoundingClientRect();
    d.style.left = Math.max(2, Math.min(innerWidth - 230, r.left)) + "px";
    d.style.top = Math.max(2, Math.min(innerHeight - 150, r.bottom + 2)) + "px";
    d.querySelector(".tvprof-x").onclick = function () { d.remove(); };
    d.querySelector(".tvopt-fade").oninput = function (e) { prof.fadeLength = +e.target.value || 40; onChange && onChange(); };
    d.querySelector(".tvopt-seed").oninput = function (e) { prof.seed = +e.target.value || 1; onChange && onChange(); };
  }

  root.TVProfiles = {
    INPUTS: INPUTS,
    CURVE_MODES: CURVE_MODES,
    profile: profile,
    abbr: abbr,
    label: label,
    value: value,
    curveAt: curveAt,
    openInputMenu: openInputMenu,
    openEditor: openEditor,
    closeAll: closeAll,
    keyFor: keyFor
  };
})(typeof window !== "undefined" ? window : this);

