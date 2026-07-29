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
  CLASSIC_MAX_PLAYERS,
  DUEL_MAX_PLAYERS,
  DUEL_TIME,
  GameMode,
  MULTIPLAYER_ROUNDS,
  MultiplayerPuzzle,
  normalizeGameMode,
  normalizeRoomFormat,
  Player,
  PUZZLE_GAME_MODES,
  PuzzleGameMode,
  RoomFormat,
  RoomSnapshot,
  RoomStatus,
} from './src/features/multiplayer/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3001', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface RoomPlayer extends Player {
  playerId: string;
}

interface Room {
  roomId: string;
  hostId: string;
  status: RoomStatus;
  round: number;
  timer: number;
  gameMode: GameMode;
  format: RoomFormat;
  players: Record<string, RoomPlayer>;

  // Classic mode: one shared puzzle for the whole room.
  puzzle: MultiplayerPuzzle | null;
  puzzleSeq: number;
  sequenceAnswer: { first: number; second: number } | null;
  foundEquations: Record<string, string[]>; // socketId -> array of string
  solvedPlayers: Record<string, boolean>;

  // Duel mode: both players race to solve the same shared puzzle first.
  duelGameModeSequence: PuzzleGameMode[];
}

const rooms = new Map<string, Room>();

const ROUND_TIME = Number.parseInt(process.env.ROUND_TIME ?? '180', 10);
const BREAK_TIME = Number.parseInt(process.env.BREAK_TIME ?? '10', 10);
const RECONNECT_GRACE_MS = 30_000;
const DUEL_PROGRESSION_ROUND = 3; // fixed NORMAL difficulty — duel has no round progression

function sanitizeUsername(value: unknown) {
  const username = String(value ?? '').trim().slice(0, 24);
  return username || 'Player';
}

function createRoomId() {
  let roomId = '';
  do {
    roomId = Math.random().toString(36).slice(2, 6).toUpperCase();
  } while (rooms.has(roomId));
  return roomId;
}

function toRoomSnapshot(room: Room): RoomSnapshot {
  const players = Object.fromEntries(
    Object.entries(room.players).map(([socketId, player]) => [
      socketId,
      {
        socketId: player.socketId,
        username: player.username,
        score: player.score,
        connected: player.connected,
      },
    ]),
  );

  return {
    hostId: room.hostId,
    status: room.status,
    players,
    gameMode: room.gameMode,
    format: room.format,
    round: room.round,
    timer: room.timer,
    puzzle: room.puzzle,
    puzzleSeq: room.puzzleSeq,
  };
}

function allConnectedPlayersSolved(room: Room) {
  const connectedIds = Object.values(room.players)
    .filter((player) => player.connected)
    .map((player) => player.socketId);
  return connectedIds.length > 0 && connectedIds.every((socketId) => room.solvedPlayers[socketId]);
}

function generatePuzzleData(gameMode: PuzzleGameMode, progressionRound: number): {
  puzzle: MultiplayerPuzzle;
  sequenceAnswer: { first: number; second: number } | null;
} {
  if (gameMode === 'sequence-detective') {
    const puzzle = createSequencePuzzle(progressionRound);
    return {
      puzzle: { mode: 'sequence-detective', target: puzzle.target, termCount: puzzle.termCount },
      sequenceAnswer: { first: puzzle.first, second: puzzle.second },
    };
  }
  if (gameMode === 'number-vault') {
    const puzzle = createNumberVaultPuzzle(progressionRound);
    return {
      puzzle: { mode: 'number-vault', numbers: puzzle.numbers, target: puzzle.target },
      sequenceAnswer: null,
    };
  }
  const puzzle = generatePuzzle(getDifficultyForRound(progressionRound));
  return {
    puzzle: { mode: 'formula-workshop', digits: puzzle.digits, digitString: puzzle.digitString },
    sequenceAnswer: null,
  };
}

