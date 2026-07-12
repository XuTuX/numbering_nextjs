'use client';

import { useState, useEffect, useMemo } from 'react';
import GameHeader from '@/components/game/GameHeader';
import EquationEditor from '@/components/game/EquationEditor';

import CorrectAnswerOverlay from '@/components/game/CorrectAnswerOverlay';
import GameActions from '@/components/game/GameActions';
import OperatorPalette from '@/components/game/OperatorPalette';

import { GeneratedPuzzle, getDifficultyForRound, SoloGameState } from '@/features/formula-workshop/types';
import { InlineOperator } from '@/lib/equation/types';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { generatePuzzle } from '@/features/formula-workshop/lib/generatePuzzle';
import { validateEquation } from '@/lib/equation/validateEquation';
import { buildExpression } from '@/lib/equation/buildExpression';
import { createOperatorSlots, createParenthesisRange } from '@/lib/equation/editorState';

interface FormulaWorkshopGameProps {
  initialPuzzle: GeneratedPuzzle;
}

function createPlayingState(puzzle: GeneratedPuzzle): SoloGameState {
  return {
    puzzle,
    digits: puzzle.digits,
    operatorSlots: createOperatorSlots(puzzle.digits.length),
    parentheses: [],
    selection: { type: 'none' },
    hintCount: 3,
    startedAt: Date.now(),
    status: 'playing',
    difficulty: puzzle.difficulty,
  };
}

export default function FormulaWorkshopGame({ initialPuzzle }: FormulaWorkshopGameProps) {
  const [gameState, setGameState] = useState<SoloGameState>({
    ...createPlayingState(initialPuzzle),
  });
  const [round, setRound] = useState(1);

  const [timer, setTimer] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [lastChangedSlotIndex, setLastChangedSlotIndex] = useState<number | null>(null);
  const [activeDragOperator, setActiveDragOperator] = useState<InlineOperator | null>(null);

  // Configure dnd-kit sensors for both pointer (mouse) and touch with very low activation threshold
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 100, tolerance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const currentExpression = buildExpression(
    gameState.digits,
    gameState.operatorSlots,
    gameState.parentheses,
  );
  const isSolved = useMemo(() => {
    if (gameState.status !== 'playing' || !gameState.puzzle || !currentExpression) {
      return false;
    }
    const result = validateEquation(currentExpression, gameState.puzzle.digitString);
    return result.valid && result.isCorrect;
  }, [currentExpression, gameState.status, gameState.puzzle]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.status === 'playing' && !isSolved) {
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - gameState.startedAt) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.status, gameState.startedAt, isSolved]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startNewPuzzle = (nextRound: number) => {
    const difficulty = getDifficultyForRound(nextRound);
    const puzzle = generatePuzzle(difficulty);
    setRound(nextRound);
    setGameState(createPlayingState(puzzle));
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

      const result = createParenthesisRange(startDigitIndex, endDigitIndex, prev.parentheses);
      if (!result.valid) {
        setWarningMessage(result.message);
        return { ...prev, selection: { type: 'none' } };
      }

      return {
        ...prev,
        parentheses: [...prev.parentheses, result.range],
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

  const handleDragStart = (event: DragStartEvent) => {
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
        <GameHeader
          mode="수식 공방 · SOLO"
          stage={`ROUND ${round} · ${gameState.difficulty}`}
          timer={formatTimer(timer)}
        />

        <main className="flex-grow flex flex-col justify-center pb-10">
          <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {/* Main Numbering Workspace Editor */}
                <EquationEditor
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
                  <OperatorPalette />
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
              <GameActions
                hintCount={gameState.hintCount}
                onHintClick={handleHintClick}
                onResetClick={handleResetClick}
              />
          </>
        </main>
      </div>

      <CorrectAnswerOverlay
        status={isSolved ? 'correct' : 'wrong'}
        onNext={() => startNewPuzzle(round + 1)}
      />
    </div>
  );
}
