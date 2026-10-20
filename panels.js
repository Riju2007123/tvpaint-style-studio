/* ------------------------------------------------------------------
   TVPaint's CUSTOM PANELS.

   TVPaint stores its custom panels as small text files
   (Resources/custompanels/*.bin, the same format as the ones it installs
   in the program folder).  Each item is a brush preset with the command
   that applies it and the two colours of its swatch:

       [toolbox]
       0_cmd0=CBTool:7bcafb36-...
       0_cmd1=ColorA: 0 103 56
       0_cmd2=ColorB: 0 164 0
       0_cmd3=cmd: tv_paper Hardness 35 ... Name "/cement_08"
       0_text=Sand
       0_type=1

   The prototype reads the very same files, so the panels it shows are
   TVPaint's own panels with TVPaint's own presets.
   ------------------------------------------------------------------ */

// the panels of the live Custom Panels menu, in the live order
const TV_CUSTOM_PANELS = [
  { name: "Animator Panel", file: "AnimatorPanel.bin" },
  { name: "Chalks", file: "Chalks_v1.bin" },
  { name: "Correction", file: "Correction.bin" },
  { name: "Grab Tools Panel", file: "GrabTools.bin" },
  { name: "Howard Wimshurst Brushes", file: "Howard_ Wimshurst_Brushes_v1.bin" },
  { name: "Nature", file: "Nature_v1.bin" },
  { name: "Paintbrushes", file: "PaintBrushes_v1.bin" },
  { name: "Paintbrushs", file: "PaintBrushes_v1.bin" },
  { name: "Pencils", file: "Pencils_v1.bin" },
  { name: "Pens", file: "Pens_v1.bin" },
  { name: "Shading", file: "Shading_v1.bin" },
  { name: "Sketch Panel", file: "SketchPanels.bin" },
  { name: "Smudge & Spread", file: "Smudge_v1.bin" },
  { name: "Timesheet", file: "Timesheet.bin" },
  { name: "Tool Presets Legacy", file: "ToolPresets_Legacy.bin" }
];
const tvCustomCache = {};

function parseCustomPanel(txt) {
  const items = [];
  const head = (txt.match(/^\s*\[([^\]]+)\]/m) || [])[1] || "toolbox";
  const map = {};
  txt.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*(\d+)_([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!m) return;
    const k = m[1] + "_" + m[2];
    (map[k] = map[k] || []).push(m[3]);
  });
  const idx = new Set(Object.keys(map).map(k => k.split("_")[0]));
  idx.forEach(i => {
    const g = (n) => (map[i + "_" + n] || [""])[0];
    const text = g("text");
    const cmd = g("cmd3");
    const ca = (g("cmd1") || "").match(/ColorA:\s*(\d+)\s+(\d+)\s+(\d+)/i);
    const cb = (g("cmd2") || "").match(/ColorB:\s*(\d+)\s+(\d+)\s+(\d+)/i);
    items.push({
      index: i,
      text: text || ("item " + i),
      cmd: cmd.replace(/^cmd:\s*/, ""),
      tool: (g("cmd0") || ""),
      a: ca ? [ +ca[1], +ca[2], +ca[3] ] : [128, 128, 128],
      b: cb ? [ +cb[1], +cb[2], +cb[3] ] : [255, 255, 255]
    });
  });
  items.sort((x, y) => (+x.index) - (+y.index));
  return { head, items };
}
async function loadCustomPanel(file) {
  if (tvCustomCache[file]) return tvCustomCache[file];
  try {
    const r = await fetch("Resources/custompanels/" + file);
    if (!r.ok) throw new Error("missing");
    const p = parseCustomPanel(await r.text());
    tvCustomCache[file] = p;
    return p;
  } catch (e) {
    const p = { head: "toolbox", items: [] };
    tvCustomCache[file] = p;
    return p;
  }
}
// opens a custom panel as a dockable panel of the left column
async function openCustomPanel(key) {
  const def = TV_CUSTOM_PANELS.find(p => p.name === key);
  if (!def) { toast("the " + key + " panel is not in this prototype"); return; }
  const id = "custom-" + def.name.replace(/[^A-Za-z0-9]+/g, "-");
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.className = "panel"; el.id = id;
    el.innerHTML = `<div class="phead"><span class="pt">${def.name}</span>
      <button class="pw" title="panel options">•</button>
      <button class="pw" title="collapse">▾</button>
      <button class="pw" title="close">✕</button></div>
      <div class="pbody"></div>`;
    const cols = document.getElementById("panels");
    cols.appendChild(el);
    const body = el.querySelector(".pbody");
    el.querySelector(".phead button[title=collapse]").onclick = (e) => {
      e.stopPropagation(); body.style.display = body.style.display === "none" ? "" : "none";
    };
    el.querySelector(".phead button[title=close]").onclick = (e) => { e.stopPropagation(); el.style.display = "none"; };
    el.querySelector(".phead button[title='panel options']").onclick = (e) => {
      e.stopPropagation(); toast(def.name + " - the panel options of the live app");
    };
    // the swatches of the panel
    const p = await loadCustomPanel(def.file);
    body.innerHTML = p.items.length
      ? `<div class="cpswatches">` + p.items.map(it =>
          `<div class="cpsw" title="${it.text}" data-i="${it.index}"
             style="background:linear-gradient(160deg,rgb(${it.a}) 0%,rgb(${it.b}) 100%)"></div>`).join("") + `</div>`
      : `<div class="orow"><label style="flex:1;color:#6E6E75">this panel has no preset in the prototype</label></div>`;
    body.querySelectorAll(".cpsw").forEach(sw => sw.onclick = () => {
      const it = p.items.find(x => x.index === sw.dataset.i);
      if (it) applyCustomPreset(it);
    });
  }
  el.style.display = "";
  const bar = document.getElementById("tabbar");
  if (bar) {
    const t = document.createElement("div");
    t.className = "ptab"; t.textContent = def.name; t.dataset.tab = id;
    t.onclick = () => {
      el.style.display = "";
      bar.querySelectorAll(".ptab").forEach(o => o.classList.toggle("on", o === t));
    };
    if (!bar.querySelector('[data-tab="' + id + '"]')) bar.insertBefore(t, bar.querySelector("span"));
  }
}
// applies the command of a custom panel preset
function applyCustomPreset(it) {
  const cmd = it.cmd || "";
  // Tool:tv_airbrush mode "color" size ...  ->  switch the tool
  const tm = cmd.match(/Tool:tv_([a-z]+)\b/i);
  if (tm) {
    const key = tm[1].toLowerCase();
    const map = { airbrush: "airbrush", oilbrush: "oilbrush", penbrush: "penbrush",
      pencilbrush: "pencilbrush", mechanicalpencil: "mechanicalpencil",
      wetbrush: "wetbrush", chalkbrush: "chalkbrush", specialbrush: "specialbrush",
      textbrush: "textbrush", eraser: "eraser", warpbrush: "warpbrush" };
    if (map[key]) { selectTool(map[key]); toast(it.text); return; }
  }
  // tv_paper ...  ->  the paper
  if (/^tv_paper\b/i.test(cmd)) {
    const nm = cmd.match(/Name\s+"([^"]+)"/);
    proj.paper = nm ? nm[1] : (it.text || "");
    toast("paper: " + proj.paper);
    renderAll();
    return;
  }
  toast(it.text + " - " + (cmd.split(" ")[0] || "preset"));
}
