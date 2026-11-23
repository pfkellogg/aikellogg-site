// sweeten.js: "Sweeten", what a good stereo does to a sound: a little warmth and air, soft tape saturation, a slow
// stereo chorus for width, and a small room. The same recipe as the apps' Sweeten (FM-1 Big Screen). Web Audio:
// everything goes into `input`; on, it goes through the chain, off, straight out (a short crossfade either way).
export function makeSweeten(ac) {
  const input = ac.createGain();
  const out = ac.createGain();
  out.connect(ac.destination);

  // off: straight through
  const dry = ac.createGain();
  input.connect(dry).connect(out);

  // on: tone -> saturation -> (itself + chorus + room)
  const wet = ac.createGain();
  wet.gain.value = 0;
  const low = ac.createBiquadFilter();
  low.type = "lowshelf"; low.frequency.value = 200; low.gain.value = 2.5;      // warmth
  const air = ac.createBiquadFilter();
  air.type = "highshelf"; air.frequency.value = 6000; air.gain.value = 2;      // air
  const sat = ac.createWaveShaper();
  const curve = new Float32Array(1024), k = 1.4;
  for (let i = 0; i < curve.length; i++) { const x = (i / (curve.length - 1)) * 2 - 1; curve[i] = Math.tanh(k * x) / Math.tanh(k); }
  sat.curve = curve; sat.oversample = "2x";
  input.connect(low).connect(air).connect(sat);

  const merger = ac.createChannelMerger(2);
  const body = ac.createGain(); body.gain.value = 0.82;                        // the sound itself, both sides
  sat.connect(body); body.connect(merger, 0, 0); body.connect(merger, 0, 1);

  // chorus: a slowly moving short delay on each side, the two moving differently (width)
  [[0.012, 0.0015, 0.33, 0], [0.015, 0.0018, 0.27, 1]].forEach(([base, depth, rate, side]) => {
    const d = ac.createDelay(0.05); d.delayTime.value = base;
    const lfo = ac.createOscillator(); lfo.frequency.value = rate;
    const amt = ac.createGain(); amt.gain.value = depth;
    lfo.connect(amt).connect(d.delayTime); lfo.start();
    const g = ac.createGain(); g.gain.value = 0.38;
    sat.connect(d).connect(g).connect(merger, 0, side);
  });

  // a small room: a made-up impulse (decaying noise, different on each side, darker as it fades), 1.1 s
  const conv = ac.createConvolver();
  const len = Math.floor(ac.sampleRate * 1.1), ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const ch = ir.getChannelData(c); let lp = 0, seed = 1234 + c * 777;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 * 2 - 1; };
    const pre = Math.floor(ac.sampleRate * 0.012);
    for (let i = pre; i < len; i++) {
      const t = (i - pre) / ac.sampleRate, a = 0.5 + 0.45 * Math.min(1, t / 0.6);   // darker as it fades
      lp = lp * a + rnd() * (1 - a);
      ch[i] = lp * Math.exp(-t / 0.28);
    }
  }
  conv.buffer = ir; conv.normalize = true;
  const room = ac.createGain(); room.gain.value = 0.22;
  sat.connect(conv).connect(room).connect(merger);
  merger.connect(wet).connect(out);

  return {
    input,
    setOn(on) {
      const t = ac.currentTime;
      dry.gain.setTargetAtTime(on ? 0 : 1, t, 0.03);
      wet.gain.setTargetAtTime(on ? 0.9 : 0, t, 0.03);
    },
  };
}
