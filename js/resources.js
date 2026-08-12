/* resources.js — researched, linkable study shelves. These are references and
 * curriculum connections, never scans, copied notation, audio, or a claim of
 * endorsement by an author.
 */
(function () {
  "use strict";

  const TRIGAS = [
    {
      title: "Method for three-string bouzouki · five-book course",
      focus: "Progressive 3-course technique, notation, scales, rhythm, ornaments, chord analysis, dromoi and taxim. The verified course is three core volumes plus two song companions.",
      use: "Use as the trichordo technical spine: clean pick/fingering first, then ornament, accompaniment and improvisation—not isolated licks.",
      href: "https://www.trigas.gr/en/book_categories/novel-teaching-methods-for-the-three-string-bouzouki/"
    },
    {
      title: "Method for four-string bouzouki · five-book course",
      focus: "The corresponding 4-course integrated course: three core volumes plus two companions, progressing through technique, theory and repertoire.",
      use: "Use as the tetrachordo route. The app’s chord maps and position-aware shapes should support, not replace, its instrument-specific technical sequence.",
      href: "https://www.trigas.gr/en/book_categories/novel-teaching-methods-for-the-four-string-bouzouki/"
    },
    {
      title: "Volume 3 / advanced material",
      focus: "Odd meters, accompaniment rhythms, taxim, dromoi and their harmony, chord forms, advanced technique, dynamics and fingering.",
      use: "Direct input to the app’s Time/Form → Map → Route → Touch pyramid and its Greek pulse work.",
      href: "https://www.trigas.gr/en/book/methodos-gia-trichordo-bouzouki-no-3/"
    },
    {
      title: "2 Instrumentals for three-string bouzouki",
      focus: "A written/recorded virtuoso instrumental study collection with technical instructions usable on three- and four-course bouzouki.",
      use: "Treat a purchased/owned score as an ideal score-import case study: map form, targets, ornaments and position choices measure by measure.",
      href: "https://www.trigas.gr/en/book/vangelis-trigkas-12-organika-gia-trichordo-bouzouki/"
    },
    {
      title: "Song and instrumental collection series",
      focus: "Verified site categories include rebetika/folk, old folk, artistic folk/folk and archodorembetika collections; the official biography reports a wider 39-book body of work.",
      use: "Use legally owned selections as listening/transcription assignments. The app stores only your analysis, not a copied repertoire database.",
      href: "https://www.trigas.gr/en/book_categories/en-sylloges-tragoudion-diaforon-syntheton/"
    }
  ];

  const OTHER = [
    {
      title: "Manolis Michalakis · Folk scales and improvisations",
      focus: "Folk scales, harmonization, technique, phrases, positions, improvisation and repertoire.",
      use: "Strong complement for the app’s dromos map, phrase route and position choices.",
      href: "https://www.manolismichalakis.gr/en/books-2/"
    },
    {
      title: "Manolis Michalakis · Chords in Bouzouki",
      focus: "Triads and 4-note/extended chords all over the neck, harmonic cycles, melody harmonization and folk rhythm accompaniment.",
      use: "Direct companion for Triads, chord charts and harmonic-song analysis.",
      href: "https://www.manolismichalakis.gr/en/books-2/"
    },
    {
      title: "Thanasis Polykandriotis · It’s easy to learn Bouzouki (+CD)",
      focus: "A modern method with notation, folk modes and recorded examples.",
      use: "Use the recordings for hear–sing–map work; source material remains with the purchased method.",
      href: "https://www.nakas.gr/en/proionta/mousika-vivlia/methodoi/methodoi-gia-bouzouki-baglamas/"
    },
    {
      title: "Charalampos Pagiatis · Greek folk scales / How to play bouzouki",
      focus: "Dromoi and practical bouzouki instruction.",
      use: "Reference shelf for modal vocabulary; compare its descriptions with the app’s explicit, testable interval maps.",
      href: "https://fagottobooks.gr/en/60-oi-laikoi-dromoi-kai-i-praktiki-efarmogi-tous.html"
    },
    {
      title: "Hal Leonard · Greek Bouzouki Method",
      focus: "Tuning, notation/tab, single-note melody, chords, alternate picking, ornament, modes, positions, tremolo, double stops and Greek meters.",
      use: "A broad English-language reference; it reinforces the technique + repertoire feedback loop.",
      href: "https://www.halleonard.com/product/viewproduct.action?digitalbook=true&itemid=291974"
    }
  ];

  // This older community index is useful for finding public lesson channels,
  // backing-track references and discussion links. The app deliberately does
  // not surface its unverified scans, downloads, or recordings as curriculum
  // material; users must confirm rights for anything outside public embeds.
  const COMMUNITY = [
    {
      title: "The Bouzouki Learning Website · public lesson index",
      focus: "A community directory that groups RIALAS, Tomer Avizov, Thanos Corner, Savvas Chrysanthou and Ramazouki lesson pages.",
      use: "Source for Video Study’s linked public YouTube lessons. Loop a short passage, then return here to name its key, targets and technique.",
      href: "https://mpouzouki.weebly.com/bouzouki-lessons.html"
    },
    {
      title: "The Bouzouki Learning Website · backing-track index",
      focus: "A directory of external rhythm/backing-track providers.",
      use: "Use only a legally accessible track. First map its harmony in Song Map, then practise a single target-note line in the correct pulse.",
      href: "https://mpouzouki.weebly.com/backing-tracks.html"
    },
    {
      title: "The Bouzouki Learning Website · useful links",
      focus: "Community links to forums, teachers and learning sites.",
      use: "A discovery index, not an endorsement. Check the original publisher and rights before following any score, tab, recording or download.",
      href: "https://mpouzouki.weebly.com/links.html"
    }
  ];

  function selfTest() {
    const all = TRIGAS.concat(OTHER, COMMUNITY);
    const results = all.map((item) => ({ name: item.title + " has a source and curriculum use", pass: /^https:\/\//.test(item.href) && !!item.focus && !!item.use, detail: item.href }));
    return { ok: results.every((result) => result.pass), results };
  }

  window.ResourceLibrary = { TRIGAS, OTHER, COMMUNITY, selfTest };
})();