function shuffledPuzzleGameModes() {
  const modes = [...PUZZLE_GAME_MODES];
  for (let index = modes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [modes[index], modes[randomIndex]] = [modes[randomIndex], modes[index]];
  }
  return modes;
}

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

  // --- Classic mode: shared round for the whole room ---

  function startRound(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.gameMode === 'mixed') return;

    room.status = 'PLAYING';
    room.timer = ROUND_TIME;
    const progressionRound = room.round === 1 ? 1 : room.round === 2 ? 3 : 7;

    const { puzzle, sequenceAnswer } = generatePuzzleData(room.gameMode, progressionRound);
    room.puzzle = puzzle;
    room.sequenceAnswer = sequenceAnswer;
    room.puzzleSeq += 1;

    Object.keys(room.foundEquations).forEach(id => {
      room.foundEquations[id] = [];
    });
    room.solvedPlayers = {};

    io.to(roomId).emit('round_started', {
      round: room.round,
      timer: room.timer,
      puzzle: room.puzzle,
      status: room.status,
      puzzleSeq: room.puzzleSeq,
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
      players: toRoomSnapshot(room).players
    });
  }

  // --- Duel mode: one shared puzzle; first correct submission scores ---

  function dealDuelPuzzle(room: Room) {
    const puzzleIndex = room.puzzleSeq;
    while (room.duelGameModeSequence.length <= puzzleIndex) {
      room.duelGameModeSequence.push(...shuffledPuzzleGameModes());
    }
    const puzzleGameMode = room.gameMode === 'mixed'
      ? room.duelGameModeSequence[puzzleIndex]
      : room.gameMode;
    const { puzzle, sequenceAnswer } = generatePuzzleData(puzzleGameMode, DUEL_PROGRESSION_ROUND);
    room.puzzle = puzzle;
    room.sequenceAnswer = sequenceAnswer;
    room.puzzleSeq = puzzleIndex + 1;

    io.to(room.roomId).emit('round_started', {
      round: room.round,
      timer: room.timer,
      puzzle,
      status: room.status,
      puzzleSeq: room.puzzleSeq,
    });
  }

  function startDuel(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'PLAYING';
    room.round = 1;
    room.timer = DUEL_TIME;
    room.puzzleSeq = 0;
    room.duelGameModeSequence = [];
    dealDuelPuzzle(room);
  }

  function endGame(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'GAME_END';
    io.to(roomId).emit('game_ended', {
      players: toRoomSnapshot(room).players,
      status: room.status
    });
  }

  // Global game loop for timers
  setInterval(() => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.status === 'PLAYING') {
        room.timer -= 1;
        if (room.timer <= 0) {
          if (room.format === 'duel') {
            endGame(roomId);
          } else {
            startBreak(roomId);
          }
        } else {
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

    socket.on('create_room', ({ username, gameMode, format, playerId }, callback) => {
      const roomId = createRoomId();
      const resolvedUsername = sanitizeUsername(username);
      const resolvedPlayerId = String(playerId || socket.id);
      const resolvedGameMode = normalizeGameMode(gameMode);
      const newRoom: Room = {
        roomId,
        hostId: socket.id,
        status: 'LOBBY',
        round: 1,
        timer: 0,
        gameMode: resolvedGameMode,
        format: resolvedGameMode === 'mixed' ? 'duel' : normalizeRoomFormat(format),
        puzzle: null,
        puzzleSeq: 0,
        sequenceAnswer: null,
        players: {},
        foundEquations: {},
        solvedPlayers: {},
        duelGameModeSequence: [],
      };

      newRoom.players[socket.id] = {
        playerId: resolvedPlayerId,
        socketId: socket.id,
        username: resolvedUsername,
        score: 0,
        connected: true,
      };
      newRoom.foundEquations[socket.id] = [];

      rooms.set(roomId, newRoom);
      socket.join(roomId);

      callback({ success: true, roomId, room: toRoomSnapshot(newRoom) });
      console.log(`Room ${roomId} created by ${resolvedUsername}`);
    });

    socket.on('join_room', ({ roomId: rawRoomId, username, playerId }, callback) => {
      const roomId = String(rawRoomId ?? '').trim().toUpperCase();
      const room = rooms.get(roomId);
      if (!room) {
        return callback({ success: false, message: '방을 찾을 수 없습니다.' });
      }
      const resolvedPlayerId = String(playerId || socket.id);
      const existingEntry = Object.entries(room.players).find(
        ([, player]) => player.playerId === resolvedPlayerId,
      );

      const maxPlayers = room.format === 'duel' ? DUEL_MAX_PLAYERS : CLASSIC_MAX_PLAYERS;
      if (!existingEntry && room.status !== 'LOBBY') {
        return callback({ success: false, message: '이미 진행중인 방입니다.' });
      }
      if (!existingEntry && Object.keys(room.players).length >= maxPlayers) {
        return callback({ success: false, message: '방이 가득 찼습니다.' });
      }

      if (existingEntry) {
        const [previousSocketId, existingPlayer] = existingEntry;
        delete room.players[previousSocketId];
        room.players[socket.id] = {
          ...existingPlayer,
          socketId: socket.id,
          username: sanitizeUsername(username),
          connected: true,
        };
        room.foundEquations[socket.id] = room.foundEquations[previousSocketId] ?? [];
        room.solvedPlayers[socket.id] = room.solvedPlayers[previousSocketId] ?? false;
        delete room.foundEquations[previousSocketId];
        delete room.solvedPlayers[previousSocketId];

        if (room.hostId === previousSocketId) room.hostId = socket.id;
      } else {
        room.players[socket.id] = {
          playerId: resolvedPlayerId,
          socketId: socket.id,
          username: sanitizeUsername(username),
          score: 0,
          connected: true,
        };
        room.foundEquations[socket.id] = [];
      }
      socket.join(roomId);

      if (!room.players[room.hostId]) {
        room.hostId = socket.id;
      }

      const snapshot = toRoomSnapshot(room);
      callback({ success: true, room: snapshot });
      io.to(roomId).emit('player_joined', snapshot.players);
      io.to(roomId).emit('host_changed', room.hostId);
      console.log(`${sanitizeUsername(username)} joined room ${roomId}`);

    });

    socket.on('start_game', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || room.hostId !== socket.id || room.status !== 'LOBBY') return;

      if (room.format === 'duel') {
        const connectedCount = Object.values(room.players).filter((p) => p.connected).length;
        if (connectedCount !== DUEL_MAX_PLAYERS) return;
        startDuel(roomId);
      } else {
        startRound(roomId);
      }
    });

    socket.on('submit_equation', ({ roomId, expression, puzzleSeq }, callback) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'PLAYING') return callback({ success: false, message: '게임 진행중이 아닙니다.' });
      const player = room.players[socket.id];
      if (!player?.connected) return callback({ success: false, message: '방 참가자만 제출할 수 있습니다.' });

      if (room.format === 'duel') {
        if (puzzleSeq !== room.puzzleSeq) return callback({ success: false, message: '상대가 먼저 풀어 다음 문제로 넘어갔습니다.' });
        const puzzle = room.puzzle;
        if (puzzle?.mode !== 'formula-workshop') return callback({ success: false, message: '수식 공방 문제가 아닙니다.' });

        const validation = validateEquation(expression, puzzle.digitString);
        if (validation.valid && validation.isCorrect) {
          player.score += 1;
          io.to(roomId).emit('score_updated', { players: toRoomSnapshot(room).players });
          callback({ success: true });
          dealDuelPuzzle(room);
          return;
        }
        return callback({ success: false, message: !validation.valid ? validation.message : '올바르지 않은 수식입니다.' });
      }

      if (room.puzzle?.mode !== 'formula-workshop') return callback({ success: false, message: '수식 공방 문제가 아닙니다.' });

      // Clean up whitespace
      const expr = expression.replace(/\s+/g, '');
      const foundList = room.foundEquations[socket.id] ?? (room.foundEquations[socket.id] = []);
      const existingFinderId = Object.entries(room.foundEquations).find(
        ([, equations]) => equations.includes(expr),
      )?.[0];
      if (existingFinderId) {
        return callback({
          success: false,
          message: existingFinderId === socket.id
            ? '이미 찾은 수식입니다.'
            : '다른 플레이어가 먼저 찾은 수식입니다.',
        });
      }

      const validation = validateEquation(expression, room.puzzle.digitString);
      if (validation.valid && validation.isCorrect) {
        foundList.push(expr);
        player.score += 1;
        io.to(roomId).emit('score_updated', { players: toRoomSnapshot(room).players });
        callback({ success: true });
      } else {
        const msg = !validation.valid ? validation.message : '올바르지 않은 수식입니다.';
        callback({ success: false, message: msg });
      }
    });

    socket.on('submit_sequence', ({ roomId, first, second, puzzleSeq }, callback) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'PLAYING') {
        return callback({ success: false, message: '수열 탐정 게임이 진행 중이 아닙니다.' });
      }
      const player = room.players[socket.id];
      if (!player?.connected) return callback({ success: false, message: '방 참가자만 제출할 수 있습니다.' });

      if (room.format === 'duel') {
        if (puzzleSeq !== room.puzzleSeq) return callback({ success: false, message: '상대가 먼저 풀어 다음 문제로 넘어갔습니다.' });
        const puzzle = room.puzzle;
        const answer = room.sequenceAnswer;
        if (puzzle?.mode !== 'sequence-detective' || !answer) {
          return callback({ success: false, message: '수열 탐정 게임이 진행 중이 아닙니다.' });
        }
        const correct = answer.first === first && answer.second === second;
        if (!correct) return callback({ success: false, message: '정답이 아닙니다.' });

        player.score += 1;
        io.to(roomId).emit('score_updated', { players: toRoomSnapshot(room).players });
        callback({ success: true });
        dealDuelPuzzle(room);
        return;
      }

      if (room.puzzle?.mode !== 'sequence-detective') {
        return callback({ success: false, message: '수열 탐정 게임이 진행 중이 아닙니다.' });
      }
      if (room.solvedPlayers[socket.id]) {
        return callback({ success: false, message: '이번 라운드는 이미 해결했습니다.' });
      }
      const correct = room.sequenceAnswer?.first === first && room.sequenceAnswer?.second === second;
      if (!correct) return callback({ success: false, message: '정답이 아닙니다.' });

      room.solvedPlayers[socket.id] = true;
      player.score += 1;
      io.to(roomId).emit('score_updated', { players: toRoomSnapshot(room).players });
      callback({ success: true });
      if (allConnectedPlayersSolved(room)) startBreak(roomId);
    });

    socket.on('submit_vault', ({ roomId, expression, puzzleSeq }, callback) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'PLAYING') {
        return callback({ success: false, message: '숫자 금고 게임이 진행 중이 아닙니다.' });
      }
      const player = room.players[socket.id];
      if (!player?.connected) return callback({ success: false, message: '방 참가자만 제출할 수 있습니다.' });

      if (room.format === 'duel' && puzzleSeq !== room.puzzleSeq) {
        return callback({ success: false, message: '상대가 먼저 풀어 다음 문제로 넘어갔습니다.' });
      }
      const activePuzzle = room.puzzle;
      if (activePuzzle?.mode !== 'number-vault') {
        return callback({ success: false, message: '숫자 금고 게임이 진행 중이 아닙니다.' });
      }
      if (room.format !== 'duel' && room.solvedPlayers[socket.id]) {
        return callback({ success: false, message: '이번 라운드는 이미 해결했습니다.' });
      }

      const usedNumbers = (String(expression).match(/\d+/g) ?? [])
        .map((value) => Number(value))
        .sort((a: number, b: number) => a - b);
      const expectedNumbers = [...activePuzzle.numbers].sort((a, b) => a - b);
      if (JSON.stringify(usedNumbers) !== JSON.stringify(expectedNumbers)) {
        return callback({ success: false, message: '모든 숫자를 정확히 한 번씩 사용해야 합니다.' });
      }
      const result = evaluateExpression(expression);
      if (!result.valid || result.value !== activePuzzle.target) {
        return callback({ success: false, message: result.valid ? '목표 숫자와 값이 다릅니다.' : result.message });
      }

      player.score += 1;
      io.to(roomId).emit('score_updated', { players: toRoomSnapshot(room).players });

      if (room.format === 'duel') {
        callback({ success: true });
        dealDuelPuzzle(room);
        return;
      }

      room.solvedPlayers[socket.id] = true;
      callback({ success: true });
      if (allConnectedPlayersSolved(room)) startBreak(roomId);
    });

    socket.on('leave_room', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.players[socket.id]) {
        delete room.players[socket.id];
        delete room.foundEquations[socket.id];
        delete room.solvedPlayers[socket.id];
        socket.leave(roomId);
        io.to(roomId).emit('player_left', toRoomSnapshot(room).players);

        if (room.hostId === socket.id) {
          const firstConnected = Object.values(room.players).find(p => p.connected);
          if (firstConnected) {
            room.hostId = firstConnected.socketId;
            io.to(roomId).emit('host_changed', room.hostId);
          }
        }

        if (Object.keys(room.players).length === 0) rooms.delete(roomId);
        else if (
          room.format !== 'duel' &&
          room.status === 'PLAYING' &&
          room.gameMode !== 'formula-workshop' &&
          allConnectedPlayersSolved(room)
        ) {
          startBreak(roomId);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Clean up empty rooms or mark player as disconnected
      for (const [roomId, room] of rooms.entries()) {
        if (room.players[socket.id]) {
          const disconnectedPlayerId = room.players[socket.id].playerId;
          room.players[socket.id].connected = false;
          io.to(roomId).emit('player_left', toRoomSnapshot(room).players);

          if (room.hostId === socket.id) {
            const firstConnected = Object.values(room.players).find(p => p.connected);
            if (firstConnected) {
              room.hostId = firstConnected.socketId;
              io.to(roomId).emit('host_changed', room.hostId);
            }
          }

          if (
            room.format !== 'duel' &&
            room.status === 'PLAYING' &&
            room.gameMode !== 'formula-workshop' &&
            allConnectedPlayersSolved(room)
          ) {
            startBreak(roomId);
          }

          setTimeout(() => {
            const currentRoom = rooms.get(roomId);
            if (!currentRoom) return;
            const staleEntry = Object.entries(currentRoom.players).find(
              ([, player]) => player.playerId === disconnectedPlayerId && !player.connected,
            );
            if (!staleEntry) return;

            const [staleSocketId] = staleEntry;
            delete currentRoom.players[staleSocketId];
            delete currentRoom.foundEquations[staleSocketId];
            delete currentRoom.solvedPlayers[staleSocketId];
            if (Object.keys(currentRoom.players).length === 0) rooms.delete(roomId);
          }, RECONNECT_GRACE_MS);
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
