// Game State
let score = 0;
let highScore = localStorage.getItem("whackHighScore") || 0;
let timeLeft = 60;
let gameInterval = null;
let moleInterval = null;
let countdownInterval = null;
let isGameActive = false;
let isPaused = false; // track paused vs. not-started
<<<<<<< HEAD
let isCountingDown = false;
let isEndless = localStorage.getItem("wamEndless") === "on";
let adaptiveEnabled = localStorage.getItem("wamAdaptive") === "on";
let performanceMode = localStorage.getItem("wamPerformance") === "on";
let soundEnabled = localStorage.getItem("wamSound") === "off" ? false : true;
let hapticsEnabled =
  localStorage.getItem("wamHaptics") === "off" ? false : true;
let reducedMotionPref =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let reducedMotion =
  localStorage.getItem("wamReducedMotion") === "on"
    ? true
    : reducedMotionPref;
=======
>>>>>>> origin/main
let difficulty = "medium";
let hits = 0;
let misses = 0;
let currentStreak = 0;
let bestStreak = 0;
let audioCtx = null;

// Difficulty Settings
const difficultySettings = {
  easy: {
    moleShowTime: 1500,
    moleHideTime: 2000,
    spawnInterval: 1000,
  },
  medium: {
    moleShowTime: 1000,
    moleHideTime: 1500,
    spawnInterval: 800,
  },
  hard: {
    moleShowTime: 700,
    moleHideTime: 1000,
    spawnInterval: 600,
  },
};

// DOM Elements
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const highscoreDisplay = document.getElementById("highscore");
const gameBoard = document.getElementById("game-board");
const holes = document.querySelectorAll(".hole");
const difficultySelector = document.getElementById("difficulty-selector");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");
const gameOverModal = document.getElementById("game-over-modal");
const playAgainBtn = document.getElementById("play-again-btn");
const finalScoreDisplay = document.getElementById("final-score");
const accuracyDisplay = document.getElementById("accuracy");
const bestStreakDisplay = document.getElementById("best-streak");
const achievementDisplay = document.getElementById("achievement");
const streakDisplay = document.getElementById("streak-display");
const progressCircle = document.querySelector(".progress-ring-circle");
const particlesContainer = document.getElementById("particles");
const playerNameInput = document.getElementById("player-name");
const leaderboardList = document.getElementById("leaderboard-list");
const leaderboardEmpty = document.getElementById("leaderboard-empty");
const leaderboardRetry = document.getElementById("leaderboard-retry");
const leaderboardNote = document.getElementById("leaderboard-note");
const soundToggle = document.getElementById("sound-toggle");
const hapticsToggle = document.getElementById("haptics-toggle");
const performanceToggle = document.getElementById("performance-toggle");
const helpBtn = document.getElementById("help-btn");
const helpModal = document.getElementById("help-modal");
const helpCloseBtn = document.getElementById("help-close-btn");
const endlessToggle = document.getElementById("endless-toggle");
const adaptiveToggle = document.getElementById("adaptive-toggle");
const reducedMotionToggle = document.getElementById("reduced-motion-toggle");
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownNumber = document.getElementById("countdown-number");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  highscoreDisplay.textContent = highScore;
  setupEventListeners();
  initializeProgressRing();
  applyPreferenceUI();
  updateTimer();

  // Player name (localStorage)
  const savedName = localStorage.getItem("playerName") || "";
  if (playerNameInput) {
    playerNameInput.value = savedName;
    playerNameInput.addEventListener("change", () => {
      const v = playerNameInput.value.trim().slice(0, 20);
      localStorage.setItem("playerName", v);
      playerNameInput.value = v;
    });
  }

  // Leaderboard load (online if consent, otherwise local)
  loadLeaderboard();
  window.addEventListener("consent-changed", () => {
    loadLeaderboard();
  });
});

// Progress Ring Setup
function initializeProgressRing() {
  if (!progressCircle) return;
  const radius = progressCircle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  progressCircle.style.strokeDashoffset = 0;
}

function updateProgressRing(percent) {
  if (!progressCircle) return;
  const radius = progressCircle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;
}

