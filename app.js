/* ===================================
   Valentine's Labyrinth Game
   Pure Vanilla JavaScript
   =================================== */

// ===================================
// Configuration
// ===================================
const DIFFICULTY_CONFIG = {
  easy: { width: 9, height: 9, cellSize: 32 },
  medium: { width: 13, height: 13, cellSize: 28 },
  hard: { width: 17, height: 17, cellSize: 24 }
};

// ===================================
// State Management
// ===================================
const state = {
  currentScene: 'intro',
  difficulty: 'easy',
  maze: [],
  playerPos: { x: 1, y: 1 },
  moveCount: 0,
  hasWon: false,
  noClickCount: 0,
  isMuted: false,
  audioInitialized: false,
  audioContext: null
};

// ===================================
// DOM Elements
// ===================================
const elements = {
  // Scenes
  introScene: document.getElementById('intro-scene'),
  transitionScene: document.getElementById('transition-scene'),
  gameScene: document.getElementById('game-scene'),
  winScene: document.getElementById('win-scene'),
  
  // Buttons
  yesBtn: document.getElementById('yes-btn'),
  noBtn: document.getElementById('no-btn'),
  muteBtn: document.getElementById('mute-btn'),
  muteIcon: document.getElementById('mute-icon'),
  newMazeBtn: document.getElementById('new-maze-btn'),
  playAgainBtn: document.getElementById('play-again-btn'),
  
  // Game elements
  mazeContainer: document.getElementById('maze-container'),
  moveCount: document.getElementById('move-count'),
  finalMoves: document.getElementById('final-moves'),
  difficultyBtns: document.querySelectorAll('.difficulty-btn'),
  controlBtns: document.querySelectorAll('.btn-control'),
  
  // Effects
  floatingHearts: document.getElementById('floating-hearts'),
  heartBurst: document.getElementById('heart-burst'),
  glowEffect: document.getElementById('glow-effect'),
  teddyBear: document.getElementById('teddy-bear')
};

// ===================================
// Sound System (Web Audio API)
// ===================================
const SoundSystem = {
  init() {
    if (state.audioInitialized) return;
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    state.audioInitialized = true;
  },

  play(type) {
    if (state.isMuted || !state.audioContext) return;
    
    const ctx = state.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    switch (type) {
      case 'chime':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialDecayTo && gainNode.gain.exponentialDecayTo(0.01, now + 0.5);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
        
      case 'click':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, now);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;
        
      case 'win':
        oscillator.type = 'sine';
        [523.25, 587.33, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          oscillator.frequency.setValueAtTime(freq, now + i * 0.12);
        });
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.8);
        oscillator.start(now);
        oscillator.stop(now + 0.8);
        break;
        
      case 'love':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.linearRampToValueAtTime(880, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;
    }
  },

  toggleMute() {
    state.isMuted = !state.isMuted;
    elements.muteIcon.textContent = state.isMuted ? '🔇' : '🔊';
  }
};

// ===================================
// Maze Generation (Recursive Backtracking)
// ===================================
const MazeGenerator = {
  generate(width, height) {
    // Initialize with all walls
    const maze = Array(height).fill(null).map(() => 
      Array(width).fill(1)
    );
    
    const directions = [
      { dx: 0, dy: -2 }, // up
      { dx: 0, dy: 2 },  // down
      { dx: -2, dy: 0 }, // left
      { dx: 2, dy: 0 }   // right
    ];
    
    const shuffle = (arr) => {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };
    
    const carve = (x, y) => {
      maze[y][x] = 0; // Mark as path
      
      for (const { dx, dy } of shuffle(directions)) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
          maze[y + dy / 2][x + dx / 2] = 0; // Remove wall between
          carve(nx, ny);
        }
      }
    };
    
    // Start carving from (1, 1)
    carve(1, 1);
    
    // Place goal at bottom-right area
    for (let y = height - 2; y > height / 2; y--) {
      for (let x = width - 2; x > width / 2; x--) {
        if (maze[y][x] === 0) {
          maze[y][x] = 2; // Goal
          return maze;
        }
      }
    }
    
    // Fallback
    maze[height - 2][width - 2] = 0;
    maze[height - 2][width - 2] = 2;
    
    return maze;
  }
};

