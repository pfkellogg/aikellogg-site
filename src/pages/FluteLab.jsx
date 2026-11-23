// FluteLab.jsx: the Mellotron Flute Lab: our flute's whole recipe as sliders, played from the screen, the computer
// keyboard or a MIDI keyboard (an FM-1); each flute is a short code, for the contest. Settings live in the address
// (?code=MF1....), so a link opens someone's flute.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PARAMS, defaults, decode, encode, LOW, HIGH, RATE } from "../lab/flute.js";
import { useFlute } from "../lab/useFlute.js";
import { wav, zip } from "../lab/files.js";

const GROUPS = ["Tone", "Breath", "Vibrato", "Tape", "Attack", "Character"];
const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const noteName = (m) => NAMES[m % 12] + (Math.floor(m / 12) - 1);
const BLACK = new Set([1, 3, 6, 8, 10]);
// the computer's keys, two rows, a piano's layout from C4
const KEYMAP = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72, o: 73, l: 74, p: 75, ";": 76, "'": 77,
  z: 48, x: 50, c: 52, v: 53, b: 55, n: 57, m: 59 };

// starting points
const PRESETS = {
  "Our flute (v7)": {},
  "Darker, older tape": { top: 4200, saturation: 2.4, highAir: 0.002, wowCents: 4.5, flutter: 1.8 },
  "Breathy alto": { breath: 0.26, breathLow: 3.6, h2Low: 1.8, h3Low: 2.0, vibLow: 7, swell: 3.8 },
  "Clean soprano": { breath: 0.09, h2Mid: 0.25, h3Mid: 0.3, upper: 0.6, vibHigh: 10, highAir: 0.004, tuneSd: 1.2 },
  "Seasick": { wowCents: 9, flutter: 3, vibUneven: 0.18, scoopCents: 25, tuneSd: 6 },
};

function initial(params) {
  try { return params.get("code") ? decode(params.get("code")) : defaults(); } catch { return defaults(); }
}

