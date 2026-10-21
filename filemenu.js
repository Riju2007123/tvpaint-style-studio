/* ------------------------------------------------------------------
   filemenu.js - the File menu of TVPaint Animation 12.1.0 Pro, rebuilt
   from the live application.

   Everything below is driven by measurements and by TVPaint's own shipped
   data rather than by guesses:

     * item order / labels / accelerators / disabled states
         - live 12.1.0 Pro Demo (File menu, 2026-10-21) for structure
         - live 11.0.8 Pro for the entries the trial build blacks out
           (Save Project, Save Project as..., Save as Template, Close)
     * every dialog label and tooltip
         - Resources\data\english.tvpaint.loc:
             $000022400..$000022459  New Project
             $000003100..$000003199  Export Footage
             $000021300..$000021367  Printer Config
             $000023000..$000023003  Template name
     * the camera-view preset table
         - Resources\data\pagesize.conf  (the shipped [PageSize] list)
     * dialog sizes
         - window rectangles measured live: New Project 638x299,
           Export Footage 1008x569, Printer Config 288x415 (Single) /
           288x495 (Anim), Template name 135x75.

   The trial build disables saving and exporting ("this version does not
   allow you to save or export your work"), so the enabled behaviour and the
   accelerators for those entries come from 11 Pro, exactly as asked.
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  const doc = document;
  const TVP = (typeof window !== "undefined" && window.tv) ? window.tv : null;
  let DOCS = "C:\\Users\\Public\\Documents";
  if (TVP && TVP.appInfo) {
    try { TVP.appInfo().then(i => { if (i && i.documents) DOCS = i.documents; }); } catch (e) { /* browser */ }
  }

  /* ---------------- small DOM helpers ---------------- */
  const el = (tag, cls, html) => {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------- shipped preset table ----------------
     Transcribed from Resources\data\pagesize.conf.  Columns after the name
     are width, height, frame rate, pixel aspect and dpi (0 = not a print
     preset).  The group prefix ("HDTV/", "DCI/", ...) is the submenu the
     live Camera View combo shows. */
  const PAGE_SIZES = [
    ["HDTV", "HDTV/UHD 8K", 7680, 4320, 24, 1.0, 0],
    ["HDTV", "HDTV/UHD 4K", 3840, 2160, 24, 1.0, 0],
    ["HDTV", "HD 1080p", 1920, 1080, 24, 1.0, 0],
    ["HDTV", "HD 720p", 1280, 720, 24, 1.0, 0],
    ["DCI", "4K Native", 4096, 2160, 24, 1.0, 0],
    ["DCI", "4K Flat", 3996, 2160, 24, 1.0, 0],
    ["DCI", "4K Scope", 4096, 1716, 24, 1.0, 0],
    ["DCI", "2K Native", 2048, 1080, 24, 1.0, 0],
    ["DCI", "2K Flat", 1998, 1080, 24, 1.0, 0],
    ["DCI", "2K Scope", 2048, 858, 24, 1.0, 0],
    ["Film", "4K Full Aperture", 4096, 3112, 24, 1.0, 0],
    ["Film", "4K Academy", 3656, 2664, 24, 1.0, 0],
    ["Film", "2K Full Aperture", 2048, 1556, 24, 1.0, 0],
    ["Film", "2K Academy", 1828, 1332, 24, 1.0, 0],
    ["XGA", "5120x3200 (WHXGA)", 5120, 3200, 24, 1.0, 0],
    ["XGA", "4096x3072 (HXGA)", 4096, 3072, 24, 1.0, 0],
    ["XGA", "3840x2400 (WQUXGA)", 3840, 2400, 24, 1.0, 0],
    ["XGA", "3200x2400 (QUXGA)", 3200, 2400, 24, 1.0, 0],
    ["XGA", "3200x2048 (WQSXGA)", 3200, 2048, 24, 1.0, 0],
    ["XGA", "2560x2048 (QSXGA)", 2560, 2048, 24, 1.0, 0],
    ["XGA", "2560x1600 (WQXGA)", 2560, 1600, 24, 1.0, 0],
    ["XGA", "2048x1536 (QXGA)", 2048, 1536, 24, 1.0, 0],
    ["XGA", "1920x1200 (WUXGA)", 1920, 1200, 24, 1.0, 0],
    ["XGA", "1600x1200 (UXGA)", 1600, 1200, 24, 1.0, 0],
    ["XGA", "1680x1050 (WSXGA+)", 1680, 1050, 24, 1.0, 0],
    ["XGA", "1400x1050 (SXGA+)", 1400, 1050, 24, 1.0, 0],
    ["XGA", "1600x1024 (WSXGA)", 1600, 1024, 24, 1.0, 0],
    ["XGA", "1280x1024 (SXGA)", 1280, 1024, 24, 1.0, 0],
    ["XGA", "1440x900 (WXGA+)", 1440, 900, 24, 1.0, 0],
    ["XGA", "1152x864 (XGA+)", 1152, 864, 24, 1.0, 0],
    ["XGA", "1366x768 (WXGA)", 1366, 768, 24, 1.0, 0],
    ["XGA", "1024x768 (XGA)", 1024, 768, 24, 1.0, 0],
    ["XGA", "800x600 (SVGA)", 800, 600, 24, 1.0, 0],
    ["XGA", "640x480 (VGA)", 640, 480, 24, 1.0, 0],
    ["XGA", "320x240 (QVGA)", 320, 240, 24, 1.0, 0],
    ["Illustration", "A6/150 DPI", 620, 874, 1, 1.0, 150],
    ["Illustration", "A6/300 DPI", 1240, 1748, 1, 1.0, 300],
    ["Illustration", "A6/600 DPI", 2480, 3496, 1, 1.0, 600],
    ["Illustration", "A6/1200 DPI", 4961, 6992, 1, 1.0, 1200],
    ["Illustration", "A5/150 DPI", 874, 1240, 1, 1.0, 150],
    ["Illustration", "A5/300 DPI", 1748, 2480, 1, 1.0, 300],
    ["Illustration", "A5/600 DPI", 3496, 4961, 1, 1.0, 600],
    ["Illustration", "A5/1200 DPI", 6992, 9921, 1, 1.0, 1200],
    ["Illustration", "A4/150 DPI", 1240, 1754, 1, 1.0, 150],
    ["Illustration", "A4/300 DPI", 2480, 3508, 1, 1.0, 300],
    ["Illustration", "A4/600 DPI", 4961, 7016, 1, 1.0, 600],
    ["Illustration", "A4/1200 DPI", 9921, 14031, 1, 1.0, 1200],
    ["Illustration", "A3/150 DPI", 1754, 2480, 1, 1.0, 150],
    ["Illustration", "A3/300 DPI", 3508, 4961, 1, 1.0, 300],
    ["Illustration", "A3/600 DPI", 7016, 9921, 1, 1.0, 600],
    ["Illustration", "A3/1200 DPI", 14031, 19843, 1, 1.0, 1200],
    ["Illustration", "US Letter/150 DPI", 1275, 1650, 1, 1.0, 150],
    ["Illustration", "US Letter/300 DPI", 2550, 3300, 1, 1.0, 300],
    ["Illustration", "US Letter/600 DPI", 5100, 6600, 1, 1.0, 600],
    ["Illustration", "US Letter/1200 DPI", 10200, 13200, 1, 1.0, 1200],
    ["Illustration", "US Legal/150 DPI", 1275, 2100, 1, 1.0, 150],
    ["Illustration", "US Legal/300 DPI", 2550, 4200, 1, 1.0, 300],
    ["Illustration", "US Legal/600 DPI", 5100, 8400, 1, 1.0, 600],
    ["Illustration", "US Legal/1200 DPI", 10200, 16800, 1, 1.0, 1200],
    ["Illustration", "CD Cover/150 DPI", 709, 709, 1, 1.0, 150],
    ["Illustration", "CD Cover/300 DPI", 1417, 1417, 1, 1.0, 300],
    ["Illustration", "CD Cover/600 DPI", 2834, 2834, 1, 1.0, 600],
    ["Illustration", "CD Cover/1200 DPI", 5669, 5669, 1, 1.0, 1200],
    ["Illustration", "Web Banner/Common Horizontal", 468, 60, 12, 1.0, 0],
    ["Illustration", "Web Banner/Common Vertical", 60, 468, 12, 1.0, 0],
    ["Illustration", "Web Banner/Huge Horizontal", 728, 90, 12, 1.0, 0],
    ["Illustration", "Web Banner/Huge Vertical", 90, 728, 12, 1.0, 0]
  ].map(([group, name, w, h, fps, par, dpi]) => ({ group, name, w, h, fps, par, dpi }));

  const PAGE_GROUPS = ["HDTV", "DCI", "Film", "XGA", "Illustration"];
  const FRAME_RATES = [3, 6, 8, 10, 12, 12.5, 15, 23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60];
  const UNITS = [["mm", 25.4], ["cm", 10], ["inches", 1], ["pixels", null]];

  /* ---------------- style ---------------- */
  const CSS = `
  .tvwin{position:fixed;z-index:2400;background:#313136;border:1px solid #5f5f66;
    box-shadow:0 10px 34px rgba(0,0,0,.55);color:#c8c8cc;font:11px/1.25 "Segoe UI",Tahoma,sans-serif;
    user-select:none;display:flex;flex-direction:column;min-height:0}
  .tvwin-t{height:22px;flex:0 0 22px;display:flex;align-items:center;background:#313136;
    border-bottom:0;padding:0 4px 0 7px;cursor:default}
  .tvwin-t span.tvwin-tt{color:#898989;font-size:11px}
  .tvwin-x{margin-left:auto;width:17px;height:17px;display:grid;place-items:center;
    color:#b9b9be;font-size:11px;cursor:pointer;border-radius:2px}
  .tvwin-x:hover{background:#4a4a52;color:#fff}
  .tvwin-b{padding:7px 8px 8px;overflow:auto;flex:1 1 auto;min-height:0}
  .tvlbl{color:#b6b6b6;font-size:11px;white-space:nowrap}
  .tvlbl.dim{color:#7f7f86}
  .tvf{background:#46464d;border:1px solid #2b2b30;border-radius:2px;color:#b6b6b6;
    font:11px "Segoe UI",Tahoma,sans-serif;height:17px;padding:0 3px;min-width:0;outline:none}
  .tvf:focus{border-color:#6a7a9a}
  .tvf:disabled,.tvf[readonly]{color:#8f8f96}
  .tvsel{display:inline-flex;align-items:center;gap:0}
  .tvcombo{display:flex;align-items:center;background:#46464d;border:1px solid #3d3d43;
    border-radius:2px;height:17px;color:#b6b6b6;cursor:pointer;overflow:hidden}
  .tvcombo .v{flex:1 1 auto;padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tvcombo .a{flex:0 0 17px;height:17px;display:grid;place-items:center;color:#b6b6b6;font-size:8px;position:relative}
  .tvcombo .a:before{content:"";position:absolute;left:2px;top:2px;width:13px;height:13px;
    border-radius:50%;border:1px solid #5f5f67;box-sizing:border-box;pointer-events:none}
  .tvcombo:hover{border-color:#6d6d76}
  .tvspin{display:inline-flex;height:17px}
  .tvspin .tvf{border-radius:2px 0 0 2px;border-right:0;text-align:left}
  .tvspin .sp{width:8px;height:17px;display:grid;place-items:center;background:#46464d;
    border:1px solid #5a5a62;color:#b6b6b6;font-size:5px;cursor:pointer}
  .tvspin .sp.l{border-right:0;border-radius:0}
  .tvspin .sp.r{border-radius:0 2px 2px 0}
  .tvspin .sp:hover{background:#51515a}
  .tvbtn{background:#46464d;border:0;border-radius:2px;color:#b6b6b6;
    font:11px "Segoe UI",Tahoma,sans-serif;height:17px;padding:0 9px;cursor:pointer}
  .tvbtn:hover{background:#51515a}
  .tvbtn:active{background:#3f3f46}
  .tvbtn.wide{width:100%;height:22px}
  .tvbtn.pri{background:#3e476b;border-color:#5d6f92}
  .tvbtn:disabled{color:#77777e;background:#3a3a41;border-color:#45454c;cursor:default}
  .tvchk{width:13px;height:13px;background:#46464d;border:1px solid #5f5f67;border-radius:1px;
    display:inline-grid;place-items:center;cursor:pointer;color:#d8d8dc;font-size:9px;flex:0 0 13px}
  .tvchk.on:after{content:"";width:12px;height:9px;background-position:center calc(50% - 2px);background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAJCAYAAAAGuM1UAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAABRSURBVChTYzA0NPtPCmZAF8CFtbT0wJgoDSCF27Zt+6+srEZYA0wxXAPMKhAmpBgkxgBiwASRNWFTDNYAItA14VIM14CuCZdiFA3omrApBmEAUgjGB6MDXSEAAAAASUVORK5CYII=) no-repeat center}
  .tvchk.big{width:21px;height:18px;flex:0 0 21px;border:0;border-radius:0;background:#414146;font-size:12px}
  .tvchk.big.on{background:transparent}
  .tvtabs{display:flex;align-items:flex-end;gap:0}
  .tvt{padding:0 10px;height:16px;line-height:12px;display:flex;align-items:center;justify-content:center;
    background:#46464d;color:#b6b6b6;border:1px solid #2a2a30;border-bottom:0;
    border-radius:2px 2px 0 0;cursor:pointer;white-space:nowrap}
  .tvt.on{background:#3e476b;color:#b6b6b6;border-color:#3e476b}
  .tvlist{position:fixed;z-index:2600;background:#313136;border:1px solid #4a4a52;
    box-shadow:0 5px 18px rgba(0,0,0,.55);padding:2px 0;min-width:120px;color:#c8c8cc;
    font:11px "Segoe UI",Tahoma,sans-serif;user-select:none}
  .tvlist .ri{height:17px;display:flex;align-items:center;padding:0 18px 0 20px;position:relative;
    white-space:nowrap;cursor:default}
  .tvlist .ri:hover{background:#4a4a52}
  .tvlist .ri.off{color:#77777e}
  .tvlist .ri.on:before{content:"\\2713";position:absolute;left:6px;font-size:9px}
  .tvlist .ri .ar{margin-left:auto;padding-left:14px;font-size:9px;color:#a9a9b0}
  .tvlist .rsep{height:1px;background:#4a4a52;margin:3px 0}
  .tvmsg{color:#b6b6b6;font-size:11px;line-height:1.45;white-space:pre-wrap}
  `;
  const styleEl = el("style");
  styleEl.textContent = CSS;
  doc.head.appendChild(styleEl);

  /* ---------------- floating dialog window ---------------- */
  let lastDlg = null;
  function tvWin(title, w, hh) {
    const w0 = el("div", "tvwin");
    w0.style.width = w + "px";
    if (hh) w0.style.height = hh + "px";
    w0.innerHTML = `<div class="tvwin-t"><span class="tvwin-tt">${esc(title)}</span><span class="tvwin-x">\u2715</span></div><div class="tvwin-b"></div>`;
    doc.body.appendChild(w0);
    const top = Math.max(24, Math.round((window.innerHeight - (hh || 220)) / 2) - 30);
    const left = Math.max(8, Math.round((window.innerWidth - w) / 2));
    w0.style.top = top + "px";
    w0.style.left = left + "px";
    const x = w0.querySelector(".tvwin-x");
    x.onclick = () => { w0.remove(); if (lastDlg === w0) lastDlg = null; };
    // TVPaint dialogs are moved by their title bar
    const t = w0.querySelector(".tvwin-t");
    let dx = 0, dy = 0, dragging = false;
    t.addEventListener("mousedown", (e) => {
      if (e.target === x) return;
      dragging = true; dx = e.clientX - w0.offsetLeft; dy = e.clientY - w0.offsetTop;
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      w0.style.left = clamp(e.clientX - dx, -w + 80, window.innerWidth - 80) + "px";
      w0.style.top = clamp(e.clientY - dy, 0, window.innerHeight - 24) + "px";
    });
    window.addEventListener("mouseup", () => { dragging = false; });
    lastDlg = w0;
    return w0;
  }
  const bodyOf = w => w.querySelector(".tvwin-b");

  /* ---------------- popup list (menu-style) ---------------- */
  let openList = null;
  function closeList() { doc.querySelectorAll(".tvlist").forEach(e => e.remove()); openList = null; }
  window.addEventListener("mousedown", (e) => {
    if (openList && e.target && !e.target.closest(".tvlist") && !e.target.closest(".tvcombo")) closeList();
  });
  /**
   * items: [{label, value, disabled, checked, submenu:[...], pick}]
   * Opens under `anchor`; submenus open to the right of the hovered row, like
   * the live combo lists (Display / Clipboard / Current Project / HDTV ...).
   */
  function tvList(anchor, items, onPick, parentRect) {
    closeList();
    const r = parentRect || anchor.getBoundingClientRect();
    const box = el("div", "tvlist");
    box.style.minWidth = Math.max(110, Math.round(r.width)) + "px";
    doc.body.appendChild(box);
    const closeSubs = (host) => host.querySelectorAll(".ri").forEach(o => { if (o._sub) { o._sub.remove(); o._sub = null; } });
    const build = (list, host, depth) => {
      host.innerHTML = "";
      list.forEach((it) => {
        if (it.sep) { host.appendChild(el("div", "rsep")); return; }
        const row = el("div", "ri" + (it.disabled ? " off" : "") + (it.checked ? " on" : ""));
        row.innerHTML = `<span>${esc(it.label)}</span>${it.submenu ? '<span class="ar">\u25B8</span>' : ""}`;
        row.onmouseenter = () => {
          if (it.submenu && !it.disabled) {
            if (row._sub) return;
            closeSubs(host);
            const rr = row.getBoundingClientRect();
            const sub = el("div", "tvlist");
            sub.style.minWidth = "150px";
            doc.body.appendChild(sub);
            build(it.submenu, sub, depth + 1);
            const sb = sub.getBoundingClientRect();
            sub.style.left = Math.round(rr.right - 2) + "px";
            sub.style.top = Math.round(rr.top) + "px";
            if (rr.right - 2 + sb.width > window.innerWidth - 4)
              sub.style.left = Math.max(4, Math.round(rr.left - sb.width + 2)) + "px";
            if (rr.top + sb.height > window.innerHeight - 4)
              sub.style.top = Math.max(4, window.innerHeight - sb.height - 4) + "px";
            row._sub = sub;
          } else {
            closeSubs(host);
          }
        };
        row.onclick = () => {
          if (it.disabled || it.submenu) return;
          closeList();
          if (onPick) onPick(it.value, it);
          else if (it.pick) it.pick();
        };
        host.appendChild(row);
      });
    };
    build(items, box, 0);
    box.style.left = Math.round(r.left) + "px";
    box.style.top = Math.round(r.bottom) + "px";
    const br = box.getBoundingClientRect();
    if (br.bottom > window.innerHeight - 4) box.style.top = Math.max(4, Math.round(r.top - br.height)) + "px";
    if (br.right > window.innerWidth - 4) box.style.left = Math.max(4, window.innerWidth - br.width - 4) + "px";
    openList = box;
    return box;
  }

  /* ---------------- field widgets ---------------- */
  function txt(value, opts) {
    const i = el("input", "tvf");
    i.type = "text";
    i.value = value == null ? "" : value;
    if (opts && opts.width) i.style.width = opts.width + "px";
    if (opts && opts.align) i.style.textAlign = opts.align;
    if (opts && opts.readonly) i.readOnly = true;
    if (opts && opts.disabled) i.disabled = true;
    if (opts && opts.title) i.title = opts.title;
    return i;
  }
  function spin(value, step, opts) {
    const wrap = el("span", "tvspin");
    const i = txt(value, opts);
    i.style.width = ((opts && opts.width) || 62) + "px";
    const suffix = (opts && opts.suffix) || "";
    if (suffix && !String(i.value).endsWith(suffix)) i.value = String(i.value) + suffix;
    const fmtV = (v) => ((opts && opts.decimals != null) ? v.toFixed(opts.decimals) : String(Math.round(v))) + suffix;
    const l = el("span", "sp l", "\u25C4");
    const r = el("span", "sp r", "\u25BA");
    const bump = (d) => {
      const v = (parseFloat(i.value) || 0) + d * step;
      i.value = fmtV(v);
      if (opts && opts.onInput) opts.onInput();
    };
    l.onclick = () => bump(-1);
    r.onclick = () => bump(1);
    wrap.append(i, l, r);
    wrap.input = i;
    return wrap;
  }
  function combo(value, opts) {
    const c = el("div", "tvcombo");
    c.innerHTML = `<span class="v">${esc(value)}</span><span class="a">\u25BC</span>`;
    c.style.width = ((opts && opts.width) || 120) + "px";
    c.getValue = () => c.querySelector(".v").textContent;
    c.setValue = (v) => { c.querySelector(".v").textContent = v; };
    c.onmousedown = (e) => {
      e.preventDefault();
      if (opts && opts.disabled) return;
      const items = typeof opts.items === "function" ? opts.items() : opts.items;
      tvList(c, items.map(it => typeof it === "string" ? { label: it, value: it } : it),
        (v) => {
          c.setValue(typeof v === "string" ? v : (v && v.label != null ? v.label : String(v)));
          const fn = c.onPick || (opts && opts.onPick);
          if (fn) fn(v);
        });
    };
    return c;
  }
  function check(on) {
    const c = el("span", "tvchk" + (on ? " on" : ""));
    c.onclick = () => { c.classList.toggle("on"); };
    c.checked = () => c.classList.contains("on");
    return c;
  }
  function row(cls) { const r = el("div"); if (cls) r.className = cls; return r; }

  /* ---------------- generic message / confirm ---------------- */
  function tvMessage(title, text, buttons, w) {
    const dlg = tvWin(title, w || 340);
    const b = bodyOf(dlg);
    b.appendChild(el("div", "tvmsg", esc(text)));
    const bar = el("div");
    bar.style.cssText = "display:flex;justify-content:center;gap:8px;margin-top:12px";
    (buttons || [{ label: "OK", value: true }]).forEach(btn => {
      const q = el("button", "tvbtn", esc(btn.label));
      if (btn.primary) q.classList.add("pri");
      q.onclick = () => {
        dlg.remove();
        if (lastDlg === dlg) lastDlg = null;
        if (btn.then) btn.then();
        if (btn.resolve) btn.resolve(btn.value);
      };
      bar.appendChild(q);
    });
    b.appendChild(bar);
    return dlg;
  }
  const tvConfirm = (title, text, buttons, w) => new Promise(res => {
    const bs = (buttons || [{ label: "OK", value: true }, { label: "Cancel", value: false }]).map(b => Object.assign({}, b, { resolve: res }));
    tvMessage(title, text, bs, w);
  });

  /* ---------------- recents (File > Recent projects/folders/files) -------- */
  const RK = "tv12_recents_v1";
  const EMPTY_RECENTS = { projects: [], folders: [], files: [] };
  function recents() {
    try {
      const o = JSON.parse(localStorage.getItem(RK));
      if (!o || typeof o !== "object") return Object.assign({}, EMPTY_RECENTS);
      return { projects: o.projects || [], folders: o.folders || [], files: o.files || [] };
    } catch (e) { return Object.assign({}, EMPTY_RECENTS); }
  }
  function saveRecents(o) { try { localStorage.setItem(RK, JSON.stringify(o)); } catch (e) {} }
  function baseName(p) { return String(p).split(/[\\/]/).pop(); }
  function dirName(p) { const s = String(p); const i = Math.max(s.lastIndexOf("\\"), s.lastIndexOf("/")); return i > 0 ? s.slice(0, i) : s; }
  function pushRecent(kind, p) {
    if (!p) return;
    const o = recents();
    const list = o[kind] || [];
    const i = list.indexOf(p);
    if (i >= 0) list.splice(i, 1);
    list.unshift(p);
    while (list.length > 10) list.pop();
    o[kind] = list;
    saveRecents(o);
  }
  window.tvRecentCount = (kind) => (recents()[kind] || []).length;
  window.tvRecentMenuItems = (kind) => (recents()[kind] || []).map(p => ({
    label: baseName(p), cmd: "recent.open", arg: { kind, path: p }
  }));
  window.tvHasProject = () => !!proj && !proj.closed;
  window.tvRemember = (kind, p) => pushRecent(kind, p);

  /* ---------------- templates (File > Save Project as Template...) -------- */
  const TK = "tv12_templates_v1";
  function templates() { try { return JSON.parse(localStorage.getItem(TK)) || []; } catch (e) { return []; } }
  function saveTemplates(l) { try { localStorage.setItem(TK, JSON.stringify(l)); } catch (e) {} }
  function templateNames() { return templates().map(t => t.name); }

  /* ---------------- New Project ---------------- */
  function presetItems() {
    const px = window.screen.width * (window.devicePixelRatio || 1);
    const py = window.screen.height * (window.devicePixelRatio || 1);
    const items = [
      { label: "Display", value: { w: Math.round(px), h: Math.round(py), name: "Display", label: "Display" } },
      { label: "Clipboard", value: { w: 0, h: 0, name: "Clipboard", label: "Clipboard" }, disabled: true },
      { label: "Current Project", value: { w: proj ? proj.width : 1920, h: proj ? proj.height : 1080, name: "Current Project", label: "Current Project" } }
    ];
    PAGE_GROUPS.forEach(g => {
      items.push({
        label: g,
        submenu: PAGE_SIZES.filter(p => p.group === g).map(p => ({
          label: p.name,
          value: {
            w: p.w, h: p.h, fps: p.fps, dpi: p.dpi, par: p.par, name: p.name, group: g,
            // the live combo shows "HDTV HD 1080p" once a preset is picked
            label: g + " " + p.name
          }
        }))
      });
    });
    return items;
  }

  let templateSel = null;
  function tvNewProjectDialog() {
    const isCam = !!(proj && proj.cameraKeys && proj.cameraKeys.length);
    // live window rectangle: 664 x 328 (measured from the 2x capture)
    const dlg = tvWin("New Project", 664, 328);
    const b = bodyOf(dlg);
    b.style.padding = "7px 8px 8px";

    /* --- Template row (label 120, combo, Remove 60) --- */
    const trow = el("div");
    trow.style.cssText = "display:grid;grid-template-columns:120px 1fr 60px;gap:6px;align-items:center;margin-bottom:7px";
    const tl = el("div", "tvlbl", "Template:"); tl.style.textAlign = "right";
    const tcombo = combo("None", {
      width: 430,
      items: () => [{ label: "None", value: "None" }].concat(templateNames().map(n => ({ label: n, value: n })))
    });
    const removeBtn = el("button", "tvbtn", "Remove");
    removeBtn.onclick = () => {
      const n = tcombo.getValue();
      if (!n || n === "None") return;
      saveTemplates(templates().filter(t => t.name !== n));
      tcombo.setValue("None");
      toast("template removed: " + n);
    };
    trow.append(tl, tcombo, removeBtn);

    /* --- tabs: 173 / 200 px, active one blue (#3e476b) --- */
    const tabs = el("div", "tvtabs");
    tabs.style.marginBottom = "9px";
    const tabP = el("div", "tvt" + (isCam ? "" : " on"), "Project");
    const tabC = el("div", "tvt" + (isCam ? " on" : ""), "Project with Camera");
    tabP.style.width = "198px"; tabC.style.width = "200px";
    tabs.append(tabP, tabC);

    /* --- the three columns --- */
    const grid = el("div");
    grid.style.cssText = "display:grid;grid-template-columns:232px 210px 1fr;gap:6px;align-items:start";

    const row2 = (host, label, widget, labelW, mt) => {
      const r = el("div");
      r.style.cssText = "display:grid;grid-template-columns:" + labelW + "px 1fr;gap:4px;align-items:center;margin-top:" + (mt || 4) + "px";
      const l = el("div", "tvlbl", label); l.style.textAlign = "right";
      r.append(l, widget);
      host.appendChild(r);
      return r;
    };
    const hdr = (text) => {
      const d = el("div", "tvlbl", text);
      d.style.cssText = "text-align:center;margin-bottom:3px";
      return d;
    };

    /* left: camera view / project size */
    const colL = el("div");
    const sizeHdr = hdr(isCam ? "Camera View (Final Output)" : "Project Size");
    const preset = combo(isCam ? "HDTV HD 1080p" : "HDTV/UHD 4K", { width: 231, items: presetItems });
    preset.style.cssText = "width:231px;margin-bottom:12px";
    colL.append(sizeHdr, preset);
    const camW = spin(isCam ? 1920 : (proj ? proj.width : 1920), 1, { width: 75 });
    row2(colL, "Width", camW, 90, 0);
    const camH = spin(isCam ? 1080 : (proj ? proj.height : 1080), 1, { width: 75 });
    row2(colL, "Height", camH, 90, 4);
    const fpsC = combo("24.000", { width: 92, items: FRAME_RATES.map(v => ({ label: Number(v).toFixed(3), value: v })) });
    row2(colL, "Frame Rate", fpsC, 90, 4);
    const dpiC = combo("72", { width: 92, items: [36, 72, 96, 150, 200, 300, 600, 1200].map(v => ({ label: String(v), value: v })) });
    row2(colL, "DPI Resolution", dpiC, 90, 4);

    /* middle: ratio + print size */
    const colM = el("div");
    const ratioHdr = hdr("Ratio");
    colM.appendChild(ratioHdr);
    const rset = (sp, v) => { sp.input.value = Number(v).toFixed(2) + "%"; };
    const ratioX = spin(isCam ? "200.00%" : "100.00%", 1, { width: 75, decimals: 2, suffix: "%" });
    row2(colM, "Width", ratioX, 50, 30);
    const ratioY = spin(isCam ? "200.00%" : "100.00%", 1, { width: 75, decimals: 2, suffix: "%" });
    row2(colM, "Height", ratioY, 50, 4);
    const pg = el("div");
    pg.style.cssText = "display:grid;grid-template-columns:50px 75px 8px 56px;grid-template-rows:17px 17px;gap:3px 4px;align-items:center;margin-top:6px";
    const pwL = el("div", "tvlbl", "Width"); pwL.style.textAlign = "right";
    const phL = el("div", "tvlbl", "Height"); phL.style.textAlign = "right";
    const printW = spin("677.33", 1, { width: 59, decimals: 2 });
    const printH = spin("381.00", 1, { width: 59, decimals: 2 });
    const unitC = combo("mm", { width: 56, items: UNITS.map(u => ({ label: u[0], value: u[0] })) });
    pwL.style.gridArea = "1/1"; printW.style.gridArea = "1/2";
    phL.style.gridArea = "2/1"; printH.style.gridArea = "2/2";
    unitC.style.gridArea = "1/4/3/5";
    pg.append(pwL, printW, phL, printH, unitC);
    colM.appendChild(pg);

    /* right: drawing area */
    const colR = el("div");
    const drawHdr = hdr("Drawing Area");
    colR.appendChild(drawHdr);
    const drawW = spin(isCam ? 3840 : (proj ? proj.width : 1920), 1, { width: 75 });
    row2(colR, "Width", drawW, 50, 30);
    const drawH = spin(isCam ? 2160 : (proj ? proj.height : 1080), 1, { width: 75 });
    row2(colR, "Height", drawH, 50, 4);

    grid.append(colL, colM, colR);

    /* --- Load Library File: label, Browse, field (live order) --- */
    const libRow = el("div");
    libRow.style.cssText = "display:grid;grid-template-columns:130px 120px 1fr;gap:6px;align-items:center;margin-top:12px";
    const libLbl = el("div", "tvlbl", "Load Library File"); libLbl.style.textAlign = "right";
    const browseLib = el("button", "tvbtn", "Browse");
    const libField = txt("", { readonly: true });
    libRow.append(libLbl, browseLib, libField);
    let libraryFile = null;
    browseLib.onclick = async () => {
      if (!TVP || !TVP.openLibraryFile) return toast("library files need the desktop build");
      const f = await TVP.openLibraryFile();
      if (f) { libraryFile = f; libField.value = baseName(f); }
    };

    b.append(trow, tabs, grid, libRow);

    const create = el("button", "tvbtn", "New Project");
    create.style.cssText = "position:absolute;left:50%;transform:translateX(-50%);bottom:10px;width:150px;height:19px";
    b.appendChild(create);

    /* --- behaviour (camera x ratio = drawing area, print size from camera) --- */
    const isCamNow = () => tabC.classList.contains("on");
    const num = (sp) => Math.max(1, Math.round(parseFloat(sp.input.value) || 1));
    const syncRatio = () => {
      if (!isCamNow()) return;
      const cw = num(camW), ch = num(camH);
      const rx = parseFloat(ratioX.input.value) || 100, ry = parseFloat(ratioY.input.value) || 100;
      drawW.input.value = Math.round(cw * rx / 100);
      drawH.input.value = Math.round(ch * ry / 100);
      syncPrint();
    };
    const syncPrint = () => {
      const dpi = parseFloat(dpiC.getValue()) || 72;
      const unit = unitC.getValue();
      const k = (UNITS.find(u => u[0] === unit) || UNITS[0])[1];
      if (k == null) { printW.input.value = num(camW); printH.input.value = num(camH); return; }
      printW.input.value = (num(camW) / dpi * k).toFixed(2);
      printH.input.value = (num(camH) / dpi * k).toFixed(2);
    };
    const setTab = (cam) => {
      tabP.classList.toggle("on", !cam);
      tabC.classList.toggle("on", cam);
      sizeHdr.textContent = cam ? "Camera View (Final Output)" : "Project Size";
      ratioX.input.readOnly = !cam; ratioY.input.readOnly = !cam;
      drawW.input.readOnly = !cam; drawH.input.readOnly = !cam;
      if (!cam) {
        rset(ratioX, 100); rset(ratioY, 100);
        drawW.input.value = num(camW); drawH.input.value = num(camH);
      } else {
        rset(ratioX, 200); rset(ratioY, 200);
        syncRatio();
      }
      syncPrint();
    };
    tabP.onclick = () => setTab(false);
    tabC.onclick = () => setTab(true);
    [camW.input, camH.input].forEach(i => i.addEventListener("input", () => {
      if (isCamNow()) syncRatio();
      else { drawW.input.value = num(camW); drawH.input.value = num(camH); }
      syncPrint();
    }));
    [ratioX.input, ratioY.input].forEach(i => i.addEventListener("input", syncRatio));
    [drawW.input, drawH.input].forEach(i => i.addEventListener("input", () => {
      if (!isCamNow()) return;
      const cw = num(camW), ch = num(camH);
      rset(ratioX, num(drawW) / cw * 100);
      rset(ratioY, num(drawH) / ch * 100);
    }));
    dpiC.onPick = syncPrint;
    unitC.onPick = syncPrint;
    preset.onPick = (v) => {
      if (!v || !v.w) return;
      camW.input.value = v.w; camH.input.value = v.h;
      if (v.fps) fpsC.setValue(Number(v.fps).toFixed(3));
      if (v.dpi) dpiC.setValue(String(v.dpi));
      if (isCamNow()) syncRatio(); else { drawW.input.value = v.w; drawH.input.value = v.h; }
      syncPrint();
    };
    tcombo.onPick = (v) => {
      const t = templates().find(x => x.name === v);
      if (!t) return;
      try {
        const p = E.deserializeProject(t.data, restoreFns || undefined);
        camW.input.value = p.width; camH.input.value = p.height;
        drawW.input.value = p.width; drawH.input.value = p.height;
        fpsC.setValue(Number(p.fps).toFixed(3));
        dpiC.setValue(String(p.dpi || 72));
        if (!isCamNow()) setTab(false); else syncRatio();
        syncPrint();
        templateSel = t;
      } catch (e) { toast("template read failed"); }
    };
    if (isCam) { ratioX.input.readOnly = false; ratioY.input.readOnly = false; syncRatio(); }
    else { ratioX.input.readOnly = true; ratioY.input.readOnly = true; }
    syncPrint();

    create.onclick = () => {
      const cam = isCamNow();
      const w = Math.max(16, num(cam ? drawW : camW));
      const h = Math.max(16, num(cam ? drawH : camH));
      const fps = Math.max(1, parseFloat(fpsC.getValue()) || 24);
      const dpi = Math.max(1, parseFloat(dpiC.getValue()) || 72);
      dlg.remove(); if (lastDlg === dlg) lastDlg = null;
      if (templateSel && templateSel.data) {
        try {
          proj = E.deserializeProject(templateSel.data, restoreFns || undefined);
          hist.clear();
          proj.name = "Untitled_(1)";
          ghostTmp = E.makeSurface(proj.width, proj.height);
          sel = null; fitView(); syncToolPanel(); renderTimelineStatus(); renderAll();
          toast("new project from template: " + templateSel.name);
          return;
        } catch (e) { /* fall through to a blank project */ }
      }
      proj = E.newProject(w, h, fps);
      hist.clear();
      proj.name = "Untitled_(1)";
      proj.dpi = dpi;
      proj.layers.forEach((l, i) => { l.name = "Anim_0" + (i + 1); });
      if (cam) {
        proj.cameraView = { w: num(camW), h: num(camH) };
        proj.cameraKeys = [E.newCameraKey(1, {})];
      } else { proj.cameraView = null; proj.cameraKeys = null; }
      if (libraryFile) proj.libraryFile = libraryFile;
      ghostTmp = E.makeSurface(w, h);
      sel = null; cutBrush = null;
      fitView(); syncFpsSel(); syncToolPanel(); renderTimelineStatus(); renderAll();
    };
    return dlg;
  }


  /* ---------------- Save / Save As / Template ---------------- */
  function projectFileName() {
    const n = (proj && proj.name ? proj.name : "Untitled_(1)").replace(/^\*/, "");
    return n.replace(/\.tvpp$/i, "") + ".tvpp";
  }
  async function tvSaveProject(forceDialog) {
    if (!proj || proj.closed) return false;
    const data = E.serializeProject(proj);
    if (!TVP) {
      // browser fallback: download the .tvpp
      const a = doc.createElement("a");
      a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
      a.download = projectFileName(); a.click();
      proj.dirty = false; renderTimelineStatus();
      toast("saved " + a.download);
      return true;
    }
    let file = proj.filePath;
    if (!file || forceDialog) {
      file = await TVP.saveProjectDialog(projectFileName());
      if (!file) return false;
    }
    const ok = await TVP.writeFile(file, data);
    if (!ok) { toast("could not write " + file); return false; }
    proj.filePath = file;
    proj.name = baseName(file);
    proj.dirty = false;
    pushRecent("projects", file);
    pushRecent("folders", dirName(file));
    renderTimelineStatus();
    toast("saved " + file);
    return true;
  }
  function tvSaveProjectAs() { return tvSaveProject(true); }

  function tvSaveTemplate() {
    const dlg = tvWin("Template name", 150, 92);
    const b = bodyOf(dlg);
    b.style.padding = "6px";
    const i = txt((proj && proj.name ? proj.name : "Untitled_").replace(/^\*/, "").replace(/\.tvpp$/i, ""), { width: 117 });
    i.style.width = "117px";
    b.appendChild(i);
    const bar = el("div");
    bar.style.cssText = "display:flex;gap:6px;justify-content:center;margin-top:12px";
    const ok = el("button", "tvbtn", "OK"), cancel = el("button", "tvbtn", "Cancel");
    bar.append(ok, cancel);
    b.appendChild(bar);
    i.select();
    ok.onclick = () => {
      const name = i.value.trim();
      if (!name) return;
      const data = E.serializeProject(proj);
      const l = templates().filter(t => t.name !== name);
      l.unshift({ name, data });
      saveTemplates(l.slice(0, 30));
      dlg.remove(); if (lastDlg === dlg) lastDlg = null;
      toast("template saved: " + name);
    };
    cancel.onclick = () => { dlg.remove(); if (lastDlg === dlg) lastDlg = null; };
    i.addEventListener("keydown", (e) => { if (e.key === "Enter") ok.click(); if (e.key === "Escape") cancel.click(); });
    setTimeout(() => i.focus(), 30);
    return dlg;
  }

  async function tvCloseProject() {
    if (!proj || proj.closed) return;
    if (proj.dirty) {
      const r = await tvConfirm("Close Project",
        `Save changes to ${proj.name}?`,
        [{ label: "Save", value: "save", primary: true }, { label: "Don't Save", value: "no" }, { label: "Cancel", value: "cancel" }], 380);
      if (r === "cancel") return;
      if (r === "save") { const ok = await tvSaveProject(false); if (!ok) return; }
    }
    proj.closed = true;
    proj.layers = [];
    proj.cameraKeys = null; proj.cameraView = null;
    hist.clear();
    sel = null;
    renderAll();
    window.scrollTo(0, 0);
    toast("project closed");
  }

  /* ---------------- Export Footage ---------------- */
  const EXPORT_FORMATS = ["PNG", "JPG", "WebP", "TIFF", "TGA", "PSD", "BMP", "OpenEXR", "AVI", "QuickTime", "MPEG-4"];
  const EXPORT_MODES = ["Palette", "Greyscale", "RGB", "RGBA", "Alpha Only"];
  const EXPORT_ALPHA = ["PreMult.", "No PreMult."];
  const EXPORT_AS = ["Single Image", "Sequence", "Animation"];
  const EXPORT_STRUCTURES = ["PSD (.psd)", "JSON (.json + images)", "CSV (.csv + .png files)", "Flix (.xml + .psd files)"];

  // The export composer.  `opts` carries the Export Footage options that
  // change the produced pixels:
  //   background  false = no background colour (alpha kept), true = the
  //               project background colour is written under the drawing
  //   slate      { on, layout: "Overlay" | "Resize within Border", borderPct }
  //   notes      the project notes, drawn at the bottom of the file
  //   blend      { frame, frac } - the next source frame blended in, used by
  //               the Time Interpolation option
  function composeFrame(frame, w, h, viewMode, opts) {
    const o = opts || {};
    const out = E.makeSurface(w, h);
    const c = out.getContext("2d");
    if (o.background === false) {
      c.clearRect(0, 0, w, h);
    } else {
      c.fillStyle = o.bgColor || (proj && proj.bgA) || "#ffffff";
      c.fillRect(0, 0, w, h);
    }
    if (!proj || proj.closed) return out;

    // the slate reserves a band at the top and at the bottom
    const sl = (o.slate && o.slate.on) ? o.slate : null;
    const band = sl ? Math.max(6, Math.round(h * (sl.ratio || 10) / 100)) : 0;
    const inner = sl && sl.layout === "Resize Image within Border"
      ? { x: 0, y: band, w: w, h: Math.max(1, h - band * 2) }
      : { x: 0, y: 0, w: w, h: h };

    let sx = 0, sy = 0, sw = proj.width, sh = proj.height;
    if (viewMode === "Camera" && proj.cameraKeys && proj.cameraKeys.length) {
      const r = E.cameraRect(proj, E.cameraEvaluate(proj, frame));
      sx = r.x; sy = r.y; sw = r.w; sh = r.h;
    }
    const kx = inner.w / sw, ky = inner.h / sh;
    const drawLayers = (f, alpha) => {
      proj.layers.forEach(l => {
        if (!l.visible) return;
        const key = E.effectiveFrameKey(l, f);
        const surf = key !== null ? l.frames[key] && l.frames[key].canvas : null;
        if (surf && surf.getContext) {
          c.globalAlpha = l.opacity * alpha;
          c.drawImage(surf, sx, sy, sw, sh, inner.x, inner.y, Math.round(sw * kx), Math.round(sh * ky));
          c.globalAlpha = 1;
        }
      });
    };
    drawLayers(frame, 1);
    // "Perform TimeStretch by creating new frame instead of duplicating frame"
    if (o.blend && o.blend.frac > 0.001) drawLayers(o.blend.frame, o.blend.frac);

    const notesBand = o.notes ? notesBandHeight(c, w, h, o.notes) : 0;
    if (sl) drawSlate(c, w, h, sl, frame, o.pos || 1, o.total || 1, notesBand);
    if (o.notes) drawNotes(c, w, h, o.notes, notesBand);
    return out;
  }

  // TVPaint 12's slate, drawn exactly as the live panel draws it
  // (shots/live-slate-on.png): a band at the top and one at the bottom,
  // the band height being the "Ratio" percent of the image height.  The
  // top carries "<project> - <clip> - (<pos>/<total>)" on the left and the
  // frame number on the right, the bottom the date on the left, the logo
  // in the middle and the author on the right.  Each caption sits on a
  // black box of its own.
  const SLATE_LOGO = new Image();
  try { SLATE_LOGO.src = "Resources/tvpaint_logo_wider.png"; } catch (e) { /* no logo */ }

  function slateText(format, pname, cname, pos, total, frame) {
    return String(format || "").split(" - ").map(part => {
      const p = part.trim().toLowerCase();
      if (p === "project") return pname;
      if (p === "clip") return cname;
      if (p === "position") return "(" + pos + "/" + total + ")";
      if (p === "frame" || p === "time") return String(frame);
      return part;
    }).join(" - ");
  }
  function slateDate(format) {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear());
    switch (String(format || "Day Month Year")) {
      case "Month Day Year": return mm + "/" + dd + "/" + yy;
      case "Year Month Day": return yy + "/" + mm + "/" + dd;
      default: return dd + "/" + mm + "/" + yy;
    }
  }
  function drawSlate(c, w, h, sl, frame, pos, total, bottomOffset) {
    const band = Math.max(6, Math.round(h * (sl.ratio || 10) / 100));
    const fs = Math.max(5, Math.round(band * 0.68));
    const pad = Math.round(fs * 1.3);
    const pname = proj && proj.name ? proj.name.replace(/^\*/, "").replace(/\.tvpp$/i, "") : "";
    const cname = "Clip_001";
    c.save();
    c.font = fs + "px " + (sl.font || "Arial") + ", Tahoma, sans-serif";
    c.textBaseline = "middle";
    // --- top band: the title on the left, the frame number on the right
    if (sl.titleOn !== false) {
      const t = slateText(sl.title, pname, cname, pos, total, frame);
      const tw = c.measureText(t).width;
      c.fillStyle = sl.bgColor || "#000000";
      c.fillRect(0, 0, tw + pad * 2, band);
      c.fillStyle = sl.textColor || "#ffffff";
      c.textAlign = "left";
      c.fillText(t, pad, Math.round(band / 2));
    }
    if (sl.frameOn !== false) {
      const t = sl.frame === "Time" ? slateTime(frame) : String(frame);
      const tw = c.measureText(t).width;
      c.fillStyle = sl.bgColor || "#000000";
      c.fillRect(w - tw - pad * 2, 0, tw + pad * 2, band);
      c.fillStyle = sl.textColor || "#ffffff";
      c.textAlign = "center";
      c.fillText(t, w - tw / 2 - pad, Math.round(band / 2));
    }
    // --- bottom band: the date, the logo, the author
    const y0 = h - band - (bottomOffset || 0);
    let authorW = 0;
    let authorText = "";
    if (sl.authorOn !== false && sl.author) {
      authorText = sl.author;
      authorW = c.measureText(authorText).width + pad * 2;
    }
    if (sl.dateOn !== false) {
      const t = slateDate(sl.date);
      const tw = c.measureText(t).width;
      c.fillStyle = sl.bgColor || "#000000";
      c.fillRect(0, y0, tw + pad * 2, band);
      c.fillStyle = sl.textColor || "#ffffff";
      c.textAlign = "left";
      c.fillText(t, pad, y0 + Math.round(band / 2));
    }
    if (sl.logoOn !== false) {
      const dateW = sl.dateOn !== false ? c.measureText(slateDate(sl.date)).width + pad * 2 : 0;
      const bx = dateW, bw = Math.max(0, w - dateW - authorW);
      c.fillStyle = "#505057";
      c.fillRect(bx, y0, bw, band);
      if (SLATE_LOGO.complete && SLATE_LOGO.naturalWidth) {
        const lh = Math.round(band * 0.53), lw = Math.round(lh * (SLATE_LOGO.naturalWidth / SLATE_LOGO.naturalHeight));
        c.save();
        c.globalAlpha = 0.95;
        c.drawImage(SLATE_LOGO, Math.round(bx + (bw - lw) / 2), Math.round(y0 + (band - lh) / 2), lw, lh);
        c.restore();
      }
    }
    if (authorText) {
      c.fillStyle = sl.bgColor || "#000000";
      c.fillRect(w - authorW, y0, authorW, band);
      c.fillStyle = sl.textColor || "#ffffff";
      c.textAlign = "center";
      c.fillText(authorText, w - authorW / 2, y0 + Math.round(band / 2));
    }
    c.restore();
  }
  function slateTime(frame) {
    const fps = Number(proj && proj.fps) || 24;
    const s = Math.max(0, (Number(frame) - 1) / fps);
    const mm = Math.floor(s / 60), ss = Math.floor(s % 60), ff = Math.floor((s % 1) * fps);
    return String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0") + ":" + String(ff).padStart(2, "0");
  }

  // "Add notes at bottom of the file" - the project notes of the timeline,
  // written on a band at the bottom of the exported image.
  function notesLines(notes) {
    return String(notes == null ? "" : notes).split(/\r?\n/).filter(l => l.length).slice(-4);
  }
  function notesBandHeight(c, w, h, notes) {
    const lines = notesLines(notes);
    if (!lines.length) return 0;
    const fs = Math.max(9, Math.round(h * 0.022));
    return Math.round(fs * (lines.length + 1.4));
  }
  function drawNotes(c, w, h, notes, band) {
    const lines = notesLines(notes);
    if (!lines.length) return;
    const fs = Math.max(9, Math.round(h * 0.022));
    band = band || Math.round(fs * (lines.length + 1.4));
    c.save();
    c.font = fs + "px Tahoma, sans-serif";
    c.textBaseline = "bottom";
    c.textAlign = "left";
    c.fillStyle = "rgba(255,255,255,0.85)";
    c.fillRect(0, h - band, w, band);
    let y = h - Math.round(fs * 0.4);
    for (let i = lines.length - 1; i >= 0; i--) {
      c.fillStyle = "#101014";
      c.fillText(lines[i], Math.round(fs * 0.4), y);
      y -= Math.round(fs * 1.25);
    }
    c.restore();
  }

  /* ------------------------------------------------------------------
     Export Footage - rebuilt from the live 12 dialog (1008x569):
       tabs 98 / 73 / 138 / 125 px, Clip name right-aligned at x=535,
       Browse button 130 px, "As" combo 240 px, Export/Cancel at the top
       right, the settings on the left (labels right-aligned at x=180,
       fields at x=187), the white preview 630x342 with the TVPAINT 12
       watermark in both corners, and the frame bar under the preview.
     Tab-dependent fields (captured): Project/Clip display = Format,
     Mode, Alpha, Compression; Layers structure = Structure, Visible
     Layers, Create folder for layers. Custom Brush without a brush shows
     "Please create a custom brush before trying to export one."
     ------------------------------------------------------------------ */
  function tvExportDialog() {
    const dlg = tvWin("Export Footage", 1008, 569);
    const b = bodyOf(dlg);
    b.style.cssText = "padding:0;position:relative;overflow:hidden";

    const at = (n, x, y, w, h) => {
      n.style.position = "absolute";
      n.style.left = x + "px"; n.style.top = y + "px";
      if (w != null) n.style.width = w + "px";
      if (h != null) n.style.height = h + "px";
      return n;
    };
    const labelAt = (t, x, y, w) => {
      const d = el("div", "tvlbl", t);
      d.style.textAlign = "right";
      return at(d, x, y, w, 14);
    };
    const mkCheck = (x, y, on) => at(check(!!on), x, y, 13, 13);
  const mkBig = (x, y, on) => { const c = at(check(!!on), x, y, 21, 18); c.classList.add("big"); return c; };
    const projName = () => (proj && proj.name ? proj.name.replace(/^\*/, "").replace(/\.tvpp$/i, "") : "Untitled_(1)");
    const withExt = (p, ext) => String(p).replace(/\.[a-z0-9]+$/i, "") + "." + ext;
    const safeName = (s) => String(s || "layer").replace(/[\\/:*?"<>|]+/g, "_");
    const csvEsc = (s) => /[",\r\n]/.test(String(s)) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s);

    /* --- tabs (live widths) --- */
    const tabNames = ["Project: Display", "Clip: Display", "Clip: Layers structure", "Custom Brush: Display"];
    const tabW = [104, 87, 132, 139];
    let tabIndex = 0;
    const tabEls = [];
    let tx = 6;
    tabNames.forEach((n, i) => {
      const t = el("div", "tvt", n);
      at(t, tx, 7, tabW[i], 16);
      t.style.padding = "0";
      t.style.justifyContent = "center";
      t.title = "Selected Tab indicates the content of the exported footage";
      t.onclick = () => {
        tabIndex = i;
        tabEls.forEach((o, j) => o.classList.toggle("on", j === i));
        refresh();
      };
      b.appendChild(t); tabEls.push(t);
      tx += tabW[i];
    });
    // live: the 1px baseline under the strip is the active tab colour
    const tabLine = el("div");
    at(tabLine, 6, 23, 465, 2);
    tabLine.style.cssText += "background:#3e476b;pointer-events:none;z-index:4";
    b.appendChild(tabLine);

    /* --- name + path --- */
    // live: a recessed #2d2d32 band (dialog y 48..77) holds the clip name
    const nameBand = el("div");
    at(nameBand, 0, 25, 1008, 29);
    nameBand.style.background = "#2d2d32";
    b.appendChild(nameBand);
    const clipName = el("div", "tvlbl", "");
    clipName.style.textAlign = "right";
    at(clipName, 335, 34, 200, 14);
    b.appendChild(clipName);

    const browse = el("button", "tvbtn", "Browse");
    at(browse, 6, 56, 117, 17);
    browse.title = "Click here to change the exported file location";
    const pathField = txt(documentsExportDefault(), {});
    at(pathField, 126, 56, 872, 17);
    pathField.title = "Exported File location and name";
    b.append(browse, pathField);

    /* --- As + Replace + Export/Cancel --- */
    b.appendChild(labelAt("As", 90, 96, 27));
    const asC = combo("Sequence", {
      width: 240,
      items: EXPORT_AS.map(x => ({ label: x, value: x }))
    });
    at(asC, 126, 94, 240, 17);
    asC.title = "Set the export of the file";
    b.appendChild(asC);

    const replaceChk = mkBig(369, 94, false);
    const replaceLbl = el("div", "tvlbl", "Replace existing file(s)");
    at(replaceLbl, 398, 98, 130, 14);
    b.append(replaceChk, replaceLbl);

    const exportBtn = el("button", "tvbtn", "Export");
    at(exportBtn, 847, 94, 74, 17);
    const cancelBtn = el("button", "tvbtn", "Cancel");
    at(cancelBtn, 925, 94, 74, 17);
    b.append(exportBtn, cancelBtn);

    /* --- display-tab settings --- */
    const pD = el("div"); at(pD, 0, 0, 1008, 547); b.appendChild(pD);

    pD.appendChild(labelAt("Format", 56, 117, 120));
    const fmtC = combo("PNG", { width: 163, items: EXPORT_FORMATS.map(x => ({ label: x, value: x })) });
    at(fmtC, 176, 117, 163, 17);
    fmtC.title = "Select the file format used for the exported footage";
    const gear = el("button", "tvbtn", "\u2699");
    at(gear, 343, 117, 23, 17);
    gear.style.padding = "0";
    gear.title = "Open File Format configuration panel";
    gear.onclick = () => toast("file format configuration - not exposed by the trial build");
    pD.append(fmtC, gear);

    pD.appendChild(labelAt("Mode", 56, 136, 120));
    const modeC = combo("RGBA", { width: 163, items: EXPORT_MODES.map(x => ({ label: x, value: x })) });
    at(modeC, 176, 136, 163, 17);
    modeC.title = "Set Channels to export";
    pD.appendChild(modeC);

    pD.appendChild(labelAt("Alpha", 56, 155, 120));
    const alphaC = combo("No PreMult.", { width: 163, items: EXPORT_ALPHA.map(x => ({ label: x, value: x })) });
    at(alphaC, 176, 155, 163, 17);
    alphaC.title = "Set Exported Footage Alpha Channel mode";
    pD.appendChild(alphaC);

    const compLbl = labelAt("Compression (lossless)", 126, 174, 140);
    compLbl.style.textAlign = "left";
    pD.appendChild(compLbl);
    const comp = spin("5", 1, { width: 53 });
    at(comp, 274, 174, 67, 17);
    comp.title = "Set the compression ratio";
    pD.appendChild(comp);

    pD.appendChild(labelAt("View", 96, 235, 70));
    const viewC = combo("Project", {
      width: 163,
      items: [{ label: "Project", value: "Project" }, { label: "Camera", value: "Camera" }, { label: "Clip", value: "Clip" }]
    });
    at(viewC, 176, 235, 163, 17);
    viewC.title = "Select the Exported Footage View";
    pD.appendChild(viewC);

    pD.appendChild(labelAt("Convert to", 76, 254, 95));
    const convC = combo("No Conversion (HDTV/UHD 4K)", {
      width: 163,
      items: [{ label: "No Conversion", value: "No Conversion" }].concat(PAGE_SIZES.map(p => ({ label: p.name, value: p.name })))
    });
    at(convC, 176, 254, 163, 17);
    convC.title = "Select a Preset to convert exported content";
    pD.appendChild(convC);

    const srcLabel = (v, y) => {
      const d = el("div", "tvlbl", v);
      d.style.cssText = "text-align:left;color:#c8c8cc;background:#2d2d32;padding-left:9px;line-height:17px;font-size:11px";
      return at(d, 177, y, 69, 17);
    };
    const triBtn = (y, fn) => {
      const q = el("button", "tvbtn", "\u25B7");
      at(q, 250, y, 16, 17);
      q.style.padding = "0";
      q.style.fontSize = "8px";
      q.style.background = "transparent";
      q.style.border = "0";
      q.style.color = "#b6b6b6";
      q.onclick = fn;
      return q;
    };

    const startW = proj ? proj.width : 1920, startH = proj ? proj.height : 1080;
    const startFps = proj ? Number(proj.fps).toFixed(3) : "24.000";
    const startDpi = String(proj && proj.dpi ? proj.dpi : 72);

    pD.appendChild(labelAt("Width", 96, 273, 70));
    const srcW = srcLabel(String(startW), 273);
    const tgtW = spin(String(startW), 1, { width: 53 });
    at(tgtW, 273, 273, 69, 17);
    tgtW.title = "Set Exported Footage Width";
    pD.append(srcW, triBtn(273, () => { tgtW.input.value = srcW.textContent; drawPreview(); }), tgtW);

    pD.appendChild(labelAt("Height", 96, 292, 70));
    const srcH = srcLabel(String(startH), 292);
    const tgtH = spin(String(startH), 1, { width: 53 });
    at(tgtH, 273, 292, 69, 17);
    tgtH.title = "Set Exported Footage Height";
    pD.append(srcH, triBtn(292, () => { tgtH.input.value = srcH.textContent; drawPreview(); }), tgtH);

    pD.appendChild(labelAt("Frame Rate", 96, 311, 70));
    const srcFps = srcLabel(startFps, 311);
    const tgtFps = combo(startFps, { width: 69, items: FRAME_RATES.map(v => ({ label: Number(v).toFixed(3), value: v })) });
    at(tgtFps, 273, 311, 69, 17);
    tgtFps.title = "Set Exported Footage Frame Rate";
    pD.append(srcFps, triBtn(311, () => tgtFps.setValue(srcFps.textContent)), tgtFps);

    pD.appendChild(labelAt("DPI Resolution", 96, 330, 70));
    const srcDpi = srcLabel(startDpi, 330);
    const tgtDpi = combo(startDpi, { width: 78, items: [36, 72, 96, 150, 200, 300, 600, 1200].map(v => ({ label: String(v), value: v })) });
    at(tgtDpi, 273, 330, 69, 17);
    tgtDpi.title = "Set Exported Footage Print Resolution";
    pD.append(srcDpi, triBtn(330, () => tgtDpi.setValue(srcDpi.textContent)), tgtDpi);

    pD.appendChild(labelAt("Pixel Aspect Ratio", 96, 349, 70));
    const srcPar = srcLabel("1.000", 349);
    const tgtPar = combo("1.000", { width: 78, items: [{ label: "1.000", value: 1 }, { label: "0.900", value: 0.9 }, { label: "1.200", value: 1.2 }] });
    at(tgtPar, 273, 349, 69, 17);
    tgtPar.title = "Set Exported Footage Pixel Aspect Ratio";
    pD.append(srcPar, triBtn(349, () => tgtPar.setValue(srcPar.textContent)), tgtPar);

    /* --- the seven export flags (live: flat 21x18 boxes, a bare tick when
       the option is on - Notes and Slate are check boxes as well) --- */
    const bgChk = mkBig(273, 372, true);
    bgChk.title = "Export Content with Layer Background";
    pD.append(labelAt("Background", 140, 372, 126), bgChk);

    const notesChk = mkBig(273, 391, false);
    notesChk.title = "Add notes at bottom of the file";
    pD.append(labelAt("Notes", 140, 392, 126), notesChk);

    const slateChk = mkBig(273, 410, false);
    slateChk.title = "Add a black border around the content with the current frame, the name of the project and clip, and the date.";
    const slateBtn = el("button", "tvbtn", "");
    at(slateBtn, 297, 410, 21, 17);
    slateBtn.style.padding = "0";
    slateBtn.style.background = "transparent";
    slateBtn.title = "Set some parameters of the slate.";
    // live: the whole button (crossed gear) is one picture, the plain gear when on
    const SLATE_OFF = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAARCAYAAAAyhueAAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAESSURBVDhPtZQ/D4JADMX5SixuTiQORicnpkuIRhwwMfxRGUhk41PXvGoVH4cJMQ6Py/XaH3ft9YIwnAk0n0cSRUtZLNaThTjEGyvAh51+kULxB15gpWkmZXnVkde6rvuYgxf4jpwke8mykzi31XlRXKRpbjpibnYGQuAFbIQArOtGQawkSUeBJi/Uud0T0kqenyWOnaxWGx37QPhx7CgUAhRAthvQduzTAHo4HF85tJ0xEHbLMfyZMYBWVf3KH47MQAh284E/MwZQ3065KJN3avpWZeQaULabvFCraj+HVv0HsFXo5Or3q8x3FcI9xn3mOIX6Oup9D8c7CkB0HsdqR3Hv+3L4rfdZ2vt/eaX+8Z7eAZaZvYdQZrBuAAAAAElFTkSuQmCC)";
    const SLATE_ON = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAARCAYAAAAyhueAAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAADySURBVDhPtZQ9DoJAEEb3SjR2VCQUJjZUnoHGG1DYkHgHcDWIUFHB9ca8TZZiQIUoxWOz88187L8Jgp1AGEYSRXuJ48NqqKPeexk+OukXnCl/0IKmKK7SNK1rtabBz8xNOcvOUlUPyfOL69f1U4ZhcC194ujk6Vr8jA4CBV3XOaNPkKdrYdaUkVDU971Ye5M0PUmSHF1L35v6mWhmTYEiDHQcvLGOeyam1t7HNWRkWgfifo3L0k70iWnbtuP0mLLWgbjPIV/rE9NNRur565rCt90nvnr3l5xT9LfndJMbteTus3ncfVqtadzd3+SV2uI9fQGMcfQJeLLpsgAAAABJRU5ErkJggg==)";
    const setSlateImg = (on) => {
      slateBtn.style.backgroundImage = on ? SLATE_ON : SLATE_OFF;
      slateBtn.style.backgroundRepeat = "no-repeat";
      slateBtn.style.backgroundPosition = "center";
    };
    pD.append(labelAt("Slate", 140, 411, 126), slateChk, slateBtn);

    const lockAspectChk = mkBig(273, 429, false);
    lockAspectChk.title = "Preserve Width / Height ratio";
    pD.append(labelAt("Lock aspect ratio", 140, 430, 126), lockAspectChk);

    const stretchChk = mkBig(273, 448, false);
    stretchChk.title = "TimeStretch Exported Footage to respect new Frame Rate";
    pD.append(labelAt("Stretch to Frame Rate", 140, 449, 126), stretchChk);

    const interpChk = mkBig(273, 467, false);
    interpChk.title = "Perform TimeStretch by creating new frame instead of duplicating frame";
    pD.append(labelAt("Time Interpolation", 140, 468, 126), interpChk);

    const splitChk = mkBig(273, 486, false);
    splitChk.title = "Split Scenes/Clip in different files";
    pD.append(labelAt("Split Scenes", 140, 487, 126), splitChk);

    /* --- the slate parameters (live: "Set some parameters of the slate.") --- */
    // TVPaint's slate settings (live panel, shots/live-slate-settings.png and
    // the .loc strings 011003200..011003262)
    const slateOpt = {
      layout: "Overlay", ratio: 10,
      textColor: "#ffffff", bgColor: "#000000",
      font: "Arial", style: "Regular", script: "Western",
      titleOn: true, title: "Project - Clip - Position",
      frameOn: true, frame: "Frame",
      dateOn: true, date: "Day Month Year",
      logoOn: true, logo: "",
      authorOn: true, author: ""
    };
    const syncSlateBtn = () => { setSlateImg(slateChk.checked()); };
    // keep the check box's own toggle and add the redraw after it
    const onFlag = (c, fn) => { const old = c.onclick; c.onclick = (e) => { if (old) old(e); fn(); }; };
    onFlag(slateChk, () => { syncSlateBtn(); drawPreview(); });
    onFlag(bgChk, () => drawPreview());
    onFlag(notesChk, () => drawPreview());
    onFlag(stretchChk, () => drawPreview());
    onFlag(interpChk, () => drawPreview());
    onFlag(splitChk, () => drawPreview());
    onFlag(lockAspectChk, () => drawPreview());
    slateBtn.onclick = () => {
      if (!slateChk.checked()) return;   // the live disables it while the slate is off
      tvSlateParams();
    };
    // The slate settings panel, laid out like the live one: 386x228, no
    // title bar, the labels right aligned at x=146, the check boxes at 139,
    // the widgets at 158 and the "..." buttons at 360, one row every 18 px.
    function tvSlateParams() {
      const p = el("div", "tvwin");
      p.style.cssText = "width:386px;height:228px;position:absolute;z-index:2450;background:#313136;" +
        "border:1px solid #2b2b30;box-shadow:0 6px 20px rgba(0,0,0,.6);padding:0";
      // the live opens it over the export panel, at +116 / +206 from its corner
      const dr = dlg.getBoundingClientRect();
      p.style.left = Math.round(dr.left + 116) + "px";
      p.style.top = Math.round(dr.top + 206) + "px";
      doc.body.appendChild(p);
      const rowY = [8, 26, 44, 62, 80, 98, 116, 134, 152, 170, 188];
      const lbl = (t, y) => {
        const d = el("div", "tvlbl", t);
        d.style.cssText = "position:absolute;left:40px;top:" + (y + 1) + "px;width:78px;height:15px;" +
          "text-align:right;color:#b6b6b6;font:11px 'Segoe UI',Tahoma,sans-serif";
        p.appendChild(d);
        return d;
      };
      const put = (node, x, y, w, h) => {
        node.style.cssText += ";position:absolute;left:" + x + "px;top:" + y + "px";
        if (w) node.style.width = w + "px";
        if (h) node.style.height = h + "px";
        p.appendChild(node);
        return node;
      };
      const mkCombo = (value, items, tip) => {
        const c = combo(value, { width: 200, items: items.map(v => ({ label: v, value: v })) });
        c.title = tip || "";
        return c;
      };
      const mkCheck = (on, tip) => {
        const c = check(!!on);
        c.classList.add("big");
        c.title = tip || "";
        return c;
      };
      const dots = (tip) => {
        const b = el("button", "tvbtn", "\u2026");
        b.style.cssText += ";width:17px;height:17px;padding:0;font-size:11px";
        b.title = tip || "";
        b.onclick = () => toast(tip || "");
        return b;
      };
      // 1 - Layout
      lbl("Layout", rowY[0]);
      const layC = mkCombo(slateOpt.layout, ["Overlay", "Resize Image within Border"],
        "Set the layout\n\n_ Overlay: the slate will overlay some part of the image\n_ Resize within Border: black borders will be added to display the slate, \nbut the inner image will be smaller than the original");
      put(layC, 158, rowY[0], 219, 17);
      layC.onPick = (v) => { slateOpt.layout = v; };
      // 2 - Ratio
      lbl("Ratio", rowY[1]);
      const ratioS = spin(String(slateOpt.ratio), 1, { width: 195, suffix: "%" });
      ratioS.input.value = slateOpt.ratio + "%";
      put(ratioS, 158, rowY[1], 212, 17);
      ratioS.title = "Set the ratio";
      ratioS.input.addEventListener("input", () => {
        slateOpt.ratio = Math.max(1, Math.min(50, parseInt(ratioS.input.value, 10) || 10));
        drawPreview();
      });
      // 3 - Color
      lbl("Color", rowY[2]);
      const cText = el("div"); cText.style.cssText = "background:" + slateOpt.textColor + ";width:18px;height:17px";
      cText.title = "Set the Text & Background Color";
      cText.onclick = () => { slateOpt.textColor = slateOpt.textColor === "#ffffff" ? "#101014" : "#ffffff"; cText.style.background = slateOpt.textColor; drawPreview(); };
      const cBg = el("div"); cBg.style.cssText = "background:" + slateOpt.bgColor + ";width:18px;height:17px";
      cBg.title = "Set the Text & Background Color";
      cBg.onclick = () => { slateOpt.bgColor = slateOpt.bgColor === "#000000" ? "#505057" : "#000000"; cBg.style.background = slateOpt.bgColor; drawPreview(); };
      put(cText, 158, rowY[2], 18, 17);
      put(cBg, 176, rowY[2], 18, 17);
      // 4 - Font Name
      lbl("Font Name", rowY[3]);
      const fontC = mkCombo(slateOpt.font, ["Arial", "Tahoma", "Verdana", "Courier New"], "Set the font");
      put(fontC, 158, rowY[3], 202, 17);
      fontC.onPick = (v) => { slateOpt.font = v; drawPreview(); };
      put(dots("Set the font"), 360, rowY[3], 17, 17);
      // 5 - Style
      lbl("Style", rowY[4]);
      const styleC = mkCombo(slateOpt.style, ["Regular", "Bold", "Italic", "Bold Italic"], "Set the Style");
      put(styleC, 158, rowY[4], 202, 17);
      styleC.onPick = (v) => { slateOpt.style = v; drawPreview(); };
      put(dots("Set the Style"), 360, rowY[4], 17, 17);
      // 6 - Script
      lbl("Script", rowY[5]);
      const scriptC = mkCombo(slateOpt.script, ["Western", "Central European", "Cyrillic", "Greek"], "Set the Script");
      put(scriptC, 158, rowY[5], 202, 17);
      scriptC.onPick = (v) => { slateOpt.script = v; };
      put(dots("Set the Script"), 360, rowY[5], 17, 17);
      // 7 - Title
      const titleChk = mkCheck(slateOpt.titleOn, "Show/Hide the title");
      put(titleChk, 139, rowY[6], 21, 18);
      lbl("Title", rowY[6]);
      const titleC = mkCombo(slateOpt.title, ["Project - Clip - Position", "Project - Clip", "Project", "Clip", "Position"], "Set the format of the title");
      put(titleC, 158, rowY[6], 202, 17);
      titleC.onPick = (v) => { slateOpt.title = v; drawPreview(); };
      put(dots("Set the format of the title"), 360, rowY[6], 17, 17);
      // 8 - Frame/Time
      const frameChk = mkCheck(slateOpt.frameOn, "Show/Hide the frame number");
      put(frameChk, 139, rowY[7], 21, 18);
      lbl("Frame/Time", rowY[7]);
      const frameC = mkCombo(slateOpt.frame, ["Frame", "Time"], "Set the format of the image time code");
      put(frameC, 158, rowY[7], 202, 17);
      frameC.onPick = (v) => { slateOpt.frame = v; drawPreview(); };
      put(dots("Set the format of the image time code"), 360, rowY[7], 17, 17);
      // 9 - Date Format
      const dateChk = mkCheck(slateOpt.dateOn, "Show/Hide the date");
      put(dateChk, 139, rowY[8], 21, 18);
      lbl("Date Format", rowY[8]);
      const dateC = mkCombo(slateOpt.date, ["Day Month Year", "Month Day Year", "Year Month Day"], "Set the format of the date");
      put(dateC, 158, rowY[8], 202, 17);
      dateC.onPick = (v) => { slateOpt.date = v; drawPreview(); };
      put(dots("Set the format of the date"), 360, rowY[8], 17, 17);
      // 10 - Logo
      const logoChk = mkCheck(slateOpt.logoOn, "Show/Hide the logo");
      put(logoChk, 139, rowY[9], 21, 18);
      lbl("Logo", rowY[9]);
      const logoF = txt(slateOpt.logo, {});
      put(logoF, 158, rowY[9], 202, 17);
      logoF.title = "Set the file name of the logo to display\n(Leave empty to have the default one)";
      logoF.addEventListener("input", () => { slateOpt.logo = logoF.value; drawPreview(); });
      put(dots("Select the file of the logo"), 360, rowY[9], 17, 17);
      // 11 - Author
      const authChk = mkCheck(slateOpt.authorOn, "Show/Hide the author");
      put(authChk, 139, rowY[10], 21, 18);
      lbl("Author", rowY[10]);
      const authF = txt(slateOpt.author, {});
      put(authF, 158, rowY[10], 218, 17);
      authF.title = "Set the author\n(Leave empty to have the project one)";
      authF.addEventListener("input", () => { slateOpt.author = authF.value; drawPreview(); });
      // the check boxes and the fields drive the slate
      const syncSlate = () => {
        slateOpt.titleOn = titleChk.checked();
        slateOpt.frameOn = frameChk.checked();
        slateOpt.dateOn = dateChk.checked();
        slateOpt.logoOn = logoChk.checked();
        slateOpt.authorOn = authChk.checked();
        drawPreview();
      };
      [titleChk, frameChk, dateChk, logoChk, authChk].forEach(c => {
        const old = c.onclick;
        c.onclick = (e) => { if (old) old(e); syncSlate(); };
      });
      return p;
    }
    syncSlateBtn();

    // the padlock on the left edge toggles the width/height link
    const padlock = el("div");
    at(padlock, 24, 286, 14, 14);
    padlock.style.cursor = "pointer";
    padlock.title = "Lock aspect ratio";
    padlock.innerHTML = '<div style="position:absolute;left:2px;top:1px;width:8px;height:6px;border:1px solid #c8c8cc;border-bottom:0;border-radius:4px 4px 0 0"></div>' +
      '<div style="position:absolute;left:0;top:5px;width:12px;height:7px;border:1px solid #c8c8cc;border-radius:1px"></div>';
    padlock.onclick = () => lockAspectChk.click();
    pD.appendChild(padlock);

    /* --- layers-structure settings --- */
    const pL = el("div"); at(pL, 0, 0, 1008, 547); b.appendChild(pL);

    pL.appendChild(labelAt("Structure", 95, 123, 80));
    const structC = combo("PSD (.psd)", { width: 149, items: EXPORT_STRUCTURES.map(x => ({ label: x, value: x })) });
    at(structC, 187, 123, 149, 17);
    structC.title = "Select the exporting structure of the clip";
    const structArrow = el("div");
    at(structArrow, 340, 123, 14, 17);
    structArrow.style.cssText += "background:#46464d;border:1px solid #5a5a62;border-radius:2px;display:grid;place-items:center;font-size:7px;color:#d0d0d6;cursor:pointer";
    structArrow.textContent = "\u25BC";
    structArrow.onmousedown = (e) => { e.preventDefault(); structC.onmousedown(e); };
    pL.append(structC, structArrow);

    pL.appendChild(labelAt("Visible Layers", 95, 145, 80));
    const visChk = mkCheck(187, 147, false);
    visChk.title = "Export only the visible layers";
    pL.appendChild(visChk);

    pL.appendChild(labelAt("View", 100, 163, 70));
    const viewL = combo("Project", {
      width: 181,
      items: [{ label: "Project", value: "Project" }, { label: "Camera", value: "Camera" }, { label: "Clip", value: "Clip" }]
    });
    at(viewL, 187, 163, 181, 17);
    viewL.title = "Select the Exported Footage View";
    pL.appendChild(viewL);

    const createFolderChk = mkCheck(137, 513, true);
    createFolderChk.title = "For each layer, will create a folder where images will be set";
    const createFolderLbl = el("div", "tvlbl", "Create folder for layers");
    at(createFolderLbl, 155, 511, 160, 14);
    pL.append(createFolderChk, createFolderLbl);

    /* --- preview + both watermarks --- */
    const previewBox = el("div");
    at(previewBox, 373, 113, 627, 370);
    previewBox.style.zIndex = "2";
    previewBox.style.cssText += "background:#2d2d32;overflow:hidden";
    previewBox.title = "Footage Preview";
    const pv = el("canvas");
    pv.style.cssText = "position:absolute;left:0;top:0";
    previewBox.appendChild(pv);
    const wmStyle = "";
    b.appendChild(previewBox);

    /* --- footer (All Frames bar + current frame) --- */
    const allBar = el("div");
    at(allBar, 632, 487, 370, 17);
    allBar.style.zIndex = "3";
    allBar.style.cssText += "display:flex;align-items:center;justify-content:flex-start;position:relative";
    allBar.title = "Uncheck to set the mark in / mark out";
    const allChk = check(true);
    at(allChk, 4, 2, 13, 13);
    allChk.style.cssText += ";border:0;background:transparent";
    const allLbl = el("div", "tvlbl", "All Frames - Project");
    allLbl.style.marginLeft = "7px";
    allBar.append(allChk, allLbl);
    const frameField = txt(String(proj ? proj.currentFrame : 1), { align: "center" });
    at(frameField, 629, 508, 112, 14);
    frameField.style.zIndex = "3";
    frameField.title = "Current Frame Value";
    b.append(allBar, frameField);
    /* --- the frame slider: the live panel has a thin bar under the preview
       that scrubs through the animation (its handle is 5 px wide) --- */
    const slider = el("div");
    at(slider, 375, 525, 623, 15);
    slider.style.cssText += ";background:#2d2d32;position:absolute;z-index:3";
    slider.title = "Drag to move through the animation";
    const handle = el("div");
    handle.style.cssText = "position:absolute;top:0;width:5px;height:15px;background:#cfcfcf;border:1px solid #202023;box-sizing:border-box";
    slider.appendChild(handle);
    b.appendChild(slider);
    const slideTo = (clientX) => {
      const r = slider.getBoundingClientRect();
      const first = proj ? (proj.inFrame || 1) : 1;
      const last = proj ? Math.max(first, proj.outFrame || 1) : 1;
      const t = Math.max(0, Math.min(1, (clientX - r.left - 2) / Math.max(1, r.width - 5)));
      const f = Math.round(first + t * (last - first));
      frameField.value = String(f);
      drawPreview();
    };
    const placeHandle = () => {
      const first = proj ? (proj.inFrame || 1) : 1;
      const last = proj ? Math.max(first, proj.outFrame || 1) : 1;
      const f = Math.max(0, Math.min(1, (parseInt(frameField.value, 10) - first) / Math.max(1, last - first)));
      handle.style.left = Math.round(f * (slider.offsetWidth - 5)) + "px";
    };
    let sliding = false;
    slider.addEventListener("mousedown", (e) => { sliding = true; slideTo(e.clientX); e.preventDefault(); });
    window.addEventListener("mousemove", (e) => { if (sliding) slideTo(e.clientX); });
    window.addEventListener("mouseup", () => { sliding = false; });
    frameField.addEventListener("input", () => { placeHandle(); drawPreview(); });



    /* --- custom-brush tab: the live warning box --- */
    const brushMsg = el("div");
    at(brushMsg, 335, 223, 330, 84);
    brushMsg.style.cssText += "background:#313136;border:1px solid #4a4a52;box-shadow:0 6px 18px #0008;z-index:6;display:none";
    const bmText = el("div", "tvmsg", "Please create a custom brush before trying to export one.");
    at(bmText, 14, 16, 300, 16);
    const bmOk = el("button", "tvbtn", "OK");
    at(bmOk, 14, 56, 302, 19);
    const bmX = el("div", "tvwin-x", "\u2715");
    at(bmX, 306, 6, 17, 17);
    bmOk.onclick = () => { brushMsg.style.display = "none"; };
    bmX.onclick = () => { brushMsg.style.display = "none"; };
    brushMsg.append(bmText, bmOk, bmX);
    b.appendChild(brushMsg);

    // stacking: the transparent setting panels must stay under the shared
    // controls (tabs, path, As, Export/Cancel) or they swallow their clicks.
    pD.style.zIndex = "1"; pL.style.zIndex = "1";
    tabEls.forEach(t => { t.style.zIndex = "3"; });
    [clipName, browse, pathField, asC, replaceChk, replaceLbl, exportBtn, cancelBtn].forEach(n => { n.style.zIndex = "3"; });

    /* --- behaviour --- */
    let exportFile = null;

    // the state of the seven export flags, in the order TVPaint applies them
    function optState() {
      return {
        background: bgChk.checked(),
        notes: notesChk.checked() ? (proj && proj.notes ? proj.notes : "") : "",
        slate: { on: slateChk.checked(), layout: slateOpt.layout, borderPct: slateOpt.borderPct },
        lock: lockAspectChk.checked(),
        stretch: stretchChk.checked(),
        interp: interpChk.checked(),
        split: splitChk.checked()
      };
    }
    // the pixel options, as composeFrame wants them
    function pixelOpts(o) {
      return {
        background: o.background,
        slate: o.slate.on ? Object.assign({ on: true }, slateOpt) : null,
        notes: o.notes
      };
    }

    function drawPreview() {
      if (!previewBox || previewBox.style.display === "none") return;
      const w = Math.max(16, parseInt(tgtW.input.value) || 1920);
      const h = Math.max(16, parseInt(tgtH.input.value) || 1080);
      const frame = Math.max(1, parseInt(frameField.value) || 1);
      const box = previewBox.getBoundingClientRect();
      const cw = Math.max(16, Math.round(box.width));
      const ch = Math.max(16, Math.round(box.height));
      if (pv.width !== cw || pv.height !== ch) { pv.width = cw; pv.height = ch; }
      const c = pv.getContext("2d");
      c.fillStyle = "#2d2d32"; c.fillRect(0, 0, cw, ch);
      const mode = (tabIndex === 2 ? viewL.getValue() : viewC.getValue());
      const img = composeFrame(frame, w, h, mode, Object.assign({}, pixelOpts(optState()), { pos: 1, total: 1 }));
      const s = Math.min(cw / w, ch / h);
      const dw = Math.max(1, Math.round(w * s)), dh = Math.max(1, Math.round(h * s));
      c.drawImage(img, Math.round((cw - dw) / 2), Math.round((ch - dh) / 2), dw, dh);
    }

    function refresh() {
      const isDisplay = tabIndex === 0 || tabIndex === 1;
      const isLayers = tabIndex === 2;
      const isBrush = tabIndex === 3;
      pD.style.display = isDisplay ? "" : "none";
      pL.style.display = isLayers ? "" : "none";
      previewBox.style.display = isBrush ? "none" : "";
      brushMsg.style.display = isBrush && !cutBrush ? "" : "none";
      clipName.textContent = isLayers || tabIndex === 1 ? (isBrush ? "CustomBrush" : "Clip_001") : projName();
      viewC.setValue("Project");
      if (tabIndex === 1) viewC.setValue("Clip");
      const as = asC.getValue();
      allBar.style.display = (isBrush || as === "Single Image") ? "none" : "";
      frameField.style.display = isBrush ? "none" : "";
      if (!exportFile) {
        if (isLayers) pathField.value = withExt(pathField.value, "psd");
        else if (isDisplay) pathField.value = withExt(pathField.value, fmtC.getValue() === "JPG" ? "jpg" : fmtC.getValue().toLowerCase());
      }
      drawPreview();
      if (typeof placeHandle === "function") placeHandle();
    }

    asC.onPick = () => refresh();
    fmtC.onPick = (v) => { pathField.value = withExt(pathField.value, v === "JPG" ? "jpg" : String(v).toLowerCase()); drawPreview(); };
    [tgtW.input, tgtH.input, frameField].forEach(i => i.addEventListener("input", drawPreview));
    [viewC, tgtFps, tgtDpi, tgtPar, convC, modeC, alphaC].forEach(c => {
      const old = c.onPick;
      c.onPick = (v) => { if (old) old(v); drawPreview(); };
    });

    // Width/Height link (the padlock and "Lock aspect ratio")
    let syncing = false;
    const linkW = () => {
      if (syncing || !lockAspectChk.checked()) return;
      syncing = true;
      const w = Math.max(1, parseFloat(tgtW.input.value) || 1);
      const h = Math.max(1, Math.round(w * (startH / startW)));
      tgtH.input.value = String(h);
      syncing = false;
      drawPreview();
    };
    const linkH = () => {
      if (syncing || !lockAspectChk.checked()) return;
      syncing = true;
      const h = Math.max(1, parseFloat(tgtH.input.value) || 1);
      const w = Math.max(1, Math.round(h * (startW / startH)));
      tgtW.input.value = String(w);
      syncing = false;
      drawPreview();
    };
    tgtW.input.addEventListener("input", linkW);
    tgtH.input.addEventListener("input", linkH);

    if (window.ResizeObserver) {
      try { new ResizeObserver(() => drawPreview()).observe(previewBox); } catch (e) { /* ignore */ }
    }

    browse.onclick = async () => {
      if (!TVP || !TVP.exportSaveDialog) return toast("browse needs the desktop build");
      const f = await TVP.exportSaveDialog(baseName(pathField.value), formatFilter(fmtC.getValue()));
      if (f) { pathField.value = f; exportFile = f; }
    };
    cancelBtn.onclick = () => { dlg.remove(); if (lastDlg === dlg) lastDlg = null; };

    async function exportLayers(path) {
      const structure = structC.getValue();
      if (/^(PSD|Flix)/.test(structure)) {
        return tvMessage("Export Footage",
          structure.split(" (")[0] + " writes a layered file through TVPaint's own file-format plug-in.\n" +
          "This rebuild ships PNG, JPG and WebP writers, so use JSON (.json + images) or CSV (.csv + .png files) to export the same layer stack.",
          [{ label: "OK", value: true }], 460);
      }
      if (!TVP) return toast("layered export needs the desktop build");
      const w = Math.max(16, parseInt(tgtW.input.value) || proj.width);
      const h = Math.max(16, parseInt(tgtH.input.value) || proj.height);
      const frame = Math.max(1, parseInt(frameField.value) || 1);
      const stem = baseName(path).replace(/\.[a-z0-9]+$/i, "") || "Untitled_(1)";
      const root = dirName(path);
      const visOnly = visChk.checked();
      const folder = createFolderChk.checked() ? root + "\\" + stem + "_layers" : root;
      const layers = (proj.layers || []).filter(l => !visOnly || l.visible);
      const files = [];
      for (let i = 0; i < layers.length; i++) {
        const l = layers[i];
        const out = E.makeSurface(w, h);
        const c = out.getContext("2d");
        if (bgChk.checked()) { c.fillStyle = "#fff"; c.fillRect(0, 0, w, h); }
        const key = E.effectiveFrameKey(l, frame);
        const surf = key !== null && l.frames[key] ? l.frames[key].canvas : null;
        if (surf) {
          c.globalAlpha = l.opacity;
          c.drawImage(surf, 0, 0, proj.width, proj.height, 0, 0, w, h);
          c.globalAlpha = 1;
        }
        const url = out.toDataURL("image/png");
        const file = folder + "\\" + String(i + 1).padStart(3, "0") + "_" + safeName(l.name) + ".png";
        await TVP.writeFileBinary(file, url);
        files.push({ name: l.name, file: baseName(file), opacity: l.opacity, visible: !!l.visible });
      }
      if (/^JSON/.test(structure)) {
        const man = {
          app: "my-version", kind: "clip-layers",
          project: { name: projName(), width: proj.width, height: proj.height, fps: proj.fps, dpi: proj.dpi || 72 },
          frame, export: { width: w, height: h }, layers: files
        };
        await TVP.writeFile(root + "\\" + stem + ".json", JSON.stringify(man, null, 2));
        return toast("exported " + files.length + " layers + " + stem + ".json");
      }
      const rows = ["layer,file,opacity,visible"].concat(files.map(f => [csvEsc(f.name), f.file, f.opacity, f.visible ? 1 : 0].join(",")));
      await TVP.writeFile(root + "\\" + stem + ".csv", rows.join("\r\n"));
      toast("exported " + files.length + " layers + " + stem + ".csv");
    }

    exportBtn.onclick = async () => {
      const as = asC.getValue();
      const path = pathField.value;
      if (!path) return toast("choose an export path first");
      if (tabIndex === 3) {
        if (!cutBrush) return tvMessage("Export Footage", "Please create a custom brush before trying to export one.", [{ label: "OK", value: true }], 330);
        return toast("custom brush export is not wired to a writer yet");
      }
      if (tabIndex === 2) return exportLayers(path);
      const fmt = fmtC.getValue();
      const w = Math.max(16, parseInt(tgtW.input.value) || 1920);
      const h = Math.max(16, parseInt(tgtH.input.value) || 1080);
      const frames = allChk.checked()
        ? range(1, Math.max(1, proj ? proj.outFrame : 1))
        : range(proj ? proj.inFrame : 1, proj ? proj.outFrame : 1);
      if (as === "Animation" || /AVI|QuickTime|MPEG/.test(fmt)) {
        return tvMessage("Export Footage",
          "Animation / " + fmt + " export goes through TVPaint's video codec plug-ins.\n" +
          "This rebuild can write still frames and image sequences (PNG, JPG, WebP).",
          [{ label: "OK", value: true }], 430);
      }
      if (!/^(PNG|JPG|WebP)$/.test(fmt)) {
        return tvMessage("Export Footage",
          fmt + " needs the file-format plug-in from TVPaint's Resources\\plugins folder.\nThis rebuild writes PNG, JPG and WebP today.",
          [{ label: "OK", value: true }], 430);
      }
      const mime = fmt === "PNG" ? "image/png" : fmt === "JPG" ? "image/jpeg" : "image/webp";
      const ext = fmt === "JPG" ? "jpg" : fmt.toLowerCase();
      const mode = viewC.getValue();
      const o = optState();
      const px = pixelOpts(o);

      /* "Stretch to Frame Rate": the exported footage respects the new frame
         rate and keeps the duration of the source.  Without the option the
         source frames are written as they are. */
      const srcFps = Number(proj && proj.fps) || 24;
      const dstFps = parseFloat(tgtFps.getValue()) || srcFps;
      let plan = frames.map(f => ({ f: f, f2: f, frac: 0 }));
      if (o.stretch && Math.abs(dstFps - srcFps) > 1e-6 && frames.length > 1) {
        const dur = frames.length / srcFps;
        const n = Math.max(1, Math.round(dur * dstFps));
        plan = [];
        for (let k = 0; k < n; k++) {
          const pos = (k / dstFps) * srcFps;
          const i = Math.floor(pos);
          const frac = pos - i;
          const a = frames[Math.max(0, Math.min(frames.length - 1, i))];
          const b = frames[Math.max(0, Math.min(frames.length - 1, i + 1))];
          plan.push({ f: a, f2: b, frac: o.interp ? frac : 0, index: k + 1 });
        }
      }
      const painted = (p) => composeFrame(p.f, w, h, mode, Object.assign({}, px, {
        blend: o.interp && p.frac > 0.001 ? { frame: p.f2, frac: p.frac } : null,
        pos: p.index || 1, total: (as === "Single Image" || plan.length <= 1) ? 1 : plan.length
      }));

      /* "Split Scenes": one file per scene of the project.  A scene is a
         marker: it starts at "from" and runs until the next one. */
      const mk = (proj && proj.scenes ? proj.scenes.slice().sort((a, b) => a.from - b.from) : []);
      const firstF = frames[0], lastF = frames[frames.length - 1];
      const scenes = [];
      if (!mk.length) {
        scenes.push({ name: "", from: firstF, to: lastF });
      } else {
        // the frames before the first marker belong to a first scene
        if (mk[0].from > firstF) scenes.push({ name: "", from: firstF, to: mk[0].from - 1 });
        mk.forEach((s, i) => scenes.push({
          name: s.name || ("Scene " + (i + 1)),
          from: Math.max(firstF, s.from),
          to: i + 1 < mk.length ? Math.min(lastF, mk[i + 1].from - 1) : lastF
        }));
      }
      const parts = o.split ? scenes : [{ name: "", from: firstF, to: lastF }];

      if (as === "Single Image" || plan.length <= 1) {
        if (!TVP) {
          const a = doc.createElement("a");
          a.href = painted(plan[0]).toDataURL(mime, 0.95);
          a.download = baseName(path).replace(/\.[a-z0-9]+$/i, "") + "." + ext;
          a.click();
          return toast("exported " + a.download);
        }
        let written = 0;
        for (const part of parts) {
          const first = plan.find(p => p.f >= part.from) || plan[0];
          let out = path;
          const stem0 = baseName(path).replace(/\.[a-z0-9]+$/i, "");
          if (parts.length > 1 && part.name) out = dirName(path) + "\\" + stem0 + "_" + safeName(part.name) + "." + ext;
          if (!new RegExp("\\." + ext + "$", "i").test(out)) out = out.replace(/\.[a-z0-9]+$/i, "") + "." + ext;
          const url = painted(first).toDataURL(mime, 0.95);
          const ok = await TVP.writeFileBinary(out, url);
          if (ok) { pushRecent("folders", dirName(out)); written++; }
        }
        return toast(written ? "exported " + written + " file" + (written > 1 ? "s" : "") : "export failed");
      }
      // sequence
      if (!TVP) return toast("sequence export needs the desktop build");
      const dir = await TVP.pickFolder(path.replace(/[\\/][^\\/]*$/, ""));
      if (!dir) return;
      pushRecent("folders", dir);
      const stem = baseName(path).replace(/\.[a-z0-9]+$/i, "") || "frame";
      let n = 0;
      for (const part of parts) {
        const sub = parts.length > 1 && part.name ? dir + "\\" + stem + "_" + safeName(part.name) : dir;
        for (const p of plan) {
          if (p.f < part.from || p.f > part.to) continue;
          const url = painted(p).toDataURL(mime, 0.95);
          const no = p.index || p.f;
          const file = sub + "\\" + stem + String(no).padStart(4, "0") + "." + ext;
          await TVP.writeFileBinary(file, url);
          n++;
        }
      }
      toast("exported " + n + " files to " + dir);
    };

    refresh();
    setTimeout(() => { drawPreview(); }, 30);
    return dlg;
  }
  function documentsExportDefault() {
    const n = proj && proj.name ? proj.name.replace(/^\*/, "").replace(/\.[a-z0-9]+$/i, "") : "Untitled_(1)";
    return (typeof DOCS === "string" && DOCS ? DOCS : "C:\\Users\\Public\\Documents") + "\\" + n + ".png";
  }
  const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
  const formatFilter = (fmt) => {
    const e = fmt === "JPG" ? "jpg" : fmt.toLowerCase();
    return [{ name: fmt + " image", extensions: [e] }, { name: "All Files", extensions: ["*"] }];
  };

  /* ---------------- Printer Config ---------------- */
  function tvPrinterConfig(anim) {
    // Live window: 288x415 ("Single") / 288x495 ("Anim"), measured from the
    // two captures (shots/file12-print.png, file12-print-anim.png).
    const dlg = tvWin("Printer Config", 288, anim ? 495 : 415);
    const b = bodyOf(dlg);
    let mode = anim ? "Anim" : "Single";

    function build() {
      b.innerHTML = "";
      b.style.cssText += ";padding:0;overflow:hidden;position:relative";

      const at = (n, x, y, w, h) => {
        n.style.position = "absolute"; n.style.left = x + "px"; n.style.top = y + "px";
        if (w != null) n.style.width = w + "px";
        if (h != null) n.style.height = h + "px";
        b.appendChild(n); return n;
      };

      /* printer row: combo 8..225, Setup 230..280 (live capture) */
      at(combo("No Printer Found", { width: 218, items: [{ label: "No Printer Found", value: "" }] }), 8, 4, 218, 17);
      const setup = el("button", "tvbtn", "Setup");
      at(setup, 230, 4, 51, 17);
      setup.onclick = () => {
        if (TVP && TVP.printerSetup) TVP.printerSetup();
        else toast("printer setup needs the desktop build");
      };

      /* tabs: two 40 px tabs at x=7, active one #3e476b (live capture) */
      const tabs = el("div");
      tabs.style.display = "flex";
      at(tabs, 7, 26, null, 19);
      const tS = el("div", "tvt" + (mode === "Single" ? " on" : ""), "Single");
      const tA = el("div", "tvt" + (mode === "Anim" ? " on" : ""), "Anim");
      tS.style.width = "40px"; tA.style.width = "40px";
      tabs.append(tS, tA);
      tS.onclick = () => { if (mode !== "Single") { mode = "Single"; dlg.style.height = "415px"; build(); } };
      tA.onclick = () => { if (mode !== "Anim") { mode = "Anim"; dlg.style.height = "495px"; build(); } };

      /* live tooltip on the tab strip (captured verbatim) */
      let tip = null;
      const showTip = () => {
        if (tip) return;
        tip = el("div");
        tip.style.cssText = "position:absolute;left:56px;top:48px;width:180px;z-index:3000;background:#898fa6;color:#1b1b22;" +
          "font:11px \"Segoe UI\",Tahoma,sans-serif;padding:5px 6px;line-height:16px;white-space:pre-wrap";
        tip.textContent = "Select : Anim or Single\n\nSelect if you are wanting\nto print a single image\nor an animation storyboard.";
        b.appendChild(tip);
      };
      const hideTip = () => { if (tip) { tip.remove(); tip = null; } };
      tS.onmouseenter = showTip; tA.onmouseenter = showTip;
      tS.onmouseleave = hideTip; tA.onmouseleave = hideTip;

      /* preview: black area 7..280 with the white 210x272 page (live) */
      const prev = el("div");
      prev.style.cssText = "background:#000";
      const cv = el("canvas");
      cv.width = 210; cv.height = 272;
      cv.style.cssText = "position:absolute;left:50%;transform:translateX(-50%);top:1px;background:#fff";
      prev.appendChild(cv);
      at(prev, 7, mode === "Anim" ? 152 : 91, 273, 274);
      try {
        const c = cv.getContext("2d");
        c.fillStyle = "#fff"; c.fillRect(0, 0, cv.width, cv.height);
        const f = proj ? proj.currentFrame : 1;
        c.drawImage(composeFrame(f, cv.width, cv.height, "Project"), 0, 0);
      } catch (e) {}

      /* Scale 1 % + the two live arrows */
      const scaleLbl = el("span", "tvlbl", "Scale");
      scaleLbl.style.textAlign = "right";
      at(scaleLbl, 28, 50, 36, 15);
      at(spin("1", 1, { width: 42 }), 79, 49, 52, 17);
      const arrows = el("div");
      arrows.textContent = "\u25C4\u25BA";
      arrows.style.cssText += ";display:flex;align-items:center;justify-content:space-between;color:#c4c4ca;font-size:8px";
      at(arrows, 133, 49, 20, 17);

      const center = el("button", "tvbtn", "Center");
      at(center, 78, 68, 75, 17);

      if (mode === "Anim") {
        const rowsLbl = el("span", "tvlbl", "Rows"); rowsLbl.style.textAlign = "right";
        at(rowsLbl, 28, 92, 36, 15);
        at(spin("2", 1, { width: 42 }), 79, 91, 52, 17);
        const stepLbl = el("span", "tvlbl", "Step"); stepLbl.style.textAlign = "right";
        at(stepLbl, 134, 92, 32, 15);
        at(spin("1", 1, { width: 42 }), 176, 91, 52, 17);
        const imgLbl = el("span", "tvlbl", "Image nbr"); imgLbl.style.textAlign = "right";
        at(imgLbl, 28, 114, 72, 15);
        at(check(false), 110, 113, 14, 14);
      }

      const print = el("button", "tvbtn wide", "Print");
      at(print, 7, mode === "Anim" ? 451 : 371, 273, 17);
      print.onclick = () => {
        if (TVP && TVP.printImage) {
          const f = proj ? proj.currentFrame : 1;
          const url = composeFrame(f, 1240, 1754, "Project").toDataURL("image/png");
          TVP.printImage(url).then(ok => toast(ok ? "sent to printer" : "printing cancelled"));
        } else {
          window.print();
        }
      };

      if (mode === "Anim") {
        /* 1/1 + prev/next, bottom right of the preview (live) */
        const nav = el("div");
        nav.style.cssText = "display:flex;align-items:center;gap:5px";
        const ff = el("div", "tvf");
        ff.style.cssText += ";width:48px;height:17px;display:flex;align-items:center;justify-content:center";
        ff.textContent = "1/1";
        const pb = el("button", "tvbtn", "\u25C4"); pb.style.cssText += ";width:16px;height:17px;padding:0;font-size:8px";
        const nb = el("button", "tvbtn", "\u25BA"); nb.style.cssText += ";width:16px;height:17px;padding:0;font-size:8px";
        nav.append(ff, pb, nb);
        at(nav, 194, 424, 86, 17);
      }
    }
    build();
    return dlg;
  }

  /* ---------------- Multi-Backup ---------------- */
  function tvOpenBackupDir() {
    if (TVP && TVP.openBackupDir) { TVP.openBackupDir().then(p => toast(p ? "multi-backup: " + p : "could not open the multi-backup folder")); return; }
    toast("multi-backup folder needs the desktop build");
  }

  /* ---------------- Quit ---------------- */
  async function tvQuit() {
    if (proj && proj.dirty) {
      const r = await tvConfirm("Quit", `Save changes to ${proj.name} before quitting?`,
        [{ label: "Save", value: "save", primary: true }, { label: "Quit without saving", value: "no" }, { label: "Cancel", value: "cancel" }], 400);
      if (r === "cancel") return;
      if (r === "save") { const ok = await tvSaveProject(false); if (!ok) return; }
    }
    if (TVP && TVP.quit) TVP.quit();
    else window.close();
  }

  /* ---------------- menu + toolbar wiring ---------------- */
  MENU_ACTIONS["file.new"] = () => tvNewProjectDialog();
  MENU_ACTIONS["file.open"] = () => tvOpenProject();
  MENU_ACTIONS["file.save"] = () => tvSaveProject(false);
  MENU_ACTIONS["file.saveAs"] = () => tvSaveProjectAs();
  MENU_ACTIONS["file.saveTemplate"] = () => tvSaveTemplate();
  MENU_ACTIONS["file.close"] = () => tvCloseProject();
  MENU_ACTIONS["file.export"] = () => tvExportDialog();
  MENU_ACTIONS["file.publish"] = () => tvExportDialog();
  MENU_ACTIONS["file.printer"] = () => tvPrinterConfig(false);
  MENU_ACTIONS["file.print"] = () => tvPrinterConfig(false);
  MENU_ACTIONS["file.backupDir"] = () => tvOpenBackupDir();
  MENU_ACTIONS["file.quit"] = () => tvQuit();
  MENU_ACTIONS["recent.open"] = (it) => {
    const a = it && it.arg;
    if (!a) return;
    if (a.kind === "folders") {
      if (TVP && TVP.openPath) TVP.openPath(a.path); else toast(a.path);
      return;
    }
    openRecentPath(a.path);
  };
  // Open / Import: the live app uses the native Windows "Open Project" dialog
  // (captured); opening records the project and its folder in the recents.
  async function tvOpenProject() {
    if (!TVP) return uiOpen();
    const file = await TVP.openProject();
    if (!file) return;
    const json = await TVP.readFile(file);
    if (json == null) { toast("could not read " + file); return; }
    try {
      openProjectData(json);
      proj.filePath = file;
      proj.name = baseName(file);
      pushRecent("projects", file);
      pushRecent("folders", dirName(file));
      renderTimelineStatus();
      toast("opened " + file);
    } catch (e) { toast("open failed: " + e.message); }
  }
  async function openRecentPath(path) {
    if (!TVP) return toast(path);
    const json = await TVP.readFile(path);
    if (json == null) { toast("cannot read " + path); return; }
    try {
      openProjectData(json);
      proj.filePath = path;
      proj.name = baseName(path);
      pushRecent("projects", path);
      renderTimelineStatus();
      toast("opened " + path);
    } catch (e) { toast("open failed: " + e.message); }
  }

  /* ---------------- accelerators (11 Pro for the save entries) ---------- */
  window.addEventListener("keydown", (e) => {
    const tag = (doc.activeElement && doc.activeElement.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    const k = e.key.toLowerCase();
    if (e.ctrlKey && e.shiftKey && k === "e") { e.preventDefault(); tvExportDialog(); return; }
    if (e.ctrlKey && e.shiftKey && k === "s") { e.preventDefault(); tvSaveProjectAs(); return; }
    if (e.ctrlKey && !e.shiftKey && k === "p") { e.preventDefault(); tvPrinterConfig(false); return; }
    if (e.ctrlKey && !e.shiftKey && k === "q") { e.preventDefault(); tvQuit(); return; }
    if (!e.ctrlKey && !e.altKey && e.shiftKey && k === "n") { e.preventDefault(); tvNewProjectDialog(); return; }
    if (!e.ctrlKey && !e.altKey && e.shiftKey && k === "l") { e.preventDefault(); tvOpenProject(); return; }
    if (!e.ctrlKey && !e.altKey && e.shiftKey && k === "w") { e.preventDefault(); tvCloseProject(); return; }
    if (!e.ctrlKey && !e.altKey && e.shiftKey && k === "s") { e.preventDefault(); tvSaveProject(false); return; }
  }, true);

  /* ---------------- expose a few helpers for tests ---------------- */
  window.tvFileMenu = {
    newProject: tvNewProjectDialog,
    exportDialog: tvExportDialog,
    printerConfig: tvPrinterConfig,
    save: tvSaveProject,
    saveAs: tvSaveProjectAs,
    saveTemplate: tvSaveTemplate,
    close: tvCloseProject,
    quit: tvQuit,
    recents,
    pushRecent,
    templates,
    PAGE_SIZES
  };
})();
