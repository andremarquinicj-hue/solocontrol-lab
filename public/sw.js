const CACHE = "solocontrol-lab-v1";
const SHELL = ["/", "/login", "/dashboard", "/manifest.webmanifest", "/logo-solocontrol.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then((res) => {
    const clone = res.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {});
    return res;
  }).catch(() => caches.match(event.request)));
});
