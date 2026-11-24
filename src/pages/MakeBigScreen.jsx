// MakeBigScreen.jsx: pick an FM-1 firmware from The Firmware Hub, "Make it Big Screen", download it, and see what it
// will look like in FM-1 Big Screen (Smooth and the looks: src/lab/bigscreen.js, the app's own code ported).
// The builds are made ahead of time from each author's source (github.com/pfkellogg/fm1-big-screen-builds); the
// button checks the author's original at the Hub, then fetches and checks the Big Screen build.
import { useEffect, useMemo, useRef, useState } from "react";
import { LOOKS, SIDE, SCALE, fromImageData, paint, smooth, draw } from "../lab/bigscreen.js";

const BUILDS_REPO = "https://github.com/pfkellogg/fm1-big-screen-builds";
const APP = "https://github.com/pfkellogg/fm1-mirror/releases/latest";
const ANDROID = "https://github.com/pfkellogg/fm1-mirror-spyglass-android/releases/latest";
const MFLASHER = "https://github.com/jvitkauskas/m-flasher/releases/latest";
const HUB = "https://thefirmwarehub.com";

async function sha256(buf) {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function Preview({ fw }) {
  const small = useRef(null), big = useRef(null);
  const [look, setLook] = useState("color");
  const [smoothOn, setSmoothOn] = useState(true);
  const [px, setPx] = useState(null);
  useEffect(() => {
    setPx(null);
    if (!fw.preview) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = SIDE;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      setPx(fromImageData(ctx.getImageData(0, 0, SIDE, SIDE)));
    };
    img.src = fw.preview;
  }, [fw]);
  useEffect(() => {
    if (!px) return;
    const p = paint(px, look);
    draw(small.current, p, SIDE);
    if (smoothOn) draw(big.current, smooth(p), SIDE * SCALE);
    else draw(big.current, p, SIDE);
  }, [px, look, smoothOn]);
  if (!fw.preview)
    return (
      <div className="bs-nopreview">
        {fw.card && <img src={fw.card} alt={`${fw.name}'s card on The Firmware Hub (by ${fw.author})`} />}
        <p className="status">
          No screen picture of {fw.name} yet (it has no emulator we can run). Above: its card on The Firmware Hub, by{" "}
          {fw.author}. In FM-1 Big Screen its real screen shows big, with Smooth and the look you choose.
        </p>
      </div>
    );
  return (
    <div className="bs-preview">
      <p className="lead">
        This is what <b>{fw.name}</b> will look like in FM-1 Big Screen: its real start screen, from its own emulator.
        On the left, the FM-1's true size; on the right, big, with <b>Smooth</b> (the jaggies taken off, crisp edges)
        and the look you choose.
      </p>
      <div className="row">
        <button className={smoothOn ? "" : "ghost"} onClick={() => setSmoothOn(!smoothOn)} aria-pressed={smoothOn}>
          Smooth: {smoothOn ? "on" : "off"}
        </button>
        <select value={look} onChange={(e) => setLook(e.target.value)} aria-label="Look">
          {LOOKS.map(([k, n]) => (
            <option key={k} value={k}>{n}</option>
          ))}
        </select>
      </div>
      <div className="bs-screens">
        <figure>
          <canvas ref={small} className="bs-small" width={SIDE} height={SIDE} />
          <figcaption>The FM-1 (1.54 inches)</figcaption>
        </figure>
        <figure className="bs-bigfig">
          <canvas ref={big} className={"bs-big" + (smoothOn ? "" : " pixel")} />
          <figcaption>FM-1 Big Screen{smoothOn ? ", Smooth on" : ", Smooth off (exactly as the FM-1 sends it)"}</figcaption>
        </figure>
      </div>
    </div>
  );
}

