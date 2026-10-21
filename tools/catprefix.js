const e=require('../reports/loc-entries.json');
const cats=new Map();
for(const x of e){
  const t=x.text.trim();
  const i=t.indexOf(': ');
  if(i>0 && i<30){
    const c=t.slice(0,i);
    if(!cats.has(c)) cats.set(c,[]);
    cats.get(c).push(x.id);
  }
}
const arr=[...cats.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
console.log('categories with ": " prefix:',arr.length);
for(const [k,v] of arr) console.log(k.padEnd(34), v.length, v[0]+'..'+v[v.length-1]);
