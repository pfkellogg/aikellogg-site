import { Link, useParams } from "react-router-dom";

/* Inside the FM-1: a how-to guide in five parts. Part 1: the overview, and a debugging example with FM-1 Debugger.
   Route: #/guide (the series) and #/guide/1 … #/guide/5. */

const PARTS = [
  { n: 1, title: "How the app and the FM-1 talk, and catching them at it", ready: true },
  { n: 2, title: "The FM-1's flash, square by square", ready: false },
  { n: 3, title: "From C code to the chip: compiling, the linker, RAM and the POOL", ready: false },
  { n: 4, title: "The two families: Felucca and fm1-base", ready: false },
  { n: 5, title: "Debugging on the FM-1 itself: breakpoints in the firmware", ready: false },
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
