// Contact.jsx: "Contact me" links that open an email to Patrick. The address is put together only when clicked, so it
// isn't in the page as text for spam robots to collect.
const parts = ["pfkellogg", "gmail.com"];

export function openEmail(subject) {
  const to = parts.join("@");
  window.location.href = "mailto:" + to + (subject ? "?subject=" + encodeURIComponent(subject) : "");
}

export default function Contact({ className, label = "Contact me", subject = "Hello from aikellogg.com" }) {
  return (
    <a
      href="#contact"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        openEmail(subject);
      }}
    >
      {label}
    </a>
  );
}
