'use client';

import { useState, useEffect, useMemo } from 'react';
import SoloGameHeader from '@/components/SoloGameHeader';
import NumberingEditor from '@/components/NumberingEditor';

import DifficultySelector from '@/components/DifficultySelector';
import PuzzleResultModal from '@/components/PuzzleResultModal';
import BottomGameActions from '@/components/BottomGameActions';
import DraggableOperatorBar from '@/components/DraggableOperatorBar';

import { SoloGameState, PuzzleDifficulty } from '@/lib/puzzleTypes';
import { InlineOperator } from '@/types/game';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
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
  const [activeDragOperator, setActiveDragOperator] = useState<InlineOperator | null>(null);

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

  // Handle drag selection
  const handleDigitPointerDown = (index: number) => {
    if (gameState.status !== 'playing') return;
    setWarningMessage('');

    setGameState(prev => {
      // 괄호가 없다면 새로운 범위 선택 시작
      return {
        ...prev,
        selection: { type: 'range', startDigitIndex: index, endDigitIndex: null }
      };
    });
  };

  const handleDigitPointerEnter = (index: number) => {
    if (gameState.status !== 'playing') return;
    
    setGameState(prev => {
      if (prev.selection.type !== 'range') return prev;
      return {
        ...prev,
        selection: { ...prev.selection, endDigitIndex: index }
      };
    });
  };

  const handleDigitPointerUp = () => {
    if (gameState.status !== 'playing') return;
    
    setGameState(prev => {
      if (prev.selection.type !== 'range') return prev;
      const { startDigitIndex, endDigitIndex } = prev.selection;
      
      // 1개만 선택된 채 끝났으면 그냥 선택 해제
      if (endDigitIndex === null || Math.abs(endDigitIndex - startDigitIndex) < 1) {
        return { ...prev, selection: { type: 'none' } };
      }

      const start = Math.min(startDigitIndex, endDigitIndex);
      const end = Math.max(startDigitIndex, endDigitIndex);

      // Validate boundaries
      const exactDuplicate = prev.parentheses.some(
        p => p.startDigitIndex === start && p.endDigitIndex === end
      );
      if (exactDuplicate) {
        setWarningMessage('이미 동일한 범위가 괄호로 묶여 있습니다.');
        return { ...prev, selection: { type: 'none' } };
      }

      const crossing = prev.parentheses.some(p => {
        const A = p.startDigitIndex;
        const B = p.endDigitIndex;
        return (start < A && A < end && end < B) || (A < start && start < B && B < end);
      });
      if (crossing) {
        setWarningMessage('괄호 범위가 서로 교차할 수 없습니다.');
        return { ...prev, selection: { type: 'none' } };
      }

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
    
    // 클릭 시 연산자 삭제 (드래그 앤 드롭이므로 팝업 없이 직접 삭제만 수행)
    setGameState(prev => {
      const newSlots = prev.operatorSlots.map(s => {
        if (s.index === index) {
          return { ...s, operator: null };
        }
        return s;
      });
      return {
        ...prev,
        operatorSlots: newSlots,
        selection: { type: 'none' },
      };
    });
  };

  const handleOperatorDrop = (index: number, op: InlineOperator) => {
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

  const handleDragStart = (event: any) => {
    setActiveDragOperator(event.active.data.current?.operator || null);
    setWarningMessage('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragOperator(null);
    const { active, over } = event;
    if (over && over.data.current) {
      const slotIndex = over.data.current.index;
      const op = active.data.current?.operator as InlineOperator;
      if (op && slotIndex !== undefined) {
        handleOperatorDrop(slotIndex, op);
      }
    }
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

  // 자동 제출 로직 (정답 시 자동으로 status 변경)
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.puzzle && currentExpression) {
      const result = validateEquation(currentExpression, gameState.puzzle.digitString);
      if (result.valid && result.isCorrect) {
        setGameState(prev => ({ ...prev, status: 'correct' }));
      }
    }
  }, [currentExpression, gameState.status, gameState.puzzle]);

  // 수동 제출 함수 제거 (자동 제출로 대체)

  const handleHintClick = () => {
    if (gameState.hintCount > 0 && gameState.status === 'playing' && gameState.puzzle) {
      setGameState(prev => ({ ...prev, hintCount: prev.hintCount - 1 }));

      const answerValidation = validateEquation(
        gameState.puzzle.answerExpression,
        gameState.puzzle.digitString
      );
      const valueHint = answerValidation.valid
        ? `등호 양쪽의 값은 ${answerValidation.leftValue} 입니다.`
        : '정답 수식은 등호 양쪽이 같은 값이 됩니다.';

      const hints = [
        `이 문제에는 '${gameState.puzzle.usedOperators[Math.floor(Math.random() * gameState.puzzle.usedOperators.length)]}' 기호가 포함됩니다.`,
        gameState.puzzle.usedOperators.includes('(') ? '이 문제에는 괄호가 필요합니다.' : '이 문제에는 괄호가 필요하지 않습니다.',
        valueHint,
      ];
      const randomHint = hints[Math.floor(Math.random() * hints.length)];
      setWarningMessage(`힌트: ${randomHint}`);
    }
  };

  const displayMessage = warningMessage || validationMessage;

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
              <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {/* Main Numbering Workspace Editor */}
                <NumberingEditor
                  difficulty={gameState.difficulty}
                  digits={gameState.digits}
                  operatorSlots={gameState.operatorSlots}
                  parentheses={gameState.parentheses}
                  selection={gameState.selection}
                  lastChangedSlotIndex={lastChangedSlotIndex}
                  onDigitPointerDown={handleDigitPointerDown}
                  onDigitPointerEnter={handleDigitPointerEnter}
                  onDigitPointerUp={handleDigitPointerUp}
                  onParenthesisClick={handleDeleteParenthesis}
                  onSelectSlot={handleSelectSlot}
                  onOperatorDrop={handleOperatorDrop}
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

                <div className="mb-4 flex flex-col items-center justify-center">
                  <DraggableOperatorBar />
                </div>
                
                <DragOverlay dropAnimation={null}>
                  {activeDragOperator ? (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl text-3xl font-light text-gray-800 border border-gray-100 scale-110 touch-none">
                      {activeDragOperator}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Bottom Gameplay Actions */}
              <BottomGameActions
                difficulty={gameState.difficulty}
                hintCount={gameState.hintCount}
                onHintClick={handleHintClick}
                onResetClick={handleResetClick}
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
