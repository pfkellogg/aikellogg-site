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
  // the sounds picked (several at once: layered on every key)
  const [picked, setPicked] = useState(() => { try { const v = JSON.parse(localStorage.getItem("playSounds")); return Array.isArray(v) && v.length ? v : ["flute"]; } catch { return ["flute"]; } });
  // the sounds' order on the page: dragged by the learner, remembered
  const [order, setOrder] = useState(() => { try { const v = JSON.parse(localStorage.getItem("playOrder")); return Array.isArray(v) ? v : []; } catch { return []; } });
  const drag = useRef(null);                        // { id, x, y, moved } while a sound button is held
  const [dragging, setDragging] = useState(null);
  const [loaded, setLoaded] = useState({});         // id -> strips ready (of 35)
  const [midiStatus, setMidiStatus] = useState("");
  const [connected, setConnected] = useState(false);   // listening to the FM-1 (or a MIDI keyboard) now
  const accessRef = useRef(null);
  const [sweet, setSweet] = useState(() => localStorage.getItem("sweeten") === "1");
  const [volume, setVolume] = useState(0.8);
  // the FM-1's own sound while these play: off sends CC 11 (EXPRESSION) 0 on all 16 channels, on sends 127 (SLOOP 2.7.1+
  // takes it as a gain over every track, not saved with the song; firmware that doesn't know it ignores it)
  const [own, setOwn] = useState(() => localStorage.getItem("fm1Own") === "1");
  const ownRef = useRef(own);
  const [sounding, setSounding] = useState(new Set());
  const ac = useRef(null), master = useRef(null), sweetRef = useRef(null);
  const buffers = useRef({});                         // "id/043" -> AudioBuffer
  const voices = useRef(new Map());                   // midi -> { src, gain }
  const pickedRef = useRef(picked);

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
    setLoaded((l) => ({ ...l, [id]: done }));
    const queue = keys.filter((m) => !buffers.current[`${id}/${m}`]);
    const worker = async () => {
      while (queue.length) {
        const m = queue.shift();
        try {
          const data = await (await fetch(`${BASE}sounds/${id}/${String(m).padStart(3, "0")}.flac`)).arrayBuffer();
          buffers.current[`${id}/${m}`] = await ctx.decodeAudioData(data);
        } catch { /* (one strip missing: that key stays silent) */ }
        if (pickedRef.current.includes(id)) setLoaded((l) => ({ ...l, [id]: ++done }));
      }
    };
    await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
  }, [audio]);

  // the list in the remembered order; sounds new since then go at the end, in the list's own order
  const sorted = (list || []).slice().sort((a, b) => {
    const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
    return (ia < 0 ? 1e6 + list.indexOf(a) : ia) - (ib < 0 ? 1e6 + list.indexOf(b) : ib);
  });
  const saveOrder = (ids) => { setOrder(ids); localStorage.setItem("playOrder", JSON.stringify(ids)); };
  // move one sound to where another is
  const moveTo = (id, target) => {
    if (id === target) return;
    const ids = sorted.map((x) => x.id).filter((x) => x !== id);
    const at = ids.indexOf(target), from = sorted.findIndex((x) => x.id === id), to = sorted.findIndex((x) => x.id === target);
    ids.splice(from < to ? at + 1 : at, 0, id);
    saveOrder(ids);
  };
  // drag with the mouse or a finger: press, move a little, and the sound follows to where you point
  const onDown = (e, id) => {
    if (e.button !== undefined && e.button !== 0) return;
    drag.justMoved = false;
    drag.current = { id, x: e.clientX, y: e.clientY, moved: false };
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.moved = true;
      setDragging(d.id);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    }
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(".soundpick button[data-id]");
    if (el && el.dataset.id !== d.id) moveTo(d.id, el.dataset.id);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(null);
    if (d && d.moved) drag.justMoved = true;   // the click that follows a drag doesn't pick
  };
  // from the keyboard: Alt + arrow keys move the focused sound
  const onKey = (e, id) => {
    if (!e.altKey || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const i = sorted.findIndex((x) => x.id === id), j = i + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1);
    if (j < 0 || j >= sorted.length) return;
    moveTo(id, sorted[j].id);
    requestAnimationFrame(() => document.querySelector(`.soundpick button[data-id="${id}"]`)?.focus());
  };

  // a click adds the sound or takes it away (at least one stays): layered sounds on every key
  const pick = (id) => {
    if (drag.justMoved) { drag.justMoved = false; return; }
    let next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
    if (!next.length) next = [id];
    setPicked(next);
    pickedRef.current = next;
    localStorage.setItem("playSounds", JSON.stringify(next));
    for (const x of next) load(x);
  };
  // just this one
  const only = (id) => { setPicked([id]); pickedRef.current = [id]; localStorage.setItem("playSounds", JSON.stringify([id])); load(id); };

  const noteOn = useCallback((midi, vel = 100) => {
    const ctx = audio(), m = fold(midi);
    const layers = pickedRef.current.map((id) => buffers.current[`${id}/${m}`]).filter(Boolean);
    if (!layers.length) return;
    const old = voices.current.get(midi);
    if (old) for (const v of old) { v.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03); v.src.stop(ctx.currentTime + 0.2); }
    const level = (0.35 + 0.65 * (vel / 127)) / Math.sqrt(layers.length);    // layered: not louder, fuller
    const these = layers.map((buf) => {
      const src = ctx.createBufferSource(), gain = ctx.createGain();
      src.buffer = buf;
      src.playbackRate.value = 2 ** ((midi - m) / 12);   // a note outside G2..F5: its octave's strip, at its own pitch
      gain.gain.value = level;
      src.connect(gain).connect(master.current);
      src.start();
      return { src, gain };
    });
    these[0].src.onended = () => { if (voices.current.get(midi) === these) { voices.current.delete(midi); setSounding((s) => { const n = new Set(s); n.delete(midi); return n; }); } };
    voices.current.set(midi, these);
    setSounding((s) => new Set(s).add(midi));
  }, [audio]);

  const noteOff = useCallback((midi) => {
    const vs = voices.current.get(midi), ctx = ac.current;
    if (!vs || !ctx) return;
    for (const v of vs) {
      v.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);      // a Mellotron's quick, soft release
      v.src.stop(ctx.currentTime + 0.5);
    }
    voices.current.delete(midi);
    setSounding((s) => { const n = new Set(s); n.delete(midi); return n; });
  }, []);

  const sendOwn = useCallback((up) => {
    const access = accessRef.current;
    if (!access) return;
    access.outputs.forEach((out) => {
      if (out.state === "disconnected") return;
      try { for (let ch = 0; ch < 16; ch++) out.send([0xb0 | ch, 11, up ? 127 : 0]); } catch { /* not ours to worry about */ }
    });
  }, []);

  // the FM-1 (or any MIDI keyboard), Chrome and Edge: Connect turns listening on, Disconnect off
  const disconnect = useCallback(() => {
    const access = accessRef.current;
    if (access) {
      sendOwn(true);                                   // the FM-1's own sound back as it was
      access.inputs.forEach((input) => { input.onmidimessage = null; });
      access.onstatechange = null;
    }
    for (const m of [...voices.current.keys()]) noteOff(m);
    setConnected(false);
    setMidiStatus("Disconnected: the FM-1's keys don't play here now.");
  }, [noteOff, sendOwn]);

  const connect = useCallback(async () => {
    audio();
    for (const id of pickedRef.current) if (!buffers.current[`${id}/${LOW}`]) load(id);
    if (!navigator.requestMIDIAccess) { setMidiStatus("This browser can't talk to MIDI devices. Use Chrome or Edge (Mac, Windows, Linux, Chromebook, Android)."); return; }
    try {
      const access = await navigator.requestMIDIAccess();
      accessRef.current = access;
      const hook = () => {
        const names = [];
        access.inputs.forEach((input) => {
          if (input.state === "disconnected") return;
          names.push(input.name);
          input.onmidimessage = (e) => {
            const [st, d1, d2] = e.data, type = st & 0xf0;
            if (type === 0x90 && d2 > 0) noteOn(d1, d2);
            else if (type === 0x80 || type === 0x90) noteOff(d1);
          };
        });
        sendOwn(ownRef.current);                        // (again for an FM-1 plugged in later)
        setConnected(names.length > 0);                 // an FM-1 unplugged: the light goes red by itself
        setMidiStatus(names.length ? "Playing from: " + names.join(", ") : "No FM-1 found: plug it in with a USB data cable and turn it on.");
      };
      hook();
      access.onstatechange = hook;
    } catch {
      setConnected(false);
      setMidiStatus("MIDI wasn't allowed. Allow it in the browser's site settings (the icon left of the address) and try again.");
    }
  }, [audio, load, noteOn, noteOff, sendOwn]);

  useEffect(() => () => { const a = accessRef.current; if (a) { sendOwn(true); a.inputs.forEach((i) => { i.onmidimessage = null; }); a.onstatechange = null; } }, [sendOwn]);
  useEffect(() => { const back = () => sendOwn(true); window.addEventListener("pagehide", back); return () => window.removeEventListener("pagehide", back); }, [sendOwn]);
  useEffect(() => { ownRef.current = own; localStorage.setItem("fm1Own", own ? "1" : "0"); if (connected) sendOwn(own); }, [own, connected, sendOwn]);

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
  const nameOf = (id) => list?.find((x) => x.id === id)?.name || id;
  const waiting = picked.filter((id) => (loaded[id] || 0) < 35);
  const status = waiting.length
    ? (loaded[waiting[0]] ? `Loading ${nameOf(waiting[0])}… ${loaded[waiting[0]]} of 35` : "Pick sounds, or connect")
    : `${picked.map(nameOf).join(" + ")} ${picked.length > 1 ? "are" : "is"} ready`;

  return (
    <div className="lab">
      <h1>Play with your FM-1</h1>
      <p className="lead">Plug your M-VAVE FM-1 into this computer, click <b>Connect my FM-1</b>, and play its keys: you hear {list ? list.length : 25}         sounds right here, nothing to install. Chrome or Edge. <b>Pick one sound, or several to layer them</b> (strings + choir…): click a sound
        to add it or take it away, double-click for just that one, and drag the sounds into the order you like (it's remembered). No FM-1? Play the keys below, or your computer's keys (A S D F G H J K L).</p>

      <section>
        <div className="soundpick" role="group" aria-label="Sounds (several can be picked)">
          {sorted.map((x) => (
            <button key={x.id} data-id={x.id} role="checkbox" aria-checked={picked.includes(x.id)}
              className={(picked.includes(x.id) ? "on" : "") + (dragging === x.id ? " dragging" : "")}
              title="Click: add or take away · Double-click: just this one · Drag (or Alt + arrows): move it"
              onClick={() => pick(x.id)} onDoubleClick={() => only(x.id)} onKeyDown={(e) => onKey(e, x.id)}
              onPointerDown={(e) => onDown(e, x.id)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>{x.name}</button>
          ))}
          {order.length > 0 && <button className="reset-order" onClick={() => saveOrder([])} title="Back to the original order">Reset order</button>}
          {list && list.length === 0 && <p>The sounds can't be reached right now. Check the internet connection and reload.</p>}
        </div>
      </section>

      <section className="play">
        <div className="playbar">
          <button className={"connect" + (connected ? " on" : "")} onClick={connected ? disconnect : connect} aria-pressed={connected}>
            <span className={"light " + (connected ? "green" : "red")} aria-hidden="true" />{connected ? "Disconnect" : "Connect my FM-1"}</button>
          <button className={"sweet" + (sweet ? " on" : "")} onClick={() => setSweet((v) => !v)} aria-pressed={sweet}
            title="What a good stereo does: a little warmth and air, soft tape saturation, stereo width and a small room">Sweeten: {sweet ? "on" : "off"}</button>
          <button className={"sweet own" + (own ? " on" : "")} onClick={() => setOwn((v) => !v)} aria-pressed={own}
            title="Off: only these sounds (the FM-1's own sound is turned down while connected, and back up when you disconnect or leave)">FM-1's own sound: {own ? "on" : "off"}</button>
          <span className="fixed1">{status}</span>
          <label className="vol">Volume <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(+e.target.value)} /></label>
        </div>
        {midiStatus && <p className="small">{midiStatus}</p>}
        <div className="keyboard" role="group" aria-label="Keys, G2 to F5" onPointerDown={() => { audio(); for (const id of pickedRef.current) if (!loaded[id]) load(id); }}>
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
          <li><b>Hear only these sounds:</b> leave <b>FM-1's own sound: off</b> (the page turns the FM-1's sound down while connected, and back up when you disconnect or leave the page). Turn it <b>on</b> to play the FM-1's own sound with these on top. If your FM-1's firmware doesn't follow it, turn the FM-1's MASTER knob down instead.</li>
          <li><b>Each sound loads once</b> (about 10 MB) and is kept by the browser. Like a real Mellotron, each note plays its tape strip for up to 8 seconds.</li>
          <li><b>Want them in the app?</b> <a href="https://github.com/pfkellogg/fm1-mirror">FM-1 Big Screen</a> plays the same sounds with no internet: Sound › Get sounds….</li>
          <li>All the sounds but one are made from scratch by programs, no recordings: free to use in your own music. The <b>Grand Piano</b> is made from the <a href="https://github.com/sfzinstruments/SalamanderGrandPiano">Salamander Grand Piano</a> (a Yamaha C5) by Alexander Holm, <a href="https://creativecommons.org/licenses/by/3.0/">CC-BY 3.0</a>.</li>
        </ul>
      </section>
    </div>
  );
}
