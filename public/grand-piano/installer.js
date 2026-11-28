// AIK GRAND installer: puts the piano into an FM-1 running SLOOP (2.6 or later) over USB-MIDI, with SLOOP's own
// editor protocol (F0 7D 46 4C cmd args F7; github.com/... SLOOP web/EDITOR_PROTOCOL.md): the sample into an empty
// user sample slot (USR1..USR4), then a user preset "AIK GRAND" that plays it, into an empty preset slot. Nothing that
// is already on the FM-1 is replaced unless the person picks it. `link.req(cmd, args)` sends a request and resolves
// with the reply's bytes after the cmd; the page gives it Web MIDI, the test a command-line bridge.

export const NAME = "AIK GRAND", SAMPLE_NAME = "AIKGRAND";

export function pack7(b) {
  const out = [];
  for (let i = 0; i < b.length; i += 7) {
    const g = b.slice(i, i + 7);
    let hi = 0;
    g.forEach((x, j) => { hi |= ((x >> 7) & 1) << j; });
    out.push(hi, ...Array.from(g, (x) => x & 0x7f));
  }
  return out;
}

const v14 = (x) => { x += 8192; return [x & 127, (x >> 7) & 127]; };
function cstr(a, i) { let j = i; while (a[j] !== 0) j++; return [String.fromCharCode(...a.slice(i, j)), j + 1]; }

/** What's on the FM-1: firmware, parameter count, sample slots and user presets. */
export async function look(link) {
  const info = await link.req(1, []);
  const [version, i] = cstr(info, 0);
  const pCount = info[i + 1];
  const smp = await link.req(15, []);
  const samples = [];
  let k = 2;
  for (let s = 0; s < smp[0]; s++) {
    const zones = smp[k];
    const [name, j] = cstr(smp, k + 1);
    samples.push({ slot: s, zones, name, kib: smp[j] });
    k = j + 1;
  }
  const presets = [];
  for (const start of [0, 16]) {
    const r = await link.req(16, [start, 16]);
    let p = 3;
    for (let n = 0; n < r[1]; n++) {
      const used = r[p], engine = r[p + 1];
      const [name, j] = cstr(r, p + 2);
      presets.push({ slot: r[0] + n, used: !!used, engine, name });
      p = j;
    }
  }
  return { version, pCount, sloop: /SLOOP/i.test(version), samples, presets };
}

/** Where it would go: our own earlier install first (an update), else the first empty slot; null when all are used. */
export function plan(fm1) {
  const smp = fm1.samples.find((s) => s.name.trim().toUpperCase() === SAMPLE_NAME) || fm1.samples.find((s) => !s.zones);
  const pre = fm1.presets.find((p) => p.used && p.name.trim().toUpperCase() === NAME) || fm1.presets.find((p) => !p.used);
  return { sample: smp ? smp.slot : null, preset: pre ? pre.slot : null };
}

/** Writes the sample (hdr 480 bytes, data) into sample slot `smp` and the preset into user preset slot `pre`. */
export async function install(link, files, smp, pre, progress = () => {}) {
  const { hdr, data, sound } = files;
  let r = await link.req(11, [smp]);
  if (r[1] !== 0) throw new Error("The FM-1 would not open the sample slot (" + r[1] + ")");
  for (let off = 0; off < data.length; off += 256) {
    const a = 512 + off;
    r = await link.req(12, [smp, a & 0x7f, (a >> 7) & 0x7f, (a >> 14) & 0x7f, ...pack7(data.slice(off, off + 256))]);
    if (r[4] !== 0) throw new Error("Writing the sample failed at " + a + " (" + r[4] + ")");
    progress(Math.min(1, (off + 256) / data.length) * 0.95);
  }
  r = await link.req(13, [smp, ...pack7(hdr)]);
  if (r[1] !== 0) throw new Error("The FM-1 did not accept the sample (" + r[1] + ")");
  const values = sound.values.slice();
  values[sound.set_id] = 8 + smp;                      // SET: USR1..USR4 come after the 8 built-in sets
  const frame = [pre, sound.engine, ...Array.from(NAME, (c) => c.charCodeAt(0)), 0];
  values.forEach((x) => frame.push(...v14(x)));
  for (let i = 0; i < 32; i++) frame.push(0);
  r = await link.req(18, frame);
  if (r[1] === 3) throw new Error("Stop the song on the FM-1 (press STOP), then try again");
  if (r[1] !== 0) throw new Error("The FM-1 did not save the sound (" + r[1] + ")");
  progress(1);
}

/** Plays it now on the FM-1's selected track (as SAVE > USER > LOAD). */
export async function loadNow(link, pre) {
  const r = await link.req(20, [pre]);
  return r[1] === 0;
}
