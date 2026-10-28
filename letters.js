// letters.js
// Defines standard pedagogical stroke paths for A-Z and a-z in a 100x100 coordinate space.
// Guidelines in Y:
//   Top line (Ascender): y = 18
//   Mid line (x-height): y = 46
//   Base line:           y = 76
//   Bottom (Descender):  y = 94

function sampleLine(x1, y1, x2, y2, steps = 40) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
  }
  return pts;
}

function sampleQuad(x0, y0, cx, cy, x1, y1, steps = 45) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * x0 + 2 * u * t * cx + t * t * x1,
      y: u * u * y0 + 2 * u * t * cy + t * t * y1,
    });
  }
  return pts;
}

function sampleCubic(x0, y0, cx1, cy1, cx2, cy2, x1, y1, steps = 50) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * u * x0 + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * x1,
      y: u * u * u * y0 + 3 * u * u * t * cy1 + 3 * u * t * t * cy2 + t * t * t * y1,
    });
  }
  return pts;
}

// Angles in degrees; 0 = right (3 o'clock), 90 = down (6 o'clock), -90 = up (12 o'clock), 180 = left (9 o'clock)
function sampleEllipse(cx, cy, rx, ry, startDeg, endDeg, steps = 60) {
  const pts = [];
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = startRad + (endRad - startRad) * t;
    pts.push({
      x: cx + rx * Math.cos(ang),
      y: cy + ry * Math.sin(ang),
    });
  }
  return pts;
}

function chain(...segments) {
  const out = [];
  for (let s = 0; s < segments.length; s++) {
    const seg = segments[s];
    for (let i = 0; i < seg.length; i++) {
      if (s > 0 && i === 0) continue;
      out.push(seg[i]);
    }
  }
  return out;
}

// Re-sample any polyline to equidistant points for uniform tracing feel
function resampleUniform(pts, spacing = 1.2) {
  if (pts.length < 2) return pts;
  const dists = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    total += Math.hypot(dx, dy);
    dists.push(total);
  }
  if (total === 0) return [pts[0]];
  const count = Math.max(12, Math.round(total / spacing));
  const result = [];
  let segIdx = 0;
  for (let i = 0; i <= count; i++) {
    const target = (i / count) * total;
    while (segIdx < dists.length - 2 && dists[segIdx + 1] < target) {
      segIdx++;
    }
    const segLen = dists[segIdx + 1] - dists[segIdx];
    const ratio = segLen > 0 ? (target - dists[segIdx]) / segLen : 0;
    result.push({
      x: pts[segIdx].x + (pts[segIdx + 1].x - pts[segIdx].x) * ratio,
      y: pts[segIdx].y + (pts[segIdx + 1].y - pts[segIdx].y) * ratio,
    });
  }
  return result;
}

