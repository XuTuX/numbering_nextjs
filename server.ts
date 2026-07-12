import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server, Socket } from 'socket.io';
import { generatePuzzle } from './src/lib/puzzleGenerator';
import { validateEquation } from './src/lib/expressionValidator';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3001', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface Player {
  socketId: string;
  username: string;
  score: number;
  connected: boolean;
}

interface Room {
  roomId: string;
  hostId: string;
  status: 'LOBBY' | 'PLAYING' | 'ROUND_END' | 'GAME_END';
  round: number;
  timer: number;
  digits: string[];
  digitString: string;
  players: Record<string, Player>;
  foundEquations: Record<string, string[]>; // socketId -> array of string
}

const rooms = new Map<string, Room>();

const ROUND_TIME = 180; // 3 minutes
const BREAK_TIME = 10;  // 10 seconds break
const MAX_ROUNDS = 3;

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
    // Generate a puzzle. Use HARD for more digits (7-10 digits) which allows more combinations.
    const puzzle = generatePuzzle('HARD');
    room.digits = puzzle.digits;
    room.digitString = puzzle.digitString;

    // Reset found equations for this round
    Object.keys(room.foundEquations).forEach(id => {
      room.foundEquations[id] = [];
    });

    io.to(roomId).emit('round_started', {
      round: room.round,
      timer: room.timer,
      digits: room.digits,
      digitString: room.digitString,
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
          if (room.round < MAX_ROUNDS) {
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

    socket.on('create_room', ({ username }, callback) => {
      const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newRoom: Room = {
        roomId,
        hostId: socket.id,
        status: 'LOBBY',
        round: 1,
        timer: 0,
        digits: [],
        digitString: '',
        players: {},
        foundEquations: {}
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

      // Clean up whitespace
      const expr = expression.replace(/\s+/g, '');
      const foundList = room.foundEquations[socket.id];
      if (foundList.includes(expr)) {
        return callback({ success: false, message: '이미 찾은 수식입니다.' });
      }

      const validation = validateEquation(expression, room.digitString);
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