// Event Listeners
function setupEventListeners() {
  startBtn.addEventListener("click", startGame);
  resetBtn.addEventListener("click", resetGame);
  playAgainBtn.addEventListener("click", playAgain);

  soundToggle?.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem("wamSound", soundEnabled ? "on" : "off");
    updateToggleLabel(soundToggle, soundEnabled, "🔊 Sound On", "🔇 Sound Off");
  });

  hapticsToggle?.addEventListener("click", () => {
    hapticsEnabled = !hapticsEnabled;
    localStorage.setItem("wamHaptics", hapticsEnabled ? "on" : "off");
    updateToggleLabel(
      hapticsToggle,
      hapticsEnabled,
      "📳 Haptics On",
      "📴 Haptics Off"
    );
  });

  performanceToggle?.addEventListener("click", () => {
    performanceMode = !performanceMode;
    localStorage.setItem("wamPerformance", performanceMode ? "on" : "off");
    applyPerformanceMode();
    updateToggleLabel(
      performanceToggle,
      performanceMode,
      "💨 Performance On",
      "💨 Performance Off"
    );
  });

  helpBtn?.addEventListener("click", openHelp);
  helpCloseBtn?.addEventListener("click", closeHelp);
  helpModal?.addEventListener("click", (e) => {
    if (e.target === helpModal) closeHelp();
  });

  endlessToggle?.addEventListener("change", () => {
    isEndless = endlessToggle.checked;
    localStorage.setItem("wamEndless", isEndless ? "on" : "off");
    updateTimer();
  });

  adaptiveToggle?.addEventListener("change", () => {
    adaptiveEnabled = adaptiveToggle.checked;
    localStorage.setItem("wamAdaptive", adaptiveEnabled ? "on" : "off");
  });

  reducedMotionToggle?.addEventListener("change", () => {
    reducedMotion = reducedMotionToggle.checked;
    localStorage.setItem("wamReducedMotion", reducedMotion ? "on" : "off");
    applyReducedMotion();
  });

  leaderboardRetry?.addEventListener("click", () => {
    loadLeaderboard(true);
  });

  difficultyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      difficulty = btn.dataset.difficulty;
      difficultySelector.classList.add("hidden");
      gameBoard.classList.remove("disabled");
    });
  });

  holes.forEach((hole) => {
    const mole = hole.querySelector(".mole");
    mole.addEventListener("click", (e) => {
      if (isGameActive && hole.classList.contains("up")) {
        whackMole(hole, e);
      }
    });
  });

  // Add miss tracking when clicking holes without moles
  holes.forEach((hole) => {
    hole.addEventListener("click", (e) => {
      if (isGameActive && !hole.classList.contains("up")) {
        miss(e);
      }
    });
  });
}

function updateToggleLabel(btn, isOn, onText, offText) {
  if (!btn) return;
  btn.setAttribute("aria-pressed", String(isOn));
  btn.textContent = isOn ? onText : offText;
}

function applyPerformanceMode() {
  document.body.classList.toggle("performance-mode", performanceMode);
}

function applyReducedMotion() {
  document.body.classList.toggle("reduced-motion", reducedMotion);
}

function applyPreferenceUI() {
  updateToggleLabel(soundToggle, soundEnabled, "🔊 Sound On", "🔇 Sound Off");
  updateToggleLabel(
    hapticsToggle,
    hapticsEnabled,
    "📳 Haptics On",
    "📴 Haptics Off"
  );
  updateToggleLabel(
    performanceToggle,
    performanceMode,
    "💨 Performance On",
    "💨 Performance Off"
  );
  if (endlessToggle) endlessToggle.checked = isEndless;
  if (adaptiveToggle) adaptiveToggle.checked = adaptiveEnabled;
  if (reducedMotionToggle) reducedMotionToggle.checked = reducedMotion;
  applyPerformanceMode();
  applyReducedMotion();
}

function openHelp() {
  if (!helpModal) return;
  helpModal.classList.add("show");
  helpModal.setAttribute("aria-hidden", "false");
}

function closeHelp() {
  if (!helpModal) return;
  helpModal.classList.remove("show");
  helpModal.setAttribute("aria-hidden", "true");
}