const RAW_LETTERS = {
  // ================= UPPERCASE A - Z =================
  A: [
    sampleLine(50, 18, 26, 76),
    sampleLine(50, 18, 74, 76),
    sampleLine(34, 56, 66, 56),
  ],
  B: [
    sampleLine(32, 18, 32, 76),
    chain(
      sampleLine(32, 18, 54, 18),
      sampleEllipse(54, 32.5, 16, 14.5, -90, 90),
      sampleLine(54, 47, 32, 47)
    ),
    chain(
      sampleLine(32, 47, 56, 47),
      sampleEllipse(56, 61.5, 18, 14.5, -90, 90),
      sampleLine(56, 76, 32, 76)
    ),
  ],
  C: [
    sampleEllipse(54, 47, 24, 29, -45, -315),
  ],
  D: [
    sampleLine(32, 18, 32, 76),
    chain(
      sampleLine(32, 18, 48, 18),
      sampleEllipse(48, 47, 24, 29, -90, 90),
      sampleLine(48, 76, 32, 76)
    ),
  ],
  E: [
    sampleLine(34, 18, 34, 76),
    sampleLine(34, 18, 68, 18),
    sampleLine(34, 47, 62, 47),
    sampleLine(34, 76, 68, 76),
  ],
  F: [
    sampleLine(34, 18, 34, 76),
    sampleLine(34, 18, 68, 18),
    sampleLine(34, 47, 62, 47),
  ],
  G: [
    chain(
      sampleEllipse(52, 47, 24, 29, -45, -355),
      sampleLine(76, 49, 52, 49)
    ),
  ],
  H: [
    sampleLine(30, 18, 30, 76),
    sampleLine(70, 18, 70, 76),
    sampleLine(30, 47, 70, 47),
  ],
  I: [
    sampleLine(50, 18, 50, 76),
    sampleLine(36, 18, 64, 18),
    sampleLine(36, 76, 64, 76),
  ],
  J: [
    chain(
      sampleLine(60, 18, 60, 58),
      sampleEllipse(45, 58, 15, 18, 0, 175)
    ),
    sampleLine(42, 18, 74, 18),
  ],
  K: [
    sampleLine(32, 18, 32, 76),
    sampleLine(68, 18, 32, 48),
    sampleLine(42, 40, 70, 76),
  ],
  L: [
    sampleLine(34, 18, 34, 76),
    sampleLine(34, 76, 68, 76),
  ],
  M: [
    sampleLine(24, 18, 24, 76),
    sampleLine(24, 18, 50, 58),
    sampleLine(76, 18, 50, 58),
    sampleLine(76, 18, 76, 76),
  ],
  N: [
    sampleLine(28, 18, 28, 76),
    sampleLine(28, 18, 72, 76),
    sampleLine(72, 18, 72, 76),
  ],
  O: [
    sampleEllipse(50, 47, 24, 29, -90, -450),
  ],
  P: [
    sampleLine(32, 18, 32, 76),
    chain(
      sampleLine(32, 18, 54, 18),
      sampleEllipse(54, 33, 17, 15, -90, 90),
      sampleLine(54, 48, 32, 48)
    ),
  ],
  Q: [
    sampleEllipse(50, 47, 24, 29, -90, -450),
    sampleLine(54, 58, 76, 78),
  ],
  R: [
    sampleLine(32, 18, 32, 76),
    chain(
      sampleLine(32, 18, 54, 18),
      sampleEllipse(54, 33, 17, 15, -90, 90),
      sampleLine(54, 48, 32, 48)
    ),
    sampleLine(50, 48, 70, 76),
  ],
  S: [
    sampleCubic(66, 26, 48, 6, 20, 36, 50, 47).concat(
      sampleCubic(50, 47, 80, 58, 52, 88, 32, 68).slice(1)
    ),
  ],
  T: [
    sampleLine(50, 18, 50, 76),
    sampleLine(24, 18, 76, 18),
  ],
  U: [
    chain(
      sampleLine(28, 18, 28, 54),
      sampleEllipse(50, 54, 22, 22, 180, 0),
      sampleLine(72, 54, 72, 18)
    ),
  ],
  V: [
    sampleLine(26, 18, 50, 76),
    sampleLine(74, 18, 50, 76),
  ],
  W: [
    sampleLine(20, 18, 35, 76),
    sampleLine(50, 34, 35, 76),
    sampleLine(50, 34, 65, 76),
    sampleLine(80, 18, 65, 76),
  ],
  X: [
    sampleLine(28, 18, 72, 76),
    sampleLine(72, 18, 28, 76),
  ],
  Y: [
    sampleLine(26, 18, 50, 48),
    sampleLine(74, 18, 50, 48),
    sampleLine(50, 48, 50, 76),
  ],
  Z: [
    sampleLine(28, 18, 72, 18),
    sampleLine(72, 18, 28, 76),
    sampleLine(28, 76, 72, 76),
  ],

  // ================= LOWERCASE a - z =================
  a: [
    sampleEllipse(47, 61, 16, 15, -35, -325),
    sampleLine(63, 46, 63, 76),
  ],
  b: [
    sampleLine(34, 18, 34, 76),
    sampleEllipse(50, 61, 16, 15, -145, 145),
  ],
  c: [
    sampleEllipse(52, 61, 16, 15, -45, -315),
  ],
  d: [
    sampleEllipse(47, 61, 16, 15, -35, -325),
    sampleLine(63, 18, 63, 76),
  ],
  e: [
    chain(
      sampleLine(34, 60, 66, 60),
      sampleEllipse(50, 61, 16, 15, -5, -315)
    ),
  ],
  f: [
    chain(
      sampleEllipse(56, 30, 10, 12, -25, -180),
      sampleLine(46, 30, 46, 76)
    ),
    sampleLine(32, 46, 62, 46),
  ],
  g: [
    sampleEllipse(47, 61, 16, 15, -35, -325),
    chain(
      sampleLine(63, 46, 63, 78),
      sampleEllipse(48, 78, 15, 15, 0, 165)
    ),
  ],
  h: [
    sampleLine(34, 18, 34, 76),
    chain(
      sampleEllipse(50, 58, 16, 12, -180, 0),
      sampleLine(66, 58, 66, 76)
    ),
  ],
  i: [
    sampleLine(50, 46, 50, 76),
    sampleEllipse(50, 31, 2.5, 2.5, 0, 360, 16),
  ],
  j: [
    chain(
      sampleLine(54, 46, 54, 79),
      sampleEllipse(42, 79, 12, 14, 0, 170)
    ),
    sampleEllipse(54, 31, 2.5, 2.5, 0, 360, 16),
  ],
  k: [
    sampleLine(36, 18, 36, 76),
    sampleLine(64, 46, 36, 62),
    sampleLine(46, 56, 66, 76),
  ],
  l: [
    sampleLine(50, 18, 50, 76),
  ],
  m: [
    sampleLine(22, 46, 22, 76),
    chain(
      sampleEllipse(36, 57, 14, 11, -180, 0),
      sampleLine(50, 57, 50, 76)
    ),
    chain(
      sampleEllipse(64, 57, 14, 11, -180, 0),
      sampleLine(78, 57, 78, 76)
    ),
  ],
  n: [
    sampleLine(34, 46, 34, 76),
    chain(
      sampleEllipse(50, 58, 16, 12, -180, 0),
      sampleLine(66, 58, 66, 76)
    ),
  ],
  o: [
    sampleEllipse(50, 61, 16, 15, -90, -450),
  ],
  p: [
    sampleLine(34, 46, 34, 94),
    sampleEllipse(50, 61, 16, 15, -145, 145),
  ],
  q: [
    sampleEllipse(47, 61, 16, 15, -35, -325),
    sampleLine(63, 46, 63, 94),
  ],
  r: [
    sampleLine(38, 46, 38, 76),
    sampleEllipse(52, 58, 14, 12, -180, -35),
  ],
  s: [
    sampleCubic(61, 51, 49, 41, 31, 54, 50, 61).concat(
      sampleCubic(50, 61, 69, 68, 51, 81, 37, 71).slice(1)
    ),
  ],
  t: [
    sampleLine(50, 26, 50, 76),
    sampleLine(34, 46, 66, 46),
  ],
  u: [
    chain(
      sampleLine(34, 46, 34, 64),
      sampleEllipse(50, 64, 16, 12, 180, 0),
      sampleLine(66, 64, 66, 46)
    ),
    sampleLine(66, 46, 66, 76),
  ],
  v: [
    sampleLine(32, 46, 50, 76),
    sampleLine(68, 46, 50, 76),
  ],
  w: [
    sampleLine(22, 46, 36, 76),
    sampleLine(50, 52, 36, 76),
    sampleLine(50, 52, 64, 76),
    sampleLine(78, 46, 64, 76),
  ],
  x: [
    sampleLine(34, 46, 66, 76),
    sampleLine(66, 46, 34, 76),
  ],
  y: [
    sampleLine(34, 46, 50, 76),
    sampleLine(66, 46, 38, 94),
  ],
  z: [
    sampleLine(34, 46, 66, 46),
    sampleLine(66, 46, 34, 76),
    sampleLine(34, 76, 66, 76),
  ],
};

