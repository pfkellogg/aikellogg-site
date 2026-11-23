// Home.jsx: aikellogg.com's front page (a first version: the user will shape it).
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">
      <h1>AIKellogg</h1>
      <p className="lead">Free tools for the M-VAVE FM-1 and for musicians, especially those who find small screens hard to read, and for WordPress course builders.</p>
      <div className="cards">
        <Link to="/flute-lab" className="card">
          <h2>Mellotron Flute Lab</h2>
          <p>Shape your own Mellotron flute with sliders, play it, and enter the contest.</p>
        </Link>
        <a className="card" href="https://github.com/pfkellogg/fm1-mirror">
          <h2>FM-1 Big Screen</h2>
          <p>The FM-1's screen, big, on Mac, Windows and Linux, with the spyglass and the Mellotron.</p>
        </a>
        <a className="card" href="https://github.com/pfkellogg/fm1-mirror-spyglass-android">
          <h2>FM-1 Big Screen for Android</h2>
          <p>Tablets, phones and Fire TV: the big screen, the spyglass, the piano and the Mellotron.</p>
        </a>
        <Link to="/viewer-for-h5p" className="card">
          <h2>Viewer for H5P</h2>
          <p>A WordPress plugin: see every question and answer in the H5P content on a page, the right ones marked.</p>
        </Link>
        <Link to="/mark-complete-gate" className="card">
          <h2>Mark Complete Gate</h2>
          <p>A WordPress plugin: LearnDash's Mark Complete stays locked until the learner has done the H5P.</p>
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