// Game Functions
function startGame() {
  if (difficultySelector.classList.contains("hidden")) {
<<<<<<< HEAD
    if (isCountingDown) return;
    if (isGameActive) {
=======
    if (isPaused && !isGameActive) {
      resumeGame();
      return;
    }
    if (!isGameActive) {
      isGameActive = true;
      isPaused = false;
      score = 0;
      hits = 0;
      misses = 0;
      currentStreak = 0;
      bestStreak = 0;
      timeLeft = 60;
      updateScore();
      updateTimer();
      startBtn.textContent = "⏸ PAUSE";
      startBtn.style.background =
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";

      gameInterval = setInterval(gameLoop, 100);
      startMoleSpawning();
    } else {
>>>>>>> origin/main
      pauseGame();
      return;
    }
    if (isPaused) {
      startCountdown(resumeGame);
      return;
    }

    prepareNewGame();
    startCountdown(startGameplay);
  } else {
    // Shake the difficulty selector
    difficultySelector.style.animation = "none";
    setTimeout(() => {
      difficultySelector.style.animation = "shake 0.5s ease";
    }, 10);
  }
}

// Add shake animation to CSS dynamically
const style = document.createElement("style");
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

function prepareNewGame() {
  isPaused = false;
  isGameActive = false;
  isCountingDown = false;
  score = 0;
  hits = 0;
  misses = 0;
  currentStreak = 0;
  bestStreak = 0;
  timeLeft = isEndless ? Infinity : 60;
  updateScore();
  updateTimer();
  updateStreak();
  holes.forEach((hole) => hole.classList.remove("up"));
}

function pauseGame() {
  isPaused = true;
  isGameActive = false;
  clearInterval(gameInterval);
  clearTimeout(moleInterval);
  clearInterval(countdownInterval);
  countdownInterval = null;
  startBtn.innerHTML = '<span class="btn-icon">▶</span>RESUME';
  startBtn.style.background =
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
}

function startGameplay() {
  isPaused = false;
  isGameActive = true;
  startBtn.textContent = "⏸ PAUSE";
  startBtn.style.background =
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 100);
  startMoleSpawning();
  playSound("start");
}

function resumeGame() {
  isPaused = false;
  isGameActive = true;
  startBtn.textContent = "⏸ PAUSE";
  startBtn.style.background =
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 100);
  startMoleSpawning();
  playSound("start");
}

function startMoleSpawning() {
  clearTimeout(moleInterval);
  scheduleNextMole();
}

function scheduleNextMole() {
  if (!isGameActive) return;
  const settings = getCurrentSettings();
  showRandomMole(settings);
  moleInterval = setTimeout(scheduleNextMole, settings.spawnInterval);
}

function getCurrentSettings() {
  const base = { ...difficultySettings[difficulty] };
  if (!adaptiveEnabled) return base;
  const progress = Math.min(1, (hits + misses) / 120);
  const factor = 1 - progress * 0.5; // ramps up speed up to 50%
  return {
    moleShowTime: Math.max(400, base.moleShowTime * factor),
    moleHideTime: Math.max(500, base.moleHideTime * factor),
    spawnInterval: Math.max(350, base.spawnInterval * factor),
  };
}

function showRandomMole(settings = getCurrentSettings()) {
  const availableHoles = Array.from(holes).filter(
    (hole) => !hole.classList.contains("up")
  );

  if (availableHoles.length === 0) return;

  const randomHole =
    availableHoles[Math.floor(Math.random() * availableHoles.length)];
  randomHole.classList.add("up");

  // Add golden mole occasionally for bonus points
  const isGolden = Math.random() < 0.1; // 10% chance
  if (isGolden) {
    const moleHead = randomHole.querySelector(".mole-head");
    moleHead.style.background =
      "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)";
    moleHead.classList.add("golden");
  }

  const hideDelay = settings.moleShowTime || 1000;
  setTimeout(() => {
    randomHole.classList.remove("up");
    const moleHead = randomHole.querySelector(".mole-head");
    if (moleHead.classList.contains("golden")) {
      moleHead.style.background =
        "linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)";
      moleHead.classList.remove("golden");
    }
  }, hideDelay);
}

function startCountdown(next) {
  if (!countdownOverlay || !countdownNumber) {
    next();
    return;
  }
  isCountingDown = true;
  let count = 3;
  countdownNumber.textContent = count;
  countdownOverlay.classList.add("show");
  playSound("beep");
  triggerHaptics(10);

  const tick = () => {
    if (!isCountingDown) return;
    count -= 1;
    if (count <= 0) {
      countdownOverlay.classList.remove("show");
      isCountingDown = false;
      next();
      return;
    }
    countdownNumber.textContent = count;
    playSound("beep");
    triggerHaptics(10);
    setTimeout(tick, 700);
  };

  setTimeout(tick, 700);
}

