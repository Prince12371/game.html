const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}); // for responsiveness

const countEl = document.getElementById("count");
const targetTotalEl = document.getElementById("target-total");
const stageDisplay = document.getElementById("stage-display");
const stageAlert = document.getElementById("stage-alert");
const healthContainer = document.getElementById("boss-health-container");
const healthFill = document.getElementById("boss-health-fill");

let gameState = "start";
let bgColor = "#00050a";
let currentKills = 0;
let autoFireInterval;

let stars = Array.from({ length: 150 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  s: Math.random() * 2 + 0.5,
}));

const player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  bullets: [],
  color: "#00d4ff",
};

let asteroids = [];
let boss = {
  x: canvas.width / 2,
  y: -300,
  hp: 300,
  maxHp: 300,
  active: false,
  dir: 1,
  bullets: [],
  lastShot: 0,
  mode: "enter",
  lastModeChange: 0,
};

function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    let msg = new SpeechSynthesisUtterance(text);
    msg.rate = 1.0;
    msg.pitch = 0.8;
    window.speechSynthesis.speak(msg);
  }
}

// --- INPUT CONTROLS ---
const activeGameplayStates = [
  "stage1",
  "stage2",
  "boss",
  "stage_transition",
  "boss_transition",
];

window.addEventListener("mousemove", (e) => {
  if (activeGameplayStates.includes(gameState)) {
    player.x = e.clientX;
    player.y = e.clientY;
  }
});

window.addEventListener(
  "touchmove",
  (e) => {
    if (activeGameplayStates.includes(gameState)) {
      player.x = e.touches[0].clientX;
      player.y = e.touches[0].clientY;
      e.preventDefault();
    }
  },
  { passive: false },
);

//   (e) => {
//     if (activeGameplayStates.includes(gameState)) {
//       player.x = e.touches[0].clientX;
//       player.y = e.touches[0].clientY;
//       e.preventDefault();
//     }
//   },
//   { passive: false },
// );

window.addEventListener(
  "touchstart",
  (e) => {
    if (activeGameplayStates.includes(gameState)) {
      player.x = e.touches[0].clientX;
      player.y = e.touches[0].clientY;
    }
  },
  { passive: false },
);

// --- MENU ACTIONS ---
function goHome() {
  location.reload();
}

function restartGame() {
  document.getElementById("lose-screen").style.display = "none";
  document.getElementById("win-screen").style.display = "none";

  clearInterval(autoFireInterval);
  currentKills = 0;
  asteroids = [];
  player.bullets = [];
  boss.active = false;
  boss.hp = boss.maxHp;
  boss.bullets = [];

  countEl.innerText = "0";
  targetTotalEl.innerText = "15";
  stageDisplay.innerText = "1";
  healthContainer.style.display = "none";
  bgColor = "#00050a";

  player.x = canvas.width / 2;
  player.y = canvas.height - 100;

  startGame();
}

function startGame() {
  document.getElementById("start-screen").style.display = "none";
  // THE FIX: Show the HUD only when the game starts
  document.getElementById("hud").style.display = "block";

  gameState = "stage_transition";
  player.color = "#00d4ff";

  speak("Ready for Stage 1");
  stageAlert.innerText = "GET READY... STAGE 1";
  stageAlert.style.color = "#00d4ff";
  stageAlert.style.opacity = "1";

  setTimeout(() => {
    stageAlert.style.opacity = "0";
    setTimeout(() => {
      gameState = "stage1";
    }, 500);
  }, 2500);

  autoFireInterval = setInterval(() => {
    if (["stage1", "stage2", "boss"].includes(gameState)) {
      player.bullets.push({ x: player.x, y: player.y - 30 });
    }
  }, 120);
}

function startStage2() {
  gameState = "stage_transition";
  asteroids = [];
  player.bullets = [];
  player.color = "#ff00ff";

  speak("Stage 1 completed. Stage 2.");

  setTimeout(() => {
    stageAlert.innerText = "GET READY... STAGE 2";
    stageAlert.style.color = "#ff00ff";
    stageAlert.style.textShadow = "0 0 20px #ff00ff";
    stageAlert.style.opacity = "1";

    setTimeout(() => {
      stageAlert.style.opacity = "0";

      setTimeout(() => {
        currentKills = 0;
        countEl.innerText = "0";
        targetTotalEl.innerText = "20";
        stageDisplay.innerText = "2";
        gameState = "stage2";
      }, 500);
    }, 3000);
  }, 1500);
}

function startBoss() {
  gameState = "boss_transition";
  asteroids = [];
  player.bullets = [];
  player.color = "#00ff00";

  speak("Stage 2 completed. Warning. Boss is coming.");

  setTimeout(() => {
    bgColor = "#150000";
    document.getElementById("ui").style.display = "flex";
    document.getElementById("msg").style.opacity = "1";
    document.getElementById("hud").style.display = "none";

    setTimeout(() => {
      document.getElementById("ui").style.display = "none";
      boss.active = true;
      boss.y = -100;
      boss.mode = "enter";
      gameState = "boss";
      healthContainer.style.display = "block";
    }, 6000);
  }, 1500);
}

