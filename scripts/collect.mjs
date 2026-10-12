import fs from 'node:fs/promises';
const base='https://randoxygene.departement06.fr';
const api='https://geotrek.departement06.fr/api/v2/';
const decode=s=>s.replace(/&(?:amp|quot|apos|lt|gt|nbsp);/g,x=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '})[x]).replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,a,b)=>String.fromCodePoint(parseInt(a||b,a?16:10)));
const plain=s=>decode((s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
async function get(url,json=false){for(let n=0;n<3;n++){try{const r=await fetch(url,{signal:AbortSignal.timeout(55000)});if(!r.ok)throw Error(r.status+' '+url);return json?await r.json():await r.text()}catch(e){if(n===2)throw e;}}}
async function pool(items,fn,limit=4){let i=0;const out=[];await Promise.all(Array.from({length:limit},async()=>{while(i<items.length){const k=i++;out[k]=await fn(items[k],k)}}));return out;}
await fs.mkdir('data',{recursive:true});
const catalogUrl=base+'/annuaire-des-randonnees?discipline%5B929%5D=929';
const first=await get(catalogUrl);
const expected=Number(first.match(/class="js-ajax-info-total">(\d+)/)?.[1]);
const perPage=Number(first.match(/class="js-ajax-info-count">(\d+)/)?.[1]);
if(!expected||!perPage)throw Error('Impossible de déterminer la pagination du catalogue officiel.');
const pages=[first,...await pool(Array.from({length:Math.ceil(expected/perPage)-1},(_,i)=>i+1),i=>get(catalogUrl+'&page='+i))];
const listed=pages.flatMap(h=>[...h.matchAll(/<article class="hiking-item">([\s\S]*?)<\/article>/g)].map(m=>{const x=m[1];const link=x.match(/href="([^"]+)" class="hiking-item__title-link">([\s\S]*?)<\/a>/);return {name:plain(link[2]),source:base+decode(link[1]),category:plain(x.match(/class="hiking-item__category">([\s\S]*?)<\/span>/)?.[1]),departure:plain(x.match(/<b>Départ<\/b>([\s\S]*?)<\/p>/)?.[1])}}));
const unique=[...new Map(listed.map(x=>[x.source,x])).values()];
if(unique.length!==expected)throw Error('Catalogue incomplet : '+unique.length+' fiches collectées pour '+expected+' annoncées.');
const selected=unique.filter(x=>/Tinée|Vésubie|Var|Roya|Bévéra|Cians/i.test(x.category));
console.log('Catalogue: '+unique.length+'; vallées demandées: '+selected.length);
const withIds=await pool(selected,async x=>{const h=await get(x.source);return {...x,id:Number(h.match(/trek-id="(\d+)"/)?.[1])}},5);
if(withIds.some(x=>!x.id))throw Error('Missing trek IDs');
const treks=await pool(withIds,async x=>{const t=await get(api+'trek/'+x.id+'/',true);return {catalog:x,trek:t}},4);
await fs.writeFile('data/research.json',JSON.stringify({collectedAt:new Date().toISOString(),catalogCount:unique.length,selectedCount:selected.length,treks},null,2));
const fields=Object.keys(treks[0].trek);console.log('Champs API: '+fields.join(', '));
console.log('Couverture: '+JSON.stringify(Object.fromEntries(['Tinée','Vésubie','Var','Roya','Bévéra','Cians'].map(v=>[v,selected.filter(x=>x.category.includes(v)).length]))));
console.log('Exemple sans géométrie: '+JSON.stringify(treks[0].trek,(k,v)=>k==='geometry'||k==='description'||k==='attachments'?undefined:v).slice(-4500));