function playSound(type) {
  if (!soundEnabled || performanceMode || reducedMotion) return;
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
    }
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const tones = {
      hit: 880,
      miss: 240,
      beep: 520,
      start: 660,
      end: 180,
    };
    const freq = tones[type] || 440;
    const now = audioCtx.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (_) {
    // no-op: audio may be blocked
  }
}

function triggerHaptics(duration = 20) {
  if (!hapticsEnabled || reducedMotion || !navigator.vibrate) return;
  navigator.vibrate(duration);
}

function whackMole(hole, event) {
  hole.classList.remove("up");
  const mole = hole.querySelector(".mole");
  const moleHead = hole.querySelector(".mole-head");
  const isGolden = moleHead.classList.contains("golden");

  mole.classList.add("whacked");

  // Calculate points
  let points = isGolden ? 20 : 10;
  if (currentStreak >= 10) points *= 2; // Double points for 10+ streak

  score += points;
  hits++;
  currentStreak++;

  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  updateScore();
  updateStreak();

  playSound("hit");
  triggerHaptics(isGolden ? 25 : 15);

  // Create score popup
  createScorePopup(event, points, isGolden);

  // Create particles
  createParticles(event, isGolden ? "⭐" : "💥");

  // Add screen shake
  shakeScreen();

  // Reset mole appearance
  setTimeout(() => {
    mole.classList.remove("whacked");
    if (isGolden) {
      moleHead.style.background =
        "linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)";
      moleHead.classList.remove("golden");
    }
  }, 300);
}

function miss(event) {
  misses++;
  currentStreak = 0;
  updateStreak();

  playSound("miss");
  triggerHaptics(10);

  // Visual feedback for missing
  createParticles(event, "❌");
}

function updateScore() {
  scoreDisplay.textContent = score;
  scoreDisplay.style.animation = "none";
  setTimeout(() => {
    scoreDisplay.style.animation = "scoreUpdate 0.3s ease";
  }, 10);

  if (score > highScore) {
    highScore = score;
    highscoreDisplay.textContent = highScore;
    localStorage.setItem("whackHighScore", highScore);

    // Celebrate new high score
    highscoreDisplay.style.animation = "none";
    setTimeout(() => {
      highscoreDisplay.style.animation = "scoreUpdate 0.3s ease";
    }, 10);
  }
}

function updateStreak() {
  if (currentStreak >= 5) {
    streakDisplay.textContent = `🔥 ${currentStreak} STREAK!`;
    streakDisplay.style.animation = "none";
    setTimeout(() => {
      streakDisplay.style.animation = "pulse 0.5s ease";
    }, 10);
  } else {
    streakDisplay.textContent = "";
  }
}

// Add pulse animation
const pulseStyle = document.createElement("style");
pulseStyle.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;
document.head.appendChild(pulseStyle);

function updateTimer() {
  if (isEndless) {
    timerDisplay.textContent = "∞";
    updateProgressRing(100);
    timerDisplay.style.color = "";
    progressCircle.style.stroke = "";
    timerDisplay.classList.remove("low-time");
    return;
  }

  timerDisplay.textContent = timeLeft;
  const percent = (timeLeft / 60) * 100;
  updateProgressRing(percent);

  // Change color when time is running out
  if (timeLeft <= 10) {
    timerDisplay.style.color = "#ff4444";
    progressCircle.style.stroke = "#ff4444";
    timerDisplay.classList.add("low-time");
  } else {
    timerDisplay.style.color = "";
    progressCircle.style.stroke = "";
    timerDisplay.classList.remove("low-time");
  }
}

function gameLoop() {
  if (!isGameActive) return;

  if (isEndless) return;

  if (countdownInterval === null) {
    countdownInterval = setInterval(() => {
      if (isGameActive && timeLeft > 0) {
        timeLeft--;
        updateTimer();

        if (timeLeft === 0) {
          endGame();
        }
      }
    }, 1000);
  }
}

