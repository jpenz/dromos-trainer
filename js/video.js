/* video.js — user-controlled public-video study transport.
 *
 * The catalog points to publicly embeddable lessons referenced by the Bouzouki
 * Learning Website. It does not download, reproduce, or alter the videos.
 * A/B markers and speed are browser-side study aids; playback still respects the
 * host platform and its availability/embedding settings.
 *
 * Order of the page (docs/REDESIGN_BLUEPRINT.md §2.12): the lesson library is
 * the answer object and comes first — step 1 of the guide is "choose one public
 * lesson" — then the player with Set A / Set B / Play as one cluster.
 *
 * Honesty rules this file keeps:
 *  - nothing that needs the embedded player is enabled before the player says it
 *    is ready, and the API load has both an error and a timeout path, so an
 *    offline visit falls back to a plain "open on YouTube" link instead of an
 *    empty box;
 *  - the loop starts OFF, so a fresh lesson is not trapped in its first seconds;
 *    setting A or B arms it, and an explicit choice by the player always wins;
 *  - the A/B range ends at the clip's real duration once the player reports it,
 *    never at a hardcoded five minutes.
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

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];
  const MIN_WINDOW = 0.5;      // shortest A–B window worth looping, in seconds
  const OPENING_WINDOW = 8;    // opening window; the loop itself stays off
  const RANGE_FALLBACK = 300;  // slider ceiling only while the duration is unknown
  const API_TIMEOUT = 8000;    // offline or blocked: fail instead of hanging forever

  // One definition of "a lesson you just opened": no duration known yet, an
  // opening window, and the loop OFF so playback is never trapped in the first
  // seconds of a video nobody has marked up yet.
  function openingState() {
    return { startAt: 0, endAt: OPENING_WINDOW, duration: 0, loopOn: false, loopChosen: false };
  }

  const opening = openingState();
  let player = null;
  let activeId = LESSONS[0].id;
  let ready = false;
  let timer = null;
  let duration = opening.duration;
  let startAt = opening.startAt;
  let endAt = opening.endAt;
  let speed = 0.75;
  let loopOn = opening.loopOn;
  let loopChosen = opening.loopChosen;   // the player set repeat themselves: never override it
  let mounted = false;
  let unavailable = false;               // the embed failed: say so instead of "loading" forever

  const $ = (id) => document.getElementById(id);
  const active = () => LESSONS.find((lesson) => lesson.id === activeId) || LESSONS[0];

  function format(seconds) {
    const value = Math.max(0, Math.round(Number(seconds) || 0));
    return Math.floor(value / 60) + ":" + String(value % 60).padStart(2, "0");
  }

  // Pure. Keeps A before B and both inside the clip, whichever control wrote them.
  function clampWindow(start, end, total) {
    const limit = Number(total) > MIN_WINDOW ? Number(total) : Infinity;
    let a = Number(start);
    if (!isFinite(a) || a < 0) a = 0;
    let b = Number(end);
    if (!isFinite(b)) b = a + MIN_WINDOW;
    if (limit !== Infinity) {
      b = Math.min(b, limit);
      a = Math.min(a, limit - MIN_WINDOW);
    }
    a = Math.max(0, a);
    b = Math.max(b, a + MIN_WINDOW);
    if (limit !== Infinity) b = Math.min(b, limit);
    return { start: a, end: b };
  }

  function setWindow(a, b) {
    const clamped = clampWindow(a, b, duration);
    startAt = clamped.start;
    endAt = clamped.end;
    update();
  }

  // Setting a marker is the moment the loop becomes meaningful — arm it then,
  // unless the player has already made repeat their own decision.
  function markWindowSet() {
    if (loopChosen || loopOn) return;
    loopOn = true;
    if (isPlaying()) startLoopGuard();
    update();
  }

  function isPlaying() {
    return Boolean(ready && player && player.getPlayerState && window.YT &&
      player.getPlayerState() === window.YT.PlayerState.PLAYING);
  }

  function loadYoutubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (window.__dromosYoutubeApi) return window.__dromosYoutubeApi;
    window.__dromosYoutubeApi = new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fail) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        fail ? reject(fail) : resolve();
      };
      const prior = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (typeof prior === "function") prior(); finish(); };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      // Offline, blocked, or simply slow: all three have to reach the fallback,
      // otherwise the player box stays empty forever.
      script.onerror = () => finish(new Error("The YouTube player could not be loaded."));
      const timeout = window.setTimeout(
        () => finish(new Error("The YouTube player did not answer.")), API_TIMEOUT);
      document.head.appendChild(script);
    });
    // A failed load must not be cached as the permanent answer: let the next
    // visit (online again) try once more.
    window.__dromosYoutubeApi.catch(() => { window.__dromosYoutubeApi = null; });
    return window.__dromosYoutubeApi;
  }

  function showFallback(note) {
    const holder = $("videoStudyPlayer");
    if (!holder || !mounted) return;
    ready = false;
    unavailable = true;
    stopLoopGuard();
    if (player && player.destroy) player.destroy();
    player = null;
    holder.innerHTML = `<div class="video-offline"><a href="https://www.youtube.com/watch?v=${active().videoId}" target="_blank" rel="noopener noreferrer">Open this lesson on YouTube ↗</a><small>${note}</small></div>`;
    update();
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
          unavailable = false;
          duration = Number(event.target.getDuration && event.target.getDuration()) || 0;
          event.target.setPlaybackRate(speed);
          setWindow(startAt, endAt);
        },
        onStateChange: (event) => {
          const states = window.YT && window.YT.PlayerState;
          if (!states) return;
          if (event.data === states.PLAYING) startLoopGuard();
          // Pausing must stop the 120ms guard too, or a paused lesson keeps a
          // timer polling a player nobody is watching.
          else if (event.data === states.PAUSED || event.data === states.ENDED) stopLoopGuard();
          update();
        },
        onError: () => showFallback("This lesson is not embeddable here right now.")
      }
    });
  }

  function startLoopGuard() {
    stopLoopGuard();
    timer = setInterval(() => {
      if (!ready || !player || !player.getCurrentTime) return;
      if (!duration && player.getDuration) {
        const reported = Number(player.getDuration()) || 0;
        if (reported) { duration = reported; setWindow(startAt, endAt); }
      }
      if (loopOn && player.getCurrentTime() >= endAt) { player.seekTo(startAt, true); player.playVideo(); }
    }, 120);
  }
  function stopLoopGuard() { if (timer) clearInterval(timer); timer = null; }

  function updateTime() {
    const output = $("abTime");
    if (!output) return;
    const span = (endAt - startAt).toFixed(1);
    output.textContent = ready
      ? `${format(startAt)} → ${format(endAt)} · ${span}s · ${loopOn ? "repeating" : "plays once"}`
      : unavailable ? "player unavailable here" : "waiting for the lesson player";
  }

  function update() {
    const root = $("videoStudy");
    if (!root) return;
    root.querySelectorAll("[data-video-lesson]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-video-lesson") === activeId));
    const play = $("btnVideoPlay");
    if (play) {
      play.disabled = !ready;
      play.textContent = isPlaying() ? "❚❚ Pause" : loopOn ? "▶ Play loop" : "▶ Play";
      play.title = ready ? "" : unavailable ? "Open the lesson on YouTube instead" : "Waiting for the lesson player";
    }
    const a = $("abStart"), b = $("abEnd"), rate = $("videoSpeed"), looping = $("tglVideoLoop");
    const ceiling = duration > MIN_WINDOW ? Math.max(MIN_WINDOW, Math.round(duration * 2) / 2) : RANGE_FALLBACK;
    [a, b].forEach((slider) => {
      if (!slider) return;
      slider.max = String(ceiling);
      slider.disabled = !ready;
    });
    if (a) a.value = startAt;
    if (b) b.value = endAt;
    [$("btnSetA"), $("btnSetB")].forEach((button) => { if (button) button.disabled = !ready; });
    if (rate) rate.value = String(speed);
    if (looping) looping.checked = loopOn;
    updateTime();
  }

  function selectLesson(id) {
    const fresh = openingState();
    activeId = id;
    startAt = fresh.startAt;
    endAt = fresh.endAt;
    duration = fresh.duration;
    loopOn = fresh.loopOn;
    loopChosen = fresh.loopChosen;
    ready = false;
    stopLoopGuard();
    render();
  }

  function render() {
    const root = $("videoStudy");
    if (!root) return;
    mounted = true;
    unavailable = false;
    stopLoopGuard();
    root.innerHTML = `<div class="solo-title"><span class="panel-label">Video study lab</span><span>watch → loop → map</span></div>
      <div class="video-library" role="group" aria-label="Public bouzouki lessons">${LESSONS.map((lesson) => `<button data-video-lesson="${lesson.id}" class="${lesson.id === activeId ? "active" : ""}"><span>${lesson.teacher}</span><b>${lesson.title}</b><i>${lesson.focus}</i></button>`).join("")}</div>
      <div class="video-layout"><div id="videoStudyPlayer" class="video-player"><div id="videoPlayer" aria-label="Selected public bouzouki lesson"></div></div>
        <div class="video-controls"><div class="ab-display"><span>A–B loop</span><b id="abTime"></b></div>
          <div class="ab-ranges"><label>A<input id="abStart" type="range" min="0" max="${RANGE_FALLBACK}" step="0.5" value="${startAt}" disabled /></label><label>B<input id="abEnd" type="range" min="0.5" max="${RANGE_FALLBACK}" step="0.5" value="${endAt}" disabled /></label></div>
          <div class="row"><button id="btnSetA" class="mini" disabled>Set A to playhead</button><button id="btnSetB" class="mini" disabled>Set B to playhead</button></div>
          <div class="row"><button id="btnVideoPlay" class="tbtn primary" disabled>▶ Play</button><label class="inline-tgl"><input id="tglVideoLoop" type="checkbox" /> repeat A–B</label></div>
          <div class="video-speed"><label for="videoSpeed">Speed</label><select id="videoSpeed">${SPEEDS.map((rate) => `<option value="${rate}"${rate === speed ? " selected" : ""}>${rate}×</option>`).join("")}</select></div>
        </div></div>
      <p class="video-footnote">Public lessons referenced by <a href="https://mpouzouki.weebly.com/bouzouki-lessons.html" target="_blank" rel="noopener noreferrer">The Bouzouki Learning Website</a> stay on YouTube; this page only adds an A–B practice loop, and availability, playback rate, and embedding remain with the original host.</p>`;
    root.querySelectorAll("[data-video-lesson]").forEach((button) =>
      button.onclick = () => selectLesson(button.getAttribute("data-video-lesson")));
    $("abStart").oninput = (event) => { setWindow(+event.target.value, endAt); markWindowSet(); };
    $("abEnd").oninput = (event) => { setWindow(startAt, +event.target.value); markWindowSet(); };
    $("btnSetA").onclick = () => { if (ready) { setWindow(player.getCurrentTime(), endAt); markWindowSet(); } };
    $("btnSetB").onclick = () => { if (ready) { setWindow(startAt, player.getCurrentTime()); markWindowSet(); } };
    $("btnVideoPlay").onclick = () => {
      if (!ready) return;
      if (isPlaying()) player.pauseVideo();
      else { if (loopOn) player.seekTo(startAt, true); player.playVideo(); }
    };
    $("tglVideoLoop").onchange = (event) => {
      loopChosen = true;
      loopOn = event.target.checked;
      if (loopOn && isPlaying()) startLoopGuard();
      update();
    };
    $("videoSpeed").onchange = (event) => { speed = +event.target.value; if (ready) player.setPlaybackRate(speed); };
    update();
    loadYoutubeApi().then(createPlayer).catch(() =>
      showFallback("The player needs a connection; the A–B loop returns when you are back online."));
  }

  function destroy() {
    mounted = false; stopLoopGuard();
    if (player && player.pauseVideo) player.pauseVideo();
    if (player && player.destroy) player.destroy();
    player = null; ready = false;
  }
  function selfTest() {
    const ids = new Set(LESSONS.map((lesson) => lesson.id));
    const short = clampWindow(0, 8, 5);
    const inverted = clampWindow(10, 2, 0);
    const negative = clampWindow(-4, -1, 0);
    const results = [
      { name: "video study catalog uses unique public video IDs", pass: ids.size === LESSONS.length && LESSONS.every((lesson) => /^[\w-]{11}$/.test(lesson.videoId)), detail: String(ids.size) },
      { name: "the A–B window never runs past the clip", pass: short.start === 0 && short.end === 5, detail: `${short.start}-${short.end}` },
      { name: "B always stays at least half a second after A", pass: inverted.start === 10 && inverted.end === 10.5, detail: `${inverted.start}-${inverted.end}` },
      { name: "the window never starts before the clip does", pass: negative.start === 0 && negative.end === 0.5, detail: `${negative.start}-${negative.end}` },
      { name: "a freshly opened lesson does not loop until A or B is set", pass: openingState().loopOn === false && openingState().startAt === 0, detail: JSON.stringify(openingState()) }
    ];
    return { ok: results.every((result) => result.pass), results };
  }
  window.VideoStudy = { LESSONS, clampWindow, openingState, render, destroy, selfTest };
})();
