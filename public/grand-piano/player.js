// AIK GRAND in the browser: the same sample slot the FM-1 gets (aik-grand.hdr / .bin), decoded here (IMA ADPCM,
// as SLOOP plays it), so a click on a key sounds as the FM-1 does: the nearest of the 8 notes, re-pitched, its tail
// looped, fading like SLOOP's envelope (DEC), and let go when the key is.

const IMA_STEP = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97,
  107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963,
  1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484,
  7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];
const IMA_IDX = [-1, -1, -1, -1, 2, 4, 6, 8];

function decode(bytes, n) {
  const out = new Float32Array(n);
  let pred = 0, idx = 0;
  for (let i = 0; i < n; i++) {
    const nib = (bytes[i >> 1] >> ((i & 1) * 4)) & 15;
    const st = IMA_STEP[idx];
    let d = st >> 3;
    if (nib & 4) d += st;
    if (nib & 2) d += st >> 1;
    if (nib & 1) d += st >> 2;
    pred = Math.max(-32768, Math.min(32767, nib & 8 ? pred - d : pred + d));
    idx = Math.max(0, Math.min(88, idx + IMA_IDX[nib & 7]));
    out[i] = pred / 32768;
  }
  return out;
}

export class Grand {
  constructor() { this.ctx = null; this.zones = []; this.voices = new Map(); }

  async load() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const [hdr, data] = await Promise.all([fetch("aik-grand.hdr"), fetch("aik-grand.bin")].map((p) => p.then((r) => r.arrayBuffer())));
    const h = new DataView(hdr), bytes = new Uint8Array(data);
    const count = h.getUint8(6);
    const rate = 22050;
    this.out = this.ctx.createGain();
    this.out.gain.value = 0.9;
    this.out.connect(this.ctx.destination);
    for (let k = 0; k < count; k++) {
      const o = 32 + 28 * k;
      const off = h.getUint32(o, true), n = h.getUint32(o + 4, true), ls = h.getUint32(o + 8, true), le = h.getUint32(o + 12, true);
      const root = h.getInt16(o + 20, true) / 16, lo = h.getUint8(o + 25), hi = h.getUint8(o + 26);
      const pcm = decode(bytes.subarray(off), n);
      const buf = this.ctx.createBuffer(1, n, rate);
      buf.copyToChannel(pcm, 0);
      this.zones.push({ buf, root, lo, hi, ls: ls / rate, le: le / rate });
    }
  }

  down(midi) {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.up(midi, 0.05);
    const z = this.zones.find((z) => midi >= z.lo && midi <= z.hi) || this.zones[0];
    const src = this.ctx.createBufferSource();
    src.buffer = z.buf;
    src.playbackRate.value = 2 ** ((midi - z.root) / 12);
    src.loop = true; src.loopStart = z.ls; src.loopEnd = z.le;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.7, t);
    g.gain.setTargetAtTime(0, t + 0.9, 1.6);        // the long piano fade (SLOOP's DEC on a looped tail)
    src.connect(g).connect(this.out);
    src.start();
    this.voices.set(midi, { src, g });
  }

  up(midi, fade = 0.25) {
    const v = this.voices.get(midi);
    if (!v) return;
    const t = this.ctx.currentTime;
    v.g.gain.cancelScheduledValues(t);
    v.g.gain.setValueAtTime(v.g.gain.value, t);
    v.g.gain.setTargetAtTime(0, t, fade / 3);
    v.src.stop(t + fade * 2);
    this.voices.delete(midi);
  }
}