function endGame() {
  isGameActive = false;
  isPaused = false;
  isCountingDown = false;
  clearInterval(gameInterval);
  clearTimeout(moleInterval);
  clearInterval(countdownInterval);
  countdownInterval = null;
  countdownOverlay?.classList.remove("show");

  // Hide all moles
  holes.forEach((hole) => {
    hole.classList.remove("up");
  });

  // Reset button
  startBtn.innerHTML = '<span class="btn-icon">▶</span>START GAME';
  startBtn.style.background =
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  // Show game over modal
  showGameOverModal();
  playSound("end");
}

function showGameOverModal() {
  finalScoreDisplay.textContent = score;

  const totalAttempts = hits + misses;
  const accuracy =
    totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;
  accuracyDisplay.textContent = accuracy + "%";
  bestStreakDisplay.textContent = bestStreak;

  // Determine achievement
  let achievement = "";
  if (score >= 500) {
    achievement = "🏆 LEGENDARY WHACKER!";
  } else if (score >= 300) {
    achievement = "⭐ MASTER WHACKER!";
  } else if (score >= 200) {
    achievement = "🎯 EXPERT WHACKER!";
  } else if (score >= 100) {
    achievement = "👍 SKILLED WHACKER!";
  } else if (score >= 50) {
    achievement = "🌟 DECENT WHACKER!";
  } else {
    achievement = "💪 KEEP PRACTICING!";
  }

  achievementDisplay.textContent = achievement;
  achievementDisplay.classList.add("show");

  gameOverModal.classList.add("show");

  // Submit to leaderboard if consent is granted
  submitScoreToFirestore();

  // Confetti effect if high score
  if (score === highScore && score > 0) {
    createConfetti();
  }
}

function playAgain() {
  gameOverModal.classList.remove("show");
  achievementDisplay.classList.remove("show");
  resetGame();
  setTimeout(() => {
    startGame();
  }, 100);
}

function resetGame() {
  isGameActive = false;
  isPaused = false;
<<<<<<< HEAD
  isCountingDown = false;
=======
>>>>>>> origin/main
  score = 0;
  timeLeft = isEndless ? Infinity : 60;
  hits = 0;
  misses = 0;
  currentStreak = 0;
  bestStreak = 0;

  clearInterval(gameInterval);
  clearTimeout(moleInterval);
  clearInterval(countdownInterval);
  countdownInterval = null;
  countdownOverlay?.classList.remove("show");

  updateScore();
  updateTimer();
  updateStreak();

  holes.forEach((hole) => {
    hole.classList.remove("up");
  });

  startBtn.innerHTML = '<span class="btn-icon">▶</span>START GAME';
  startBtn.style.background =
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  difficultySelector.classList.remove("hidden");
  gameBoard.classList.add("disabled");
}

function resumeGame() {
  isPaused = false;
  isGameActive = true;
  startBtn.textContent = "⏸ PAUSE";
  startBtn.style.background =
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
  gameInterval = setInterval(gameLoop, 100);
  startMoleSpawning();
}

// Visual Effects
function effectsDisabled() {
  return performanceMode || reducedMotion;
}

function createScorePopup(event, points, isGolden) {
  if (effectsDisabled()) return;
  const popup = document.createElement("div");
  popup.className = "score-popup";
  popup.textContent = `+${points}`;
  popup.style.left = event.pageX + "px";
  popup.style.top = event.pageY + "px";

  if (isGolden) {
    popup.style.color = "#ffd700";
    popup.style.fontSize = "2.5rem";
  }

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 1000);
}

function createParticles(event, emoji) {
  if (effectsDisabled() || !particlesContainer) return;
  const particleCount = 8;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.textContent = emoji;

    const angle = (360 / particleCount) * i;
    const velocity = 50 + Math.random() * 50;
    const rad = angle * (Math.PI / 180);

    particle.style.left = event.pageX + "px";
    particle.style.top = event.pageY + "px";

    const tx = Math.cos(rad) * velocity;
    const ty = Math.sin(rad) * velocity;

    particle.style.setProperty("--tx", tx + "px");
    particle.style.setProperty("--ty", ty + "px");

    particlesContainer.appendChild(particle);

    // Update animation
    particle.style.animation = "none";
    setTimeout(() => {
      particle.style.animation = "particleBurst 0.8s ease-out forwards";
    }, 10);

    setTimeout(() => {
      particle.remove();
    }, 800);
  }
}

