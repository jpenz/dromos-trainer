/* audio.js — voiced Karplus-Strong pluck + simple bar transport.
 * No external libs. Exposes window.AudioEngine.
 */
(function () {
  "use strict";

  let ctx = null;
  let master = null;
  const bufCache = new Map();
  let activeSources = [];

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
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
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
    const decay = voice === "bouzouki" ? 0.9945 : voice === "laouto" ? 0.9955 : 0.997;
    const blend = voice === "bouzouki" ? 0.43 : voice === "laouto" ? 0.47 : 0.52;
    for (let i = 0; i < len; i++) {
      if (i < N) { y[i] = noise[i]; }
      else { y[i] = decay * blend * (y[i - N] + y[i - N + 1]); }
    }
    // gentle overall fade so tails don't click
    const fade = Math.floor(len * 0.15);
    for (let i = 0; i < fade; i++) y[len - 1 - i] *= i / fade;
    bufCache.set(key, buf);
    return buf;
  }

  function playNoteAt(freq, when, dur, gain) {
    const voice = instrumentVoice();
    const b = pluckBuffer(freq, dur, voice);
    const src = ctx.createBufferSource();
    src.buffer = b;
    const g = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    const body = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = voice === "bouzouki" ? 4400 : voice === "laouto" ? 3600 : 3000;
    tone.Q.value = 0.55;
    body.type = "peaking";
    body.frequency.value = voice === "bouzouki" ? 260 : voice === "laouto" ? 190 : 150;
    body.Q.value = 0.9;
    body.gain.value = voice === "bouzouki" ? 2.5 : 3.5;
    g.gain.value = gain == null ? 0.5 : gain;
    src.connect(tone); tone.connect(body); body.connect(g); g.connect(master);
    activeSources.push(src);
    src.onended = () => { activeSources = activeSources.filter((item) => item !== src); };
    src.start(when);
    src.stop(when + dur + 0.05);
  }

  // Strum a chord (array of {freq}). style: "strum" | "arp" | "block"
  function playChord(notes, style, when) {
    ensure();
    const t0 = when == null ? ctx.currentTime + 0.01 : when;
    const dur = 2.2;
    const spread = style === "arp" ? 0.14 : style === "block" ? 0 : 0.035;
    notes.forEach((n, i) => {
      playNoteAt(n.freq, t0 + i * spread, dur, 0.5 - i * 0.03);
    });
  }

  // Play the map's melodic line. The Recall drill uses it alongside a coherent
  // cadence so the learner can hear both harmonic function and modal colour.
  function playSequence(notes, spacing, when) {
    ensure();
    const sp = spacing == null ? 0.26 : spacing;
    const t0 = when == null ? ctx.currentTime + 0.02 : when;
    notes.forEach((n, i) => playNoteAt(n.freq, t0 + i * sp, 1.4, 0.45));
    return t0 + notes.length * sp;
  }

  // Chord progression then a descending run — the full ear-training prompt.
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
  function playProgressionPrompt(chords, bpm) {
    ensure();
    const spb = 60 / (bpm || 84);
    let t = ctx.currentTime + 0.08;
    for (let pass = 0; pass < 2; pass++) {
      chords.forEach((chord) => { playChord(chord.notes, "strum", t); t += spb * 1.5; });
      t += spb * 0.45;
    }
  }

  // Play a path/cell note-by-note with UI sync. `silentFrom` leaves a gap where
  // the target note would sound — that silence is the audiation drill (FR-23).
  let pathTimers = [];
  function playPath(notes, spacing, opts) {
    ensure();
    stopPath();
    const o = opts || {};
    const sp = spacing == null ? 0.3 : spacing;
    const t0 = ctx.currentTime + 0.06;
    notes.forEach((n, i) => {
      const silent = o.silentIndices && o.silentIndices.indexOf(i) >= 0;
      const when = t0 + i * sp;
      if (!silent) playNoteAt(n.freq, when, Math.max(0.9, sp * 2.4), 0.5);
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
    g.gain.exponentialRampToValueAtTime(accent ? 0.35 : 0.2, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g); g.connect(master);
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
    gain.gain.exponentialRampToValueAtTime(accent ? 0.34 : 0.23, t + 0.012);
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
    gain.gain.exponentialRampToValueAtTime(accent ? 0.28 : 0.18, t + 0.003);
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
    gain.gain.exponentialRampToValueAtTime(accent ? 0.09 : 0.045, t + 0.002);
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
            playChord(chord.notes, cfg.strumStyle, nextTime);
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

  window.AudioEngine = {
    ensure, playChord, playSequence, playPrompt, playProgressionPrompt, playPath, stopPath, stopAll, click,
    startTransport, stopTransport, isPlaying,
    setBpm: (v) => transport && transport.setBpm(v),
    setMetronome: (v) => transport && transport.setMetronome(v)
  };
})();
