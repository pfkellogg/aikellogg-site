import { useEffect, useMemo, useRef, useState } from "react";

/* FM-1 Disassembler: every C function of a real FM-1 firmware build, its machine code (JieLi's llvm-objdump), and
   the 4 KiB flash squares it lives in (the same 256 squares M-Flasher draws). Click a function, a call, a square or an
   instruction: everything follows. Data: public/disasm/<fw>/index.json + f0..f15.json (tools: fm1-disasm/gen.py). */

const FIRMWARES = [
  { id: "skiff", label: "Skiff + Big Screen", parent: "Felucca family" },
  { id: "erik37", label: "Erik37 + Big Screen", parent: "fm1-base family" },
];
const SECTOR = 4096;
const hex = (n, w = 5) => "0x" + n.toString(16).toUpperCase().padStart(w, "0");
const kb = (n) => (n >= 1024 ? (n / 1024).toFixed(n >= 10240 ? 0 : 1) + " KB" : n + " B");

/* What each square holds: the boot area and M-VAVE's stock table (m-bootloader docs/SPEC.md §5.2, §5.5); the app area
   split by the build's own sections. */
function regionOf(addr, m) {
  const textEnd = m.app0 + (m.sections[".text"].addr - m.xip0) + m.sections[".text"].size;
  if (addr < 0x4000) return { k: "boot", t: "Boot area: bootloader, chip key" };
  if (addr < textEnd) return { k: "code", t: "Firmware code (.text): runs straight from here (XIP)" };
  if (addr < m.image_end) return { k: "copy", t: "Copied into RAM at start: .ram_text (code that runs while the flash is busy) and .data" };
  if (addr < 0x93000) return { k: "free", t: "Firmware area, unused by this build" };
  if (addr < 0xe9000) return { k: "vm", t: "Settings area (VM in M-VAVE's table; custom firmwares keep projects here)" };
  if (addr < 0xea000) return { k: "bt", t: "Bluetooth pairings (BTIF)" };
  if (addr < 0xfc000) return { k: "usr", t: "Sounds (USR)" };
  if (addr < 0xff000) return { k: "free", t: "Not declared" };
  return { k: "factory", t: "Factory data: Bluetooth address, unit key" };
}
const COLORS = { boot: "#e5484d", code: "#3e9bff", copy: "#a78bfa", free: "#2a3140", vm: "#30a46c", bt: "#f5a524", usr: "#ff8fd6", factory: "#f76b15" };

function flashSpan(f) {
  if (f.fl == null) return null;
  return [Math.floor(f.fl / SECTOR), Math.floor((f.fl + Math.max(1, f.s) - 1) / SECTOR)];
}

