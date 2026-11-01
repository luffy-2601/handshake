const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const questionsBank = require('./questions');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// In-memory room store
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickQuestions(category = 'all', count = 5) {
  let pool = questionsBank;
  if (category && category !== 'all') {
    pool = questionsBank.filter(q => q.category === category);
    if (pool.length === 0) pool = questionsBank;
  }
  const shuffled = shuffle(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function sanitizeRoomState(room, forSocketId) {
  const playersList = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    score: p.score,
    streak: p.streak,
    lastEarned: p.lastEarned,
    hasAnswered: p.hasAnswered,
    isHost: p.id === room.hostId,
    // Only disclose player's choice in REVEAL or GAME_OVER, or disclose own choice
    selectedAnswer: (room.state === 'REVEAL' || room.state === 'GAME_OVER' || p.id === forSocketId) ? p.selectedAnswer : null
  }));

  let currentQuestion = null;
  if (room.currentQuestionIndex >= 0 && room.currentQuestionIndex < room.questions.length) {
    const rawQ = room.questions[room.currentQuestionIndex];
    currentQuestion = {
      category: rawQ.category,
      question: rawQ.question,
      options: rawQ.options,
      index: room.currentQuestionIndex + 1,
      total: room.questions.length,
      // Only disclose correct answer and explanation during reveal/game_over
      answer: (room.state === 'REVEAL' || room.state === 'GAME_OVER') ? rawQ.answer : null,
      explanation: (room.state === 'REVEAL' || room.state === 'GAME_OVER') ? rawQ.explanation : null
    };
  }

  return {
    code: room.code,
    hostId: room.hostId,
    category: room.category,
    numRounds: room.numRounds,
    questionDuration: room.questionDuration,
    state: room.state,
    timeLeft: room.timeLeft,
    players: playersList,
    currentQuestion
  };
}

function broadcastRoom(room) {
  for (const socketId of room.players.keys()) {
    io.to(socketId).emit('room_state', sanitizeRoomState(room, socketId));
  }
}

function startQuestionTimer(room) {
  if (room.timer) clearInterval(room.timer);
  room.timeLeft = room.questionDuration;

  room.timer = setInterval(() => {
    room.timeLeft--;
    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      room.timer = null;
      endQuestionRound(room);
    } else {
      broadcastRoom(room);
    }
  }, 1000);
}

function endQuestionRound(room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  room.state = 'REVEAL';
  room.timeLeft = 5;

  const currentQ = room.questions[room.currentQuestionIndex];

  // Calculate scores
  room.players.forEach(p => {
    if (p.selectedAnswer === currentQ.answer) {
      // Speed bonus: 500 to 1000 pts
      const ratio = Math.max(0, p.answerTimeLeft || 0) / room.questionDuration;
      const speedPts = 500 + Math.round(500 * ratio);
      p.streak = (p.streak || 0) + 1;
      const streakBonus = Math.min((p.streak - 1) * 100, 500);
      const earned = speedPts + streakBonus;
      p.score += earned;
      p.lastEarned = earned;
    } else {
      p.streak = 0;
      p.lastEarned = 0;
    }
  });

  broadcastRoom(room);

  // Reveal countdown
  room.revealTimer = setInterval(() => {
    room.timeLeft--;
    if (room.timeLeft <= 0) {
      clearInterval(room.revealTimer);
      room.revealTimer = null;
      advanceToNextQuestion(room);
    } else {
      broadcastRoom(room);
    }
  }, 1000);
}

function advanceToNextQuestion(room) {
  room.currentQuestionIndex++;
  if (room.currentQuestionIndex < room.questions.length) {
    // Reset answers for next question
    room.players.forEach(p => {
      p.hasAnswered = false;
      p.selectedAnswer = null;
      p.answerTimeLeft = 0;
      p.lastEarned = 0;
    });
    room.state = 'QUESTION';
    broadcastRoom(room);
    startQuestionTimer(room);
  } else {
    // Game over!
    room.state = 'GAME_OVER';
    broadcastRoom(room);
  }
}