// MAIN ENGINE LOOP
function update() {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  stars.forEach((s) => {
    s.y += s.s;
    if (s.y > canvas.height) s.y = 0;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  });

  if (activeGameplayStates.includes(gameState)) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 25);
    ctx.lineTo(player.x - 18, player.y + 15);
    ctx.lineTo(player.x, player.y + 5);
    ctx.lineTo(player.x + 18, player.y + 15);
    ctx.closePath();
    ctx.fill();

    for (let i = player.bullets.length - 1; i >= 0; i--) {
      let b = player.bullets[i];
      b.y -= 15;
      ctx.shadowBlur = 10;
      ctx.shadowColor = player.color;
      ctx.fillStyle = "#fff";
      ctx.fillRect(b.x - 2, b.y, 4, 15);
      ctx.shadowBlur = 0;
      if (b.y < 0) player.bullets.splice(i, 1);
    }

    if (gameState === "stage1" || gameState === "stage2") {
      if (asteroids.length < (gameState === "stage1" ? 5 : 8)) {
        asteroids.push({
          x: Math.random() * canvas.width,
          y: -50,
          size: 40 + Math.random() * 30,
          speed: gameState === "stage2" ? 5 : 3,
          hp: gameState === "stage2" ? 3 : 1,
          flash: 0,
          color: gameState === "stage2" ? "#552200" : "#333",
        });
      }

      for (let i = asteroids.length - 1; i >= 0; i--) {
        let ast = asteroids[i];
        ast.y += ast.speed;

        if (
          Math.hypot(player.x - ast.x, player.y - ast.y) <
          ast.size / 2 + 10
        ) {
          gameState = "lose";
          speak("Game Over");
          document.getElementById("lose-screen").style.display = "flex";
          requestAnimationFrame(update);
          return;
        }

        ctx.fillStyle = ast.flash > 0 ? "#fff" : ast.color;
        if (ast.flash > 0) ast.flash--;
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.size / 2, 0, Math.PI * 2);
        ctx.fill();

        for (let j = player.bullets.length - 1; j >= 0; j--) {
          let b = player.bullets[j];

          if (Math.hypot(b.x - ast.x, b.y - ast.y) < ast.size / 2) {
            player.bullets.splice(j, 1);
            ast.hp--;
            ast.flash = 5;

            if (ast.hp <= 0) {
              asteroids.splice(i, 1);
              currentKills++;
              countEl.innerText = currentKills;

              if (gameState === "stage1" && currentKills >= 15) {
                startStage2();
                requestAnimationFrame(update);
                return;
              } else if (gameState === "stage2" && currentKills >= 20) {
                startBoss();
                requestAnimationFrame(update);
                return;
              }
            }
            break;
          }
        }
        if (ast.y > canvas.height + 50) asteroids.splice(i, 1);
      }
    }

    if (gameState === "boss" && boss.active) {
      let now = Date.now();

      if (boss.mode === "enter") {
        boss.y += 2;
        if (boss.y >= 100) {
          boss.y = 100;
          boss.mode = "sweep";
          boss.lastModeChange = now;
        }
      } else {
        let timeInMode = now - boss.lastModeChange;

        let speedX = 4 + (1 - boss.hp / boss.maxHp) * 6;
        boss.x += speedX * boss.dir;
        if (boss.x > canvas.width - 120 || boss.x < 120) boss.dir *= -1;

        if (boss.mode === "sweep") {
          if (boss.y > 100) boss.y -= 5;
          else boss.y = 100;

          if (timeInMode > 3500) {
            boss.mode = "swoop";
            boss.lastModeChange = now;
          }
        } else if (boss.mode === "swoop") {
          let speedY = 3 + (1 - boss.hp / boss.maxHp) * 3.5;
          if (boss.y < player.y - 20) boss.y += speedY;
          else if (boss.y > player.y + 20) boss.y -= speedY;

          if (timeInMode > 2000) {
            boss.mode = "sweep";
            boss.lastModeChange = now;
          }
        }
      }

      if (now - boss.lastShot > 800) {
        boss.bullets.push({ x: boss.x, y: boss.y + 50 });
        boss.lastShot = now;
      }

      for (let i = boss.bullets.length - 1; i >= 0; i--) {
        let bb = boss.bullets[i];
        bb.y += 8;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "red";
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(bb.x, bb.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (Math.hypot(player.x - bb.x, player.y - bb.y) < 20) {
          gameState = "lose";
          speak("Game Over");
          document.getElementById("lose-screen").style.display = "flex";
          requestAnimationFrame(update);
          return;
        }
        if (bb.y > canvas.height) boss.bullets.splice(i, 1);
      }

      ctx.shadowBlur = 40;
      ctx.shadowColor = "red";
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, 90, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, 35 + Math.sin(now / 100) * 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (Math.hypot(player.x - boss.x, player.y - boss.y) < 110) {
        gameState = "lose";
        speak("Game Over");
        document.getElementById("lose-screen").style.display = "flex";
        requestAnimationFrame(update);
        return;
      }

      for (let j = player.bullets.length - 1; j >= 0; j--) {
        let b = player.bullets[j];
        if (Math.hypot(b.x - boss.x, b.y - boss.y) < 90) {
          boss.hp--;
          player.bullets.splice(j, 1);
          healthFill.style.width = (boss.hp / boss.maxHp) * 100 + "%";

          if (boss.hp <= 0) {
            gameState = "win";
            speak("Congratulations, you defeated the boss.");
            document.getElementById("win-screen").style.display = "flex";
            requestAnimationFrame(update);
            return;
          }
        }
      }
    }
  }

  requestAnimationFrame(update);
}

update();
