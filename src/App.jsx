// App.jsx: aikellogg.com, a single-page site. HashRouter: GitHub Pages serves one file, so pages live after "#"
// (aikellogg.com/#/flute-lab) and every link works, even opened fresh.
import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import FluteLab from "./pages/FluteLab.jsx";
import ViewerForH5P from "./pages/ViewerForH5P.jsx";
import MarkCompleteGate from "./pages/MarkCompleteGate.jsx";
import CertificateVerifier from "./pages/CertificateVerifier.jsx";
import SecureAnswers from "./pages/SecureAnswers.jsx";
import LmsPlugins from "./pages/LmsPlugins.jsx";
import Contact from "./components/Contact.jsx";

export default function App() {
  return (
    <HashRouter>
      <header className="top">
        <NavLink to="/" className="brand">AIKellogg</NavLink>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/flute-lab">Flute Lab</NavLink>
          <NavLink to="/lms-plugins">LMS Plugins</NavLink>
          <Contact className="nav-contact" />
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/flute-lab" element={<FluteLab />} />
          <Route path="/lms-plugins" element={<LmsPlugins />} />
          <Route path="/viewer-for-h5p" element={<ViewerForH5P />} />
          <Route path="/mark-complete-gate" element={<MarkCompleteGate />} />
          <Route path="/certificate-verifier" element={<CertificateVerifier />} />
          <Route path="/secure-answers-for-h5p" element={<SecureAnswers />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>Questions, ideas, a plugin you'd like? </span>
        <Contact className="footer-contact" label="✉ Contact me" />
        <span className="footer-sep">·</span>
        <a href="https://www.youtube.com/@AIKellogg">YouTube</a>
        <span className="footer-sep">·</span>
        <a href="https://ko-fi.com/aikellogg">Support the Patrick Kellogg Foundation for the Performing Arts</a>
      </footer>
    </HashRouter>
  );
}
