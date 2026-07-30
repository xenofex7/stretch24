/* Stretch24 Service Worker – Cache-first, damit die App offline läuft */
const CACHE = 'stretch24-v13';

/* Kern-Assets: ohne sie startet die App nicht. */
const CORE_ASSETS = [
  '.',
  'index.html',
  'assets/style.css',
  'assets/icons.js',
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (c) => {
      await c.addAll(CORE_ASSETS);
      // Bilder einzeln cachen: ein einzelner Fehlschlag verhindert die
      // Installation nicht (das Bild kommt dann zur Laufzeit in den Cache).
      await Promise.allSettled(IMG_ASSETS.map((url) => c.add(url)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ||
      fetch(event.request).then((res) => {
        if (res.ok && new URL(event.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
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
