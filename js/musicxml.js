/* musicxml.js — a deliberately small, local MusicXML reader.
 *
 * It accepts uncompressed MusicXML (.musicxml / .xml) exported by notation
 * software. It does not OCR PDFs, infer audio, or open compressed .mxl files:
 * those would make the result look more certain than the source allows.
 */
(function () {
  "use strict";

  const KIND_SUFFIX = {
    major: "", "major-seventh": "maj7", "major-ninth": "maj9",
    minor: "m", "minor-seventh": "m7", "minor-ninth": "m9",
    dominant: "7", "dominant-ninth": "9", "dominant-11th": "11", "dominant-13th": "13",
    diminished: "dim", "half-diminished": "m7♭5", augmented: "aug",
    "suspended-second": "sus2", "suspended-fourth": "sus4"
  };

  function decode(text) {
    return String(text || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  }

  function content(xml, tag) {
    const match = String(xml).match(new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">", "i"));
    return match ? decode(match[1].replace(/<[^>]+>/g, "")) : "";
  }

  function inner(xml, tag) {
    const match = String(xml).match(new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">", "i"));
    return match ? match[1] : "";
  }

  function attr(xml, name) {
    const match = String(xml).match(new RegExp(name + "\\s*=\\s*['\"]([^'\"]*)['\"]", "i"));
    return match ? decode(match[1]) : "";
  }

  function accidental(alter) {
    const value = Number(alter || 0);
    return value === -2 ? "♭♭" : value === -1 ? "♭" : value === 1 ? "♯" : value === 2 ? "♯♯" : "";
  }

  function readHarmony(block) {
    const root = inner(block, "root");
    const step = content(root, "root-step").toUpperCase();
    if (!/^[A-G]$/.test(step)) return null;
    const kindMatch = String(block).match(/<kind([^>]*)>([\s\S]*?)<\/kind>/i);
    const kindName = kindMatch ? decode(kindMatch[2]).toLowerCase() : "major";
    const printed = kindMatch ? attr(kindMatch[1], "text") : "";
    const suffix = printed || KIND_SUFFIX[kindName] || "";
    return step + accidental(content(root, "root-alter")) + suffix;
  }

  function readNote(block) {
    if (/<rest(?:\s|\/|>)/i.test(block) || /<unpitched(?:\s|\/|>)/i.test(block)) return null;
    const pitch = inner(block, "pitch");
    const step = content(pitch, "step").toUpperCase();
    if (!/^[A-G]$/.test(step)) return null;
    return step + accidental(content(pitch, "alter"));
  }

  function titleFor(xml) {
    return content(xml, "movement-title") || content(xml, "work-title") || content(xml, "creator") || "Imported MusicXML study";
  }

  /* Produces just enough notation information for transparent analysis. The
   * first harmony written before a group of notes owns that group; no claimed
   * chord means no claimed harmony. */
  function parseMusicXml(xml) {
    const source = String(xml || "");
    if (!/<score-partwise\b/i.test(source)) {
      return { ok: false, code: "not-musicxml", message: "Choose an uncompressed, partwise MusicXML (.musicxml or .xml) score exported from notation software." };
    }
    const parts = source.match(/<part(?:\s+[^>]*)?>[\s\S]*?<\/part>/gi) || [];
    // Full scores often repeat chord symbols across staves. Read the part with
    // the most written harmony events, rather than silently doubling a song map.
    const scorePart = parts.reduce((best, part) => {
      const count = (part.match(/<harmony\b/gi) || []).length;
      const bestCount = (best.match(/<harmony\b/gi) || []).length;
      return count > bestCount ? part : best;
    }, parts[0] || "");
    const measures = scorePart.match(/<measure\b[^>]*>[\s\S]*?<\/measure>/gi) || [];
    const sequence = [];
    let active = null;
    measures.forEach((measure, measureIndex) => {
      const tokenPattern = /<harmony\b[^>]*>[\s\S]*?<\/harmony>|<note\b[^>]*>[\s\S]*?<\/note>/gi;
      let token;
      while ((token = tokenPattern.exec(measure))) {
        if (/^<harmony\b/i.test(token[0])) {
          const chord = readHarmony(token[0]);
          if (!chord) continue;
          active = { chord, notes: [], measure: attr(measure, "number") || String(measureIndex + 1) };
          sequence.push(active);
        } else {
          const note = readNote(token[0]);
          if (note && active) active.notes.push(note);
        }
      }
    });
    const chords = sequence.map((entry) => entry.chord);
    const lineSegments = sequence.filter((entry) => entry.notes.length)
      .map((entry) => entry.chord + ": " + entry.notes.join(" "));
    if (!chords.length) {
      return {
        ok: false, code: "no-harmony", title: titleFor(source),
        message: "This score has no MusicXML harmony symbols. Add/export chord symbols, or paste the chord map and note fragment manually."
      };
    }
    return {
      ok: true,
      title: titleFor(source),
      chordMap: chords.join(" "),
      lineText: lineSegments.join(" | "),
      measureCount: measures.length,
      harmonyCount: chords.length,
      notesAnnotated: lineSegments.reduce((total, segment) => total + segment.split(":")[1].trim().split(/\s+/).length, 0),
      message: "Read " + chords.length + " harmony event" + (chords.length === 1 ? "" : "s") + " from " + measures.length + " measure" + (measures.length === 1 ? "" : "s") + "."
    };
  }

  function selfTest() {
    const fixture = `<?xml version="1.0"?><score-partwise><work><work-title>Minor pull</work-title></work><part id="melody"><measure number="1"><harmony><root><root-step>D</root-step></root><kind>minor</kind></harmony><note><pitch><step>A</step></pitch></note><note><pitch><step>C</step></pitch></note><harmony><root><root-step>A</root-step></root><kind>dominant</kind></harmony><note><pitch><step>C</step><alter>1</alter></pitch></note></measure></part><part id="guitar"><measure number="1"><harmony><root><root-step>D</root-step></root><kind>minor</kind></harmony></measure></part></score-partwise>`;
    const imported = parseMusicXml(fixture);
    const results = [
      { name: "MusicXML reads chord symbols in score order", pass: imported.ok && imported.chordMap === "Dm A7", detail: imported.chordMap || "" },
      { name: "MusicXML preserves sharp melodic targets", pass: imported.lineText.includes("A7: C♯"), detail: imported.lineText || "" },
      { name: "MusicXML ignores duplicate accompaniment-staff harmony", pass: imported.harmonyCount === 2, detail: String(imported.harmonyCount || 0) },
      { name: "non-MusicXML files are rejected transparently", pass: !parseMusicXml("not a score").ok, detail: "no OCR or audio guess" }
    ];
    return { ok: results.every((result) => result.pass), results };
  }

  window.MusicXmlImport = { parseMusicXml, selfTest };
})();
