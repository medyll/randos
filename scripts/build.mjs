import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const destination = path.join(root, 'dist');
await fs.mkdir(destination, { recursive: true });
await fs.copyFile(path.join(root, 'randos', 'randos.html'), path.join(destination, 'index.html'));
for (const name of ['randos.css', 'randos.js', 'catalogue.js', 'favicon.svg']) {
  await fs.copyFile(path.join(root, 'randos', name), path.join(destination, name));
}
await fs.writeFile(path.join(destination, '.nojekyll'), '');
console.log('Site statique prêt dans dist/ (5 fichiers, aucune dépendance).');
