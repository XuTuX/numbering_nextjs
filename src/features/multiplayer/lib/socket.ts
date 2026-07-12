import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io();
  }
  return socket;
};

export function getPlayerId() {
  const storageKey = 'numbering_player_id';
  const stored = localStorage.getItem(storageKey);
  if (stored) return stored;

  const playerId = crypto.randomUUID();
  localStorage.setItem(storageKey, playerId);
  return playerId;
}

export function emitWithAck<Response>(event: string, payload: unknown, timeoutMs = 5000) {
  return new Promise<Response>((resolve, reject) => {
    getSocket().timeout(timeoutMs).emit(
      event,
      payload,
      (error: Error | null, response: Response) => {
        if (error) reject(error);
        else resolve(response);
      },
    );
  });
}
