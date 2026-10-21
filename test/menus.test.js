/* menus.test.js â€” structural checks on the transcribed TVPaint menu tree.
   These are integrity tests, not visual ones: they catch the mistakes that
   matter in a hand-transcribed menu (empty submenus, doubled separators,
   missing shortcuts) and pin the counts that were read off the live app. */
const assert = require("assert");
const { TV_MENU_TREE, TV_IMAGE_MARK_SWATCHES, STUB_COMMANDS } = require("../menus.js");

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; console.log("  ok   " + name); }
  catch (e) { fail++; console.log("  FAIL " + name + " â€” " + e.message); }
};

const menu = (label) => TV_MENU_TREE.find(m => m.label === label);
const sub = (menuLabel, itemLabel) => {
  const it = (menu(menuLabel).items || []).find(i => i.label === itemLabel);
  assert(it && it.submenu, `${menuLabel} > ${itemLabel} has no submenu`);
  return it.submenu;
};
const labels = (items) => items.filter(i => !i.sep).map(i => i.label);
// File > Recent * build their submenu at open time from the recents store, so
// at rest they are functions. Structural tests walk the static tree only.
const staticSub = (it) => (it && typeof it.submenu === "function" ? [] : (it && it.submenu));

console.log("menus.js");

t("11 menus, in the live app's order", () => {
  assert.deepStrictEqual(TV_MENU_TREE.map(m => m.label),
    ["File", "Edit", "Project", "Clip", "Layer", "Image", "Effects", "View",
     "Windows", "Custom Panels", "Help"]);
});

t("every menu has items", () => {
  TV_MENU_TREE.forEach(m => assert(m.items && m.items.length > 0, m.label + " is empty"));
});

t("no leading, trailing or doubled separators at any depth", () => {
  const walk = (items, path) => {
    assert(!items[0].sep, `leading separator in ${path}`);
    assert(!items[items.length - 1].sep, `trailing separator in ${path}`);
    for (let i = 1; i < items.length; i++) {
      assert(!(items[i].sep && items[i - 1].sep), `doubled separator in ${path}`);
    }
    items.forEach(it => { const s = staticSub(it); if (s && s.length) walk(s, path + " > " + it.label); });
  };
  TV_MENU_TREE.forEach(m => walk(m.items, m.label));
});

t("every non-separator item has a label and a destination", () => {
  const walk = (items, path) => {
    items.forEach(it => {
      if (it.sep) return;
      assert(it.label && it.label.length, `unlabelled item in ${path}`);
      const hasDest = it.disabled || !!(it.cmd || it.panel || it.custom || it.submenu);
      assert(hasDest, `no cmd/panel/custom/submenu for "${it.label}" in ${path}`);
      const s = staticSub(it);
      if (s) walk(s, path + " > " + it.label);
    });
  };
  TV_MENU_TREE.forEach(m => walk(m.items, m.label));
});

t("shortcut strings are non-empty when present", () => {
  const walk = (items) => items.forEach(it => {
    if (it.sep) return;
    if (it.shortcut !== undefined) {
      assert(typeof it.shortcut === "string" && it.shortcut.trim().length > 0,
        `empty shortcut on "${it.label}"`);
    }
    if (it.submenu) { const s = staticSub(it); if (s) walk(s); }
  });
  TV_MENU_TREE.forEach(m => walk(m.items));
});

t("Windows menu carries the 5 captured panel groups", () => {
  assert.deepStrictEqual(labels(menu("Windows").items).slice(0, 4),
    ["Main", "Color Panel", "Tools", "Timeline"]);
  ["Animaton", "Drawing", "Show", "FX Tools", "Others", "Plugins", "Scripts"]
    .forEach(g => assert(sub("Windows", g).length > 0, g + " empty"));
  assert.deepStrictEqual(labels(sub("Windows", "Animaton")),
    ["Light Table", "Stopwatch", "Image Mark", "Flips", "Remote", "Preview Settings",
     "Video In Settings", "Pep-Holes Registration", "Timesheet"]);
  assert.deepStrictEqual(labels(sub("Windows", "Drawing")),
    ["Papers", "Gradient", "Line smoothing", "Guidelines", "Drawing Recorder",
     "Shape Settings", "Connection Settings"]);
  assert.deepStrictEqual(labels(sub("Windows", "Show")),
    ["Menu bar", "Notes", "Sound", "Navigator", "Color Group", "Coordinates",
     "Display Settings", "Color Checker"]);
  assert.deepStrictEqual(labels(sub("Windows", "FX Tools")),
    ["FX Stack", "Path Recorder", "Pixel Tracker", "Path Manager"]);
  assert.deepStrictEqual(labels(sub("Windows", "Others")),
    ["History", "Share Manager", "Image Library", "Search"]);
});

