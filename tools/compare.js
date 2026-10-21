/* ------------------------------------------------------------------
   compare.js - the measurement of a panel of our application against
   the capture of the live one.

   node tools/compare.js <our.png> <live.png> [out.png]

   It writes the difference as an image (the pixels that differ are
   magenta, the ones that match are dimmed) and prints how many pixels
   differ.  A panel is only "1:1" when this number is zero (or only the
   anti-aliasing of the text differs).
   ------------------------------------------------------------------ */
const fs = require("fs");
const { PNG } = (() => { try { return require("pngjs"); } catch (e) { return {}; } })();

function readPNG(file) {
  const buf = fs.readFileSync(file);
  if (PNG && PNG.sync) return PNG.sync.read(buf);
  throw new Error("pngjs is needed: npm i pngjs");
}

const a = process.argv[2], b = process.argv[3], out = process.argv[4] || "diff.png";
// the crop of our capture (the panel inside the window of the application)
const ox = parseInt(process.argv[5] || "0", 10), oy = parseInt(process.argv[6] || "0", 10);
if (!a || !b) { console.log("usage: node compare.js <our.png> <live.png> [out.png]"); process.exit(1); }

const A = readPNG(a), B = readPNG(b);
const w = Math.min(A.width - ox, B.width), h = Math.min(A.height - oy, B.height);
const diff = new PNG({ width: w, height: h });
let n = 0, off = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = ((y + oy) * A.width + (x + ox)) << 2, j = (y * B.width + x) << 2, o = (y * w + x) << 2;
    const d = Math.abs(A.data[i] - B.data[j]) + Math.abs(A.data[i + 1] - B.data[j + 1]) + Math.abs(A.data[i + 2] - B.data[j + 2]);
    if (d > 30) {
      n++;
      diff.data[o] = 255; diff.data[o + 1] = 0; diff.data[o + 2] = 255; diff.data[o + 3] = 255;
    } else {
      const g = (A.data[j] + A.data[j + 1] + A.data[j + 2]) / 6;
      diff.data[o] = g * 0.5; diff.data[o + 1] = g * 0.5; diff.data[o + 2] = g * 0.5; diff.data[o + 3] = 255;
    }
  }
}
if (A.width !== B.width || A.height !== B.height) off = 1;
fs.writeFileSync(out, PNG.sync.write(diff));
const total = w * h;
console.log("size  ours " + A.width + "x" + A.height + " cropped at " + ox + "," + oy + " -> " + w + "x" + h + "  live " + B.width + "x" + B.height + (off ? "  (SIZES DIFFER)" : ""));
console.log("different pixels: " + n + " / " + total + "  (" + (100 * n / total).toFixed(2) + "%)");
console.log("difference written to " + out);
