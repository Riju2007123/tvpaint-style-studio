// Coverage of the captured TVPaint default keymap by the rebuild's dispatch
// table. Reads the label keys out of ui.js text so it runs without a DOM.
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "ui.js"), "utf8");
const start = src.indexOf("const TV_LIVE_COMMAND_ACTIONS = {");
const end = src.indexOf("window.tvDispatchShortcutCommand");
const block = src.slice(start, end);
const keys = [];
for (const line of block.split(/\r?\n/)) {
  const m = /^\s{2}"((?:[^"\\]|\\.)*)":/.exec(line);
  if (m) keys.push(JSON.parse('"' + m[1] + '"'));
}
global.window = {};
require(path.join(__dirname, "..", "keymap-data.js"));
const vals = [...new Set(Object.values(window.TV_DEFAULT_KEYMAP)
  .filter(v => v && String(v).toLowerCase() !== "none"))];
const missing = vals.filter(v => !keys.includes(v));
const extra = keys.filter(k => !vals.includes(k));
console.log(`implemented ${keys.length} of ${vals.length} bound commands`);
console.log(`missing (${missing.length}): ${missing.join(" | ")}`);
if (extra.length) console.log(`implemented but not in the default map: ${extra.join(" | ")}`);