t("Effects menu: 8 groups with the captured filter counts", () => {
  const want = { Blur: 8, Color: 18, Distortion: 10, Keying: 6, Motion: 5,
                 Rendering: 16, Stylize: 21, Transition: 7 };
  Object.keys(want).forEach(g => {
    assert.strictEqual(labels(sub("Effects", g)).length, want[g], g + " count");
  });
  assert.strictEqual(Object.keys(want).reduce((n, k) => n + want[k], 0), 91);
});

t("Custom Panels lists the app's 16 entries and the 3 create commands", () => {
  const l = labels(menu("Custom Panels").items);
  assert.strictEqual(l.length, 21);
  assert.deepStrictEqual(l.slice(0, 3), ["Animator Panel", "Chalk", "Correction"]);
  assert(l.includes("Paintbrushes") && l.includes("Paintbrushs"),
    "the duplicate Paintbrushes entry is part of the live menu");
  assert.deepStrictEqual(l.slice(-5),
    ["New Custom Panel", "New Embedded Custom Panel", "Load a Custom Panel...",
     "Open All", "Hide All"]);
});

t("Edit > Set Mark palette: 31 swatches + Default, letters A..AE", () => {
  const l = labels(sub("Edit", "Set Mark"));
  assert.strictEqual(l.length, 32);
  assert.strictEqual(l[0], "Default");
  assert.deepStrictEqual(l.slice(1, 4), ["A", "B", "C"]);
  assert.strictEqual(l[l.length - 1], "AE");
  assert.strictEqual(TV_IMAGE_MARK_SWATCHES.length, 31);
  TV_IMAGE_MARK_SWATCHES.forEach(([k, sw]) =>
    assert(/^#[0-9a-f]{6}$/.test(sw), `bad swatch ${k} ${sw}`));
});

t("nested submenus survive 3 levels (Image > Exposure > Repeat Images)", () => {
  const rep = sub("Image", "Exposure").find(i => i.label === "Repeat Images");
  assert(rep && rep.submenu && rep.submenu.length >= 3);
});

t("View > Workspaces keeps the live accelerator set", () => {
  const w = sub("View", "Workspaces");
  assert.deepStrictEqual(w.map(i => i.shortcut),
    ["Ctrl Pad 1", "Ctrl Pad 3", "Ctrl Pad 7", "Ctrl Pad 9"]);
  assert.strictEqual(w[0].checked, true);
});

t("every command is implemented or explicitly registered as a stub", () => {
  const fs = require("fs");
  const path = require("path");
  const actions = new Set();
  for (const f of ["ui.js", "filemenu.js"]) {
    const src = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
    let m, re = /"([a-zA-Z][\w.]+)"\s*:\s*(?:\(|function)/g;
    while ((m = re.exec(src))) actions.add(m[1]);
    re = /MENU_ACTIONS\[["']?([\w.]+)["']?\]/g;
    while ((m = re.exec(src))) actions.add(m[1]);
  }
  const stubs = new Set(STUB_COMMANDS);
  const unaccounted = [];
  const walk = (items, where) => {
    items.forEach(it => {
      if (it.sep) return;
      if (it.cmd) {
        const handled = actions.has(it.cmd) || it.cmd.startsWith("fx.") ||
          it.panel || it.custom || it.submenu || stubs.has(it.cmd);
        if (!handled) unaccounted.push(where + " > " + it.label + " (" + it.cmd + ")");
      }
      if (Array.isArray(it.submenu)) walk(it.submenu, where + " > " + it.label);
    });
  };
  TV_MENU_TREE.forEach(m => walk(m.items || [], m.label));
  assert.strictEqual(unaccounted.length, 0,
    "commands without an action and without a stub entry: " + unaccounted.join(" | "));
  // a stub that got implemented must be removed from the registry
  const done = STUB_COMMANDS.filter(c => actions.has(c));
  assert.strictEqual(done.length, 0,
    "these commands are implemented now, drop them from STUB_COMMANDS: " + done.join(", "));
  // the list may only shrink
  assert(STUB_COMMANDS.length <= 49, "the stub list grew: " + STUB_COMMANDS.length);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

