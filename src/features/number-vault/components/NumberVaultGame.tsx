'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  closestCenter,
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import GameActions from '@/components/game/GameActions';
import OperatorPalette from '@/components/game/OperatorPalette';
import CorrectAnswerOverlay from '@/components/game/CorrectAnswerOverlay';
import GameHeader from '@/components/game/GameHeader';
import NumberVaultEditor, { VaultDigit } from '@/features/number-vault/components/NumberVaultEditor';
import { createNumberVaultPuzzle, NumberVaultPuzzle } from '@/features/number-vault/lib/createPuzzle';
import { buildExpression } from '@/lib/equation/buildExpression';
import { evaluateExpression } from '@/lib/equation/evaluateExpression';
import { InlineOperator, OperatorSlot, ParenthesisRange } from '@/lib/equation/types';
import { createOperatorSlots, createParenthesisRange } from '@/lib/equation/editorState';

interface NumberVaultGameProps {
  initialPuzzle: NumberVaultPuzzle;
}

function makeDigits(numbers: number[]): VaultDigit[] {
  return numbers.map((value, index) => ({ id: `${index}-${value}`, value }));
}

function makeSlots(length: number): OperatorSlot[] {
  return createOperatorSlots(length);
}

const collisionDetection: CollisionDetection = (args) => {
  const type = args.active.data.current?.type;
  const targetType = type === 'vault-digit' ? 'vault-digit-position' : 'vault-operator-slot';
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (container) => container.data.current?.type === targetType,
    ),
  });
};

