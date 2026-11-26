// Play.jsx: play FM-1 Big Screen's Mellotron-style sounds from an FM-1 (or any MIDI keyboard) right in the browser,
// nothing to install. Chrome and Edge talk to the FM-1 over USB (Web MIDI); the sounds' strips (one 8-second tape strip
// per key, G2..F5, FLAC) come from pfkellogg.github.io/fm1-sounds, fetched once and kept by the browser.
import { useCallback, useEffect, useRef, useState } from "react";
import { makeSweeten } from "../lab/sweeten.js";

const BASE = "https://pfkellogg.github.io/fm1-sounds/";
const LOW = 43, HIGH = 77;
const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const noteName = (m) => NAMES[m % 12] + (Math.floor(m / 12) - 1);
const BLACK = new Set([1, 3, 6, 8, 10]);
const KEYMAP = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72, o: 73, l: 74, p: 75, ";": 76, "'": 77,
  z: 48, x: 50, c: 52, v: 53, b: 55, n: 57, m: 59 };
// a note outside the strips' range: the nearest octave inside it
const fold = (m) => { while (m < LOW) m += 12; while (m > HIGH) m -= 12; return m; };

export default function Play() {
  const [list, setList] = useState(null);
  const [sound, setSound] = useState(() => localStorage.getItem("playSound") || "flute");
  const [loaded, setLoaded] = useState(0);          // strips of the current sound ready (of 35)
  const [midiStatus, setMidiStatus] = useState("");
  const [sweet, setSweet] = useState(() => localStorage.getItem("sweeten") === "1");
  const [volume, setVolume] = useState(0.8);
  const [sounding, setSounding] = useState(new Set());
  const ac = useRef(null), master = useRef(null), sweetRef = useRef(null);
  const buffers = useRef({});                         // "id/043" -> AudioBuffer
  const voices = useRef(new Map());                   // midi -> { src, gain }
  const soundRef = useRef(sound);

  useEffect(() => {
    fetch(BASE + "index.json").then((r) => r.json()).then((j) => setList(j.sounds)).catch(() => setList([]));
  }, []);

  const audio = useCallback(() => {
    if (!ac.current) {
      ac.current = new (window.AudioContext || window.webkitAudioContext)();
      sweetRef.current = makeSweeten(ac.current);
      master.current = ac.current.createGain();
      master.current.gain.value = volume;
      master.current.connect(sweetRef.current.input);
      sweetRef.current.setOn(sweet);
    }
    if (ac.current.state === "suspended") ac.current.resume();
    return ac.current;
  }, [volume, sweet]);

  // the sound's 35 strips, six at a time (the browser keeps them for next time)
  const load = useCallback(async (id) => {
    const ctx = audio();
    const keys = [];
    for (let m = LOW; m <= HIGH; m++) keys.push(m);
    let done = keys.filter((m) => buffers.current[`${id}/${m}`]).length;
    setLoaded(done);
    const queue = keys.filter((m) => !buffers.current[`${id}/${m}`]);
    const worker = async () => {
      while (queue.length) {
        const m = queue.shift();
        try {
          const data = await (await fetch(`${BASE}sounds/${id}/${String(m).padStart(3, "0")}.flac`)).arrayBuffer();
          buffers.current[`${id}/${m}`] = await ctx.decodeAudioData(data);
        } catch { /* (one strip missing: that key stays silent) */ }
        if (soundRef.current === id) setLoaded(++done);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
  }, [audio]);

  const pick = (id) => {
    setSound(id);
    soundRef.current = id;
    localStorage.setItem("playSound", id);
    load(id);
  };

  const noteOn = useCallback((midi, vel = 100) => {
    const ctx = audio(), m = fold(midi);
    const buf = buffers.current[`${soundRef.current}/${m}`];
    if (!buf) return;
    const old = voices.current.get(midi);
    if (old) { old.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03); old.src.stop(ctx.currentTime + 0.2); }
    const src = ctx.createBufferSource(), gain = ctx.createGain();
    src.buffer = buf;
    src.playbackRate.value = 2 ** ((midi - m) / 12);   // a note outside G2..F5: its octave's strip, at its own pitch
    gain.gain.value = 0.35 + 0.65 * (vel / 127);
    src.connect(gain).connect(master.current);
    src.start();
    src.onended = () => { if (voices.current.get(midi)?.src === src) { voices.current.delete(midi); setSounding((s) => { const n = new Set(s); n.delete(midi); return n; }); } };
    voices.current.set(midi, { src, gain });
    setSounding((s) => new Set(s).add(midi));
  }, [audio]);

  const noteOff = useCallback((midi) => {
    const v = voices.current.get(midi), ctx = ac.current;
    if (!v || !ctx) return;
    v.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);        // a Mellotron's quick, soft release
    v.src.stop(ctx.currentTime + 0.5);
    voices.current.delete(midi);
    setSounding((s) => { const n = new Set(s); n.delete(midi); return n; });
  }, []);

  // the FM-1 (or any MIDI keyboard), Chrome and Edge
  const connect = useCallback(async () => {
    audio();
    if (!buffers.current[`${soundRef.current}/${LOW}`]) load(soundRef.current);
    if (!navigator.requestMIDIAccess) { setMidiStatus("This browser can't talk to MIDI devices. Use Chrome or Edge (Mac, Windows, Linux, Chromebook, Android)."); return; }
    try {
      const access = await navigator.requestMIDIAccess();
      const hook = () => {
        const names = [];
        access.inputs.forEach((input) => {
          names.push(input.name);
          input.onmidimessage = (e) => {
            const [st, d1, d2] = e.data, type = st & 0xf0;
            if (type === 0x90 && d2 > 0) noteOn(d1, d2);
            else if (type === 0x80 || type === 0x90) noteOff(d1);
          };
        });
        setMidiStatus(names.length ? "Playing from: " + names.join(", ") : "No FM-1 found: plug it in with a USB data cable and turn it on.");
      };
      hook();
      access.onstatechange = hook;
    } catch {
      setMidiStatus("MIDI wasn't allowed. Allow it in the browser's site settings (the icon left of the address) and try again.");
    }
  }, [audio, load, noteOn, noteOff]);

  // the computer's keys
  useEffect(() => {
    const down = (e) => { if (e.repeat || e.metaKey || e.ctrlKey || e.target.tagName === "INPUT") return; const m = KEYMAP[e.key]; if (m) noteOn(m); };
    const up = (e) => { const m = KEYMAP[e.key]; if (m) noteOff(m); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [noteOn, noteOff]);

  useEffect(() => { localStorage.setItem("sweeten", sweet ? "1" : "0"); sweetRef.current?.setOn(sweet); }, [sweet]);
  useEffect(() => { if (master.current) master.current.gain.value = volume; }, [volume]);

  const keys = []; for (let m = LOW; m <= HIGH; m++) keys.push(m);
  const whites = keys.filter((m) => !BLACK.has(m % 12));
  const ready = loaded >= 35;
  const name = list?.find((x) => x.id === sound)?.name || sound;

  return (
    <div className="lab">
      <h1>Play with your FM-1</h1>
      <p className="lead">Plug your M-VAVE FM-1 into this computer, click <b>Connect my FM-1</b>, and play its keys: you hear {list ? list.length : 15} Mellotron-style
        sounds right here, nothing to install. Chrome or Edge. No FM-1? Play the keys below, or your computer's keys (A S D F G H J K L).</p>

      <section>
        <div className="soundpick" role="radiogroup" aria-label="Sound">
          {(list || []).map((x) => (
            <button key={x.id} role="radio" aria-checked={sound === x.id} className={sound === x.id ? "on" : ""} onClick={() => pick(x.id)}>{x.name}</button>
          ))}
          {list && list.length === 0 && <p>The sounds can't be reached right now. Check the internet connection and reload.</p>}
        </div>
      </section>

      <section className="play">
        <div className="playbar">
          <button className="connect" onClick={connect}>Connect my FM-1</button>
          <button className={"sweet" + (sweet ? " on" : "")} onClick={() => setSweet((v) => !v)} aria-pressed={sweet}
            title="What a good stereo does: a little warmth and air, soft tape saturation, stereo width and a small room">Sweeten: {sweet ? "on" : "off"}</button>
          <span className="fixed1">{loaded > 0 && !ready ? `Loading ${name}… ${loaded} of 35` : ready ? `${name} is ready` : `Pick a sound, or connect`}</span>
          <label className="vol">Volume <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(+e.target.value)} /></label>
        </div>
        {midiStatus && <p className="small">{midiStatus}</p>}
        <div className="keyboard" role="group" aria-label="Keys, G2 to F5" onPointerDown={() => { audio(); if (!loaded) load(soundRef.current); }}>
          {whites.map((m) => (
            <button key={m} className={"white" + (sounding.has(m) ? " on" : "")} aria-label={noteName(m)}
              onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* (a pen) */ } noteOn(m); }}
              onPointerUp={() => noteOff(m)} onPointerCancel={() => noteOff(m)}>{m % 12 === 0 ? noteName(m) : ""}</button>
          ))}
          {keys.filter((m) => BLACK.has(m % 12)).map((m) => {
            const left = whites.indexOf(m - 1);
            return (
              <button key={m} className={"black" + (sounding.has(m) ? " on" : "")} aria-label={noteName(m)}
                style={{ left: `calc(${(left + 1) / whites.length * 100}% - 1.3%)` }}
                onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* (a pen) */ } noteOn(m); }}
                onPointerUp={() => noteOff(m)} onPointerCancel={() => noteOff(m)} />
            );
          })}
        </div>
      </section>

      <section className="help">
        <h2>Good to know</h2>
        <ul>
          <li><b>The FM-1 has to send its notes.</b> Most firmwares do over USB; on some, turn on KEY OUT (or MIDI out) in its settings.</li>
          <li><b>Hear only these sounds:</b> turn the FM-1's MASTER knob down. Or keep both, and play the FM-1's own sound with a Mellotron on top.</li>
          <li><b>Each sound loads once</b> (about 10 MB) and is kept by the browser. Like a real Mellotron, each note plays its tape strip for up to 8 seconds.</li>
          <li><b>Want them in the app?</b> <a href="https://github.com/pfkellogg/fm1-mirror">FM-1 Big Screen</a> plays the same sounds with no internet: Sound › Get sounds….</li>
          <li>All the sounds are made from scratch by programs, no recordings: free to use in your own music.</li>
        </ul>
      </section>
    </div>
  );
}