// Process all strokes to have uniform spacing
const LETTER_STROKES = {};
for (const [ch, strokes] of Object.entries(RAW_LETTERS)) {
  LETTER_STROKES[ch] = strokes.map((s) => resampleUniform(s, 1.2));
}

// Fun associated words & emojis for extra visual delight for a kindergarten child
const LETTER_WORDS = {
  A: { word: "Apple", emoji: "🍎" },
  B: { word: "Bear", emoji: "🐻" },
  C: { word: "Cat", emoji: "🐱" },
  D: { word: "Dog", emoji: "🐶" },
  E: { word: "Elephant", emoji: "🐘" },
  F: { word: "Fish", emoji: "🐟" },
  G: { word: "Giraffe", emoji: "🦒" },
  H: { word: "Hippo", emoji: "🦛" },
  I: { word: "Ice cream", emoji: "🍦" },
  J: { word: "Juice", emoji: "🧃" },
  K: { word: "Koala", emoji: "🐨" },
  L: { word: "Lion", emoji: "🦁" },
  M: { word: "Monkey", emoji: "🐵" },
  N: { word: "Nest", emoji: "🪺" },
  O: { word: "Octopus", emoji: "🐙" },
  P: { word: "Penguin", emoji: "🐧" },
  Q: { word: "Queen", emoji: "👑" },
  R: { word: "Rabbit", emoji: "🐰" },
  S: { word: "Sun", emoji: "☀️" },
  T: { word: "Tiger", emoji: "🐯" },
  U: { word: "Umbrella", emoji: "☂️" },
  V: { word: "Violin", emoji: "🎻" },
  W: { word: "Whale", emoji: "🐳" },
  X: { word: "Xylophone", emoji: "🎶" },
  Y: { word: "Yacht", emoji: "⛵" },
  Z: { word: "Zebra", emoji: "🦓" },
};

window.LETTER_STROKES = LETTER_STROKES;
window.LETTER_WORDS = LETTER_WORDS;
