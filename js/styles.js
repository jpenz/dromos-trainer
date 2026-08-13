/* styles.js — Greek pulse/style curriculum data, independent of the UI.
 * A dance feel is not a dromos. Every style deliberately keeps the harmonic
 * choice open, so a player learns pulse and melodic function as separate maps.
 */
(function () {
  "use strict";

  const FOUNDATION = [
    {
      id: "hear",
      title: "Hear and sing first",
      detail: "Before the hand moves, sing a two- to four-beat answer and feel where it resolves. The instrument checks the ear; it does not choose the phrase for you."
    },
    {
      id: "landmarks",
      title: "See compact landmarks",
      detail: "Know the nearest triad, its 3rd, and the next landing note. A small three-string object is more useful under pressure than a large anonymous scale box."
    },
    {
      id: "travel",
      title: "Travel through a frame",
      detail: "Use a pentatonic or dromos tetrachord as the route between landmarks. Safe notes create motion; chord tones make the change audible."
    },
    {
      id: "motif",
      title: "Make one idea develop",
      detail: "Say a short phrase, leave room, then answer it with a changed ending, rhythm, or register. This is stronger than stacking unrelated licks."
    },
    {
      id: "touch",
      title: "Let touch serve the line",
      detail: "Slides, vibrato, accents, pull-offs, and bends are syllables of a melodic sentence. Use only the ornaments that preserve the dromos and the pulse."
    },
    {
      id: "pulse",
      title: "Feel the dance before filling it",
      detail: "Count and clap the grouped pulse, then play a sparse accompaniment. Add a solo answer only after the groove remains clear without it."
    }
  ];

  // The initial maps are derived from the user's supplied study material. They
  // describe pulse and accompaniment role, never a compulsory scale or song.
  const STYLES = [
    {
      id: "zeibekiko",
      title: "Zeibekiko",
      greek: "Ζεϊμπέκικο",
      meter: "9/4",
      beats: 9,
      groups: [2, 2, 2, 3],
      pulse: "2 + 2 + 2 + 3",
      character: "Weighted and spacious. Give the dancer and vocal line room; make arrivals feel inevitable rather than busy.",
      comp: "First hold the pulse with sparse bass/triad answers. Then practise both monó (old) and dipló (new) feels as separate right-hand studies.",
      phrase: "Place a short answer across one group, then let the final three-beat group carry the resolution.",
      route: "Choose the dromos from the song map—Zeibekiko can carry Minor, Hijaz, Ussak, and other colours."
    },
    {
      id: "kalamatianos",
      title: "Kalamatianos",
      greek: "Καλαματιανός",
      meter: "7/8",
      beats: 7,
      groups: [3, 2, 2],
      pulse: "3 + 2 + 2",
      character: "Forward-moving and dance-led. The long first group sets the stride; do not flatten it into straight eighths.",
      comp: "Clap the 3 + 2 + 2 grouping, then add one clean chord response per group before adding fills.",
      phrase: "Make a three-unit question, then answer it in the two shorter groups without rushing the turn.",
      route: "Pair the pulse with the song's dromos and a local triad path; the meter tells you where the phrase breathes."
    },
    {
      id: "hasapiko",
      title: "Hasapiko",
      greek: "Χασάπικο",
      meter: "4/4",
      beats: 4,
      groups: [2, 2],
      pulse: "2 + 2",
      character: "A clear, even walking feel. Precision and shared pulse matter more than decorative density.",
      comp: "Make the downbeats dependable; use close triads as brief replies rather than continuous strumming.",
      phrase: "Use a two-beat motif, repeat it, then alter only the landing note when the chord changes.",
      route: "Start with a simple progression map, then add a dromos flavour note only where it belongs melodically."
    },
    {
      id: "tsifteteli",
      title: "Tsifteteli",
      greek: "Τσιφτετέλι",
      meter: "4/4",
      beats: 4,
      groups: [2, 2],
      pulse: "2 + 2",
      character: "A supple, sustained groove. The line should sit in the pocket and use space as part of its expression.",
      comp: "Learn the right-hand pulse alone first; only then place a short chord-tone response over it.",
      phrase: "Favour a sung, ornamented answer that resolves before the next strong pulse rather than a scalar run.",
      route: "Let the selected song map decide the dromos; keep the rhythmic identity separate from the note collection."
    },
    {
      id: "roumba",
      title: "Roumba",
      greek: "Ρούμπα",
      meter: "4/4",
      beats: 4,
      groups: [2, 2],
      pulse: "2 + 2",
      character: "A buoyant dance pulse with a clear accompaniment job. The groove needs to remain audible when the lead enters.",
      comp: "Practise the pulse without melody, then add economical triad responses at phrase boundaries.",
      phrase: "Use call-and-response: leave the first answer simple, and make the second answer explain the next chord.",
      route: "Use the Song Map for the tune's harmonic route; use this map for where a phrase belongs in time."
    }
  ];

  function byId(id) {
    return STYLES.find((style) => style.id === id) || STYLES[0];
  }

  function beatMap(style) {
    let beat = 1;
    return style.groups.flatMap((size, groupIndex) => Array.from({ length: size }, (_, index) => ({
      beat: beat++, group: groupIndex + 1, first: index === 0, size
    })));
  }

  function selfTest() {
    const results = [];
    const check = (name, pass, detail) => results.push({ name, pass, detail: detail || "" });
    STYLES.forEach((style) => {
      const total = style.groups.reduce((sum, value) => sum + value, 0);
      check(style.id + " pulse totals " + style.beats, total === style.beats, style.pulse);
      check(style.id + " has a separate dromos route", /dromos|Song Map/i.test(style.route), style.route);
      check(style.id + " exposes every beat", beatMap(style).length === style.beats, String(beatMap(style).length));
    });
    check("foundation has function, phrase, and pulse", ["hear", "landmarks", "motif", "pulse"].every((id) => FOUNDATION.some((item) => item.id === id)));
    return { ok: results.every((result) => result.pass), results };
  }

  window.StyleLibrary = { FOUNDATION, STYLES, byId, beatMap, selfTest };
})();
