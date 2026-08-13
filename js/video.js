/* video.js — user-controlled public-video study transport.
 *
 * The catalog points to publicly embeddable lessons referenced by the Bouzouki
 * Learning Website. It does not download, reproduce, or alter the videos.
 * A/B markers and speed are browser-side study aids; playback still respects the
 * host platform and its availability/embedding settings.
 */
(function () {
  "use strict";

  const LESSONS = [
    { id: "rialas-agalma", teacher: "RIALAS", title: "Lesson 001 · Agalma", videoId: "r6nxiFZUESA", focus: "Repertoire study: isolate a compact phrase, then map its targets before you copy the motion." },
    { id: "tomer-agonia", teacher: "Tomer Avizov", title: "Bouzouki learning · Agonia", videoId: "PvSNEFrvMFA", focus: "Observe pick direction and phrase endings. Use the road map to name the degrees you see." },
    { id: "thanos-episode-1", teacher: "Thanos Corner / Play Bouzouki", title: "Lesson episode 1", videoId: "VJXnvELMZtA", focus: "Slow the hand motion first; only then add the notes back into a short, singable loop." },
    { id: "savvas-lessons", teacher: "Savvas Chrysanthou", title: "Bouzouki lessons", videoId: "Xx1tlYhJEXY", focus: "Watch one technique detail at a time—right hand, left hand, then the phrase’s destination." },
    { id: "ramazouki-afti", teacher: "Ramazouki", title: "Lesson 001 · Afti i nyhta menei", videoId: "rpzyApXslns", focus: "Turn a learned fragment into your own exercise: identify the home, chord boxes, and final arrival note." }
  ];

  let player = null;
  let activeId = LESSONS[0].id;
  let ready = false;
  let timer = null;
  let startAt = 0;
  let endAt = 8;
  let speed = 0.75;
  let loopOn = true;
  let mounted = false;

  const $ = (id) => document.getElementById(id);
  const active = () => LESSONS.find((lesson) => lesson.id === activeId) || LESSONS[0];

  function format(seconds) {
    const value = Math.max(0, Math.round(Number(seconds) || 0));
    return Math.floor(value / 60) + ":" + String(value % 60).padStart(2, "0");
  }

  function loadYoutubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (window.__dromosYoutubeApi) return window.__dromosYoutubeApi;
    window.__dromosYoutubeApi = new Promise((resolve) => {
      const prior = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (typeof prior === "function") prior(); resolve(); };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    });
    return window.__dromosYoutubeApi;
  }

  function createPlayer() {
    const mount = $("videoPlayer");
    if (!mount || !mounted) return;
    ready = false;
    if (player && player.destroy) player.destroy();
    player = new window.YT.Player("videoPlayer", {
      videoId: active().videoId,
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: (event) => {
          ready = true;
          event.target.setPlaybackRate(speed);
          update();
        },
        onStateChange: (event) => {
          if (window.YT && event.data === window.YT.PlayerState.PLAYING) startLoopGuard();
          else if (window.YT && event.data === window.YT.PlayerState.ENDED) stopLoopGuard();
          update();
        }
      }
    });
  }

  function startLoopGuard() {
    stopLoopGuard();
    timer = setInterval(() => {
      if (!ready || !player || !loopOn || !player.getCurrentTime) return;
      if (player.getCurrentTime() >= endAt) { player.seekTo(startAt, true); player.playVideo(); }
      updateTime();
    }, 120);
  }
  function stopLoopGuard() { if (timer) clearInterval(timer); timer = null; }

  function updateTime() {
    const output = $("abTime");
    if (output) output.textContent = format(startAt) + " → " + format(endAt) + " · " + (endAt - startAt).toFixed(1) + "s";
  }

  function update() {
    const root = $("videoStudy");
    if (!root) return;
    root.querySelectorAll("[data-video-lesson]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-video-lesson") === activeId));
    const play = $("btnVideoPlay");
    if (play && ready && player.getPlayerState) {
      play.textContent = player.getPlayerState() === window.YT.PlayerState.PLAYING ? "❚❚ Pause" : "▶ Play loop";
    }
    const a = $("abStart"), b = $("abEnd"), rate = $("videoSpeed"), looping = $("tglVideoLoop");
    if (a) a.value = startAt; if (b) b.value = endAt; if (rate) rate.value = speed; if (looping) looping.checked = loopOn;
    updateTime();
  }

  function render() {
    const root = $("videoStudy");
    if (!root) return;
    mounted = true;
    root.innerHTML = `<div class="solo-title"><span class="panel-label">Video study lab</span><span>watch → loop → map</span></div>
      <p class="video-intro">Public lessons referenced by <a href="https://mpouzouki.weebly.com/bouzouki-lessons.html" target="_blank" rel="noopener noreferrer">The Bouzouki Learning Website</a>. They remain on YouTube; this page gives you an intentional A–B practice loop, not a copied course.</p>
      <div class="video-layout"><div id="videoPlayer" class="video-player" aria-label="Selected public bouzouki lesson"></div>
        <div class="video-controls"><div class="ab-display"><span>A–B loop</span><b id="abTime"></b></div>
          <div class="ab-ranges"><label>A<input id="abStart" type="range" min="0" max="300" step="0.5" value="0" /></label><label>B<input id="abEnd" type="range" min="0.5" max="300" step="0.5" value="8" /></label></div>
          <div class="row"><button id="btnSetA" class="mini">Set A to playhead</button><button id="btnSetB" class="mini">Set B to playhead</button></div>
          <div class="row"><button id="btnVideoPlay" class="tbtn primary">▶ Play loop</button><label class="inline-tgl"><input id="tglVideoLoop" type="checkbox" checked /> repeat</label></div>
          <div class="video-speed"><label for="videoSpeed">Speed</label><select id="videoSpeed"><option value="0.5">0.5×</option><option value="0.75" selected>0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></div>
          <p class="video-study-tip"><b>Study loop:</b> Watch once without the instrument → sing the phrase ending → find its home/target on the neck → play it at this speed → return to the Song Map and explain the chord box.</p></div></div>
      <div class="video-library">${LESSONS.map((lesson) => `<button data-video-lesson="${lesson.id}" class="${lesson.id === activeId ? "active" : ""}"><span>${lesson.teacher}</span><b>${lesson.title}</b><i>${lesson.focus}</i></button>`).join("")}</div>
      <p class="video-disclaimer">Availability, copyright, playback rate, and embedding are controlled by the original host. Add your own legally accessible YouTube lesson by changing the source catalog in this open project; do not upload or extract third-party video.</p>`;
    root.querySelectorAll("[data-video-lesson]").forEach((button) => button.onclick = () => {
      activeId = button.getAttribute("data-video-lesson"); startAt = 0; endAt = 8; render();
    });
    $("abStart").oninput = (event) => { startAt = Math.min(+event.target.value, endAt - 0.5); update(); };
    $("abEnd").oninput = (event) => { endAt = Math.max(+event.target.value, startAt + 0.5); update(); };
    $("btnSetA").onclick = () => { if (ready) { startAt = Math.min(player.getCurrentTime(), endAt - 0.5); update(); } };
    $("btnSetB").onclick = () => { if (ready) { endAt = Math.max(player.getCurrentTime(), startAt + 0.5); update(); } };
    $("btnVideoPlay").onclick = () => {
      if (!ready) return;
      if (player.getPlayerState() === window.YT.PlayerState.PLAYING) player.pauseVideo();
      else { player.seekTo(startAt, true); player.playVideo(); }
    };
    $("tglVideoLoop").onchange = (event) => { loopOn = event.target.checked; if (loopOn) startLoopGuard(); else stopLoopGuard(); };
    $("videoSpeed").onchange = (event) => { speed = +event.target.value; if (ready) player.setPlaybackRate(speed); };
    loadYoutubeApi().then(createPlayer).catch(() => {
      const holder = $("videoPlayer");
      if (holder && mounted) holder.innerHTML = `<a href="https://www.youtube.com/watch?v=${active().videoId}" target="_blank" rel="noopener noreferrer">Open this lesson on YouTube</a>`;
    });
  }

  function destroy() {
    mounted = false; stopLoopGuard();
    if (player && player.pauseVideo) player.pauseVideo();
    if (player && player.destroy) player.destroy();
    player = null; ready = false;
  }
  function selfTest() {
    const ids = new Set(LESSONS.map((lesson) => lesson.id));
    const results = [{ name: "video study catalog uses unique public video IDs", pass: ids.size === LESSONS.length && LESSONS.every((lesson) => /^[\w-]{11}$/.test(lesson.videoId)), detail: String(ids.size) }];
    return { ok: results.every((result) => result.pass), results };
  }
  window.VideoStudy = { LESSONS, render, destroy, selfTest };
})();
