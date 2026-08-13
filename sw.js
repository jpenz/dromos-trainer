const CACHE = "dromos-trainer-v14.2";
const APP_SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./css/styles.css?v=14", "./css/fonts.css?v=14",
  "./assets/fonts/fraunces-normal-300-600-latin.woff2", "./assets/fonts/fraunces-normal-300-600-latin-ext.woff2",
  "./assets/fonts/fraunces-italic-300-500-latin.woff2", "./assets/fonts/fraunces-italic-300-500-latin-ext.woff2",
  "./assets/fonts/inter-normal-400-700-latin.woff2", "./assets/fonts/inter-normal-400-700-latin-ext.woff2", "./assets/fonts/inter-normal-400-700-greek.woff2",
  "./assets/fonts/plexmono-normal-400-latin.woff2", "./assets/fonts/plexmono-normal-500-latin.woff2", "./assets/fonts/plexmono-normal-600-latin.woff2",
  "./js/tuning.js?v=14", "./js/profiles.js?v=14", "./js/theory.js?v=14", "./js/harmony-journey.js?v=14", "./js/modes.js?v=14", "./js/ear-drills.js?v=14", "./js/styles.js?v=14", "./js/analysis.js?v=14", "./js/studies.js?v=14", "./js/musicxml.js?v=14", "./js/resources.js?v=14", "./js/video.js?v=14", "./js/coach.js?v=14", "./js/practice.js?v=14",
  "./js/triads.js?v=14", "./js/fretboard.js?v=14", "./js/guitar-voicings.js?v=14", "./js/audio.js?v=14", "./js/app.js?v=14",
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
