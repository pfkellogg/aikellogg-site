// useFlute.js: plays the Flute Lab's flute. Strips are made by the worker (fluteWorker.js) the first time a key is
// played with these settings, then kept; a key held plays its strip until let go (a 0.12 s fade, as the app's
// Mellotron), and runs out at 8 s like a tape. MIDI keyboards (an FM-1, a Keystation...) play it in Chrome.
import { useCallback, useEffect, useRef, useState } from "react";
import { encode, RATE } from "./flute.js";
import { makeSweeten } from "./sweeten.js";

export function useFlute(settings, sweet = false) {
  const code = encode(settings);
  const codeRef = useRef(code);
  const settingsRef = useRef(settings);
  codeRef.current = code;
  settingsRef.current = settings;

  const ctxRef = useRef(null);
  const workerRef = useRef(null);
  const cache = useRef(new Map());          // `${code}|${midi}` -> AudioBuffer
  const waiting = useRef(new Map());        // request id -> resolve
  const voices = useRef(new Map());         // midi -> {src, gain}
  const held = useRef(new Set());
  const recent = useRef([]);                // the last keys played: made again first when a slider moves
  const nextId = useRef(1);
  const [busy, setBusy] = useState(0);
  const [midiStatus, setMidiStatus] = useState("");
  const [sounding, setSounding] = useState(() => new Set());

  useEffect(() => {
    const w = new Worker(new URL("./fluteWorker.js", import.meta.url), { type: "module" });
    w.onmessage = (e) => {
      const m = e.data, done = waiting.current.get(m.id);
      if (done) { waiting.current.delete(m.id); done(m); }
    };
    workerRef.current = w;
    return () => w.terminate();
  }, []);

  const sweetRef = useRef(null);
  const sweetOn = useRef(sweet);
  sweetOn.current = sweet;
  const ctx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
      sweetRef.current = makeSweeten(ctxRef.current);
      sweetRef.current.setOn(sweetOn.current);
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };

  const ask = useCallback((msg) => new Promise((resolve) => {
    const id = nextId.current++;
    waiting.current.set(id, resolve);
    workerRef.current.postMessage({ ...msg, id });
  }), []);

  /** The strip for `midi` with the current settings (made once, then kept). */
  const strip = useCallback(async (midi) => {
    const c = codeRef.current, key = `${c}|${midi}`;
    if (cache.current.has(key)) return cache.current.get(key);
    setBusy((b) => b + 1);
    const m = await ask({ type: "note", settings: settingsRef.current, midi });
    setBusy((b) => b - 1);
    const ac = ctx(), buf = ac.createBuffer(1, m.data.length, RATE);
    buf.copyToChannel(m.data, 0);
    cache.current.set(`${c}|${midi}`, buf);
    return buf;
  }, [ask]);

  const stopVoice = useCallback((midi, when) => {
    const v = voices.current.get(midi);
    if (!v) return;
    voices.current.delete(midi);
    const t = when ?? ctx().currentTime;
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setValueAtTime(v.gain.gain.value, t);
    v.gain.gain.setTargetAtTime(0, t, 0.04);          // let go: gone in about 0.12 s
    v.src.stop(t + 0.4);
    setSounding((s) => { const n = new Set(s); n.delete(midi); return n; });
  }, []);

  const noteOn = useCallback(async (midi) => {
    const ac = ctx();
    held.current.add(midi);
    recent.current = [midi, ...recent.current.filter((k) => k !== midi)].slice(0, 8);
    const buf = await strip(midi);
    stopVoice(midi);
    const src = ac.createBufferSource(), gain = ac.createGain();
    src.buffer = buf;
    gain.gain.value = 0.9;
    src.connect(gain).connect(sweetRef.current.input);
    src.start();
    src.onended = () => { if (voices.current.get(midi)?.src === src) { voices.current.delete(midi); setSounding((s) => { const n = new Set(s); n.delete(midi); return n; }); } };
    voices.current.set(midi, { src, gain });
    setSounding((s) => new Set(s).add(midi));
    if (!held.current.has(midi)) stopVoice(midi, ac.currentTime + 0.35);   // a quick tap while it was being made
  }, [strip, stopVoice]);

  const noteOff = useCallback((midi) => {
    held.current.delete(midi);
    stopVoice(midi);
  }, [stopVoice]);

  // Sweeten on or off
  useEffect(() => { sweetRef.current?.setOn(sweet); }, [sweet]);

  // A slider moved: forget other settings' strips, and make the recent keys again in the background.
  useEffect(() => {
    for (const k of [...cache.current.keys()]) if (!k.startsWith(code + "|")) cache.current.delete(k);
    const t = setTimeout(() => { for (const k of recent.current.slice(0, 4)) strip(k); }, 350);
    return () => clearTimeout(t);
  }, [code, strip]);

  // MIDI keyboards (Chrome and Edge): an FM-1 with KEY OUT on, a Keystation, anything that sends notes.
  const connectMidi = useCallback(async () => {
    if (!navigator.requestMIDIAccess) { setMidiStatus("This browser has no MIDI: use Chrome or Edge on a computer or Android."); return; }
    try {
      const access = await navigator.requestMIDIAccess();
      const hook = () => {
        const names = [];
        access.inputs.forEach((input) => {
          names.push(input.name);
          input.onmidimessage = (e) => {
            const [st, d1, d2] = e.data, type = st & 0xf0;
            if (type === 0x90 && d2 > 0) noteOn(d1);
            else if (type === 0x80 || type === 0x90) noteOff(d1);
          };
        });
        setMidiStatus(names.length ? "Playing from: " + names.join(", ") : "No MIDI keyboard found: plug one in.");
      };
      hook();
      access.onstatechange = hook;
    } catch {
      setMidiStatus("MIDI wasn't allowed. Allow it in the browser's site settings and try again.");
    }
  }, [noteOn, noteOff]);

  /** All 35 strips (for the download), with progress. */
  const renderAll = useCallback(async (onProgress) => {
    const id = nextId.current++;
    return new Promise((resolve) => {
      const w = workerRef.current, prev = w.onmessage;
      w.onmessage = (e) => {
        if (e.data.id !== id) return prev(e);
        if (e.data.type === "progress") onProgress?.(e.data.done);
        else { w.onmessage = prev; resolve(e.data.strips); }
      };
      w.postMessage({ type: "all", id, settings: settingsRef.current });
    });
  }, []);

  return { code, noteOn, noteOff, busy, sounding, midiStatus, connectMidi, renderAll };
}
