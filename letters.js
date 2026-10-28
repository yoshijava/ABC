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

// Rich Kindergarten Vocabulary Bank (5 words per letter = 130 words)
const LETTER_VOCAB = {
  A: [
    { id: "A_apple", word: "Apple", emoji: "🍎" },
    { id: "A_ant", word: "Ant", emoji: "🐜" },
    { id: "A_airplane", word: "Airplane", emoji: "✈️" },
    { id: "A_alligator", word: "Alligator", emoji: "🐊" },
    { id: "A_astronaut", word: "Astronaut", emoji: "🧑‍🚀" },
  ],
  B: [
    { id: "B_bear", word: "Bear", emoji: "🐻" },
    { id: "B_banana", word: "Banana", emoji: "🍌" },
    { id: "B_ball", word: "Ball", emoji: "⚽" },
    { id: "B_bird", word: "Bird", emoji: "🐦" },
    { id: "B_bus", word: "Bus", emoji: "🚌" },
  ],
  C: [
    { id: "C_cat", word: "Cat", emoji: "🐱" },
    { id: "C_car", word: "Car", emoji: "🚗" },
    { id: "C_cake", word: "Cake", emoji: "🎂" },
    { id: "C_cow", word: "Cow", emoji: "🐮" },
    { id: "C_cookie", word: "Cookie", emoji: "🍪" },
  ],
  D: [
    { id: "D_dog", word: "Dog", emoji: "🐶" },
    { id: "D_duck", word: "Duck", emoji: "🦆" },
    { id: "D_dinosaur", word: "Dinosaur", emoji: "🦖" },
    { id: "D_drum", word: "Drum", emoji: "🥁" },
    { id: "D_dolphin", word: "Dolphin", emoji: "🐬" },
  ],
  E: [
    { id: "E_elephant", word: "Elephant", emoji: "🐘" },
    { id: "E_egg", word: "Egg", emoji: "🥚" },
    { id: "E_eagle", word: "Eagle", emoji: "🦅" },
    { id: "E_ear", word: "Ear", emoji: "👂" },
    { id: "E_earth", word: "Earth", emoji: "🌍" },
  ],
  F: [
    { id: "F_fish", word: "Fish", emoji: "🐟" },
    { id: "F_frog", word: "Frog", emoji: "🐸" },
    { id: "F_flower", word: "Flower", emoji: "🌸" },
    { id: "F_fox", word: "Fox", emoji: "🦊" },
    { id: "F_firetruck", word: "Firetruck", emoji: "🚒" },
  ],
  G: [
    { id: "G_giraffe", word: "Giraffe", emoji: "🦒" },
    { id: "G_grapes", word: "Grapes", emoji: "🍇" },
    { id: "G_goat", word: "Goat", emoji: "🐐" },
    { id: "G_guitar", word: "Guitar", emoji: "🎸" },
    { id: "G_gift", word: "Gift", emoji: "🎁" },
  ],
  H: [
    { id: "H_hippo", word: "Hippo", emoji: "🦛" },
    { id: "H_hat", word: "Hat", emoji: "👒" },
    { id: "H_horse", word: "Horse", emoji: "🐴" },
    { id: "H_house", word: "House", emoji: "🏠" },
    { id: "H_helicopter", word: "Helicopter", emoji: "🚁" },
  ],
  I: [
    { id: "I_ice_cream", word: "Ice cream", emoji: "🍦" },
    { id: "I_igloo", word: "Igloo", emoji: "🧊" },
    { id: "I_insect", word: "Insect", emoji: "🐛" },
    { id: "I_island", word: "Island", emoji: "🏝️" },
    { id: "I_iguana", word: "Iguana", emoji: "🦎" },
  ],
  J: [
    { id: "J_juice", word: "Juice", emoji: "🧃" },
    { id: "J_jellyfish", word: "Jellyfish", emoji: "🪼" },
    { id: "J_jacket", word: "Jacket", emoji: "🧥" },
    { id: "J_jam", word: "Jam", emoji: "🍓" },
    { id: "J_jet", word: "Jet", emoji: "🛩️" },
  ],
  K: [
    { id: "K_koala", word: "Koala", emoji: "🐨" },
    { id: "K_kangaroo", word: "Kangaroo", emoji: "🦘" },
    { id: "K_kite", word: "Kite", emoji: "🪁" },
    { id: "K_king", word: "King", emoji: "🤴" },
    { id: "K_key", word: "Key", emoji: "🔑" },
  ],
  L: [
    { id: "L_lion", word: "Lion", emoji: "🦁" },
    { id: "L_lemon", word: "Lemon", emoji: "🍋" },
    { id: "L_leaf", word: "Leaf", emoji: "🍃" },
    { id: "L_ladybug", word: "Ladybug", emoji: "🐞" },
    { id: "L_lamb", word: "Lamb", emoji: "🐑" },
  ],
  M: [
    { id: "M_monkey", word: "Monkey", emoji: "🐵" },
    { id: "M_milk", word: "Milk", emoji: "🥛" },
    { id: "M_moon", word: "Moon", emoji: "🌙" },
    { id: "M_mouse", word: "Mouse", emoji: "🐭" },
    { id: "M_mango", word: "Mango", emoji: "🥭" },
  ],
  N: [
    { id: "N_nest", word: "Nest", emoji: "🪺" },
    { id: "N_nose", word: "Nose", emoji: "👃" },
    { id: "N_noodle", word: "Noodle", emoji: "🍜" },
    { id: "N_nut", word: "Nut", emoji: "🥜" },
    { id: "N_nurse", word: "Nurse", emoji: "🧑‍⚕️" },
  ],
  O: [
    { id: "O_octopus", word: "Octopus", emoji: "🐙" },
    { id: "O_orange", word: "Orange", emoji: "🍊" },
    { id: "O_owl", word: "Owl", emoji: "🦉" },
    { id: "O_ostrich", word: "Ostrich", emoji: "🦤" },
    { id: "O_onion", word: "Onion", emoji: "🧅" },
  ],
  P: [
    { id: "P_penguin", word: "Penguin", emoji: "🐧" },
    { id: "P_pig", word: "Pig", emoji: "🐷" },
    { id: "P_pizza", word: "Pizza", emoji: "🍕" },
    { id: "P_panda", word: "Panda", emoji: "🐼" },
    { id: "P_pineapple", word: "Pineapple", emoji: "🍍" },
  ],
  Q: [
    { id: "Q_queen", word: "Queen", emoji: "👑" },
    { id: "Q_quilt", word: "Quilt", emoji: "🛌" },
    { id: "Q_question", word: "Question", emoji: "❓" },
    { id: "Q_quail", word: "Quail", emoji: "🐦" },
    { id: "Q_quiet", word: "Quiet", emoji: "🤫" },
  ],
  R: [
    { id: "R_rabbit", word: "Rabbit", emoji: "🐰" },
    { id: "R_rainbow", word: "Rainbow", emoji: "🌈" },
    { id: "R_robot", word: "Robot", emoji: "🤖" },
    { id: "R_rocket", word: "Rocket", emoji: "🚀" },
    { id: "R_rose", word: "Rose", emoji: "🌹" },
  ],
  S: [
    { id: "S_sun", word: "Sun", emoji: "☀️" },
    { id: "S_star", word: "Star", emoji: "⭐" },
    { id: "S_strawberry", word: "Strawberry", emoji: "🍓" },
    { id: "S_snake", word: "Snake", emoji: "🐍" },
    { id: "S_shark", word: "Shark", emoji: "🦈" },
  ],
  T: [
    { id: "T_tiger", word: "Tiger", emoji: "🐯" },
    { id: "T_train", word: "Train", emoji: "🚂" },
    { id: "T_turtle", word: "Turtle", emoji: "🐢" },
    { id: "T_tree", word: "Tree", emoji: "🌳" },
    { id: "T_tomato", word: "Tomato", emoji: "🍅" },
  ],
  U: [
    { id: "U_umbrella", word: "Umbrella", emoji: "☂️" },
    { id: "U_unicorn", word: "Unicorn", emoji: "🦄" },
    { id: "U_ufo", word: "UFO", emoji: "🛸" },
    { id: "U_ukulele", word: "Ukulele", emoji: "🎸" },
    { id: "U_up", word: "Up", emoji: "⬆️" },
  ],
  V: [
    { id: "V_violin", word: "Violin", emoji: "🎻" },
    { id: "V_van", word: "Van", emoji: "🚐" },
    { id: "V_volcano", word: "Volcano", emoji: "🌋" },
    { id: "V_vegetables", word: "Vegetables", emoji: "🥦" },
    { id: "V_vase", word: "Vase", emoji: "🏺" },
  ],
  W: [
    { id: "W_whale", word: "Whale", emoji: "🐳" },
    { id: "W_watermelon", word: "Watermelon", emoji: "🍉" },
    { id: "W_watch", word: "Watch", emoji: "⌚" },
    { id: "W_worm", word: "Worm", emoji: "🪱" },
    { id: "W_wolf", word: "Wolf", emoji: "🐺" },
  ],
  X: [
    { id: "X_xylophone", word: "Xylophone", emoji: "🎶" },
    { id: "X_xray", word: "X-ray", emoji: "🩻" },
    { id: "X_box", word: "Box", emoji: "📦" },
    { id: "X_fox", word: "Fox", emoji: "🦊" },
    { id: "X_six", word: "Six", emoji: "6️⃣" },
  ],
  Y: [
    { id: "Y_yacht", word: "Yacht", emoji: "⛵" },
    { id: "Y_yoyo", word: "Yo-yo", emoji: "🪀" },
    { id: "Y_yogurt", word: "Yogurt", emoji: "🥣" },
    { id: "Y_yak", word: "Yak", emoji: "🐂" },
    { id: "Y_yellow", word: "Yellow", emoji: "💛" },
  ],
  Z: [
    { id: "Z_zebra", word: "Zebra", emoji: "🦓" },
    { id: "Z_zoo", word: "Zoo", emoji: "🎪" },
    { id: "Z_zipper", word: "Zipper", emoji: "🧥" },
    { id: "Z_zero", word: "Zero", emoji: "0️⃣" },
    { id: "Z_zucchini", word: "Zucchini", emoji: "🥒" },
  ],
};

// Track non-repeating shuffled decks per letter so children see diverse words
const letterWordDecks = {};
function pickWordForLetter(letter) {
  const upper = letter.toUpperCase();
  const list = LETTER_VOCAB[upper] || [{ id: "A_apple", word: "Apple", emoji: "🍎" }];
  if (!letterWordDecks[upper] || letterWordDecks[upper].length === 0) {
    const deck = [...list];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    letterWordDecks[upper] = deck;
  }
  return letterWordDecks[upper].pop();
}

window.LETTER_STROKES = LETTER_STROKES;
window.LETTER_VOCAB = LETTER_VOCAB;
window.pickWordForLetter = pickWordForLetter;
