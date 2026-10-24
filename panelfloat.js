/* ------------------------------------------------------------------
   panelfloat.js - floating panels, like the live TVPaint 12.

     * drag a panel by its title bar: it leaves the dock and floats
     * drop it back on the dock: it docks again at the slot you drop it on
       (a blue line shows the slot while you drag); drag docked panels up or
       down the same way to re-order them
     * drag a panel OUT of the application window (desktop build): it
       becomes a window of its own, outside the main window. Drag that window
       back over the dock and it docks again
     * double click the title bar: dock / undock; the layout is remembered

   A panel that leaves the application is not copied: its DOM node moves to
   the new window (same page origin), so every control keeps working and
   keeps its handlers. ui.js looks panels up through qAny() / allDocs() and
   `$` for that reason.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const host = document.getElementById("panels");
  if (!host) return;
  const doc = document;
  const TVP = (window.tv && window.tv.panelWin) ? window.tv : null;
  const LS = "ld_layout_v1";
  const SNAP = 4;                       // px of movement before a drag starts
  const FLOAT_W = 194;
  let zTop = 700;

  const $$ = (s, r) => Array.from((r || doc).querySelectorAll(s));
  const panels = () => $$(".panel[data-panel-key]", host);
  const keyOf = (p) => p.dataset.panelKey;
  const popped = {};                    // key -> { win, name, ro }

  // ---- the windows panels live in (ui.js asks for these) ----
  window.__popDocs = () => Object.keys(popped).map(k => {
    try { const w = popped[k].win; return w && !w.closed ? w.document : null; } catch (e) { return null; }
  }).filter(Boolean);

  const isFloat = (p) => p.classList.contains("ldfloat") && !p.classList.contains("ldpop");
  const isPop = (p) => p.classList.contains("ldpop");

  /* ------------------------------------------------------------------
     geometry helpers
     ------------------------------------------------------------------ */
  // a pointer event from any of our windows -> client coordinates of the main window
  function mainPoint(ev) {
    const tgt = ev.target;
    if (ev.view === window || (tgt && tgt.ownerDocument === doc)) return { x: ev.clientX, y: ev.clientY };
    const bx = (window.outerWidth - window.innerWidth) / 2;
    const ox = window.screenX + bx;
    const oy = window.screenY + (window.outerHeight - window.innerHeight) - bx;
    return { x: ev.screenX - ox, y: ev.screenY - oy };
  }
  function overDock(pt) {
    const r = host.getBoundingClientRect();
    return pt.x >= r.left && pt.x <= r.right && pt.y >= r.top && pt.y <= r.bottom;
  }
  function outsideWindow(pt) {
    return pt.x < 0 || pt.y < 0 || pt.x > window.innerWidth || pt.y > window.innerHeight;
  }
  // where in the dock a panel dropped at height `my` would land
  function dockSlot(p, my) {
    const kids = Array.from(host.children).filter(c => c !== p && c.classList &&
      c.classList.contains("panel") && c.style.display !== "none" && getComputedStyle(c).display !== "none");
    for (const c of kids) {
      const r = c.getBoundingClientRect();
      if (my < r.top + r.height / 2) return { ref: c, y: r.top };
    }
    const last = kids[kids.length - 1];
    return { ref: null, y: last ? last.getBoundingClientRect().bottom : host.getBoundingClientRect().top };
  }
  let line = null;
  function showLine(y) {
    if (!line) { line = doc.createElement("div"); line.id = "ldDropLine"; doc.body.appendChild(line); }
    const r = host.getBoundingClientRect();
    line.style.cssText = `left:${r.left}px;top:${Math.round(y) - 1}px;width:${Math.min(r.width, 193)}px;display:block`;
  }
  function hideLine() { if (line) line.style.display = "none"; }

  /* ------------------------------------------------------------------
     float / dock
     ------------------------------------------------------------------ */
  function clamp(p) {
    const r = p.getBoundingClientRect();
    const x = Math.max(-r.width + 60, Math.min(window.innerWidth - 60, r.left));
    const y = Math.max(0, Math.min(window.innerHeight - 30, r.top));
    p.style.left = x + "px"; p.style.top = y + "px";
  }
  function floatAt(p, x, y) {
    if (isPop(p)) return;
    p.classList.add("ldfloat");
    p.style.left = x + "px"; p.style.top = y + "px";
    p.style.zIndex = ++zTop;
    if (p.parentNode !== doc.body) doc.body.appendChild(p);
    save();
  }
  function dockAt(p, ref) {
    const wasPop = isPop(p);
    p.classList.remove("ldfloat", "ldpop");
    p.style.left = p.style.top = p.style.zIndex = "";
    host.insertBefore(p, ref || null);       // adopts the node when it comes from another window
    if (wasPop) endPop(keyOf(p));
    save();
  }
  // the original spot of a panel: before the first docked panel that comes after it in the default order
  const ORDER = ["main", "color", "tool", "wheel", "lt", "timesheet", "remote", "navigator", "fxstack", "share", "guideline", "library", "camera"];
  function canonicalRef(p) {
    const mine = ORDER.indexOf(keyOf(p));
    const kids = Array.from(host.children).filter(c => c !== p && c.dataset && c.dataset.panelKey);
    return kids.find(c => ORDER.indexOf(c.dataset.panelKey) > mine) || null;
  }
  function bringFront(p) { p.style.zIndex = ++zTop; }
  // a panel window that was dropped on the application becomes a floating panel again
  function floatFromPop(p, x, y) {
    if (!isPop(p)) return;
    const key = keyOf(p);
    p.classList.remove("ldpop");
    doc.body.appendChild(p);                  // adopts the node back into the main page
    endPop(key);
    floatAt(p, x, y); clamp(p);
  }

  /* ------------------------------------------------------------------
     popping a panel out into a window of its own (desktop build)
     ------------------------------------------------------------------ */
  function copyLook(child) {
    const cd = child.document;
    const sync = () => { cd.documentElement.style.cssText = doc.documentElement.style.cssText; };
    $$("style, link[rel=stylesheet]", doc.head).forEach(n => {
      const c = cd.importNode(n, true);
      if (c.tagName === "LINK") c.href = n.href;           // absolute: the blank page has no folder of its own
      cd.head.appendChild(c);
    });
    sync();
    // the colour scheme loads after the window may have opened: follow it
    try {
      const mo = new MutationObserver(sync);
      mo.observe(doc.documentElement, { attributes: true, attributeFilter: ["style"] });
      child.addEventListener("pagehide", () => mo.disconnect());
    } catch (e) { /* ignore */ }
    cd.body.className = "ldpopbody";
    // keys typed in a panel window still reach the shortcuts of the application
    cd.addEventListener("keydown", (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || "")) return;
      doc.dispatchEvent(new KeyboardEvent("keydown", { key: e.key, code: e.code, ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey, bubbles: true, cancelable: true }));
    });
  }
  function popOut(p, sx, sy) {
    if (!TVP || isPop(p)) return false;
    const key = keyOf(p), name = "tvpanel-" + key;
    const r = p.getBoundingClientRect();
    const w = Math.round(r.width || FLOAT_W), h = Math.round(r.height || 200);
    let child = null;
    try {
      child = window.open("about:blank", name,
        `popup=yes,left=${Math.round(sx)},top=${Math.round(sy)},width=${w},height=${h}`);
    } catch (e) { child = null; }
    if (!child) return false;
    popped[key] = { win: child, name, ro: null };
    let tries = 0;
    const adopt = () => {
      let ready = false;
      try { ready = child.document && child.document.readyState === "complete" && child.document.body; } catch (e) { ready = false; }
      if (!ready) { if (++tries < 200) setTimeout(adopt, 25); else endPop(key); return; }
      copyLook(child);
      p.classList.add("ldfloat", "ldpop");
      p.style.left = p.style.top = p.style.zIndex = "";
      child.document.body.appendChild(p);
      // the window follows the size of the panel (the Tool panel changes height with the tool)
      const fit = () => {
        try { TVP.panelWin({ name, w: Math.ceil(p.offsetWidth), h: Math.ceil(p.offsetHeight) }); } catch (e) { /* ignore */ }
      };
      try { popped[key].ro = new child.ResizeObserver(fit); popped[key].ro.observe(p); } catch (e) { /* ignore */ }
      fit();
      // the window is closed from outside (Alt+F4, the app quits): the panel returns to the dock
      child.addEventListener("pagehide", () => {
        if (popped[key] && p.ownerDocument === child.document) { try { dockAt(p, canonicalRef(p)); } catch (e) { /* ignore */ } }
      });
    };
    adopt();
    save();
    return true;
  }
  function endPop(key) {
    const o = popped[key]; if (!o) return;
    try { if (o.ro) o.ro.disconnect(); } catch (e) { /* ignore */ }
    delete popped[key];
    try { if (TVP) TVP.panelWin({ name: o.name, close: true }); else o.win.close(); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------
     dragging by the title bar
     ------------------------------------------------------------------ */
  function bindPanel(p) {
    if (p.dataset.ldBound) return; p.dataset.ldBound = "1";
    const head = p.querySelector(".phead");
    if (!head) return;
    p.addEventListener("pointerdown", () => { if (isFloat(p)) bringFront(p); }, true);
    head.addEventListener("dblclick", (e) => {
      if (e.target.closest("button, .padlock")) return;
      if (isFloat(p) || isPop(p)) dockAt(p, canonicalRef(p));
      else { const r = p.getBoundingClientRect(); floatAt(p, r.left + 30, r.top + 30); }
    });
    // the tool bar toggles a panel by hiding it: a panel in its own window must take the window with it
    try {
      new MutationObserver(() => { if (p.style.display === "none" && isPop(p)) dockAt(p, canonicalRef(p)); })
        .observe(p, { attributes: true, attributeFilter: ["style"] });
    } catch (e) { /* ignore */ }
    // closing a panel that lives in its own window closes that window as well
    const cb = head.querySelector('button[title="close"]');
    if (cb) cb.addEventListener("click", () => { if (isPop(p)) dockAt(p, canonicalRef(p)); }, true);

    const dot = head.querySelector('button[title="panel options"]');
    if (dot) dot.onclick = (e) => {
      e.stopPropagation();
      const r = dot.getBoundingClientRect();
      const mode = isPop(p) ? "pop" : isFloat(p) ? "float" : "dock";
      const rows = [
        { label: "Dock", checked: mode === "dock", act: () => { if (mode !== "dock") dockAt(p, canonicalRef(p)); } },
        { label: "Float", checked: mode === "float", act: () => {
          if (mode === "dock") { const b = p.getBoundingClientRect(); floatAt(p, b.left + 30, b.top + 30); }
          else if (mode === "pop") floatFromPop(p, 240, 120); } }
      ];
      if (TVP) rows.push({ label: "Separate window", checked: mode === "pop", act: () => {
        if (mode === "pop") return;
        const b = p.getBoundingClientRect();
        popOut(p, window.screenX + b.left + 40, window.screenY + b.top + 40);
      } });
      if (window.__ldMenu) window.__ldMenu(r.left, r.bottom, rows, 150, dot);
    };

    head.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest("button, .padlock")) return;
      const sx = e.screenX, sy = e.screenY, cx = e.clientX, cy = e.clientY;
      const r0 = p.getBoundingClientRect();
      const grab = { x: cx - r0.left, y: cy - r0.top };
      let drag = false;
      try { head.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
      const where = () => (isPop(p) ? "pop" : isFloat(p) ? "float" : "dock");
      const move = (ev) => {
        if (!drag) {
          if (Math.hypot(ev.screenX - sx, ev.screenY - sy) < SNAP) return;
          drag = true;
          if (where() === "dock") {
            const r = p.getBoundingClientRect();
            const pt = mainPoint(ev);
            floatAt(p, pt.x - grab.x, pt.y - grab.y);
            p.dataset.ldGrabbed = "1";
            // re-parenting the panel released the pointer capture: take it again
            try { head.setPointerCapture(ev.pointerId); } catch (err) { /* synthetic events */ }
          }
        }
        const pt = mainPoint(ev);
        if (where() === "pop") {
          try { TVP.panelWin({ name: popped[keyOf(p)].name, x: Math.round(ev.screenX - grab.x), y: Math.round(ev.screenY - grab.y) }); } catch (err) { /* ignore */ }
        } else {
          p.style.left = (pt.x - grab.x) + "px";
          p.style.top = (pt.y - grab.y) + "px";
        }
        if (overDock(pt)) showLine(dockSlot(p, pt.y).y); else hideLine();
      };
      const up = (ev) => {
        head.removeEventListener("pointermove", move);
        head.removeEventListener("pointerup", up);
        head.removeEventListener("pointercancel", up);
        try { head.releasePointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
        hideLine();
        if (!drag) return;
        const pt = mainPoint(ev);
        if (overDock(pt)) { dockAt(p, dockSlot(p, pt.y).ref); return; }
        if (where() === "pop" && !outsideWindow(pt)) { floatFromPop(p, pt.x - grab.x, pt.y - grab.y); return; }
        if (where() === "float" && outsideWindow(pt) && TVP) {
          if (popOut(p, ev.screenX - grab.x, ev.screenY - grab.y)) return;
        }
        if (where() === "float") { clamp(p); save(); }
      };
      head.addEventListener("pointermove", move);
      head.addEventListener("pointerup", up);
      head.addEventListener("pointercancel", up);
    });
  }

  /* ------------------------------------------------------------------
     remembering the layout
     ------------------------------------------------------------------ */
  function save() {
    try {
      const o = { order: [], floats: {} };
      Array.from(host.children).forEach(c => { if (c.dataset && c.dataset.panelKey) o.order.push(c.dataset.panelKey); });
      panels().concat($$(".panel.ldfloat[data-panel-key]", doc.body)).forEach(p => {
        if (isFloat(p)) o.floats[keyOf(p)] = { x: parseFloat(p.style.left) || 0, y: parseFloat(p.style.top) || 0 };
      });
      localStorage.setItem(LS, JSON.stringify(o));
    } catch (e) { /* storage unavailable */ }
  }
  function restore() {
    let o = null;
    try { o = JSON.parse(localStorage.getItem(LS)); } catch (e) { o = null; }
    if (!o) return;
    const all = {}; panels().forEach(p => { all[keyOf(p)] = p; });
    (o.order || []).forEach(k => { if (all[k] && !(o.floats && o.floats[k])) host.appendChild(all[k]); });
    Object.keys(o.floats || {}).forEach(k => {
      if (all[k]) { floatAt(all[k], o.floats[k].x, o.floats[k].y); clamp(all[k]); }
    });
  }

  /* ------------------------------------------------------------------
     start up
     ------------------------------------------------------------------ */
  panels().forEach(bindPanel);
  restore();
  window.addEventListener("resize", () => $$(".panel.ldfloat", doc.body).forEach(p => { if (isFloat(p)) clamp(p); }));
  window.__panelfloat = { floatAt, dockAt, floatFromPop, popOut, dockSlot, canonicalRef, popped, bindPanel, save, restore };
})();
