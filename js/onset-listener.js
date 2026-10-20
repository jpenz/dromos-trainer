/* onset-listener.js - hear the picking and score the loop (FR-85, step 6).
 *
 * Pure parts (tested in node): an incremental onset detector for plucked
 * strings, a loop scorer that matches heard onsets to the notes the drill
 * expected, and a calibration that measures the round trip from the click
 * to the microphone. The browser part captures the microphone on the SAME
 * audio context as playback, so heard times and scheduled times share one
 * clock, and never connects the microphone to the speakers.
 *
 * Detection: pre-emphasis (first difference) lifts the pick attack over the
 * ringing note; energy per 256-sample hop on a log scale; an onset is a
 * local peak of the positive log-energy rise above a threshold, louder than
 * an adaptive noise floor, at least 60 ms after the last one.
 */
(function () {
  "use strict";

  const HOP = 256;

  function createDetector(options) {
    const opts = Object.assign({ sampleRate: 48000, rise: 1.6, floorRatio: 6, refractory: 0.06 }, options || {});
    let prevSample = 0, hopSum = 0, hopCount = 0, hopIndex = 0;
    let prevLog = null, floor = 1e-6;
    let pending = null;                  // a candidate peak waiting for its right neighbour
    let lastOnset = -Infinity;
    const onsets = [];
    function closeHop(endSample) {
      const energy = hopSum / Math.max(1, hopCount) + 1e-12;
      const log = Math.log(energy);
      // Noise floor follows quiet passages down fast and loud ones up slowly.
      floor = energy < floor ? energy : floor * 1.002 + energy * 0.0004;
      const rise = prevLog == null ? 0 : Math.max(0, log - prevLog);
      prevLog = log;
      const time = (endSample - hopCount) / opts.sampleRate;
      if (pending) {
        if (rise <= pending.rise) {
          if (pending.time - lastOnset >= opts.refractory) { onsets.push(pending.time); lastOnset = pending.time; }
          pending = null;
        } else pending = null;
      }
      if (rise >= opts.rise && energy > floor * opts.floorRatio) pending = { rise, time };
      hopSum = 0; hopCount = 0; hopIndex++;
    }
    // samples: Float32Array; start: absolute sample index of samples[0].
    function feed(samples, start) {
      const before = onsets.length;
      for (let i = 0; i < samples.length; i++) {
        const x = samples[i] - prevSample;
        prevSample = samples[i];
        hopSum += x * x; hopCount++;
        if (hopCount === HOP) closeHop(start + i + 1);
      }
      return onsets.slice(before);
    }
    return { feed, onsets, reset: () => { onsets.length = 0; pending = null; prevLog = null; lastOnset = -Infinity; } };
  }

  function detectOnsets(samples, sampleRate, options) {
    const detector = createDetector(Object.assign({ sampleRate }, options || {}));
    detector.feed(samples, 0);
    return detector.onsets.slice();
  }

  // Match heard onsets to expected note times (seconds, same clock, latency
  // already removed). Each expected note takes the nearest unused onset in
  // its window. Clean = every note heard (one slip allowed in a long loop),
  // at most two stray onsets, and the timing spread inside the tolerance.
  function scoreLoop(onsets, expected, options) {
    const opts = Object.assign({ tolerance: 0.07, spreadLimit: 0.03 }, options || {});
    const used = new Set();
    const offsets = [];
    let missed = 0;
    expected.forEach((time) => {
      let best = -1, gap = Infinity;
      onsets.forEach((onset, index) => {
        if (used.has(index)) return;
        const distance = Math.abs(onset - time);
        if (distance < gap) { gap = distance; best = index; }
      });
      if (best >= 0 && gap <= opts.tolerance) { used.add(best); offsets.push(onsets[best] - time); }
      else missed++;
    });
    const extras = onsets.length - used.size;
    const mean = offsets.length ? offsets.reduce((sum, value) => sum + value, 0) / offsets.length : 0;
    const spread = offsets.length > 1 ? Math.sqrt(offsets.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / (offsets.length - 1)) : 0;
    const allowedMisses = expected.length >= 16 ? 1 : 0;
    const clean = expected.length > 0 && missed <= allowedMisses && extras <= 2 && spread <= opts.spreadLimit;
    return {
      expected: expected.length, hits: offsets.length, missed, extras,
      meanMs: Math.round(mean * 1000), spreadMs: Math.round(spread * 1000), clean,
      reason: clean ? "clean" : missed > allowedMisses ? `${missed} note${missed === 1 ? "" : "s"} not heard` : extras > 2 ? `${extras} extra notes` : `timing spread ${Math.round(spread * 1000)} ms`
    };
  }

  // Round trip from a scheduled click to the microphone: the median gap to
  // the nearest onset after each click, in seconds; null if too few heard.
  function calibrate(clickTimes, onsets) {
    const gaps = [];
    clickTimes.forEach((time) => {
      const after = onsets.filter((onset) => onset >= time - 0.02 && onset <= time + 0.4);
      if (after.length) gaps.push(after[0] - time);
    });
    if (gaps.length < Math.ceil(clickTimes.length * 0.6)) return null;
    gaps.sort((left, right) => left - right);
    return gaps[Math.floor(gaps.length / 2)];
  }

  // A plucked note for tests: a decaying harmonic tone with a noisy attack.
  function synthPluck(buffer, sampleRate, at, freq, level, seed) {
    let state = seed || 1;
    const rnd = () => ((state = (state * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const start = Math.round(at * sampleRate);
    for (let i = 0; i < sampleRate * 0.35 && start + i < buffer.length; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 9);
      const attack = i < sampleRate * 0.004 ? rnd() * 0.5 : 0;
      buffer[start + i] += level * env * (Math.sin(2 * Math.PI * freq * t) + 0.4 * Math.sin(4 * Math.PI * freq * t) + attack);
    }
  }

  function selfTest() {
    const results = [];
    const check = (name, pass, detail) => results.push({ name, pass: !!pass, detail: pass ? "" : detail || "" });
    const rate = 44100;
    const times = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25];
    const buffer = new Float32Array(rate * 3);
    let noise = 7;
    for (let i = 0; i < buffer.length; i++) buffer[i] = (((noise = (noise * 16807) % 2147483647) / 2147483647) - 0.5) * 0.002;
    times.forEach((time, index) => synthPluck(buffer, rate, time, 196 * Math.pow(2, (index % 5) / 12), 0.4, index + 3));
    const heard = detectOnsets(buffer, rate);
    check("every pluck is heard once", heard.length === times.length, `heard ${heard.length}`);
    const worst = Math.max.apply(null, times.map((time) => Math.min.apply(null, heard.map((onset) => Math.abs(onset - time)))));
    check("onsets land within 8 ms of the pluck", worst <= 0.008, `worst ${Math.round(worst * 1000)} ms`);
    const chunked = createDetector({ sampleRate: rate });
    for (let at = 0; at < buffer.length; at += 1024) chunked.feed(buffer.subarray(at, at + 1024), at);
    check("feeding in blocks finds the same onsets", chunked.onsets.length === heard.length && chunked.onsets.every((value, index) => Math.abs(value - heard[index]) < 1e-9));
    const quiet = new Float32Array(rate);
    for (let i = 0; i < quiet.length; i++) quiet[i] = (((noise = (noise * 16807) % 2147483647) / 2147483647) - 0.5) * 0.004;
    check("room noise alone is not a note", detectOnsets(quiet, rate).length === 0, `${detectOnsets(quiet, rate).length} false onsets`);
    const steady = times.map((time, index) => time + 0.012 + (index % 2 ? 0.006 : -0.006));
    check("a steady loop scores clean", scoreLoop(steady, times).clean);
    check("a dropped note is a miss", !scoreLoop(steady.slice(0, -2), times).clean);
    const ragged = times.map((time, index) => time + (index % 2 ? 0.05 : -0.04));
    check("ragged timing is not clean", scoreLoop(ragged, times).reason.startsWith("timing"), scoreLoop(ragged, times).reason);
    check("calibration takes the median round trip", Math.abs(calibrate(times, times.map((time, index) => time + 0.08 + (index === 3 ? 0.2 : 0))) - 0.08) < 1e-9);
    return { ok: results.every((result) => result.pass), results };
  }

  // ---- Browser: the microphone on the playback clock ----------------------
  const WORKLET = `class DromosTap extends AudioWorkletProcessor {
    constructor() { super(); this.buf = new Float32Array(2048); this.n = 0; this.start = 0; }
    process(inputs) {
      const ch = inputs[0] && inputs[0][0];
      if (ch) {
        if (this.n === 0) this.start = currentFrame;
        this.buf.set(ch, this.n); this.n += ch.length;
        if (this.n >= 2048) { this.port.postMessage({ start: this.start, samples: this.buf.slice(0, this.n) }); this.n = 0; }
      }
      return true;
    }
  }
  registerProcessor("dromos-tap", DromosTap);`;

  function createMic() {
    let stream = null, source = null, node = null, detector = null, context = null;
    const heard = [];
    async function start(ctx, deviceId) {
      context = ctx;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !ctx.audioWorklet) throw new Error("unsupported");
      const audio = { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false };
      if (deviceId) audio.deviceId = { exact: deviceId };
      stream = await navigator.mediaDevices.getUserMedia({ audio, video: false });
      const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
      try { await ctx.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }
      source = ctx.createMediaStreamSource(stream);
      node = new AudioWorkletNode(ctx, "dromos-tap", { numberOfInputs: 1, numberOfOutputs: 0 });
      detector = createDetector({ sampleRate: ctx.sampleRate });
      node.port.onmessage = (event) => {
        detector.feed(event.data.samples, event.data.start).forEach((time) => {
          heard.push(time);
          if (heard.length > 600) heard.splice(0, heard.length - 600);
        });
      };
      source.connect(node); // never to the destination: no feedback path
      const track = stream.getAudioTracks()[0];
      return track ? track.label : "microphone";
    }
    function stop() {
      if (source) try { source.disconnect(); } catch (error) { /* already gone */ }
      if (node) { node.port.onmessage = null; try { node.disconnect(); } catch (error) { /* already gone */ } }
      if (stream) stream.getTracks().forEach((track) => track.stop());
      stream = source = node = detector = null; heard.length = 0;
    }
    // Heard onsets between two audio-clock times, latency removed.
    function between(from, to, latency) {
      const shift = latency || 0;
      return heard.map((time) => time - shift).filter((time) => time >= from && time < to);
    }
    return { start, stop, between, active: () => !!stream, heard };
  }

  window.OnsetListener = { HOP, createDetector, detectOnsets, scoreLoop, calibrate, synthPluck, createMic, selfTest };
})();