export default function FluteLab() {
  const [params, setParams] = useSearchParams();
  const [s, setS] = useState(() => initial(params));
  const { code, noteOn, noteOff, busy, sounding, midiStatus, connectMidi, renderAll } = useFlute(s);
  const [paste, setPaste] = useState("");
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState(null);

  // the code in the address, so the page's link is this flute
  useEffect(() => { setParams((p) => { const n = new URLSearchParams(p); n.set("code", code); return n; }, { replace: true }); }, [code, setParams]);

  // the computer's keys
  useEffect(() => {
    const down = new Set();
    const kd = (e) => {
      if (e.target.closest?.("input, textarea") || e.metaKey || e.ctrlKey) return;
      const m = KEYMAP[e.key.toLowerCase()];
      if (m && !down.has(m)) { down.add(m); noteOn(m); e.preventDefault(); }
    };
    const ku = (e) => { const m = KEYMAP[e.key.toLowerCase()]; if (m) { down.delete(m); noteOff(m); } };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [noteOn, noteOff]);

  const set = (k, v) => setS((o) => ({ ...o, [k]: v }));
  const resetGroup = (g) => setS((o) => { const n = { ...o }; for (const k in PARAMS) if (PARAMS[k][4] === g) n[k] = PARAMS[k][0]; return n; });
  const surprise = () => setS((o) => {
    const n = { ...o };
    for (const k in PARAMS) {
      if (k === "seed") { n[k] = 1 + Math.floor(Math.random() * 998); continue; }
      const [d, lo, hi, step] = PARAMS[k];
      const v = d + (Math.random() * 2 - 1) * (hi - lo) * 0.18;             // near our flute, not anywhere
      n[k] = Math.min(hi, Math.max(lo, Math.round(v / step) * step));
    }
    return n;
  });
  const copy = async (text, what) => { try { await navigator.clipboard.writeText(text); setMsg(what + " copied."); } catch { setMsg("Select it and copy it: " + text); } };
  const load = () => { try { setS(decode(paste)); setMsg("Loaded."); setPaste(""); } catch (e) { setMsg(e.message); } };
  const download = async () => {
    setProgress(0);
    const strips = await renderAll((d) => setProgress(d));
    const files = strips.map((x, i) => ({ name: `${String(LOW + i).padStart(3, "0")}_${noteName(LOW + i).replace("♯", "s")}.wav`, data: wav(x, RATE) }));
    files.push({ name: "settings.txt", data: new TextEncoder().encode(`Mellotron Flute Lab (aikellogg.com)\nCode: ${code}\nOne tape strip per key, MIDI ${LOW}-${HIGH} (${noteName(LOW)}-${noteName(HIGH)}), 8 s, 44.1 kHz.\nMade from scratch by a program: free to use in your own music.\n`) });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zip(files));
    a.download = `mellotron-flute-${code.slice(4, 20).replace(/[^a-z0-9]/gi, "") || "v7"}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setProgress(null);
  };

  const keys = useMemo(() => { const k = []; for (let m = LOW; m <= HIGH; m++) k.push(m); return k; }, []);
  const whites = keys.filter((m) => !BLACK.has(m % 12));

  return (
    <div className="lab">
      <h1>Mellotron Flute Lab</h1>
      <p className="lead">
        The Mellotron flute from FM-1 Big Screen, made from scratch: its whole recipe as sliders. Every key is its own
        8-second "tape strip", like the real instrument. Play it, shape it, and enter the contest with your flute's code.
      </p>

      <section className="contest">
        <h2>The contest</h2>
        <ol>
          <li>Shape your Mellotron flute with the sliders, and play it (the keys below, your computer's keys, or a MIDI keyboard).</li>
          <li>Press <b>Copy my code</b>.</li>
          <li>Post the code in a comment on the contest video on the AIKellogg YouTube channel.</li>
        </ol>
        <p><b>The prize:</b> the winning flute joins the Mellotron sounds in FM-1 Big Screen (Android, Mac, Windows, Linux), named after its maker, and a shout-out video with the winner and the best entries. Deadline: in the contest video.</p>
      </section>

      <section className="play">
        <div className="keyboard" role="group" aria-label="Keys, G2 to F5">
          {whites.map((m) => (
            <button key={m} className={"white" + (sounding.has(m) ? " on" : "")} aria-label={noteName(m)}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); noteOn(m); }}
              onPointerUp={() => noteOff(m)} onPointerCancel={() => noteOff(m)}>
              {m % 12 === 0 ? noteName(m) : ""}
            </button>
          ))}
          {keys.filter((m) => BLACK.has(m % 12)).map((m) => {
            const left = whites.indexOf(m - 1);
            return (
              <button key={m} className={"black" + (sounding.has(m) ? " on" : "")} aria-label={noteName(m)}
                style={{ left: `calc(${(left + 1) / whites.length * 100}% - 1.3%)` }}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); noteOn(m); }}
                onPointerUp={() => noteOff(m)} onPointerCancel={() => noteOff(m)} />
            );
          })}
        </div>
        <div className="row">
          <button onClick={connectMidi}>Play from a MIDI keyboard / FM-1</button>
          <span className="status">{busy ? "Making the tape strip…" : midiStatus || "Computer keys: A W S E D F T G Y H U J K… = C4 up; Z X C V B N M = C3 up."}</span>
        </div>
      </section>

      <section className="code">
        <h2>Your flute's code</h2>
        <div className="row">
          <code className="mycode">{code}</code>
          <button onClick={() => copy(code, "Code")}>Copy my code</button>
          <button onClick={() => copy(window.location.href, "Link")}>Copy a link to it</button>
        </div>
        <div className="row">
          <input value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Paste someone's code (MF1.…) to hear their flute" aria-label="Paste a code" />
          <button onClick={load} disabled={!paste.trim()}>Load</button>
        </div>
        <div className="row">
          <label>Start from:&nbsp;
            <select onChange={(e) => { if (e.target.value) setS({ ...defaults(), ...PRESETS[e.target.value] }); e.target.value = ""; }} defaultValue="">
              <option value="">choose…</option>
              {Object.keys(PRESETS).map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <button onClick={() => setS(defaults())}>Reset all (our flute, v7)</button>
          <button onClick={surprise}>Surprise me</button>
          <button onClick={download} disabled={progress !== null}>{progress === null ? "Download my flute (35 WAVs)" : `Making ${progress} of 35…`}</button>
        </div>
        {msg && <p className="status" role="status">{msg}</p>}
      </section>

      <section className="sliders">
        {GROUPS.map((g) => (
          <fieldset key={g}>
            <legend>{g} <button className="small" onClick={() => resetGroup(g)}>reset</button></legend>
            {Object.entries(PARAMS).filter(([, p]) => p[4] === g).map(([k, [d, lo, hi, step, , label, help]]) => (
              <div className="slider" key={k}>
                <label htmlFor={k}>{label} <span className="val">{+(+s[k]).toFixed(4)}</span>{Math.abs(s[k] - d) > 1e-9 && <button className="small" onClick={() => set(k, d)} title="Back to our flute's value">↺ {d}</button>}</label>
                <input id={k} type="range" min={lo} max={hi} step={step} value={s[k]} onChange={(e) => set(k, +e.target.value)} />
                {help && <p className="help">{help}</p>}
              </div>
            ))}
          </fieldset>
        ))}
      </section>

      <p className="foot">
        Made from scratch by a program, with no recordings, so every flute here is free to use in your own music. The
        recipe was tuned by measuring a real Mellotron flute note by note (numbers only).
      </p>
    </div>
  );
}