// Add particle burst animation
const particleStyle = document.createElement("style");
particleStyle.textContent = `
    @keyframes particleBurst {
        0% {
            opacity: 1;
            transform: translate(0, 0) scale(1) rotate(0deg);
        }
        100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0.3) rotate(360deg);
        }
    }
`;
document.head.appendChild(particleStyle);

function shakeScreen() {
  if (effectsDisabled()) return;
  document.body.style.animation = "none";
  setTimeout(() => {
    document.body.style.animation = "screenShake 0.2s ease";
  }, 10);
}

// Add screen shake animation
const shakeScreenStyle = document.createElement("style");
shakeScreenStyle.textContent = `
    @keyframes screenShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(shakeScreenStyle);

function createConfetti() {
  if (effectsDisabled() || !particlesContainer) return;
  const confettiCount = 100;
  const confettiEmojis = ["🎉", "🎊", "⭐", "✨", "💫", "🌟"];

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div");
    confetti.className = "particle";
    confetti.textContent =
      confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];

    confetti.style.left = Math.random() * window.innerWidth + "px";
    confetti.style.top = "-50px";
    confetti.style.fontSize = Math.random() * 1.5 + 1 + "rem";

    particlesContainer.appendChild(confetti);

    const fallDuration = Math.random() * 3 + 2;
    const sway = Math.random() * 200 - 100;

    confetti.style.animation = "none";
    setTimeout(() => {
      confetti.style.animation = `confettiFall ${fallDuration}s linear forwards`;
      confetti.style.setProperty("--sway", sway + "px");
    }, Math.random() * 500);

    setTimeout(() => {
      confetti.remove();
    }, (fallDuration + 0.5) * 1000);
  }
}

// Add confetti animation
const confettiStyle = document.createElement("style");
confettiStyle.textContent = `
    @keyframes confettiFall {
        0% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0deg);
        }
        100% {
            opacity: 0.5;
            transform: translateY(100vh) translateX(var(--sway)) rotate(720deg);
        }
    }
