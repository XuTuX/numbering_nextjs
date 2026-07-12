'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '@/features/multiplayer/lib/socket';
import Link from 'next/link';
import MultiplayerEquationEditor from '@/features/multiplayer/components/MultiplayerEquationEditor';
import {
  GameMode,
  GAME_MODE_LABELS,
  GameEndedPayload,
  MultiplayerPuzzle,
  MULTIPLAYER_ROUNDS,
  Player,
  RoomResponse,
  RoomStatus,
  RoundEndedPayload,
  RoundStartedPayload,
} from '@/features/multiplayer/types';
import MultiplayerSequenceRound from '@/features/multiplayer/components/MultiplayerSequenceRound';
import MultiplayerNumberVaultRound from '@/features/multiplayer/components/MultiplayerNumberVaultRound';

export default function MultiplayerRoom() {
  const { roomId } = useParams() as { roomId: string };
  const router = useRouter();

  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [status, setStatus] = useState<RoomStatus>('LOBBY');
  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('formula-workshop');
  const [puzzle, setPuzzle] = useState<MultiplayerPuzzle | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [socketId, setSocketId] = useState('');

  useEffect(() => {
    const socket = getSocket();

    const handleJoin = () => {
      setSocketId(socket.id || '');
      const username = localStorage.getItem('numbering_username') || 'Player';
      socket.emit('join_room', { roomId, username }, (res: RoomResponse) => {
        if (!res.success) {
          alert(res.message);
          router.push('/multi');
        } else {
          setPlayers(res.room.players);
          setStatus(res.room.status);
          setGameMode(res.room.gameMode);
          setIsHost(res.room.hostId === socket.id);
        }
      });
    };

    if (!socket.connected) {
      socket.connect();
    }

    // Always join/sync room on mount
    if (socket.id) {
      handleJoin();
    } else {
      socket.on('connect', handleJoin);
    }

    socket.on('player_joined', (updatedPlayers: Record<string, Player>) => setPlayers(updatedPlayers));
    socket.on('player_left', (updatedPlayers: Record<string, Player>) => setPlayers(updatedPlayers));
    socket.on('host_changed', (newHostId: string) => setIsHost(newHostId === socket.id));

    socket.on('round_started', (data: RoundStartedPayload) => {
      setStatus(data.status);
      setRound(data.round);
      setTimer(data.timer);
      setPuzzle(data.puzzle);
    });

    socket.on('timer_sync', (time: number) => setTimer(time));

    socket.on('score_updated', (data: { players: Record<string, Player> }) => {
      setPlayers(data.players);
    });

    socket.on('round_ended', (data: RoundEndedPayload) => {
      setStatus(data.status);
      setTimer(data.timer);
      setPlayers(data.players);
    });

    socket.on('game_ended', (data: GameEndedPayload) => {
      setStatus(data.status);
      setPlayers(data.players);
    });

    return () => {
      socket.off('connect', handleJoin);
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('host_changed');
      socket.off('round_started');
      socket.off('timer_sync');
      socket.off('score_updated');
      socket.off('round_ended');
      socket.off('game_ended');
      socket.emit('leave_room', { roomId });
    };
  }, [roomId, router]);

  const handleStartGame = () => {
    getSocket().emit('start_game', { roomId });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const sortedPlayers = Object.values(players)
    .filter(p => p.connected)
    .sort((a, b) => b.score - a.score);

  if (status === 'LOBBY') {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
        <div className="absolute top-8 left-8">
          <Link href={`/multi?mode=${gameMode}`} className="text-[#8A8A8A] hover:text-[#111111] transition-colors text-sm">
            ← Leave
          </Link>
        </div>
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-[#EAEAEA] shadow-sm flex flex-col items-center">
          <p className="text-xs text-[#8A8A8A] font-medium tracking-widest mb-2">ROOM CODE</p>
          <h1 className="text-5xl font-mono font-bold text-[#111111] tracking-widest mb-10">{roomId}</h1>
          <p className="-mt-7 mb-8 text-sm font-medium text-[#666666]">{GAME_MODE_LABELS[gameMode]}</p>

          <div className="w-full flex flex-col gap-2 mb-10">
            <h3 className="text-sm font-medium text-[#8A8A8A] px-2 mb-2">Players ({sortedPlayers.length}/5)</h3>
            {sortedPlayers.map((p) => (
              <div key={p.socketId} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA]">
                <span className="font-medium text-[#111111]">{p.username} {p.socketId === socketId ? '(나)' : ''}</span>
                {isHost && p.socketId === socketId && <span className="text-xs bg-[#111111] text-white px-2 py-1 rounded-md">HOST</span>}
              </div>
            ))}
            {sortedPlayers.length === 0 && <div className="text-center text-[#A0A0A0] text-sm py-4">로딩중...</div>}
          </div>

          {isHost ? (
            <button
              onClick={handleStartGame}
              className="w-full py-4 rounded-2xl bg-[#111111] text-white font-medium hover:bg-[#222222] transition-colors shadow-md active:scale-[0.98]"
            >
              게임 시작하기
            </button>
          ) : (
            <p className="text-[#8A8A8A] text-sm text-center">방장이 게임을 시작할 때까지 대기하세요...</p>
          )}
        </div>
      </div>
    );
  }

  if (status === 'ROUND_END') {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl border border-[#EAEAEA] shadow-sm flex flex-col items-center animate-in zoom-in-95 duration-300">
          <h2 className="text-3xl font-bold text-[#111111] mb-2">ROUND {round} 종료</h2>
          <p className="text-[#8A8A8A] mb-8">잠시 후 다음 라운드가 시작됩니다.</p>
          <div className="text-5xl font-mono font-medium text-[#111111] mb-10">
            {timer}
          </div>

          <div className="w-full flex flex-col gap-3">
            <h3 className="text-sm font-medium text-[#8A8A8A] px-2">현재 순위</h3>
            {sortedPlayers.map((p, i) => (
              <div key={p.socketId} className="flex items-center px-5 py-3 rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA]">
                <span className="w-8 font-bold text-[#8A8A8A]">{i + 1}</span>
                <span className="flex-grow font-medium text-[#111111]">{p.username}</span>
                <span className="font-bold text-[#111111]">{p.score}점</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'GAME_END') {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111111] p-10 rounded-3xl shadow-xl flex flex-col items-center animate-in zoom-in-95 duration-500">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">최종 순위</h1>
          <p className="text-[#A0A0A0] mb-10">모든 라운드가 종료되었습니다.</p>

          <div className="w-full flex flex-col gap-3 mb-10">
            {sortedPlayers.map((p, i) => (
              <div key={p.socketId} className={`flex items-center px-5 py-4 rounded-2xl ${i === 0 ? 'bg-white text-[#111111]' : 'bg-[#222222] text-white border border-[#333333]'}`}>
                <span className={`w-8 font-bold ${i === 0 ? 'text-[#8A8A8A]' : 'text-[#8A8A8A]'}`}>{i + 1}</span>
                <span className="flex-grow font-medium">{p.username}</span>
                <span className="font-bold">{p.score}점</span>
              </div>
            ))}
          </div>

          <Link href={`/multi?mode=${gameMode}`} className="w-full py-4 rounded-2xl bg-white text-[#111111] text-center font-medium hover:bg-[#FAFAFA] transition-colors active:scale-[0.98]">
            로비로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // PLAYING
  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col relative overflow-hidden font-sans">
      <header className="w-full flex justify-between items-center p-6 md:p-8 absolute top-0 left-0 right-0 z-10">
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold text-[#8A8A8A] tracking-widest uppercase mb-1">
            ROUND {round}/{MULTIPLAYER_ROUNDS}
          </span>
          <span className="text-lg font-mono font-medium text-[#111111] tracking-widest">
            {formatTime(timer)}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-sm font-medium text-[#111111]">
            나의 점수: {players[socketId]?.score || 0}점
          </span>
          <span className="block text-xs text-[#8A8A8A]">
            1등: {sortedPlayers[0]?.score || 0}점 ({sortedPlayers[0]?.username})
          </span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-4 mt-20 md:mt-0">
        {puzzle?.mode === 'formula-workshop' && (
          <MultiplayerEquationEditor
            key={`${round}-${puzzle.digitString}`}
            digits={puzzle.digits}
            roomId={roomId}
          />
        )}
        {puzzle?.mode === 'sequence-detective' && (
          <MultiplayerSequenceRound key={round} puzzle={puzzle} roomId={roomId} />
        )}
        {puzzle?.mode === 'number-vault' && (
          <MultiplayerNumberVaultRound key={round} puzzle={puzzle} roomId={roomId} />
        )}
      </main>
    </div>
  );
}
