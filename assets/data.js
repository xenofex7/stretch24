/* Stretch24 – Übungsdaten & Routinen
 * Alle Illustrationen sind schlichte SVG-Strichfiguren (viewBox 0 0 120 120).
 * Konvention: Kopf = Kreis, Körper = Pfade mit runden Enden.
 */

const FIG = (body) => `
<svg viewBox="0 0 120 120" class="figure" aria-hidden="true">
  <circle cx="62" cy="58" r="50" class="fig-bg"/>
  <circle cx="38" cy="76" r="30" class="fig-bg fig-bg2"/>
  <ellipse cx="60" cy="109" rx="28" ry="5" class="fig-shadow"/>
  <g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
    ${body}
  </g>
</svg>`;

const POSES = {
  neckSide: FIG(`
    <circle cx="70" cy="30" r="11" class="fig-head"/>
    <path d="M60 42 V70 M60 48 L40 62 M60 48 L80 62 M60 70 L48 105 M60 70 L72 105"/>
  `),
  neckFront: FIG(`
    <circle cx="64" cy="34" r="11" class="fig-head"/>
    <path d="M60 44 V72 M60 48 L44 64 M60 48 L78 62 M60 72 L48 106 M60 72 L72 106"/>
  `),
  shoulderRoll: FIG(`
    <circle cx="60" cy="24" r="11" class="fig-head"/>
    <path d="M60 36 V70 M60 42 Q40 48 42 62 M60 42 Q80 48 78 62 M60 70 L48 105 M60 70 L72 105"/>
    <path d="M30 40 a12 12 0 1 1 6 14 M90 40 a12 12 0 1 0 -6 14" class="accent-stroke" stroke-dasharray="4 7"/>
  `),
  shoulderCross: FIG(`
    <circle cx="60" cy="24" r="11" class="fig-head"/>
    <path d="M60 36 V70 M60 44 L86 52 M60 50 Q72 40 84 48 M60 70 L48 105 M60 70 L72 105"/>
  `),
  triceps: FIG(`
    <circle cx="58" cy="30" r="11" class="fig-head"/>
    <path d="M60 42 V74 M60 46 Q64 22 46 20 M60 48 Q80 40 74 26 M60 74 L48 107 M60 74 L72 107"/>
  `),
  chest: FIG(`
    <circle cx="60" cy="24" r="11" class="fig-head"/>
    <path d="M60 36 V70 M60 46 Q42 52 38 68 M60 46 Q78 52 82 68 M60 70 L48 105 M60 70 L72 105"/>
    <path d="M38 68 Q60 78 82 68" class="accent-stroke"/>
  `),
  sideBend: FIG(`
    <circle cx="74" cy="26" r="11" class="fig-head"/>
    <path d="M70 36 Q60 52 58 72 M68 42 Q88 30 96 40 M64 50 L46 60 M58 72 L48 106 M58 72 L70 106"/>
  `),
  catCow: FIG(`
    <circle cx="96" cy="52" r="10" class="fig-head"/>
    <path d="M88 58 Q64 40 36 58 M40 58 V92 M84 58 V92 M36 58 Q30 66 24 64"/>
  `),
  child: FIG(`
    <circle cx="24" cy="72" r="10" class="fig-head"/>
    <path d="M32 76 Q52 62 74 74 Q88 82 88 94 M74 74 L74 94 M32 80 L14 88 M22 82 L14 92"/>
  `),
  seatedTwist: FIG(`
    <circle cx="56" cy="30" r="11" class="fig-head"/>
    <path d="M58 42 V76 M58 50 L34 58 M58 50 L82 44 M58 76 L88 82 M58 76 Q70 90 88 92"/>
  `),
  downDog: FIG(`
    <circle cx="34" cy="66" r="10" class="fig-head"/>
    <path d="M40 72 L62 44 L92 96 M62 44 L36 96 M40 72 L20 96"/>
  `),
  cobra: FIG(`
    <circle cx="88" cy="46" r="10" class="fig-head"/>
    <path d="M84 54 Q70 66 48 80 L16 84 M80 60 L72 84 M84 56 L92 84" transform="translate(0 6)"/>
  `),
  lunge: FIG(`
    <circle cx="56" cy="26" r="11" class="fig-head"/>
    <path d="M58 38 V66 M58 44 Q44 50 42 62 M58 44 Q72 50 74 62 M58 66 L36 78 L34 100 M58 66 Q76 76 92 100"/>
  `),
  pigeon: FIG(`
    <circle cx="42" cy="34" r="11" class="fig-head"/>
    <path d="M44 46 V74 M44 52 L26 66 M44 52 L62 66 M44 74 Q58 70 66 80 M44 74 Q68 84 96 88"/>
  `),
  butterfly: FIG(`
    <circle cx="60" cy="32" r="11" class="fig-head"/>
    <path d="M60 44 V72 M60 50 L42 66 M60 50 L78 66 M60 72 Q38 74 34 90 Q52 96 60 88 M60 72 Q82 74 86 90 Q68 96 60 88"/>
  `),
  hamstring: FIG(`
    <circle cx="44" cy="34" r="11" class="fig-head"/>
    <path d="M48 44 Q58 56 60 68 M50 50 L70 62 M60 68 L52 102 M60 68 Q78 78 92 80 L98 74"/>
  `),
  forwardFold: FIG(`
    <circle cx="42" cy="88" r="10" class="fig-head"/>
    <path d="M64 46 Q56 66 48 80 M64 46 L60 104 M64 46 L72 104 M54 66 L48 100"/>
  `),
  quad: FIG(`
    <circle cx="58" cy="24" r="11" class="fig-head"/>
    <path d="M60 36 V70 M60 42 L42 54 M60 44 Q76 52 78 68 M60 70 L58 106 M60 70 Q78 74 78 88 L70 84"/>
  `),
  calf: FIG(`
    <circle cx="44" cy="26" r="11" class="fig-head"/>
    <path d="M48 38 Q58 52 62 66 M50 42 L28 52 M52 46 L30 58 M62 66 L60 102 M62 66 Q82 84 94 104"/>
    <path d="M20 20 V104" class="accent-stroke"/>
  `),
  fig4: FIG(`
    <circle cx="20" cy="58" r="10" class="fig-head"/>
    <path d="M30 62 L62 66 M62 66 Q80 56 92 62 M62 66 L78 84 M78 84 L64 92 M40 64 L52 80"/>
  `),
  kneeHug: FIG(`
    <circle cx="22" cy="66" r="10" class="fig-head"/>
    <path d="M32 70 L66 72 M66 72 Q76 58 66 50 M66 72 L96 80 M40 70 Q56 52 68 56"/>
  `),
  wrist: FIG(`
    <circle cx="40" cy="26" r="11" class="fig-head"/>
    <path d="M42 38 V74 M42 48 L88 46 M88 46 L94 32 M42 56 Q66 66 84 52 M42 74 L32 106 M42 74 L52 106"/>
    <path d="M94 32 Q100 40 94 44" class="accent-stroke"/>
  `),
  supineTwist: FIG(`
    <circle cx="18" cy="60" r="10" class="fig-head"/>
    <path d="M28 64 L64 66 M40 64 L44 44 M64 66 Q76 78 70 92 M70 92 L88 88 M64 66 L96 62"/>
  `),
  fullStretch: FIG(`
    <circle cx="38" cy="70" r="10" class="fig-head"/>
    <path d="M46 72 L84 72 M48 70 Q30 58 18 60 M50 74 Q34 66 20 68 M84 72 L104 66 M84 74 L104 78"/>
  `),
  hipFlex: FIG(`
    <circle cx="52" cy="24" r="11" class="fig-head"/>
    <path d="M54 36 Q56 52 54 66 M54 42 Q40 48 38 60 M54 42 Q68 46 72 58 M54 66 L34 76 L32 102 M54 66 Q70 80 70 102"/>
  `),
};

