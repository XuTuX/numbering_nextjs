'use client';

import { useState } from 'react';
import { InlineOperator, OperatorSlot } from '@/lib/equation/types';
import { emitWithAck } from '@/features/multiplayer/lib/socket';
import { buildExpression } from '@/lib/equation/buildExpression';
import EquationEditor from '@/components/game/EquationEditor';
import OperatorPalette from '@/components/game/OperatorPalette';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { EditorSelection, ParenthesisRange } from '@/lib/equation/types';
import { SubmissionResponse } from '@/features/multiplayer/types';
import { createOperatorSlots, createParenthesisRange } from '@/lib/equation/editorState';

interface MultiplayerEquationEditorProps {
  digits: string[];
  roomId: string;
}

export default function MultiplayerEquationEditor({ digits, roomId }: MultiplayerEquationEditorProps) {
  const [operatorSlots, setOperatorSlots] = useState<OperatorSlot[]>(() =>
    createOperatorSlots(digits.length),
  );
  const [parentheses, setParentheses] = useState<ParenthesisRange[]>([]);
  const [selection, setSelection] = useState<EditorSelection>({ type: 'none' });
  const [activeDragOperator, setActiveDragOperator] = useState<InlineOperator | null>(null);
  const [lastChangedSlotIndex, setLastChangedSlotIndex] = useState<number | null>(null);
  const [foundEquations, setFoundEquations] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const handleOperatorDrop = (index: number, op: InlineOperator) => {
    setFeedback(null);
    setOperatorSlots(prev => prev.map(s => s.index === index ? { ...s, operator: op } : s));
    setLastChangedSlotIndex(index);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragOperator(event.active.data.current?.operator || null);
    setFeedback(null);
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

  const handleDigitPointerDown = (index: number) => {
    setFeedback(null);
    setSelection({ type: 'range', startDigitIndex: index, endDigitIndex: null });
  };

  const handleDigitPointerEnter = (index: number) => {
    if (selection.type !== 'range') return;
    setSelection({ ...selection, endDigitIndex: index });
  };

  const handleDigitPointerUp = () => {
    if (selection.type !== 'range') return;
    const { startDigitIndex, endDigitIndex } = selection;

    if (endDigitIndex === null || Math.abs(endDigitIndex - startDigitIndex) < 1) {
      setSelection({ type: 'none' });
      return;
    }

    const result = createParenthesisRange(startDigitIndex, endDigitIndex, parentheses);
    if (!result.valid) {
      setFeedback({ message: result.message, isError: true });
      setSelection({ type: 'none' });
      return;
    }

    setParentheses([...parentheses, result.range]);
    setSelection({ type: 'none' });
  };

  const handleDeleteParenthesis = (id: string) => {
    setParentheses(prev => prev.filter(p => p.id !== id));
    setSelection({ type: 'none' });
    setFeedback(null);
  };

  const handleClearSelection = () => {
    setSelection({ type: 'none' });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const currentExpression = buildExpression(digits, operatorSlots, parentheses);

    setIsSubmitting(true);
    try {
      const res = await emitWithAck<SubmissionResponse>('submit_equation', { roomId, expression: currentExpression });
      setIsSubmitting(false);
      if (res.success) {
        setOperatorSlots((current) => current.map((slot) => ({ ...slot, operator: null })));
        setParentheses([]);
        setFoundEquations(prev => [currentExpression, ...prev]);
        setFeedback({ message: '정답입니다! 1점 획득 🎉', isError: false });
      } else {
        setFeedback({ message: res.message, isError: true });
      }
    } catch {
      setIsSubmitting(false);
      setFeedback({ message: '서버 응답이 없습니다. 다시 제출해주세요.', isError: true });
    }
  };

  return (
    <div className="w-full flex flex-col items-center max-w-3xl mx-auto" onClick={handleClearSelection}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="mb-10 w-full flex justify-center">
          <EquationEditor
            digits={digits}
            operatorSlots={operatorSlots}
            parentheses={parentheses}
            selection={selection}
            lastChangedSlotIndex={lastChangedSlotIndex}
            onDigitPointerDown={handleDigitPointerDown}
            onDigitPointerEnter={handleDigitPointerEnter}
            onDigitPointerUp={handleDigitPointerUp}
            onParenthesisClick={handleDeleteParenthesis}
            onSelectSlot={(index) => {
              // Click to clear
              setOperatorSlots(prev => prev.map(s => s.index === index ? { ...s, operator: null } : s));
            }}
          />
        </div>

        <div className="mb-10 flex flex-col items-center justify-center">
          <OperatorPalette />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragOperator ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl text-3xl font-light text-gray-800 border border-gray-100 scale-110 touch-none">
              {activeDragOperator}
            </div>
          ) : null}
        </DragOverlay>

        {feedback && (
          <div className={`mb-6 text-sm font-medium ${feedback.isError ? 'text-red-500' : 'text-[#28A745]'} animate-in fade-in slide-in-from-bottom-2`}>
            {feedback.message}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full md:w-64 py-4 rounded-2xl bg-[#111111] text-white font-medium hover:bg-[#222222] transition-colors shadow-md active:scale-[0.98] disabled:bg-[#777777]"
        >
          제출하기
        </button>

        {foundEquations.length > 0 && (
          <div className="mt-12 w-full text-center animate-in fade-in">
            <h3 className="text-sm font-medium text-[#8A8A8A] mb-4">내가 찾은 수식 ({foundEquations.length}개)</h3>
            <div className="flex flex-col gap-2 items-center">
              {foundEquations.map((eq, i) => (
                <div key={i} className="px-5 py-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl font-mono text-sm text-[#111111] tracking-wider">
                  {eq}
                </div>
              ))}
            </div>
          </div>
        )}
      </DndContext>
    </div>
  );
}
