'use client';

import { useState, useEffect, useMemo } from 'react';
import SoloGameHeader from '@/components/SoloGameHeader';
import NumberingEditor from '@/components/NumberingEditor';

import DifficultySelector from '@/components/DifficultySelector';
import PuzzleResultModal from '@/components/PuzzleResultModal';
import BottomGameActions from '@/components/BottomGameActions';
import InlineOperatorMenu from '@/components/InlineOperatorMenu';

import { SoloGameState, PuzzleDifficulty } from '@/lib/puzzleTypes';
import { InlineOperator } from '@/types/game';
import { generatePuzzle } from '@/lib/puzzleGenerator';
import { validateEquation } from '@/lib/expressionValidator';
import { buildExpression } from '@/lib/expression';

export default function SoloGamePage() {
  const [gameState, setGameState] = useState<SoloGameState>({
    puzzle: null,
    digits: [],
    operatorSlots: [],
    parentheses: [],
    selection: { type: 'none' },
    hintCount: 3,
    startedAt: 0,
    status: 'idle',
    difficulty: 'EASY',
  });

  const [timer, setTimer] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [lastChangedSlotIndex, setLastChangedSlotIndex] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.status === 'playing') {
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - gameState.startedAt) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.status, gameState.startedAt]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startNewPuzzle = (difficulty: PuzzleDifficulty) => {
    const puzzle = generatePuzzle(difficulty);
    const operatorSlots = Array.from({ length: puzzle.digits.length - 1 }).map((_, i) => ({
      index: i,
      operator: null,
    }));

    setGameState({
      puzzle,
      digits: puzzle.digits,
      operatorSlots,
      parentheses: [],
      selection: { type: 'none' },
      hintCount: 3,
      startedAt: Date.now(),
      status: 'playing',
      difficulty,
    });
    setTimer(0);
    setWarningMessage('');
    setLastChangedSlotIndex(null);
  };

  // Handle range selection by tapping digits
  const handleDigitClick = (index: number) => {
    if (gameState.status !== 'playing') return;
    setWarningMessage('');

    setGameState(prev => {
      const selection = prev.selection;

      if (selection.type !== 'range') {
        return {
          ...prev,
          selection: { type: 'range', startDigitIndex: index, endDigitIndex: null },
        };
      }

      const { startDigitIndex, endDigitIndex } = selection;

      // 1. Start is selected and user clicked it again -> deselect
      if (startDigitIndex === index && endDigitIndex === null) {
        return {
          ...prev,
          selection: { type: 'none' },
        };
      }

      if (endDigitIndex !== null) {
        const start = Math.min(startDigitIndex, endDigitIndex);
        const end = Math.max(startDigitIndex, endDigitIndex);
        if (start <= index && index <= end) {
          return {
            ...prev,
            selection: { type: 'none' },
          };
        }
      }

      // 2. Start is selected, user clicked a different digit -> set end
      if (endDigitIndex === null) {
        return {
          ...prev,
          selection: { type: 'range', startDigitIndex, endDigitIndex: index },
        };
      }

      // 3. Both selected, clicking outside the range -> reset selection to new start
      return {
        ...prev,
        selection: { type: 'range', startDigitIndex: index, endDigitIndex: null },
      };
    });
  };

  // wrap selection with parentheses
  const handleWrapParentheses = () => {
    if (gameState.status !== 'playing') return;
    if (gameState.selection.type !== 'range' || gameState.selection.endDigitIndex === null) return;
    const { startDigitIndex, endDigitIndex } = gameState.selection;

    const start = Math.min(startDigitIndex, endDigitIndex);
    const end = Math.max(startDigitIndex, endDigitIndex);

    // Validate boundaries
    // 1. Is there an identical parenthesis range?
    const exactDuplicate = gameState.parentheses.some(
      p => p.startDigitIndex === start && p.endDigitIndex === end
    );
    if (exactDuplicate) {
      setWarningMessage('이미 동일한 범위가 괄호로 묶여 있습니다.');
      return;
    }

    // 2. Do they cross?
    // Parentheses cross if they partially overlap.
    const crossing = gameState.parentheses.some(p => {
      const A = p.startDigitIndex;
      const B = p.endDigitIndex;
      return (start < A && A < end && end < B) || (A < start && start < B && B < end);
    });

    if (crossing) {
      setWarningMessage('괄호 범위가 서로 교차할 수 없습니다.');
      return;
    }

    setGameState(prev => {
      const newParenthesis = {
        id: Math.random().toString(36).substring(2, 9),
        startDigitIndex: start,
        endDigitIndex: end,
      };

      return {
        ...prev,
        parentheses: [...prev.parentheses, newParenthesis],
        selection: { type: 'none' },
      };
    });
    setWarningMessage('');
  };

  const handleDeleteParenthesis = (id: string) => {
    setGameState(prev => ({
      ...prev,
      parentheses: prev.parentheses.filter(p => p.id !== id),
      selection: { type: 'none' },
    }));
    setWarningMessage('');
  };

  const handleSelectSlot = (index: number) => {
    if (gameState.status !== 'playing') return;
    setWarningMessage('');
    setGameState(prev => ({
      ...prev,
      selection: prev.operatorSlots.find((slot) => slot.index === index)?.operator
        ? { type: 'operator', slotIndex: index }
        : { type: 'slot', slotIndex: index },
    }));
  };

  const handleSelectOperator = (index: number, op: InlineOperator | null) => {
    if (gameState.status !== 'playing') return;
    setWarningMessage('');
    setGameState(prev => {
      const newSlots = prev.operatorSlots.map(s => {
        if (s.index === index) {
          return { ...s, operator: op };
        }
        return s;
      });

      return {
        ...prev,
        operatorSlots: newSlots,
        selection: { type: 'none' },
      };
    });

    setLastChangedSlotIndex(index);
    setTimeout(() => {
      setLastChangedSlotIndex(prev => prev === index ? null : prev);
    }, 300);
  };

  const handleResetClick = () => {
    if (gameState.status !== 'playing') return;
    setGameState(prev => ({
      ...prev,
      operatorSlots: prev.operatorSlots.map(s => ({ ...s, operator: null })),
      parentheses: [],
      selection: { type: 'none' },
    }));
    setLastChangedSlotIndex(null);
    setWarningMessage('');
  };

  const handleClearSelection = () => {
    if (gameState.status !== 'playing') return;
    setGameState(prev => ({
      ...prev,
      selection: { type: 'none' },
    }));
  };

  const currentExpression = buildExpression(
    gameState.digits,
    gameState.operatorSlots,
    gameState.parentheses
  );

  const validationMessage = useMemo(() => {
    if (gameState.status === 'playing' && gameState.puzzle) {
      if (!currentExpression) {
        return '';
      }

      const result = validateEquation(currentExpression, gameState.puzzle.digitString);
      if (!result.valid) {
        if (result.message === '등호가 필요합니다.') {
          return '';
        }
        return result.message;
      }
      if (!result.isCorrect) {
        return '좌변과 우변의 값이 다릅니다.';
      }
      return '';
    }
    return '';
  }, [currentExpression, gameState.status, gameState.puzzle]);

  const handleSubmit = () => {
    if (!gameState.puzzle) return;
    const result = validateEquation(currentExpression, gameState.puzzle.digitString);

    if (result.valid && result.isCorrect) {
      setGameState(prev => ({ ...prev, status: 'correct' }));
    } else {
      setGameState(prev => ({ ...prev, status: 'wrong' }));
      setTimeout(() => {
        setGameState(prev => (prev.status === 'wrong' ? { ...prev, status: 'playing' } : prev));
      }, 1500);
    }
  };

  const handleHintClick = () => {
    if (gameState.hintCount > 0 && gameState.status === 'playing' && gameState.puzzle) {
      setGameState(prev => ({ ...prev, hintCount: prev.hintCount - 1 }));

      const hints = [
        `이 문제에는 '${gameState.puzzle.usedOperators[Math.floor(Math.random() * gameState.puzzle.usedOperators.length)]}' 기호가 포함됩니다.`,
        gameState.puzzle.usedOperators.includes('(') ? '이 문제에는 괄호가 필요합니다.' : '이 문제에는 괄호가 필요하지 않습니다.',
        `결과값은 ${gameState.puzzle.answerExpression.split('=')[1].trim()} 입니다.`,
      ];
      const randomHint = hints[Math.floor(Math.random() * hints.length)];
      setWarningMessage(`힌트: ${randomHint}`);
    }
  };

  const isSubmitEnabled = gameState.status === 'playing' && currentExpression.includes('=');
  const displayMessage = warningMessage || validationMessage;
  const hasSelectedRange =
    gameState.selection.type === 'range' && gameState.selection.endDigitIndex !== null;

  const selectedSlotIndex =
    gameState.selection.type === 'slot' || gameState.selection.type === 'operator'
      ? gameState.selection.slotIndex
      : null;

  const selStart =
    gameState.selection.type === 'range'
      ? Math.min(
          gameState.selection.startDigitIndex,
          gameState.selection.endDigitIndex ?? gameState.selection.startDigitIndex
        )
      : null;
  const selEnd =
    gameState.selection.type === 'range'
      ? Math.max(
          gameState.selection.startDigitIndex,
          gameState.selection.endDigitIndex ?? gameState.selection.startDigitIndex
        )
      : null;

  const exactParenthesisMatch = hasSelectedRange
    ? gameState.parentheses.find(
        (p) => p.startDigitIndex === selStart && p.endDigitIndex === selEnd
      )
    : null;
  const selectedParenthesisId = exactParenthesisMatch ? exactParenthesisMatch.id : null;

  return (
    <div
      className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center px-4 md:px-8 py-8 md:py-12 selection:bg-gray-200 font-sans"
      onClick={handleClearSelection}
    >
      <div className="w-full max-w-3xl flex flex-col flex-grow">
        <SoloGameHeader
          mode="SOLO"
          stage={gameState.difficulty}
          timer={gameState.status === 'idle' ? '00:00' : formatTimer(timer)}
        />

        <main className="flex-grow flex flex-col justify-center pb-10">
          {gameState.status === 'idle' ? (
            <DifficultySelector onSelect={startNewPuzzle} />
          ) : (
            <>
              {/* Main Numbering Workspace Editor */}
              <NumberingEditor
                difficulty={gameState.difficulty}
                digits={gameState.digits}
                operatorSlots={gameState.operatorSlots}
                parentheses={gameState.parentheses}
                selection={gameState.selection}
                lastChangedSlotIndex={lastChangedSlotIndex}
                onDigitClick={handleDigitClick}
                onSelectSlot={handleSelectSlot}
              />

              {/* 
                Unified Equation Preview was removed per user request.
                If any validation messages exist, they could still be shown, 
                but for now we omit the entire block to keep the UI clean.
              */}
              {displayMessage && (
                <div className="mt-4 min-h-[24px] text-center text-sm font-medium text-red-500">
                  {displayMessage}
                </div>
              )}

              <div className="mb-4 flex min-h-[96px] items-center justify-center">
                {selectedSlotIndex !== null && (
                  <InlineOperatorMenu
                    currentOperator={
                      gameState.operatorSlots.find((s) => s.index === selectedSlotIndex)?.operator ?? null
                    }
                    onSelect={(newOperator) =>
                      handleSelectOperator(selectedSlotIndex, newOperator)
                    }
                  />
                )}

                {hasSelectedRange && (selEnd! - selStart! >= 2 || selectedParenthesisId) && (
                  <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center gap-2 p-2 animate-in fade-in zoom-in duration-200">
                    <div className="text-xs font-medium text-gray-500">
                      {selectedParenthesisId ? '선택한 범위의 괄호를 해제할 수 있습니다.' : '선택한 범위를 괄호로 묶을 수 있습니다.'}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
                      {selectedParenthesisId ? (
                        <button
                          onClick={() => handleDeleteParenthesis(selectedParenthesisId)}
                          className="px-8 h-12 flex items-center justify-center rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all"
                        >
                          삭제
                        </button>
                      ) : (
                        selEnd! - selStart! >= 2 && (
                          <button
                            onClick={handleWrapParentheses}
                            className="px-8 h-12 flex items-center justify-center rounded-xl text-sm font-semibold bg-[#111111] text-white hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            ( ) 묶기
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Gameplay Actions */}
              <BottomGameActions
                difficulty={gameState.difficulty}
                hintCount={gameState.hintCount}
                isSubmitEnabled={isSubmitEnabled}
                onHintClick={handleHintClick}
                onResetClick={handleResetClick}
                onSubmitClick={handleSubmit}
              />
            </>
          )}
        </main>
      </div>

      <PuzzleResultModal
        status={gameState.status as 'correct' | 'wrong'}
        puzzle={gameState.puzzle}
        onNext={() => startNewPuzzle(gameState.difficulty)}
      />
    </div>
  );
}
