// flute.js: the Mellotron flute, made from scratch: the v7 recipe of FM-1 Big Screen's Mellotron
// (tools/make_mellotron_flute.py in pfkellogg/fm1-mirror-spyglass-android), every number a setting.
// makeNote(settings, midi) -> Float32Array, 8 s at 44.1 kHz, one tape strip. Pure: the same settings always give the
// same strip (seeded randomness), so a settings code is a whole flute.

export const RATE = 44100, SECONDS = 8, LOW = 43, HIGH = 77;

// name: [default (v7), min, max, step, group, label, help]
export const PARAMS = {
  h2Low:      [1.45, 0, 2.5, 0.05, "Tone", "Reedy: 2nd harmonic, low notes", "The real low flute notes are reedy: their 2nd and 3rd harmonics are as strong as the note itself."],
  h2Mid:      [0.45, 0, 2, 0.05, "Tone", "2nd harmonic, middle", ""],
  h2High:     [0.16, 0, 1.5, 0.02, "Tone", "2nd harmonic, high notes", "High notes are purer."],
  h3Low:      [1.65, 0, 2.5, 0.05, "Tone", "3rd harmonic, low notes", ""],
  h3Mid:      [0.55, 0, 2, 0.05, "Tone", "3rd harmonic, middle", ""],
  h3High:     [0.30, 0, 1.5, 0.02, "Tone", "3rd harmonic, high notes", ""],
  upper:      [1.0, 0, 2.5, 0.05, "Tone", "Upper harmonics (4th to 8th)", "Brightness, mostly in the low notes."],
  wood:       [0.30, 0, 1.5, 0.05, "Tone", "Wood (hollow body resonance)", "A soft resonance around 600-1200 Hz."],
  top:        [8000, 2500, 14000, 100, "Tone", "Tape top (Hz)", "Where the old tape loses its highs: lower is darker."],
  saturation: [1.6, 0.1, 5, 0.1, "Tone", "Tape saturation", "Warmth and compression from the tape."],
  breath:     [0.16, 0, 0.6, 0.01, "Breath", "Breath", "Air inside the tone, close around the note."],
  breathLow:  [2.9, 0, 5, 0.1, "Breath", "Breath, low notes (x)", "The real low notes are much breathier."],
  breathMid:  [1.35, 0, 4, 0.05, "Breath", "Breath, middle (x)", ""],
  breathHigh: [1.35, 0, 4, 0.05, "Breath", "Breath, high notes (x)", ""],
  air:        [0.12, 0, 1, 0.01, "Breath", "Open air (800-3500 Hz)", ""],
  highAir:    [0.007, 0, 0.05, 0.001, "Breath", "High air (6-12 kHz)", "A touch of sparkle; too much sounds like hiss."],
  chiff:      [0.18, 0, 1, 0.01, "Breath", "Chiff (breathy start)", "The little puff at the start of each note."],
  vibRate:    [5.25, 2, 9, 0.05, "Vibrato", "Vibrato speed (per second)", "The real Mellotron flute player: about 5.3."],
  vibLow:     [8.5, 0, 30, 0.5, "Vibrato", "Vibrato depth, low notes (cents)", ""],
  vibHigh:    [12.8, 0, 30, 0.5, "Vibrato", "Vibrato depth, high notes (cents)", "The real one deepens with pitch."],
  vibUneven:  [0.07, 0, 0.3, 0.01, "Vibrato", "Vibrato unevenness", "A player's vibrato is never quite even."],
  vibDelay:   [0.15, 0, 1.5, 0.05, "Vibrato", "Vibrato comes in after (s)", ""],
  tremLow:    [0.36, 0, 0.8, 0.01, "Vibrato", "Breath pulse, low notes", "The vibrato pulses the loudness too: a breath vibrato."],
  tremHigh:   [0.20, 0, 0.8, 0.01, "Vibrato", "Breath pulse, high notes", ""],
  wowCents:   [2.1, 0, 15, 0.1, "Tape", "Tape wow (cents)", "Slow pitch drift of the tape (0.55 and 1.3 per second)."],
  flutter:    [1.0, 0, 5, 0.1, "Tape", "Tape flutter (x)", "Quick wobble from the capstan (7 and 11 per second)."],
  scoopCents: [10.4, 0, 60, 0.5, "Tape", "Scoop (cents flat at the start)", "The tape coming up to speed."],
  attack:     [0.12, 0.005, 1, 0.005, "Attack", "Attack (s)", "How long a note takes to speak."],
  swell:      [3.0, 0, 6, 0.1, "Attack", "Swell (s, low notes)", "Low notes swell in like a player's crescendo."],
  swellDepth: [0.45, 0, 0.9, 0.05, "Attack", "Swell depth", "How soft a low note starts before it swells."],
  levelSlope: [4.0, -6, 12, 0.5, "Character", "Low notes softer by (dB)", "The real low notes are about 4 dB softer."],
  tuneSd:     [2.3, 0, 15, 0.1, "Character", "Tuning scatter (cents)", "Each strip a little out of tune its own way."],
  character:  [1.0, 0, 3, 0.05, "Character", "Note-to-note differences (x)", "How much each strip's vibrato, breath and level differ."],
  seed:       [1, 1, 999, 1, "Character", "Seed (a different take)", "Another set of takes with the same recipe."],
};
export function defaults() {
  const d = {};
  for (const k in PARAMS) d[k] = PARAMS[k][0];
  return d;
}

