// Parse TVPaint .loc file -> JSON entries (regex over whole text)
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] || "C:\\Program Files\\TVPaint Developpement\\TVPaint Animation 12 Pro Demo\\Resources\\data\\english.tvpaint.loc";
const OUT = process.argv[3] || path.join(__dirname, "..", "reports", "loc-entries.json");

const raw = fs.readFileSync(SRC, 'utf8');
// normalise CRLF -> LF, but keep a lone CR as a literal \r marker (entry 011084005 has one)
const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

const re = /\$(\d{6,10})[ \t]*"((?:[^"\\]|\\.)*)"/g;
const entries = [];
let m;
let consumed = 0;
while ((m = re.exec(text)) !== null) {
  const before = text.slice(consumed, m.index);
  consumed = m.index + m[0].length;
  entries.push({
    id: m[1],
    text: m[2].replace(/\\n/g, '\\n').replace(/\\t/g, '\\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
    raw: m[2],
    line: text.slice(0, m.index).split('\n').length,
    pre: before.length > 400 ? before.slice(-400) : before,
  });}
const rest = text.slice(consumed);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(entries, null, 1), 'utf8');
console.log('entries:', entries.length);
console.log('unique ids:', new Set(entries.map(e => e.id)).size);
console.log('trailing junk length:', rest.length);
console.log('trailing junk:', JSON.stringify(rest.slice(0, 500)));
