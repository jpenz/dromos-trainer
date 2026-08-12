const CACHE = "dromos-trainer-v12";
const APP_SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./css/styles.css?v=12",
  "./js/tuning.js?v=12", "./js/theory.js?v=12", "./js/modes.js?v=12", "./js/ear-drills.js?v=12", "./js/styles.js?v=12", "./js/analysis.js?v=12", "./js/studies.js?v=12", "./js/musicxml.js?v=12", "./js/resources.js?v=12", "./js/video.js?v=12", "./js/coach.js?v=12", "./js/practice.js?v=12",
  "./js/triads.js?v=12", "./js/fretboard.js?v=12", "./js/guitar-voicings.js?v=12", "./js/audio.js?v=12", "./js/app.js?v=12",
  "./assets/dromos-mark.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  // Online sessions must see the current curriculum and interface. The cache
  // is an offline fallback, not a reason to keep serving an old deployment.
  event.respondWith(fetch(event.request).then((response) => {
    if (response && response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) =>
    cached || (event.request.mode === "navigate" ? caches.match("./index.html") : Response.error())
  )));
});
