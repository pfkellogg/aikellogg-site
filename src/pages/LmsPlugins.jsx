// LmsPlugins.jsx: the WordPress (LearnDash) and Moodle plugins in one place; each has its own page.
import { Link } from "react-router-dom";

export default function LmsPlugins() {
  return (
    <div className="home">
      <p className="kicker">WordPress · LearnDash · Moodle · H5P</p>
      <h1>LMS plugins</h1>
      <p className="lead">Plugins for course builders on WordPress (LearnDash) and Moodle: H5P you can trust, and certificates anyone can check.</p>
      <div className="cards">
        <Link to="/viewer-for-h5p" className="card">
          <h2>Viewer for H5P</h2>
          <p>Free, for WordPress and Moodle: see every question and answer in the H5P content on a page, the right ones marked.</p>
        </Link>
        <Link to="/secure-answers-for-h5p" className="card">
          <h2>Secure Answers for H5P</h2>
          <p>For WordPress and Moodle: keeps H5P's correct answers on the server, so H5P can be used for real tests. Every purchase supports the Foundation.</p>
        </Link>
        <Link to="/mark-complete-gate" className="card">
          <h2>Mark Complete Gate</h2>
          <p>Free, for WordPress + LearnDash: Mark Complete stays locked until the learner has done the H5P.</p>
        </Link>
        <Link to="/certificate-verifier" className="card">
          <h2>Certificate Verifier</h2>
          <p>Free, for WordPress + LearnDash: a QR code on every certificate. Scan it: verified, expired or forged.</p>
        </Link>
      </div>
    </div>
  );
}
