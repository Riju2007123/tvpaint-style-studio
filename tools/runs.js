const e=require('../reports/loc-entries.json').slice().sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
const GAP=parseInt(process.argv[2]||'12',10);
const MIN=parseInt(process.argv[3]||'3',10);
let runs=[],cur=[e[0]];
for(let i=1;i<e.length;i++){
  const a=cur[cur.length-1].id, b=e[i].id;
  if(parseInt(b)-parseInt(a)<=GAP) cur.push(e[i]);
  else { runs.push(cur); cur=[e[i]]; }
}
runs.push(cur);
for(const r of runs){
  if(r.length<MIN) continue;
  console.log('### '+r[0].id+' .. '+r[r.length-1].id+'  (n='+r.length+')');
  for(const x of r) console.log('   '+x.id+' | '+x.text.replace(/\n/g,'\\n').slice(0,140));
}
