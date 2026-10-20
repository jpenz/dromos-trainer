/* neck-hdr.js - the lit neck (FR-85): ebony grain, nickel-silver frets,
 * wound strings that cast a shadow, pearl inlays, glossy note dots and a
 * glow on the playing note. Shared by every fretboard in the app.
 *
 * Everything is vector or drawn once at screen resolution, so it stays sharp
 * on 4K screens. Note colours come from CSS custom properties, so wide-gamut
 * (Display-P3) screens get the richer pigments and HDR screens the brighter
 * glow without any change here.
 */
(function () {
  "use strict";

  let grainURL = null;

  // Ebony: dark brown with long, slightly wavy grain lines and a vignette
  // at the edges of the board. Seeded, so the board looks the same each load.
  function grain() {
    if (grainURL) return grainURL;
    if (typeof document === "undefined") return "";
    const w = 1600, h = 360;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const g = canvas.getContext && canvas.getContext("2d");
    if (!g) return "";
    const base = g.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, "#2A1C13"); base.addColorStop(0.45, "#1B120C"); base.addColorStop(1, "#24170F");
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 700; i++) {
      const y = rnd() * h, alpha = 0.025 + rnd() * 0.07, amp = rnd() * 2.6, freq = 0.002 + rnd() * 0.01, phase = rnd() * 6;
      g.strokeStyle = rnd() < 0.55 ? `rgba(130,88,56,${alpha})` : `rgba(6,4,3,${alpha * 1.4})`;
      g.lineWidth = 0.4 + rnd() * 1.7;
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= w; x += 20) g.lineTo(x, y + Math.sin(x * freq + phase) * amp);
      g.stroke();
    }
    const vignette = g.createLinearGradient(0, 0, 0, h);
    vignette.addColorStop(0, "rgba(0,0,0,0.45)"); vignette.addColorStop(0.18, "rgba(0,0,0,0)");
    vignette.addColorStop(0.82, "rgba(0,0,0,0)"); vignette.addColorStop(1, "rgba(0,0,0,0.5)");
    g.fillStyle = vignette; g.fillRect(0, 0, w, h);
    try { grainURL = canvas.toDataURL("image/png"); } catch (error) { grainURL = ""; }
    return grainURL;
  }

  // Gradient and filter definitions, ids prefixed so two boards can coexist.
  function defs(p) {
    const tint = (name, light, dark) => `<radialGradient id="${p}${name}" cx=".35" cy=".3" r=".75"><stop offset="0" style="stop-color: color-mix(in oklab, var(${light}), white 42%)"/><stop offset="1" style="stop-color: color-mix(in oklab, var(${dark}), black 22%)"/></radialGradient>`;
    return `<defs>
      <linearGradient id="${p}Fret" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#5E5952"/><stop offset=".45" stop-color="#F4F0E8"/><stop offset=".6" stop-color="#C9C3B8"/><stop offset="1" stop-color="#4E4A44"/></linearGradient>
      <linearGradient id="${p}Nut" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#CFC4AE"/><stop offset=".5" stop-color="#FBF5E8"/><stop offset="1" stop-color="#B8AC94"/></linearGradient>
      <linearGradient id="${p}Str" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#77716A"/><stop offset=".42" stop-color="#FFFFFF"/><stop offset="1" stop-color="#8A847A"/></linearGradient>
      <radialGradient id="${p}Pearl" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#FFF9EE"/><stop offset=".45" stop-color="#D6EAF2"/><stop offset=".75" stop-color="#F0D9EA"/><stop offset="1" stop-color="#BFB6A6"/></radialGradient>
      <radialGradient id="${p}Tonic" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" style="stop-color: color-mix(in oklab, var(--pearl), #8E8678 30%)"/></radialGradient>
      ${tint("Lower", "--aegean", "--aegean")}
      ${tint("Upper", "--laurel", "--laurel")}
      ${tint("Third", "--c-third", "--c-third")}
      ${tint("Fifth", "--c-fifth", "--c-fifth")}
      ${tint("Seventh", "--c-seventh", "--c-seventh")}
      ${tint("Now", "--terracotta", "--terracotta")}
      <filter id="${p}Glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="${p}Shadow" x="-5%" y="-200%" width="110%" height="500%"><feGaussianBlur stdDeviation="1.6"/></filter>
      <filter id="${p}DotShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2.5" stdDeviation="2.2" flood-color="#000" flood-opacity=".6"/></filter>
    </defs>`;
  }

  window.NeckHDR = { grain, defs };
})();
