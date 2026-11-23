// SecureAnswers.jsx: the page of the paid WordPress plugin Secure Answers for H5P. Every purchase goes to the
// Patrick Kellogg Foundation for the Performing Arts (through its Ko-fi page).
import { Link } from "react-router-dom";

const BUY = "https://ko-fi.com/aikellogg";
const VIEWER_VIDEO = "https://youtu.be/JvFwH5DdlaI";

function BuyCard({ compact }) {
  return (
    <div className={"sa-buy" + (compact ? " sa-buy--compact" : "")}>
      <div className="sa-buy-price">
        <span className="sa-buy-amount">$129</span>
        <span className="sa-buy-per">a year, per site</span>
      </div>
      <div className="sa-buy-text">
        <p className="sa-buy-heart">♥ Every purchase goes to the <b>Patrick Kellogg Foundation for the Performing Arts</b>.</p>
        <p className="sa-buy-small">Pay on the Foundation's Ko-fi page ($129, or more if you like). The plugin, its updates and support come to your email.</p>
      </div>
      <a className="sa-buy-btn" href={BUY} target="_blank" rel="noopener noreferrer">
        Buy it · support the Foundation
      </a>
    </div>
  );
}

export default function SecureAnswers() {
  return (
    <div className="detail sa">
      <p className="kicker">WordPress plugin · for H5P</p>
      <h1>
        Secure Answers <span className="sa-green">for H5P</span>
      </h1>
      <p className="lead">
        H5P sends every correct answer to every learner's browser. Secure Answers for H5P keeps them on the server, where
        learners can't read them, so H5P can finally be used for real testing.
      </p>

      <img className="sa-hero" src="img/sa-thumb.jpg" alt="Before: the Viewer shows Very dark purple marked right. After: no answers in the page." />

      <BuyCard />

      <h2>The problem, in every H5P page</h2>
      <p>
        H5P checks answers in the browser, so the browser gets the answer key: it's in the page's markup and its JSON, where
        anyone can read it with the developer tools in seconds. It's still true in H5P 1.17.10, the latest. Exams,
        certifications, any grade that matters: every learner already has the answers.{" "}
        <Link to="/viewer-for-h5p">The free Viewer for H5P</Link> shows you exactly what they can find (
        <a href={VIEWER_VIDEO}>video</a>).
      </p>

      <h2>The fix</h2>
      <div className="sa-steps">
        <div>
          <b>1</b>
          <h3>Nothing in the page</h3>
          <p>Each H5P question becomes an empty placeholder. The page source has no questions and no answers.</p>
        </div>
        <div>
          <b>2</b>
          <h3>No answer key</h3>
          <p>The question arrives from the server after the page loads, with every answer marker removed, and the choices shuffled each time.</p>
        </div>
        <div>
          <b>3</b>
          <h3>The server decides</h3>
          <p>Each answer is checked on the server, against the database. The browser only learns the score.</p>
        </div>
      </div>

      <img className="sa-shot" src="img/sa-aftersource.jpg" alt="After: the page source holds an empty placeholder, and the question's H5P data is {}" />
      <img className="sa-shot" src="img/sa-load.jpg" alt="What the server sends: the question and shuffled choices, with no answer key" />
      <img className="sa-shot" src="img/sa-checks.jpg" alt="Blue: not quite right, Mark Complete stays locked. Very dark purple: correct, Mark Complete unlocks." />

      <h2>Hard to game</h2>
      <p>We tried to cheat it ourselves: every trick fails.</p>
      <img className="sa-shot" src="img/sa-cheats.jpg" alt="Every trick fails: the same answer twice, ticking everything, every item in every zone, a fake question type, a made-up session" />

      <h2>What it secures</h2>
      <ul>
        <li><b>Questions:</b> Multiple Choice, True/False, Fill in the Blanks, Drag and Drop, Mark the Words, Single Choice Set, Summary.</li>
        <li><b>Inside:</b> Question Set (Quiz), Interactive Video, Course Presentation, Column, Branching Scenario.</li>
        <li><b>For everyone:</b> logged-in learners and visitors on public pages.</li>
        <li><b>No setup:</b> activate it, and every question it can secure is secured, on every page and lesson.</li>
        <li><b>Plays well with LearnDash:</b> Mark Complete and Next wait until the secured questions are done, and completions reach H5P's event system (Mark Complete Gate and xAPI loggers hear them).</li>
      </ul>

      <div className="fix">
        <p className="kicker">Coming soon</p>
        <h3>For Moodle</h3>
        <p>Moodle builds its H5P the same way: the answers are in the page there too. A Moodle version of the Viewer and of Secure Answers is on its way.</p>
      </div>

      <BuyCard compact />

      <p className="fine">
        H5P is a registered trademark of H5P Group. This plugin is independent: it is not made or endorsed by H5P Group.
        Made by Patrick Kellogg, founder of eLearning Complete (no longer affiliated with it).
      </p>
    </div>
  );
}
