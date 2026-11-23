// fluteWorker.js: makes tape strips off the page's thread, so the sliders never stall.
//   {type:"note", id, settings, midi}  -> {type:"note", id, midi, data}   (data: Float32Array, transferred)
//   {type:"all", id, settings}         -> {type:"progress", id, done} ... {type:"all", id, strips:[Float32Array x35]}
import { makeNote, LOW, HIGH } from "./flute.js";

self.onmessage = (e) => {
  const m = e.data;
  if (m.type === "note") {
    const data = makeNote(m.settings, m.midi);
    self.postMessage({ type: "note", id: m.id, midi: m.midi, data }, [data.buffer]);
  } else if (m.type === "all") {
    const strips = [];
    for (let k = LOW; k <= HIGH; k++) {
      strips.push(makeNote(m.settings, k));
      self.postMessage({ type: "progress", id: m.id, done: k - LOW + 1 });
    }
    self.postMessage({ type: "all", id: m.id, strips }, strips.map((s) => s.buffer));
  }
};