export default function NumberVaultGame({ initialPuzzle }: NumberVaultGameProps) {
  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [round, setRound] = useState(1);
  const [digits, setDigits] = useState(() => makeDigits(initialPuzzle.numbers));
  const [operatorSlots, setOperatorSlots] = useState(() => makeSlots(initialPuzzle.numbers.length));
  const [parentheses, setParentheses] = useState<ParenthesisRange[]>([]);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [hintCount, setHintCount] = useState(3);
  const [timer, setTimer] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [lastChangedSlotIndex, setLastChangedSlotIndex] = useState<number | null>(null);
  const [activeOperator, setActiveOperator] = useState<InlineOperator | null>(null);
  const [activeDigit, setActiveDigit] = useState<number | null>(null);
  const justDraggedDigit = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 7 } }),
    useSensor(KeyboardSensor),
  );

  const expression = buildExpression(
    digits.map((digit) => String(digit.value)),
    operatorSlots,
    parentheses,
  );
  const evaluation = useMemo(() => evaluateExpression(expression), [expression]);
  const hasAllOperators = operatorSlots.every((slot) => slot.operator !== null);
  const isSolved = hasAllOperators && evaluation.valid && evaluation.value === puzzle.target;

  useEffect(() => {
    if (isSolved) return;
    const interval = setInterval(() => setTimer((current) => current + 1), 1000);
    return () => clearInterval(interval);
  }, [isSolved, puzzle]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainder = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    setWarningMessage('');
    setSelectionStart(null);
    if (data?.type === 'operator') setActiveOperator(data.operator as InlineOperator);
    if (data?.type === 'vault-digit') {
      justDraggedDigit.current = true;
      setActiveDigit(data.value as number);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveOperator(null);
    setActiveDigit(null);
    setTimeout(() => {
      justDraggedDigit.current = false;
    }, 0);
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'vault-digit' && overData?.type === 'vault-digit-position') {
      const fromIndex = digits.findIndex((digit) => digit.id === active.id);
      const toIndex = overData.index as number;
      if (fromIndex === -1 || fromIndex === toIndex) return;
      setDigits((current) => {
        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
      setParentheses([]);
      return;
    }

    if (activeData?.type === 'operator' && overData?.type === 'vault-operator-slot') {
      const index = overData.index as number;
      const operator = activeData.operator as InlineOperator;
      if (operator === '=') return;
      setOperatorSlots((current) =>
        current.map((slot) => (slot.index === index ? { ...slot, operator } : slot)),
      );
      setLastChangedSlotIndex(index);
      setTimeout(() => setLastChangedSlotIndex((current) => current === index ? null : current), 300);
    }
  };

  const handleDigitClick = (index: number) => {
    if (justDraggedDigit.current) return;
    if (selectionStart === null) {
      setSelectionStart(index);
      setWarningMessage('괄호로 묶을 마지막 숫자를 선택하세요.');
      return;
    }
    if (selectionStart === index) {
      setSelectionStart(null);
      setWarningMessage('');
      return;
    }

    const result = createParenthesisRange(selectionStart, index, parentheses);
    if (!result.valid) {
      setWarningMessage(result.message);
    } else {
      setParentheses((current) => [...current, result.range]);
      setWarningMessage('');
    }
    setSelectionStart(null);
  };

  const reset = () => {
    setDigits(makeDigits(puzzle.numbers));
    setOperatorSlots(makeSlots(puzzle.numbers.length));
    setParentheses([]);
    setSelectionStart(null);
    setWarningMessage('');
    setLastChangedSlotIndex(null);
  };

  const showHint = () => {
    if (hintCount <= 0) return;
    const answerOperators = puzzle.answerExpression.match(/[+\-×÷]/g) ?? [];
    const hint = answerOperators[Math.floor(Math.random() * answerOperators.length)];
    setHintCount((current) => current - 1);
    setWarningMessage(`힌트: 정답 수식에는 '${hint}' 기호가 포함됩니다.`);
  };

  const nextPuzzle = () => {
    const nextRound = round + 1;
    const next = createNumberVaultPuzzle(nextRound);
    setRound(nextRound);
    setPuzzle(next);
    setDigits(makeDigits(next.numbers));
    setOperatorSlots(makeSlots(next.numbers.length));
    setParentheses([]);
    setSelectionStart(null);
    setHintCount(3);
    setTimer(0);
    setWarningMessage('');
    setLastChangedSlotIndex(null);
  };

  const validationMessage = hasAllOperators && evaluation.valid && evaluation.value !== puzzle.target
    ? `현재 값은 ${evaluation.value}입니다. 목표 ${puzzle.target}을 만들어보세요.`
    : '';

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center px-4 md:px-8 py-8 md:py-12 selection:bg-gray-200 font-sans">
      <div className="w-full max-w-3xl flex flex-col flex-grow">
        <GameHeader
          mode="숫자 금고 · SOLO"
          stage={`ROUND ${round} · ${puzzle.difficulty}`}
          timer={formatTimer(timer)}
          backHref="/games/number-vault"
        />

        <main className="flex-grow flex flex-col justify-center pb-10">
          <div className="mb-1 text-center">
            <span className="text-xs font-semibold tracking-[0.18em] text-[#8A8A8A]">TARGET</span>
            <div className="mt-1 text-4xl font-semibold tracking-tight text-[#111111]">{puzzle.target}</div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
              setActiveOperator(null);
              setActiveDigit(null);
              justDraggedDigit.current = false;
            }}
          >
            <NumberVaultEditor
              digits={digits}
              operatorSlots={operatorSlots}
              parentheses={parentheses}
              selectionStart={selectionStart}
              lastChangedSlotIndex={lastChangedSlotIndex}
              onDigitClick={handleDigitClick}
              onParenthesisClick={(id) => setParentheses((current) => current.filter((range) => range.id !== id))}
              onOperatorClick={(index) => setOperatorSlots((current) => current.map((slot) => slot.index === index ? { ...slot, operator: null } : slot))}
            />

            {(warningMessage || validationMessage) && (
              <div className="mt-4 min-h-[24px] text-center text-sm font-medium text-red-500">
                {warningMessage || validationMessage}
              </div>
            )}

            <div className="mb-4 flex flex-col items-center justify-center">
              <OperatorPalette operators={['+', '-', '×', '÷']} />
            </div>

            <DragOverlay dropAnimation={null}>
              {activeOperator ? (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl text-3xl font-light text-gray-800 border border-gray-100 scale-110 touch-none">{activeOperator}</div>
              ) : activeDigit !== null ? (
                <div className="flex h-20 min-w-14 items-center justify-center text-6xl font-medium text-[#111111] drop-shadow-sm">{activeDigit}</div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <GameActions
            hintCount={hintCount}
            onHintClick={showHint}
            onResetClick={reset}
          />
        </main>
      </div>

      <CorrectAnswerOverlay status={isSolved ? 'correct' : 'wrong'} onNext={nextPuzzle} />
    </div>
  );
}