// ---- randomness, seeded so a settings code is a whole flute
function rng(seed) {
  let a = seed >>> 0;
  const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let spare = null;
  const n = () => {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let x = 0, y = 0, r = 0;
    do { x = u() * 2 - 1; y = u() * 2 - 1; r = x * x + y * y; } while (r === 0 || r >= 1);
    const m = Math.sqrt(-2 * Math.log(r) / r); spare = y * m; return x * m;
  };
  return { u, n };
}

// ---- filters (Butterworth biquads, as scipy's butter(2, ...) + lfilter)
function biquad(x, b0, b1, b2, a1, a2) {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}
function lp2(x, hz) {
  hz = Math.min(hz, RATE * 0.49);
  const k = Math.tan(Math.PI * hz / RATE), q = Math.SQRT1_2, nrm = 1 / (1 + k / q + k * k);
  return biquad(x, k * k * nrm, 2 * k * k * nrm, k * k * nrm, 2 * (k * k - 1) * nrm, (1 - k / q + k * k) * nrm);
}
function hp2(x, hz) {
  hz = Math.min(hz, RATE * 0.49);
  const k = Math.tan(Math.PI * hz / RATE), q = Math.SQRT1_2, nrm = 1 / (1 + k / q + k * k);
  return biquad(x, nrm, -2 * nrm, nrm, 2 * (k * k - 1) * nrm, (1 - k / q + k * k) * nrm);
}
const bandpass = (x, lo, hi) => lp2(hp2(x, lo), Math.min(hi, RATE * 0.49));
function noise(r, n) { const x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = r.n(); return x; }
function peakNorm(x) { let m = 1e-9; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); for (let i = 0; i < x.length; i++) x[i] /= m; return x; }
const interp3 = (h, a, b, c) => h <= 0.5 ? a + (b - a) * (h / 0.5) : b + (c - b) * ((h - 0.5) / 0.5);