io.on('connection', (socket) => {
  let currentRoomCode = null;

  socket.on('create_room', ({ name, avatar, category = 'all', numRounds = 5 }) => {
    const code = generateRoomCode();
    currentRoomCode = code;
    socket.join(code);

    const room = {
      code,
      hostId: socket.id,
      category,
      numRounds: parseInt(numRounds, 10) || 5,
      questionDuration: 15,
      state: 'LOBBY',
      timeLeft: 0,
      timer: null,
      revealTimer: null,
      currentQuestionIndex: -1,
      questions: [],
      players: new Map()
    };

    room.players.set(socket.id, {
      id: socket.id,
      name: (name || 'Host').trim().slice(0, 15),
      avatar: avatar || '👑',
      score: 0,
      streak: 0,
      lastEarned: 0,
      hasAnswered: false,
      selectedAnswer: null,
      answerTimeLeft: 0
    });

    rooms.set(code, room);
    broadcastRoom(room);
  });

  socket.on('join_room', ({ code, name, avatar }, callback) => {
    const roomCode = (code || '').toUpperCase().trim();
    const room = rooms.get(roomCode);

    if (!room) {
      if (callback) callback({ success: false, message: 'Room not found. Check the code and try again!' });
      return;
    }

    if (room.players.size >= 8) {
      if (callback) callback({ success: false, message: 'Room is full (maximum 8 players).' });
      return;
    }

    currentRoomCode = roomCode;
    socket.join(roomCode);

    room.players.set(socket.id, {
      id: socket.id,
      name: (name || `Player ${room.players.size + 1}`).trim().slice(0, 15),
      avatar: avatar || '🎮',
      score: 0,
      streak: 0,
      lastEarned: 0,
      hasAnswered: false,
      selectedAnswer: null,
      answerTimeLeft: 0
    });

    if (callback) callback({ success: true, code: roomCode });
    broadcastRoom(room);
  });

  socket.on('update_settings', ({ category, numRounds }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id || room.state !== 'LOBBY') return;

    if (category) room.category = category;
    if (numRounds) room.numRounds = parseInt(numRounds, 10) || 5;
    broadcastRoom(room);
  });

  socket.on('start_game', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id || room.state !== 'LOBBY') return;

    room.questions = pickQuestions(room.category, room.numRounds);
    room.currentQuestionIndex = 0;
    room.state = 'STARTING';
    room.timeLeft = 3;

    // Reset scores & state
    room.players.forEach(p => {
      p.score = 0;
      p.streak = 0;
      p.lastEarned = 0;
      p.hasAnswered = false;
      p.selectedAnswer = null;
      p.answerTimeLeft = 0;
    });

    broadcastRoom(room);

    let countdown = 3;
    const startTimer = setInterval(() => {
      countdown--;
      room.timeLeft = countdown;
      if (countdown <= 0) {
        clearInterval(startTimer);
        room.state = 'QUESTION';
        broadcastRoom(room);
        startQuestionTimer(room);
      } else {
        broadcastRoom(room);
      }
    }, 1000);
  });

  socket.on('submit_answer', ({ answerIndex }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.state !== 'QUESTION') return;

    const player = room.players.get(socket.id);
    if (!player || player.hasAnswered) return;

    player.hasAnswered = true;
    player.selectedAnswer = answerIndex;
    player.answerTimeLeft = room.timeLeft;

    // Check if all players answered
    const allAnswered = Array.from(room.players.values()).every(p => p.hasAnswered);
    if (allAnswered) {
      endQuestionRound(room);
    } else {
      broadcastRoom(room);
    }
  });

  socket.on('send_reaction', ({ emoji }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    io.to(currentRoomCode).emit('reaction', {
      emoji,
      sender: player ? player.name : 'A player'
    });
  });

  socket.on('play_again', () => {
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    if (room.timer) clearInterval(room.timer);
    if (room.revealTimer) clearInterval(room.revealTimer);

    room.state = 'LOBBY';
    room.currentQuestionIndex = -1;
    room.questions = [];
    room.players.forEach(p => {
      p.score = 0;
      p.streak = 0;
      p.lastEarned = 0;
      p.hasAnswered = false;
      p.selectedAnswer = null;
      p.answerTimeLeft = 0;
    });

    broadcastRoom(room);
  });

  socket.on('disconnect', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    room.players.delete(socket.id);

    if (room.players.size === 0) {
      if (room.timer) clearInterval(room.timer);
      if (room.revealTimer) clearInterval(room.revealTimer);
      rooms.delete(currentRoomCode);
    } else {
      // Reassign host if host left
      if (room.hostId === socket.id) {
        const nextHostId = room.players.keys().next().value;
        room.hostId = nextHostId;
      }
      // If we are in question phase and the remaining players have all answered
      if (room.state === 'QUESTION') {
        const allAnswered = Array.from(room.players.values()).every(p => p.hasAnswered);
        if (allAnswered) {
          endQuestionRound(room);
          return;
        }
      }
      broadcastRoom(room);
    }
  });
});

server.listen(PORT, () => {
  console.log(`SyncClash party server running at: http://localhost:${PORT}`);
});

