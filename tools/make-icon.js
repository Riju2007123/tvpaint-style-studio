/* builds build.ico (16/32/48/256) from a PNG using a canvas-free BMP writer:
   the app icon is drawn from scratch so it matches the TVPaint chrome. */
const fs = require("fs");
const zlib = require("zlib");

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { buf: b, w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// decode a PNG (RGBA, 8 bit, no interlace) with zlib
function decodePNG(buf) {
  let p = 8, w = 0, h = 0, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("ascii", p + 4, p + 8);
    const data = buf.slice(p + 8, p + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); }
    if (type === "IDAT") idat.push(data);
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4, stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[pos++];
    const line = raw.slice(pos, pos + stride); pos += stride;
    const cur = out.slice(y * stride, (y + 1) * stride);
    const prev = y ? out.slice((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      cur[i] = v & 255;
    }
  }
  return { w, h, rgba: out };
}

function drawIcon(size) {
  // the TVPaint chrome: a dark rounded square with the light "camera" cross
  const buf = Buffer.alloc(size * size * 4);
  const bg = [49, 49, 54, 255], fg = [128, 128, 255, 255], ac = [110, 96, 50, 255];
  const r = size * 0.18;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // rounded corners -> transparent
      const dx = Math.min(x, size - 1 - x), dy = Math.min(y, size - 1 - y);
      let corner = 0;
      if (dx < r && dy < r) {
        const d = Math.hypot(r - dx, r - dy);
        corner = d > r ? 255 : Math.round(255 * (d - (r - 1)) );
      }
      // the glyph: a camera frame cross
      const cx = (size - 1) / 2, half = size * 0.26, arm = size * 0.42;
      const onV = Math.abs(x - cx) < Math.max(1, size * 0.035) && Math.abs(y - cx) < arm;
      const onH = Math.abs(y - cx) < Math.max(1, size * 0.035) && Math.abs(x - cx) < arm;
      const onBox = Math.abs(x - cx) < half && Math.abs(y - cx) < half &&
        (Math.abs(Math.abs(x - cx) - half) < size * 0.03 || Math.abs(Math.abs(y - cx) - half) < size * 0.03);
      let c = bg;
      if (onV || onH) c = fg;
      else if (onBox) c = ac;
      buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
      buf[i + 3] = corner >= 255 ? 0 : 255;
    }
  }
  return buf;
}

function bmpEntry(rgba, w, h) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(w, 4);
  header.writeInt32LE(h * 2, 8);
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(w * h * 4, 20);
  const xor = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4, d = ((h - 1 - y) * w + x) * 4;
      xor[d] = rgba[s + 2]; xor[d + 1] = rgba[s + 1]; xor[d + 2] = rgba[s]; xor[d + 3] = rgba[s + 3];
    }
  }
  const maskRow = Math.ceil(w / 32) * 4;
  const mask = Buffer.alloc(maskRow * h, 0);
  return Buffer.concat([header, xor, mask]);
}

const sizes = [16, 32, 48, 256];
const images = sizes.map(s => bmpEntry(drawIcon(s), s, s));
const dir = Buffer.alloc(6);
dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2); dir.writeUInt16LE(sizes.length, 4);
let offset = 6 + sizes.length * 16;
const entries = [];
sizes.forEach((s, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(s >= 256 ? 0 : s, 0);
  e.writeUInt8(s >= 256 ? 0 : s, 1);
  e.writeUInt8(0, 2); e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(images[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += images[i].length;
  entries.push(e);
});
fs.writeFileSync("build.ico", Buffer.concat([dir, ...entries, ...images]));
console.log("build.ico written:", fs.statSync("build.ico").size, "bytes");
