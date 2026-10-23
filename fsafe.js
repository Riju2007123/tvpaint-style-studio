/* ------------------------------------------------------------------
   fsafe.js - crash-safe file helpers for the desktop shell (no Electron
   dependency, so the node tests can load it).

   atomicWrite: the data goes to a temporary file in the same folder and is
   renamed over the target, so a crash or power cut in the middle of a save
   leaves either the old project or the new one - never half of each.

   Recovery files: the page hands the shell a snapshot of the project every
   minute while it has unsaved changes. The snapshot lives in the app's own
   data folder and is removed on a clean save / quit. If the application
   dies, the next start finds it and offers to restore it.
   ------------------------------------------------------------------ */
const fs = require("fs");
const path = require("path");

function atomicWrite(file, data, encoding) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, "." + path.basename(file) + "." + process.pid + "." + Date.now() + ".tmp");
  try {
    const fd = fs.openSync(tmp, "w");
    try {
      if (typeof data === "string") fs.writeSync(fd, data, null, encoding || "utf8");
      else fs.writeSync(fd, data);
      try { fs.fsyncSync(fd); } catch (e) { /* not supported everywhere */ }
    } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, file);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch (e) { /* already gone */ }
    throw err;
  }
}

const RECOVERY_NAME = "recovery.json";

function recoveryPath(dir) { return path.join(dir, RECOVERY_NAME); }

// meta: { name, filePath } of the project the snapshot belongs to
function writeRecovery(dir, meta, data) {
  const payload = JSON.stringify({
    savedAt: Date.now(),
    name: (meta && meta.name) || "Untitled",
    filePath: (meta && meta.filePath) || null,
    data: data
  });
  atomicWrite(recoveryPath(dir), payload);
}

// returns null when there is nothing (or nothing readable) to recover
function readRecovery(dir) {
  try {
    const o = JSON.parse(fs.readFileSync(recoveryPath(dir), "utf8"));
    if (!o || typeof o.data !== "string" || !o.data) return null;
    return o;
  } catch (e) { return null; }
}

function clearRecovery(dir) {
  try { fs.unlinkSync(recoveryPath(dir)); return true; } catch (e) { return false; }
}

module.exports = { atomicWrite, writeRecovery, readRecovery, clearRecovery, recoveryPath };
