// App.jsx: aikellogg.com, a single-page site. HashRouter: GitHub Pages serves one file, so pages live after "#"
// (aikellogg.com/#/flute-lab) and every link works, even opened fresh.
import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import FluteLab from "./pages/FluteLab.jsx";
import ViewerForH5P from "./pages/ViewerForH5P.jsx";
import MarkCompleteGate from "./pages/MarkCompleteGate.jsx";
import CertificateVerifier from "./pages/CertificateVerifier.jsx";

export default function App() {
  return (
    <HashRouter>
      <header className="top">
        <NavLink to="/" className="brand">AIKellogg</NavLink>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/flute-lab">Flute Lab</NavLink>
          <NavLink to="/viewer-for-h5p">Viewer for H5P</NavLink>
          <NavLink to="/mark-complete-gate">Mark Complete Gate</NavLink>
          <NavLink to="/certificate-verifier">Certificate Verifier</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/flute-lab" element={<FluteLab />} />
          <Route path="/viewer-for-h5p" element={<ViewerForH5P />} />
          <Route path="/mark-complete-gate" element={<MarkCompleteGate />} />
          <Route path="/certificate-verifier" element={<CertificateVerifier />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </HashRouter>
  );
}
