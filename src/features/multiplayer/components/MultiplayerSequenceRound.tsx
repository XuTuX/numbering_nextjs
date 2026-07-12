'use client';

import { FormEvent, useState } from 'react';
import { getSocket } from '@/features/multiplayer/lib/socket';
import { MultiplayerPuzzle, SubmissionResponse } from '@/features/multiplayer/types';

interface MultiplayerSequenceRoundProps {
  puzzle: Extract<MultiplayerPuzzle, { mode: 'sequence-detective' }>;
  roomId: string;
}

export default function MultiplayerSequenceRound({ puzzle, roomId }: MultiplayerSequenceRoundProps) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const [solved, setSolved] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!first || !second || solved) return;

    getSocket().emit(
      'submit_sequence',
      { roomId, first: Number(first), second: Number(second) },
      (response: SubmissionResponse) => {
        if (response.success) {
          setSolved(true);
          setFeedback({ message: '정답입니다! 1점을 획득했습니다.', success: true });
        } else {
          setFeedback({ message: response.message, success: false });
        }
      },
    );
  };

  const sanitize = (value: string) => value.replace(/[^1-9]/g, '');
  const inputClassName = 'h-24 w-full rounded-2xl border border-[#E2E2E2] bg-white text-center text-4xl font-medium outline-none focus:border-[#111111] disabled:bg-[#F4F4F4]';

  return (
    <section className="w-full max-w-xl rounded-3xl border border-[#EAEAEA] bg-white p-6 shadow-sm md:p-10">
      <div className="mb-10 text-center">
        <span className="text-xs font-semibold tracking-[0.18em] text-[#8A8A8A]">LAST NUMBER</span>
        <div className="mt-3 text-7xl font-semibold tracking-tight md:text-8xl">{puzzle.target}</div>
        <p className="mt-5 text-[#8A8A8A]">총 <strong className="text-[#111111]">{puzzle.termCount}개</strong>의 수가 이어집니다.</p>
      </div>

      <form onSubmit={submit}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <input aria-label="첫 번째 수" className={inputClassName} type="text" inputMode="numeric" maxLength={1} value={first} disabled={solved} onChange={(event) => { setFirst(sanitize(event.target.value)); setFeedback(null); }} placeholder="?" />
          <span className="text-2xl text-[#B0B0B0]">+</span>
          <input aria-label="두 번째 수" className={inputClassName} type="text" inputMode="numeric" maxLength={1} value={second} disabled={solved} onChange={(event) => { setSecond(sanitize(event.target.value)); setFeedback(null); }} placeholder="?" />
        </div>
        <div className={`min-h-12 py-4 text-center text-sm font-medium ${feedback?.success ? 'text-emerald-600' : 'text-red-500'}`}>{feedback?.message}</div>
        <button type="submit" disabled={!first || !second || solved} className="w-full rounded-2xl bg-[#111111] py-4 font-medium text-white disabled:bg-[#D5D5D5]">
          {solved ? '해결 완료' : '정답 제출'}
        </button>
      </form>
    </section>
  );
}
