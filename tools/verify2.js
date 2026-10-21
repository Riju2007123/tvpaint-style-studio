const fs=require('fs');
const path=require('path');
const md=fs.readFileSync(path.join(__dirname,'..','reports','prefs-strings.md'),'utf8');
const E=require(path.join(__dirname,'..','reports','loc-entries.json'));
const byId=new Map(E.map(x=>[x.id,x.text]));
const sec4=md.slice(md.indexOf('## 4.'), md.indexOf('## 5.'));
const lines=sec4.split('\n');
const re=new RegExp('^\\| `(\\d{9,10})`(\\*\\* \\[listed above\\]\\*\\*)? \\| (.*) \\|$');
let rows=0, bad=0, missing=0;
const words=['preference','preferences','shortcut','keyboard','keymap','assign','unassign','undo size','cache','startup','temp dir','physical memory','theme','panel','language','sound','path','draw','timeline','clip','thumbnail','default config','general','interface'];
const rx=new RegExp('('+words.map(w=>w.replace(/ /g,'\\s+')).join('|')+')','i');
let nonMatching=0;
for(const line of lines){
  const m=re.exec(line);
  if(!m) continue;
  rows++;
  const id=m[1], shown=m[3];
  const e=byId.get(id);
  if(e===undefined){ missing++; continue; }
  const dec=shown.split('\\|').join('|');
  const expect=e.replace(/\r/g,'\\r').replace(/\n/g,'\\n');
  if(dec!==expect){ bad++; if(bad<6) console.log('DIFF',id,JSON.stringify(dec.slice(0,60)),'!=',JSON.stringify(expect.slice(0,60))); }
  if(!rx.test(e)) { nonMatching++; if(nonMatching<6) console.log('NOT A KEYWORD HIT',id,e.slice(0,60)); }
}
console.log('kw rows',rows,'missing',missing,'mismatches',bad,'non-keyword rows',nonMatching);