/* Übungen mit fertiger Illustration in assets/img/<id>.png.
 * Alle anderen zeigen die SVG-Strichfigur als Fallback –
 * so können wir die Bilder schrittweise ergänzen. */
const IMAGES = new Set([
  'butterfly',
  'calf',
  'cat-cow',
  'chest-opener',
  'child',
  'cobra',
  'down-dog',
  'fig4',
  'forward-fold',
  'full-stretch',
  'hamstring',
  'hip-flexor',
  'lunge',
  'neck-front',
  'neck-side',
  'pigeon',
  'quad',
  'seated-twist',
  'shoulder-cross',
  'shoulder-roll',
  'side-bend',
  'supine-twist',
  'triceps',
  'wrist',
]);

const figureHTML = (ex) => IMAGES.has(ex.id)
  ? `<img class="figure figure-img" src="assets/img/${ex.id}.png" alt="" loading="lazy">`
  : POSES[ex.pose];

/* sides: true → Übung wird links & rechts ausgeführt */
const EXERCISES = [
  { id: 'neck-side',       name: 'Nacken zur Seite',            cat: 'Nacken & Schultern', pose: 'neckSide',    sides: true,
    desc: 'Aufrecht stehen oder sitzen. Ohr sanft Richtung Schulter neigen, die gegenüberliegende Schulter bleibt tief. Für mehr Zug die Hand leicht auf den Kopf legen – nicht ziehen.' },
  { id: 'neck-front',      name: 'Kinn zur Brust',              cat: 'Nacken & Schultern', pose: 'neckFront',   sides: false,
    desc: 'Kinn langsam zur Brust senken, Nacken lang machen. Die Hände können sanft am Hinterkopf ruhen. Ruhig weiteratmen.' },
  { id: 'shoulder-roll',   name: 'Schulterkreisen',             cat: 'Nacken & Schultern', pose: 'shoulderRoll', sides: false,
    desc: 'Schultern gross und langsam nach hinten kreisen: hochziehen, nach hinten, fallen lassen. Löst Verspannungen vom Sitzen.' },
  { id: 'shoulder-cross',  name: 'Arm über die Brust',          cat: 'Nacken & Schultern', pose: 'shoulderCross', sides: true,
    desc: 'Einen Arm gestreckt vor der Brust kreuzen und mit dem anderen Arm sanft heranziehen. Schulter dabei bewusst tief halten.' },
  { id: 'triceps',         name: 'Trizeps über Kopf',           cat: 'Nacken & Schultern', pose: 'triceps',     sides: true,
    desc: 'Einen Arm über den Kopf heben, Ellbogen beugen, Hand zwischen die Schulterblätter. Mit der anderen Hand den Ellbogen sanft nach hinten schieben.' },
  { id: 'chest-opener',    name: 'Brustöffner',                 cat: 'Nacken & Schultern', pose: 'chest',       sides: false,
    desc: 'Hände hinter dem Rücken verschränken, Arme strecken und Brustbein anheben. Öffnet die Vorderseite nach langem Sitzen.' },
  { id: 'wrist',           name: 'Handgelenk-Dehnung',          cat: 'Nacken & Schultern', pose: 'wrist',       sides: true,
    desc: 'Arm nach vorn strecken, Handfläche nach oben. Mit der anderen Hand die Finger sanft nach unten/hinten ziehen. Ideal bei viel Tastatur-Arbeit.' },
  { id: 'side-bend',       name: 'Seitbeuge im Stehen',         cat: 'Rücken & Rumpf',     pose: 'sideBend',    sides: true,
    desc: 'Einen Arm über den Kopf strecken und den Oberkörper zur Gegenseite neigen. Becken bleibt stabil, die Flanke wird lang.' },
  { id: 'cat-cow',         name: 'Katze-Kuh',                   cat: 'Rücken & Rumpf',     pose: 'catCow',      sides: false,
    desc: 'Im Vierfüsslerstand mit der Einatmung ins Hohlkreuz (Blick nach vorn), mit der Ausatmung den Rücken rund machen. Fliessend im Atemrhythmus bewegen.' },
  { id: 'child',           name: 'Kindhaltung',                 cat: 'Rücken & Rumpf',     pose: 'child',       sides: false,
    desc: 'Aus dem Fersensitz den Oberkörper nach vorn ablegen, Arme lang oder neben dem Körper. Stirn Richtung Boden, tief in den Rücken atmen.' },
  { id: 'seated-twist',    name: 'Sitzende Drehung',            cat: 'Rücken & Rumpf',     pose: 'seatedTwist', sides: true,
    desc: 'Aufrecht sitzen, mit der Ausatmung den Oberkörper zur Seite drehen. Die Drehung kommt aus der Brustwirbelsäule, nicht aus dem Nacken.' },
  { id: 'down-dog',        name: 'Herabschauender Hund',        cat: 'Rücken & Rumpf',     pose: 'downDog',     sides: false,
    desc: 'Hände schulterbreit aufsetzen, Hüfte hoch – der Körper bildet ein umgekehrtes V. Knie dürfen gebeugt sein, der Rücken bleibt lang.' },
  { id: 'cobra',           name: 'Kobra',                       cat: 'Rücken & Rumpf',     pose: 'cobra',       sides: false,
    desc: 'In Bauchlage die Hände unter die Schultern, Brustbein sanft anheben. Schultern weg von den Ohren, Becken bleibt am Boden.' },
  { id: 'supine-twist',    name: 'Liegende Drehung',            cat: 'Rücken & Rumpf',     pose: 'supineTwist', sides: true,
    desc: 'In Rückenlage ein Knie über den Körper zur Seite sinken lassen, Arme in T-Position. Beide Schultern bleiben möglichst am Boden.' },
  { id: 'full-stretch',    name: 'Ganzkörper-Strecken',         cat: 'Rücken & Rumpf',     pose: 'fullStretch', sides: false,
    desc: 'In Rückenlage Arme über den Kopf, Zehen wegstrecken und den ganzen Körper lang machen – wie ein Gähnen für den Körper.' },
  { id: 'hip-flexor',      name: 'Hüftbeuger im Ausfallschritt', cat: 'Hüfte & Beine',     pose: 'hipFlex',     sides: true,
    desc: 'Tiefer Ausfallschritt, hinteres Knie am Boden. Becken sanft nach vorn schieben, bis es in der Leiste zieht. Oberkörper aufrecht.' },
  { id: 'lunge',           name: 'Tiefer Ausfallschritt',       cat: 'Hüfte & Beine',      pose: 'lunge',       sides: true,
    desc: 'Grosser Schritt nach vorn, vorderes Knie über dem Sprunggelenk. Hüfte tief sinken lassen, Hände auf dem Oberschenkel oder am Boden.' },
  { id: 'pigeon',          name: 'Taube',                       cat: 'Hüfte & Beine',      pose: 'pigeon',      sides: true,
    desc: 'Ein Unterschenkel quer vor dem Körper, das andere Bein lang nach hinten. Oberkörper aufrecht oder nach vorn ablegen. Intensiver Hüftöffner.' },
  { id: 'butterfly',       name: 'Schmetterling',               cat: 'Hüfte & Beine',      pose: 'butterfly',   sides: false,
    desc: 'Im Sitzen die Fusssohlen aneinanderlegen, Fersen Richtung Körper. Knie sanft Richtung Boden sinken lassen, Rücken lang.' },
  { id: 'fig4',            name: 'Figur 4 im Liegen',           cat: 'Hüfte & Beine',      pose: 'fig4',        sides: true,
    desc: 'In Rückenlage einen Knöchel aufs andere Knie legen und das untere Bein zur Brust ziehen. Dehnt Gesäss und Aussenseite der Hüfte.' },
  { id: 'hamstring',       name: 'Beinrückseite im Stehen',     cat: 'Hüfte & Beine',      pose: 'hamstring',   sides: true,
    desc: 'Eine Ferse nach vorn aufsetzen, Zehen hoch. Mit geradem Rücken aus der Hüfte nach vorn neigen, bis es hinten im Bein zieht.' },
  { id: 'forward-fold',    name: 'Stehende Vorbeuge',           cat: 'Hüfte & Beine',      pose: 'forwardFold', sides: false,
    desc: 'Aus dem Stand langsam nach vorn abrollen, Knie leicht gebeugt. Kopf und Arme schwer hängen lassen, mit jeder Ausatmung tiefer sinken.' },
  { id: 'quad',            name: 'Oberschenkel-Vorderseite',    cat: 'Hüfte & Beine',      pose: 'quad',        sides: true,
    desc: 'Im Stand eine Ferse zum Gesäss ziehen, Knie zeigen zueinander. Becken leicht aufrichten. Bei Bedarf an einer Wand festhalten.' },
  { id: 'calf',            name: 'Wadendehnung an der Wand',    cat: 'Hüfte & Beine',      pose: 'calf',        sides: true,
    desc: 'Hände an die Wand, ein Bein lang nach hinten, Ferse am Boden. Hüfte zur Wand schieben, bis es in der Wade zieht.' },
];

