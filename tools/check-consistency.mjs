#!/usr/bin/env node
/* Stretch24 - Konsistenz-Check (Werkzeug, NICHT Teil der Webapp)
 *
 * Neue Übungen müssen an mehreren Stellen gepflegt werden. Dieses Skript
 * prüft, dass die Quellen zusammenpassen:
 *   assets/data.js            EXERCISES-IDs und ROUTINES-Items
 *   assets/img/<id>.png       eine Illustration pro Übung
 *   assets/img/thumb/<id>.png der 256er-Thumb fürs Übungsraster
 *   sw.js                     IMG_ASSETS-Precache-Liste
 *   tools/generate-images.mjs POSES-Prompt pro Übung
 *
 * Aufruf: node tools/check-consistency.mjs (Exit-Code 1 bei Fehlern)
 */

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(resolve(ROOT, rel), 'utf8');

/* Textbasiert statt import: data.js und sw.js sind Browser-Skripte
 * (Globals bzw. Service-Worker-Scope) und in Node nicht ausführbar. */
const block = (src, start) => src.slice(src.indexOf(start)).split('\n];')[0];
const matchAll = (src, re) => [...src.matchAll(re)].map((m) => m[1]);

const dataJs = read('assets/data.js');
const exercises = matchAll(block(dataJs, 'const EXERCISES = ['), /\{ id: '([^']+)'/g);
const routineItems = matchAll(block(dataJs, 'const ROUTINES = ['), /items: \[([^\]]*)\]/g)
  .flatMap((list) => matchAll(list, /'([^']+)'/g));

const pngIds = (dir) => readdirSync(resolve(ROOT, dir))
  .filter((f) => f.endsWith('.png') && !f.startsWith('_'))
  .map((f) => f.replace(/\.png$/, ''));

const images = pngIds('assets/img');
const thumbs = pngIds('assets/img/thumb');

const precached = matchAll(read('sw.js'), /'assets\/img\/([^']+)\.png'/g);
const poses = matchAll(block(read('tools/generate-images.mjs'), 'const POSES = {'), /^\s+'([^']+)':/gm);

const errors = [];
const diff = (label, a, b, aName, bName) => {
  const missing = a.filter((id) => !b.includes(id));
  if (missing.length) errors.push(`${label}: in ${aName}, aber nicht in ${bName}: ${missing.join(', ')}`);
};

diff('Bilder', exercises, images, 'EXERCISES', 'assets/img');
diff('Bilder', images, exercises, 'assets/img', 'EXERCISES');
diff('Thumbs', images, thumbs, 'assets/img', 'assets/img/thumb');
diff('Thumbs', thumbs, images, 'assets/img/thumb', 'assets/img');
diff('Precache', exercises, precached, 'EXERCISES', 'sw.js IMG_ASSETS');
diff('Precache', precached, exercises, 'sw.js IMG_ASSETS', 'EXERCISES');
diff('Prompts', exercises, poses, 'EXERCISES', 'generate-images.mjs POSES');
diff('Prompts', poses, exercises, 'generate-images.mjs POSES', 'EXERCISES');
diff('Routinen', [...new Set(routineItems)], exercises, 'ROUTINES items', 'EXERCISES');

const duplicates = exercises.filter((id, i) => exercises.indexOf(id) !== i);
if (duplicates.length) errors.push(`Doppelte Übungs-IDs: ${[...new Set(duplicates)].join(', ')}`);

if (errors.length) {
  console.error('Konsistenz-Check fehlgeschlagen:\n' + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`Konsistenz-Check ok: ${exercises.length} Übungen, ${images.length} Bilder, alle Quellen deckungsgleich.`);
