/* Stretch24 – Übungsdaten & Routinen
 * Jede Übung hat eine Illustration in assets/img/<id>.png (512 px,
 * flacher Mint-Hintergrund, KI-generiert via tools/generate-images.mjs).
 * Bei Links/Rechts-Übungen wird nur eine Richtung generiert – die App
 * spiegelt die zweite Seite per CSS.
 *
 * Hier stehen bewusst keine Texte: Namen, Beschreibungen und Kategorien
 * liegen pro Sprache in assets/i18n.js, verknüpft über die id.
 */

/* Illustration einer Übung. eager: Player & Dialog laden sofort mit hoher
 * Priorität und in der 512er-Fassung, das Übungsraster lazy und als
 * 256er-Thumb (dort ist das Bild nur 82 px gross). */
const figureHTML = (ex, { eager = false } = {}) => {
  const src = eager ? `assets/img/${ex.id}.png` : `assets/img/thumb/${ex.id}.png`;
  const size = eager ? 512 : 256;
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<img class="figure figure-img" src="${src}" alt="" width="${size}" height="${size}" decoding="async" ${loading}>`;
};

/* cat: Kategorie-Schlüssel (i18n cats), sides: true → links & rechts */
const EXERCISES = [
  { id: 'neck-side',       cat: 'neck', sides: true },
  { id: 'neck-front',      cat: 'neck', sides: false },
  { id: 'shoulder-roll',   cat: 'neck', sides: false },
  { id: 'shoulder-cross',  cat: 'neck', sides: true },
  { id: 'triceps',         cat: 'neck', sides: true },
  { id: 'chest-opener',    cat: 'neck', sides: false },
  { id: 'wrist',           cat: 'neck', sides: true },
  { id: 'side-bend',       cat: 'core', sides: true },
  { id: 'cat-cow',         cat: 'core', sides: false },
  { id: 'child',           cat: 'core', sides: false },
  { id: 'seated-twist',    cat: 'core', sides: true },
  { id: 'down-dog',        cat: 'core', sides: false },
  { id: 'cobra',           cat: 'core', sides: false },
  { id: 'supine-twist',    cat: 'core', sides: true },
  { id: 'full-stretch',    cat: 'core', sides: false },
  { id: 'hip-flexor',      cat: 'legs', sides: true },
  { id: 'lunge',           cat: 'legs', sides: true },
  { id: 'pigeon',          cat: 'legs', sides: true },
  { id: 'butterfly',       cat: 'legs', sides: false },
  { id: 'fig4',            cat: 'legs', sides: true },
  { id: 'hamstring',       cat: 'legs', sides: true },
  { id: 'forward-fold',    cat: 'legs', sides: false },
  { id: 'quad',            cat: 'legs', sides: true },
  { id: 'calf',            cat: 'legs', sides: true },
];

/* Routinen: items = Übungs-IDs, secs = Sekunden pro Seite/Übung,
 * icon = Lucide-Icon aus icons.js. Name und Kurztext kommen aus i18n.js. */
const ROUTINES = [
  { id: 'morning', icon: 'sunrise', secs: 30, shuffle: true,
    items: ['full-stretch', 'cat-cow', 'down-dog', 'forward-fold', 'side-bend', 'neck-side', 'shoulder-roll'] },
  { id: 'desk', icon: 'laptop', secs: 30, shuffle: true,
    items: ['shoulder-roll', 'neck-side', 'neck-front', 'shoulder-cross', 'triceps', 'wrist', 'chest-opener', 'side-bend'] },
  { id: 'fullbody15', icon: 'personStanding', secs: 30, shuffle: true,
    items: ['shoulder-roll', 'neck-side', 'shoulder-cross', 'chest-opener', 'side-bend', 'forward-fold', 'hamstring', 'quad', 'calf', 'lunge', 'cat-cow', 'down-dog', 'cobra', 'butterfly', 'seated-twist', 'supine-twist', 'child'] },
  { id: 'back', icon: 'leaf', secs: 30, shuffle: true,
    items: ['cat-cow', 'child', 'cobra', 'down-dog', 'seated-twist', 'supine-twist', 'fig4', 'full-stretch'] },
  { id: 'hips', icon: 'expand', secs: 30, shuffle: true,
    items: ['hip-flexor', 'lunge', 'pigeon', 'butterfly', 'fig4', 'supine-twist'] },
  { id: 'runner', icon: 'dumbbell', secs: 30, shuffle: true,
    items: ['quad', 'hamstring', 'calf', 'hip-flexor', 'fig4', 'forward-fold', 'child'] },
  { id: 'evening', icon: 'moon', secs: 30, shuffle: true,
    items: ['forward-fold', 'child', 'cat-cow', 'supine-twist', 'fig4', 'butterfly', 'full-stretch'] },
  /* random: statt fester items werden beim Start so viele zufällige Übungen gezogen */
  { id: 'surprise', icon: 'shuffle', secs: 30, random: 5,
    items: [] },
];
