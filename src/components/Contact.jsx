// Contact.jsx: "Contact me". A click opens a small panel with Patrick's address and three ways to write: Gmail in the
// browser, the visitor's email app, or copy the address. (A bare mailto: link does nothing for people with no email
// app set up, as on many Macs.) The address is put together only when the panel opens, so it isn't in the page as
// text for spam robots to collect.
import { useEffect, useRef, useState } from "react";

const parts = ["pfkellogg", "gmail.com"];
const address = () => parts.join("@");

export default function Contact({ className, label = "Contact me", subject = "Hello from aikellogg.com" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onClick = (e) => panel.current && !panel.current.contains(e.target) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const to = open ? address() : "";
  const gmail =
    "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(to) + "&su=" + encodeURIComponent(subject);
  const mailto = "mailto:" + to + "?subject=" + encodeURIComponent(subject);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(to);
    } catch {
      const t = document.createElement("textarea");
      t.value = to;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        className={"contact-btn " + (className || "")}
        onClick={() => {
          setCopied(false);
          setOpen(true);
        }}
      >
        {label}
      </button>
      {open && (
        <div className="contact-backdrop">
          <div className="contact-panel" ref={panel} role="dialog" aria-modal="true" aria-label="Contact Patrick">
            <button type="button" className="contact-close" aria-label="Close" onClick={() => setOpen(false)}>
              ×
            </button>
            <p className="contact-kicker">Contact me</p>
            <p className="contact-address">{to}</p>
            <div className="contact-actions">
              <a className="contact-go" href={gmail} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                Write in Gmail
              </a>
              <a className="contact-alt" href={mailto} onClick={() => setOpen(false)}>
                Use my email app
              </a>
              <button type="button" className="contact-alt" onClick={copy}>
                {copied ? "Copied ✓" : "Copy address"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
