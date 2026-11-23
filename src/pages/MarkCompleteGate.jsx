import Video from "../components/Video.jsx";
// MarkCompleteGate.jsx: the detail page of the WordPress plugin Mark Complete Gate for H5P in LearnDash
// (github.com/pfkellogg/mark-complete-gate-for-h5p).
const GITHUB = "https://github.com/pfkellogg/mark-complete-gate-for-h5p";
const ZIP = "https://github.com/pfkellogg/mark-complete-gate-for-h5p/releases/latest/download/mark-complete-gate-for-h5p.zip";

function Mock() {
  return (
    <div className="h5pv-mock mcg-mock" aria-label="A drawing of a lesson with its Mark Complete button locked">
      <div className="mcg-lesson">
        <div className="mcg-q">What color does the blackcurrant berry actually have?</div>
        <div className="mcg-a">○ Black</div>
        <div className="mcg-a">○ Blue</div>
        <div className="mcg-a">○ Very dark purple</div>
        <div className="mcg-check">Check</div>
        <div className="mcg-msg">Please complete the H5P activity to enable the "Mark Complete" button.</div>
        <div className="mcg-btn">🔒 Mark Complete</div>
      </div>
    </div>
  );
}

export default function MarkCompleteGate() {
  return (
    <div className="detail">
      <img className="banner" src="img/mark-complete-gate-banner.png" alt="Mark Complete Gate for H5P in LearnDash: the button stays locked until the H5P is done" />
      <p className="kicker">WordPress plugin · free · GPL</p>
      <h1>Mark Complete Gate for H5P in LearnDash</h1>
      <p className="lead">
        Learners can click LearnDash's <b>Mark Complete</b> without even trying the H5P activity. This keeps the button
        locked until every H5P activity on the lesson or topic is done.
      </p>
      <div className="actions">
        <a className="btn" href={ZIP}>Download the plugin (zip)</a>
        <a className="btn ghost" href={GITHUB}>Source on GitHub</a>
      </div>
      <p className="note">Coming soon to the WordPress.org plugin directory.</p>

      <Mock />

      <h2>Watch</h2>
      <Video id="il5P1rG8zf8" title="Stop LearnDash Learners Skipping Your H5P: Mark Complete Gate (Free Plugin)" caption="Locked, a wrong answer, then unlocked, in a real LearnDash lesson (2:07)." />

      <h2>What it does</h2>
      <ul>
        <li><b>No setup:</b> activate it, and every lesson and topic with H5P is gated. Pages without H5P are left alone.</li>
        <li><b>Passing counts:</b> a scored activity counts once the learner passes it; a wrong answer keeps the button locked, and they can retry.</li>
        <li><b>Every activity:</b> with several H5P on a page, all must be done; a message shows how many are complete.</li>
        <li><b>Works with H5P's frames:</b> it listens to H5P's own completion events (xAPI), so it works the usual way H5P runs in WordPress.</li>
        <li><b>A clean slate:</b> when a user is permanently deleted, their H5P scores, saved progress and activity log are deleted too, however they're deleted.</li>
      </ul>

      <h2>Per page, with a shortcode</h2>
      <p>Put it anywhere in a lesson or topic (a Shortcode block in the block editor). It shows nothing on the page.</p>
      <ul>
        <li><code>[mark_complete_gate ignore="3,7"]</code>: H5P items 3 and 7 don't count (say, an Accordion that can't be "completed").</li>
        <li><code>[mark_complete_gate off]</code>: no gate on this page.</li>
      </ul>

      <h2>Good to know</h2>
      <p>
        The lock is in the learner's browser: it keeps honest learners on track, but someone determined can get around it.
      </p>
      <div className="fix">
        <p className="kicker">Enforced gating</p>
        <h3>H5P Gating &amp; Scoring for LearnDash</h3>
        <p>
          The paid plugin locks every way forward (Mark Complete, Start Quiz, quiz links, Next Lesson and the Next buttons
          inside quizzes), requires passing scores, feeds H5P scores into LearnDash grading, and remembers completions,
          configured per lesson with a block.
        </p>
        <p className="note">Coming soon. Questions: on the AIKellogg YouTube channel.</p>
      </div>

      <h2>Install</h2>
      <ol>
        <li>Install and activate <b>H5P</b> and <b>LearnDash</b>.</li>
        <li>Download the zip above, then in WordPress: <b>Plugins → Add New → Upload Plugin</b>, choose it, and activate.</li>
        <li>That's all. Open a lesson with H5P as a learner: Mark Complete is locked until it's done.</li>
      </ol>

      <p className="fine">
        H5P is a registered trademark of H5P Group. LearnDash is a trademark of its owner. This plugin is independent and
        not made or endorsed by either.
      </p>
    </div>
  );
}
