/* pitch-lab.js — on-device monophonic pitch detection and sing-back scoring.
 *
 * Uses the YIN difference function / cumulative mean normalized difference
 * described by de Cheveigne and Kawahara (JASA, 2002). The implementation is
 * deliberately dependency-free so the microphone trainer works in the
 * offline PWA and never uploads or records the player's audio.
 */
(function () {
  "use strict";

  const NOTE_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
  const mod12 = (value) => ((value % 12) + 12) % 12;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function frequencyToMidi(frequency) {
    return Number.isFinite(frequency) && frequency > 0
      ? 69 + 12 * Math.log2(frequency / 440)
      : NaN;
  }

  function noteFromFrequency(frequency) {
    const midiFloat = frequencyToMidi(frequency);
    if (!Number.isFinite(midiFloat)) return null;
    const midi = Math.round(midiFloat);
    return {
      frequency,
      midiFloat,
      midi,
      pc: mod12(midi),
      name: NOTE_NAMES[mod12(midi)],
      octave: Math.floor(midi / 12) - 1,
      cents: (midiFloat - midi) * 100
    };
  }

  function rms(input) {
    if (!input || !input.length) return 0;
    let mean = 0;
    for (let i = 0; i < input.length; i++) mean += input[i];
    mean /= input.length;
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      const centered = input[i] - mean;
      sum += centered * centered;
    }
    return Math.sqrt(sum / input.length);
  }

  function createDetector(inputLength, options) {
    const size = Math.max(1024, Math.floor(Number(inputLength) || 4096));
    const settings = Object.assign({ minFrequency: 65, maxFrequency: 1050, threshold: 0.12, minRms: 0.008 }, options || {});
    const difference = new Float32Array(Math.floor(size / 2) + 1);
    const normalized = new Float32Array(difference.length);

    function detect(input, sampleRate) {
      if (!input || input.length !== size || !Number.isFinite(sampleRate) || sampleRate <= 0) {
        return { frequency: 0, clarity: 0, rms: 0, reason: "invalid-input" };
      }
      const level = rms(input);
      if (level < settings.minRms) return { frequency: 0, clarity: 0, rms: level, reason: "quiet" };

      const minTau = Math.max(2, Math.floor(sampleRate / settings.maxFrequency));
      const maxTau = Math.min(difference.length - 2, Math.ceil(sampleRate / settings.minFrequency));
      const comparisons = input.length - maxTau;
      difference.fill(0, 0, maxTau + 1);
      normalized[0] = 1;

      for (let tau = 1; tau <= maxTau; tau++) {
        let sum = 0;
        for (let index = 0; index < comparisons; index++) {
          const delta = input[index] - input[index + tau];
          sum += delta * delta;
        }
        difference[tau] = sum;
      }

      let running = 0;
      for (let tau = 1; tau <= maxTau; tau++) {
        running += difference[tau];
        normalized[tau] = running > 0 ? (difference[tau] * tau) / running : 1;
      }

      let tau = -1;
      for (let candidate = minTau; candidate <= maxTau; candidate++) {
        if (normalized[candidate] < settings.threshold) {
          tau = candidate;
          while (tau + 1 <= maxTau && normalized[tau + 1] < normalized[tau]) tau++;
          break;
        }
      }
      if (tau < 0) {
        let best = minTau;
        for (let candidate = minTau + 1; candidate <= maxTau; candidate++) {
          if (normalized[candidate] < normalized[best]) best = candidate;
        }
        if (normalized[best] > 0.32) return { frequency: 0, clarity: 0, rms: level, reason: "unclear" };
        tau = best;
      }

      const left = normalized[tau - 1];
      const center = normalized[tau];
      const right = normalized[tau + 1];
      const denominator = left - 2 * center + right;
      const adjustment = Math.abs(denominator) > 1e-9 ? clamp((left - right) / (2 * denominator), -1, 1) : 0;
      const refinedTau = tau + adjustment;
      const frequency = sampleRate / refinedTau;
      const clarity = clamp(1 - center, 0, 1);
      if (frequency < settings.minFrequency || frequency > settings.maxFrequency) {
        return { frequency: 0, clarity: 0, rms: level, reason: "out-of-range" };
      }
      return { frequency, clarity, rms: level, reason: "voiced" };
    }

    return { inputLength: size, settings: Object.assign({}, settings), detect };
  }

  function analyzeAgainstTarget(frequency, targetMidi, clarity) {
    const note = noteFromFrequency(frequency);
    if (!note || !Number.isFinite(targetMidi)) return null;
    // Ear training is octave-flexible: a low voice and a high voice can both
    // sing the requested scale degree. Grade against the nearest octave of the
    // target pitch class, not one prescribed vocal register.
    const target = targetMidi + 12 * Math.round((note.midiFloat - targetMidi) / 12);
    const cents = (note.midiFloat - target) * 100;
    const absolute = Math.abs(cents);
    const status = absolute <= 10 ? "locked" : absolute <= 25 ? "close" : absolute <= 50 ? "adjust" : "different-note";
    return {
      note,
      targetMidi: target,
      targetFrequency: midiToFrequency(target),
      cents,
      absoluteCents: absolute,
      clarity: clamp(Number(clarity) || 0, 0, 1),
      status,
      correctPitchClass: absolute <= 50,
      direction: absolute <= 3 ? "center" : cents < 0 ? "flat" : "sharp",
      accuracy: Math.round(clamp(100 - absolute * 2, 0, 100))
    };
  }

  function summarize(readings) {
    const values = (readings || []).filter((reading) => reading && Number.isFinite(reading.cents));
    if (!values.length) return { count: 0, medianCents: 0, spreadCents: 0, stability: 0, accuracy: 0 };
    const ordered = values.map((reading) => reading.cents).sort((a, b) => a - b);
    const median = ordered[Math.floor(ordered.length / 2)];
    const variance = values.reduce((sum, reading) => sum + Math.pow(reading.cents - median, 2), 0) / values.length;
    const spread = Math.sqrt(variance);
    const accuracy = values.reduce((sum, reading) => sum + reading.accuracy, 0) / values.length;
    return {
      count: values.length,
      medianCents: median,
      spreadCents: spread,
      stability: Math.round(clamp(100 - spread * 3, 0, 100)),
      accuracy: Math.round(accuracy)
    };
  }

  function selfTest() {
    const sampleRate = 48000;
    const length = 4096;
    const detector = createDetector(length);
    const results = [];
    const add = (name, pass, detail) => results.push({ name, pass, detail });
    [110, 220, 440, 659.255].forEach((frequency) => {
      const input = new Float32Array(length);
      for (let index = 0; index < length; index++) input[index] = 0.55 * Math.sin(2 * Math.PI * frequency * index / sampleRate);
      const found = detector.detect(input, sampleRate);
      const cents = 1200 * Math.log2(found.frequency / frequency);
      add(`tracks ${frequency.toFixed(3)} Hz`, found.clarity > 0.85 && Math.abs(cents) < 4, `${found.frequency.toFixed(2)} Hz · ${cents.toFixed(2)} cents`);
    });
    const silence = detector.detect(new Float32Array(length), sampleRate);
    add("rejects silence", silence.frequency === 0 && silence.reason === "quiet", silence.reason);
    const octaveFlexible = analyzeAgainstTarget(220, 69, 0.98);
    add("accepts the target in another octave", octaveFlexible.status === "locked" && octaveFlexible.note.name === "A", `${octaveFlexible.cents.toFixed(2)} cents`);
    const wrongDegree = analyzeAgainstTarget(midiToFrequency(59), 69, 0.98);
    add("separates a different scale degree", wrongDegree.status === "different-note" && Math.abs(wrongDegree.cents) > 50, `${wrongDegree.cents.toFixed(2)} cents`);
    return { ok: results.every((result) => result.pass), results };
  }

  window.PitchLab = {
    NOTE_NAMES,
    midiToFrequency,
    frequencyToMidi,
    noteFromFrequency,
    rms,
    createDetector,
    analyzeAgainstTarget,
    summarize,
    selfTest
  };
})();
