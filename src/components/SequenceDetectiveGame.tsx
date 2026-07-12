'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { createSequencePuzzle, SequencePuzzle } from '@/lib/sequencePuzzle';

type Result = 'playing' | 'correct' | 'wrong';

interface SequenceDetectiveGameProps {
  initialPuzzle: SequencePuzzle;
}

export default function SequenceDetectiveGame({ initialPuzzle }: SequenceDetectiveGameProps) {
  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [firstGuess, setFirstGuess] = useState('');
  const [secondGuess, setSecondGuess] = useState('');
  const [result, setResult] = useState<Result>('playing');
  const [attempts, setAttempts] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const startNextPuzzle = () => {
    setPuzzle(createSequencePuzzle());
    setFirstGuess('');
    setSecondGuess('');
    setResult('playing');
    setAttempts(0);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firstGuess || !secondGuess) return;

    const isCorrect =
      Number(firstGuess) === puzzle.first && Number(secondGuess) === puzzle.second;

    setAttempts((current) => current + 1);
    setResult(isCorrect ? 'correct' : 'wrong');
  };

  const inputClassName =
    'h-24 w-full rounded-2xl border border-[#E2E2E2] bg-white text-center text-4xl font-medium text-[#111111] outline-none transition-all placeholder:text-[#D0D0D0] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]';

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] px-4 py-8 font-sans selection:bg-gray-200 md:px-8 md:py-12">
      <header className="mx-auto grid w-full max-w-3xl grid-cols-3 items-center">
        <Link
          href="/"
          className="justify-self-start text-sm font-medium text-[#8A8A8A] transition-colors hover:text-[#111111]"
        >
          ← 게임 모드
        </Link>
        <div className="text-center">
          <h1 className="whitespace-nowrap text-xl font-semibold tracking-wide text-[#111111]">수열 탐정</h1>
          <span className="mt-1 block text-xs text-[#8A8A8A]">GAME 02</span>
        </div>
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="justify-self-end rounded-full border border-[#E2E2E2] bg-white px-3 py-1.5 text-sm font-medium text-[#666666] transition-colors hover:border-[#111111] hover:text-[#111111]"
          aria-haspopup="dialog"
        >
          ? 도움말
        </button>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-2xl flex-col justify-center py-12">
        <section className="rounded-3xl border border-[#EAEAEA] bg-white p-6 shadow-sm md:p-10">
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3 text-xs font-semibold tracking-[0.18em] text-[#8A8A8A]">
              <span>LAST NUMBER</span>
              <span className="h-3 w-px bg-[#D5D5D5]" />
              <span>{attempts} ATTEMPTS</span>
            </div>
            <div className="mt-3 text-7xl font-semibold tracking-tight text-[#111111] md:text-8xl">
              {puzzle.target}
            </div>
            <p className="mt-5 text-[#8A8A8A]">
              첫 두 수부터 시작해 총 <strong className="font-semibold text-[#111111]">{puzzle.termCount}개</strong>의 수가
              이어집니다.
            </p>
          </div>

          {result === 'correct' ? (
            <div className="flex flex-col items-center">
              <p className="mb-5 text-lg font-semibold text-[#111111]">정답입니다!</p>
              <div className="mb-8 flex max-w-full flex-wrap items-center justify-center gap-2">
                {puzzle.sequence.map((number, index) => (
                  <div key={`${number}-${index}`} className="flex items-center gap-2">
                    <span className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-[#F2F2F2] px-3 font-mono text-lg font-medium">
                      {number}
                    </span>
                    {index < puzzle.sequence.length - 1 && <span className="text-[#B0B0B0]">→</span>}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={startNextPuzzle}
                className="w-full rounded-2xl bg-[#111111] py-4 font-medium text-white transition-all hover:bg-[#292929] active:scale-[0.99]"
              >
                다음 사건 풀기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-5">
                <label>
                  <span className="mb-2 block text-center text-xs font-medium text-[#8A8A8A]">첫 번째 수</span>
                  <input
                    className={inputClassName}
                    type="number"
                    min="1"
                    max="9"
                    inputMode="numeric"
                    value={firstGuess}
                    onChange={(event) => {
                      setFirstGuess(event.target.value);
                      setResult('playing');
                    }}
                    placeholder="?"
                    aria-label="첫 번째 수"
                  />
                </label>
                <span className="mt-6 text-2xl text-[#B0B0B0]">+</span>
                <label>
                  <span className="mb-2 block text-center text-xs font-medium text-[#8A8A8A]">두 번째 수</span>
                  <input
                    className={inputClassName}
                    type="number"
                    min="1"
                    max="9"
                    inputMode="numeric"
                    value={secondGuess}
                    onChange={(event) => {
                      setSecondGuess(event.target.value);
                      setResult('playing');
                    }}
                    placeholder="?"
                    aria-label="두 번째 수"
                  />
                </label>
              </div>

              <div className="mb-4 min-h-6 text-center text-sm font-medium text-red-500" aria-live="polite">
                {result === 'wrong' && '아직 단서와 맞지 않아요. 다시 추리해 보세요.'}
              </div>

              <button
                type="submit"
                disabled={!firstGuess || !secondGuess}
                className="w-full rounded-2xl bg-[#111111] py-4 font-medium text-white transition-all hover:bg-[#292929] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#D5D5D5]"
              >
                범인 지목하기
              </button>
            </form>
          )}
        </section>
      </main>

      {isHelpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsHelpOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="sequence-help-title"
            className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl md:p-9"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-[0.18em] text-[#8A8A8A]">HOW TO PLAY</span>
                <h2 id="sequence-help-title" className="mt-2 text-2xl font-semibold text-[#111111]">
                  수열 탐정 게임 방법
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2F2F2] text-xl text-[#666666] hover:text-[#111111]"
                aria-label="도움말 닫기"
              >
                ×
              </button>
            </div>

            <ol className="space-y-3 text-sm leading-relaxed text-[#666666]">
              <li><strong className="text-[#111111]">1.</strong> 각 숫자는 바로 앞의 두 숫자를 더해서 만듭니다.</li>
              <li><strong className="text-[#111111]">2.</strong> 마지막 숫자와 전체 수열 길이를 단서로 확인합니다.</li>
              <li><strong className="text-[#111111]">3.</strong> 첫 번째와 두 번째 숫자를 순서대로 맞히면 성공입니다.</li>
            </ol>

            <div className="my-7 rounded-2xl bg-[#F6F6F6] p-5">
              <p className="mb-4 text-xs font-semibold tracking-[0.15em] text-[#8A8A8A]">EXAMPLE</p>
              <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-sm font-medium md:text-base">
                {[2, 4, 6, 10, 16, 26, 42].map((number, index) => (
                  <span key={number} className="flex items-center gap-2">
                    <span className={index < 2 ? 'rounded-lg bg-[#111111] px-2.5 py-2 text-white' : 'px-1 py-2 text-[#555555]'}>
                      {number}
                    </span>
                    {index < 6 && <span className="text-[#B0B0B0]">→</span>}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-center text-sm text-[#666666]">
                마지막 수가 <strong className="text-[#111111]">42</strong>이고 총 7개라면, 시작은 <strong className="text-[#111111]">2와 4</strong>입니다.
              </p>
            </div>

            <p className="mb-6 text-sm text-[#8A8A8A]">
              시작 숫자는 각각 1부터 9 사이이며, 모든 문제의 정답은 하나뿐입니다.
            </p>
            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="w-full rounded-2xl bg-[#111111] py-4 font-medium text-white hover:bg-[#292929]"
            >
              추리 시작하기
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
