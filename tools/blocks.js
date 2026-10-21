const fs=require('fs');
const raw=fs.readFileSync('C:/Program Files/TVPaint Developpement/TVPaint Animation 12 Pro Demo/Resources/data/english.tvpaint.loc','utf8').replace(/\r\n/g,'\n');
const lines=raw.split('\n');
// find separator indices
const seps=[];
lines.forEach((l,i)=>{ if(/^#/.test(l.trim())) seps.push(i); });
console.log('separator lines:',seps.length);
// group entries between separators
const blocks=[];
let cur={start:null,entries:[]};
const re=/^\$(\d{6,10})[ \t]*"((?:[^"\\]|\\.)*)"/;
for(let i=0;i<lines.length;i++){
  const m=re.exec(lines[i]);
  if(m){ cur.entries.push({id:m[1],text:m[2],line:i+1}); }
  else if(/^#/.test(lines[i].trim())){
    if(cur.entries.length) blocks.push(cur);
    cur={start:i+1,entries:[]};
  }
}
if(cur.entries.length) blocks.push(cur);
console.log('blocks:',blocks.length);
fs.writeFileSync('reports/blocks.json',JSON.stringify(blocks,null,1),'utf8');
for(let i=0;i<blocks.length;i++){
  const b=blocks[i];
  console.log('#'+i+'  lines '+(b.entries[0]?b.entries[0].line:'-')+'..'+(b.entries.length?b.entries[b.entries.length-1].line:'-')+'  n='+b.entries.length+'  ids '+b.entries[0].id+'..'+b.entries[b.entries.length-1].id+'  | '+(b.entries[0]?b.entries[0].text.slice(0,50).replace(/\n/g,'\\n'):''));
}