export default function Disasm() {
  const [fw, setFw] = useState(() => new URLSearchParams(location.hash.split("?")[1] || "").get("fw") || "skiff");
  const [meta, setMeta] = useState(null);
  const [shards, setShards] = useState({});
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState(null);
  const [hl, setHl] = useState(null); // highlighted instruction address
  const [tab, setTab] = useState("functions");
  const hist = useRef([]);

  useEffect(() => {
    setMeta(null); setShards({}); setSel(null); setSector(null);
    fetch(`${import.meta.env.BASE_URL}disasm/${fw}/index.json`).then((r) => r.json()).then((m) => {
      setMeta(m);
      const start = m.functions.find((f) => /^(main|app_main|fm1_cstart)$/.test(f.n)) || m.functions[0];
      setSel(start.n);
    });
  }, [fw]);

  const byName = useMemo(() => (meta ? Object.fromEntries(meta.functions.map((f) => [f.n, f])) : {}), [meta]);
  const fn = sel && byName[sel];
  useEffect(() => {
    if (!fn || shards[fn.sh]) return;
    fetch(`${import.meta.env.BASE_URL}disasm/${fw}/f${fn.sh}.json`).then((r) => r.json()).then((d) => setShards((s) => ({ ...s, [fn.sh]: d })));
  }, [fn, fw, shards]);
  const body = fn && shards[fn.sh] && shards[fn.sh][fn.n];

  const go = (name, addr) => {
    if (!byName[name]) return;
    if (sel) hist.current.push(sel);
    setSel(name); setHl(addr ?? null); setSector(null);
    document.querySelector(".dis-asm")?.scrollTo(0, 0);
  };
  const back = () => { const p = hist.current.pop(); if (p) { setSel(p); setHl(null); } };

  // which functions live in each square
  const perSector = useMemo(() => {
    const m = new Map();
    meta?.functions.forEach((f) => { const sp = flashSpan(f); if (!sp) return; for (let s = sp[0]; s <= sp[1]; s++) (m.get(s) || m.set(s, []).get(s)).push(f); });
    return m;
  }, [meta]);

  const list = useMemo(() => {
    if (!meta) return [];
    const k = q.trim().toLowerCase();
    let l = sector != null ? perSector.get(sector) || [] : meta.functions;
    if (k) l = l.filter((f) => f.n.toLowerCase().includes(k) || (f.file || "").toLowerCase().includes(k));
    return l;
  }, [meta, q, sector, perSector]);

  if (!meta) return <div className="dis"><p>Loading…</p></div>;
  const span = fn && flashSpan(fn);
  const names = new Set(meta.functions.map((f) => f.n.split(".")[0]));

  return (
    <div className="dis">
      <header className="dis-head">
        <h1>FM-1 Disassembler</h1>
        <p>
          A real FM-1 firmware, taken apart: every C function, the machine code the compiler made from it, and where that code
          lives in the FM-1's 1 MB flash. The flash is drawn as M-Flasher draws it, <b>256 squares of 4 KB</b>. Click a
          function, a call, a square or an instruction.
        </p>
        <div className="dis-fw">
          {FIRMWARES.map((f) => (
            <button key={f.id} className={fw === f.id ? "on" : ""} onClick={() => setFw(f.id)}>
              {f.label}<small>{f.parent}</small>
            </button>
          ))}
          <span className="dis-src">
            {meta.functions.length} functions ({meta.with_c} with their C) · source: <a href={meta.repo}>{meta.repo.replace("https://github.com/", "")}</a> ({meta.license}) · {meta.author}
          </span>
        </div>
      </header>

      <section className="dis-map">
        <div className="dis-grid" role="grid" aria-label="Flash map, 256 squares of 4 KB">
          {Array.from({ length: 256 }, (_, s) => {
            const r = regionOf(s * SECTOR, meta);
            const fns = perSector.get(s);
            const mine = span && s >= span[0] && s <= span[1];
            return (
              <button key={s} className={`sq ${mine ? "mine" : ""} ${sector === s ? "pick" : ""}`} style={{ background: COLORS[r.k] }}
                title={`Square ${s}: ${hex(s * SECTOR)}–${hex(s * SECTOR + SECTOR - 1)}\n${r.t}${fns ? `\n${fns.length} function${fns.length > 1 ? "s" : ""}` : ""}`}
                onClick={() => { setSector(sector === s ? null : s); setTab("functions"); }} />
            );
          })}
        </div>
        <ul className="dis-legend">
          {[["boot", "Boot area"], ["code", "Firmware code"], ["copy", "Copied to RAM at start"], ["vm", "Settings"], ["bt", "Bluetooth"], ["usr", "Sounds"], ["factory", "Factory data"], ["free", "Unused"]].map(([k, t]) => (
            <li key={k}><i style={{ background: COLORS[k] }} />{t}</li>
          ))}
          <li><i className="mine-key" />The function you picked</li>
        </ul>
      </section>

      <div className="dis-main">
        <aside className="dis-side">
          <div className="dis-tabs">
            <button className={tab === "functions" ? "on" : ""} onClick={() => setTab("functions")}>Functions</button>
            <button className={tab === "memory" ? "on" : ""} onClick={() => setTab("memory")}>RAM &amp; POOL</button>
          </div>
          {tab === "functions" ? (
            <>
              <input className="dis-q" placeholder="Find a function or file…" value={q} onChange={(e) => setQ(e.target.value)} />
              {sector != null && (
                <p className="dis-in">In square {sector} ({hex(sector * SECTOR)}): <button onClick={() => setSector(null)}>show all</button></p>
              )}
              <ul className="dis-list">
                {list.slice(0, 400).map((f) => (
                  <li key={f.n} className={f.n === sel ? "on" : ""} onClick={() => go(f.n)}>
                    <b>{f.n}</b><span>{kb(f.s)}{f.sec === ".ram_text" ? " · RAM" : ""}</span>
                  </li>
                ))}
                {list.length > 400 && <li className="more">…and {list.length - 400} more: type to narrow</li>}
              </ul>
            </>
          ) : (
            <Memory meta={meta} />
          )}
        </aside>

        {fn && (
          <main className="dis-view">
            <div className="dis-info">
              <button className="dis-back" disabled={!hist.current.length} onClick={back} title="Back">←</button>
              <h2>{fn.n}</h2>
              <dl>
                <dt>Runs at</dt><dd>{hex(fn.a, 8)}–{hex(fn.a + fn.s - 1, 8)} {fn.sec === ".ram_text" ? "(RAM: copied there at start)" : "(straight from flash)"}</dd>
                <dt>Lives in flash</dt><dd>{fn.fl != null ? <>{hex(fn.fl)}–{hex(fn.fl + fn.s - 1)}: square{span[0] !== span[1] ? `s ${span[0]}–${span[1]}` : ` ${span[0]}`}</> : "—"}</dd>
                <dt>Size</dt><dd>{fn.s} bytes, {fn.ins} instructions</dd>
                {fn.file && <><dt>C source</dt><dd>{fn.file}:{fn.line}</dd></>}
              </dl>
              <div className="dis-x">
                <span>Called by:</span>{fn.callers.length ? fn.callers.map((c) => <button key={c} onClick={() => go(c)}>{c}</button>) : <em>nobody directly (an interrupt, a table, or the start)</em>}
              </div>
              <div className="dis-x">
                <span>Calls:</span>{fn.calls.length ? fn.calls.map((c) => <button key={c} onClick={() => go(c)}>{c}</button>) : <em>nothing</em>}
              </div>
            </div>
            <div className="dis-panes">
              <section className="dis-c">
                <h3>C</h3>
                {body ? (body.c ? <CCode c={body.c} names={names} go={go} self={fn.n.split(".")[0]} /> : <p className="dis-none">No C for this one: it's written in assembly, made by the compiler, or comes from a library.</p>) : <p>Loading…</p>}
              </section>
              <section className="dis-asm">
                <h3>Machine code <small>address · flash · bytes · instruction</small></h3>
                {body ? (
                  <table>
                    <tbody>
                      {body.asm.map(([a, bytes, ins, tgt]) => {
                        const fl = fn.fl != null ? fn.fl + (a - fn.a) : null;
                        return (
                          <tr key={a} className={hl === a ? "hl" : ""} onClick={() => setHl(a)}>
                            <td className="a">{a.toString(16)}</td>
                            <td className="f" title={fl != null ? `square ${Math.floor(fl / SECTOR)}` : ""}>{fl != null ? fl.toString(16).padStart(5, "0") : ""}</td>
                            <td className="b">{bytes}</td>
                            <td className="i">{tgt && byName[tgt] && tgt !== fn.n ? <Ins ins={ins} tgt={tgt} go={go} /> : ins}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : <p>Loading…</p>}
              </section>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

function Ins({ ins, tgt, go }) {
  const i = ins.indexOf("<" + tgt);
  if (i < 0) return ins;
  const j = ins.indexOf(">", i);
  return <>{ins.slice(0, i)}<button className="lnk" onClick={(e) => { e.stopPropagation(); go(tgt); }}>{ins.slice(i, j + 1)}</button>{ins.slice(j + 1)}</>;
}

/* C, with every name of a function in this build a link */
function CCode({ c, names, go, self }) {
  const lines = c.code.split("\n");
  return (
    <pre>
      {lines.map((l, k) => (
        <div key={k} className={c.line + k === c.def_line ? "def" : ""}>
          <span className="ln">{c.line + k}</span>
          {l.split(/(\b[A-Za-z_]\w*\b)/).map((t, j) =>
            names.has(t) && t !== self ? <button key={j} className="lnk" onClick={() => go(t)}>{t}</button> : <span key={j}>{t}</span>
          )}
          {"\n"}
        </div>
      ))}
    </pre>
  );
}

/* RAM: where the variables live, by region (the linker map: RAM, POOL, NOINIT) */
function Memory({ meta }) {
  const S = meta.sections;
  const regions = [
    [".data", "RAM: variables with a starting value (copied from flash at start)"],
    [".bss", "RAM: variables that start at zero"],
    [".pool", "POOL: the big zero-initialised buffers (delay lines, screens)"],
    [".noinit", "NOINIT: kept across a reset"],
    [".ramx", "RAMX: beside the RAM code"],
  ].filter(([k]) => S[k]);
  const [open, setOpen] = useState(".pool");
  return (
    <div className="dis-mem">
      {regions.map(([k, t]) => {
        const vs = meta.variables.filter((v) => v.sec === k).sort((a, b) => b.size - a.size);
        return (
          <div key={k}>
            <button className={`reg ${open === k ? "on" : ""}`} onClick={() => setOpen(open === k ? null : k)}>
              <b>{k}</b> {kb(S[k].size)} <small>{t}</small>
            </button>
            {open === k && (
              <ul>
                {vs.slice(0, 200).map((v) => (
                  <li key={v.name + v.addr}><b>{v.name}</b><span>{kb(v.size)} at {v.addr.toString(16)}</span></li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
