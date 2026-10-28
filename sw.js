// Naikkan angka versi ini setiap kali Anda merilis pembaruan (v3 -> v4 -> ...)
const CACHE = "martabak-pos-v3";
const ASSETS = ["./", "./index.html", "./install.html", "./manifest.json",
  "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
    if (new URL(e.request.url).pathname.endsWith("/version.json")) {
    e.respondWith(fetch(e.request.url, { cache: "no-store" }));
    return;
  }
  const url = new URL(e.request.url);
  const sama = url.origin === self.location.origin;

  // Pengecekan versi: selalu ambil dari server, jangan disimpan
  if (sama && url.pathname.endsWith("/version.json")) {
    e.respondWith(fetch(url.href, { cache: "no-store" }));
    return;
  }

  // Utamakan jaringan (file terbaru), cadangan dari cache saat offline
  const ambil = sama ? fetch(url.href, { cache: "no-store" }) : fetch(e.request);
  e.respondWith(
    ambil
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
