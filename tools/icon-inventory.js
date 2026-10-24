const fs = require('fs');
const dir = process.argv[2];
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
const bases = new Set();
for (const f of files) bases.add(f.replace(/-x(10|15|20|25|30)\.png$/, ''));
const all = [...bases].sort();
const by = p => all.filter(n => n.startsWith(p));
console.log('files', files.length, 'unique bases', bases.size);
for (const p of ['Tool', 'Shape-', 'Shape-Fill-', 'Shape-Selection-', 'Shape-CutBrush-', 'Shape-FloodFill-', 'Zoom-', 'Color-', 'Pan']) {
  const a = by(p);
  console.log('\n## ' + p + ' (' + a.length + ')');
  console.log(a.join('\n'));
}
