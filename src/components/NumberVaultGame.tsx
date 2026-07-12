'use client';

import Link from 'next/link';
import { useState } from 'react';
import { evaluateExpression } from '@/lib/expressionParser';
import { createNumberVaultPuzzle, NumberVaultPuzzle } from '@/lib/numberVaultPuzzle';

type SymbolValue = '+' | '-' | '×' | '÷' | '(' | ')';

type ExpressionToken =
  | { kind: 'number'; cardIndex: number; value: number }
  | { kind: 'symbol'; value: SymbolValue };

interface NumberVaultGameProps {
  initialPuzzle: NumberVaultPuzzle;
}

const operators: SymbolValue[] = ['+', '-', '×', '÷', '(', ')'];

export default function NumberVaultGame({ initialPuzzle }: NumberVaultGameProps) {
  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [tokens, setTokens] = useState<ExpressionToken[]>([]);
  const [message, setMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const expression = tokens.map((token) => token.value).join(' ');
  const usedCardIndexes = new Set(
    tokens.filter((token) => token.kind === 'number').map((token) => token.cardIndex),
  );

  const appendNumber = (cardIndex: number, value: number) => {
    if (usedCardIndexes.has(cardIndex)) return;
    const lastToken = tokens.at(-1);
    if (lastToken?.kind === 'number' || lastToken?.value === ')') {
      setMessage('숫자 사이에는 연산자가 필요합니다.');
      return;
    }

    setTokens((current) => [...current, { kind: 'number', cardIndex, value }]);
    setMessage('');
  };

  const appendSymbol = (symbol: SymbolValue) => {
    const lastToken = tokens.at(-1);
    const openCount = tokens.filter((token) => token.value === '(').length;
    const closeCount = tokens.filter((token) => token.value === ')').length;
    const canEndValue = lastToken?.kind === 'number' || lastToken?.value === ')';

    if (symbol === '(') {
      if (canEndValue) {
        setMessage('괄호 앞에는 연산자가 필요합니다.');
        return;
      }
    } else if (symbol === ')') {
      if (!canEndValue || openCount <= closeCount) {
        setMessage('먼저 여는 괄호와 숫자를 입력하세요.');
        return;
      }
    } else if (!canEndValue) {
      setMessage('연산자 앞에 숫자가 필요합니다.');
      return;
    }

    setTokens((current) => [...current, { kind: 'symbol', value: symbol }]);
    setMessage('');
  };

  const undo = () => {
    setTokens((current) => current.slice(0, -1));
    setMessage('');
  };

  const reset = () => {
    setTokens([]);
    setMessage('');
  };

  const submit = () => {
    if (usedCardIndexes.size !== puzzle.numbers.length) {
      setMessage('모든 숫자 카드를 한 번씩 사용해야 합니다.');
      return;
    }

    const evaluation = evaluateExpression(expression);
    if (!evaluation.valid) {
      setMessage(evaluation.message);
      return;
    }

    if (evaluation.value !== puzzle.target) {
      setMessage(`계산 결과는 ${evaluation.value}입니다. 목표 숫자와 달라요.`);
      return;
    }

    setMessage('');
    setIsCorrect(true);
  };

  const nextPuzzle = () => {
    setPuzzle(createNumberVaultPuzzle());
    setTokens([]);
    setMessage('');
    setIsCorrect(false);
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] px-4 py-8 font-sans selection:bg-gray-200 md:px-8 md:py-12">
      <header className="mx-auto grid w-full max-w-3xl grid-cols-3 items-center">
        <Link href="/" className="justify-self-start text-sm font-medium text-[#8A8A8A] transition-colors hover:text-[#111111]">
          ← 게임 모드
        </Link>
        <div className="text-center">
          <h1 className="whitespace-nowrap text-xl font-semibold tracking-wide text-[#111111]">숫자 금고</h1>
          <span className="mt-1 block text-xs text-[#8A8A8A]">GAME 03</span>
        </div>
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="justify-self-end rounded-full border border-[#E2E2E2] bg-white px-3 py-1.5 text-sm font-medium text-[#666666] transition-colors hover:border-[#111111] hover:text-[#111111]"
        >
          ? 도움말
        </button>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-2xl flex-col justify-center py-10">
        <section className="rounded-3xl border border-[#EAEAEA] bg-white p-6 shadow-sm md:p-10">
          <div className="text-center">
            <span className="text-xs font-semibold tracking-[0.18em] text-[#8A8A8A]">UNLOCK NUMBER</span>
            <div className="mt-3 text-7xl font-semibold tracking-tight text-[#111111] md:text-8xl">{puzzle.target}</div>
          </div>

          <div className="my-9 flex justify-center gap-3 md:gap-4">
            {puzzle.numbers.map((number, index) => {
              const isUsed = usedCardIndexes.has(index);
              return (
                <button
                  key={`${index}-${number}`}
                  type="button"
                  disabled={isUsed || isCorrect}
                  onClick={() => appendNumber(index, number)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E2E2E2] bg-white text-2xl font-semibold text-[#111111] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#111111] disabled:translate-y-0 disabled:bg-[#F2F2F2] disabled:text-[#C5C5C5] disabled:shadow-none md:h-20 md:w-20 md:text-3xl"
                >
                  {number}
                </button>
              );
            })}
          </div>

          <div className="flex min-h-24 items-center justify-center rounded-2xl bg-[#F6F6F6] px-4 py-5 text-center">
            <span className={expression ? 'break-all font-mono text-2xl font-medium text-[#111111] md:text-3xl' : 'text-[#B0B0B0]'}>
              {expression || '숫자와 연산자를 선택하세요'}
              {expression && <span className="text-[#B0B0B0]"> = {puzzle.target}</span>}
            </span>
          </div>

          {!isCorrect && (
            <>
              <div className="mt-6 grid grid-cols-6 gap-2 md:gap-3">
                {operators.map((operator) => (
                  <button
                    key={operator}
                    type="button"
                    onClick={() => appendSymbol(operator)}
                    className="flex h-12 items-center justify-center rounded-xl border border-[#E2E2E2] bg-white text-xl font-medium transition-colors hover:border-[#111111] hover:bg-[#FAFAFA] md:h-14 md:text-2xl"
                  >
                    {operator}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex justify-center gap-4 text-sm">
                <button type="button" onClick={undo} disabled={!tokens.length} className="text-[#777777] hover:text-[#111111] disabled:text-[#CCCCCC]">
                  ↶ 되돌리기
                </button>
                <span className="text-[#D5D5D5]">|</span>
                <button type="button" onClick={reset} disabled={!tokens.length} className="text-[#777777] hover:text-[#111111] disabled:text-[#CCCCCC]">
                  전체 지우기
                </button>
              </div>
            </>
          )}

          <div className={`min-h-12 py-4 text-center text-sm font-medium ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`} aria-live="polite">
            {isCorrect ? '금고가 열렸습니다!' : message}
          </div>

          {isCorrect ? (
            <button type="button" onClick={nextPuzzle} className="w-full rounded-2xl bg-[#111111] py-4 font-medium text-white hover:bg-[#292929]">
              다음 금고 열기
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!tokens.length}
              className="w-full rounded-2xl bg-[#111111] py-4 font-medium text-white transition-all hover:bg-[#292929] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#D5D5D5]"
            >
              금고 열기
            </button>
          )}
        </section>
      </main>

      {isHelpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsHelpOpen(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="vault-help-title" className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl md:p-9">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-[0.18em] text-[#8A8A8A]">HOW TO PLAY</span>
                <h2 id="vault-help-title" className="mt-2 text-2xl font-semibold">숫자 금고 게임 방법</h2>
              </div>
              <button type="button" onClick={() => setIsHelpOpen(false)} aria-label="도움말 닫기" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F2F2] text-xl text-[#666666]">×</button>
            </div>
            <ol className="space-y-3 text-sm leading-relaxed text-[#666666]">
              <li><strong className="text-[#111111]">1.</strong> 숫자 카드를 원하는 순서로 선택합니다.</li>
              <li><strong className="text-[#111111]">2.</strong> 모든 카드를 정확히 한 번씩 사용합니다.</li>
              <li><strong className="text-[#111111]">3.</strong> 연산자와 괄호를 조합해 목표 숫자를 만들면 성공입니다.</li>
            </ol>
            <div className="my-7 rounded-2xl bg-[#F6F6F6] p-5 text-center">
              <p className="text-xs font-semibold tracking-[0.15em] text-[#8A8A8A]">EXAMPLE</p>
              <p className="mt-4 font-mono text-xl font-medium">2, 3, 4 → 목표 20</p>
              <p className="mt-3 font-mono text-lg text-[#555555]">(2 + 3) × 4 = 20</p>
            </div>
            <p className="mb-6 text-sm text-[#8A8A8A]">나눗셈은 결과가 정수일 때만 사용할 수 있습니다.</p>
            <button type="button" onClick={() => setIsHelpOpen(false)} className="w-full rounded-2xl bg-[#111111] py-4 font-medium text-white hover:bg-[#292929]">
              금고 열기 시작
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
