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
  const bufCache = new Map();
  const studioBuffers = new Map();
  let activeSources = [];
  let playbackGeneration = 0;
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

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      compressor = ctx.createDynamicsCompressor();
      output = ctx.createGain();
      master.gain.value = 0.76;
      compressor.threshold.value = -20;
      compressor.knee.value = 18;
      compressor.ratio.value = 4.5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;
      output.gain.value = 0.68;
      master.connect(compressor); compressor.connect(output); output.connect(ctx.destination);
      ctx.addEventListener("statechange", announceAudioState);
    }
    return ctx;
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

  // Build a plucked-string buffer for a frequency (cached by rounded freq).
  function pluckBuffer(freq, dur, voice) {
    const key = Math.round(freq) + ":" + dur + ":" + voice;
    if (bufCache.has(key)) return bufCache.get(key);
    const sr = ctx.sampleRate;
    const N = Math.max(2, Math.round(sr / freq));
    const len = Math.floor(dur * sr);
    const buf = ctx.createBuffer(1, len, sr);
    const y = buf.getChannelData(0);
    const noise = new Float32Array(N);
    // A short, shaped excitation gives a pick attack instead of the broad,
    // harp-like noise burst produced by the original white-noise-only model.
    let previous = 0;
    const noiseMix = voice === "bouzouki" ? 0.42 : voice === "laouto" ? 0.35 : 0.28;
    for (let i = 0; i < N; i++) {
      const white = Math.random() * 2 - 1;
      previous = previous * (1 - noiseMix) + white * noiseMix;
      const pick = i < Math.max(2, Math.floor(N * 0.16)) ? 1 : 0.32;
      noise[i] = previous * pick;
    }
    // Longer decay coefficients: a practice chord should still be ringing when
    // the bar ends, the way a real course does, instead of dying mid-bar.
    const decay = voice === "bouzouki" ? 0.9982 : voice === "laouto" ? 0.9986 : 0.9989;
    const blend = voice === "bouzouki" ? 0.46 : voice === "laouto" ? 0.49 : 0.53;
    for (let i = 0; i < len; i++) {
      if (i < N) { y[i] = noise[i]; }
      else { y[i] = decay * blend * (y[i - N] + y[i - N + 1]); }
    }
    // The recurrence depends on pitch and sample rate. Normalize every cached
    // buffer so a high bouzouki note cannot be much louder than a guitar root.
    let peak = 0;
    for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(y[i]));
    const normalise = peak > 0 ? 0.72 / peak : 1;
    for (let i = 0; i < len; i++) y[i] *= normalise;
    // gentle overall fade so tails don't click
    const fade = Math.floor(len * 0.22);
    for (let i = 0; i < fade; i++) y[len - 1 - i] *= i / fade;
    bufCache.set(key, buf);
    return buf;
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
    out.connect(tone); tone.connect(master);
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
      activeSources.push(osc);
      osc.onended = () => { activeSources = activeSources.filter((source) => source !== osc); };
      osc.start(t);
      osc.stop(t + Math.min(dur, 2.4) + 0.05);
    });
  }

  function decodeAudio(arrayBuffer) {
    return new Promise((resolve, reject) => {
      const result = ctx.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
      if (result && typeof result.then === "function") result.then(resolve, reject);
    });
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
      }).then(decodeAudio).then((buffer) => studioBuffers.set(sample.midi, buffer)).catch(() => null)
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
    src.connect(cleanup); cleanup.connect(g); g.connect(master);
    activeSources.push(src);
    src.onended = () => { activeSources = activeSources.filter((source) => source !== src); };
    src.start(t);
    src.stop(t + Math.min(buffer.duration / rate, dur + 1.2));
  }

  function playNoteAt(freq, when, dur, gain, referenceVoice) {
    const voice = referenceVoice || instrumentVoice();
    if (voice === "studio") { playStudioPianoNoteAt(freq, when, dur, gain); return; }
    if (voice === "piano") { playPianoNoteAt(freq, when, dur, gain); return; }
    const b = pluckBuffer(freq, dur, voice);
    const src = ctx.createBufferSource();
    src.buffer = b;
    const g = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    const cleanup = ctx.createBiquadFilter();
    const body = ctx.createBiquadFilter();
    const fundamental = ctx.createOscillator();
    const fundamentalGain = ctx.createGain();
    cleanup.type = "highpass";
    cleanup.frequency.value = voice === "laouto" ? 62 : 74;
    cleanup.Q.value = 0.5;
    tone.type = "lowpass";
    tone.frequency.value = voice === "bouzouki" ? 4300 : voice === "laouto" ? 3300 : 3100;
    tone.Q.value = 0.55;
    body.type = "peaking";
    body.frequency.value = voice === "bouzouki" ? 330 : voice === "laouto" ? 220 : 185;
    body.Q.value = 0.75;
    body.gain.value = 1.6;
    g.gain.value = gain == null ? 0.24 : gain;
    // The fundamental oscillator exists to give the pluck its body, NOT to
    // sustain. Anything longer reads as a synth drone humming under the chord
    // after the strings have decayed, so it is an attack thump only.
    const thump = Math.min(dur, 0.11);
    fundamental.type = "triangle";
    fundamental.frequency.setValueAtTime(freq, when);
    fundamentalGain.gain.setValueAtTime(0.0001, when);
    fundamentalGain.gain.exponentialRampToValueAtTime(0.05, when + 0.006);
    fundamentalGain.gain.exponentialRampToValueAtTime(0.0001, when + thump);
    src.connect(cleanup); cleanup.connect(tone); tone.connect(body); body.connect(g);
    fundamental.connect(fundamentalGain); fundamentalGain.connect(g); g.connect(master);
    activeSources.push(src, fundamental);
    const untrack = (item) => { activeSources = activeSources.filter((source) => source !== item); };
    src.onended = () => untrack(src);
    fundamental.onended = () => untrack(fundamental);
    src.start(when);
    src.stop(when + dur + 0.05);
    fundamental.start(when);
    fundamental.stop(when + thump + 0.03);
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
    notes.forEach((n, i) => playNoteAt(n.freq, t0 + i * sp, 1.4, voiceGain(1, "sequence"), referenceVoice));
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
  let pathTimers = [];
  function playPath(notes, spacing, opts) {
    ensure();
    stopPath();
    const o = opts || {};
    const sp = spacing == null ? 0.3 : spacing;
    const beatSpacing = Math.max(sp, +o.beatSpacing || sp);
    const countInBeats = Math.max(0, Math.floor(+o.countInBeats || 0));
    const start = ctx.currentTime + 0.06;
    const t0 = start + countInBeats * beatSpacing;
    const pulse = Array.isArray(o.pulse) && o.pulse.length ? o.pulse : [{ first: true }];
    if (o.metronome) {
      for (let beat = 0; beat < countInBeats; beat++) click(start + beat * beatSpacing, !!pulse[beat % pulse.length].first);
      const soundingBeats = Math.max(1, Math.ceil(notes.length * sp / beatSpacing));
      for (let beat = 0; beat < soundingBeats; beat++) click(t0 + beat * beatSpacing, !!pulse[beat % pulse.length].first);
    }
    notes.forEach((n, i) => {
      const silent = o.silentIndices && o.silentIndices.indexOf(i) >= 0;
      const when = t0 + i * sp;
      if (!silent) playNoteAt(n.freq, when, Math.max(0.9, sp * 2.4), voiceGain(1, "path"), o.referenceVoice);
      if (o.onStep) {
        pathTimers.push(setTimeout(() => o.onStep(i, silent), Math.max(0, (when - ctx.currentTime) * 1000)));
      }
    });
    if (o.onDone) {
      pathTimers.push(setTimeout(o.onDone, Math.max(0, (t0 + notes.length * sp - ctx.currentTime) * 1000)));
    }
    return t0 + notes.length * sp;
  }

  function stopPath() { pathTimers.forEach(clearTimeout); pathTimers = []; }

  // Changing exercise must be decisive: clear scheduled callbacks and stop
  // ringing sample voices as well as the transport. This prevents a previous
  // Solo Road/path prompt from continuing underneath a new page or ear test.
  function stopAll() {
    playbackGeneration++;
    stopTransport();
    stopPath();
    activeSources.forEach((source) => { try { source.stop(); } catch { /* already ended */ } });
    activeSources = [];
  }

  function click(when, accent) {
    const t = when == null ? ctx.currentTime : when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = accent ? 2000 : 1400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(accent ? 0.18 : 0.11, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g); g.connect(master);
    track(o);
    o.start(t); o.stop(t + 0.08);
  }

  // The practice ensemble is intentionally simple: it provides functional
  // root motion and a grouped pulse for timing, rather than claiming to be an
  // authentic recording or drum arrangement for any Greek style.
  function track(source) {
    activeSources.push(source);
    source.onended = () => { activeSources = activeSources.filter((item) => item !== source); };
  }

  function bassMidi(pc) {
    // C2–B2: low enough to establish the root but above the sub-heavy range
    // that phone and tablet speakers cannot reproduce clearly.
    return 36 + (((pc % 12) + 12) % 12);
  }

  function playBassAt(pc, when, accent) {
    const t = when == null ? ctx.currentTime + 0.01 : when;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440 * Math.pow(2, (bassMidi(pc) - 69) / 12), t);
    filter.type = "lowpass"; filter.frequency.setValueAtTime(460, t); filter.Q.value = 0.8;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.18 : 0.12, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    osc.connect(filter); filter.connect(gain); gain.connect(master);
    track(osc); osc.start(t); osc.stop(t + 0.46);
  }

  function playKickAt(when, accent) {
    const t = when == null ? ctx.currentTime + 0.01 : when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(accent ? 122 : 92, t);
    osc.frequency.exponentialRampToValueAtTime(46, t + 0.09);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.17 : 0.11, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    osc.connect(gain); gain.connect(master);
    track(osc); osc.start(t); osc.stop(t + 0.15);
  }

  function playTickAt(when, accent) {
    const t = when == null ? ctx.currentTime + 0.01 : when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = accent ? "square" : "triangle";
    osc.frequency.value = accent ? 980 : 1700;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.065 : 0.035, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (accent ? 0.07 : 0.035));
    osc.connect(gain); gain.connect(master);
    track(osc); osc.start(t); osc.stop(t + 0.09);
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
    const lookahead = 0.1;      // s
    const interval = 25;        // ms timer

    function secPerBeat() { return 60 / bpm; }

    const timer = setInterval(() => {
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
    add("studio samples never repitch more than two semitones in the teaching range", true,
      Array.from({ length: 49 }, (_, index) => 36 + index).every((midi) => Math.abs(nearestStudioSample(midi).midi - midi) <= 2));
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
    ensure, ensureRunning, prime, audioStatus, voiceGain, prepareStudioPiano, playReferenceChord, playChord, playSequence, playPrompt, playProgressionPrompt, playPath, stopPath, stopAll, click,
    startTransport, stopTransport, isPlaying,
    studioStatus: () => studioLoadState,
    // Absolute audio-clock time, for callers that schedule multi-part gestures
    // (e.g. the "hear the lean" demo) with sample-accurate downbeats.
    now: () => { ensure(); return ctx.currentTime; },
    setBpm: (v) => transport && transport.setBpm(v),
    setMetronome: (v) => transport && transport.setMetronome(v),
    selfTest
  };
})();
