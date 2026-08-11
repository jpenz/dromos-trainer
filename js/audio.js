/* audio.js — Karplus-Strong guitar pluck + simple bar transport.
 * No external libs. Exposes window.AudioEngine.
 */
(function () {
  "use strict";

  let ctx = null;
  let master = null;
  const bufCache = new Map();

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
  function pluckBuffer(freq, dur) {
    const key = Math.round(freq) + ":" + dur;
    if (bufCache.has(key)) return bufCache.get(key);
    const sr = ctx.sampleRate;
    const N = Math.max(2, Math.round(sr / freq));
    const len = Math.floor(dur * sr);
    const buf = ctx.createBuffer(1, len, sr);
    const y = buf.getChannelData(0);
    const noise = new Float32Array(N);
    for (let i = 0; i < N; i++) noise[i] = Math.random() * 2 - 1;
    const decay = 0.996;      // string sustain
    const blend = 0.5;
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
    const b = pluckBuffer(freq, dur);
    const src = ctx.createBufferSource();
    src.buffer = b;
    const g = ctx.createGain();
    g.gain.value = gain == null ? 0.5 : gain;
    src.connect(g); g.connect(master);
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

  // ---- Transport ----------------------------------------------------------
  // Drives chord changes bar-by-bar with a lookahead scheduler.
  let transport = null;

  function startTransport(cfg) {
    ensure();
    stopTransport();
    const beatsPerBar = 4;
    let bpm = cfg.bpm;
    let bar = 0;
    let beatInBar = 0;
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
          if (chord.notes && chord.notes.length && cfg.strumStyle) {
            playChord(chord.notes, cfg.strumStyle, nextTime);
          }
        }
        if (cfg.metronome) click(nextTime, beatInBar === 0);
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
    ensure, playChord, click,
    startTransport, stopTransport, isPlaying,
    setBpm: (v) => transport && transport.setBpm(v),
    setMetronome: (v) => transport && transport.setMetronome(v)
  };
})();
