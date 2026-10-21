const fs=require('fs');
const dir='C:/Program Files/TVPaint Developpement/TVPaint Animation 12 Pro Demo/Resources/data/';
const re=/\$(\d{6,10})[ \t]*"((?:[^"\\]|\\.)*)"/g;
const sets={};
for(const f of ['english','french','chinese','japanese']){
  const raw=fs.readFileSync(dir+f+'.tvpaint.loc','utf8').replace(/\r\n/g,'\n');
  const map=new Map(); let m;
  while((m=re.exec(raw))!==null) map.set(m[1],m[2]);
  sets[f]=map;
  console.log(f, map.size);
}
const en=sets.english;
for(const f of ['french','chinese','japanese']){
  const extra=[...sets[f].keys()].filter(k=>!en.has(k));
  console.log(f,'ids not in english:',extra.length, extra.slice(0,40).join(' '));
}
const ids=['011021118','011021119','011021120','011021121','011021122','011021123','011021124','011021125','011021126','011021127','011021128','011021129','000021110','000021111','000021112','000021113','000021114','000021117'];
for(const id of ids){
  const row=ids2(id);
  console.log(id, JSON.stringify(row));
}
function ids2(id){
  const r={};
  for(const f of ['english','french','chinese','japanese']) r[f]=sets[f].has(id)?sets[f].get(id):null;
  return r;
}
