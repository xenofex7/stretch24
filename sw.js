/* Stretch24 Service Worker – Cache-first, damit die App offline läuft */

/* App-Shell: Version bei jeder Änderung an App-Dateien erhöhen. */
const CACHE = 'stretch24-v19';

/* Illustrationen liegen in einem eigenen Cache, der App-Updates überlebt -
 * sonst würde jeder Versions-Bump die komplette Bildstrecke erneut laden.
 * Diese Version erhöht nur tools/generate-images.mjs, wenn Bilder neu
 * geschrieben wurden. */
const IMG_CACHE = 'stretch24-img-v1';

/* Kern-Assets: ohne sie startet die App nicht. */
const CORE_ASSETS = [
  '.',
  'index.html',
  'assets/style.css',
  'assets/icons.js',
  'assets/i18n.js',
  'assets/data.js',
  'assets/app.js',
  'icon.svg',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.webmanifest',
];

/* Übungsbilder: werden best effort vorab gecached, damit die App auch ohne
 * vorheriges Durchscrollen komplett offline funktioniert. Diese Liste wird
 * von tools/generate-images.mjs automatisch gepflegt. */
const IMG_ASSETS = [
  'assets/img/butterfly.png',
  'assets/img/calf.png',
  'assets/img/cat-cow.png',
  'assets/img/chest-opener.png',
  'assets/img/child.png',
  'assets/img/cobra.png',
  'assets/img/down-dog.png',
  'assets/img/fig4.png',
  'assets/img/forward-fold.png',
  'assets/img/full-stretch.png',
  'assets/img/hamstring.png',
  'assets/img/hip-flexor.png',
  'assets/img/lunge.png',
  'assets/img/neck-front.png',
  'assets/img/neck-side.png',
  'assets/img/pigeon.png',
  'assets/img/quad.png',
  'assets/img/seated-twist.png',
  'assets/img/shoulder-cross.png',
  'assets/img/shoulder-roll.png',
  'assets/img/side-bend.png',
  'assets/img/supine-twist.png',
  'assets/img/triceps.png',
  'assets/img/wrist.png',
];

/* Kleine Variante fürs Übungsraster (256 px statt 512 px). */
const THUMB_ASSETS = IMG_ASSETS.map((url) => url.replace('assets/img/', 'assets/img/thumb/'));

const isImage = (url) => url.origin === location.origin && url.pathname.includes('/assets/img/');

/* Nur fehlende Bilder holen: so kostet ein App-Update keinen erneuten
 * Download der kompletten Bildstrecke. */
async function cacheMissing(cache, urls) {
  const missing = [];
  for (const url of urls) {
    if (!(await cache.match(url))) missing.push(url);
  }
  // Einzeln cachen: ein einzelner Fehlschlag verhindert die Installation
  // nicht (das Bild kommt dann zur Laufzeit in den Cache).
  await Promise.allSettled(missing.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(CACHE);
    // cache: 'reload' umgeht den HTTP-Cache des Browsers – sonst landen
    // beim Update alte Dateistände im neuen Cache.
    await shell.addAll(CORE_ASSETS.map((url) => new Request(url, { cache: 'reload' })));
    const images = await caches.open(IMG_CACHE);
    await cacheMissing(images, [...THUMB_ASSETS, ...IMG_ASSETS]);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== IMG_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ||
      fetch(event.request).then((res) => {
        const url = new URL(event.request.url);
        if (res.ok && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(isImage(url) ? IMG_CACHE : CACHE).then((c) => c.put(event.request, copy));
        }
        return res;
      })
    ).catch(() =>
      // Offline und nicht im Cache: Navigationen bekommen die App-Shell,
      // alles andere einen sauberen Netzwerkfehler.
      event.request.mode === 'navigate' ? caches.match('index.html') : Response.error()
    )
  );
});
