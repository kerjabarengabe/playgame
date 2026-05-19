let score = 0;
let time = 60;
let timer = null;
let move = 0;

let firstGuess = '';
let secondGuess = '';
let count = 0;
let previousTarget = null;
let delay = 1000;

const beepSound = new Audio("beep.mp3");
beepSound.volume = 0.3;
function playBeep() {
  beepSound.pause();
  beepSound.currentTime = 0;
  beepSound.play().catch(() => {});
}
const game = document.getElementById('game');
const grid = document.createElement('section');
grid.classList.add('grid');
game.appendChild(grid);

// ================= UI =================
function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("time").textContent = time;
}

function showOverlay(title) {
  document.getElementById("overlayTitle").textContent = title;
  document.getElementById("overlay").classList.remove("hidden");
}

function hideOverlay() {
  document.getElementById("overlay").classList.add("hidden");
}

function updateOverlayStats() {
  document.getElementById("finalScore").textContent = score;
  document.getElementById("finalMoves").textContent = move;
}

// ================= TIMER =================
function startTimer() {
  clearInterval(timer);

  timer = setInterval(() => {
    time--;
    updateUI();

    if (time <= 0) {
      clearInterval(timer);
      updateOverlayStats();
      showOverlay("Game Over");
    }
  }, 1000);
}

// ================= GAME DATA =================
const cardsArray = [
  { name: 'shell', img: 'img/blueshell.png' },
  { name: 'star', img: 'img/star.png' },
  { name: 'bobomb', img: 'img/bobomb.png' },
  { name: 'mario', img: 'img/mario.png' },
  { name: 'luigi', img: 'img/luigi.png' },
  { name: 'peach', img: 'img/peach.png' },
  { name: '1up', img: 'img/1up.png' },
  { name: 'mushroom', img: 'img/mushroom.png' },
  { name: 'thwomp', img: 'img/thwomp.png' },
  { name: 'bulletbill', img: 'img/bulletbill.png' },
  { name: 'coin', img: 'img/coin.png' },
  { name: 'goomba', img: 'img/goomba.png' },
];

let gameGrid = [];

// ================= BUILD GRID =================
function buildGrid() {
  grid.innerHTML = "";

  gameGrid = cardsArray
    .concat(cardsArray)
    .sort(() => 0.5 - Math.random());

  gameGrid.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.name = item.name;

    const front = document.createElement('div');
    front.classList.add('front');

    const back = document.createElement('div');
    back.classList.add('back');
    back.style.backgroundImage = `url(${item.img})`;

    card.appendChild(front);
    card.appendChild(back);
    grid.appendChild(card);
  });
}

// ================= RESET GAME =================
function resetGame() {
  score = 0;
  time = 60;
  move = 0;

  firstGuess = '';
  secondGuess = '';
  count = 0;
  previousTarget = null;

  clearInterval(timer);

  updateUI();
  hideOverlay();

  buildGrid();
  startTimer();
}

// ================= MATCH =================
function match() {
  const selected = document.querySelectorAll('.selected');

  selected.forEach(card => {
    card.classList.add('match');
    card.classList.remove('selected');
  });

  score += 10;
  updateUI();

  // WIN CHECK (SAFE)
  const totalPairs = cardsArray.length;
  const matchedPairs = document.querySelectorAll('.match').length / 2;

  if (matchedPairs === totalPairs) {
    clearInterval(timer);
    updateOverlayStats();

    setTimeout(() => {
      showOverlay("You Win!");
    }, 200);
  }
}

// ================= RESET GUESS =================
function resetGuesses() {
  firstGuess = '';
  secondGuess = '';
  count = 0;
  previousTarget = null;

  document.querySelectorAll('.selected').forEach(card => {
    card.classList.remove('selected');
  });
}
// ================= CLICK LOGIC =================
grid.addEventListener('click', event => {
  const clicked = event.target;

  if (
    clicked.nodeName === 'SECTION' ||
    clicked.parentNode.classList.contains('selected') ||
    clicked.parentNode.classList.contains('match')
  ) {
    return;
  }

  if (count < 2) {
    count++;
    clicked.parentNode.classList.add('selected');
    playBeep(); 
    if (count === 1) {
      firstGuess = clicked.parentNode.dataset.name;
    } else {
      secondGuess = clicked.parentNode.dataset.name;
      move++; // ✅ FIX: move hanya saat pair selesai
      updateUI();
    }

    if (count === 2) {
      if (firstGuess === secondGuess) {
        setTimeout(() => {
          match();
          resetGuesses();
        }, delay);
      } else {
        setTimeout(resetGuesses, delay);
      }
    }

    previousTarget = clicked;
  }
});

// ================= EXIT =================
function exitGame() {
  window.chrome.webview.postMessage("exit");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.chrome.webview.postMessage("exit");
  }
});

const BASE_W = 900;
const BASE_H = 1440;

function getVW() {
  return window.visualViewport?.width || window.innerWidth;
}

function getVH() {
  return window.visualViewport?.height || window.innerHeight;
}

function scaleGame() {
  const wrapper = document.getElementById("game-wrapper");
  if (!wrapper) return;

  const vw = window.visualViewport?.width || window.innerWidth;
  const vh = window.visualViewport?.height || window.innerHeight;

  const scale = Math.min(vw / BASE_W, vh / BASE_H);

  wrapper.style.transform =
    `translate(-50%, -50%) scale(${scale})`;
}

function initArcadeMode() {
  scaleGame();

  const safeScale = () => requestAnimationFrame(scaleGame);

  window.addEventListener("resize", safeScale);
  window.addEventListener("orientationchange", () => {
    setTimeout(safeScale, 150);
  });

  window.visualViewport?.addEventListener("resize", safeScale);
}

function goFullscreen() {
  const elem = document.documentElement;

  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}
document.addEventListener("click", () => {
  goFullscreen();
  initArcadeMode();
}, { once: true });
document.addEventListener("fullscreenchange", () => {
  setTimeout(() => {
    requestAnimationFrame(scaleGame);
  }, 50);
});

// ================= START =================
buildGrid();
updateUI();
startTimer();
