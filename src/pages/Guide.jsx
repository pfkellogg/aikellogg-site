import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Video from "../components/Video.jsx";

/* Inside the FM-1: a how-to guide in five parts. Part 1: the overview, and a debugging example with FM-1 Debugger.
   Route: #/guide (the series) and #/guide/1 … #/guide/5. */

const PARTS = [
  { n: 1, title: "How the app and the FM-1 talk, and catching them at it", ready: true },
  { n: 2, title: "The FM-1's flash, square by square", ready: true },
  { n: 3, title: "From C code to the chip: compiling, the linker, RAM and the POOL", ready: true },
  { n: 4, title: "The two families: Felucca and fm1-base", ready: true },
  { n: 5, title: "Debugging on the FM-1 itself: breakpoints in the firmware", ready: true },
];
const DEBUGGER = "https://github.com/pfkellogg/fm1-mirror/releases/tag/v1.3.35-debugger";
const BASE = import.meta.env.BASE_URL;

function Bytes({ rows }) {
  return (
    <table className="g-bytes">
      <thead><tr><th>Byte</th><th>Means</th></tr></thead>
      <tbody>
        {rows.map(([b, m], i) => (
          <tr key={i}><td><code>{b}</code></td><td>{m}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function Series({ current }) {
  return (
    <ol className="g-series">
      {PARTS.map((p) => (
        <li key={p.n} className={p.n === current ? "on" : ""}>
          {p.ready ? <Link to={`/guide/${p.n}`}>Part {p.n}: {p.title}</Link> : <span>Part {p.n}: {p.title} <em>(coming)</em></span>}
        </li>
      ))}
    </ol>
  );
}

export default function Guide() {
  const { part } = useParams();
  const n = Number(part) || 0;
  if (n === 1) return <Part1 />;
  if (n === 2) return <Part2 />;
  if (n === 3) return <Part3 />;
  if (n === 4) return <Part4 />;
  if (n === 5) return <Part5 />;
  return (
    <div className="g">
      <h1>Inside the FM-1</h1>
      <p className="g-lead">A how-to guide in five parts: what the M-VAVE FM-1 is made of, how its firmware is built and where it lives, and how to see it working, one message and one instruction at a time.</p>
      <Series />
    </div>
  );
}

function Part1() {
  return (
    <div className="g">
      <p className="g-kicker">Inside the FM-1 · Part 1 of 5</p>
      <h1>How the app and the FM-1 talk, and catching them at it</h1>
      <p className="g-lead">
        Two computers are at work when you use FM-1 Big Screen: the little one inside the FM-1, and yours. This part shows
        what they say to each other, and then, with <b>FM-1 Debugger</b>, stops the conversation in the middle so you can read it.
      </p>
      <Video id="XWXPgNYXL58" title="Inside the FM-1, Part 1" caption="Part 1 as a video (2:26): the same story, and FM-1 Debugger stopping a real FM-1, with real clicks." />
      <Series current={1} />

      <h2>Two computers, one cable</h2>
      <ul>
        <li><b>The FM-1</b> has a JieLi AC791N chip, 1 MB of flash memory for its firmware, and no other memory chip. The firmware is a program written in C. Which one runs (SLOOP, Skiff, Erik37, Melodee and so on) is up to you.</li>
        <li><b>Your computer or tablet</b> runs FM-1 Big Screen. It shows the FM-1's screen big, and gives it Big Knobs, Key Lights and more.</li>
        <li>They talk over the USB cable as a <b>MIDI</b> device, the same way a keyboard sends notes. For anything that isn't a note, MIDI has <b>SysEx</b>: a message that starts with the byte <code>F0</code>, ends with <code>F7</code>, and carries anything in between.</li>
      </ul>

      <h2>The conversation</h2>
      <p>Every message we use starts with <code>F0 7D</code>. <code>7D</code> is the manufacturer number MIDI keeps for experiments and education, so it never clashes with a company's own messages. Then come two letters that say whose message it is (<code>F S</code> = 46 53 for Big Screen), then a number that says what it is.</p>
      <ol>
        <li>About once a second the app says <b>hello</b>: <code>F0 7D 46 53 00 F7</code>.</li>
        <li>While it hears hellos, a Big Screen firmware sends <b>each row of the screen it paints</b>, the <b>sound name</b>, and the <b>Key Lights</b>.</li>
        <li>The app sends the other way when you use it: a <b>Big Knobs</b> turn, a button press.</li>
        <li>Three seconds after the last hello, the firmware stops sending. Nothing is wasted when the app is closed.</li>
      </ol>
      <table className="g-table">
        <thead><tr><th>Message</th><th>Way</th><th>Starts with</th></tr></thead>
        <tbody>
          <tr><td>Hello</td><td>app → FM-1</td><td><code>F0 7D 46 53 00</code></td></tr>
          <tr><td>A row of the screen</td><td>FM-1 → app</td><td><code>F0 7D 46 53 01</code> row, column, pixels</td></tr>
          <tr><td>Sound name</td><td>FM-1 → app</td><td><code>F0 7D 46 53 02</code> the name in letters</td></tr>
          <tr><td>Big Knobs: a turn</td><td>app → FM-1</td><td><code>F0 7D 46 53 04</code> which knob, how many clicks</td></tr>
          <tr><td>Key Lights</td><td>FM-1 → app</td><td><code>F0 7D 46 53 05</code> lit keys and buttons</td></tr>
          <tr><td>MASTER</td><td>app → FM-1</td><td><code>F0 7D 46 53 06</code> the level</td></tr>
          <tr><td>A button press</td><td>app → FM-1</td><td><code>F0 7D 46 53 07</code> which, pressed or let go</td></tr>
        </tbody>
      </table>
      <p className="g-note">Some firmwares speak other dialects of the same idea: Big Screen 2 (<code>F0 7D 42 53</code>, whole rectangles), and fm1-base's own mirror, which travels inside the FM-1 updater's messages. FM-1 Big Screen speaks all three.</p>

      <h2>Example: stop the app when the firmware says hello</h2>
      <p>FM-1 Debugger is FM-1 Big Screen with a debugger built in. A <b>breakpoint</b> tells it: when this message comes, stop right there, before the app does anything with it.</p>
      <ol className="g-steps">
        <li><b>Install FM-1 Debugger</b> (<a href={DEBUGGER}>download</a>). On a Mac it sits beside FM-1 Big Screen; use one at a time.</li>
        <li><b>Plug in the FM-1</b>, running a firmware with Big Screen.</li>
        <li><b>Open the debugger:</b> click <b>Debug</b> in the bar, or press ⌘⇧D (Ctrl+Shift+D on Windows and Linux).</li>
        <li><b>Click "Stop when the firmware says hello".</b> Within a second the app stops.</li>
      </ol>
      <figure>
        <img src={`${BASE}guide/debugger-light.png`} alt="FM-1 Debugger stopped at a Sound name message from a real FM-1: the text 108 INIT, its hex dump, the app's state, and the message log" />
        <figcaption>A real FM-1, stopped. Top: STOPPED, and why. Middle: the message and the app's state. Bottom: every message, with the time between them.</figcaption>
      </figure>
      <p>Here the FM-1 answered the hello with its <b>sound name</b>. The debugger shows the bytes it sent:</p>
      <Bytes rows={[
        ["F0", "A SysEx message starts"],
        ["7D", "For experiments and education (no company's)"],
        ["46 53", "\"FS\": a Big Screen message"],
        ["02", "What it is: the sound name"],
        ["31 30 38 20 49 4E 49 54", "\"108 INIT\", one byte a letter (31 = \"1\", 49 = \"I\"…)"],
        ["F7", "The end"],
      ]} />
      <h3>Look at the app before it has acted</h3>
      <p>
        In <b>The app's state</b>, the FM-1's <b>sound</b> row doesn't say "108 INIT" yet: the app is stopped <em>before</em> it reads the
        message. Press <b>Next message</b> (F10). The app handles the message and stops at the next one, and the sound row now
        says 108 INIT, <b>highlighted</b>: changed since the last stop. That's the whole idea of a debugger: one step at a time, and see what each step did.
      </p>
      <h3>The buttons</h3>
      <table className="g-table">
        <tbody>
          <tr><td><b>Continue</b> (F5)</td><td>Run until a breakpoint matches again.</td></tr>
          <tr><td><b>Next message</b> (F10)</td><td>Handle this one, stop at the very next, either way.</td></tr>
          <tr><td><b>Next from the FM-1</b> (F11)</td><td>Let the app's own messages go by; stop at the FM-1's next.</td></tr>
          <tr><td><b>Next to the FM-1</b> (Shift+F11)</td><td>The other way round.</td></tr>
          <tr><td><b>Next Sound name</b></td><td>Stop at the next message of the same kind.</td></tr>
          <tr><td><b>Skip this message</b></td><td>The app never sees it. Try it on a sound name: the name on the big screen doesn't change.</td></tr>
        </tbody>
      </table>
      <h3>Read the timing</h3>
      <p>
        In the log, the hellos go out about <b>930 ms</b> apart, and the FM-1 answers within milliseconds. While the app is stopped
        at the FM-1's answer, it reads nothing more from the FM-1, so the big screen freezes. The hellos keep going out, because another
        part of the app sends them. Press <b>Continue</b> and the screen catches up.
      </p>
      <p>
        Stop the hellos instead (a breakpoint on <b>Hello (Big Screen 1)</b>, to the FM-1) and you see the other half of the protocol:
        about three seconds after the last hello, the FM-1 stops sending its screen. No hello, no screen.
      </p>
      <h3>More breakpoints to try</h3>
      <ul>
        <li><b>Key Lights:</b> stop when you press a key on the FM-1, and read which bits light up.</li>
        <li><b>Big Knobs: turn, to the FM-1:</b> turn a Big Knob in the app and see the message it sends (which knob, how many clicks).</li>
        <li><b>Bytes that start with</b> <code>F0 7D 46 53 ??</code>: any Big Screen message (<code>??</code> means any byte).</li>
        <li><b>Log only:</b> mark matching messages in the log without stopping, to count them.</li>
      </ul>
      <figure>
        <img src={`${BASE}guide/debugger-dark.png`} alt="FM-1 Debugger in its dark look, stopped at a screen row" />
        <figcaption>The same, white on black (the Light / Dark switch, top right). Stopped at a screen row: row 144, from column 28.</figcaption>
      </figure>

      <h2>Next: Part 2</h2>
      <p>The firmware that answered lives in the FM-1's flash. Part 2 opens the flash up, square by square, as M-Flasher draws it. To look ahead, the <Link to="/disassembler">FM-1 Disassembler</Link> already shows every C function of two real firmwares and the squares they live in.</p>
      <p className="g-note">FM-1 Debugger is a pre-release, tested on a Mac with a real FM-1; Windows and Linux are built but not yet tried. M-VAVE and FM-1 are M-VAVE's names; FM-1 Big Screen is independent.</p>
    </div>
  );
}

/* ---- Part 2: the flash, square by square ---- */

// M-VAVE's own table for the FM-1 (m-bootloader docs/SPEC.md §5.2 and §5.5), in 4 KB squares
const REGIONS = [
  { k: "boot", from: 0, to: 4, name: "Boot area", what: "The bootloader, the flash's table of contents, and the chip key record. Starts the FM-1.", install: "Kept" },
  { k: "fw", from: 4, to: 147, name: "Firmware", what: "The firmware's code and constants, stored scrambled with this FM-1's key. The chip runs it straight from here.", install: "Written: only the squares that change" },
  { k: "vm", from: 147, to: 233, name: "Settings (VM)", what: "Settings, presets, sequences. Custom firmwares keep their projects and samples here, or in places of their own.", install: "Kept" },
  { k: "bt", from: 233, to: 234, name: "Bluetooth pairings", what: "The devices it has paired with.", install: "Kept" },
  { k: "usr", from: 234, to: 252, name: "Sounds (USR)", what: "The synth's sound bank. Official updates never write it; if it's lost, only a backup brings it back.", install: "Kept" },
  { k: "free", from: 252, to: 255, name: "Not declared", what: "Not in M-VAVE's table. Some custom firmwares use gaps like this, so it isn't free to wipe.", install: "Kept" },
  { k: "fac", from: 255, to: 256, name: "Factory data", what: "This FM-1's own: its Bluetooth address and key data. Never copied from one FM-1 to another.", install: "Kept" },
];
const RCOL = { boot: "#e5484d", fw: "#3e9bff", vm: "#30a46c", bt: "#f5a524", usr: "#ff8fd6", free: "#3a4252", fac: "#f76b15" };
// where two real firmwares end (their builds: Skiff 0x8E76C, Erik37 0x90DBC)
const BUILDS = { none: null, skiff: { name: "Skiff + Big Screen", end: 0x8e76c }, erik37: { name: "Erik37 + Big Screen", end: 0x90dbc } };
const hx = (n) => "0x" + n.toString(16).toUpperCase().padStart(5, "0");

function FlashMap() {
  const [pick, setPick] = useState(null);
  const [fw, setFw] = useState("skiff");
  const b = BUILDS[fw];
  const usedTo = b ? Math.floor((b.end - 1) / 4096) : -1;
  const regionOf = (s) => REGIONS.find((r) => s >= r.from && s < r.to);
  const r = pick != null ? regionOf(pick) : null;
  return (
    <div className="g-map">
      <div className="g-map-top">
        <span>Firmware in the map:</span>
        {Object.entries(BUILDS).map(([k, v]) => (
          <button key={k} className={fw === k ? "on" : ""} onClick={() => setFw(k)}>{v ? v.name : "none"}</button>
        ))}
      </div>
      <div className="g-grid" role="grid" aria-label="The FM-1's flash: 256 squares of 4 KB">
        {Array.from({ length: 256 }, (_, s) => {
          const reg = regionOf(s);
          const empty = reg.k === "fw" && b && s > usedTo;
          return (
            <button key={s} className={`g-sq ${pick === s ? "pick" : ""} ${empty ? "empty" : ""}`}
              style={{ background: empty ? "transparent" : RCOL[reg.k], borderColor: RCOL[reg.k] }}
              title={`Square ${s}: ${hx(s * 4096)}–${hx(s * 4096 + 4095)} · ${reg.name}${empty ? " (empty in this build)" : ""}`}
              onClick={() => setPick(s)} />
          );
        })}
      </div>
      <div className="g-map-info">
        {r ? (
          <>
            <b>Square {pick}</b> · {hx(pick * 4096)}–{hx(pick * 4096 + 4095)} · <b style={{ color: RCOL[r.k] }}>{r.name}</b>
            {r.k === "fw" && b && (pick > usedTo ? " · empty: this build ends before it" : " · used by this build")}
            <br />{r.what} <i>An install: {r.install.toLowerCase()}.</i>
          </>
        ) : (
          <>Click a square. {b && <>{b.name} fills squares 4 to {usedTo} of the firmware's 4 to 146 ({Math.round(((usedTo - 3) / 143) * 100)}%).</>}</>
        )}
      </div>
    </div>
  );
}

function Part2() {
  return (
    <div className="g">
      <p className="g-kicker">Inside the FM-1 · Part 2 of 5</p>
      <h1>The FM-1's flash, square by square</h1>
      <p className="g-lead">
        The firmware that answered in Part 1 lives in the FM-1's flash memory: 1 MB, one chip, everything the FM-1 keeps.
        M-Flasher draws it as a grid of <b>256 squares</b>. Here's what every square is, and what installing a firmware does to it.
      </p>
      <Video id="vZHt1L0Avqk" title="Inside the FM-1, Part 2" caption="Part 2 as a video (2:34): the map drawn square by square, and what an install changes." />
      <Series current={2} />

      <h2>Why squares?</h2>
      <p>
        The FM-1's flash is NOR flash. Writing it can only turn 1 bits into 0 bits; to turn them back, the chip must
        <b> erase</b>, and the smallest piece it can erase is <b>4 KB</b> (a sector). So every tool that writes the flash
        works in 4 KB pieces, and 1 MB ÷ 4 KB = 256 of them. That's M-Flasher's grid: one square, one sector.
      </p>
      <ul>
        <li>Hover a square in M-Flasher to see its address and what it holds.</li>
        <li>Choose an action and the squares it would change are <b>outlined</b>.</li>
        <li>While it writes, they <b>light up</b> as each is written and checked. Only the squares that change are written.</li>
      </ul>

      <h2>The map</h2>
      <p>This is M-VAVE's own table for the FM-1, drawn the same way. Pick a firmware to see how much of the firmware area it fills, and click any square.</p>
      <FlashMap />
      <table className="g-table">
        <thead><tr><th>Squares</th><th>Address</th><th>Size</th><th>What</th><th>An install</th></tr></thead>
        <tbody>
          {REGIONS.map((r) => (
            <tr key={r.k}>
              <td><i className="g-key" style={{ background: RCOL[r.k] }} />{r.to - r.from > 1 ? `${r.from}–${r.to - 1}` : r.from}</td>
              <td><code>{hx(r.from * 4096)}</code></td>
              <td>{(r.to - r.from) * 4} KB</td>
              <td><b>{r.name}</b></td>
              <td>{r.install}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="g-note">
        Custom firmwares don't all follow the table: the Felucca family (SLOOP, Skiff, Melodee…) keeps projects inside the
        settings area and some data elsewhere. That's why no tool can safely "wipe the settings" for every firmware.
      </p>

      <h2>Two things worth knowing</h2>
      <h3>The firmware is stored scrambled</h3>
      <p>
        The firmware squares are stored encrypted with a key from this FM-1's chip. The chip unscrambles them as it reads, so
        the code runs straight from the flash (no copy into memory). That's why a backup of the firmware area looks like noise,
        and why installers need the chip key record in the boot area.
      </p>
      <h3>Two real firmwares are nearly full</h3>
      <p>
        Skiff + Big Screen ends at <code>0x8E76C</code>, square 142; Erik37 + Big Screen at <code>0x90DBC</code>, square 144. The
        firmware area ends at square 146. That's why adding Big Screen to some firmwares needs a "squeeze" (Part 3 shows where the
        space goes).
      </p>

      <h2>How to: look at your own FM-1's flash</h2>
      <ol className="g-steps">
        <li><b>Download mode:</b> put the FM-1 in download mode as M-Flasher's instructions say for your FM-1 (with m-bootloader installed: hold <b>REC</b> while you switch it on).</li>
        <li><b>Back up first.</b> In <a href="https://github.com/jvitkauskas/m-flasher">M-Flasher</a>, back up the whole flash. It saves the 1 MB image and a <code>.json</code> describing it, in <code>Documents/M-Flasher/backups</code>, with a checksum, so a damaged backup is refused later.</li>
        <li><b>Read the map.</b> Hover the squares: boot area first, then the firmware, settings, Bluetooth, sounds, and the factory square at the end.</li>
        <li><b>Install, and watch.</b> Choose <b>Install firmware (.fwsc)</b>: the outlined squares are the only ones it may change. M-Flasher also makes a full backup before the first write of a session. The boot area, settings, Bluetooth pairings, presets and sequences stay as they are.</li>
        <li><b>See which code sits where.</b> The <Link to="/disassembler">FM-1 Disassembler</Link> draws the same 256 squares for two real firmwares: click a square to see the C functions that live in it.</li>
      </ol>

      <h2>Next: Part 3</h2>
      <p>How C code becomes those firmware squares: the compiler, the linker's map, and where the firmware's memory goes when it runs (RAM, and the POOL).</p>
      <p className="g-note">Sources: M-Flasher's documentation, and the m-bootloader specification (the FM-1's flash format and region table). M-VAVE and FM-1 are M-VAVE's names.</p>
    </div>
  );
}

/* ---- Part 3: from C code to the chip ---- */
const SECT = [
  ["XIP (flash)", ".text", "Code and constants. Runs straight from the flash.", 557904, 573540, 581564],
  ["RAM code", ".ram_text", "Code that must run while the flash is busy (the flash driver; Skiff's busiest audio code). Copied from the flash at start.", 8456, 2924, 24576],
  ["RAM", ".data", "Variables with a starting value. Copied from the flash at start.", 500, 204, null],
  ["RAM", ".bss", "Variables that start at zero.", 91988, 82772, null],
  ["POOL", ".pool", "Big buffers that start at zero: delay lines, screens, frames.", 347296, 333124, null],
  ["NOINIT", ".noinit", "Kept across a reset (crash records, boot guards).", 10456, 484, null],
];
const kb = (b) => (b >= 1024 ? (b / 1024).toFixed(1) + " KB" : b + " B");

function Part3() {
  return (
    <div className="g">
      <p className="g-kicker">Inside the FM-1 · Part 3 of 5</p>
      <h1>From C code to the chip: compiling, the linker, RAM and the POOL</h1>
      <p className="g-lead">
        A firmware starts as C source files. Part 3 follows it into the FM-1: what the compiler makes, how the linker decides
        where every piece goes, and where the firmware's memory goes when it runs, including the POOL.
      </p>
      {P3_VIDEO && <Video id={P3_VIDEO} title="Inside the FM-1, Part 3" caption="Part 3 as a video." />}
      <Series current={3} />

      <h2>1. The compiler: C becomes machine code</h2>
      <p>
        The FM-1's chip doesn't run C; it runs its own machine code (JieLi's <b>pi32v2</b>). JieLi's compiler, clang, turns every C function into
        those instructions, here with <code>-Os</code>: as small as it can, because space is short. This is the first function a Felucca-family
        firmware runs after its start-up code (Skiff, <code>firmware/src/main.c</code>):
      </p>
      <pre className="g-code">{`void fm1_cstart(void)
{
    uint32_t *s, *d, p3, src, wdt;
    fm1_time_init();
    fm1_reset_reason();
    ...`}</pre>
      <p>and the first instructions of the code the chip really runs, at the very start of the firmware:</p>
      <pre className="g-code">{`2000120:  04 81              goto  _start+4
2000124:  64 e0 00 1b        r1 = icfg
2000128:  64 e0 00 25        r2 = psr
200012c:  60 00              cli
...
2000152:  82 ea 84 13        call  fm1_cstart`}</pre>
      <p>The address <code>2000120</code> is where the chip sees the firmware's first byte. On the flash, that's <code>0x04120</code>: square 4, the first firmware square from Part 2.</p>

      <h2>2. The linker: where every piece goes</h2>
      <p>
        The compiler makes pieces; the <b>linker</b> puts them together, following a short script (<code>app.ld</code>) that describes the chip's
        memory. The Felucca family's, which fm1-base shares, says:
      </p>
      <pre className="g-code">{`MEMORY {
  XIP     (rx)  : ORIGIN = 0x02000120   /* the flash, as the chip reads it */
  RAMTEXT (rwx) : ORIGIN = 0x01C00000, LENGTH = 24K
  RAM     (rwx) : ORIGIN = 0x01C08000, LENGTH = 96K
  POOL    (rw)  : ORIGIN = 0x01C20000, LENGTH = 348K   /* Erik37: 336K */
  NOINIT  (rw)  : ORIGIN = 0x01C7C000
}`}</pre>
      <p>Everything a firmware has lands in one of these, sorted by kind. The real sizes from two builds:</p>
      <table className="g-table">
        <thead><tr><th>Goes to</th><th>Section</th><th>What</th><th>Skiff + Big Screen</th><th>Erik37 + Big Screen</th></tr></thead>
        <tbody>
          {SECT.map(([where, sec, what, a, b]) => (
            <tr key={sec}><td>{where}</td><td><code>{sec}</code></td><td>{what}</td><td>{kb(a)}</td><td>{kb(b)}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="g-note">The firmwares use about 512 KB of the chip's RAM (<code>0x01C00000</code>–<code>0x01C80000</code>), and there's no memory chip besides the flash. The stacks share it too.</p>

      <h2>3. The POOL: where the big buffers go</h2>
      <p>
        Ordinary variables get <b>96 KB</b> of RAM. Anything big (a delay line, a whole screen being drawn) is marked for the <b>POOL</b>, a
        much larger region of its own. In fm1-base it's one word on the variable (Erik37's <code>draw.c</code>):
      </p>
      <pre className="g-code">{`#define PLAT_POOL __attribute__((section(".pool")))

static uint8_t W[SW * SH * 3] PLAT_POOL;   /* the frame being drawn */
static uint8_t MASK[SW * SH]  PLAT_POOL;   /* coverage 0..255 */`}</pre>
      <p>
        Skiff's POOL holds 339 KB of its 348 KB; Erik37's 325 KB of 336 KB. fm1-base's build refuses a firmware that leaves less than 8 KB
        of the POOL spare.
      </p>

      <h2>4. When it doesn't fit: the squeeze</h2>
      <p>Adding Big Screen to a firmware that's already full means finding room. We call it a squeeze, and its rules are simple:</p>
      <ol className="g-steps">
        <li><b>Move before removing.</b> Big Screen's 6 KB screen buffer goes into the POOL instead of ordinary RAM. That alone made Melodee fit.</li>
        <li><b>Then switch off what's optional,</b> one step at a time: a USB console, debug counters, a second CPU core's job, a smaller audio buffer.</li>
        <li><b>Never the safety checks.</b> The stack limits and the POOL's spare room stay.</li>
      </ol>
      <p>
        It doesn't always work: one popular firmware still needs about 300 bytes more RAM and 1.4 KB more POOL after every step, so it has
        no Big Screen build. And the same trick is our tip to other firmware authors: a small buffer moved into the POOL can free just the
        RAM a feature needs.
      </p>

      <h2>How to: see it for yourself</h2>
      <ol className="g-steps">
        <li>Open the <Link to="/disassembler">FM-1 Disassembler</Link> and pick <b>Skiff</b>.</li>
        <li>Click <code>fm1_cstart</code>: its C on the left, its machine code on the right, its square lit in the map.</li>
        <li>Open <b>RAM &amp; POOL</b>: every variable, largest first, in the region the linker put it in.</li>
      </ol>
      <h2>Next: Part 4</h2>
      <p>The two families every FM-1 community firmware comes from, Felucca and fm1-base: what they share, and how they differ.</p>
    </div>
  );
}

/* ---- Part 4: the two families ---- */
function Part4() {
  return (
    <div className="g">
      <p className="g-kicker">Inside the FM-1 · Part 4 of 5</p>
      <h1>The two families: Felucca and fm1-base</h1>
      <p className="g-lead">Almost every community firmware for the FM-1 grew from one of two parents. They're cousins: same chip layer, different ideas about how to build a firmware.</p>
      {P4_VIDEO && <Video id={P4_VIDEO} title="Inside the FM-1, Part 4" caption="Part 4 as a video." />}
      <Series current={4} />

      <h2>Felucca</h2>
      <p>
        <b>Felucca</b>, by Leo Kuroshita (Hügelton Instruments), GPL-3.0, is an open firmware for the FM-1 whose children are
        <b> forks</b>: a whole copy of Felucca, changed into a new instrument. SLOOP, Skiff, JIANT, Melodee, ChoralRoot and others started this way.
      </p>
      <ul>
        <li>One program: the hardware code (screen, keys, USB, audio) and the instrument live together, and a firmware changes whatever it needs.</li>
        <li>Choices are made in the C code (for example <code>FELUCCA_CPU2</code> for the second core, <code>FELUCCA_CDC</code> for a USB console).</li>
        <li>USB is polled from a timer interrupt; the PC guard watches for code running where it shouldn't.</li>
      </ul>

      <h2>fm1-base</h2>
      <p>
        <b>fm1-base</b>, by Charles Vestal, MPL-2.0, is a <b>platform</b>: a firmware is an app on top of it. Underneath is <b>felucca-bsp</b>,
        Felucca's chip and board code, used with Leo's permission. CTL-1 and Radio were its first proof points; LOOM-8, Polly, Ocarina, h1 and
        Erik37's base are built on it.
      </p>
      <ul>
        <li>The app talks to the hardware through one interface (<code>plat.h</code>), and the parts it wants are switched on in <code>fm1.toml</code>: Bluetooth MIDI, USB audio, WiFi, its own screen mirror.</li>
        <li>The same app runs in a simulator on a computer and in a browser emulator.</li>
        <li>Its build checks the memory: less than 8 KB of POOL to spare and it refuses.</li>
        <li>A firmware has Bluetooth or WiFi, not both: either fills most of what the chip has.</li>
      </ul>

      <h2>Side by side</h2>
      <table className="g-table">
        <thead><tr><th></th><th>Felucca family</th><th>fm1-base family</th></tr></thead>
        <tbody>
          <tr><td>Started by</td><td>Leo Kuroshita</td><td>Charles Vestal</td></tr>
          <tr><td>Licence</td><td>GPL-3.0 (children stay GPL)</td><td>MPL-2.0 (an app may use any licence)</td></tr>
          <tr><td>A new firmware is</td><td>a fork of the whole thing</td><td>an app on the platform</td></tr>
          <tr><td>Choosing parts</td><td>in the C code</td><td><code>fm1.toml</code></td></tr>
          <tr><td>Chip layer</td><td>its own</td><td>felucca-bsp (Felucca's, shared)</td></tr>
          <tr><td>Memory map</td><td colSpan={2}>the same: XIP code, 96 KB RAM, the POOL, NOINIT (Part 3)</td></tr>
          <tr><td>Packaging</td><td colSpan={2}>the same <code>.fwsc</code> package and update loader</td></tr>
          <tr><td>Screen on a computer</td><td>our Big Screen messages (<code>F0 7D 46 53</code>, Part 1)</td><td>its own mirror, inside the updater's messages</td></tr>
          <tr><td>Try it without an FM-1</td><td>other people's emulators</td><td>a simulator and a browser emulator, built in</td></tr>
        </tbody>
      </table>

      <h2>How they're alike, really</h2>
      <p>
        Under the different shapes, both run on the same chip in the same way: code straight from the flash, the same RAM, split
        the same way, the same flash map from Part 2, and the same package an installer writes. That's why one tool, FM-1 Big Screen, can show
        the screen of both kinds; it only has to speak two dialects.
      </p>

      <h2>How to: tell which family a firmware is</h2>
      <ol className="g-steps">
        <li>Look at its source: a <code>fm1.toml</code> and a <code>plat.h</code> mean fm1-base; a <code>firmware/hal/</code> folder with <code>fm1_guard.h</code> and <code>felucca.c</code> means the Felucca family.</li>
        <li>Or ask the running FM-1: in <Link to="/guide/1">FM-1 Debugger</Link>, a Felucca-family firmware with Big Screen answers the hello with <code>F0 7D 46 53</code> rows; an fm1-base firmware with its mirror answers the "fm1-base mirror" hello.</li>
        <li>Compare the two in the <Link to="/disassembler">FM-1 Disassembler</Link>: Skiff (Felucca, 1,229 functions) and Erik37 (fm1-base, 201: many small functions are folded into bigger ones when it's built).</li>
      </ol>
      <h2>Next: Part 5</h2>
      <p>Breakpoints inside the firmware itself: how the FM-1's chip can stop on one instruction.</p>
    </div>
  );
}

/* ---- Part 5: breakpoints in the firmware ---- */
function Part5() {
  return (
    <div className="g">
      <p className="g-kicker">Inside the FM-1 · Part 5 of 5</p>
      <h1>Debugging on the FM-1 itself: breakpoints in the firmware</h1>
      <p className="g-lead">
        FM-1 Debugger (Part 1) stops the <i>app</i>. This part is about stopping the <i>firmware</i>: the FM-1's own chip, on one instruction,
        with its registers in view. How the chip makes that possible, and where our firmware debugger stands.
      </p>
      {P5_VIDEO && <Video id={P5_VIDEO} title="Inside the FM-1, Part 5" caption="Part 5 as a video." />}
      <Series current={5} />
      <p className="g-note"><b>Status, honestly:</b> the firmware debugger is being built. Nothing in this part has been run on a real FM-1 yet; when it has, this page will say so.</p>

      <h2>The obvious way doesn't fit</h2>
      <p>
        Most debuggers for small chips add a little code to every function: "stop here if asked". JieLi's compiler can do that
        (<code>-finstrument-functions</code>), but it costs about 50–70 KB, and Part 2 showed the firmware area is nearly full: Skiff has
        under 20 KB left, Erik37 under 10 KB. So we use the chip itself.
      </p>

      <h2>The chip's PC guard</h2>
      <p>
        The FM-1's chip has a hardware watch on where code runs: two <b>windows</b> of addresses (<code>PC_LIMIT0</code> and
        <code> PC_LIMIT1</code>). If the processor runs an instruction outside both windows, it raises the <b>CPU exception</b> right after that
        instruction. Felucca uses it as a crash guard: the windows cover the firmware's code, so a jump into nowhere is caught
        (<code>firmware/hal/fm1_guard.h</code>):
      </p>
      <pre className="g-code">{`#define FM1_PC_LIMIT0_H FM1_X2(0x380u)
#define FM1_PC_LIMIT0_L FM1_X2(0x384u)
#define FM1_PC_LIMIT1_H FM1_X2(0x388u)
#define FM1_PC_LIMIT1_L FM1_X2(0x38Cu)
/* PC limit: instruction fetch outside [0x02000120, _etext]
                     -> DBG_MSG bit 12 */`}</pre>

      <h2>Turning a guard into a breakpoint</h2>
      <p>Set the two windows to <b>everything except one address</b>, X:</p>
      <ul>
        <li>window 0: from the start of the code up to X,</li>
        <li>window 1: from just after X to the end.</li>
      </ul>
      <p>
        The moment the processor runs the instruction at X, it's outside both windows: the exception comes, and the firmware is stopped right
        there. Leave out the <i>next</i> instruction instead, and you have <b>single-step</b>; leave out the return address, and you have
        <b> step out</b>. No extra code in the firmware, nothing slower.
      </p>

      <h2>What you see when it stops</h2>
      <p>The exception's entry already saves every register. Felucca's (<code>fm1_vec.S</code>):</p>
      <pre className="g-code">{`fm1_fatal_common:
    [--sp] = {sp, ssp, usp, icfg, psr, rets, retx, rete, reti}
    [--sp] = {r15-r0}
    r0 = sp      /* frame: r0..r15, reti, rete, retx, rets, psr, icfg, usp, ssp, sp */`}</pre>
      <p>
        Felucca's version reports a crash and never returns. A debugger's version shows that frame (r0–r15, the stack, where it was going
        back to), then returns and lets the firmware go on.
      </p>

      <h2>Talking while stopped</h2>
      <p>
        A stopped FM-1 still has to talk to the page that controls it. In the Felucca family, USB isn't driven by its own interrupt: it's
        <b> polled</b> (<code>usb_poll</code>, from the TIMER5 interrupt). So the stopped firmware can keep calling that poll itself, and keep
        answering over the same USB MIDI cable that Part 1 showed.
      </p>

      <h2>Putting it together</h2>
      <ol className="g-steps">
        <li>Pick a function in the <Link to="/disassembler">FM-1 Disassembler</Link>: its address is the breakpoint.</li>
        <li>A debug build of the firmware sets the two windows and waits in its exception handler when they trip.</li>
        <li>The page shows the registers and the C around the address, and sends Step, Step over, Step out or Continue.</li>
      </ol>
      <p>
        That's the plan for both families' firmwares (Skiff for Felucca, Erik37 for fm1-base), and for a browser version, in an FM-1 emulator, for
        anyone without an FM-1. Each part will be tested on a real FM-1 before it's published.
      </p>

      <h2>The whole series</h2>
      <Series current={5} />
    </div>
  );
}
const P3_VIDEO = "";
const P4_VIDEO = "";
const P5_VIDEO = "";
