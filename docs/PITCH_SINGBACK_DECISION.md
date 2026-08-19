# Pitch sing-back technical decision

Date: 2026-08-17  
Decision: ship a small, on-device monophonic pitch engine for Melody → Harmony; do not add a paid SDK, cloud audio API, CDN dependency, or product analytics collector for microphone frames.

## Outcome first

The learner hears the revealed scale degree, lets the reference stop, then sings it in any comfortable octave. Dromos distinguishes four different facts:

1. **Which note is sounding?** Nearest equal-tempered pitch name and octave.
2. **Is it the requested degree?** Octave-flexible pitch-class comparison.
3. **Is that degree in tune?** Signed cents from the nearest octave of the target.
4. **Is it controlled?** Periodic clarity, rolling pitch stability, and a continuous one-second hold within 25 cents.

This is an ear-training check, not a vocal-quality judgment and not polyphonic transcription. Silence is ignored. A stable wrong note remains a wrong degree.

## Toolkit review

| Option | Fit | Decision |
|---|---|---|
| Native `getUserMedia` + Web Audio | Direct browser input, explicit permission, device constraints, no runtime package | **Use** |
| YIN-style detector | Established low-latency fundamental-frequency method; small enough for the offline PWA | **Use in `js/pitch-lab.js`** |
| [Pitchy](https://github.com/ianprime0509/pitchy) | Excellent 0BSD, pure-ESM McLeod detector and a useful benchmark; would add module/dependency plumbing to this zero-build IIFE app | Do not install now; retain as a replaceable benchmark |
| [Spotify Basic Pitch TS](https://github.com/spotify/basic-pitch-ts) | Strong candidate for future polyphonic *file* transcription, but a TensorFlow model is heavier and higher-latency than live one-note recall needs | Reserve for a later analyzer worker/service |
| [Essentia.js](https://mtg.github.io/essentia.js/docs/api/tutorial-2.%20Real-time%20analysis.html) | Broad WASM music-information-retrieval toolkit | Too broad for one live fundamental |
| D3/graph library | Useful for large data relationships | Not needed for a one-dimensional cents meter and stability bar |
| Animation package | Useful for choreographed multi-element transitions | Native CSS/`requestAnimationFrame` already shares the detector clock and respects reduced motion |
| Product analytics SDK | Could measure exercise starts/completions | Defer pending an explicit privacy/consent decision; never send raw samples, frequencies, device labels, or frame-level pitch data |

The detector follows the difference-function and cumulative-mean-normalized approach described in de Cheveigné and Kawahara's [YIN paper](https://iro.umontreal.ca/~pift6080/H09/documents/papers/yin_pitch_tracker.pdf). The implementation is original, dependency-free code rather than copied package source.

## Browser and hardware boundary

Microphone capture requires a [secure context and user permission](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). The app asks only after the player presses **Enable mic + sing**. After permission, it uses `enumerateDevices()` and the active track's settings/label to report what the browser exposes.

Laptop/desktop browsers commonly expose built-in, AirPods, and class-compliant interface inputs. Safari's capture UI supports device handling, but iPadOS may still choose or expose a system-routed input differently from the connected device. The app therefore reports the browser-selected track and never promises that “AirPods” or “Apollo” is active merely because hardware is connected.

## Privacy and lifecycle contract

- Raw audio is read into one reusable `Float32Array`; it is not recorded, persisted, uploaded, or sent to the coach.
- The media source connects to an analyser only—never to speakers.
- Hearing the target first stops the microphone so the reference cannot score itself.
- Stop, new question, tonic/mode/depth change, navigation, and profile switch stop all media tracks and close the capture audio context.
- Only `{correct, attempts, streak, best}` is saved in the named local profile.
- A failed attempt is recorded only when the player explicitly stops after enough voiced frames; silence is not failure.

## Replaceable boundary

`PitchLab.createDetector()` is the only detector interface the controller consumes. A future package or AudioWorklet implementation can replace the detector if real-device profiling shows a need, while `analyzeAgainstTarget()`, progress semantics, privacy, and UI remain stable.

## Verification

- Pure self-test: four synthetic sung-range tones, silence, octave equivalence, and wrong degree.
- Node regression: 2048-sample live configuration stays within five cents for the synthetic set.
- Shell contracts: every control is wired, every applied class exists, the module is cached offline, and the privacy/feedback-path guard remains present.
- Browser verification: layout, target/reveal lifecycle, permission-bound enable state, input selector, error copy, and navigation cleanup.
