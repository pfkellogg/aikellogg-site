import Video from "../components/Video.jsx";
// CertificateVerifier.jsx: the detail page of the WordPress plugin AIKellogg Certificate ID & QR Verifier for LearnDash
// (github.com/pfkellogg/certificate-id-qr-verifier-for-learndash).
const GITHUB = "https://github.com/pfkellogg/certificate-id-qr-verifier-for-learndash";
const ZIP = GITHUB + "/releases/latest/download/certificate-id-qr-verifier-for-learndash.zip";
const BG = GITHUB + "/raw/main/samples/certificate-background-landscape.jpg";

export default function CertificateVerifier() {
  return (
    <div className="detail">
      <img className="banner" src="img/certificate-verifier-banner.png" alt="AIKellogg Certificate ID & QR Verifier for LearnDash: a certificate and a phone showing Certificate Verified" />
      <p className="kicker">WordPress plugin · free · GPL</p>
      <h1>AIKellogg Certificate ID &amp; QR Verifier for LearnDash</h1>
      <p className="lead">
        Scan any LearnDash certificate and know, in a second, that it's <b>genuine</b>, <b>current</b> and <b>approved</b>.
      </p>
      <div className="actions">
        <a className="btn" href={ZIP}>Download the plugin (zip)</a>
        <a className="btn ghost" href={GITHUB}>Docs &amp; source on GitHub</a>
      </div>
      <p className="note">Coming soon to the WordPress.org plugin directory.</p>

      <div className="cqv-original">
        <p className="cqv-original-big">The original.</p>
        <p>
          <b>Patrick Kellogg created the first certificate tracker and verifier for LearnDash.</b> He founded
          eLearning Complete, where he built it. He is no longer affiliated with eLearning Complete, and this free
          plugin is its successor.
        </p>
      </div>

      <img className="cqv-cert" src="img/cqv-certificate.jpg" alt="A landscape certificate with its ID, approval number, status Valid, and a QR code" />

      <h2>Watch</h2>
      <Video id="kgwFZtcj4Ig" title="Scan Any LearnDash Certificate: Verified, Expired or Fake (Free QR Verifier Plugin)" caption="QR codes, expiring certifications and approval numbers (2:13)." />

      <h2>Why it's different</h2>
      <div className="cqv-grid">
        <div><h3>QR code, no setup</h3><p>Activate it: every certificate gets a scannable code. No settings page to fill in, no outside QR service, no API key.</p></div>
        <div><h3>Can't be forged</h3><p>The link is signed with your site's secret keys. Change one character and it fails.</p></div>
        <div><h3>For certifications that repeat</h3><p>Annual courses and quizzes: one shortcode with two dates says Valid, Expired or Not active. Next year, change the dates.</p></div>
        <div><h3>Approval numbers by date</h3><p>A new state approval number every period? Each certificate keeps the number that was valid the day the learner finished.</p></div>
        <div><h3>eLearning Complete compatible</h3><p>Replaces the old Certificate Tracker and Verifier: their IDs, shortcodes and printed QR codes keep working.</p></div>
        <div><h3>Smart shortcodes</h3><p>Small shortcodes you drop into any LearnDash certificate: ID, QR, status, approval number, expiry, search.</p></div>
      </div>

      <h2>One scan, three answers</h2>
      <div className="cqv-shots">
        <figure><img src="img/cqv-shot-2.png" alt="Certificate Verified, valid until December 31, 2026" /><figcaption>Genuine and current</figcaption></figure>
        <figure><img src="img/cqv-shot-3.png" alt="Certificate Expired: a genuine certificate, valid until November 23, 2026" /><figcaption>Genuine, but expired</figcaption></figure>
        <figure><img src="img/cqv-shot-4.png" alt="Certificate could not be verified" /><figcaption>Forged or changed</figcaption></figure>
      </div>

      <h2>The smart shortcodes</h2>
      <p>Put them in a LearnDash certificate. Every option is in the <a href={GITHUB + "#shortcodes"}>docs</a>.</p>
      <table className="cqv-table">
        <tbody>
          <tr><td><code>[cp_ld_certificate qr_x="211" qr_y="148" qr_size="26"]</code></td><td>Where the QR code goes (it's there even without this).</td></tr>
          <tr><td><code>[cp_ld_certificate_id prefix="FSB"]</code></td><td>The unique ID, like FSB-1795464733-6-1. The verification page shows the same one.</td></tr>
          <tr><td><code>[cp_ld_certificate_status start="2026-01-01" end="2027-01-01"]</code></td><td>Valid, Expired or Not active, in your own words. After the end date it says Expired, on the certificate and when it's scanned.</td></tr>
          <tr><td><code>[cp_ld_approval_number before="Approval #: "]</code></td><td>The approval number that was valid on the completion day.</td></tr>
          <tr><td><code>[cp_ld_certificate_expires years="1"]</code></td><td>An expiry date, counted from completion.</td></tr>
          <tr><td><code>[cp_ld_certificate_search]</code></td><td>A search box for any page: type an ID, see its verification.</td></tr>
        </tbody>
      </table>

      <h2>Approval numbers, by the calendar</h2>
      <p>On each course, one row per period. Add a row when the new number arrives; certificates already issued keep theirs.</p>
      <img className="cqv-wide" src="img/cqv-approvals.png" alt="The Approval numbers by date table on a course, with three periods" />

      <h2>A search page</h2>
      <img className="cqv-wide" src="img/cqv-search.png" alt="The Verify a Certificate page with its search box" />

      <h2>Coming from eLearning Complete?</h2>
      <p>
        Deactivate <i>Certificate Tracker for LearnDash</i> and <i>Certificate Verifier for LearnDash</i> and keep your
        certificate templates and verification page as they are. IDs they issued (saved in <code>elc_certificate_ids</code>)
        still verify with their original dates, <code>[elc_certificate_id]</code> prints the same IDs, and old printed QR
        codes go straight to the new verification page.
      </p>

      <div className="fix">
        <p className="kicker">Free download</p>
        <h3>A certificate background</h3>
        <p>The navy-and-gold landscape background in the pictures (US Letter, with a seal). Set your certificate to Letter, Landscape, and make it the featured image.</p>
        <p><a className="btn ghost" href={BG}>Download the background</a></p>
      </div>

      <h2>Install</h2>
      <ol>
        <li>Install and activate <b>LearnDash</b>, and give a course, quiz or group a certificate.</li>
        <li>Download the zip above, then in WordPress: <b>Plugins → Add New → Upload Plugin</b>, choose it, and activate.</li>
        <li>That's all: certificates carry a QR code. Add the shortcodes to place the ID, status and approval number.</li>
      </ol>
      <p className="note">Works with LearnDash's built-in PDF certificates. The Certificate Builder add-on isn't supported yet.</p>

      <p className="fine">
        LearnDash is a trademark of its owner. This plugin is independent: it is not made or endorsed by LearnDash, nor by
        eLearning Complete.
      </p>
    </div>
  );
}
