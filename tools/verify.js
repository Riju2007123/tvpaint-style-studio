const fs=require('fs');
const path=require('path');
const md=fs.readFileSync(path.join(__dirname,'..','reports','prefs-strings.md'),'utf8');
const E=require(path.join(__dirname,'..','reports','loc-entries.json'));
const byId=new Map(E.map(x=>[x.id,x.text]));
const lines=md.split('\n');
const re=new RegExp('^\\| `(\\d{9,10})` \\| (.*?) \\| \\*\\*(CAPTION|HELP|TOOLTIP|LABEL)\\*\\*');
let rows=0, bad=0, missing=0;
const ids=new Set();
for(const line of lines){
  const m=re.exec(line);
  if(!m) continue;
  rows++;
  const id=m[1], shown=m[2];
  ids.add(id);
  const e=byId.get(id);
  if(e===undefined){ missing++; console.log('MISSING',id); continue; }
  const dec=shown.split('\\|').join('|');   // undo markdown pipe escape only
  const expect=e.replace(/\r/g,'\\r').replace(/\n/g,'\\n');
  if(dec!==expect){ if(bad<8) console.log('DIFF',id,JSON.stringify(dec.slice(0,70)),'!=',JSON.stringify(expect.slice(0,70))); bad++; }
}
console.log('rows',rows,'distinct ids',ids.size,'missing',missing,'text mismatches',bad);
