#!/usr/bin/env node
/* Stretch24 – Illustrations-Generator (einmaliges Werkzeug, NICHT Teil der Webapp)
 *
 * Generiert die Übungs-Illustrationen über die OpenAI-Images-API (gpt-image-1)
 * und legt sie als assets/img/<id>.png ab. Danach wird die IMAGES-Liste in
 * assets/data.js und die Cache-Version in sw.js automatisch aktualisiert.
 *
 * Aufruf:  OPENAI_API_KEY=... node tools/generate-images.mjs [Optionen]
 *   --only=neck-side,down-dog   nur diese Übungs-IDs
 *   --force                     vorhandene Bilder überschreiben
 *   --quality=high              low | medium | high (Default: high)
 *
 * Konsistenz-Trick: Liegt assets/img/_reference.png (ein gelungenes Bild als
 * Stil-Referenz), wird der Edits-Endpoint genutzt, damit Figur und Stil über
 * alle Bilder gleich bleiben.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMG_DIR = resolve(ROOT, 'assets/img');
const KEY = process.env.OPENAI_API_KEY;

const BASE_PROMPT = (pose) =>
  `Minimalist flat vector illustration of a young woman with teal hair in a ` +
  `small bun, wearing a dark teal t-shirt and teal shorts, barefoot, ${pose}. ` +
  `The stretching pose must be clearly recognizable and anatomically correct. ` +
  `Full body visible including feet, character centered, same size and ` +
  `framing in every image. Simple rounded shapes, no facial features, no ` +
  `outlines. Flat matte solid colors only: dark teal shirt, teal shorts, ` +
  `warm beige skin. The entire background is one single uniform flat pale ` +
  `mint green color (#E9F7F1) with absolutely no gradients, no glow, no ` +
  `lighting effects, no shadows, no floor line, no props, no text. ` +
  `Square 1:1 format.`;

/* Pose pro Übungs-ID. Bei Links/Rechts-Übungen genügt eine Richtung –
 * die App spiegelt die zweite Seite per CSS. */
const POSES = {
  'neck-side':      'standing upright with her head tilted far to one side so the ear moves toward the shoulder, neck visibly stretched, arms relaxed at her sides',
  'neck-front':     'standing upright, chin tucked to chest, hands resting gently on the back of her head',
  'shoulder-roll':  'standing upright, shoulders raised in a shrug, arms relaxed',
  'shoulder-cross': 'standing, one straight arm crossed over her chest, the other arm hugging it closer',
  'triceps':        'standing, one arm bent overhead with hand between shoulder blades, other hand pressing the raised elbow',
  'chest-opener':   'standing, hands clasped behind her back, arms straight, chest lifted open',
  'wrist':          'standing, one arm extended straight forward with palm up, other hand gently pulling the fingers down',
  'side-bend':      'standing, one arm reaching overhead, bending her torso sideways in a side stretch',
  'cat-cow':        'on all fours with her back arched upward like a cat',
  'child':          "kneeling in child's pose, forehead near the floor, arms stretched forward",
  'seated-twist':   'sitting cross-legged, twisting her upper body to one side, one hand on her knee',
  'down-dog':       'in downward dog yoga pose, body forming an inverted V, hands and feet on the ground',
  'cobra':          'lying on her stomach in cobra pose, chest lifted, arms propping her up',
  'supine-twist':   'lying on her back, one bent knee dropped across her body to the side, arms out in a T',
  'full-stretch':   'lying on her back, arms stretched overhead, whole body long, toes pointed',
  'hip-flexor':     'in a low lunge with back knee on the ground, hips pressed forward, torso upright',
  'lunge':          'in a deep forward lunge, hands resting on her front thigh',
  'pigeon':         'in pigeon pose, front shin folded on the ground, back leg extended straight behind',
  'butterfly':      'sitting in butterfly pose, soles of her feet together, hands holding her feet',
  'fig4':           'lying on her back, one ankle crossed over the opposite knee, pulling that leg toward her chest (figure-four stretch)',
  'hamstring':      'standing with one heel planted forward, toes up, hinging at the hips with a straight back',
  'forward-fold':   'in a standing forward fold, upper body hanging down relaxed, knees slightly bent',
  'quad':           'standing on one leg, pulling the other heel toward her glutes behind her',
  'calf':           'leaning forward with both hands against a plain vertical wall, one leg stretched back with heel on the ground',
};

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? 'true'];
}));
const only = args.only ? args.only.split(',').map((s) => s.trim()).filter(Boolean) : null;
const force = args.force === 'true';
const quality = ['low', 'medium', 'high'].includes(args.quality) ? args.quality : 'high';

if (!KEY) {
  console.error('Fehler: OPENAI_API_KEY ist nicht gesetzt.');
  process.exit(1);
}

const REFERENCE = resolve(IMG_DIR, '_reference.png');
const hasReference = existsSync(REFERENCE);

async function generate(id, pose) {
  const prompt = BASE_PROMPT(pose);
  let res;
  if (hasReference) {
    // Edits-Endpoint: Referenzbild mitgeben, damit Figur & Stil konsistent bleiben
    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('prompt', `Same character, outfit and art style as the reference image, now ${pose}. ${BASE_PROMPT(pose)}`);
    form.append('size', '1024x1024');
    form.append('quality', quality);
    form.append('image[]', new Blob([readFileSync(REFERENCE)], { type: 'image/png' }), '_reference.png');
    res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}` },
      body: form,
    });
  } else {
    res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
        quality,
        output_format: 'png',
      }),
    });
  }
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('Antwort enthält kein Bild');
  writeFileSync(resolve(IMG_DIR, `${id}.png`), Buffer.from(b64, 'base64'));
}

function updateAppFiles() {
  const ids = readdirSync(IMG_DIR)
    .filter((f) => f.endsWith('.png') && !f.startsWith('_'))
    .map((f) => f.replace(/\.png$/, ''))
    .filter((id) => POSES[id])
    .sort();

  const dataPath = resolve(ROOT, 'assets/data.js');
  const data = readFileSync(dataPath, 'utf8');
  const listing = ids.map((id) => `  '${id}',`).join('\n');
  const updated = data.replace(
    /const IMAGES = new Set\(\[[\s\S]*?\]\);/,
    `const IMAGES = new Set([\n${listing}\n]);`
  );
  if (updated !== data) {
    writeFileSync(dataPath, updated);
    const swPath = resolve(ROOT, 'sw.js');
    const sw = readFileSync(swPath, 'utf8');
    writeFileSync(swPath, sw.replace(/stretch24-v(\d+)/, (_, n) => `stretch24-v${Number(n) + 1}`));
    console.log(`IMAGES-Liste aktualisiert (${ids.length} Bilder), Cache-Version erhöht.`);
  }
}

const todo = Object.entries(POSES).filter(([id]) => {
  if (only && !only.includes(id)) return false;
  if (!force && existsSync(resolve(IMG_DIR, `${id}.png`))) return false;
  return true;
});

console.log(`Generiere ${todo.length} Bild(er), Qualität: ${quality}${hasReference ? ', mit Stil-Referenz' : ''} …`);
let ok = 0, failed = [];
for (const [id, pose] of todo) {
  try {
    process.stdout.write(`  ${id} … `);
    await generate(id, pose);
    ok += 1;
    console.log('✓');
  } catch (err) {
    failed.push(id);
    console.log(`FEHLER: ${err.message}`);
  }
}

updateAppFiles();
console.log(`Fertig: ${ok} erzeugt${failed.length ? `, fehlgeschlagen: ${failed.join(', ')}` : ''}.`);
if (ok === 0 && todo.length > 0) process.exit(1);
