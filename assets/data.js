/* Stretch24 – Übungsdaten & Routinen
 * Jede Übung hat eine Illustration in assets/img/<id>.png (512 px,
 * flacher Mint-Hintergrund, KI-generiert via tools/generate-images.mjs).
 * Bei Links/Rechts-Übungen wird nur eine Richtung generiert – die App
 * spiegelt die zweite Seite per CSS.
 */

/* Illustration einer Übung. eager: Player & Dialog laden sofort mit hoher
 * Priorität, das Übungsraster lazy. */
const figureHTML = (ex, { eager = false } = {}) =>
  `<img class="figure figure-img" src="assets/img/${ex.id}.png" alt="" width="512" height="512" decoding="async" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>`;

/* sides: true → Übung wird links & rechts ausgeführt */
const EXERCISES = [
  { id: 'neck-side',       name: 'Nacken zur Seite',             cat: 'Nacken & Schultern', sides: true,
    desc: 'Aufrecht stehen oder sitzen. Ohr sanft Richtung Schulter neigen, die gegenüberliegende Schulter bleibt tief. Für mehr Zug die Hand leicht auf den Kopf legen – nicht ziehen.' },
  { id: 'neck-front',      name: 'Kinn zur Brust',               cat: 'Nacken & Schultern', sides: false,
    desc: 'Kinn langsam zur Brust senken, Nacken lang machen. Die Hände können sanft am Hinterkopf ruhen. Ruhig weiteratmen.' },
  { id: 'shoulder-roll',   name: 'Schulterkreisen',              cat: 'Nacken & Schultern', sides: false,
    desc: 'Schultern gross und langsam nach hinten kreisen: hochziehen, nach hinten, fallen lassen. Löst Verspannungen vom Sitzen.' },
  { id: 'shoulder-cross',  name: 'Arm über die Brust',           cat: 'Nacken & Schultern', sides: true,
    desc: 'Einen Arm gestreckt vor der Brust kreuzen und mit dem anderen Arm sanft heranziehen. Schulter dabei bewusst tief halten.' },
  { id: 'triceps',         name: 'Trizeps über Kopf',            cat: 'Nacken & Schultern', sides: true,
    desc: 'Einen Arm über den Kopf heben, Ellbogen beugen, Hand zwischen die Schulterblätter. Mit der anderen Hand den Ellbogen sanft nach hinten schieben.' },
  { id: 'chest-opener',    name: 'Brustöffner',                  cat: 'Nacken & Schultern', sides: false,
    desc: 'Hände hinter dem Rücken verschränken, Arme strecken und Brustbein anheben. Öffnet die Vorderseite nach langem Sitzen.' },
  { id: 'wrist',           name: 'Handgelenk-Dehnung',           cat: 'Nacken & Schultern', sides: true,
    desc: 'Arm nach vorn strecken, Handfläche nach oben. Mit der anderen Hand die Finger sanft nach unten/hinten ziehen. Ideal bei viel Tastatur-Arbeit.' },
  { id: 'side-bend',       name: 'Seitbeuge im Stehen',          cat: 'Rücken & Rumpf',     sides: true,
    desc: 'Einen Arm über den Kopf strecken und den Oberkörper zur Gegenseite neigen. Becken bleibt stabil, die Flanke wird lang.' },
  { id: 'cat-cow',         name: 'Katze-Kuh',                    cat: 'Rücken & Rumpf',     sides: false,
    desc: 'Im Vierfüsslerstand mit der Einatmung ins Hohlkreuz (Blick nach vorn), mit der Ausatmung den Rücken rund machen. Fliessend im Atemrhythmus bewegen.' },
  { id: 'child',           name: 'Kindhaltung',                  cat: 'Rücken & Rumpf',     sides: false,
    desc: 'Aus dem Fersensitz den Oberkörper nach vorn ablegen, Arme lang oder neben dem Körper. Stirn Richtung Boden, tief in den Rücken atmen.' },
  { id: 'seated-twist',    name: 'Sitzende Drehung',             cat: 'Rücken & Rumpf',     sides: true,
    desc: 'Aufrecht sitzen, mit der Ausatmung den Oberkörper zur Seite drehen. Die Drehung kommt aus der Brustwirbelsäule, nicht aus dem Nacken.' },
  { id: 'down-dog',        name: 'Herabschauender Hund',         cat: 'Rücken & Rumpf',     sides: false,
    desc: 'Hände schulterbreit aufsetzen, Hüfte hoch – der Körper bildet ein umgekehrtes V. Knie dürfen gebeugt sein, der Rücken bleibt lang.' },
  { id: 'cobra',           name: 'Kobra',                        cat: 'Rücken & Rumpf',     sides: false,
    desc: 'In Bauchlage die Hände unter die Schultern, Brustbein sanft anheben. Schultern weg von den Ohren, Becken bleibt am Boden.' },
  { id: 'supine-twist',    name: 'Liegende Drehung',             cat: 'Rücken & Rumpf',     sides: true,
    desc: 'In Rückenlage ein Knie über den Körper zur Seite sinken lassen, Arme in T-Position. Beide Schultern bleiben möglichst am Boden.' },
  { id: 'full-stretch',    name: 'Ganzkörper-Strecken',          cat: 'Rücken & Rumpf',     sides: false,
    desc: 'In Rückenlage Arme über den Kopf, Zehen wegstrecken und den ganzen Körper lang machen – wie ein Gähnen für den Körper.' },
  { id: 'hip-flexor',      name: 'Hüftbeuger im Ausfallschritt', cat: 'Hüfte & Beine',      sides: true,
    desc: 'Tiefer Ausfallschritt, hinteres Knie am Boden. Becken sanft nach vorn schieben, bis es in der Leiste zieht. Oberkörper aufrecht.' },
  { id: 'lunge',           name: 'Tiefer Ausfallschritt',        cat: 'Hüfte & Beine',      sides: true,
    desc: 'Grosser Schritt nach vorn, vorderes Knie über dem Sprunggelenk. Hüfte tief sinken lassen, Hände auf dem Oberschenkel oder am Boden.' },
  { id: 'pigeon',          name: 'Taube',                        cat: 'Hüfte & Beine',      sides: true,
    desc: 'Ein Unterschenkel quer vor dem Körper, das andere Bein lang nach hinten. Oberkörper aufrecht oder nach vorn ablegen. Intensiver Hüftöffner.' },
  { id: 'butterfly',       name: 'Schmetterling',                cat: 'Hüfte & Beine',      sides: false,
    desc: 'Im Sitzen die Fusssohlen aneinanderlegen, Fersen Richtung Körper. Knie sanft Richtung Boden sinken lassen, Rücken lang.' },
  { id: 'fig4',            name: 'Figur 4 im Liegen',            cat: 'Hüfte & Beine',      sides: true,
    desc: 'In Rückenlage einen Knöchel aufs andere Knie legen und das untere Bein zur Brust ziehen. Dehnt Gesäss und Aussenseite der Hüfte.' },
  { id: 'hamstring',       name: 'Beinrückseite im Stehen',      cat: 'Hüfte & Beine',      sides: true,
    desc: 'Eine Ferse nach vorn aufsetzen, Zehen hoch. Mit geradem Rücken aus der Hüfte nach vorn neigen, bis es hinten im Bein zieht.' },
  { id: 'forward-fold',    name: 'Stehende Vorbeuge',            cat: 'Hüfte & Beine',      sides: false,
    desc: 'Aus dem Stand langsam nach vorn abrollen, Knie leicht gebeugt. Kopf und Arme schwer hängen lassen, mit jeder Ausatmung tiefer sinken.' },
  { id: 'quad',            name: 'Oberschenkel-Vorderseite',     cat: 'Hüfte & Beine',      sides: true,
    desc: 'Im Stand eine Ferse zum Gesäss ziehen, Knie zeigen zueinander. Becken leicht aufrichten. Bei Bedarf an einer Wand festhalten.' },
  { id: 'calf',            name: 'Wadendehnung an der Wand',     cat: 'Hüfte & Beine',      sides: true,
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
    items: ['shoulder-roll', 'neck-side', 'shoulder-cross', 'chest-opener', 'side-bend', 'forward-fold', 'hamstring', 'quad', 'calf', 'lunge', 'cat-cow', 'down-dog', 'cobra', 'butterfly', 'seated-twist', 'supine-twist', 'child'] },
  { id: 'back', icon: 'leaf', name: 'Rücken-Reset', secs: 35,
    blurb: 'Länge und Entspannung für die Wirbelsäule.',
    items: ['cat-cow', 'child', 'cobra', 'down-dog', 'seated-twist', 'supine-twist', 'fig4', 'full-stretch'] },
  { id: 'hips', icon: 'expand', name: 'Hüft-Öffner', secs: 40,
    blurb: 'Für alle, die viel sitzen: Hüfte, Gesäss & Leiste.',
    items: ['hip-flexor', 'lunge', 'pigeon', 'butterfly', 'fig4', 'supine-twist'] },
  { id: 'runner', icon: 'dumbbell', name: 'Nach dem Sport', secs: 30,
    blurb: 'Beine & Waden nach Laufen, Rad oder Training.',
    items: ['quad', 'hamstring', 'calf', 'hip-flexor', 'fig4', 'forward-fold', 'child'] },
  { id: 'evening', icon: 'moon', name: 'Feierabend', secs: 40,
    blurb: 'Runterfahren nach dem Tag, ruhig Richtung Schlaf.',
    items: ['forward-fold', 'child', 'cat-cow', 'supine-twist', 'fig4', 'butterfly', 'full-stretch'] },
  /* random: statt fester items werden beim Start so viele zufällige Übungen gezogen */
  { id: 'surprise', icon: 'shuffle', name: 'Zufallsmix', secs: 30, random: 5,
    blurb: 'Kurz und knackig: fünf zufällige Übungen, jedes Mal anders.',
    items: [] },
];
