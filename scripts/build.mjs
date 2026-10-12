import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const destination = path.join(root, 'dist');
await fs.mkdir(destination, { recursive: true });
let html = await fs.readFile(path.join(root, 'randos', 'randos.html'), 'utf8');
for (const name of ['randos.css', 'randos.js', 'catalogue.js', 'favicon.svg']) {
  const content = await fs.readFile(path.join(root, 'randos', name));
  const version = createHash('sha256').update(content).digest('hex').slice(0, 12);
  html = html.replace(new RegExp('\\./' + name.replaceAll('.', '\\.') + '(?:\\?[^"\\s]*)?', 'g'), `./${name}?v=${version}`);
  await fs.writeFile(path.join(destination, name), content);
}
await fs.writeFile(path.join(destination, 'index.html'), html);
await fs.writeFile(path.join(destination, '.nojekyll'), '');
console.log('Site statique prêt dans dist/ (5 fichiers, aucune dépendance).');