/** One tape strip: MIDI note `midi` (43-77) with settings `s` (missing ones: v7's). */
export function makeNote(s, midi) {
  s = Object.assign(defaults(), s || {});
  const n = RATE * SECONDS, TAU = 2 * Math.PI;
  const hi = Math.min(1, Math.max(0, (midi - 50) / 27));
  const seed = (s.seed | 0) * 7919;
  const me = rng(seed + 1000 + midi);                     // this strip's own character
  const r = rng(seed + 50000 + midi * 31);                // its phases and noises
  const ch = s.character;
  const tune = Math.max(-5 * Math.max(1, s.tuneSd / 2.3), Math.min(5 * Math.max(1, s.tuneSd / 2.3), me.n() * s.tuneSd));
  const f0 = 440 * Math.pow(2, (midi - 69 + tune / 100) / 12);
  const p1 = r.u() * TAU, p2 = r.u() * TAU, p3 = r.u() * TAU, p4 = r.u() * TAU, p5 = r.u() * TAU;
  const rate0 = s.vibRate * (1 + me.n() * 0.023 * ch), vphase0 = r.u() * TAU;
  const vibC = (s.vibLow + (s.vibHigh - s.vibLow) * hi) * (1 + me.n() * 0.12 * ch);
  const wow = s.wowCents / 1731, scoop = -s.scoopCents / 1731;
  const h2 = interp3(hi, s.h2Low, s.h2Mid, s.h2High), h3 = interp3(hi, s.h3Low, s.h3Mid, s.h3High), U = s.upper;
  const amps = [1, h2, h3, U * (0.85 - 0.7 * hi), U * (0.75 - 0.68 * hi), U * (0.5 - 0.44 * hi), U * (0.32 - 0.27 * hi), U * (0.2 - 0.16 * hi)];
  const hp = amps.map(() => r.u() * TAU);
  let ampSum = 0; for (const a of amps) ampSum += a;
  const breathAmt = s.breath * interp3(hi, s.breathLow, s.breathMid, s.breathHigh) * (1 + me.n() * 0.12 * ch);
  const swell = s.swell * (1 - hi) * (0.5 + me.u() * 0.9);
  const trem = s.tremLow + (s.tremHigh - s.tremLow) * hi;
  const levelDb = -s.levelSlope * (1 - hi) + me.n() * 0.6 * ch;

  // pitch, vibrato and the tone
  const tone = new Float32Array(n), level = new Float32Array(n), att = new Float32Array(n);
  let phase = 0, vph = vphase0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const vrate = rate0 * (1 + s.vibUneven * Math.sin(TAU * 0.29 * t + p5));
    vph += TAU * vrate / RATE;
    const vdepth = 0.4 + 0.6 * Math.min(1, Math.max(0, (t - s.vibDelay) / 0.5));
    const vib = vibC / 1731 * vdepth * Math.sin(vph);
    const wv = wow * Math.sin(TAU * 0.55 * t + p1) + wow * 0.4 * Math.sin(TAU * 1.3 * t + p2);
    const fl = s.flutter * (0.0006 * Math.sin(TAU * 7.0 * t + p3) + 0.0003 * Math.sin(TAU * 11.3 * t + p4));
    phase += TAU * f0 * (1 + scoop * Math.exp(-t / 0.06) + wv + fl + vib) / RATE;
    let v = 0;
    for (let k = 0; k < 8; k++) if ((k + 1) * f0 < 14000) v += amps[k] * Math.sin((k + 1) * phase + hp[k]);
    tone[i] = v;
    const a = Math.pow(Math.min(1, t / s.attack), 1.6) * (1 - s.swellDepth * (1 - hi) * (1 - Math.pow(Math.min(1, t / Math.max(swell, 1e-3)), 0.7)));
    att[i] = a;
    const pulse = 1 + trem * vdepth * Math.sin(vph - 0.6);
    level[i] = a * pulse * (1 + 0.02 * Math.sin(TAU * 7.0 * t + p3));
  }
  // breath inside the tone (narrow bands on the first harmonics), open air, high air, chiff
  const breath = new Float32Array(n);
  for (const [k, g] of [[1, 1], [2, 0.6], [3, 0.35], [4, 0.3 * (1 - hi)], [5, 0.25 * (1 - hi)]]) {
    if (k * f0 >= 14000 || g <= 0) continue;
    const b = bandpass(noise(r, n), k * f0 * 0.93, Math.min(k * f0 * 1.07, 15000));
    for (let i = 0; i < n; i++) breath[i] += g * b[i];
  }
  peakNorm(breath);
  const air = peakNorm(bandpass(noise(r, n), 800, 3500));
  const highAir = peakNorm(bandpass(noise(r, n), 6000, 12000));
  const chiff = peakNorm(bandpass(noise(r, n), Math.min(f0 * 2, 8000), Math.min(f0 * 6, 12000)));
  let x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    x[i] = tone[i] / ampSum * level[i] + (breathAmt * breath[i] + 0.12 * breathAmt * air[i] * (s.air / 0.12)) * att[i]
      + s.highAir * (1.2 - 0.8 * hi) * highAir[i] * att[i] + s.chiff * chiff[i] * Math.exp(-t / 0.04) * Math.min(1, t / 0.01);
  }
  peakNorm(x);
  // wood, tape saturation, the tape's top, nothing under the note (no thud)
  const w = bandpass(x, 600, 1200);
  for (let i = 0; i < n; i++) x[i] += s.wood * w[i];
  let m = 1e-9; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(x[i]));
  const sat = Math.max(0.05, s.saturation), th = Math.tanh(sat);
  for (let i = 0; i < n; i++) x[i] = Math.tanh(sat * x[i] / m) / th;
  x = lp2(x, s.top);
  x = hp2(x, Math.max(f0 * 0.6, 40));
  peakNorm(x);
  const gain = 0.7 * Math.pow(10, levelDb / 20);
  for (let i = 0; i < n; i++) x[i] *= gain * Math.min(1, (SECONDS - i / RATE) / 0.35);   // the strip running out
  return x;
}

// ---- settings codes: "MF1." + the settings that differ from v7, compact
const KEYS = Object.keys(PARAMS);
export function encode(s) {
  const parts = [];
  KEYS.forEach((k, i) => { if (s[k] !== undefined && Math.abs(s[k] - PARAMS[k][0]) > 1e-9) parts.push(i.toString(36) + "=" + (+s[k].toFixed(4))); });
  return "MF1." + (parts.length ? parts.join("_") : "v7");
}
export function decode(code) {
  const s = defaults();
  code = (code || "").trim().replace(/^.*#/, "");
  if (!code.startsWith("MF1.")) throw new Error("That isn't a Flute Lab code (they start with MF1.)");
  const body = code.slice(4);
  if (body && body !== "v7") for (const p of body.split("_")) {
    const [i, v] = p.split("=");
    const k = KEYS[parseInt(i, 36)];
    if (!k || isNaN(+v)) throw new Error("Part of that code can't be read: " + p);
    const [, lo, hi] = PARAMS[k];
    s[k] = Math.min(hi, Math.max(lo, +v));
  }
  return s;
}

