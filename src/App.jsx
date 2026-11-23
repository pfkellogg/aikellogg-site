// App.jsx: aikellogg.com, a single-page site. HashRouter: GitHub Pages serves one file, so pages live after "#"
// (aikellogg.com/#/flute-lab) and every link works, even opened fresh.
import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import FluteLab from "./pages/FluteLab.jsx";

export default function App() {
  return (
    <HashRouter>
      <header className="top">
        <NavLink to="/" className="brand">AIKellogg</NavLink>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/flute-lab">Flute Lab</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/flute-lab" element={<FluteLab />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </HashRouter>
  );
}
