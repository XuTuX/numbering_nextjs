import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server, Socket } from 'socket.io';
import { generatePuzzle } from './src/features/formula-workshop/lib/generatePuzzle';
import { validateEquation } from './src/lib/equation/validateEquation';
import { evaluateExpression } from './src/lib/equation/evaluateExpression';
import { createNumberVaultPuzzle } from './src/features/number-vault/lib/createPuzzle';
import { createSequencePuzzle } from './src/features/sequence-detective/lib/createPuzzle';
import { getDifficultyForRound } from './src/features/formula-workshop/types';
import {
  GameMode,
  MULTIPLAYER_ROUNDS,
  MultiplayerPuzzle,
  normalizeGameMode,
  Player,
  RoomStatus,
} from './src/features/multiplayer/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3001', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface Room {
  roomId: string;
  hostId: string;
  status: RoomStatus;
  round: number;
  timer: number;
  gameMode: GameMode;
  puzzle: MultiplayerPuzzle | null;
  sequenceAnswer: { first: number; second: number } | null;
  players: Record<string, Player>;
  foundEquations: Record<string, string[]>; // socketId -> array of string
  solvedPlayers: Record<string, boolean>;
}

const rooms = new Map<string, Room>();

const ROUND_TIME = 180; // 3 minutes
const BREAK_TIME = 10;  // 10 seconds break

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      if (!req.url) throw new Error('No url');
      const parsedUrl = parse(req.url, true);
      if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/socket.io/')) {
        return; // socket.io will handle it
      }
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req?.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: { origin: '*' },
  });

  function startRound(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'PLAYING';
    room.timer = ROUND_TIME;
    const progressionRound = room.round === 1 ? 1 : room.round === 2 ? 3 : 7;

    if (room.gameMode === 'sequence-detective') {
      const puzzle = createSequencePuzzle(progressionRound);
      room.puzzle = {
        mode: 'sequence-detective',
        target: puzzle.target,
        termCount: puzzle.termCount,
      };
      room.sequenceAnswer = { first: puzzle.first, second: puzzle.second };
    } else if (room.gameMode === 'number-vault') {
      const puzzle = createNumberVaultPuzzle(progressionRound);
      room.puzzle = { mode: 'number-vault', numbers: puzzle.numbers, target: puzzle.target };
      room.sequenceAnswer = null;
    } else {
      const puzzle = generatePuzzle(getDifficultyForRound(progressionRound));
      room.puzzle = {
        mode: 'formula-workshop',
        digits: puzzle.digits,
        digitString: puzzle.digitString,
      };
      room.sequenceAnswer = null;
    }

    // Reset found equations for this round
    Object.keys(room.foundEquations).forEach(id => {
      room.foundEquations[id] = [];
    });
    room.solvedPlayers = {};

    io.to(roomId).emit('round_started', {
      round: room.round,
      timer: room.timer,
      puzzle: room.puzzle,
      status: room.status
    });
  }

  function startBreak(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'ROUND_END';
    room.timer = BREAK_TIME;

    io.to(roomId).emit('round_ended', {
      round: room.round,
      timer: room.timer,
      status: room.status,
      players: room.players
    });
  }

  function endGame(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'GAME_END';
    io.to(roomId).emit('game_ended', {
      players: room.players,
      status: room.status
    });
  }

  // Global game loop for timers
  setInterval(() => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.status === 'PLAYING') {
        room.timer -= 1;
        if (room.timer <= 0) {
          startBreak(roomId);
        } else if (room.timer % 5 === 0 || room.timer <= 10) {
          // Sync timer frequently but not necessarily every single second for all to save bandwidth (though 1s is fine for small scale)
          io.to(roomId).emit('timer_sync', room.timer);
        }
      } else if (room.status === 'ROUND_END') {
        room.timer -= 1;
        if (room.timer <= 0) {
          if (room.round < MULTIPLAYER_ROUNDS) {
            room.round += 1;
            startRound(roomId);
          } else {
            endGame(roomId);
          }
        } else {
          io.to(roomId).emit('timer_sync', room.timer);
        }
      }
    }
  }, 1000);

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('create_room', ({ username, gameMode }, callback) => {
      const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newRoom: Room = {
        roomId,
        hostId: socket.id,
        status: 'LOBBY',
        round: 1,
        timer: 0,
        gameMode: normalizeGameMode(gameMode),
        puzzle: null,
        sequenceAnswer: null,
        players: {},
        foundEquations: {},
        solvedPlayers: {},
      };
      
      newRoom.players[socket.id] = { socketId: socket.id, username, score: 0, connected: true };
      newRoom.foundEquations[socket.id] = [];
      
      rooms.set(roomId, newRoom);
      socket.join(roomId);
      
      callback({ success: true, roomId, room: newRoom });
      console.log(`Room ${roomId} created by ${username}`);
    });

    socket.on('join_room', ({ roomId, username }, callback) => {
      const room = rooms.get(roomId);
      if (!room) {
        return callback({ success: false, message: '방을 찾을 수 없습니다.' });
      }
      if (room.status !== 'LOBBY') {
        return callback({ success: false, message: '이미 진행중인 방입니다.' });
      }
      if (Object.keys(room.players).length >= 5) {
        return callback({ success: false, message: '방이 가득 찼습니다.' });
      }

      room.players[socket.id] = { socketId: socket.id, username, score: 0, connected: true };
      room.foundEquations[socket.id] = [];
      socket.join(roomId);
      
      if (!room.players[room.hostId]) {
        room.hostId = socket.id;
      }
      
      callback({ success: true, room });
      io.to(roomId).emit('player_joined', room.players);
      io.to(roomId).emit('host_changed', room.hostId);
      console.log(`${username} joined room ${roomId}`);
    });

    socket.on('start_game', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id && room.status === 'LOBBY') {
        startRound(roomId);
      }
    });

    socket.on('submit_equation', ({ roomId, expression }, callback) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'PLAYING') return callback({ success: false, message: '게임 진행중이 아닙니다.' });
      if (room.puzzle?.mode !== 'formula-workshop') return callback({ success: false, message: '수식 공방 문제가 아닙니다.' });

      // Clean up whitespace
      const expr = expression.replace(/\s+/g, '');
      const foundList = room.foundEquations[socket.id];
      if (foundList.includes(expr)) {
        return callback({ success: false, message: '이미 찾은 수식입니다.' });
      }

      const validation = validateEquation(expression, room.puzzle.digitString);
      if (validation.valid && validation.isCorrect) {
        foundList.push(expr);
        if (room.players[socket.id]) {
          room.players[socket.id].score += 1;
        }
        io.to(roomId).emit('score_updated', { players: room.players });
        callback({ success: true });
      } else {
        const msg = !validation.valid ? validation.message : '올바르지 않은 수식입니다.';
        callback({ success: false, message: msg });
      }
    });

    socket.on('submit_sequence', ({ roomId, first, second }, callback) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'PLAYING' || room.puzzle?.mode !== 'sequence-detective') {
        return callback({ success: false, message: '수열 탐정 게임이 진행 중이 아닙니다.' });
      }
      if (room.solvedPlayers[socket.id]) {
        return callback({ success: false, message: '이번 라운드는 이미 해결했습니다.' });
      }
      const correct = room.sequenceAnswer?.first === first && room.sequenceAnswer?.second === second;
      if (!correct) return callback({ success: false, message: '정답이 아닙니다.' });

      room.solvedPlayers[socket.id] = true;
      if (room.players[socket.id]) room.players[socket.id].score += 1;
      io.to(roomId).emit('score_updated', { players: room.players });
      callback({ success: true });
    });

    socket.on('submit_vault', ({ roomId, expression }, callback) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'PLAYING' || room.puzzle?.mode !== 'number-vault') {
        return callback({ success: false, message: '숫자 금고 게임이 진행 중이 아닙니다.' });
      }
      if (room.solvedPlayers[socket.id]) {
        return callback({ success: false, message: '이번 라운드는 이미 해결했습니다.' });
      }

      const usedNumbers = (String(expression).match(/\d+/g) ?? [])
        .map((value) => Number(value))
        .sort((a: number, b: number) => a - b);
      const expectedNumbers = [...room.puzzle.numbers].sort((a, b) => a - b);
      if (JSON.stringify(usedNumbers) !== JSON.stringify(expectedNumbers)) {
        return callback({ success: false, message: '모든 숫자를 정확히 한 번씩 사용해야 합니다.' });
      }
      const result = evaluateExpression(expression);
      if (!result.valid || result.value !== room.puzzle.target) {
        return callback({ success: false, message: result.valid ? '목표 숫자와 값이 다릅니다.' : result.message });
      }

      room.solvedPlayers[socket.id] = true;
      if (room.players[socket.id]) room.players[socket.id].score += 1;
      io.to(roomId).emit('score_updated', { players: room.players });
      callback({ success: true });
    });

    socket.on('leave_room', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.players[socket.id]) {
        delete room.players[socket.id];
        socket.leave(roomId);
        io.to(roomId).emit('player_left', room.players);
        
        if (room.hostId === socket.id) {
          const firstConnected = Object.values(room.players).find(p => p.connected);
          if (firstConnected) {
            room.hostId = firstConnected.socketId;
            io.to(roomId).emit('host_changed', room.hostId);
          }
        }
        
        // Delay deletion to prevent React Strict Mode unmount bugs
        setTimeout(() => {
          const currentRoom = rooms.get(roomId);
          if (currentRoom) {
            const anyConnected = Object.values(currentRoom.players).some(p => p.connected);
            if (!anyConnected && Object.keys(currentRoom.players).length === 0) {
              rooms.delete(roomId);
            }
          }
        }, 2000);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Clean up empty rooms or mark player as disconnected
      for (const [roomId, room] of rooms.entries()) {
        if (room.players[socket.id]) {
          room.players[socket.id].connected = false;
          io.to(roomId).emit('player_left', room.players);
          
          // If all disconnected, delete room
          const anyConnected = Object.values(room.players).some(p => p.connected);
          if (!anyConnected) {
            rooms.delete(roomId);
          } else if (room.hostId === socket.id) {
            // Assign new host
            const firstConnected = Object.values(room.players).find(p => p.connected);
            if (firstConnected) {
              room.hostId = firstConnected.socketId;
              io.to(roomId).emit('host_changed', room.hostId);
            }
          }
        }
      }
    });
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