// ===================================
// Visual Effects
// ===================================
const Effects = {
  // Create floating hearts background
  createFloatingHearts() {
    const hearts = ['💕', '💖', '💗', '💓', '💝', '❤️', '🩷'];
    
    for (let i = 0; i < 15; i++) {
      const heart = document.createElement('div');
      heart.className = 'floating-heart';
      heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      heart.style.left = `${Math.random() * 100}%`;
      heart.style.top = `${Math.random() * 100}%`;
      heart.style.fontSize = `${Math.random() * 1.5 + 0.8}rem`;
      heart.style.animationDuration = `${Math.random() * 5 + 5}s`;
      heart.style.animationDelay = `${Math.random() * 5}s`;
      elements.floatingHearts.appendChild(heart);
    }
  },

  // Trigger heart burst animation
  triggerHeartBurst() {
    const hearts = ['💖', '💕', '💗', '💓', '💝'];
    elements.heartBurst.innerHTML = '';
    
    for (let i = 0; i < 12; i++) {
      const heart = document.createElement('div');
      heart.className = 'burst-heart';
      heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      
      const angle = (i / 12) * Math.PI * 2;
      const distance = 100 + Math.random() * 50;
      heart.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
      heart.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
      heart.style.animation = `heartBurst 1s ease-out forwards`;
      heart.style.left = '50%';
      heart.style.top = '50%';
      heart.style.transform = `translate(-50%, -50%)`;
      
      // Custom animation with transform
      heart.animate([
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(1.5)`, opacity: 0 }
      ], {
        duration: 1000,
        easing: 'ease-out',
        fill: 'forwards'
      });
      
      elements.heartBurst.appendChild(heart);
    }
    
    // Clean up after animation
    setTimeout(() => {
      elements.heartBurst.innerHTML = '';
    }, 1200);
  },

  // Show glow effect
  showGlow() {
    elements.glowEffect.classList.remove('hidden');
  },

  // Hide glow effect
  hideGlow() {
    elements.glowEffect.classList.add('hidden');
  }
};

// ===================================
// Scene Management
// ===================================
const SceneManager = {
  show(sceneName) {
    // Hide all scenes
    elements.introScene.classList.add('hidden');
    elements.transitionScene.classList.add('hidden');
    elements.gameScene.classList.add('hidden');
    elements.winScene.classList.add('hidden');
    
    // Show requested scene
    switch (sceneName) {
      case 'intro':
        elements.introScene.classList.remove('hidden');
        break;
      case 'transition':
        elements.transitionScene.classList.remove('hidden');
        break;
      case 'game':
        elements.gameScene.classList.remove('hidden');
        break;
      case 'win':
        elements.winScene.classList.remove('hidden');
        break;
    }
    
    state.currentScene = sceneName;
  }
};

// ===================================
// Game Logic
// ===================================
const Game = {
  init() {
    const config = DIFFICULTY_CONFIG[state.difficulty];
    state.maze = MazeGenerator.generate(config.width, config.height);
    state.playerPos = { x: 1, y: 1 };
    state.moveCount = 0;
    state.hasWon = false;
    this.render();
  },

  render() {
    const config = DIFFICULTY_CONFIG[state.difficulty];
    const { width, height, cellSize } = config;
    
    elements.mazeContainer.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'maze-grid';
    grid.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = document.createElement('div');
        cell.className = 'maze-cell';
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;
        
        const isPlayer = state.playerPos.x === x && state.playerPos.y === y;
        const isGoal = state.maze[y][x] === 2;
        const isWall = state.maze[y][x] === 1;
        
        if (isWall) {
          cell.classList.add('wall');
        } else {
          cell.classList.add('path');
        }
        
        if (isPlayer) {
          cell.classList.add('player');
          cell.textContent = '🧸';
          cell.style.fontSize = `${cellSize * 0.6}px`;
        } else if (isGoal) {
          const heart = document.createElement('span');
          heart.className = 'goal';
          heart.textContent = '💖';
          heart.style.fontSize = `${cellSize * 0.6}px`;
          cell.appendChild(heart);
        }
        
        grid.appendChild(cell);
      }
    }
    
    elements.mazeContainer.appendChild(grid);
    elements.moveCount.textContent = state.moveCount;
  },

  move(dx, dy) {
    if (state.hasWon) return;
    
    const config = DIFFICULTY_CONFIG[state.difficulty];
    const newX = state.playerPos.x + dx;
    const newY = state.playerPos.y + dy;
    
    // Check bounds
    if (newX < 0 || newX >= config.width || newY < 0 || newY >= config.height) return;
    
    // Check wall
    if (state.maze[newY][newX] === 1) return;
    
    // Move player
    SoundSystem.play('click');
    state.playerPos = { x: newX, y: newY };
    state.moveCount++;
    
    // Check win
    if (state.maze[newY][newX] === 2) {
      state.hasWon = true;
      SoundSystem.play('win');
      elements.finalMoves.textContent = state.moveCount;
      
      setTimeout(() => {
        SceneManager.show('win');
      }, 500);
    }
    
    this.render();
  },

  setDifficulty(difficulty) {
    state.difficulty = difficulty;
    
    // Update button states
    elements.difficultyBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
    
    this.init();
  }
};

// ===================================
// Button Handlers
// ===================================
const Handlers = {
  handleYesClick() {
    SoundSystem.init();
    SoundSystem.play('chime');
    
    Effects.triggerHeartBurst();
    Effects.showGlow();
    
    setTimeout(() => {
      SoundSystem.play('love');
    }, 750);
    
    setTimeout(() => {
      SceneManager.show('transition');
    }, 1000);
    
    setTimeout(() => {
      Effects.hideGlow();
      SceneManager.show('game');
      Game.init();
    }, 4500);
  },

  handleNoClick() {
    state.noClickCount++;
    
    const messages = [
      "Non 🙃",
      "Tu es sûre ? 😳",
      "Vraiment ? 🥺",
      "Réfléchis bien ! 💭",
      "S'il te plaît ? 🙏",
      "S'il te plaît, dis oui ? 🥹"
    ];
    
    const btn = elements.noBtn;
    btn.textContent = messages[Math.min(state.noClickCount, messages.length - 1)];
    
    // Shrink button
    const scale = Math.max(0.4, 1 - state.noClickCount * 0.1);
    btn.style.transform = `scale(${scale})`;
    
    // Random position offset
    const offsetX = (Math.random() - 0.5) * 100;
    const offsetY = (Math.random() - 0.5) * 50;
    btn.style.transform = `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`;
    
    // Hide after many clicks
    if (state.noClickCount >= 6) {
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
    }
  },

  handleNoHover() {
    if (state.noClickCount >= 3) {
      const btn = elements.noBtn;
      const offsetX = (Math.random() - 0.5) * 150;
      const offsetY = (Math.random() - 0.5) * 80;
      btn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }
  }
};

// ===================================
// Event Listeners
// ===================================
function setupEventListeners() {
  // Yes/No buttons
  elements.yesBtn.addEventListener('click', Handlers.handleYesClick);
  elements.noBtn.addEventListener('click', Handlers.handleNoClick);
  elements.noBtn.addEventListener('mouseenter', Handlers.handleNoHover);
  
  // Mute button
  elements.muteBtn.addEventListener('click', () => {
    SoundSystem.init();
    SoundSystem.toggleMute();
  });
  
  // Difficulty buttons
  elements.difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      Game.setDifficulty(btn.dataset.difficulty);
    });
  });
  
  // Control buttons
  elements.controlBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir;
      switch (dir) {
        case 'up': Game.move(0, -1); break;
        case 'down': Game.move(0, 1); break;
        case 'left': Game.move(-1, 0); break;
        case 'right': Game.move(1, 0); break;
      }
    });
  });
  
  // New maze button
  elements.newMazeBtn.addEventListener('click', () => Game.init());
  elements.playAgainBtn.addEventListener('click', () => {
    SceneManager.show('game');
    Game.init();
  });
  
  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (state.currentScene !== 'game') return;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        Game.move(0, -1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        Game.move(0, 1);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        Game.move(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        Game.move(1, 0);
        break;
    }
  });
}

// ===================================
// Initialize App
// ===================================
function init() {
  Effects.createFloatingHearts();
  setupEventListeners();
  SceneManager.show('intro');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);