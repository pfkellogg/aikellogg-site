// FixYourFirmware.jsx: the best-practice guide for FM-1 Big Screen (what we learnt making h1 big), and a form where a
// firmware's author asks us to check and fix its Big Screen part. The form goes to dl.aikellogg.com/fix (a Cloudflare
// Worker of this site's own: kept privately, the email only to answer).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "https://dl.aikellogg.com";
const APP = "https://github.com/pfkellogg/fm1-mirror/releases/latest";

function Form() {
  const [f, setF] = useState({ name: "", email: "", firmware: "", repo: "", what: "", website: "" });
  const [state, setState] = useState(null); // null | "sending" | "sent" | error text
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function send(e) {
    e.preventDefault();
    setState("sending");
    try {
      const r = await fetch(`${API}/fix`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({}));
      setState(r.ok ? "sent" : j.error || "That didn't go through. Please try again.");
    } catch {
      setState("That didn't go through. Please try again.");
    }
  }
  if (state === "sent")
    return (
      <p className="fyf-sent" role="status">
        <b>Thank you!</b> We have it. We'll look at {f.firmware || "your firmware"}'s Big Screen part and write back to{" "}
        {f.email} with what we find, and a fix as a pull request or a patch you can take or leave.
      </p>
    );
  return (
    <form className="fyf-form" onSubmit={send}>
      <label>Your name<input value={f.name} onChange={set("name")} required maxLength={100} autoComplete="name" /></label>
      <label>Your email (only to write back to you)<input type="email" value={f.email} onChange={set("email")} required maxLength={200} autoComplete="email" /></label>
      <label>The firmware's name<input value={f.firmware} onChange={set("firmware")} required maxLength={100} placeholder="h1, SLOOP, Felucca…" /></label>
      <label>Its source code (the repository)<input type="url" value={f.repo} onChange={set("repo")} required maxLength={300} placeholder="https://github.com/you/your-firmware" /></label>
      <label>What you see, or what you'd like (optional)<textarea value={f.what} onChange={set("what")} maxLength={2000} rows={4} placeholder="It tears when the animation is busy; it has no Key Lights yet…" /></label>
      <input className="fyf-hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} aria-hidden="true" />
      <div className="row">
        <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Fix my firmware"}</button>
      </div>
      {state && state !== "sending" && <p className="status" role="alert">{state}</p>}
      <p className="status">
        We need the source code, not the .fwsc file: the Big Screen part is fixed in the code. Free, for any FM-1
        firmware. Your firmware stays yours: you choose whether to take the fix.
      </p>
    </form>
  );
}

export default function FixYourFirmware() {
  const [n, setN] = useState(null);
  useEffect(() => {
    fetch("bigscreen/builds.json", { cache: "no-cache" }).then((r) => r.json())
      .then((d) => setN((d.counts.built || 0) + (d.counts.squeeze || 0) + (d.counts.already || 0))).catch(() => {});
  }, []);
  return (
    <div className="detail fyf">
      <p className="kicker">M-VAVE FM-1 · for firmware authors · free</p>
      <h1>Fix your firmware</h1>
      <p className="lead">
        The best-practice guide for <b>FM-1 Big Screen</b>, and a free fix for yours. {n ? <><b>{n}</b> FM-1 firmwares
        show big already</> : "Most FM-1 firmwares show big already"}, and soon it will be almost all of them: it's best
        to build it in right from the start.
      </p>

      <section className="contest">
        <h2>Send us your firmware</h2>
        <p>
          Tell us where its source is. We check its Big Screen part against the guide below and send you the fix.
        </p>
        <Form />
      </section>

      <section>
        <h2>The best-practice guide for FM-1 Big Screen</h2>
        <p>
          FM-1 Big Screen is a free app (<a href={APP}>Mac, Windows, Linux</a>, Android and Fire TV) that shows the FM-1's
          tiny screen big, with Big Knobs and Key Lights. The firmware sends its screen over the USB cable, as MIDI. What
          we learnt, most of it making <a href="https://github.com/jakehandy/h1">h1</a> by Jake Handy big:
        </p>

        <h3>1. Know the budget: about 85 KB a second</h3>
        <p>
          USB MIDI carries about 85 to 88 KB a second to a computer, whatever the firmware does. That is about three and
          a half full screens of pixels a second. A calm screen fits easily. A full-screen animation does not.
        </p>

        <h3>2. Send only what changed</h3>
        <p>
          Send the rectangles that changed since the last picture, never the whole screen each frame. fm1-base's mirror
          and our own Big Screen code both do it: draw through <code>lcd_blit</code> and <code>lcd_fill</code>, in rows
          the full width of the screen where you can, and each row's unchanged pieces are skipped.
        </p>

        <h3>3. Never drop: wait for the link</h3>
        <p>
          When the link is full, the old way dropped the rest and hoped it would be drawn again. A firmware that draws
          only what changes never draws it again, so the big screen tears and keeps leftovers. Wait for room instead,
          only while the big screen is connected: the picture then goes at the link's pace, and every frame arrives whole.
          (Our h1 build: <code>FM1BS_MIRROR_PACE</code>.)
        </p>

        <h3>4. Keep your picture, and let the mirror ask for it</h3>
        <p>
          If your firmware keeps its picture in memory, let the mirror take a row from it when one went missing
          (<code>APP_MIRROR_ROW</code>), or at least redraw everything when asked (fm1-base's <code>APP_REDRAW</code>).
          Nothing then stays wrong.
        </p>

        <h3>5. Draw so it packs small</h3>
        <p>
          The screen is sent run-length coded: flat colours and long runs cost almost nothing, noise and dithering cost
          the most. Animate the part that matters, not every pixel, and a busy picture stays smooth on the big screen.
        </p>

        <h3>6. Light the keys and take the knobs</h3>
        <p>
          Set the LEDs through the platform (<code>plat_leds</code>, the dim and glowing ones too) and read the knobs and
          buttons through it (<code>plat_enc</code>, <code>plat_buttons</code>): then Key Lights shows them big, and Big
          Knobs turns them from the app, with no extra work.
        </p>

        <h3>7. Leave room</h3>
        <p>
          The mirror costs a few KB of code and some RAM. Keep a little space free, or switch off developer extras in your
          release builds. Don't shrink the mirror's buffers to fit: that is what made h1 tear at first.
        </p>

        <h3>8. Test it with the app, and count</h3>
        <p>
          Connect FM-1 Big Screen, play your busiest screen, and change pages fast. With fm1-base, count what the mirror
          sent and dropped: dropped should stay at zero.
        </p>
      </section>

      <section>
        <h2>Already built</h2>
        <p>
          See every FM-1 firmware and its Big Screen build on <Link to="/bigscreen-fws">Big Screen FWs</Link>. Every
          night at midnight we scan The Firmware Hub for new and updated firmwares and build their Big Screen versions.
        </p>
      </section>
    </div>
  );
}
