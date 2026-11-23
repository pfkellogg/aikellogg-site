import { Link } from "react-router-dom";
import Video from "../components/Video.jsx";
// ViewerForH5P.jsx: the detail page of the WordPress plugin Viewer for H5P (github.com/pfkellogg/h5p-viewer).
// The picture is a drawing of the plugin's button and panel (HTML), until there are screenshots.
const GITHUB = "https://github.com/pfkellogg/h5p-viewer";
const ZIP = "https://github.com/pfkellogg/h5p-viewer/releases/latest/download/viewer-for-h5p.zip";

function Mock() {
  return (
    <div className="h5pv-mock" aria-label="A drawing of the viewer's panel">
      <div className="h5pv-panel">
        <div className="h5pv-head">Viewer for H5P <span>×</span></div>
        <div className="h5pv-item">
          <div><b>Type:</b> H5P.InteractiveVideo 1.27</div>
          <div><b>Title:</b> Safety walkthrough · <b>ID:</b> 12</div>
          <div className="h5pv-q">
            <div><b>Time:</b> 0:42 · <b>Type:</b> H5P.MultiChoice</div>
            <div><b>Question:</b> Where is the nearest fire exit?</div>
            <ul>
              <li className="ok">✓ Behind the reception desk</li>
              <li className="no">✕ Next to the elevators</li>
              <li className="no">✕ On the roof</li>
            </ul>
          </div>
          <div className="h5pv-q">
            <div><b>Time:</b> 1:15 · <b>Type:</b> H5P.TrueFalse</div>
            <div><b>Question:</b> Fire doors may be propped open.</div>
            <ul><li className="ok">✓ False</li><li className="no">✕ True</li></ul>
          </div>
          <div className="h5pv-used"><b>Used on:</b> Lesson 3: Fire Safety (published)</div>
        </div>
      </div>
      <div className="h5pv-button">H5P <span>2</span></div>
    </div>
  );
}

export default function ViewerForH5P() {
  return (
    <div className="detail">
      <img className="banner" src="img/viewer-for-h5p-banner.png" alt="Viewer for H5P: see every question and answer on the page, the right ones marked" />
      <p className="kicker">WordPress plugin · free · GPL</p>
      <h1>Viewer for H5P</h1>
      <p className="lead">
        See every question and answer in the H5P content on a page: its type, its ID, and which answers are right. For
        course builders and reviewers.
      </p>
      <div className="actions">
        <a className="btn" href={ZIP}>Download the plugin (zip)</a>
        <a className="btn ghost" href={GITHUB}>Source on GitHub</a>
      </div>
      <p className="note">Coming soon to the WordPress.org plugin directory, so you can install it from Plugins → Add New.</p>

      <Mock />

      <h2>Watch</h2>
      <Video id="JvFwH5DdlaI" title="Your H5P Quiz Answers Are in Every Learner's Browser (Viewer for H5P, Free Plugin)" caption="Viewer for H5P, and the answers in the page's markup and JSON (2:02)." />
      <p className="note">
        The fix, before and after: <Link to="/secure-answers-for-h5p">Secure Answers for H5P</Link> (
        <a href="https://youtu.be/_XCNjDt46H4">video</a>).
      </p>

      <h2>What it shows</h2>
      <p>
        Open any page or lesson with H5P on it and a small <b>H5P</b> button appears in the bottom-right corner, with a
        badge counting the H5P items on the page. Click it for a panel that lists, for each one:
      </p>
      <ul>
        <li>its <b>content type</b> and <b>H5P ID</b></li>
        <li>every <b>question</b> with <b>every answer</b>, the correct ones marked</li>
        <li>the questions <b>inside</b> Interactive Video (with their times), Course Presentation, Question Set and Column</li>
        <li>the <b>pages and posts</b> that use it, with links to view or edit them</li>
        <li>its <b>xAPI coverage</b>: the xAPI verbs it sends, and whether it's scored and reports completion</li>
      </ul>
      <p>No shortcode, block or template change: once it's active, the button shows on every page with H5P content, and only there.</p>

      <h2>Who sees it</h2>
      <p>
        Only logged-in users with a role you allow, <b>administrators by default</b>. Choose the roles under{" "}
        <b>Settings → Viewer for H5P</b>. If you allow a learner role, the settings page warns you: learners would see the
        correct answers. The answers come from a REST route that checks the same roles.
      </p>

      <h2>Why it matters: H5P sends the answers to every browser</h2>
      <p>
        The viewer only shows its panel to the roles you allow. But <b>H5P itself sends every correct answer to each
        learner's browser</b>, in the page, where anyone can read it with the browser's developer tools. This viewer shows
        you exactly what they can find.
      </p>
      <div className="fix">
        <p className="kicker">The fix</p>
        <h3>Secure Answers for H5P</h3>
        <p>
          A separate, paid plugin that keeps the answers on the server: they're taken out of the page, and checked by the
          server when a learner answers. Its exam mode puts no question data in the page at all until the learner is ready.
        </p>
        <p className="note">$129 a year, and every purchase goes to the Patrick Kellogg Foundation for the Performing Arts.</p>
        <p><Link className="btn" to="/secure-answers-for-h5p">See Secure Answers for H5P</Link></p>
      </div>

      <h2>Handy for</h2>
      <ul>
        <li>checking a course's quizzes before learners do</li>
        <li>finding which H5P item a page uses, and where else it's used</li>
        <li>answering "what was the right answer?" from a support request</li>
        <li>checking translated content against the original</li>
      </ul>

      <h2>Works with</h2>
      <p>
        The H5P plugin (Interactive Content - H5P) on WordPress 6.0 or newer, PHP 7.4 or newer. It looks at the page, so it
        works with LearnDash, LifterLMS, Tutor LMS, LearnPress, Sensei, MasterStudy, or plain pages and posts. Question
        types: Multiple Choice, Single Choice Set, True/False, Fill in the Blanks, Drag and Drop, Mark the Words, Summary,
        Flashcards and Image Hotspot Question.
      </p>

      <h2>Install</h2>
      <ol>
        <li>Install and activate the <b>H5P</b> plugin, if you haven't.</li>
        <li>Download the zip above, then in WordPress: <b>Plugins → Add New → Upload Plugin</b>, choose it, and activate.</li>
        <li>Optional: choose who sees it under <b>Settings → Viewer for H5P</b>.</li>
        <li>Open a page with H5P content while logged in: the <b>H5P</b> button is in the bottom-right corner.</li>
      </ol>

      <p className="fine">
        It reads only what's already on the page and in the H5P plugin's own tables; it sends nothing anywhere. H5P is a
        registered trademark of H5P Group; this plugin is independent and not made or endorsed by H5P Group.
      </p>
    </div>
  );
}
