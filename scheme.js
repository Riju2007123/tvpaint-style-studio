/* ------------------------------------------------------------------
   The TVPaint colour scheme.

   TVPaint ships its colour schemes as INI files
   (Resources/colorschemes/Night.ini, Day.ini, Dusk.ini, Dawn.ini).  Every
   colour of the user interface comes from there, so the prototype reads the
   same file and turns the entries into CSS custom properties.  That way the
   app is painted with exactly the colours of the live program - and it can
   follow the scheme the user picks.
   ------------------------------------------------------------------ */
const TV_SCHEME_KEYS = {
  mborder: "--tv-border",
  mcameraprofile: "--tv-camera",
  mdesktopbackground: "--tv-desktop",
  mdocumentbackground: "--tv-document",
  mgadgetaction: "--tv-action",
  mgadgetactionselected: "--tv-action-selected",
  mgadgetborder: "--tv-gadget-border",
  mgadgetcustom: "--tv-gadget",
  mgadgetdefault: "--tv-default",
  mgadgetdefaultinvert: "--tv-default-invert",
  mgadgetdefaultselected: "--tv-default-selected",
  mgadgetdialog: "--tv-dialog",
  mgadgetdialogselected: "--tv-dialog-selected",
  mgadgetelementcurrent: "--tv-element-current",
  mgadgetelementdefault: "--tv-element",
  mgadgetstat: "--tv-stat",
  mgadgetstatselected: "--tv-stat-selected",
  mgadgettabs: "--tv-tabs",
  mgadgettabsselected: "--tv-tabs-selected",
  mgadgettabstext: "--tv-tabs-text",
  mgadgettextbackground: "--tv-text-bg",
  mgadgettextinside: "--tv-text",
  mgadgettextoutside: "--tv-text-out",
  mgadgettoolbarbutton: "--tv-toolbar",
  mgadgettoolbarbuttonselected: "--tv-toolbar-selected",
  mlayeremptymarkcolor: "--tv-layer-empty",
  mlayerhandlecolor1: "--tv-layer-handle1",
  mlayerhandlecolor2: "--tv-layer-handle2",
  mlayerhandlegrabbed: "--tv-layer-grabbed",
  mmenushortcut: "--tv-shortcut",
  mnotesbackground: "--tv-notes",
  mnotificationbackground: "--tv-notification",
  mnotificationtext: "--tv-notification-text",
  mreqbackground: "--tv-req-bg",
  mreqoutlineindark: "--tv-req-outline-dark",
  mreqoutlineinlight: "--tv-req-outline-light",
  mreqoutlineout: "--tv-req-outline",
  mreqselectednode: "--tv-req-selected",
  mreqsystem1: "--tv-req-system",
  mreqsystemselected: "--tv-req-system-selected",
  mreqtitle: "--tv-req-title",
  mshortcutkeyfoundresult: "--tv-key-found",
  mshortcutkeyinuse: "--tv-key-inuse",
  mshortcutkeynormaltext: "--tv-key-text",
  mshortcutkeyselected: "--tv-key-selected",
  mtooltipbackground: "--tv-tooltip",
  mtooltiptext: "--tv-tooltip-text"
};
let tvScheme = { name: "Night", iconset: "light" };
function parseScheme(txt) {
  const out = { name: "Night", iconset: "light" };
  txt.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Za-z][A-Za-z0-9]*)\s*=\s*(.*)$/);
    if (!m) return;
    const k = m[1].toLowerCase();
    const v = m[2].trim();
    if (k === "mname") out.name = v;
    else if (k === "miconset") out.iconset = v;
    else if (k === "mflat" || k === "mlight" || k === "mmirror") out[k] = v;
    else out[k] = v;
  });
  return out;
}
function schemeRgb(v) {
  const p = String(v).trim().split(/\s+/).map(Number);
  if (p.length < 3 || p.some(n => isNaN(n))) return null;
  return "rgb(" + p[0] + "," + p[1] + "," + p[2] + ")";
}
// applies a scheme to the document as CSS custom properties
function applyScheme(s) {
  tvScheme = s;
  const root = document.documentElement;
  for (const key in TV_SCHEME_KEYS) {
    const css = TV_SCHEME_KEYS[key];
    const rgb = schemeRgb(s[key]);
    if (rgb) root.style.setProperty(css, rgb);
  }
  // the scheme also carries the icon set
  document.documentElement.dataset.iconset = s.iconset || "light";
}
async function loadScheme(name) {
  try {
    const r = await fetch("Resources/colorschemes/" + name + ".ini");
    if (!r.ok) throw new Error("no scheme");
    applyScheme(parseScheme(await r.text()));
    return true;
  } catch (e) {
    // fall back to the built in Night values
    applyScheme(parseScheme(
      "mname=Night\nmiconset=light\nmdesktopbackground=49 49 54 255\n" +
      "mdocumentbackground=45 45 50 255\nmgadgetaction=70 70 77 255\n" +
      "mgadgetactionselected=62 71 107 255\nmgadgetborder=43 43 48 255\n" +
      "mgadgettabstext=182 182 182 255\nmgadgettextinside=182 182 182 255\n" +
      "mgadgettextoutside=182 182 182 255\nmgadgettoolbarbutton=92 92 92 255\n" +
      "mgadgettoolbarbuttonselected=115 115 115 255\nmcameraprofile=128 128 255 255\n" +
      "mreqtitle=137 137 137 255\nmtooltipbackground=137 143 166 255\nmtooltiptext=10 10 10 255\n"));
    return false;
  }
}
