// Dashboard.jsx: the FM-1 Big Screen Dashboard: several FM-1s on one screen (FM-1 Big Screen 1.3.33, pre-release):
// side by side, a tab for each, and the lock. Here as a playable picture: the screens of the 200 firmwares that have
// Big Screen, captured in Joakim Eriksson's FM-1 emulator (fm1-emu), public/dashboard/{list.json,screens/<id>.png}.
import { useEffect, useMemo, useState } from "react";
import Video from "../components/Video.jsx";

const MAC = "https://github.com/pfkellogg/fm1-mirror/releases/tag/v1.3.33";
const ANDROID = "https://github.com/pfkellogg/fm1-mirror-spyglass-android/releases/tag/v1.6.20";
const STABLE = "https://github.com/pfkellogg/fm1-mirror/releases/latest";
const EMU = "https://joakimeriksson.github.io/fm1-emu/";
const VIDEO = "nPMg6kCL4t4";
const SHUTTLE_VIDEO = "mReQ0qHMnH4";
const MAC34 = "https://github.com/pfkellogg/fm1-mirror/releases/tag/v1.3.34";
const ANDROID21 = "https://github.com/pfkellogg/fm1-mirror-spyglass-android/releases/tag/v1.6.21";

export default function Dashboard() {
  const [list, setList] = useState([]);
  const [view, setView] = useState("side");     // "side" | "tabs"
  const [picked, setPicked] = useState(0);
  const [locked, setLocked] = useState(true);
  const [knob, setKnob] = useState(0);
  const [hit, setHit] = useState({ t: 0, who: "all" });
  const [show, setShow] = useState(48);
  const [q, setQ] = useState("");
  useEffect(() => { fetch("dashboard/list.json").then((r) => r.json()).then(setList).catch(() => setList([])); }, []);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? list.filter((x) => (x.name + " " + x.author).toLowerCase().includes(s)) : list;
  }, [list, q]);
  const turn = (v) => { setKnob(v); setHit({ t: Date.now(), who: locked ? "all" : picked }); };
  const lit = (i) => Date.now() - hit.t < 1800 && (hit.who === "all" || hit.who === i);
  const [, tick] = useState(0);
  useEffect(() => { if (!hit.t) return; const id = setTimeout(() => tick((n) => n + 1), 1850); return () => clearTimeout(id); }, [hit]);
  const cur = shown[Math.min(picked, Math.max(0, shown.length - 1))];
  const tile = (x, i) => (
    <button key={x.id} className={"dash-tile" + (i === picked ? " picked" : "")} onClick={() => setPicked(i)} title={`${x.name} by ${x.author}`}>
      <span className="dash-label">FM-1 {i + 1}</span>
      <img src={`dashboard/screens/${x.id}.png`} alt={`${x.name}'s screen`} loading="lazy" width="240" height="240" />
      {lit(i) && <span className="dash-hit">KNOB 1 {knob > 0 ? "+" : ""}{knob}</span>}
      <span className="dash-name">{x.name}</span>
    </button>
  );
  return (
    <div className="lab dash">
      <h1>FM-1 Big Screen <span className="y">Dashboard</span></h1>
      <p className="lead">
        Plug in several M-VAVE FM-1s and see them all on one screen: <b>side by side</b>, or <b>one at a time</b> with a tab for each,
        and a <b>lock</b> so one knob in the app turns them all. Each one can run its own firmware: {list.length || 199} firmwares
        have Big Screen. In <a href={MAC}>FM-1 Big Screen 1.3.33</a> (Mac, Windows, Linux) and <a href={ANDROID}>Android 1.6.20</a>, free.
      </p>
      <p className="note dash-warn">
        Pre-release, <b>not thoroughly tested</b>: I have only one FM-1, so the others in the video and below are virtual
        (pretend FM-1s on the computer showing each firmware's real screen). It should work the same with real ones: who wants
        to give it a spin? With one FM-1, the <a href={STABLE}>latest stable version</a> is the one to use.
      </p>

      {VIDEO && <Video id={VIDEO} title="FM-1 Big Screen Dashboard" caption="200 FM-1s on one screen (199 of them virtual): side by side, tabs, and the lock." />}

      <h2>Try it here</h2>
      <div className="dash-bar">
        <div className="seg" role="group" aria-label="View">
          <button className={view === "side" ? "on" : ""} onClick={() => setView("side")} aria-pressed={view === "side"}>Side by side</button>
          <button className={view === "tabs" ? "on" : ""} onClick={() => setView("tabs")} aria-pressed={view === "tabs"}>Tabs</button>
        </div>
        <button className={"lock" + (locked ? " on" : "")} onClick={() => setLocked((v) => !v)} aria-pressed={locked}>
          {locked ? "LOCKED: knobs move all" : "Unlocked: one FM-1"}
        </button>
        <label className="dash-knob">KNOB 1
          <input type="range" min="-20" max="20" value={knob} onChange={(e) => turn(+e.target.value)} aria-label="Turn KNOB 1" />
        </label>
        <input type="search" placeholder="Find a firmware" value={q} onChange={(e) => { setQ(e.target.value); setPicked(0); }} aria-label="Find a firmware" />
      </div>
      <p className="dash-hint">
        Turn <b>KNOB 1</b>: locked, every FM-1 gets it; unlocked, only the picked one (yellow frame). Click a screen to pick it.
      </p>

      {view === "side" ? (
        <>
          <div className="dash-grid">{shown.slice(0, show).map(tile)}</div>
          {show < shown.length && <button className="sweet dash-more" onClick={() => setShow(shown.length)}>Show all {shown.length}</button>}
        </>
      ) : (
        <div className="dash-tabs">
          <div className="dash-tabrow">
            {shown.slice(0, 60).map((x, i) => (
              <button key={x.id} className={i === picked ? "on" : ""} onClick={() => setPicked(i)}>FM-1 {i + 1} · {x.name}</button>
            ))}
          </div>
          {cur && (
            <div className="dash-one">
              {tile(cur, Math.min(picked, shown.length - 1))}
              <p><b>{cur.name}</b> by {cur.author}</p>
            </div>
          )}
        </div>
      )}

      <h2>Turn the knobs with a dial: the ShuttleXpress</h2>
      <p>
        A Contour ShuttleXpress (or ShuttlePRO) works as a knob remote in <a href={MAC34}>FM-1 Big Screen 1.3.34</a> and{" "}
        <a href={ANDROID21}>Android 1.6.21</a> (pre-releases): plug it in and the app finds it, no Contour software needed.
        Tested on a Mac; Windows, Linux and Android are built but not yet tried.
      </p>
      <ul>
        <li><b>Inner dial:</b> turns the chosen knob, one notch = one click of the real knob. <b>Outer ring:</b> turns it fast; further = faster; let go = stop.</li>
        <li><b>Button 1 / 2:</b> previous / next knob. <b>Hold 1:</b> where am I? <b>Hold 2:</b> speech on/off.</li>
        <li><b>Button 3:</b> SEL. <b>Button 4:</b> the next FM-1 (<b>hold 4:</b> Side by side / one at a time). <b>Button 5:</b> the lock.</li>
        <li>Everything is said out loud and shown big.</li>
      </ul>
      <Video id={SHUTTLE_VIDEO} title="ShuttleXpress Comes to FM-1 Dashboard" caption="A dial for the FM-1's knobs: my own hand on a real ShuttleXpress, with my real FM-1 and four virtual ones (2:50)." />

      <h2>Good to know</h2>
      <ul>
        <li><b>Side by side:</b> every FM-1's screen, the picked one framed in yellow; click one to work with it. <b>Tabs:</b> one at a time, a tab for each, "FM-1 n · firmware".</li>
        <li><b>The lock:</b> locked, the app's Big Knobs, Key Lights and B3 drawbars go to every FM-1; unlocked, only to the picked one. (Turning a real knob on one FM-1 moves only that FM-1.)</li>
        <li>Firmware installs are refused while several FM-1s are plugged in, so nothing gets flashed by mistake.</li>
        <li>The screens on this page were captured in <a href={EMU}>Joakim Eriksson's FM-1 emulator</a>, running each firmware's Big Screen build; each firmware belongs to its author. Get the builds at <a href="#/make-big-screen">Big Screen FWs</a>.</li>
      </ul>
    </div>
  );
}
