// Home.jsx: aikellogg.com's front page (a first version: the user will shape it).
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">
      <h1>AIKellogg</h1>
      <p className="lead">Free tools for the M-VAVE FM-1 and for musicians, especially those who find small screens hard to read, and for WordPress and Moodle course builders.</p>
      <div className="cards">
        <Link to="/make-big-screen" className="card">
          <h2>Big Screen Firmwares</h2>
          <p>169 FM-1 firmwares from The Firmware Hub, already built Big Screen, with Big Knobs and Key Lights: pick one, see it big, download it.</p>
        </Link>
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
