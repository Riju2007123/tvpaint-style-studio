// Offline x86-64 disassembler for a VA range of a PE file (iced-x86).
const fs = require("fs");
const { Decoder, Formatter, Code } = require("iced-x86");

const exe = process.argv[2];
const startVa = BigInt(process.argv[3]);
const length = parseInt(process.argv[4], 10) || 256;
const showBytes = process.argv.includes("--bytes");

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
const offToRva = (off) => { for (const s of secs) if (off >= s.rawPtr && off < s.rawPtr + s.rawSize) return s.rva + (off - s.rawPtr); return -1; };

const va = Number(startVa);
const rva = va - imageBase;
const off = rvaToOff(rva);
if (off < 0) { console.error("VA not mapped"); process.exit(1); }
const code = buf.slice(off, off + length);
const dec = new Decoder(64, code, { ip: BigInt(va) });
dec.ip = BigInt(va);
const fmt = new Formatter();

let insn = dec.decode();
let i = 0;
while (insn.code !== Code.INVALID && i < 4000) {
  const ip = Number(insn.ip);
  const rel = Number(insn.ip - BigInt(va));
  const bytes = code.slice(rel, rel + insn.length);
  let line = fmt.format(insn);
  const hex = bytes.toString("hex").match(/.{1,2}/g).join(" ");
  console.log((ip.toString(16).padStart(9, "0")) + (showBytes ? "  " + hex.padEnd(24) : "  ") + "  " + line);
  insn = dec.decode();
  i++;
}
