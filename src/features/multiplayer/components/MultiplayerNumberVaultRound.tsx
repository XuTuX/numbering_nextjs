'use client';

import { useState } from 'react';
import {
  closestCenter,
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import NumberVaultEditor, { VaultDigit } from '@/features/number-vault/components/NumberVaultEditor';
import OperatorPalette from '@/components/game/OperatorPalette';
import { getSocket } from '@/features/multiplayer/lib/socket';
import { MultiplayerPuzzle, SubmissionResponse } from '@/features/multiplayer/types';
import { buildExpression } from '@/lib/equation/buildExpression';
import { createOperatorSlots, createParenthesisRange } from '@/lib/equation/editorState';
import { InlineOperator, OperatorSlot, ParenthesisRange } from '@/lib/equation/types';

interface MultiplayerNumberVaultRoundProps {
  puzzle: Extract<MultiplayerPuzzle, { mode: 'number-vault' }>;
  roomId: string;
}

function makeDigits(numbers: number[]): VaultDigit[] {
  return numbers.map((value, index) => ({ id: `${index}-${value}`, value }));
}

const collisionDetection: CollisionDetection = (args) => {
  const targetType = args.active.data.current?.type === 'vault-digit'
    ? 'vault-digit-position'
    : 'vault-operator-slot';
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (container) => container.data.current?.type === targetType,
    ),
  });
};

export default function MultiplayerNumberVaultRound({ puzzle, roomId }: MultiplayerNumberVaultRoundProps) {
  const [digits, setDigits] = useState(() => makeDigits(puzzle.numbers));
  const [operatorSlots, setOperatorSlots] = useState<OperatorSlot[]>(() => createOperatorSlots(puzzle.numbers.length));
  const [parentheses, setParentheses] = useState<ParenthesisRange[]>([]);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [activeOperator, setActiveOperator] = useState<InlineOperator | null>(null);
  const [activeDigit, setActiveDigit] = useState<number | null>(null);
  const [lastChangedSlotIndex, setLastChangedSlotIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const [solved, setSolved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 7 } }),
  );
  const expression = buildExpression(
    digits.map((digit) => String(digit.value)),
    operatorSlots,
    parentheses,
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    setFeedback(null);
    setSelectionStart(null);
    if (data?.type === 'operator') setActiveOperator(data.operator as InlineOperator);
    if (data?.type === 'vault-digit') setActiveDigit(data.value as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveOperator(null);
    setActiveDigit(null);
    if (!event.over) return;
    const activeData = event.active.data.current;
    const overData = event.over.data.current;

    if (activeData?.type === 'vault-digit' && overData?.type === 'vault-digit-position') {
      const fromIndex = digits.findIndex((digit) => digit.id === event.active.id);
      const toIndex = overData.index as number;
      if (fromIndex >= 0 && fromIndex !== toIndex) {
        setDigits((current) => {
          const next = [...current];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return next;
        });
        setParentheses([]);
      }
      return;
    }

    if (activeData?.type === 'operator' && overData?.type === 'vault-operator-slot') {
      const index = overData.index as number;
      const operator = activeData.operator as InlineOperator;
      if (operator === '=') return;
      setOperatorSlots((current) => current.map((slot) => slot.index === index ? { ...slot, operator } : slot));
      setLastChangedSlotIndex(index);
    }
  };

  const handleDigitClick = (index: number) => {
    if (selectionStart === null) {
      setSelectionStart(index);
      setFeedback({ message: '괄호로 묶을 마지막 숫자를 선택하세요.', success: false });
      return;
    }
    const result = createParenthesisRange(selectionStart, index, parentheses);
    setSelectionStart(null);
    if (!result.valid) {
      setFeedback({ message: result.message, success: false });
      return;
    }
    setParentheses((current) => [...current, result.range]);
    setFeedback(null);
  };

  const reset = () => {
    setDigits(makeDigits(puzzle.numbers));
    setOperatorSlots(createOperatorSlots(puzzle.numbers.length));
    setParentheses([]);
    setSelectionStart(null);
    setFeedback(null);
  };

  const submit = () => {
    if (operatorSlots.some((slot) => slot.operator === null)) {
      setFeedback({ message: '모든 숫자 사이에 연산자를 넣어주세요.', success: false });
      return;
    }
    getSocket().emit('submit_vault', { roomId, expression }, (response: SubmissionResponse) => {
      if (response.success) {
        setSolved(true);
        setFeedback({ message: '금고를 열었습니다! 1점을 획득했습니다.', success: true });
      } else {
        setFeedback({ message: response.message, success: false });
      }
    });
  };

  return (
    <section className="w-full max-w-3xl rounded-3xl border border-[#EAEAEA] bg-white p-5 shadow-sm md:p-8">
      <div className="text-center"><span className="text-xs font-semibold tracking-[0.18em] text-[#8A8A8A]">TARGET</span><div className="mt-1 text-4xl font-semibold">{puzzle.target}</div></div>
      <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
        {!solved && <div className="flex justify-center"><OperatorPalette operators={['+', '-', '×', '÷']} /></div>}
        <DragOverlay dropAnimation={null}>
          {activeOperator ? <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-xl">{activeOperator}</div> : activeDigit !== null ? <div className="text-6xl font-medium">{activeDigit}</div> : null}
        </DragOverlay>
      </DndContext>
      <div className={`min-h-12 py-4 text-center text-sm font-medium ${feedback?.success ? 'text-emerald-600' : 'text-red-500'}`}>{feedback?.message}</div>
      <div className="flex gap-3">
        <button type="button" onClick={reset} disabled={solved} className="rounded-2xl border border-[#E2E2E2] px-6 py-4 disabled:text-[#BBBBBB]">초기화</button>
        <button type="button" onClick={submit} disabled={solved} className="flex-1 rounded-2xl bg-[#111111] py-4 font-medium text-white disabled:bg-[#D5D5D5]">{solved ? '해결 완료' : '금고 열기'}</button>
      </div>
    </section>
  );
}
