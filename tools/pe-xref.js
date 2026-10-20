// Offline PE scanner: find dialog/playback strings and code xrefs (RIP-relative lea).
const fs = require("fs");

const exe = process.argv[2];
const needles = process.argv.slice(3);
if (!exe || !needles.length) { console.error("usage: node pe-xref.js <exe> <string> [...]"); process.exit(2); }

const buf = fs.readFileSync(exe);

// ---- PE headers ----
const peOff = buf.readUInt32LE(0x3c);
if (buf.toString("ascii", peOff, peOff + 4) !== "PE\0\0") throw new Error("not PE");
const coff = peOff + 4;
const numSec = buf.readUInt16LE(coff + 2);
const optSize = buf.readUInt16LE(coff + 16);
const opt = coff + 20;
const magic = buf.readUInt16LE(opt);
const pe32plus = magic === 0x20b;
const imageBase = pe32plus ? Number(buf.readBigUInt64LE(opt + 24)) : buf.readUInt32LE(opt + 28);
const secTab = opt + optSize;

const secs = [];
for (let i = 0; i < numSec; i++) {
  const o = secTab + i * 40;
  secs.push({
    name: buf.toString("ascii", o, o + 8).replace(/\0+$/, ""),
    vsize: buf.readUInt32LE(o + 8),
    rva: buf.readUInt32LE(o + 12),
    rawSize: buf.readUInt32LE(o + 16),
    rawPtr: buf.readUInt32LE(o + 20),
  });
}
const rvaToOff = (rva) => {
  for (const s of secs) if (rva >= s.rva && rva < s.rva + Math.max(s.vsize, s.rawSize)) return s.rawPtr + (rva - s.rva);
  return -1;
};
const offToRva = (off) => {
  for (const s of secs) if (off >= s.rawPtr && off < s.rawPtr + s.rawSize) return s.rva + (off - s.rawPtr);
  return -1;
};
console.log("imageBase=0x" + imageBase.toString(16), "sections=" + secs.map(s => s.name).join(","));

// ---- find strings ----
const hits = [];
for (const needle of needles) {
  for (const [encName, enc] of [["ascii", "latin1"], ["utf16", "utf16le"]]) {
    const nb = Buffer.from(needle, enc);
    let from = 0;
    while (true) {
      const i = buf.indexOf(nb, from);
      if (i < 0) break;
      const rva = offToRva(i);
      hits.push({ needle, enc: encName, off: i, rva, va: rva >= 0 ? imageBase + rva : -1 });
      from = i + 1;
      if (hits.length > 200) break;
    }
  }
}
for (const h of hits) console.log(`STRING ${JSON.stringify(h.needle)} ${h.enc} off=0x${h.off.toString(16)} rva=0x${h.rva.toString(16)} va=0x${h.va.toString(16)}`);

// ---- scan .text for RIP-relative references to the string VAs ----
const text = secs.find(s => s.name === ".text");
const targets = new Map(hits.filter(h => h.va > 0).map(h => [h.va, h]));

function scanRip() {
  const out = [];
  const start = text.rawPtr, end = text.rawPtr + text.rawSize;
  for (let i = start; i < end - 7; i++) {
    // REX.W (48/4C) 8D /r with mod=00 rm=101  => 48 8D 05|0D|15|1D|25|2D|35|3D
    const b0 = buf[i];
    if (b0 !== 0x48 && b0 !== 0x4c) continue;
    if (buf[i + 1] !== 0x8d) continue;
    const modrm = buf[i + 2];
    if ((modrm & 0xc7) !== 0x05) continue;
    const disp = buf.readInt32LE(i + 3);
    const insnRva = offToRva(i);
    if (insnRva < 0) continue;
    const target = imageBase + insnRva + 7 + disp;
    if (targets.has(target)) out.push({ at: i, va: imageBase + insnRva, target, hit: targets.get(target) });
  }
  return out;
}
const refs = scanRip();
console.log(`\nRIP-relative lea refs: ${refs.length}`);
for (const r of refs) {
  console.log(`REF 0x${r.va.toString(16)} (off 0x${r.at.toString(16)}) -> 0x${r.target.toString(16)} "${r.hit.needle}"`);
  // show surrounding bytes for context
  const from = Math.max(0, r.at - 24), to = Math.min(buf.length, r.at + 40);
  console.log("    " + buf.slice(from, to).toString("hex").match(/.{1,32}/g).join(" "));
}

// also scan for 32-bit absolute references (mov r32, imm32) rarely used in x64
module.exports = {};