`;
document.head.appendChild(confettiStyle);

// Keyboard Controls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (helpModal?.classList.contains("show")) return;
    if (!isGameActive && !difficultySelector.classList.contains("hidden")) {
      // Don't start if difficulty not selected
      return;
    }
    if (!gameOverModal.classList.contains("show")) {
      startBtn.click();
    }
  }

  if (e.code === "KeyR") {
    resetBtn.click();
  }

  if (e.key === "Escape" && helpModal?.classList.contains("show")) {
    closeHelp();
  }
});

// Add hover sound effect (visual)
holes.forEach((hole) => {
  const mole = hole.querySelector(".mole");
  mole.addEventListener("mouseenter", () => {
    if (hole.classList.contains("up") && isGameActive) {
      mole.style.transform = "scale(1.1)";
    }
  });

  mole.addEventListener("mouseleave", () => {
    mole.style.transform = "";
  });
});

// Performance optimization: Disable animations when tab is not visible
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isGameActive) {
    pauseGame();
  }
});

// Add touch support for mobile
holes.forEach((hole) => {
  hole.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (isGameActive && hole.classList.contains("up")) {
      const touch = e.touches[0];
      const simulatedEvent = {
        pageX: touch.pageX,
        pageY: touch.pageY,
      };
      whackMole(hole, simulatedEvent);
    }
  });
});

// Easter egg: Konami code for bonus points
let konamiCode = [];
const konamiSequence = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

document.addEventListener("keydown", (e) => {
  konamiCode.push(e.code);

  if (konamiCode.length > konamiSequence.length) {
    konamiCode.shift();
  }

  if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
    if (isGameActive) {
      score += 100;
      updateScore();

      // Create special effect
      const center = {
        pageX: window.innerWidth / 2,
        pageY: window.innerHeight / 2,
      };
      createScorePopup(center, 100, true);
      createParticles(center, "🎮");

      konamiCode = [];
    }
  }
});

console.log("🎮 Whack-A-Mole Pro Edition loaded!");
console.log("💡 Tip: Try the Konami code for a bonus! ⬆️⬆️⬇️⬇️⬅️➡️⬅️➡️BA");

// Leaderboard integration (consent-gated)
async function submitScoreToFirestore() {
  try {
    const name =
      (
        playerNameInput?.value ||
        localStorage.getItem("playerName") ||
        "Anonymous"
      )
        .trim()
        .slice(0, 20) || "Anonymous";

    const totalAttempts = hits + misses;
    const accuracy =
      totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;

    const entry = {
      name,
      score,
      bestStreak,
      accuracy,
      difficulty,
      createdAt: Date.now(),
    };

    const canUseCloud = window.db && window.hasConsent && window.hasConsent();

    if (!canUseCloud) {
      saveLocalScore(entry);
      renderLocalLeaderboard();
      return;
    }

    // eslint-disable-next-line no-undef
    entry.createdAt = firebase.firestore.FieldValue.serverTimestamp();

    await window.db.collection("scores").add(entry);
    loadLeaderboard();
  } catch (e) {
    console.error("Score save failed:", e);
    saveLocalScore({
      name: "Offline",
      score,
      bestStreak,
      accuracy:
        hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0,
      difficulty,
      createdAt: Date.now(),
    });
    renderLocalLeaderboard();
  }
}

async function loadLeaderboard(forceRetry = false) {
  try {
    const canUseCloud = window.db && window.hasConsent && window.hasConsent();
    if (!canUseCloud) {
      renderLocalLeaderboard(
        forceRetry
          ? "Still offline or cookies declined — showing local scores."
          : "Cookies declined/offline — showing local scores only."
      );
      return;
    }
    if (!leaderboardList) return;

    const snap = await window.db
      .collection("scores")
      .orderBy("score", "desc")
      .limit(10)
      .get();

    leaderboardList.innerHTML = "";
    let rank = 1;
    snap.forEach((doc) => {
      const s = doc.data();
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.style.padding = "10px 12px";
      li.style.border = "1px solid rgba(255,255,255,.12)";
      li.style.borderRadius = "12px";
      li.style.background = "rgba(255,255,255,.05)";
      li.innerHTML = `
        <span style="opacity:.8;">#${rank} — ${escapeHtml(
        s.name || "Anonymous"
      )}</span>
        <strong style="letter-spacing:.5px;">${s.score ?? 0}</strong>
      `;
      leaderboardList.appendChild(li);
      rank++;
    });
    updateLeaderboardEmpty(snap.empty);
    setLeaderboardMessage(
      snap.empty
        ? "No scores yet. Play to be first on the board!"
        : "Global leaderboard (enable cookies and online access)."
    );
    setLeaderboardNote("Online leaderboard (requires cookies)");
  } catch (e) {
    console.error("Leaderboard load failed:", e);
    renderLocalLeaderboard("Offline fallback — local scores only.");
  }
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c])
  );
}

function saveLocalScore(entry) {
  const list = getLocalScores();
  list.push(entry);
  list.sort((a, b) => (b.score || 0) - (a.score || 0));
  localStorage.setItem("wamLocalScores", JSON.stringify(list.slice(0, 10)));
}

function getLocalScores() {
  try {
    return JSON.parse(localStorage.getItem("wamLocalScores")) || [];
  } catch (_) {
    return [];
  }
}

function renderLocalLeaderboard(noteText = "") {
  if (!leaderboardList) return;
  const list = getLocalScores();
  leaderboardList.innerHTML = "";
  let rank = 1;
  list.forEach((s) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.padding = "10px 12px";
    li.style.border = "1px solid rgba(255,255,255,.12)";
    li.style.borderRadius = "12px";
    li.style.background = "rgba(255,255,255,.05)";
    li.innerHTML = `
      <span style="opacity:.8;">#${rank} — ${escapeHtml(
        s.name || "Anonymous"
      )}</span>
      <strong style="letter-spacing:.5px;">${s.score ?? 0}</strong>
    `;
    leaderboardList.appendChild(li);
    rank++;
  });
  if (list.length === 0) {
    setLeaderboardMessage("No local scores yet. Play a round to add one!");
  }
  updateLeaderboardEmpty(list.length === 0);
  setLeaderboardNote(
    noteText || "Local scores only (enable cookies for global leaderboard)."
  );
}

function updateLeaderboardEmpty(isEmpty) {
  if (!leaderboardEmpty) return;
  leaderboardEmpty.style.display = isEmpty ? "block" : "none";
}

function setLeaderboardNote(text) {
  if (!leaderboardNote) return;
  leaderboardNote.textContent = text || "";
}

function setLeaderboardMessage(text) {
  if (!leaderboardEmpty) return;
  leaderboardEmpty.textContent = text;
}
