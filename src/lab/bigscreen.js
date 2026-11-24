// bigscreen.js: the FM-1 Big Screen app's picture, in the browser: its looks (Color, Bright color, Yellow on black,
// White on black, Black on white) and Smooth (Lanczos-3 four times bigger, then an unsharp mask: radius 1, amount 2.6).
// A port of fm1-mirror's src/main.rs (Look) and src/smooth.rs, so the page shows what the app will show.
// Pixels are [r, g, b] bytes, 240 x 240, row by row (an RGBA ImageData works too: see fromImageData).

export const SIDE = 240;
export const SCALE = 4;
export const LOOKS = [
  ["color", "Color"],
  ["bright", "Bright color"],
  ["yellow", "Yellow on black"],
  ["white", "White on black"],
  ["inverted", "Black on white"],
];

export function fromImageData(d) {
  const px = new Uint8ClampedArray(SIDE * SIDE * 3);
  for (let i = 0, j = 0; i < SIDE * SIDE; i++, j += 4) {
    px[i * 3] = d.data[j];
    px[i * 3 + 1] = d.data[j + 1];
    px[i * 3 + 2] = d.data[j + 2];
  }
  return px;
}

const luma = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

// Bright color leaves pictures and panels alone: within 4 pixels of a spot whose 9x9 neighbourhood is > 60% drawn.
function pictureMask(px) {
  const R = 4, s = SIDE, w = s + 1;
  const window = (v) => {
    const sat = new Uint32Array(w * w);
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++)
        sat[(y + 1) * w + x + 1] = v[y * s + x] + sat[y * w + x + 1] + sat[(y + 1) * w + x] - sat[y * w + x];
    const n = new Uint32Array(s * s), area = new Uint32Array(s * s);
    for (let y = 0; y < s; y++) {
      const y0 = Math.max(0, y - R), y1 = Math.min(s, y + R + 1);
      for (let x = 0; x < s; x++) {
        const x0 = Math.max(0, x - R), x1 = Math.min(s, x + R + 1);
        n[y * s + x] = sat[y1 * w + x1] + sat[y0 * w + x0] - sat[y0 * w + x1] - sat[y1 * w + x0];
        area[y * s + x] = (y1 - y0) * (x1 - x0);
      }
    }
    return [n, area];
  };
  const ink = new Uint32Array(s * s);
  for (let i = 0; i < s * s; i++) ink[i] = luma(px[i * 3], px[i * 3 + 1], px[i * 3 + 2]) > 0.03 ? 1 : 0;
  const [n1, a1] = window(ink);
  const core = new Uint32Array(s * s);
  for (let i = 0; i < s * s; i++) core[i] = n1[i] * 10 > a1[i] * 6 ? 1 : 0;
  const [n2] = window(core);
  return n2.map((v) => (v > 0 ? 1 : 0));
}

// The whole screen in a look (a new array).
export function paint(px, look) {
  const out = new Uint8ClampedArray(px.length);
  const mask = look === "bright" ? pictureMask(px) : null;
  const lit = (v) => Math.floor(Math.min(v * 1.6, 1) * 255);
  for (let i = 0; i < SIDE * SIDE; i++) {
    const r = px[i * 3], g = px[i * 3 + 1], b = px[i * 3 + 2];
    let o;
    if (look === "color" || (mask && mask[i])) o = [r, g, b];
    else if (look === "bright") {
      const k = (v) => Math.min(v * 1.6, 255);
      const R = k(r), G = k(g), B = k(b);
      const l = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
      const t = l > 0.03 && l < 0.8 ? (0.8 - l) / (1 - l) : 0;
      const up = (v) => Math.floor(v + (255 - v) * t);
      o = [up(R), up(G), up(B)];
    } else {
      const l = lit(luma(r, g, b));
      o = look === "yellow" ? [l, l, 0] : look === "white" ? [l, l, l] : [255 - l, 255 - l, 255 - l];
    }
    out[i * 3] = o[0];
    out[i * 3 + 1] = o[1];
    out[i * 3 + 2] = o[2];
  }
  return out;
}

function lanczos3(x) {
  x = Math.abs(x);
  if (x < 1e-6) return 1;
  if (x >= 3) return 0;
  const p = Math.PI * x;
  return (3 * Math.sin(p) * Math.sin(p / 3)) / (p * p);
}

function taps(size, scale) {
  const all = [];
  for (let o = 0; o < size * scale; o++) {
    const c = (o + 0.5) / scale - 0.5;
    const first = Math.floor(c) - 2;
    const t = [];
    let sum = 0;
    for (let i = first; i < first + 6; i++) {
      const wgt = lanczos3(c - i);
      t.push([Math.min(Math.max(i, 0), size - 1), wgt]);
      sum += wgt;
    }
    for (const p of t) p[1] /= sum;
    all.push(t);
  }
  return all;
}

function gaussian(src, size, radius) {
  const reach = Math.ceil(radius * 3);
  const k = [];
  let sum = 0;
  for (let i = -reach; i <= reach; i++) {
    const v = Math.exp(-(i * i) / (2 * radius * radius));
    k.push(v);
    sum += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const cl = (i) => Math.min(Math.max(i, 0), size - 1);
  const across = new Float32Array(size * size * 3), out = new Float32Array(size * size * 3);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      for (let c = 0; c < 3; c++) {
        let v = 0;
        for (let j = 0; j < k.length; j++) v += k[j] * src[(y * size + cl(x + j - reach)) * 3 + c];
        across[(y * size + x) * 3 + c] = v;
      }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      for (let c = 0; c < 3; c++) {
        let v = 0;
        for (let j = 0; j < k.length; j++) v += k[j] * across[(cl(y + j - reach) * size + x) * 3 + c];
        out[(y * size + x) * 3 + c] = v;
      }
  return out;
}

// Smooth: SCALE times bigger, smooth and crisp (RGB bytes, (SIDE * SCALE)^2).
export function smooth(px) {
  const size = SIDE, big = size * SCALE, t = taps(size, SCALE);
  const across = new Float32Array(size * big * 3);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < big; x++)
      for (let c = 0; c < 3; c++) {
        let v = 0;
        for (const [i, w] of t[x]) v += w * px[(y * size + i) * 3 + c];
        across[(y * big + x) * 3 + c] = v;
      }
  const enl = new Float32Array(big * big * 3);
  for (let y = 0; y < big; y++)
    for (let x = 0; x < big; x++)
      for (let c = 0; c < 3; c++) {
        let v = 0;
        for (const [i, w] of t[y]) v += w * across[(i * big + x) * 3 + c];
        enl[(y * big + x) * 3 + c] = v;
      }
  const blur = gaussian(enl, big, 1.0);
  const out = new Uint8ClampedArray(big * big * 3);
  for (let i = 0; i < out.length; i++) out[i] = Math.round(enl[i] + 2.6 * (enl[i] - blur[i]));
  return out;
}

// Draw RGB bytes (side x side) onto a canvas of that size.
export function draw(canvas, rgb, side) {
  canvas.width = canvas.height = side;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(side, side);
  for (let i = 0, j = 0; i < side * side; i++, j += 4) {
    img.data[j] = rgb[i * 3];
    img.data[j + 1] = rgb[i * 3 + 1];
    img.data[j + 2] = rgb[i * 3 + 2];
    img.data[j + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
