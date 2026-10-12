import fs from 'node:fs/promises';
const api='https://adminrando.marittimemercantour.eu/api/v2/';
async function get(path){const r=await fetch(api+path,{signal:AbortSignal.timeout(55000)});if(!r.ok)throw Error(r.status);return r.json();}
const first=await get('trek/?page_size=20');
const pages=[first];
for(let p=2;p<=Math.ceil(first.count/20);p+=3){pages.push(...await Promise.all(Array.from({length:Math.min(3,Math.ceil(first.count/20)-p+1)},(_,i)=>get('trek/?page_size=20&page='+(p+i)))));}
const all=pages.flatMap(p=>p.results);
const selected=all.filter(t=>t.published.fr&&t.practice===4&&String(t.departure_city_code).startsWith('06')&&t.districts.some(d=>[2,4,5,6,7].includes(d)));
await fs.writeFile('data/mercantour-research.json',JSON.stringify({collectedAt:new Date().toISOString(),catalogCount:first.count,selectedCount:selected.length,treks:selected},null,2));
console.log('Mercantour: '+first.count+' examinés, '+selected.length+' au départ du 06 dans les secteurs demandés.');
