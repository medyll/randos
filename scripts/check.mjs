import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const catalogue = await fs.readFile(new URL('randos/catalogue.js', root), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(catalogue, sandbox);
const data = sandbox.window.RANDO_DATA;
assert(data.hikes.length > 200, 'Catalogue incomplet');
assert.equal(new Set(data.hikes.map(h => h.id)).size, data.hikes.length, 'Identifiants dupliqués');
const sectors = ['Tinée', 'Vésubie', 'Var', 'Roya', 'Roya / Bévéra', 'Cians'];
for (const sector of sectors) assert(data.hikes.some(h => h.valleys.includes(sector)), 'Secteur absent : ' + sector);
for (const hike of data.hikes) {
  assert(Number.isFinite(hike.ascent) && hike.ascent >= 0, 'Dénivelé invalide : ' + hike.id);
  assert(Number.isFinite(hike.hours) && hike.hours > 0, 'Durée invalide : ' + hike.id);
  assert(Number.isFinite(hike.distance) && hike.distance > 0, 'Distance invalide : ' + hike.id);
  assert(hike.coords.length && hike.coords.every(line => line.length >= 2), 'Tracé manquant : ' + hike.id);
  assert(hike.coords.flat().every(point => point.length >= 2 && point.every(Number.isFinite)), 'Coordonnées invalides : ' + hike.id);
  assert(hike.valleys.length && hike.valleys.every(v => sectors.includes(v)), 'Vallée invalide : ' + hike.id);
  for (const value of Object.values(hike.features)) assert([true, false, null].includes(value.value), 'Critère invalide');
  for (const source of hike.sources) assert(source.url.startsWith('https://'), 'Source invalide');
}
for (const event of data.events) {
  assert(event.start <= event.end, 'Dates d’événement inversées');
  assert(event.valleys.length && event.valleys.every(v => sectors.includes(v)), 'Vallée d’événement invalide');
  assert(event.source.startsWith('https://'), 'Source d’événement absente');
  if (event.weekday != null) assert(Number.isInteger(event.weekday) && event.weekday >= 0 && event.weekday <= 6);
}
new vm.Script(await fs.readFile(new URL('randos/randos.js', root), 'utf8'));
const html = await fs.readFile(new URL('randos/randos.html', root), 'utf8');
assert(html.includes('<title>Rando tentative</title>'));
const css = await fs.readFile(new URL('randos/randos.css', root), 'utf8');
const customTags = [...new Set([...html.matchAll(/<([a-z]+(?:-[a-z]+)+)(?:\s|>)/g)].map(m => m[1]))];
for (const tag of customTags) assert(new RegExp(tag + '[^{}]*\\{[^}]*display\\s*:').test(css), 'display manquant : ' + tag);
console.log(`Vérification réussie : ${data.hikes.length} itinéraires, ${sectors.length} secteurs, ${data.events.length} événements, géométries et scripts valides.`);
