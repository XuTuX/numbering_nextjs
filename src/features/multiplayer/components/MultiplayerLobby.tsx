'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/features/multiplayer/lib/socket';
import { GAME_MODE_LABELS, GameMode, RoomResponse } from '@/features/multiplayer/types';

export default function MultiplayerLobby({ gameMode }: { gameMode: GameMode }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const description = gameMode === 'formula-workshop'
    ? '동일한 숫자로 더 많은 수식을 찾아 경쟁하세요.'
    : gameMode === 'sequence-detective'
      ? '같은 수열 단서를 보고 먼저 시작 숫자를 찾아보세요.'
      : '같은 숫자 카드로 목표 숫자를 만들고 점수를 겨뤄보세요.';

  useEffect(() => {
    const storedName = localStorage.getItem('numbering_username');
    const resolvedName = storedName ?? `Player${Math.floor(Math.random() * 10000)}`;
    if (!storedName) localStorage.setItem('numbering_username', resolvedName);

    const update = window.setTimeout(() => setUsername(resolvedName), 0);
    return () => window.clearTimeout(update);
  }, []);

  const handleCreateRoom = () => {
    if (!username.trim()) return setError('닉네임을 입력해주세요.');
    localStorage.setItem('numbering_username', username);

    const socket = getSocket();
    socket.emit('create_room', { username, gameMode }, (res: RoomResponse) => {
      if (res.success) {
        router.push(`/multi/room/${res.roomId}`);
      } else {
        setError(res.message || '방 생성에 실패했습니다.');
      }
    });
  };

  const handleJoinRoom = () => {
    if (!username.trim()) return setError('닉네임을 입력해주세요.');
    if (!roomCode.trim()) return setError('방 코드를 입력해주세요.');
    localStorage.setItem('numbering_username', username);

    const socket = getSocket();
    const cleanRoomCode = roomCode.toUpperCase().trim();
    socket.emit('join_room', { roomId: cleanRoomCode, username }, (res: RoomResponse) => {
      if (res.success) {
        router.push(`/multi/room/${cleanRoomCode}`);
      } else {
        setError(res.message || '방 참가에 실패했습니다.');
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center justify-center px-4 md:px-8 py-8 font-sans selection:bg-gray-200">
      <div className="absolute left-1/2 top-8 z-20 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 md:top-12 md:w-[calc(100%-4rem)]">
        <Link href={`/games/${gameMode}`} className="text-[#8A8A8A] hover:text-[#111111] transition-colors text-sm font-medium">
          ← 게임 모드
        </Link>
      </div>

      <div className="w-full max-w-md flex flex-col items-center bg-white p-10 rounded-3xl border border-[#EAEAEA] shadow-sm">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#8A8A8A] mb-2">{GAME_MODE_LABELS[gameMode]}</p>
        <h1 className="text-4xl font-medium text-[#111111] tracking-wide mb-3">MULTI</h1>
        <p className="text-[#8A8A8A] text-center mb-8 leading-relaxed">
          {description}
        </p>

        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[#8A8A8A] px-1">닉네임</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nickname"
              className="w-full px-5 py-4 rounded-2xl border border-[#EAEAEA] bg-[#FAFAFA] text-[#111111] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#111111] transition-all"
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            onClick={handleCreateRoom}
            className="w-full py-4 rounded-2xl bg-[#111111] text-white font-medium hover:bg-[#222222] transition-colors shadow-md active:scale-[0.98]"
          >
            새로운 방 만들기
          </button>

          <div className="relative flex items-center my-2">
            <div className="flex-grow border-t border-[#EAEAEA]"></div>
            <span className="flex-shrink-0 mx-4 text-[#8A8A8A] text-sm">또는</span>
            <div className="flex-grow border-t border-[#EAEAEA]"></div>
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="ROOM CODE"
              className="w-full px-5 py-4 rounded-2xl border border-[#EAEAEA] bg-[#FAFAFA] text-[#111111] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all text-center tracking-widest font-mono uppercase"
            />
            <button
              onClick={handleJoinRoom}
              className="w-full py-4 rounded-2xl bg-white text-[#111111] border border-[#EAEAEA] font-medium hover:bg-[#FAFAFA] hover:shadow-sm transition-all active:scale-[0.98]"
            >
              방 코드로 참가하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
