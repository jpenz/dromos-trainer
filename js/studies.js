/* studies.js — user-authorised starter excerpts from the supplied study library.
 * These are analysis prompts, not complete arrangements, scores, audio, or lyrics.
 */
(function () {
  "use strict";

  const STUDIES = [
    {
      id: "paliatzis",
      title: "Ο Παλιατζής · Paliatzis",
      style: "Zeibekiko",
      tonic: "D",
      modeId: "hijaz",
      chords: "D E♭ Gm Cm D",
      focus: "D Hijaz: hear the tonic, ♭II friction, iv colour, and ♭VII return without mistaking the dance feel for the dromos itself.",
      source: "User-authorised Greek Music Notes study library"
    },
    {
      id: "apopse",
      title: "Απόψε μ’ εγκατέλειψες · harmony excerpt",
      style: "Zeibekiko",
      tonic: "A",
      modeId: "minor",
      chords: "Am/E Bm7♭5 Am/C Gmaj9/F Emaj7 Am",
      focus: "An advanced A-minor/bass-motion excerpt. The analyzer reads the upper harmony; use the written bass study to hear why each inversion changes the pull.",
      source: "User-authorised Nikos Gyras study library"
    },
    {
      id: "tsigaro",
      title: "Τσιγάρο ατέλειωτο · Tsigaro Ateleioto",
      style: "Roumba",
      tonic: "B",
      modeId: "ousak",
      chords: "Bm Em Am C",
      focus: "A B Ussak study starter: separate the Roumba pulse from the melodic ♭2 colour, then identify how the chord loop supports the phrase.",
      source: "User-authorised Greek Music Notes study library"
    }
  ];

  function byId(id) { return STUDIES.find((study) => study.id === id) || STUDIES[0]; }

  function selfTest() {
    const results = STUDIES.map((study) => ({
      name: study.id + " has a complete analysis starter",
      pass: !!(study.title && study.style && study.tonic && study.modeId && study.chords && study.focus && study.source),
      detail: study.chords
    }));
    return { ok: results.every((result) => result.pass), results };
  }

  window.StudyLibrary = { STUDIES, byId, selfTest };
})();
