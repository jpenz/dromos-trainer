/* songs.js — the repertoire library: songs and their charts (FR-64).
 *
 * A chart is stored the way a working band writes one: sections, bars, and
 * chords, plus an optional lyric sheet with chords inline. The parser is the
 * contract — charts are authored in the same bracket notation used on paper
 * and in setlist apps, so a chart can be typed or pasted rather than coded.
 *
 * Notation understood by parseChart / parseLyrics:
 *   [Dm]          a chord
 *   [Dm!]         a stab / hit
 *   [^Gm]         an accented entry
 *   [Dm ---]      hold: each dash is one extra bar
 *   [A - B]       two chords sharing one bar
 *   [|]           an explicit section break
 *   |             bar separator inside a section line
 * Pure data + logic, no DOM. Exposes window.SongLibrary.
 */
(function () {
  "use strict";

  // ---- chord text normalisation ----------------------------------------
  // Charts in the wild mix ˚ ° dim, M7 maj7 Δ, aug +. Normalise for analysis
  // but always keep the author's own spelling for display: a player reads
  // their chart, not our canonical form.
  function normaliseChord(raw) {
    let s = String(raw || "").trim();
    if (!s) return "";
    s = s.replace(/[˚°]/g, "dim").replace(/Δ/g, "maj7");
    s = s.replace(/M7/g, "maj7").replace(/majmaj7/g, "maj7");
    s = s.replace(/\+/g, "aug");
    s = s.replace(/♭/g, "b").replace(/♯/g, "#");
    return s;
  }

  // The root pitch class, so a chart can be transposed and analysed.
  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function rootPcOf(raw) {
    const s = normaliseChord(raw);
    const m = /^([A-G])([b#]*)/.exec(s);
    if (!m) return null;
    let pc = LETTER_PC[m[1]];
    for (const ch of m[2]) pc += ch === "b" ? -1 : 1;
    return ((pc % 12) + 12) % 12;
  }

  // ---- token parsing ----------------------------------------------------
  function parseToken(inner) {
    const raw = String(inner || "").trim();
    if (!raw || raw === "|") return { kind: "break" };
    let text = raw;
    const accent = text.startsWith("^");
    if (accent) text = text.slice(1).trim();
    // trailing dashes are held bars: "Dm ---" holds three extra bars
    let holdBars = 0;
    const hold = /\s*(-{2,})\s*$/.exec(text);
    if (hold) { holdBars = hold[1].length; text = text.slice(0, hold.index).trim(); }
    // "A - B - C" is several chords inside one bar
    const parts = text.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
    const chords = parts.map((part) => {
      const stab = part.endsWith("!");
      const label = stab ? part.slice(0, -1).trim() : part;
      return { label, stab, normalised: normaliseChord(label), rootPc: rootPcOf(label) };
    });
    return { kind: "bar", accent, holdBars, chords };
  }

  // A section line: "[Dm - E♭ - Dm - Cm]   [Dm!]" -> bars
  function parseChartLine(line) {
    const bars = [];
    const re = /\[([^\]]*)\]/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      const token = parseToken(m[1]);
      if (token.kind === "break") { bars.push({ kind: "break" }); continue; }
      bars.push(token);
      for (let i = 0; i < token.holdBars; i++) bars.push({ kind: "hold" });
    }
    return bars;
  }

  // A lyric line: "[Dm!]Τα μαύρα [Gm]μάτια σου" -> segments of chord+text
  function parseLyricLine(line) {
    const segments = [];
    const re = /\[([^\]]*)\]/g;
    let last = 0, m;
    while ((m = re.exec(line)) !== null) {
      const before = line.slice(last, m.index);
      if (before) segments.push({ chord: null, text: before });
      const token = parseToken(m[1]);
      segments.push({
        chord: token.kind === "bar" ? token.chords.map((c) => c.label).join(" – ") : "|",
        stab: token.kind === "bar" && token.chords.some((c) => c.stab),
        text: ""
      });
      last = re.lastIndex;
    }
    const tail = line.slice(last);
    if (tail) segments.push({ chord: null, text: tail });
    // fold each chord marker onto the text that follows it
    const folded = [];
    segments.forEach((seg) => {
      if (seg.chord != null) { folded.push({ chord: seg.chord, stab: !!seg.stab, text: "" }); return; }
      if (folded.length && folded[folded.length - 1].text === "") { folded[folded.length - 1].text = seg.text; return; }
      folded.push({ chord: null, stab: false, text: seg.text });
    });
    return folded;
  }

  // Every distinct chord in a chart, in order of first appearance — this is
  // what gets handed to the analyzer, so it stays the song's own vocabulary.
  function chordVocabulary(song) {
    const seen = new Set();
    const out = [];
    (song.sections || []).forEach((section) => {
      (section.bars || []).forEach((bar) => {
        (bar.chords || []).forEach((chord) => {
          if (!chord.label || seen.has(chord.label)) return;
          seen.add(chord.label);
          out.push(chord);
        });
      });
    });
    return out;
  }

  function chordMap(song) {
    return chordVocabulary(song).map((c) => c.normalised).join(" ");
  }

  function barCount(song) {
    return (song.sections || []).reduce((sum, section) =>
      sum + (section.bars || []).filter((b) => b.kind !== "break").length, 0);
  }

  // ---- the library ------------------------------------------------------
  // Charts are authored as text so they read like the paper chart they came
  // from. buildSong() parses them once at load.
  const SOURCES = [
    {
      id: "ta-mavra-matia-sou",
      title: "Ta Mavra Matia Sou",
      titleGreek: "Τα Μαύρα Μάτια Σου",
      composer: "Vassilis Tsitsanis",
      arrangement: "Latin arrangement",
      credit: "Band chart supplied by the player. Lyrics are the original song's; this app stores them for personal rehearsal use.",
      home: "D",
      meter: "4/4",
      feel: "Latin",
      // What the chart's own vocabulary says, not a claim about the song:
      // Cm is a MINOR ♭VII and E♭ is a ♭II — both Usak markers — while A7,
      // D7, F7 and C7 are functional dominants from the Westernized layer.
      note: "D minor family. The chart's Cm (minor ♭VII) and E♭ (♭II) are Usak markers; the secondary dominants (A7, D7, F7, C7) are the Westernized laiko layer on top.",
      sections: [
        { name: "Opening", tempo: "accelerando",
          lines: ["[Dm - E♭ - Dm - Cm]  [Dm!]"] },
        { name: "Instrumental", repeat: "x2",
          lines: [
            "[Dm!] | [Gm] | [F♯aug] | [Gm7] | [E˚/C7]",
            "[E♭maj7] | [E♭maj6♭5] | [Dm7] | [B♭maj7 - Cm7] | [Dm - Gm7]"
          ],
          alternates: "Repeat changes: E♭maj6♭5 (x2) · Fmaj7–B♭maj7 · G7" },
        { name: "Chorus", repeat: "x2",
          lines: [
            "[Dm!] | [Gm] | [Gm] | [Gm7] | [Gm7]",
            "[E♭maj7] | [E♭maj6♭5] | [Dm7] | [B♭maj7 - Cm7] | [Dm - Gm7]"
          ],
          alternates: "Repeat changes: Gm7 · C7" },
        { name: "Verse 1",
          lines: [
            "[Dm!] | [Cm - Cm7] | [A˚7] | [F7 - D7] | [Gm7 - C7]",
            "[E♭maj7] | [F!] | [F - E♭ - Dm - Cm] | [Dm - Dm!]"
          ],
          alternates: "Repeat changes: Gm7 · C7",
          cue: "then Chorus x1, Instrumental x1" },
        { name: "Bridge", repeat: "instrumental + ritardando",
          lines: [
            "[Dm!] | [Gm!] | [F! - E♭!] | [Dm] | [Gm7]",
            "[Gm7] | [Gm7] | [E♭maj7] | [F - Dm] | [Cm - Dm]"
          ] },
        { name: "Ending",
          lines: [
            "[Dm - Dm - E♭ - F] | [Gm - F - B♭ - Cm] | [Dm ---]",
            "[Gm ---]"
          ] }
      ],
      lyricSections: [
        { name: "Verse", lines: [
          "[Dm!]Τα μαύρα [Gm]μάτια σου, [F♯aug]όταν τα βλέπω με ζαλ[Gm7]ίζουνε [C7]",
          "και την καρδιά μου συγκλον[E♭maj7]ίζουνε [F/E♭]",
          "όταν τα βλέπω μου θυμ[Dm7]ίζουνε",
          "[B♭]κάποια αγ[Cm]άπη μου παλ[Dm]ιά  [Gm - Dm!]"
        ] },
        { name: "Chorus", lines: [
          "Μέσα στα [Cm]μάτια [Cm7]σου [A˚]κοιτάζω εκείνη που αγα[F7 - D7 - Gm7]πούσα μέχρι χτες",
          "Εκείνη που [C7]άνοιξε στα στή[E♭maj7]θια μου πλη[F]γές",
          "Τα μαύρα [F]μάτια [E♭]σου μ' αν[Dm]άβουν [Cm]πυρκα[Dm]γιές  [Dm!]"
        ] }
      ]
    }
  ];

  function buildSong(source) {
    const sections = (source.sections || []).map((section, index) => ({
      id: `${source.id}-${index}`,
      name: section.name,
      repeat: section.repeat || "",
      alternates: section.alternates || "",
      cue: section.cue || "",
      bars: section.lines.flatMap((line) => parseChartLine(line)),
      lines: section.lines.map((line) => parseChartLine(line))
    }));
    const lyricSections = (source.lyricSections || []).map((section) => ({
      name: section.name,
      lines: section.lines.map((line) => parseLyricLine(line))
    }));
    return Object.assign({}, source, { sections, lyricSections });
  }

  const SONGS = SOURCES.map(buildSong);
  const byId = (id) => SONGS.find((song) => song.id === id) || null;

  function selfTest() {
    const results = [];
    const add = (name, pass) => results.push({ name, pass });
    add("at least one song ships", SONGS.length >= 1);
    add("song ids are unique", new Set(SONGS.map((s) => s.id)).size === SONGS.length);

    const song = byId("ta-mavra-matia-sou");
    add("the shipped song parses", !!song && song.sections.length === 6);
    add("every section has bars", song.sections.every((s) => s.bars.length > 0));

    // The opening bar is a four-chord bar followed by a stab.
    const opening = song.sections[0].bars.filter((b) => b.kind !== "break");
    add("a multi-chord bar keeps all its chords", opening[0].chords.length === 4);
    add("chord labels survive verbatim", opening[0].chords[1].label === "E♭");
    add("a stab is flagged", opening[1].chords[0].stab === true);

    // Held bars expand: "[Dm ---]" is the chord plus three held bars.
    const ending = song.sections[5];
    add("held bars expand into real bars", ending.bars.filter((b) => b.kind === "hold").length === 6);

    // Normalisation feeds the analyzer without rewriting the display label.
    add("unicode flats normalise for analysis", normaliseChord("E♭maj7") === "Ebmaj7");
    add("degree circles normalise", normaliseChord("A˚") === "Adim");
    add("augmented normalises", normaliseChord("F♯aug") === "F#aug");
    add("root pitch classes resolve", rootPcOf("E♭maj7") === 3 && rootPcOf("F♯aug") === 6 && rootPcOf("B♭") === 10);

    // Lyrics keep chord-over-word alignment.
    const verse = song.lyricSections[0].lines[0];
    add("lyric chords fold onto the following words",
      verse[0].chord === "Dm" && /Τα μαύρα/.test(verse[0].text));
    add("lyric stabs survive", verse[0].stab === true);

    // The vocabulary handed to the analyzer is the song's own chords.
    const vocab = chordVocabulary(song);
    add("vocabulary is deduplicated and ordered", vocab[0].label === "Dm" && new Set(vocab.map((c) => c.label)).size === vocab.length);
    add("chord map is analyzer-ready", /^Dm Eb /.test(chordMap(song)));
    add("bar count is real", barCount(song) > 30);
    return { ok: results.every((r) => r.pass), results };
  }

  window.SongLibrary = {
    SONGS, byId, buildSong, parseChartLine, parseLyricLine,
    normaliseChord, rootPcOf, chordVocabulary, chordMap, barCount, selfTest
  };
})();
