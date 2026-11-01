(() => {
  // --- SOUND EFFECTS (Web Audio API Synthesizer) ---
  class SoundManager {
    constructor() {
      this.enabled = true;
      this.ctx = null;
      const saved = localStorage.getItem('syncclash_sound');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    }

    initCtx() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('syncclash_sound', this.enabled);
      return this.enabled;
    }

    playClick() {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }

    playCountdown() {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    }

    playCorrect() {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.18, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
      });
    }

    playWrong() {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    playFanfare() {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      const notes = [
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.15 },
        { f: 1046.50, d: 0.45 }
      ];
      let t = this.ctx.currentTime;
      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = n.f;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + n.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + n.d);
        t += n.d;
      });
    }
  }

  // --- CONFETTI SYSTEM ---
  class Confetti {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.particles = [];
      this.animationFrame = null;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
    }

    start() {
      if (!this.ctx) return;
      this.resize();
      this.particles = [];
      const colors = ['#6366f1', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ffffff'];
      for (let i = 0; i < 90; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height * 0.4,
          w: Math.random() * 8 + 4,
          h: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 3 + 2,
          rot: Math.random() * 360,
          vrot: (Math.random() - 0.5) * 8
        });
      }
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      this.animate();
    }

    stop() {
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        if (p.y > this.canvas.height) {
          p.y = -10;
          p.x = Math.random() * this.canvas.width;
        }
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rot * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx.restore();
      });
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }
  }

  // --- MAIN APP LOGIC ---
  const socket = io();
  const sound = new SoundManager();
  let confetti = null;

  // Local State
  let selectedAvatar = '👑';
  let myPlayerId = null;
  let currentRoom = null;
  let hasLockedInCurrentQuestion = false;

  // DOM Elements
  const screens = {
    welcome: document.getElementById('screen-welcome'),
    lobby: document.getElementById('screen-lobby'),
    starting: document.getElementById('screen-starting'),
    question: document.getElementById('screen-question'),
    reveal: document.getElementById('screen-reveal'),
    gameover: document.getElementById('screen-gameover')
  };

  const soundToggleBtn = document.getElementById('sound-toggle');
  const rulesBtn = document.getElementById('rules-btn');
  const rulesModal = document.getElementById('rules-modal');
  const closeRulesBtn = document.getElementById('close-rules-btn');
  const rulesGotItBtn = document.getElementById('rules-got-it-btn');
  const toastEl = document.getElementById('toast');
  const reactionsLayer = document.getElementById('reactions-layer');
  const reactionBar = document.getElementById('reaction-bar');

  // Welcome screen DOM
  const avatarSelector = document.getElementById('avatar-selector');
  const playerNameInput = document.getElementById('player-name-input');
  const tabJoin = document.getElementById('tab-join');
  const tabCreate = document.getElementById('tab-create');
  const contentJoin = document.getElementById('content-join');
  const contentCreate = document.getElementById('content-create');
  const roomCodeInput = document.getElementById('room-code-input');
  const joinRoomBtn = document.getElementById('join-room-btn');
  const createRoomBtn = document.getElementById('create-room-btn');
  const categorySelect = document.getElementById('category-select');
  const roundsSelect = document.getElementById('rounds-select');
  const welcomeError = document.getElementById('welcome-error');

  // Lobby screen DOM
  const lobbyRoomCode = document.getElementById('lobby-room-code');
  const copyCodeBtn = document.getElementById('copy-code-btn');
  const lobbyCategoryBadge = document.getElementById('lobby-category-badge');
  const lobbyRoundsBadge = document.getElementById('lobby-rounds-badge');
  const playerCount = document.getElementById('player-count');
  const lobbyPlayersGrid = document.getElementById('lobby-players-grid');
  const hostControls = document.getElementById('host-controls');
  const guestControls = document.getElementById('guest-controls');
  const startGameBtn = document.getElementById('start-game-btn');

  // Starting screen DOM
  const countdownNumber = document.getElementById('countdown-number');

  // Question screen DOM
  const qCurrent = document.getElementById('q-current');
  const qTotal = document.getElementById('q-total');
  const timerBar = document.getElementById('timer-bar');
  const timerText = document.getElementById('timer-text');
  const qCategoryTag = document.getElementById('q-category-tag');
  const qText = document.getElementById('q-text');
  const optionButtons = document.querySelectorAll('.arena-opt-card, .option-btn');
  const submissionStatus = document.getElementById('submission-status');
  const liveTrackerChips = document.getElementById('live-tracker-chips');

  // Reveal screen DOM
  const revealBanner = document.getElementById('reveal-banner');
  const revealStatusIcon = document.getElementById('reveal-status-icon');
  const revealStatusTitle = document.getElementById('reveal-status-title');
  const revealPointsText = document.getElementById('reveal-points-text');
  const revealExplanation = document.getElementById('reveal-explanation');
  const revealCountdown = document.getElementById('reveal-countdown');
  const revealLeaderboard = document.getElementById('reveal-leaderboard');

  // Game over screen DOM
  const podiumWrap = document.getElementById('podium-wrap');
  const finalScoresList = document.getElementById('final-scores-list');
  const playAgainBtn = document.getElementById('play-again-btn');

  // Initialize
  function init() {
    confetti = new Confetti('confetti-canvas');
    updateSoundButtonUI();

    // Check URL parameters for ?room=ABCD
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      roomCodeInput.value = roomParam.toUpperCase().slice(0, 4);
      tabJoin.click();
    }

    // Load saved nickname if available
    const savedName = localStorage.getItem('syncclash_name');
    if (savedName) playerNameInput.value = savedName;

    // Load saved avatar
    const savedAvatar = localStorage.getItem('syncclash_avatar');
    if (savedAvatar) {
      selectedAvatar = savedAvatar;
      avatarSelector.querySelectorAll('.avatar-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.avatar === savedAvatar);
      });
    }

    setupEventListeners();
  }

  function updateSoundButtonUI() {
    soundToggleBtn.innerHTML = sound.enabled ? '🔊' : '🔇';
    soundToggleBtn.title = sound.enabled ? 'Sound On' : 'Sound Muted';
  }

  function showToast(message, duration = 2500) {
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    setTimeout(() => {
      toastEl.classList.add('hidden');
    }, duration);
  }

  function switchScreen(name) {
    Object.keys(screens).forEach(key => {
      if (screens[key]) {
        screens[key].classList.toggle('active', key === name);
      }
    });

    // Control visibility of reaction bar
    if (reactionBar) {
      if (name === 'welcome') {
        reactionBar.classList.add('hidden');
      } else {
        reactionBar.classList.remove('hidden');
      }
    }

    // Stop confetti if leaving gameover
    if (name !== 'gameover' && confetti) {
      confetti.stop();
    }
  }

  function triggerReaction(emoji) {
    if (!reactionsLayer) return;
    const el = document.createElement('div');
    el.className = 'arena-float-reaction';
    el.textContent = emoji;
    el.style.left = `${Math.floor(Math.random() * 70 + 15)}%`;
    reactionsLayer.appendChild(el);
    setTimeout(() => el.remove(), 2300);
  }

  function setupEventListeners() {
    // Sound Toggle
    soundToggleBtn.addEventListener('click', () => {
      const isEnabled = sound.toggle();
      updateSoundButtonUI();
      showToast(isEnabled ? 'Sound unmuted 🔊' : 'Sound muted 🔇');
    });

    // Rules Modal
    rulesBtn.addEventListener('click', () => {
      rulesModal.classList.remove('hidden');
    });
    closeRulesBtn.addEventListener('click', () => {
      rulesModal.classList.add('hidden');
    });
    rulesGotItBtn.addEventListener('click', () => {
      rulesModal.classList.add('hidden');
      sound.playClick();
    });

    // Avatar Selection
    avatarSelector.querySelectorAll('.arena-avatar-btn, .avatar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        avatarSelector.querySelectorAll('.arena-avatar-btn, .avatar-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedAvatar = btn.dataset.avatar;
        localStorage.setItem('syncclash_avatar', selectedAvatar);
        sound.playClick();
      });
    });

    // Mode Tabs
    tabJoin.addEventListener('click', () => {
      tabJoin.classList.add('active');
      tabCreate.classList.remove('active');
      contentJoin.classList.add('active');
      contentCreate.classList.remove('active');
      sound.playClick();
    });

    tabCreate.addEventListener('click', () => {
      tabCreate.classList.add('active');
      tabJoin.classList.remove('active');
      contentCreate.classList.add('active');
      contentJoin.classList.remove('active');
      sound.playClick();
    });

    // Create Room
    createRoomBtn.addEventListener('click', () => {
      sound.initCtx();
      sound.playClick();
      const name = (playerNameInput.value || '').trim() || 'Host';
      localStorage.setItem('syncclash_name', name);
      const category = categorySelect.value;
      const numRounds = roundsSelect.value;

      socket.emit('create_room', {
        name,
        avatar: selectedAvatar,
        category,
        numRounds
      });
    });

    // Join Room
    joinRoomBtn.addEventListener('click', () => {
      sound.initCtx();
      sound.playClick();
      const code = (roomCodeInput.value || '').trim().toUpperCase();
      const name = (playerNameInput.value || '').trim() || 'Player';

      if (!code || code.length < 3) {
        showError('Please enter a valid room code!');
        return;
      }
      localStorage.setItem('syncclash_name', name);

      socket.emit('join_room', {
        code,
        name,
        avatar: selectedAvatar
      }, (response) => {
        if (!response.success) {
          showError(response.message);
        }
      });
    });

    // Copy Room Link
    copyCodeBtn.addEventListener('click', () => {
      sound.playClick();
      if (!currentRoom) return;
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoom.code}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast('📋 Room link copied to clipboard!');
        }).catch(() => {
          showToast(`Room code: ${currentRoom.code}`);
        });
      } else {
        showToast(`Room code: ${currentRoom.code}`);
      }
    });

    // Start Game (Host)
    startGameBtn.addEventListener('click', () => {
      sound.playClick();
      socket.emit('start_game');
    });

    // Submit Answer
    optionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (hasLockedInCurrentQuestion) return;
        if (navigator.vibrate) navigator.vibrate(30);
        sound.initCtx();
        sound.playClick();
        hasLockedInCurrentQuestion = true;

        const answerIndex = parseInt(btn.dataset.index, 10);
        btn.classList.add('selected');

        // Disable other buttons
        optionButtons.forEach(b => {
          if (b !== btn) b.disabled = true;
        });

        submissionStatus.classList.remove('hidden');
        socket.emit('submit_answer', { answerIndex });
      });
    });

    // Floating Reactions Bar
    document.querySelectorAll('.reaction-btn-item, .reaction-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.initCtx();
        sound.playClick();
        const emoji = btn.dataset.emoji;
        triggerReaction(emoji);
        socket.emit('send_reaction', { emoji });
      });
    });

    // Sidebar navigation hooks
    const sideNavRules = document.getElementById('side-nav-rules');
    if (sideNavRules) {
      sideNavRules.addEventListener('click', () => {
        rulesModal.classList.remove('hidden');
      });
    }
    const sideNavArena = document.getElementById('side-nav-arena');
    if (sideNavArena) {
      sideNavArena.addEventListener('click', () => {
        document.getElementById('arena').scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Play Again
    playAgainBtn.addEventListener('click', () => {
      sound.playClick();
      socket.emit('play_again');
    });

    // Nav Logo click to reset/go home if disconnected
    document.getElementById('nav-logo').addEventListener('click', () => {
      if (confirm('Leave current room and return to home screen?')) {
        window.location.href = window.location.origin + window.location.pathname;
      }
    });
  }

  function showError(msg) {
    welcomeError.textContent = msg;
    welcomeError.classList.remove('hidden');
    setTimeout(() => {
      welcomeError.classList.add('hidden');
    }, 4000);
  }

  // --- SOCKET EVENT HANDLERS ---
  socket.on('connect', () => {
    myPlayerId = socket.id;
  });

  socket.on('reaction', (data) => {
    triggerReaction(data.emoji);
  });

  socket.on('room_state', (state) => {
    currentRoom = state;
    renderState(state);
  });

  function renderState(state) {
    const isHost = state.hostId === myPlayerId;
    const me = state.players.find(p => p.id === myPlayerId);

    // 1. LOBBY
    if (state.state === 'LOBBY') {
      switchScreen('lobby');
      lobbyRoomCode.textContent = state.code;
      playerCount.textContent = state.players.length;

      // Update QR Code
      const lobbyQrImg = document.getElementById('lobby-qr-img');
      if (lobbyQrImg) {
        const joinUrl = `${window.location.origin}${window.location.pathname}?room=${state.code}`;
        lobbyQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=2&data=${encodeURIComponent(joinUrl)}`;
      }

      const catNames = {
        all: '🌟 All Categories',
        general: '🧠 Fun Facts',
        tech: '🚀 Tech & Gaming',
        pop: '🎬 Cinema & Pop',
        riddles: '🧩 Riddles'
      };
      lobbyCategoryBadge.textContent = catNames[state.category] || state.category;
      lobbyRoundsBadge.textContent = `${state.numRounds} Rounds`;

      // Render players
      lobbyPlayersGrid.innerHTML = state.players.map(p => {
        const isMe = p.id === myPlayerId;
        return `
          <div class="player-tile ${isMe ? 'is-me' : ''}">
            <div class="player-tile-avatar">${p.avatar}</div>
            <div class="player-tile-name">${escapeHtml(p.name)} ${isMe ? '(You)' : ''}</div>
            ${p.isHost ? '<span class="player-tile-host">HOST 👑</span>' : ''}
          </div>
        `;
      }).join('');

      // Controls
      if (isHost) {
        hostControls.classList.remove('hidden');
        guestControls.classList.add('hidden');
      } else {
        hostControls.classList.add('hidden');
        guestControls.classList.remove('hidden');
      }
    }

    // 2. STARTING COUNTDOWN
    else if (state.state === 'STARTING') {
      switchScreen('starting');
      countdownNumber.textContent = state.timeLeft || 3;
      sound.playCountdown();
    }

    // 3. QUESTION
    else if (state.state === 'QUESTION') {
      switchScreen('question');
      const q = state.currentQuestion;
      if (!q) return;

      qCurrent.textContent = q.index;
      qTotal.textContent = q.total;
      qCategoryTag.textContent = q.category.toUpperCase();
      qText.textContent = q.question;

      // Timer
      const duration = state.questionDuration || 15;
      const timeLeft = state.timeLeft;
      timerText.textContent = `${timeLeft}s`;
      const pct = Math.max(0, (timeLeft / duration) * 100);
      timerBar.style.width = `${pct}%`;
      timerBar.classList.toggle('warning', timeLeft <= 5);

      if (timeLeft <= 3 && timeLeft > 0) {
        sound.playCountdown();
      }

      // Check if user already submitted
      if (me && me.hasAnswered) {
        hasLockedInCurrentQuestion = true;
        submissionStatus.classList.remove('hidden');
      } else {
        hasLockedInCurrentQuestion = false;
        submissionStatus.classList.add('hidden');
      }

      // Options
      optionButtons.forEach((btn, idx) => {
        btn.querySelector('.option-label').textContent = q.options[idx] || '';
        btn.classList.remove('selected', 'correct', 'incorrect');
        if (me && me.hasAnswered) {
          btn.disabled = me.selectedAnswer !== idx;
          if (me.selectedAnswer === idx) btn.classList.add('selected');
        } else {
          btn.disabled = false;
        }
      });

      // Live player submission tracker chips
      liveTrackerChips.innerHTML = state.players.map(p => `
        <div class="tracker-chip ${p.hasAnswered ? 'answered' : ''}">
          <span>${p.avatar}</span>
          <span>${escapeHtml(p.name)}</span>
          <span>${p.hasAnswered ? '✅' : '⏳'}</span>
        </div>
      `).join('');
    }

    // 4. REVEAL
    else if (state.state === 'REVEAL') {
      switchScreen('reveal');
      const q = state.currentQuestion;
      revealCountdown.textContent = state.timeLeft;

      // Reveal correct answers on option cards
      if (q && q.answer !== null) {
        optionButtons.forEach((btn, idx) => {
          if (idx === q.answer) {
            btn.classList.add('correct');
          } else if (me && me.selectedAnswer === idx) {
            btn.classList.add('incorrect');
          }
        });

        revealExplanation.textContent = q.explanation || 'Good job!';
      }

      // Personalized status banner
      if (me) {
        const gotRight = me.selectedAnswer === q.answer;
        if (gotRight) {
          revealBanner.className = 'reveal-result-banner correct';
          revealStatusIcon.textContent = '✨';
          revealStatusTitle.textContent = 'Correct!';
          revealPointsText.textContent = `+${me.lastEarned} pts ${me.streak > 1 ? `(Streak ${me.streak} 🔥)` : ''}`;
          if (state.timeLeft === 5) sound.playCorrect();
        } else {
          revealBanner.className = 'reveal-result-banner wrong';
          revealStatusIcon.textContent = '❌';
          revealStatusTitle.textContent = me.selectedAnswer === null ? "Time's Up!" : 'Wrong Answer!';
          revealPointsText.textContent = '+0 pts (Streak broken)';
          if (state.timeLeft === 5) sound.playWrong();
        }
      }

      // Mini leaderboard sorted by score
      const sorted = [...state.players].sort((a, b) => b.score - a.score);
      revealLeaderboard.innerHTML = sorted.map((p, idx) => {
        const isMe = p.id === myPlayerId;
        return `
          <div class="mini-row ${isMe ? 'is-me' : ''}">
            <span class="mini-rank">#${idx + 1}</span>
            <span class="mini-avatar">${p.avatar}</span>
            <span class="mini-name">${escapeHtml(p.name)} ${isMe ? '(You)' : ''}</span>
            ${p.streak > 1 ? `<span class="mini-streak">${p.streak}🔥</span>` : ''}
            <span class="mini-score">${p.score.toLocaleString()}</span>
          </div>
        `;
      }).join('');
    }

    // 5. GAME OVER & PODIUM
    else if (state.state === 'GAME_OVER') {
      switchScreen('gameover');
      sound.playFanfare();
      if (confetti) confetti.start();

      const sorted = [...state.players].sort((a, b) => b.score - a.score);

      // Build podium (2nd, 1st, 3rd for visual hierarchy)
      let podiumHtml = '';
      if (sorted.length >= 2) {
        podiumHtml += `
          <div class="podium-col col-2">
            <div class="podium-avatar">${sorted[1].avatar}</div>
            <div class="podium-name">${escapeHtml(sorted[1].name)}</div>
            <div class="podium-score">${sorted[1].score.toLocaleString()} pts</div>
            <div class="podium-block">🥈 2</div>
          </div>
        `;
      }
      if (sorted.length >= 1) {
        podiumHtml += `
          <div class="podium-col col-1">
            <div class="podium-avatar">${sorted[0].avatar}</div>
            <div class="podium-name">${escapeHtml(sorted[0].name)}</div>
            <div class="podium-score">${sorted[0].score.toLocaleString()} pts</div>
            <div class="podium-block">🥇 1</div>
          </div>
        `;
      }
      if (sorted.length >= 3) {
        podiumHtml += `
          <div class="podium-col col-3">
            <div class="podium-avatar">${sorted[2].avatar}</div>
            <div class="podium-name">${escapeHtml(sorted[2].name)}</div>
            <div class="podium-score">${sorted[2].score.toLocaleString()} pts</div>
            <div class="podium-block">🥉 3</div>
          </div>
        `;
      }
      podiumWrap.innerHTML = podiumHtml;

      // Full scores list
      finalScoresList.innerHTML = sorted.map((p, idx) => `
        <div class="mini-row ${p.id === myPlayerId ? 'is-me' : ''}">
          <span class="mini-rank">#${idx + 1}</span>
          <span class="mini-avatar">${p.avatar}</span>
          <span class="mini-name">${escapeHtml(p.name)}</span>
          <span class="mini-score">${p.score.toLocaleString()} pts</span>
        </div>
      `).join('');
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Kickoff
  init();
})();