// No room as it is: "Squeeze it" says what's switched off to make room, then it's made like any other.
function Squeeze({ fw }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [fw]);
  if (!open)
    return (
      <div>
        <p><b>{fw.name} has no room for Big Screen as it is:</b> its memory is full.</p>
        <button onClick={() => setOpen(true)}>Squeeze it</button>
      </div>
    );
  return (
    <div>
      {fw.squeezed.every((w) => w.startsWith("nothing")) ? (
        <p>Nothing is switched off: to make room, the Big Screen part keeps its buffer in {fw.name}'s spare memory.</p>
      ) : (
        <>
          <p>To make room, this Big Screen version of {fw.name} has these switched off:</p>
          <ul>{fw.squeezed.filter((w) => !w.startsWith("nothing")).map((w) => <li key={w}>{w}</li>)}</ul>
        </>
      )}
      <p className="status">Everything else is {fw.author}'s {fw.name} as released. The original is always on The Firmware Hub.</p>
      <Maker fw={fw} />
    </div>
  );
}

function Maker({ fw }) {
  const [steps, setSteps] = useState([]);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setSteps([]);
    setFile(null);
  }, [fw]);
  const say = (s) => setSteps((a) => [...a, s]);
  async function make() {
    setBusy(true);
    setSteps([]);
    setFile(null);
    try {
      if (fw.hub_pkg && fw.hub_sha256) {
        say(`Getting ${fw.name} ${fw.version}, the author's original, from The Firmware Hub…`);
        const o = await fetch(fw.hub_pkg).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)));
        const ok = (await sha256(o)) === fw.hub_sha256;
        say(ok ? `✓ The original checks out (${(o.byteLength / 1024).toFixed(0)} KB, the Hub's checksum).`
               : "⚠ The Hub's file has changed since the Big Screen build was made: a newer version may be out.");
      }
      say(`Adding Big Screen, Big Knobs and Key Lights (${fw.via || "our Big Screen code"}): the build made from ${fw.author}'s source, version ${fw.built_version}…`);
      const b = await fetch(fw.fwsc).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)));
      if ((await sha256(b)) !== fw.sha256) throw new Error("the Big Screen file didn't check out: try again");
      say(`✓ Ready: ${fw.name} ${fw.built_version} + Big Screen (${(b.byteLength / 1024).toFixed(0)} KB, checked).`);
      setFile(URL.createObjectURL(new Blob([b], { type: "application/octet-stream" })));
    } catch (e) {
      say(`✗ ${e && e.message ? e.message : "couldn't download (" + e + ")"}`);
    }
    setBusy(false);
  }
  const name = `${fw.id}-${fw.built_version}-bigscreen${fw.state === "squeeze" ? "-squeezed" : ""}.fwsc`;
  return (
    <div>
      <div className="row">
        <button onClick={make} disabled={busy}>{busy ? "Making…" : "Make it Big Screen"}</button>
        {file && (
          <a className="btn" href={file} download={name}>⬇ Download {name}</a>
        )}
        {file && fw.res && (
          <a className="btn" href={fw.res}>⬇ Its resources file (-res.bin)</a>
        )}
      </div>
      {file && fw.res && (
        <p className="status">
          {fw.name} keeps its sounds in a resources file too: install the <code>.fwsc</code>, then send the{" "}
          <code>-res.bin</code> with {fw.author}'s own <code>tools/fm1_resources.py</code> (from its repository).
        </p>
      )}
      {steps.length > 0 && (
        <ol className="bs-steps">
          {steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
    </div>
  );
}

export default function MakeBigScreen() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [parent, setParent] = useState("all");
  const [sort, setSort] = useState("downloads");
  const [readyOnly, setReadyOnly] = useState(false);
  const [sel, setSel] = useState(null);
  useEffect(() => {
    fetch("bigscreen/builds.json", { cache: "no-cache" }).then((r) => r.json()).then(setData).catch(() => setData(false));
  }, []);
  const ready = (f) => f.state === "built" || f.state === "squeeze";
  // the types and parents there are, most common first, each with how many
  const tally = (key) => {
    const m = new Map();
    for (const f of (data && data.firmwares) || []) for (const v of [].concat(f[key] || [])) m.set(v, (m.get(v) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const kinds = useMemo(() => tally("kinds"), [data]);
  const parents = useMemo(() => tally("parent"), [data]);
  const list = useMemo(() => {
    if (!data) return [];
    const t = q.trim().toLowerCase();
    const out = data.firmwares.filter((f) =>
      (!t || `${f.name} ${f.author} ${(f.kinds || []).join(" ")} ${f.parent}`.toLowerCase().includes(t)) &&
      (kind === "all" || (f.kinds || []).includes(kind)) &&
      (parent === "all" || f.parent === parent) &&
      (!readyOnly || ready(f)));
    const by = {
      downloads: (a, b) => (b.installs || 0) - (a.installs || 0),
      name: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      newest: (a, b) => String(b.date || "").localeCompare(String(a.date || "")),
    }[sort];
    return [...out].sort(by);
  }, [data, q, kind, parent, sort, readyOnly]);
  const fw = data && sel ? data.firmwares.find((f) => f.id === sel) : null;

  return (
    <div className="detail bs">
      <p className="kicker">M-VAVE FM-1 · free · unofficial builds</p>
      <h1>Big Screen Firmwares</h1>
      <p className="lead">
        Choose any FM-1 firmware from <a href={HUB}>The Firmware Hub</a> and make it <b>Big Screen</b>: its screen
        shown big on your computer, tablet or TV in the free <a href={APP}>FM-1 Big Screen</a> app. It also gets{" "}
        <b>Big Knobs</b> (the FM-1's eight knobs, big, turned from the app) and <b>Key Lights</b> (the FM-1's lit
        keys and buttons, big, where your fingers don't hide them).
      </p>

      {data === null && <p className="status">Loading the list…</p>}
      {data === false && <p className="status">The list didn't load. Please try again later.</p>}
      {data && (
        <section>
          <h2>1. Choose a firmware</h2>
          <p className="status">
            {data.counts.built} ready to make Big Screen · {data.counts.squeeze || 0} ready once squeezed ·{" "}
            {data.counts.already} already show big as they are ·{" "}
            {data.counts.unavailable} not available yet
          </p>
          <div className="row">
            <input type="text" placeholder="Search by name, author, type or parent…" value={q}
              onChange={(e) => setQ(e.target.value)} aria-label="Search the firmwares" />
          </div>
          <div className="bs-kinds" role="group" aria-label="Type">
            <button className={kind === "all" ? "on" : ""} aria-pressed={kind === "all"} onClick={() => setKind("all")}>All types</button>
            {kinds.map(([k, n]) => (
              <button key={k} className={kind === k ? "on" : ""} aria-pressed={kind === k} onClick={() => setKind(k)}>
                {k[0].toUpperCase() + k.slice(1)} <span>{n}</span>
              </button>
            ))}
          </div>
          <div className="row bs-filters">
            <label>Parent{" "}
              <select value={parent} onChange={(e) => setParent(e.target.value)}>
                <option value="all">All parents</option>
                {parents.map(([p, n]) => <option key={p} value={p}>{p} ({n})</option>)}
              </select>
            </label>
            <label>Sort{" "}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="downloads">Most downloaded</option>
                <option value="name">Name, A to Z</option>
                <option value="newest">Newest</option>
              </select>
            </label>
            <label className="bs-check">
              <input type="checkbox" checked={readyOnly} onChange={(e) => setReadyOnly(e.target.checked)} />{" "}
              Ready to download only
            </label>
            <span className="status">{list.length} shown</span>
          </div>
          <div className="bs-list" role="listbox" aria-label="Firmwares">
            {list.map((f) => (
              <button key={f.id} role="option" aria-selected={f.id === sel}
                className={`bs-item ${f.state}${f.id === sel ? " sel" : ""}`} onClick={() => setSel(f.id)}>
                <b>{f.name}</b> <span className="by">by {f.author}</span>
                <span className="meta">
                  {(f.installs || 0).toLocaleString()} downloads · {(f.kinds || []).join(", ")} · on {f.parent}
                </span>
                <span className="tag">{f.state === "built" ? "Big Screen ready" : f.state === "squeeze" ? "Squeeze it" : f.state === "already" ? (f.why.includes("my FM-1 Big Screen code") ? "Already Big Screen" : "Already big") : "Not yet"}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {fw && (
        <section className="contest">
          <h2>2. {fw.name} {fw.version}</h2>
          <p>
            By <a href={`https://github.com/${fw.repo}`}>{fw.author}</a> · {fw.lic || "license: see its repository"} ·{" "}
            {fw.kind}
          </p>
          <p className="status">{fw.what}</p>
          {(fw.state === "built" || fw.state === "squeeze") && (
            <>
              {fw.state === "squeeze" ? <Squeeze fw={fw} /> : <Maker fw={fw} />}
              {!fw.master && <p className="status">Big Knobs: the seven turning knobs (MASTER stays on the FM-1 itself).</p>}
              {!fw.redraw && (
                <p className="status">
                  When the app first connects, the parts of the screen that don't change show up as the FM-1 redraws
                  them: change page once and it's all there.
                </p>
              )}
            </>
          )}
          {fw.state === "already" && (
            <p>
              <b>{fw.why}.</b> {fw.name} shows big in FM-1 Big Screen as it is: no need to make anything. Get it from{" "}
              <a href={HUB}>The Firmware Hub</a>.
            </p>
          )}
          {fw.state === "unavailable" && (
            <p>
              <b>Not available yet:</b> {fw.why}. <a href={HUB}>The original is on The Firmware Hub.</a>
            </p>
          )}
        </section>
      )}

      {fw && (fw.state === "built" || fw.state === "squeeze") && (
        <section>
          <h2>3. What it will look like</h2>
          <Preview fw={fw} />
        </section>
      )}

      <section>
        <h2>Installing it</h2>
        <ol>
          <li><b>Back up your FM-1 first</b> with <a href={MFLASHER}>M-Flasher</a> (free, Mac, Windows, Linux): it saves everything, and puts it all back.</li>
          <li>In M-Flasher, install the <code>.fwsc</code> file you downloaded.</li>
          <li>Open the free <a href={APP}>FM-1 Big Screen</a> app (Mac, Windows, Linux) or <a href={ANDROID}>FM-1 Big Screen + Spyglass</a> (Android, Fire TV) and plug the FM-1 in with USB. The screen shows by itself; the <b>Knobs</b> and <b>Lights</b> buttons on the app's bar show the big knobs and the key lights.</li>
        </ol>
        <p className="status">
          Going back is easy: install the original from The Firmware Hub, or restore your M-Flasher backup.
        </p>
      </section>

      <section>
        <h2>Good to know</h2>
        <ul>
          <li><b>Unofficial builds.</b> Each is the author's own firmware, the released version, with only the Big Screen, Big Knobs and Key Lights code added. Please don't ask its author for help with the Big Screen part: ask me (Contact me, at the bottom of the page).</li>
          <li><b>Made automatically, from each author's source.</b> One of them (Felucca) has been tested on a real FM-1; the others are built and checked, not tried on the instrument. If one misbehaves, the original is a click away.</li>
          <li><b>With nobody watching, nothing changes:</b> the FM-1 sends its screen only while the app asks.</li>
          <li><b>The source:</b> every build's changes are published at <a href={BUILDS_REPO}>{BUILDS_REPO.replace("https://", "")}</a>, under each firmware's own license, with credit to its author. Authors: if you'd rather yours weren't here, or you'd like Big Screen in your own release, just say.</li>
          {data && <li className="foot">{data.attribution}. Card pictures and descriptions belong to their makers.</li>}
        </ul>
      </section>
    </div>
  );
}
