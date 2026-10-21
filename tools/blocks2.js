const b=require('../reports/blocks.json');
const re=new RegExp(process.argv[2]);
for(let i=0;i<b.length;i++){
  const bl=b[i];
  const hits=bl.entries.filter(x=>re.test(x.id));
  if(hits.length===0) continue;
  console.log('===== BLOCK '+i+'  lines '+bl.entries[0].line+'..'+bl.entries[bl.entries.length-1].line+'  n='+bl.entries.length+'  (matched '+hits.length+')');
  for(const x of bl.entries) console.log('   '+x.id+' | '+x.text.replace(/\n/g,'\\n'));
}
