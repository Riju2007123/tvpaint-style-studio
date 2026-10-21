const e=require('../reports/loc-entries.json');
const words=process.argv.slice(2);
const re=new RegExp('('+words.join('|')+')','i');
const hits=e.filter(x=>re.test(x.text));
console.log('hits',hits.length);
for(const x of hits) console.log(x.id+' | '+x.text.replace(/\n/g,'\\n'));
