// Find the enclosing x64 function (from .pdata) for one or more VAs.
const fs = require("fs");
const exe = process.argv[2];
const addrs = process.argv.slice(3).map(s => BigInt(s));
const buf = fs.readFileSync(exe);
const peOff = buf.readUInt32LE(0x3c);
const coff = peOff + 4;
const numSec = buf.readUInt16LE(coff + 2);
const optSize = buf.readUInt16LE(coff + 16);
const opt = coff + 20;
const pe32plus = buf.readUInt16LE(opt) === 0x20b;
const imageBase = pe32plus ? Number(buf.readBigUInt64LE(opt + 24)) : buf.readUInt32LE(opt + 28);
const secTab = opt + optSize;
const secs = [];
for (let i = 0; i < numSec; i++) {
  const o = secTab + i * 40;
  secs.push({
    name: buf.toString("ascii", o, o + 8).replace(/\0+$/, ""),
    vsize: buf.readUInt32LE(o + 8), rva: buf.readUInt32LE(o + 12),
    rawSize: buf.readUInt32LE(o + 16), rawPtr: buf.readUInt32LE(o + 20),
  });
}
const rvaToOff = (rva) => { for (const s of secs) if (rva >= s.rva && rva < s.rva + Math.max(s.vsize, s.rawSize)) return s.rawPtr + (rva - s.rva); return -1; };
const pdata = secs.find(s => s.name === ".pdata");
if (!pdata) throw new Error("no .pdata");
const n = pdata.rawSize / 12;
const entries = [];
for (let i = 0; i < n; i++) {
  const o = pdata.rawPtr + i * 12;
  entries.push({ begin: buf.readUInt32LE(o), end: buf.readUInt32LE(o + 4), unwind: buf.readUInt32LE(o + 8) });
}
console.log(`pdata entries: ${n}`);
for (const a of addrs) {
  const rva = Number(a - BigInt(imageBase));
  const hit = entries.find(e => rva >= e.begin && rva < e.end);
  if (hit) {
    console.log(`${a.toString ? "0x" + a.toString(16) : a} -> function 0x${(imageBase + hit.begin).toString(16)} .. 0x${(imageBase + hit.end).toString(16)} (size ${hit.end - hit.begin})`);
  } else {
    console.log(`0x${a.toString(16)} -> not inside any .pdata function`);
  }
}
// Also print the 8 nearest function starts around the first addr
if (addrs.length) {
  const rva = Number(addrs[0] - BigInt(imageBase));
  const near = entries.filter(e => Math.abs(e.begin - rva) < 0x4000).sort((x, y) => x.begin - y.begin);
  console.log("\nnearby functions:");
  for (const e of near) console.log(`  0x${(imageBase + e.begin).toString(16)} .. 0x${(imageBase + e.end).toString(16)} (size ${e.end - e.begin})`);
}
