const CACHE = "dromos-trainer-v10";
const APP_SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./css/styles.css",
  "./js/tuning.js", "./js/theory.js", "./js/modes.js", "./js/styles.js", "./js/analysis.js", "./js/studies.js", "./js/musicxml.js", "./js/resources.js", "./js/video.js", "./js/coach.js", "./js/practice.js",
  "./js/triads.js", "./js/fretboard.js", "./js/guitar-voicings.js", "./js/audio.js", "./js/app.js",
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
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
