const fs=require('fs');
const raw=fs.readFileSync('C:/Program Files/TVPaint Developpement/TVPaint Animation 12 Pro Demo/Resources/data/english.tvpaint.loc','utf8').replace(/\r\n/g,'\n');
const lines=raw.split('\n');
const target=process.argv[2];
const start=parseInt(process.argv[3]||'-10',10);
const cnt=parseInt(process.argv[4]||'40',10);
const idx=lines.findIndex(l=>l.includes(target));
console.log('found at line',idx+1);
for(let i=Math.max(0,idx+start);i<Math.min(lines.length,idx+start+cnt);i++) console.log(String(i).padStart(5)+': '+lines[i].slice(0,140));
