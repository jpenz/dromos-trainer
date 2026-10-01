/* audio.js — speaker-safe hybrid string voice + simple bar transport.
 * No external libs. Exposes window.AudioEngine.
 * Implements FR-05, FR-06, FR-23, FR-50 and FR-68. See docs/REQUIREMENTS.md.
 */
(function () {
  "use strict";

  let ctx = null;
  let master = null;
  let compressor = null;
  let output = null;
  // Notes feed voiceBus -> master -> limiter. Clicks, kick and tick feed
  // clickBus straight to the output so they never duck the notes.
  let voiceBus = null;
  let clickBus = null;
  const bufCache = new Map();
  const studioBuffers = new Map();
  const activeSources = new Set();
  let playbackGeneration = 0;
  let pluckCounter = 0;

  // A note or click whose start time has already passed by more than this is
  // dropped. Web Audio would otherwise play every missed event at once.
  const LATE_TOLERANCE = 0.01;
  // Stop fades the voice bus over a few milliseconds instead of cutting
  // ringing notes mid-waveform; sources stop once the fade is complete.
  const STOP_FADE_TAU = 0.008;
  const STOP_FADE_END = 0.05;
  // Decoded studio samples keep only their first seconds: playback never runs
  // past dur + 1.2 s, and the full 13 s recordings cost about 95 MB decoded.
  const STUDIO_KEEP_SECONDS = 5;
  let studioLoadPromise = null;
  let studioLoadState = "idle";
  let unlockPromise = null;

  function audioStatus() {
    return {
      state: ctx ? ctx.state : "idle",
      ready: !!ctx && ctx.state === "running",
      studio: studioLoadState
    };
  }

  function announceAudioState() {
    if (typeof document === "undefined" || typeof CustomEvent === "undefined") return;
    document.dispatchEvent(new CustomEvent("dromos:audio-state", { detail: audioStatus() }));
  }

  // One velocity layer sampled every minor 3rd is enough for a stable ear-
  // training reference without shipping a full piano ROM. Adjacent notes are
  // repitched by at most two semitones. The original Salamander recordings and
  // attribution live beside these self-hosted files.
  const STUDIO_PIANO_SAMPLES = [
    [36, "C2"], [39, "Ds2"], [42, "Fs2"], [45, "A2"],
    [48, "C3"], [51, "Ds3"], [54, "Fs3"], [57, "A3"],
    [60, "C4"], [63, "Ds4"], [66, "Fs4"], [69, "A4"],
    [72, "C5"], [75, "Ds5"], [78, "Fs5"], [81, "A5"], [84, "C6"]
  ].map(([midi, name]) => ({ midi, name, url: `assets/audio/salamander/${name}.mp3` }));

  function instrumentVoice() {
    const id = window.Tuning && window.Tuning.currentId ? window.Tuning.currentId() : "guitar";
    if (id.indexOf("bouzouki") === 0) return "bouzouki";
    if (id.indexOf("laouto") === 0) return "laouto";
    return "guitar";
  }

  function makeVoiceBus() {
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
    return bus;
  }

  // Every note voice (plucked, piano, studio, bass) connects here, so stopAll
  // can fade them together. The bus is replaced after each stop.
  function voiceOut() {
    if (!voiceBus) voiceBus = makeVoiceBus();
    return voiceBus;
  }

  function ensure() {
    if (!ctx) {
      // iOS treats Web Audio as "ambient" by default, so the ring/silent
      // switch mutes the app. Safari 16.4+ lets a page ask for playback.
      try {
        if (typeof navigator !== "undefined" && navigator.audioSession) navigator.audioSession.type = "playback";
      } catch { /* older WebKit: keep the default session */ }
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      compressor = ctx.createDynamicsCompressor();
      output = ctx.createGain();
      clickBus = ctx.createGain();
      master.gain.value = 0.9;
      // A safety limiter, not a mix compressor: it stays out of the way below
      // -6 dBFS so accents and decaying tails keep their real level.
      compressor.threshold.value = -6;
      compressor.knee.value = 0;
      compressor.ratio.value = 20;
      compressor.attack.value = 0.001;
      compressor.release.value = 0.1;
      output.gain.value = 0.8;
      // The limiter adds a fixed makeup gain of about +3.4 dB to everything
      // below its threshold. 1.3 keeps the click at the note level it had
      // when it shared the master bus.
      clickBus.gain.value = 1.3;
      master.connect(compressor); compressor.connect(output);
      clickBus.connect(output);
      output.connect(ctx.destination);
      voiceBus = makeVoiceBus();
      ctx.addEventListener("statechange", announceAudioState);
    }
    return ctx;
  }

  function isLateAt(when, now) {
    return when != null && when < now - LATE_TOLERANCE;
  }

  function isLate(when) {
    return !!ctx && isLateAt(when, ctx.currentTime);
  }

  // Seconds between the audio clock and the speaker. Bluetooth output is
  // often 0.15-0.25 s, so UI callbacks that mark a sound add this delay.
  function uiLatency() {
    if (!ctx) return 0;
    const latency = Number(ctx.outputLatency) || Number(ctx.baseLatency) || 0;
    return latency > 0 && Number.isFinite(latency) ? Math.min(0.5, latency) : 0;
  }

  // Safari/iPadOS can leave an AudioContext suspended after a tab switch or
  // while a sample is being decoded. Call this directly from the user's tap,
  // await the state transition, and only then schedule audible work.
  function ensureRunning() {
    const context = ensure();
    if (context.state === "running") {
      announceAudioState();
      return Promise.resolve(true);
    }
    if (unlockPromise) return unlockPromise;
    const resumeAttempt = Promise.resolve(context.resume()).then(() => context.state === "running").catch(() => false);
    const resumeTimeout = new Promise((resolve) => setTimeout(() => resolve(context.state === "running"), 1600));
    // A few WebKit builds have left resume() pending indefinitely after an app
    // switch. Never strand the interface on "Starting audio…"; release the
    // lock and let the next explicit tap retry inside a fresh user gesture.
    unlockPromise = Promise.race([resumeAttempt, resumeTimeout]).then((running) => {
      announceAudioState();
      return running;
    }).finally(() => { unlockPromise = null; });
    return unlockPromise;
  }

  // A real user gesture is still the most dependable audio unlock on iPadOS.
  // Starting and immediately stopping a silent one-sample buffer primes the
  // graph without making a click or scheduling a mystery note.
  function prime() {
    const context = ensure();
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, context.sampleRate);
    source.connect(master);
    source.start();
    return ensureRunning();
  }

  function voiceGain(noteCount, role) {
    const count = Math.max(1, Number(noteCount) || 1);
    const base = role === "sequence" ? 0.30 : role === "path" ? 0.28 : 0.46 / Math.sqrt(count);
    return Math.max(0.15, Math.min(0.31, base));
  }

  function isPluckedVoice(voice) {
    return !["studio", "piano"].includes(voice);
  }

  // Fast training lines need separation between attacks. Long synthesized
  // tails smear ta-ka timing into a drone; harmony voices may ring longer.
  function trainingNoteDuration(spacing, voice) {
    const sp = Math.max(0.05, Number(spacing) || 0.3);
    return isPluckedVoice(voice)
      ? Math.max(0.24, Math.min(0.68, sp * 1.72))
      : Math.max(0.58, Math.min(1.05, sp * 2.15));
  }

  // ---- Plucked string (Karplus-Strong) ------------------------------------
  // The loop filter is a two-tap average whose weights sum to 1, so the loop
  // gain is `decay` and always below 1. Brightness belongs to the excitation
  // and the tone filter, never to the loop weights: weights that summed above
  // 1 made the guitar loop unstable and the bouzouki loop die in 0.1 s.
  const KS_SMOOTH = 0.5;
  const PLUCK_VARIANTS = 4;
  const PLUCK_CACHE_LIMIT = 160;

  function pluckDecay(voice) {
    // Longer decay coefficients: a practice chord should still be ringing when
    // the bar ends, the way a real course does, instead of dying mid-bar.
    return voice === "bouzouki" ? 0.99735 : voice === "laouto" ? 0.9982 : 0.99845;
  }

  function pluckLoopGain(voice) {
    return pluckDecay(voice) * ((1 - KS_SMOOTH) + KS_SMOOTH);
  }

  // The per-note gain envelope reaches silence by this time; the buffer only
  // needs to outlast it. A fixed length keeps the cache independent of tempo.
  function pluckEnvelopeCap(voice) {
    return voice === "bouzouki" ? 0.72 : 1.15;
  }

  function pluckBufferSeconds(voice) {
    return pluckEnvelopeCap(voice) + 0.1;
  }

  // The averaging loop adds KS_SMOOTH samples of delay, so the true period is
  // N - KS_SMOOTH. Choosing N this way keeps the playback-rate correction
  // within half a sample of 1.
  function pluckPeriod(freq, sampleRate) {
    return Math.max(2, Math.round(sampleRate / freq + KS_SMOOTH));
  }

  function pluckRate(freq, N, sampleRate) {
    return freq * (N - KS_SMOOTH) / sampleRate;
  }

  function pluckVariant(variant) {
    return ((Math.floor(variant) || 0) % PLUCK_VARIANTS + PLUCK_VARIANTS) % PLUCK_VARIANTS;
  }

  function pluckCacheKey(N, voice, variant) {
    return N + ":" + voice + ":" + pluckVariant(variant);
  }

  // Fill `y` with one plucked-string excitation and its ringing tail.
  // Pure (no AudioContext), so selfTest can check it in Node. Returns the
  // index of the peak before normalising.
  function synthPluck(y, N, voice, random) {
    const rnd = random || Math.random;
    const len = y.length;
    // A short, shaped excitation gives a pick attack instead of the broad,
    // harp-like noise burst produced by the original white-noise-only model.
    let previous = 0;
    const noiseMix = voice === "bouzouki" ? 0.42 : voice === "laouto" ? 0.35 : 0.28;
    const pickLength = Math.max(2, Math.floor(N * 0.16));
    for (let i = 0; i < Math.min(N, len); i++) {
      const white = rnd() * 2 - 1;
      previous = previous * (1 - noiseMix) + white * noiseMix;
      y[i] = previous * (i < pickLength ? 1 : 0.32);
    }
    const decay = pluckDecay(voice);
    const a = decay * (1 - KS_SMOOTH);
    const b = decay * KS_SMOOTH;
    for (let i = N; i < len; i++) y[i] = a * y[i - N] + b * y[i - N + 1];
    // The recurrence depends on pitch and sample rate. Normalize every cached
    // buffer so a high bouzouki note cannot be much louder than a guitar root.
    let peak = 0;
    let peakAt = 0;
    for (let i = 0; i < len; i++) {
      const magnitude = Math.abs(y[i]);
      if (magnitude > peak) { peak = magnitude; peakAt = i; }
    }
    const normalise = peak > 0 ? 0.72 / peak : 1;
    for (let i = 0; i < len; i++) y[i] *= normalise;
    return peakAt;
  }

  // One buffer per (period, voice, variant). Four excitation variants are
  // handed out round-robin so repeated notes and tremolo are not
  // bit-identical. Returns the buffer and the playback rate that corrects the
  // fractional-delay sharpness.
  function pluckBuffer(freq, voice, variant) {
    const sr = ctx.sampleRate;
    const N = pluckPeriod(freq, sr);
    const key = pluckCacheKey(N, voice, variant);
    let buf = bufCache.get(key);
    if (!buf) {
      const len = Math.floor(pluckBufferSeconds(voice) * sr);
      buf = ctx.createBuffer(1, len, sr);
      const y = buf.getChannelData(0);
      synthPluck(y, N, voice);
      // The gain envelope is silent well before the end; this short fade only
      // guarantees the buffer never ends on a step.
      const fade = Math.min(len, Math.floor(sr * 0.03));
      for (let i = 0; i < fade; i++) y[len - 1 - i] *= i / fade;
      bufCache.set(key, buf);
      if (bufCache.size > PLUCK_CACHE_LIMIT) bufCache.delete(bufCache.keys().next().value);
    }
    return { buf, rate: pluckRate(freq, N, sr) };
  }

  // Shared bookkeeping for every scheduled source: stopAll needs to know
  // whether a source has started and which bus it feeds.
  function track(source, start, bus, onEnd) {
    source._dromosStart = start;
    source._dromosBus = bus || "voice";
    activeSources.add(source);
    source.onended = () => {
      activeSources.delete(source);
      if (onEnd) onEnd();
    };
  }

  // A clean, decaying piano-like tone built from a few harmonics. It is a
  // practice reference voice, not a sampled instrument: fast attack, warm
  // rolloff, no pick noise — useful when the plucked model feels rough.
  function playPianoNoteAt(freq, when, dur, gain) {
    const t = when == null ? ctx.currentTime + 0.01 : when;
    const level = gain == null ? 0.24 : gain;
    const out = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = Math.min(6200, freq * 9);
    tone.Q.value = 0.4;
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(level, t + 0.004);
    out.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.9, Math.min(dur, 2.4)));
    out.connect(tone); tone.connect(voiceOut());
    // Higher notes decay faster, like real strings; slight inharmonic stretch
    // on the upper partials keeps the tone from sounding like an organ.
    const bodyDecay = Math.max(0.6, Math.min(1.8, 1.9 - freq / 700));
    [
      { ratio: 1, level: 1, type: "sine" },
      { ratio: 2.001, level: 0.34, type: "sine" },
      { ratio: 3.004, level: 0.12, type: "sine" },
      { ratio: 4.012, level: 0.05, type: "sine" }
    ].forEach((partial, index) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = partial.type;
      osc.frequency.setValueAtTime(freq * partial.ratio, t);
      g.gain.setValueAtTime(partial.level, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, partial.level * 0.08), t + Math.min(dur, bodyDecay * (1 - index * 0.15)));
      osc.connect(g); g.connect(out);
      track(osc, t, "voice");
      osc.start(t);
      osc.stop(t + Math.min(dur, 2.4) + 0.05);
    });
  }

  function decodeAudio(arrayBuffer) {
    return new Promise((resolve, reject) => {
      // The fetched bytes are never reused, so decode them in place.
      const result = ctx.decodeAudioData(arrayBuffer, resolve, reject);
      if (result && typeof result.then === "function") result.then(resolve, reject);
    });
  }

  // Keep the first STUDIO_KEEP_SECONDS of a decoded sample, starting 1 ms
  // before its measured onset (first sample above 1% of peak). The files carry
  // 9-13 ms of near-silence before the hammer, which made studio chords land
  // behind the click. The channels are a real stereo pair, so both are kept.
  function trimStudioBuffer(buffer) {
    try {
      const sr = buffer.sampleRate;
      const channels = buffer.numberOfChannels;
      const data = [];
      for (let c = 0; c < channels; c++) data.push(buffer.getChannelData(c));
      let peak = 0;
      data.forEach((channel) => {
        for (let i = 0; i < channel.length; i++) {
          const magnitude = Math.abs(channel[i]);
          if (magnitude > peak) peak = magnitude;
        }
      });
      if (!(peak > 0)) return buffer;
      const threshold = peak * 0.01;
      let onset = 0;
      search: for (let i = 0; i < buffer.length; i++) {
        for (let c = 0; c < channels; c++) {
          if (Math.abs(data[c][i]) > threshold) { onset = i; break search; }
        }
      }
      const start = Math.max(0, onset - Math.round(sr * 0.001));
      const length = Math.min(buffer.length - start, Math.round(sr * STUDIO_KEEP_SECONDS));
      if (length <= 0) return buffer;
      const trimmed = ctx.createBuffer(channels, length, sr);
      const fade = Math.min(length, Math.floor(sr * 0.03));
      for (let c = 0; c < channels; c++) {
        const target = trimmed.getChannelData(c);
        target.set(data[c].subarray(start, start + length));
        for (let i = 0; i < fade; i++) target[length - 1 - i] *= i / fade;
      }
      return trimmed;
    } catch {
      return buffer;
    }
  }

  function nearestStudioSample(midi) {
    return STUDIO_PIANO_SAMPLES.reduce((best, sample) =>
      !best || Math.abs(sample.midi - midi) < Math.abs(best.midi - midi) ? sample : best, null);
  }

  function prepareStudioPiano() {
    ensure();
    if (studioLoadState === "ready") return Promise.resolve(true);
    if (studioLoadPromise) return studioLoadPromise;
    if (typeof fetch !== "function" || typeof location !== "undefined" && location.protocol === "file:") {
      studioLoadState = "fallback";
      return Promise.resolve(false);
    }
    studioLoadState = "loading";
    studioLoadPromise = Promise.all(STUDIO_PIANO_SAMPLES.map((sample) =>
      fetch(sample.url).then((response) => {
        if (!response.ok) throw new Error(`Piano sample ${response.status}`);
        return response.arrayBuffer();
      }).then(decodeAudio).then((buffer) => studioBuffers.set(sample.midi, trimStudioBuffer(buffer))).catch(() => null)
    )).then(() => {
      studioLoadState = studioBuffers.size >= 8 ? "ready" : "fallback";
      return studioLoadState === "ready";
    });
    return studioLoadPromise;
  }

  function playStudioPianoNoteAt(freq, when, dur, gain) {
    const midi = 69 + 12 * Math.log2(freq / 440);
    const sample = nearestStudioSample(midi);
    const buffer = sample && studioBuffers.get(sample.midi);
    if (!buffer) { playPianoNoteAt(freq, when, dur, gain); return; }
    const t = when == null ? ctx.currentTime + 0.01 : when;
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    const cleanup = ctx.createBiquadFilter();
    const rate = Math.pow(2, (midi - sample.midi) / 12);
    src.buffer = buffer;
    src.playbackRate.setValueAtTime(rate, t);
    cleanup.type = "highpass";
    cleanup.frequency.value = 38;
    cleanup.Q.value = 0.35;
    const level = Math.max(0.08, (gain == null ? 0.22 : gain) * 0.92);
    const releaseAt = t + Math.max(0.35, Math.min(dur * 0.82, 2.6));
    g.gain.setValueAtTime(level, t);
    g.gain.setTargetAtTime(0.0001, releaseAt, 0.32);
    src.connect(cleanup); cleanup.connect(g); g.connect(voiceOut());
    track(src, t, "voice", () => { try { g.disconnect(); } catch { /* already gone */ } });
    src.start(t);
    src.stop(t + Math.min(buffer.duration / rate, dur + 1.2));
  }

  // `art` carries single-note articulation from picking drills:
  // { accent: true|false, stroke: "down"|"up" }. Accented notes are a little
  // louder and brighter; upstrokes are a little darker. Absent fields leave
  // the note as it was.
  function playNoteAt(freq, when, dur, gain, referenceVoice, art) {
    if (when == null) when = ctx.currentTime + 0.01;
    // A late timer must not fire missed notes as one cluster.
    if (isLate(when)) return;
    const voice = referenceVoice || instrumentVoice();
    if (voice === "studio") { playStudioPianoNoteAt(freq, when, dur, gain); return; }
    if (voice === "piano") { playPianoNoteAt(freq, when, dur, gain); return; }
    const variant = pluckCounter++ % PLUCK_VARIANTS;
    const main = pluckBuffer(freq, voice, variant);
    const src = ctx.createBufferSource();
    src.buffer = main.buf;
    src.playbackRate.value = main.rate;
    const paired = voice === "bouzouki" ? ctx.createBufferSource() : null;
    if (paired) {
      // The second string of the course gets its own excitation, so the two
      // strings no longer sum into a fixed comb filter.
      const second = pluckBuffer(freq, voice, variant + 2);
      paired.buffer = second.buf;
      paired.playbackRate.value = second.rate;
      // A second slightly sharp course creates the short paired-string bloom
      // of a bouzouki/mandolin attack without reverb or a sustaining drone.
      paired.detune.setValueAtTime(3.8, when);
    }
    const accent = art ? art.accent : undefined;
    const stroke = art ? art.stroke : undefined;
    const accentLevel = accent === true ? 1.18 : accent === false ? 0.9 : 1;
    // About ±0.5 dB and ±150 Hz per note, so repeated picking breathes.
    const levelJitter = Math.pow(10, (Math.random() - 0.5) / 20);
    const baseCutoff = voice === "bouzouki" ? 4300 : voice === "laouto" ? 3300 : 3100;
    const cutoff = baseCutoff * (accent === true ? 1.2 : 1) * (stroke === "up" ? 0.86 : 1) + (Math.random() - 0.5) * 300;
    const g = ctx.createGain();
    const attackA = ctx.createGain();
    const attackB = paired ? ctx.createGain() : null;
    const tone = ctx.createBiquadFilter();
    const cleanup = ctx.createBiquadFilter();
    const body = ctx.createBiquadFilter();
    cleanup.type = "highpass";
    cleanup.frequency.value = voice === "laouto" ? 62 : 74;
    cleanup.Q.value = 0.5;
    tone.type = "lowpass";
    tone.frequency.value = Math.min(cutoff, ctx.sampleRate * 0.45);
    tone.Q.value = 0.55;
    body.type = "peaking";
    body.frequency.value = voice === "bouzouki" ? 330 : voice === "laouto" ? 220 : 185;
    body.Q.value = 0.75;
    body.gain.value = 1.6;
    const level = (gain == null ? 0.24 : gain) * accentLevel * levelJitter;
    g.gain.setValueAtTime(level, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.18, Math.min(dur, pluckEnvelopeCap(voice))));
    attackA.gain.value = paired ? 0.64 : 1;
    if (attackB) attackB.gain.value = 0.42;
    src.connect(attackA); attackA.connect(cleanup);
    if (paired) { paired.connect(attackB); attackB.connect(cleanup); }
    cleanup.connect(tone); tone.connect(body); body.connect(g);
    g.connect(voiceOut());
    const release = () => { try { g.disconnect(); } catch { /* already gone */ } };
    track(src, when, "voice", paired ? null : release);
    if (paired) track(paired, when, "voice", release);
    // The fundamental oscillator exists to give the pluck its body, NOT to
    // sustain. Anything longer reads as a synth drone humming under the chord
    // after the strings have decayed, so it is an attack thump only. On the
    // bouzouki it peaked at -74 dB, so that voice no longer builds it.
    if (voice !== "bouzouki") {
      const thump = Math.min(dur, 0.075);
      const fundamental = ctx.createOscillator();
      const fundamentalGain = ctx.createGain();
      fundamental.type = "triangle";
      fundamental.frequency.setValueAtTime(freq, when);
      fundamentalGain.gain.setValueAtTime(0.0001, when);
      fundamentalGain.gain.exponentialRampToValueAtTime(0.026, when + 0.006);
      fundamentalGain.gain.exponentialRampToValueAtTime(0.0001, when + thump);
      fundamental.connect(fundamentalGain); fundamentalGain.connect(g);
      track(fundamental, when, "voice");
      fundamental.start(when);
      fundamental.stop(when + thump + 0.03);
    }
    src.start(when);
    src.stop(when + dur + 0.05);
    if (paired) {
      // 0.5-1.5 ms between the two strings of the course, varied per note.
      const offset = 0.0005 + Math.random() * 0.001;
      paired.start(when + offset);
      paired.stop(when + dur + 0.055);
    }
  }

  // Strum a chord (array of {freq}). style: "strum" | "arp" | "block".
  // `duration` lets short gestures (like a beat-3 pickup) ring briefly
  // instead of sustaining over the next downbeat.
  function playChord(notes, style, when, referenceVoice, duration) {
    ensure();
    // Immediate Studio-piano auditions wait for their real samples instead of
    // quietly playing the synthesized fallback on the first click. Scheduled
    // transport chords are preloaded by the controller before it starts.
    if (referenceVoice === "studio" && studioLoadState !== "ready" && when == null) {
      if (studioLoadState === "fallback") referenceVoice = "piano";
      else {
        const generation = playbackGeneration;
        prepareStudioPiano().then((ready) => {
          if (generation === playbackGeneration) playChord(notes, style, undefined, ready ? "studio" : "piano", duration);
        });
        return;
      }
    }
    const t0 = when == null ? ctx.currentTime + 0.01 : when;
    const dur = duration == null ? 3.4 : Math.max(0.3, duration);
    const spread = style === "arp" ? 0.14 : style === "block" ? 0 : 0.035;
    const level = voiceGain(notes.length, "chord");
    notes.forEach((n, i) => {
      playNoteAt(n.freq, t0 + i * spread, dur, Math.max(0.14, level - i * 0.008), referenceVoice);
    });
  }

  // Play a melodic path for scale/cell drills. Ear-map prompts deliberately
  // use chords only so the answer is never leaked by a diagnostic scale run.
  function playSequence(notes, spacing, when, referenceVoice) {
    ensure();
    const sp = spacing == null ? 0.26 : spacing;
    const t0 = when == null ? ctx.currentTime + 0.02 : when;
    const voice = referenceVoice || instrumentVoice();
    const duration = trainingNoteDuration(sp, voice);
    notes.forEach((n, i) => playNoteAt(n.freq, t0 + i * sp, duration, voiceGain(1, "sequence"), voice));
    return t0 + notes.length * sp;
  }

  // Legacy chord + run prompt retained for internal scale study, not Recall.
  function playPrompt(chords, runNotes, bpm) {
    ensure();
    const spb = 60 / (bpm || 84);
    let t = ctx.currentTime + 0.08;
    chords.forEach((c) => { playChord(c.notes, "strum", t); t += spb * 2; });
    t += spb * 0.5;
    playSequence(runNotes, spb * 0.6, t);
  }

  // Harmony-first prompt for the "name the map" ear drill. Repeating the
  // cadence gives the player a second chance to feel the home and the boxes
  // without revealing their labels.
  function scheduleProgressionPrompt(chords, bpm, referenceVoice) {
    const spb = 60 / (bpm || 84);
    let t = ctx.currentTime + 0.08;
    for (let pass = 0; pass < 2; pass++) {
      chords.forEach((chord) => { playChord(chord.notes, "strum", t, referenceVoice, spb * 1.42); t += spb * 1.5; });
      t += spb * 0.45;
    }
  }

  function playProgressionPrompt(chords, bpm, referenceVoice) {
    ensure();
    const voice = referenceVoice || "studio";
    const generation = playbackGeneration;
    const start = () => {
      if (generation !== playbackGeneration) return false;
      scheduleProgressionPrompt(chords, bpm, voice);
      return true;
    };
    return voice === "studio" && studioLoadState !== "ready"
      ? prepareStudioPiano().then(start) : Promise.resolve(start());
  }

  function playReferenceChord(notes, style) {
    ensure();
    const generation = playbackGeneration;
    return prepareStudioPiano().then(() => {
      if (generation !== playbackGeneration) return false;
      playChord(notes, style || "block", undefined, "studio");
      return true;
    });
  }

  // Play a path/cell note-by-note with UI sync. `silentFrom` leaves a gap where
  // the target note would sound — that silence is the audiation drill (FR-23).
  // Pending path timers. Each removes itself when it fires, so a long loop
  // never accumulates ids.
  const pathTimers = new Set();
  function pathLater(fn, ms) {
    const id = setTimeout(() => { pathTimers.delete(id); fn(); }, Math.max(0, ms));
    pathTimers.add(id);
    return id;
  }

  function playPath(notes, spacing, opts) {
    ensure();
    stopPath();
    const o = opts || {};
    const sp = spacing == null ? 0.3 : spacing;
    const beatSpacing = Math.max(sp, +o.beatSpacing || sp);
    const countInBeats = Math.max(0, Math.floor(+o.countInBeats || 0));
    // startAt lets a caller chain segments on the audio clock (evolve
    // stages hand off bar-to-bar with no restart gap).
    const start = o.startAt && o.startAt > ctx.currentTime ? o.startAt : ctx.currentTime + 0.06;
    const t0 = start + countInBeats * beatSpacing;
    const pulse = Array.isArray(o.pulse) && o.pulse.length ? o.pulse : [{ first: true }];
    // Per-note duration multipliers (dotted formations, held skeleton notes,
    // free-tremolo holds) accumulate into real offsets; uniform lines are the
    // durMult-less special case.
    const offsets = [];
    let total = 0;
    notes.forEach((n) => { offsets.push(total); total += sp * (n && n.durMult > 0 ? n.durMult : 1); });
    const voice = o.referenceVoice || instrumentVoice();
    const barSpan = beatSpacing * pulse.length;
    // A looping drill is padded up to the next whole bar so every iteration
    // starts ON a bar line: the click never restarts and never phase-shifts
    // against the notes. Everything is scheduled on the audio clock — the
    // JS timer below only queues the NEXT iteration ahead of time; it never
    // decides when a sound happens.
    const loopSpan = o.loop ? Math.max(barSpan, Math.ceil(total / barSpan - 1e-9) * barSpan) : total;
    const barBeats = Math.max(1, Math.round(loopSpan / beatSpacing));
    // A non-chaining onDone ends the run. A highlight delayed by output
    // latency must not land after it and leave a note lit.
    const chaining = o.onDoneLead > 0;
    let finished = false;

    function scheduleClicks(fromTime, beatOffset, beatCount) {
      if (!o.metronome) return;
      for (let beat = 0; beat < beatCount; beat++) {
        const pulseBeat = pulse[(beatOffset + beat) % pulse.length];
        if (o.clickFilter && !o.clickFilter(beatOffset + beat, pulseBeat, pulse.length)) continue;
        click(fromTime + beat * beatSpacing, !!pulseBeat.first);
      }
    }

    function scheduleNotes(fromTime, iteration) {
      const latency = uiLatency();
      notes.forEach((n, i) => {
        const silent = o.silentIndices && o.silentIndices.indexOf(i) >= 0;
        const when = fromTime + offsets[i];
        // A note whose time has already passed (late timer, busy main thread)
        // is skipped with its highlight instead of firing in a cluster.
        if (isLate(when)) return;
        const dur = sp * (n && n.durMult > 0 ? n.durMult : 1);
        if (!silent) {
          if (n && Array.isArray(n.chord) && n.chord.length) {
            // A strum: every chord tone, staggered low-to-high on a downstroke
            // and high-to-low on an upstroke; a muted chop is short and quiet.
            const tones = n.stroke === "up" ? n.chord.slice().reverse() : n.chord;
            const spread = n.mute ? 0.006 : 0.014;
            const length = n.mute ? Math.min(0.07, dur * 0.5) : trainingNoteDuration(dur, voice);
            const level = voiceGain(tones.length, "chord") * (n.mute ? 0.55 : n.accent ? 1.12 : 0.92);
            tones.forEach((tone, k) => playNoteAt(tone.freq, when + k * spread, length, Math.max(0.1, level - k * 0.006), voice));
          } else {
            playNoteAt(n.freq, when, trainingNoteDuration(dur, voice), voiceGain(1, "path") * (n && n.bass ? 1.08 : 1), voice,
              n ? { accent: n.accent, stroke: n.stroke } : null);
          }
        }
        if (o.onStep) {
          // The highlight follows the sound the player hears, so it waits for
          // the output latency as well as the audio clock.
          pathLater(() => {
            if (finished && !chaining) return;
            o.onStep(i, silent, iteration);
          }, (when - ctx.currentTime + latency) * 1000);
        }
      });
    }

    if (o.metronome) {
      for (let beat = 0; beat < countInBeats; beat++) click(start + beat * beatSpacing, !!pulse[beat % pulse.length].first);
    }

    if (o.loop) {
      const generation = playbackGeneration;
      const scheduleIteration = (iteration) => {
        if (generation !== playbackGeneration) return;
        const iterStart = t0 + iteration * loopSpan;
        scheduleClicks(iterStart, iteration * barBeats, barBeats);
        scheduleNotes(iterStart, iteration);
        if (o.onLoop) {
          pathLater(() => o.onLoop(iteration), (iterStart - ctx.currentTime + uiLatency()) * 1000);
        }
        // Queue the next iteration a full second before this one ends, so a
        // late or throttled timer still lands ahead of the seam. The audio
        // clock owns the seam; this timer only feeds the scheduler.
        const queueAt = iterStart + loopSpan - 1.0;
        pathLater(() => scheduleIteration(iteration + 1), (queueAt - ctx.currentTime) * 1000);
      };
      scheduleIteration(0);
      return Infinity;
    }

    scheduleClicks(t0, 0, Math.max(1, Math.ceil(total / beatSpacing)));
    scheduleNotes(t0, 0);
    if (o.onDone) {
      // onDoneLead fires the callback slightly BEFORE the audio ends, so a
      // chaining caller can schedule its next segment at the returned end
      // time while it is still in the future — the seam stays on the grid.
      const lead = o.onDoneLead > 0 ? o.onDoneLead : 0;
      // No latency here: onDone chains audio on the audio clock.
      pathLater(() => { finished = true; o.onDone(); }, (t0 + total - lead - ctx.currentTime) * 1000);
    }
    return t0 + total;
  }

  function stopPath() { pathTimers.forEach(clearTimeout); pathTimers.clear(); }

  // Changing exercise must be decisive: clear scheduled callbacks and stop
  // ringing sample voices as well as the transport. This prevents a previous
  // Solo Road/path prompt from continuing underneath a new page or ear test.
  // Notes already sounding fade out over a few milliseconds on the old voice
  // bus instead of being cut mid-waveform (an audible pop); notes and clicks
  // that have not started yet are cancelled outright, as before.
  function stopAll() {
    playbackGeneration++;
    stopTransport();
    stopPath();
    const now = ctx ? ctx.currentTime : 0;
    const fading = ctx ? voiceBus : null;
    if (fading) {
      fading.gain.cancelScheduledValues(now);
      fading.gain.setValueAtTime(fading.gain.value, now);
      fading.gain.setTargetAtTime(0, now, STOP_FADE_TAU);
    }
    activeSources.forEach((source) => {
      try {
        if (fading && source._dromosBus === "voice" && source._dromosStart <= now) source.stop(now + STOP_FADE_END);
        else source.stop();
      } catch { /* already ended */ }
    });
    activeSources.clear();
    if (fading) {
      // New playback starts on a fresh bus at full level; the old one is
      // released once its fade and the stopped sources are done.
      voiceBus = makeVoiceBus();
      setTimeout(() => { try { fading.disconnect(); } catch { /* already gone */ } }, (STOP_FADE_END + 0.1) * 1000);
    }
  }

  function click(when, accent) {
    const t = when == null ? ctx.currentTime : when;
    if (isLate(t)) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = accent ? 2000 : 1400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(accent ? 0.18 : 0.11, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g); g.connect(clickBus);
    track(o, t, "click");
    o.start(t); o.stop(t + 0.08);
  }

  // The practice ensemble is intentionally simple: it provides functional
  // root motion and a grouped pulse for timing, rather than claiming to be an
  // authentic recording or drum arrangement for any Greek style.

  function bassMidi(pc) {
    // C2–B2: low enough to establish the root but above the sub-heavy range
    // that phone and tablet speakers cannot reproduce clearly.
    return 36 + (((pc % 12) + 12) % 12);
  }

  function playBassAt(pc, when, accent) {
    const t = when == null ? ctx.currentTime + 0.01 : when;
    if (isLate(t)) return;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440 * Math.pow(2, (bassMidi(pc) - 69) / 12), t);
    filter.type = "lowpass"; filter.frequency.setValueAtTime(460, t); filter.Q.value = 0.8;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.18 : 0.12, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    osc.connect(filter); filter.connect(gain); gain.connect(voiceOut());
    track(osc, t, "voice"); osc.start(t); osc.stop(t + 0.46);
  }

  function playKickAt(when, accent) {
    const t = when == null ? ctx.currentTime + 0.01 : when;
    if (isLate(t)) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(accent ? 122 : 92, t);
    osc.frequency.exponentialRampToValueAtTime(46, t + 0.09);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.17 : 0.11, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    osc.connect(gain); gain.connect(clickBus);
    track(osc, t, "click"); osc.start(t); osc.stop(t + 0.15);
  }

  function playTickAt(when, accent) {
    const t = when == null ? ctx.currentTime + 0.01 : when;
    if (isLate(t)) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = accent ? "square" : "triangle";
    osc.frequency.value = accent ? 980 : 1700;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.065 : 0.035, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (accent ? 0.07 : 0.035));
    osc.connect(gain); gain.connect(clickBus);
    track(osc, t, "click"); osc.start(t); osc.stop(t + 0.09);
  }

  function playGrooveBeat(groove, event, pulse, beatInBar, when) {
    if (!groove) return;
    const groupedAccent = !!(pulse && pulse.first);
    if (groove.drums) {
      if (beatInBar === 0) playKickAt(when, true);
      else if (groupedAccent) { playKickAt(when, false); playTickAt(when, true); }
      else playTickAt(when, false);
    }
    if (groove.bass && event && event.bass && event.bass.rootPc != null) {
      // Root establishes the bar; fifths on later group starts make the chord
      // direction audible without adding a stylistically prescriptive bass line.
      const pc = beatInBar === 0 || !groupedAccent
        ? event.bass.rootPc
        : (event.bass.rootPc + 7) % 12;
      playBassAt(pc, when, beatInBar === 0 || groupedAccent);
    }
  }

  // ---- Transport ----------------------------------------------------------
  // Drives chord changes bar-by-bar with a lookahead scheduler.
  let transport = null;

  function startTransport(cfg) {
    ensure();
    stopTransport();
    const beatsPerBar = Math.max(1, +cfg.beatsPerBar || 4);
    const pulse = Array.isArray(cfg.pulse) ? cfg.pulse : [];
    let bpm = cfg.bpm;
    let bar = 0;
    let beatInBar = 0;
    let activeEvent = null;
    let nextTime = ctx.currentTime + 0.15;
    const lookahead = 0.2;      // s
    const interval = 25;        // ms timer

    function secPerBeat() { return 60 / bpm; }

    const timer = setInterval(() => {
      // The timer woke after the clock passed the next beat (busy main
      // thread, throttled background tab). Skip the missed beats on the grid
      // instead of firing them all at once. onBar still runs for a skipped
      // downbeat so the progression keeps its bar lines; its sounds are not
      // played.
      while (nextTime < ctx.currentTime - LATE_TOLERANCE) {
        if (beatInBar === 0) {
          const chord = cfg.onBar(bar, nextTime, ctx.currentTime);
          if (!chord) { stopTransport(); cfg.onStop && cfg.onStop(); return; }
          if (!chord.hold) activeEvent = chord;
        }
        beatInBar++;
        if (beatInBar >= beatsPerBar) { beatInBar = 0; bar++; }
        nextTime += secPerBeat();
      }
      while (nextTime < ctx.currentTime + lookahead) {
        // beat 0 of a bar -> advance chord + strum
        if (beatInBar === 0) {
          const chord = cfg.onBar(bar, nextTime, ctx.currentTime); // {notes}|{hold}|null
          if (!chord) { stopTransport(); cfg.onStop && cfg.onStop(); return; }
          if (!chord.hold) activeEvent = chord;
          if (chord.notes && chord.notes.length && cfg.strumStyle) {
            // Ring through the whole bar (plus a little overlap into the next
            // downbeat) so the harmony is still sounding when the change lands.
            playChord(chord.notes, cfg.strumStyle, nextTime, chord.referenceVoice, beatsPerBar * secPerBeat() * 1.08);
          }
        }
        const pulseBeat = pulse[beatInBar] || { beat: beatInBar + 1, first: beatInBar === 0, group: 1, size: beatsPerBar };
        if (cfg.metronome) click(nextTime, !!pulseBeat.first);
        playGrooveBeat(cfg.groove, activeEvent, pulseBeat, beatInBar, nextTime);
        if (cfg.onBeat) cfg.onBeat(bar, beatInBar, pulseBeat, activeEvent, nextTime, ctx.currentTime);
        beatInBar++;
        if (beatInBar >= beatsPerBar) { beatInBar = 0; bar++; }
        nextTime += secPerBeat();
      }
    }, interval);

    transport = {
      timer,
      setBpm: (v) => { bpm = v; },
      setMetronome: (v) => { cfg.metronome = v; }
    };
  }

  function stopTransport() {
    if (transport) { clearInterval(transport.timer); transport = null; }
  }

  function isPlaying() { return !!transport; }

  function selfTest() {
    const results = [];
    let ok = true;
    const add = (i, want, got) => {
      const pass = String(want) === String(got);
      if (!pass) ok = false;
      results.push({ i, want, got, pass });
    };
    add("six-note chord is quieter per voice than triad", true, voiceGain(6, "chord") < voiceGain(3, "chord"));
    add("single path note remains speaker-safe", true, voiceGain(1, "path") <= 0.3);
    add("gain floor preserves quiet chord audibility", true, voiceGain(8, "chord") >= 0.15);
    add("bouzouki attacks remain separated in a slow eighth-note line", true,
      trainingNoteDuration(0.5, "bouzouki") <= 0.68);
    add("bouzouki attacks are shorter than warm-key references", true,
      trainingNoteDuration(0.24, "bouzouki") < trainingNoteDuration(0.24, "piano"));
    add("studio samples never repitch more than two semitones in the teaching range", true,
      Array.from({ length: 49 }, (_, index) => 36 + index).every((midi) => Math.abs(nearestStudioSample(midi).midi - midi) <= 2));
    const voices = ["bouzouki", "laouto", "guitar"];
    add("every plucked voice has a stable string loop (gain below 1)", true,
      voices.every((voice) => pluckLoopGain(voice) < 1 && pluckLoopGain(voice) > 0.99));
    // Seeded noise keeps the check reproducible.
    let seed = 12345;
    const seeded = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const plucks = [];
    [44100, 48000].forEach((sampleRate) => voices.forEach((voice) =>
      [110, 146.83, 440, 1174.66].forEach((freq) => {
        const N = pluckPeriod(freq, sampleRate);
        const y = new Float32Array(Math.floor(pluckBufferSeconds(voice) * sampleRate));
        plucks.push({ N, peakAt: synthPluck(y, N, voice, seeded), rate: pluckRate(freq, N, sampleRate) });
      })));
    add("every pluck peaks in its attack, not in a growing tail", true,
      plucks.every((pluck) => pluck.peakAt < 2 * pluck.N));
    add("pitch correction never stretches a pluck by more than 1.5%", true,
      plucks.every((pluck) => Math.abs(pluck.rate - 1) <= 0.015));
    add("corrected pluck period lands on the requested pitch", true,
      Math.abs(1200 * Math.log2(48000 / (pluckPeriod(440, 48000) - KS_SMOOTH) * pluckRate(440, pluckPeriod(440, 48000), 48000) / 440)) < 0.01);
    add("pluck cache key ignores tempo and cycles four excitation variants", true,
      pluckCacheKey(109, "bouzouki", 4) === pluckCacheKey(109, "bouzouki", 0)
        && new Set([0, 1, 2, 3].map((variant) => pluckCacheKey(109, "bouzouki", variant))).size === PLUCK_VARIANTS);
    add("a note more than 10 ms in the past is skipped", true, isLateAt(0.98, 1) && !isLateAt(0.995, 1) && !isLateAt(null, 1));
    add("UI latency is zero before audio starts", 0, uiLatency());
    return { ok, results };
  }

  if (typeof document !== "undefined") {
    // pointerdown occurs before the button click handler and gives iPadOS the
    // longest possible user-activation window. Every later playback control
    // also calls ensureRunning, so audio can recover after app switching.
    document.addEventListener("pointerdown", prime, { once: true, capture: true });
    document.addEventListener("touchstart", prime, { once: true, capture: true, passive: true });
    document.addEventListener("visibilitychange", announceAudioState);
  }

  window.AudioEngine = {
    ensure, ensureRunning, prime, audioStatus, voiceGain, trainingNoteDuration, prepareStudioPiano, playReferenceChord, playChord, playSequence, playPrompt, playProgressionPrompt, playPath, stopPath, stopAll, click,
    startTransport, stopTransport, isPlaying,
    studioStatus: () => studioLoadState,
    // Absolute audio-clock time, for callers that schedule multi-part gestures
    // (e.g. the "hear the lean" demo) with sample-accurate downbeats.
    now: () => { ensure(); return ctx.currentTime; },
    // Seconds from the audio clock to the speaker. Add it to any UI timer
    // that marks a sound (highlights, beat pulses), never to audio chaining.
    uiLatency,
    setBpm: (v) => transport && transport.setBpm(v),
    setMetronome: (v) => transport && transport.setMetronome(v),
    selfTest
  };
})();
