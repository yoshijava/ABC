// app.js - Interactive Alphabet Tracing Game for iPad

(() => {
  const TOTAL_PER_STAGE = 10;

  // State
  let gameMode = "mixed"; // 'mixed' | 'upper' | 'lower'
  let stageLetters = [];
  let currentStageIndex = 0;
  let currentLetter = "A";
  let currentStrokes = [];
  let activeStrokeIndex = 0;
  let activePointIndex = 0; // how far along the current stroke the child has traced
  let isPointerDown = false;
  let activePointerId = null;
  let isLetterCompleted = false;
  let autoNextTimer = null;
  let countdownInterval = null;
  let stageFireworksTimer = null;
  let guideAnimProgress = 0;
  let lastInteractionTime = performance.now();

  // DOM Elements
  const welcomeOverlay = document.getElementById("welcome-overlay");
  const stageOverlay = document.getElementById("stage-overlay");
  const startGameBtn = document.getElementById("start-game-btn");
  const nextStageBtn = document.getElementById("next-stage-btn");
  const homeBtn = document.getElementById("home-btn");
  const soundBtn = document.getElementById("sound-btn");
  const clearBtn = document.getElementById("clear-btn");
  const skipWaitBtn = document.getElementById("skip-wait-btn");
  const starsBar = document.getElementById("stars-bar");
  const progressText = document.getElementById("progress-text");
  const caseLabel = document.getElementById("case-label");
  const currentLetterDisplay = document.getElementById("current-letter-display");
  const partnerLetterDisplay = document.getElementById("partner-letter-display");
  const wordEmoji = document.getElementById("word-emoji");
  const wordText = document.getElementById("word-text");
  const letterBadgeCard = document.querySelector(".letter-badge-card");
  const strokeDots = document.getElementById("stroke-dots");
  const statusMessage = document.getElementById("status-message");
  const countdownBanner = document.getElementById("countdown-banner");
  const countdownSec = document.getElementById("countdown-sec");
  const completedLettersRow = document.getElementById("completed-letters-row");

  const traceCanvas = document.getElementById("trace-canvas");
  const ctx = traceCanvas.getContext("2d");
  const fxCanvas = document.getElementById("fx-canvas");
  const fxCtx = fxCanvas.getContext("2d");

  // ================= AUDIO & SPEECH ENGINE =================
  let audioCtx = null;

  function ensureAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration = 0.15, type = "sine", delay = 0, gainVal = 0.18) {
    ensureAudioContext();
    if (!audioCtx) return;
    const start = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(gainVal, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function playStrokeDing(strokeIdx) {
    const baseNotes = [523.25, 587.33, 659.25, 783.99, 880.0];
    const f = baseNotes[strokeIdx % baseNotes.length];
    playTone(f, 0.16, "triangle", 0, 0.25);
    playTone(f * 1.25, 0.2, "sine", 0.06, 0.22);
    playTone(f * 1.5, 0.26, "triangle", 0.12, 0.24);
  }

  // Cheerful bouncy "pop/boing" sound when the child puts their finger down on the start dot
  function playPenDownSound() {
    ensureAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Main bouncy bubble pop (pitch slides up quickly)
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.09);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.13);

    // Bright woodblock/xylophone overtone
    playTone(880, 0.08, "triangle", 0.03, 0.16);
  }

  // Cute cartoon "boop" if touching away from the green start point
  function playGentleHintBoop() {
    ensureAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.11);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Lively ascending musical bubble/xylophone notes while dragging along the stroke
  const HAPPY_SCALE = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.0,  // A5
    1046.5, // C6
    1174.66,// D6
    1318.51,// E6
    1567.98,// G6
    1760.0, // A6
    2093.0, // C7
  ];

  function playTracingStepSound(progressRatio) {
    ensureAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const idx = Math.min(
      HAPPY_SCALE.length - 1,
      Math.max(0, Math.floor(progressRatio * HAPPY_SCALE.length))
    );
    const freq = HAPPY_SCALE[idx];

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    // Slight upward pitch pop for a bubbly cartoon feel
    osc.frequency.setValueAtTime(freq * 0.92, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.04, now + 0.065);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  function playFireworkPop() {
    ensureAudioContext();
    if (!audioCtx) return;
    // Short noise burst + sparkle chime
    const bufferSize = audioCtx.sampleRate * 0.12;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.16;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
  }

  function playLetterSuccessFanfare() {
    // Cheerful C-E-G-C arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      playTone(n, 0.24, "triangle", idx * 0.09, 0.22);
    });
    playFireworkPop();
  }

  function playStageClearFanfare() {
    const melody = [
      { f: 523.25, d: 0.15, t: 0.0 },
      { f: 659.25, d: 0.15, t: 0.14 },
      { f: 783.99, d: 0.15, t: 0.28 },
      { f: 1046.5, d: 0.3, t: 0.42 },
      { f: 783.99, d: 0.15, t: 0.72 },
      { f: 1046.5, d: 0.55, t: 0.88 },
    ];
    melody.forEach((m) => playTone(m.f, m.d, "triangle", m.t, 0.25));
  }

  // Spoken letter pronunciation via Web Speech API
  function speakLetter(letter, includeWord = false) {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const upper = letter.toUpperCase();
      const info = window.LETTER_WORDS[upper];
      // Using lowercase letter name avoids TTS saying "Capital A" on iOS
      const spokenChar = letter.toLowerCase();
      const text = includeWord && info ? `${spokenChar}! ${info.word}!` : spokenChar;

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 0.82; // Clear, slower cadence for kindergarten learners
      utter.pitch = 1.1;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang === "en-US" && /Samantha|Ava|Nicky|Victoria|Alex|Google/i.test(v.name)) ||
        voices.find((v) => v.lang && v.lang.startsWith("en-US")) ||
        voices.find((v) => v.lang && v.lang.startsWith("en"));
      if (preferredVoice) {
        utter.voice = preferredVoice;
      }
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  // ================= FIREWORKS & CONFETTI ENGINE =================
  const particles = [];

  function resizeCanvases() {
    const rect = traceCanvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    traceCanvas.width = Math.round(rect.width * dpr);
    traceCanvas.height = Math.round(rect.height * dpr);

    fxCanvas.width = Math.round(window.innerWidth * dpr);
    fxCanvas.height = Math.round(window.innerHeight * dpr);
  }

  window.addEventListener("resize", resizeCanvases);

  function spawnFireworkBurst(normX, normY, count = 48) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = normX * w;
    const y = normY * h;
    const palette = [
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#fde047",
      "#06b6d4",
    ];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
      const speed = 3 + Math.random() * 8.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        gravity: 0.14,
        drag: 0.98,
        size: 5 + Math.random() * 6,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        decay: 0.013 + Math.random() * 0.01,
        shape: Math.random() > 0.35 ? "circle" : "star",
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  // Spawn sparkles along a completed stroke on the fxCanvas
  function spawnStrokeSparkles(strokePts) {
    const rect = traceCanvas.getBoundingClientRect();
    const palette = ["#3b82f6", "#60a5fa", "#fde047", "#34d399"];
    for (let i = 0; i < strokePts.length; i += 4) {
      const pt = strokePts[i];
      const screenX = rect.left + (pt.x / 100) * rect.width;
      const screenY = rect.top + (pt.y / 100) * rect.height;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        gravity: 0.08,
        drag: 0.96,
        size: 4 + Math.random() * 4,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        decay: 0.025 + Math.random() * 0.015,
        shape: "circle",
        rotation: 0,
        vRot: 0,
      });
    }
  }

  // Spawn lively sparkles right under the child's fingertip when touching/dragging
  function spawnFingerSparkle(normPt, count = 6) {
    const rect = traceCanvas.getBoundingClientRect();
    const screenX = rect.left + (normPt.x / 100) * rect.width;
    const screenY = rect.top + (normPt.y / 100) * rect.height;
    const palette = ["#fde047", "#34d399", "#60a5fa", "#f472b6", "#fb923c"];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        gravity: 0.1,
        drag: 0.95,
        size: 4 + Math.random() * 4.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        decay: 0.03 + Math.random() * 0.015,
        shape: Math.random() > 0.4 ? "star" : "circle",
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
      });
    }
  }

  function updateAndDrawParticles() {
    const dpr = window.devicePixelRatio || 1;
    fxCtx.save();
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      fxCtx.save();
      fxCtx.globalAlpha = Math.max(0, p.alpha);
      fxCtx.translate(p.x, p.y);
      fxCtx.rotate(p.rotation);
      fxCtx.fillStyle = p.color;

      if (p.shape === "star") {
        drawStarPath(fxCtx, 0, 0, 5, p.size * 1.3, p.size * 0.55);
        fxCtx.fill();
      } else {
        fxCtx.beginPath();
        fxCtx.arc(0, 0, p.size, 0, Math.PI * 2);
        fxCtx.fill();
      }
      fxCtx.restore();
    }
    fxCtx.restore();
  }

  function drawStarPath(context, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    context.beginPath();
    context.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      context.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      context.lineTo(x, y);
      rot += step;
    }
    context.lineTo(cx, cy - outerRadius);
    context.closePath();
  }

  // ================= STAGE & LETTER SELECTION =================
  function getPoolForMode(mode) {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const lower = "abcdefghijklmnopqrstuvwxyz".split("");
    if (mode === "upper") return upper;
    if (mode === "lower") return lower;
    return upper.concat(lower);
  }

  function generateStageLetters() {
    const pool = [...getPoolForMode(gameMode)];
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, TOTAL_PER_STAGE);
  }

  function clearTimers() {
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    if (stageFireworksTimer) {
      clearInterval(stageFireworksTimer);
      stageFireworksTimer = null;
    }
  }

  function startNewStage() {
    clearTimers();
    stageOverlay.classList.remove("active");
    stageLetters = generateStageLetters();
    currentStageIndex = 0;
    renderStarsBar();
    loadLetter(stageLetters[0]);
  }

  function renderStarsBar() {
    starsBar.innerHTML = "";
    for (let i = 0; i < TOTAL_PER_STAGE; i++) {
      const span = document.createElement("span");
      span.className = "star-slot";
      span.textContent = "⭐";
      if (i < currentStageIndex) {
        span.classList.add("done");
      } else if (i === currentStageIndex && !isLetterCompleted) {
        span.classList.add("current");
      } else if (i === currentStageIndex && isLetterCompleted) {
        span.classList.add("done");
      }
      starsBar.appendChild(span);
    }
    progressText.textContent = `${Math.min(currentStageIndex + 1, TOTAL_PER_STAGE)} / ${TOTAL_PER_STAGE}`;
  }

  function loadLetter(letter) {
    clearTimers();
    isLetterCompleted = false;
    isPointerDown = false;
    activePointerId = null;
    currentLetter = letter;
    currentStrokes = window.LETTER_STROKES[letter] || window.LETTER_STROKES["A"];
    activeStrokeIndex = 0;
    activePointIndex = 0;
    guideAnimProgress = 0;
    lastInteractionTime = performance.now();

    countdownBanner.classList.add("hidden");

    // Update left info card
    const isUpper = letter === letter.toUpperCase();
    caseLabel.textContent = isUpper ? "大寫字母 (A-Z)" : "小寫字母 (a-z)";
    currentLetterDisplay.textContent = letter;
    partnerLetterDisplay.textContent = isUpper ? letter.toLowerCase() : letter.toUpperCase();

    const wordInfo = window.LETTER_WORDS[letter.toUpperCase()];
    if (wordInfo) {
      wordEmoji.textContent = wordInfo.emoji;
      wordText.textContent = wordInfo.word;
    }

    renderStarsBar();
    updateStrokeStatusUI();
    resizeCanvases();

    // Speak the new letter immediately
    setTimeout(() => {
      speakLetter(currentLetter, false);
    }, 120);
  }

  function updateStrokeStatusUI() {
    strokeDots.innerHTML = "";
    currentStrokes.forEach((_, idx) => {
      const pill = document.createElement("div");
      pill.className = "stroke-pill";
      if (idx < activeStrokeIndex || isLetterCompleted) {
        pill.classList.add("done");
        pill.textContent = "✓";
      } else if (idx === activeStrokeIndex) {
        pill.classList.add("active");
        pill.textContent = String(idx + 1);
      } else {
        pill.textContent = String(idx + 1);
      }
      strokeDots.appendChild(pill);
    });

    if (isLetterCompleted) {
      statusMessage.innerHTML = `🎉 <strong>${currentLetter}</strong> 寫得好漂亮！`;
    } else {
      statusMessage.innerHTML = `👆 請從綠色圓點 <strong>${activeStrokeIndex + 1}</strong> 開始跟著畫！`;
    }
  }

  // ================= STROKE TRACING INTERACTION =================
  function getNormCoords(evt) {
    const rect = traceCanvas.getBoundingClientRect();
    const x = ((evt.clientX - rect.left) / rect.width) * 100;
    const y = ((evt.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  }

  function isDotStroke(strokePts) {
    if (strokePts.length <= 2) return true;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const p of strokePts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return Math.hypot(maxX - minX, maxY - minY) < 9;
  }

  // Kid-friendly tolerance in 0..100 coordinate space
  const START_TOLERANCE = 15.5;
  const TRACE_TOLERANCE = 15.5;
  let lastStepSoundIdx = 0;

  function handlePointerDown(evt) {
    if (isLetterCompleted) return;
    ensureAudioContext();
    evt.preventDefault();

    const pt = getNormCoords(evt);
    const stroke = currentStrokes[activeStrokeIndex];
    if (!stroke || stroke.length === 0) return;

    lastInteractionTime = performance.now();

    // Special case: dot stroke on 'i' or 'j'
    if (isDotStroke(stroke)) {
      const center = stroke[0];
      if (Math.hypot(pt.x - center.x, pt.y - center.y) <= START_TOLERANCE * 1.2) {
        playPenDownSound();
        spawnFingerSparkle(pt, 10);
        completeCurrentStroke();
      } else {
        playGentleHintBoop();
      }
      return;
    }

    // Check distance to current resume point (or start of stroke)
    const resumePt = stroke[activePointIndex];
    const distToResume = Math.hypot(pt.x - resumePt.x, pt.y - resumePt.y);

    // Also allow grabbing slightly behind activePointIndex
    let canGrab = distToResume <= START_TOLERANCE;
    if (!canGrab && activePointIndex > 0) {
      for (let i = 0; i <= activePointIndex; i++) {
        if (Math.hypot(pt.x - stroke[i].x, pt.y - stroke[i].y) <= START_TOLERANCE) {
          canGrab = true;
          break;
        }
      }
    }

    if (canGrab) {
      isPointerDown = true;
      activePointerId = evt.pointerId;
      lastStepSoundIdx = activePointIndex;
      playPenDownSound();
      spawnFingerSparkle(resumePt, 8);
      try {
        traceCanvas.setPointerCapture(evt.pointerId);
      } catch (_) {}
      advanceStrokeProgress(pt);
    } else {
      playGentleHintBoop();
    }
  }

  function handlePointerMove(evt) {
    if (!isPointerDown || isLetterCompleted) return;
    if (activePointerId !== null && evt.pointerId !== activePointerId) return;
    evt.preventDefault();

    lastInteractionTime = performance.now();
    const pt = getNormCoords(evt);
    advanceStrokeProgress(pt);
  }

  function handlePointerUp(evt) {
    if (activePointerId !== null && evt.pointerId !== activePointerId) return;
    isPointerDown = false;
    activePointerId = null;
    lastInteractionTime = performance.now();
  }

  function advanceStrokeProgress(pt) {
    const stroke = currentStrokes[activeStrokeIndex];
    if (!stroke) return;

    // Look ahead from activePointIndex up to a window so closed loops (O, B, d, etc.)
    // must be traced in order rather than jumping directly to the end.
    const maxLookahead = Math.min(stroke.length - 1, activePointIndex + 16);
    let bestIdx = activePointIndex;

    for (let i = activePointIndex; i <= maxLookahead; i++) {
      const d = Math.hypot(pt.x - stroke[i].x, pt.y - stroke[i].y);
      if (d <= TRACE_TOLERANCE) {
        bestIdx = i;
      }
    }

    if (bestIdx > activePointIndex) {
      activePointIndex = bestIdx;
      const completionRatio = activePointIndex / Math.max(1, stroke.length - 1);

      // Play ascending musical xylophone/bubble notes as the child traces forward
      const stepStride = Math.max(3, Math.floor(stroke.length / 9));
      if (activePointIndex - lastStepSoundIdx >= stepStride) {
        lastStepSoundIdx = activePointIndex;
        playTracingStepSound(completionRatio);
        spawnFingerSparkle(stroke[activePointIndex], 4);
      }
    }

    // Check if child reached the end of the stroke
    const endPt = stroke[stroke.length - 1];
    const distToEnd = Math.hypot(pt.x - endPt.x, pt.y - endPt.y);
    const completionRatio = activePointIndex / (stroke.length - 1);

    if (
      activePointIndex >= stroke.length - 3 ||
      (completionRatio >= 0.85 && distToEnd <= TRACE_TOLERANCE * 0.9)
    ) {
      completeCurrentStroke();
    }
  }

  function completeCurrentStroke() {
    const finishedStroke = currentStrokes[activeStrokeIndex];
    playStrokeDing(activeStrokeIndex);
    spawnStrokeSparkles(finishedStroke);

    isPointerDown = false;
    activePointerId = null;
    activeStrokeIndex++;
    activePointIndex = 0;
    guideAnimProgress = 0;

    if (activeStrokeIndex >= currentStrokes.length) {
      onLetterCompleted();
    } else {
      updateStrokeStatusUI();
    }
  }

  function onLetterCompleted() {
    isLetterCompleted = true;
    updateStrokeStatusUI();
    renderStarsBar();

    // Launch celebratory fireworks!
    playLetterSuccessFanfare();
    spawnFireworkBurst(0.35, 0.38, 45);
    setTimeout(() => {
      playFireworkPop();
      spawnFireworkBurst(0.68, 0.35, 45);
    }, 220);
    setTimeout(() => {
      playFireworkPop();
      spawnFireworkBurst(0.52, 0.28, 55);
    }, 450);

    // Speak the letter + associated word
    setTimeout(() => {
      speakLetter(currentLetter, true);
    }, 350);

    // Show 3-second countdown banner and auto-advance after 3 seconds
    let remaining = 3;
    countdownSec.textContent = String(remaining);
    countdownBanner.classList.remove("hidden");

    countdownInterval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        countdownSec.textContent = String(remaining);
      }
    }, 1000);

    autoNextTimer = setTimeout(() => {
      proceedToNextLetter();
    }, 3000);
  }

  function proceedToNextLetter() {
    clearTimers();
    currentStageIndex++;
    if (currentStageIndex >= TOTAL_PER_STAGE) {
      triggerStageClearCelebration();
    } else {
      loadLetter(stageLetters[currentStageIndex]);
    }
  }

  function triggerStageClearCelebration() {
    countdownBanner.classList.add("hidden");
    completedLettersRow.innerHTML = "";
    stageLetters.forEach((ch) => {
      const chip = document.createElement("div");
      chip.className = "completed-chip";
      chip.textContent = ch;
      completedLettersRow.appendChild(chip);
    });

    stageOverlay.classList.add("active");
    playStageClearFanfare();

    // Continuous celebratory fireworks while on Stage Clear screen
    const launchRandomBurst = () => {
      playFireworkPop();
      spawnFireworkBurst(0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.45, 50);
    };
    launchRandomBurst();
    setTimeout(launchRandomBurst, 350);
    stageFireworksTimer = setInterval(launchRandomBurst, 900);
  }

  // ================= CANVAS RENDERING LOOP =================
  function drawPolyline(pts, startIndex, endIndex, scaleX, scaleY) {
    if (!pts || pts.length === 0 || endIndex <= startIndex) return;
    ctx.beginPath();
    ctx.moveTo(pts[startIndex].x * scaleX, pts[startIndex].y * scaleY);
    for (let i = startIndex + 1; i <= endIndex && i < pts.length; i++) {
      ctx.lineTo(pts[i].x * scaleX, pts[i].y * scaleY);
    }
    ctx.stroke();
  }

  function drawNotebookLines(w, h) {
    const scaleY = h / 100;
    // Four standard handwriting lines: 18 (top), 46 (mid), 76 (baseline), 94 (bottom)
    const lines = [
      { y: 18, color: "#bae6fd", dash: [], width: 2 },
      { y: 46, color: "#93c5fd", dash: [10, 10], width: 2 },
      { y: 76, color: "#fca5a5", dash: [], width: 3 },
      { y: 94, color: "#e2e8f0", dash: [6, 8], width: 2 },
    ];

    lines.forEach((ln) => {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = ln.color;
      ctx.lineWidth = ln.width;
      ctx.setLineDash(ln.dash);
      const yPx = ln.y * scaleY;
      ctx.moveTo(24, yPx);
      ctx.lineTo(w - 24, yPx);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawDirectionArrow(pts, scaleX, scaleY) {
    if (pts.length < 4) return;
    const endIdx = pts.length - 1;
    const prevIdx = Math.max(0, endIdx - 4);
    const p1 = pts[prevIdx];
    const p2 = pts[endIdx];
    const angle = Math.atan2((p2.y - p1.y) * scaleY, (p2.x - p1.x) * scaleX);
    const tipX = p2.x * scaleX;
    const tipY = p2.y * scaleY;

    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function renderBoard(now) {
    const dpr = window.devicePixelRatio || 1;
    const w = traceCanvas.width / dpr;
    const h = traceCanvas.height / dpr;
    const scaleX = w / 100;
    const scaleY = h / 100;
    const strokeWidth = Math.max(28, Math.min(w, h) * 0.088);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 1. Draw 4-line English notebook guides
    drawNotebookLines(w, h);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 2. Draw all strokes in light gray first (base silhouette)
    currentStrokes.forEach((strokePts) => {
      if (isDotStroke(strokePts)) {
        const c = strokePts[0];
        ctx.fillStyle = "#d1d5db";
        ctx.beginPath();
        ctx.arc(c.x * scaleX, c.y * scaleY, strokeWidth * 0.56, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = strokeWidth;
        drawPolyline(strokePts, 0, strokePts.length - 1, scaleX, scaleY);
      }
    });

    // 3. Draw completed strokes in bright blue (#2563eb)
    for (let i = 0; i < activeStrokeIndex; i++) {
      const strokePts = currentStrokes[i];
      if (isDotStroke(strokePts)) {
        const c = strokePts[0];
        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.arc(c.x * scaleX, c.y * scaleY, strokeWidth * 0.56, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = strokeWidth;
        drawPolyline(strokePts, 0, strokePts.length - 1, scaleX, scaleY);
      }
    }

    // 4. Draw current active stroke guide + already-traced blue segment
    if (!isLetterCompleted && activeStrokeIndex < currentStrokes.length) {
      const activeStroke = currentStrokes[activeStrokeIndex];
      const dotMode = isDotStroke(activeStroke);

      if (!dotMode) {
        // Dashed white guide line along the active stroke
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        drawPolyline(activeStroke, 0, activeStroke.length - 1, scaleX, scaleY);
        ctx.restore();

        // End target circle + direction arrow
        const endPt = activeStroke[activeStroke.length - 1];
        ctx.save();
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(endPt.x * scaleX, endPt.y * scaleY, strokeWidth * 0.36, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        drawDirectionArrow(activeStroke, scaleX, scaleY);

        // Draw the portion already traced by the child in bright blue!
        if (activePointIndex > 0) {
          ctx.save();
          ctx.strokeStyle = "#2563eb";
          ctx.lineWidth = strokeWidth;
          drawPolyline(activeStroke, 0, activePointIndex, scaleX, scaleY);
          ctx.restore();
        }
      }

      // 5. Pulsing Start / Resume Point Indicator
      const currentTargetPt = activeStroke[activePointIndex] || activeStroke[0];
      const pulse = 1 + 0.12 * Math.sin(now * 0.006);
      const startRadius = strokeWidth * 0.48 * pulse;

      ctx.save();
      ctx.fillStyle = "#10b981";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(
        currentTargetPt.x * scaleX,
        currentTargetPt.y * scaleY,
        startRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();

      // Stroke number label inside start circle
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${Math.round(strokeWidth * 0.44)}px -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        String(activeStrokeIndex + 1),
        currentTargetPt.x * scaleX,
        currentTargetPt.y * scaleY + 1
      );
      ctx.restore();

      // 6. Animated Guiding Hand (👆) when idle
      if (!isPointerDown && now - lastInteractionTime > 600) {
        guideAnimProgress = (guideAnimProgress + 0.008) % 1;
        const idx = Math.min(
          activeStroke.length - 1,
          Math.floor(
            activePointIndex + guideAnimProgress * (activeStroke.length - 1 - activePointIndex)
          )
        );
        const guidePt = activeStroke[idx];
        if (guidePt) {
          ctx.save();
          ctx.font = `${Math.round(strokeWidth * 0.85)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.shadowColor = "rgba(0,0,0,0.2)";
          ctx.shadowBlur = 8;
          ctx.fillText("👆", guidePt.x * scaleX + 6, guidePt.y * scaleY - 4);
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  function mainLoop(now) {
    renderBoard(now);
    updateAndDrawParticles();
    requestAnimationFrame(mainLoop);
  }

  // ================= EVENT LISTENERS =================
  traceCanvas.addEventListener("pointerdown", handlePointerDown);
  traceCanvas.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);

  // Prevent iOS Safari bounce / pinch zoom gestures
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
  document.addEventListener("gesturestart", (e) => e.preventDefault());

  // Mode buttons in Welcome modal
  document.querySelectorAll(".mode-choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      gameMode = btn.dataset.mode;
      syncModeButtons();
    });
  });

  // Mode pills in Header bar
  document.querySelectorAll(".pill-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      gameMode = btn.dataset.mode;
      syncModeButtons();
      startNewStage();
    });
  });

  function syncModeButtons() {
    document.querySelectorAll(".mode-choice, .pill-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === gameMode);
    });
  }

  startGameBtn.addEventListener("click", () => {
    ensureAudioContext();
    welcomeOverlay.classList.remove("active");
    startNewStage();
  });

  nextStageBtn.addEventListener("click", () => {
    ensureAudioContext();
    startNewStage();
  });

  homeBtn.addEventListener("click", () => {
    clearTimers();
    welcomeOverlay.classList.add("active");
  });

  soundBtn.addEventListener("click", () => {
    ensureAudioContext();
    speakLetter(currentLetter, true);
  });

  letterBadgeCard.addEventListener("click", () => {
    ensureAudioContext();
    speakLetter(currentLetter, true);
  });

  clearBtn.addEventListener("click", () => {
    if (isLetterCompleted) return;
    activeStrokeIndex = 0;
    activePointIndex = 0;
    isPointerDown = false;
    activePointerId = null;
    updateStrokeStatusUI();
    speakLetter(currentLetter, false);
  });

  skipWaitBtn.addEventListener("click", () => {
    proceedToNextLetter();
  });

  // Initialize layout and start animation loop
  resizeCanvases();
  stageLetters = generateStageLetters();
  currentLetter = stageLetters[0];
  currentStrokes = window.LETTER_STROKES[currentLetter];
  renderStarsBar();
  updateStrokeStatusUI();
  requestAnimationFrame(mainLoop);
})();
