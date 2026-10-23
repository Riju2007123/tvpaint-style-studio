/* Node tests for fsafe.js - atomic writes and crash-recovery snapshots */
"use strict";
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const F = require("../fsafe.js");

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log("  PASS " + name); passed++; }
  catch (e) { console.log("  FAIL " + name + " :: " + e.message); failed++; }
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fsafe-"));
const leftovers = (dir) => fs.readdirSync(dir).filter(n => n.endsWith(".tmp"));

test("atomicWrite creates folders and writes text", () => {
  const f = path.join(tmp, "a", "b", "p.tvpp");
  F.atomicWrite(f, "hello");
  assert.strictEqual(fs.readFileSync(f, "utf8"), "hello");
});
test("atomicWrite replaces an existing file and leaves no temp file", () => {
  const f = path.join(tmp, "p2.tvpp");
  F.atomicWrite(f, "old"); F.atomicWrite(f, "new");
  assert.strictEqual(fs.readFileSync(f, "utf8"), "new");
  assert.deepStrictEqual(leftovers(tmp), []);
});
test("atomicWrite writes binary buffers unchanged", () => {
  const f = path.join(tmp, "x.png");
  const buf = Buffer.from([0, 255, 1, 254, 137, 80, 78, 71]);
  F.atomicWrite(f, buf);
  assert.ok(fs.readFileSync(f).equals(buf));
});
test("a failed write keeps the old file and removes the temp file", () => {
  const f = path.join(tmp, "keep.tvpp");
  F.atomicWrite(f, "precious");
  assert.throws(() => F.atomicWrite(f, 12345));   // not a string or buffer
  assert.strictEqual(fs.readFileSync(f, "utf8"), "precious");
  assert.deepStrictEqual(leftovers(tmp), []);
});
test("recovery: write, read back, clear", () => {
  const dir = path.join(tmp, "rec");
  assert.strictEqual(F.readRecovery(dir), null);
  F.writeRecovery(dir, { name: "scene.tvpp", filePath: "C:\\x\\scene.tvpp" }, '{"app":"my-version"}');
  const r = F.readRecovery(dir);
  assert.strictEqual(r.name, "scene.tvpp");
  assert.strictEqual(r.filePath, "C:\\x\\scene.tvpp");
  assert.strictEqual(r.data, '{"app":"my-version"}');
  assert.ok(r.savedAt > 0);
  assert.strictEqual(F.clearRecovery(dir), true);
  assert.strictEqual(F.readRecovery(dir), null);
  assert.strictEqual(F.clearRecovery(dir), false);
});
test("a corrupt or empty recovery file is ignored, not fatal", () => {
  const dir = path.join(tmp, "rec2");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(F.recoveryPath(dir), "{not json");
  assert.strictEqual(F.readRecovery(dir), null);
  fs.writeFileSync(F.recoveryPath(dir), JSON.stringify({ savedAt: 1, name: "n", data: "" }));
  assert.strictEqual(F.readRecovery(dir), null);
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