/* Routinen: items = Übungs-IDs, secs = Sekunden pro Seite/Übung, icon = Lucide-Icon aus icons.js */
const ROUTINES = [
  { id: 'morning', icon: 'sunrise', name: 'Guten Morgen', secs: 25,
    blurb: 'Sanft wach werden – Ganzkörper in 5 Minuten.',
    items: ['full-stretch', 'cat-cow', 'down-dog', 'forward-fold', 'side-bend', 'neck-side', 'shoulder-roll'] },
  { id: 'desk', icon: 'laptop', name: 'Schreibtisch-Pause', secs: 25,
    blurb: 'Nacken, Schultern & Handgelenke – im Stehen, ohne Matte.',
    items: ['shoulder-roll', 'neck-side', 'neck-front', 'shoulder-cross', 'triceps', 'wrist', 'chest-opener', 'side-bend'] },
  { id: 'fullbody15', icon: 'personStanding', name: 'Full Body 15', secs: 35,
    blurb: 'Der Klassiker: einmal alles, in einer Viertelstunde.',
    items: ['neck-side', 'shoulder-cross', 'chest-opener', 'cat-cow', 'down-dog', 'lunge', 'hamstring', 'quad', 'butterfly', 'seated-twist', 'child'] },
  { id: 'back', icon: 'leaf', name: 'Rücken-Reset', secs: 35,
    blurb: 'Länge und Entspannung für die Wirbelsäule.',
    items: ['cat-cow', 'child', 'cobra', 'down-dog', 'seated-twist', 'supine-twist', 'fig4', 'full-stretch'] },
  { id: 'hips', icon: 'expand', name: 'Hüft-Öffner', secs: 40,
    blurb: 'Für alle, die viel sitzen: Hüfte, Gesäss & Leiste.',
    items: ['hip-flexor', 'lunge', 'pigeon', 'butterfly', 'fig4', 'supine-twist'] },
  { id: 'runner', icon: 'dumbbell', name: 'Nach dem Sport', secs: 30,
    blurb: 'Beine & Waden nach Laufen, Rad oder Training.',
    items: ['quad', 'hamstring', 'calf', 'hip-flexor', 'fig4', 'forward-fold', 'child'] },
];
