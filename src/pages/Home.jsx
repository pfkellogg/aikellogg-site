// Home.jsx: aikellogg.com's front page (a first version: the user will shape it).
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">
      <h1>AIKellogg</h1>
      <p className="lead">Free tools for the M-VAVE FM-1 and for musicians, especially those who find small screens hard to read, and for WordPress and Moodle course builders.</p>
      <div className="cards">
        <Link to="/play" className="card">
          <h2>Play with your FM-1</h2>
          <p>Plug in your FM-1 and play 25 sounds right in your browser, nothing to install, one at a time or layered: a grand piano and 24 Mellotron-style sounds, from flute, strings and choir to shakuhachi, flugelhorn, brass, sitar, vibraphone, triangle, Tibetan bells and five FM sounds (an FM electric piano, tubular bells, a glass choir, crystal strings and a glass harmonica).</p>
        </Link>
        <a className="card" href="/grand-piano/">
          <h2>🎹 AIK GRAND</h2>
          <p>A real grand piano for your FM-1 running SLOOP, free: a Yamaha C5 (the Salamander Grand Piano) in one of its sample slots. One click installs it from Chrome or Edge, into an empty slot.</p>
        </a>
        <a className="card" href="/gobble/">
          <h2>🦃 GOBBLE</h2>
          <p>Happy Thanksgiving! A free, just-for-fun FM-1 firmware: up to eight turkeys gobble two songs in twelve styles, from fiddle to heavy metal and K-pop. Shows big in FM-1 Big Screen.</p>
        </a>
        <Link to="/make-big-screen" className="card">
          <h2>Big Screen Firmwares</h2>
          <p>173 FM-1 firmwares from The Firmware Hub, already built Big Screen, with Big Knobs and Key Lights: pick one, see it big, download it.</p>
        </Link>
        <Link to="/fix-your-firmware" className="card">
          <h2>Fix your firmware</h2>
          <p>For FM-1 firmware authors: the best-practice guide for FM-1 Big Screen, and a free fix for yours.</p>
        </Link>
        <a className="card" href="/fm1-v16-guide/">
          <h2>FM-1 V16 Guide</h2>
          <p>M-VAVE's official V16 firmware, page by page, with the real screens: effects, envelopes, the six operators (the black keys pick them), voices, arpeggiator, sequencer and SAVE. Free PDF to download.</p>
        </a>
        <Link to="/flute-lab" className="card">
          <h2>Mellotron Flute Lab</h2>
          <p>Shape your own Mellotron flute with sliders, play it, and enter the contest.</p>
        </Link>
        <a className="card" href="https://github.com/pfkellogg/fm1-mirror">
          <h2>FM-1 Big Screen</h2>
          <p>The FM-1's screen, big, on Mac, Windows and Linux: Big Knobs, Key Lights, the spyglass and the Mellotron.</p>
        </a>
        <a className="card" href="https://github.com/pfkellogg/fm1-mirror-spyglass-android">
          <h2>FM-1 Big Screen for Android</h2>
          <p>Tablets, phones and Fire TV: the big screen, Big Knobs, Key Lights, the spyglass, the piano and the Mellotron.</p>
        </a>
        <Link to="/lms-plugins" className="card">
          <h2>LMS plugins</h2>
          <p>For WordPress (LearnDash) and Moodle: Viewer for H5P, Secure Answers for H5P, Mark Complete Gate and Certificate Verifier.</p>
        </Link>
        <a className="card" href="https://www.youtube.com/@AIKellogg">
          <h2>YouTube</h2>
          <p>Videos about all of it.</p>
        </a>
      </div>
      <p className="support">
        Support the Patrick Kellogg Foundation for the Performing Arts: <a href="https://ko-fi.com/aikellogg">ko-fi.com/aikellogg</a>
      </p>
    </div>
  );
}
