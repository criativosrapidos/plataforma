// Service worker do app: deixa o app instalável e mostra uma tela amigável quando o celular está sem internet.
// Não guarda páginas em cache, então toda atualização do site aparece na hora.
const CACHE = "cr-app-v1";
const OFFLINE = "/offline"; // sem .html: a Vercel e a Netlify servem offline.html nesse endereço sem redirecionar

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, "/assets/icons/icon-192.png"])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE, { ignoreSearch: true })));
});
