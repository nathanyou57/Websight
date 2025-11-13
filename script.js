// Game State
let score = 0;
let highScore = localStorage.getItem("whackHighScore") || 0;
let timeLeft = 60;
let gameInterval = null;
let moleInterval = null;
let countdownInterval = null;
let isGameActive = false;
let difficulty = "medium";
let hits = 0;
let misses = 0;
let currentStreak = 0;
let bestStreak = 0;

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

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  highscoreDisplay.textContent = highScore;
  setupEventListeners();
  initializeProgressRing();

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

  // Leaderboard load on consent
  if (window.hasConsent && window.hasConsent() && window.db) {
    loadLeaderboard();
  }
  window.addEventListener("consent-changed", () => {
    if (window.hasConsent && window.hasConsent() && window.db) {
      loadLeaderboard();
    }
  });
});

// Progress Ring Setup
function initializeProgressRing() {
  const radius = progressCircle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  progressCircle.style.strokeDashoffset = 0;
}

function updateProgressRing(percent) {
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

// Game Functions
function startGame() {
  if (difficultySelector.classList.contains("hidden")) {
    if (!isGameActive) {
      isGameActive = true;
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
      pauseGame();
    }
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

function pauseGame() {
  isGameActive = false;
  clearInterval(gameInterval);
  clearInterval(moleInterval);
  clearInterval(countdownInterval);
  startBtn.innerHTML = '<span class="btn-icon">▶</span>RESUME';
  startBtn.style.background =
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
}

function startMoleSpawning() {
  const settings = difficultySettings[difficulty];
  moleInterval = setInterval(() => {
    if (isGameActive) {
      showRandomMole();
    }
  }, settings.spawnInterval);
}

function showRandomMole() {
  const settings = difficultySettings[difficulty];
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

  setTimeout(() => {
    randomHole.classList.remove("up");
    const moleHead = randomHole.querySelector(".mole-head");
    if (moleHead.classList.contains("golden")) {
      moleHead.style.background =
        "linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)";
      moleHead.classList.remove("golden");
    }
  }, settings.moleShowTime);
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
  timerDisplay.textContent = timeLeft;
  const percent = (timeLeft / 60) * 100;
  updateProgressRing(percent);

  // Change color when time is running out
  if (timeLeft <= 10) {
    timerDisplay.style.color = "#ff4444";
    progressCircle.style.stroke = "#ff4444";
  } else {
    timerDisplay.style.color = "";
    progressCircle.style.stroke = "";
  }
}

function gameLoop() {
  if (!isGameActive) return;

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
  clearInterval(gameInterval);
  clearInterval(moleInterval);
  clearInterval(countdownInterval);
  countdownInterval = null;

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
  score = 0;
  timeLeft = 60;
  hits = 0;
  misses = 0;
  currentStreak = 0;
  bestStreak = 0;

  clearInterval(gameInterval);
  clearInterval(moleInterval);
  clearInterval(countdownInterval);
  countdownInterval = null;

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

// Visual Effects
function createScorePopup(event, points, isGolden) {
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
    if (!window.db || !window.hasConsent || !window.hasConsent()) return;

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

    const data = {
      name,
      score,
      bestStreak,
      accuracy,
      difficulty,
      // eslint-disable-next-line no-undef
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await window.db.collection("scores").add(data);
    loadLeaderboard();
  } catch (e) {
    console.error("Score save failed:", e);
  }
}

async function loadLeaderboard() {
  try {
    if (!window.db || !window.hasConsent || !window.hasConsent()) {
      if (leaderboardEmpty) leaderboardEmpty.style.display = "block";
      return;
    }
    if (leaderboardEmpty) leaderboardEmpty.style.display = "none";
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
  } catch (e) {
    console.error("Leaderboard load failed:", e);
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
