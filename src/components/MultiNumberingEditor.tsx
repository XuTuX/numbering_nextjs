'use client';

import { useState, useEffect } from 'react';
import { InlineOperator, OperatorSlot } from '@/types/game';
import { getSocket } from '@/lib/socketClient';
import { buildExpression } from '@/lib/expression';
import NumberingEditor from './NumberingEditor';
import DraggableOperatorBar from './DraggableOperatorBar';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';

interface MultiNumberingEditorProps {
  digits: string[];
  digitString: string;
  roomId: string;
}

export default function MultiNumberingEditor({ digits, digitString, roomId }: MultiNumberingEditorProps) {
  const [operatorSlots, setOperatorSlots] = useState<OperatorSlot[]>([]);
  const [lastChangedSlotIndex, setLastChangedSlotIndex] = useState<number | null>(null);
  const [foundEquations, setFoundEquations] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  useEffect(() => {
    // Reset slots when digits change (new round)
    const initialSlots = Array.from({ length: digits.length - 1 }).map((_, i) => ({
      index: i,
      operator: null,
    }));
    setOperatorSlots(initialSlots);
    setFoundEquations([]);
    setFeedback(null);
  }, [digits]);

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const handleOperatorDrop = (index: number, op: InlineOperator) => {
    setFeedback(null);
    setOperatorSlots(prev => prev.map(s => s.index === index ? { ...s, operator: op } : s));
    setLastChangedSlotIndex(index);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && over.data.current) {
      const slotIndex = over.data.current.index;
      const op = active.data.current?.operator as InlineOperator;
      if (op && slotIndex !== undefined) {
        handleOperatorDrop(slotIndex, op);
      }
    }
  };

  const handleSubmit = () => {
    const currentExpression = buildExpression(digits, operatorSlots, []);
    
    // Clear slots
    const resetSlots = operatorSlots.map(s => ({ ...s, operator: null }));
    setOperatorSlots(resetSlots);

    getSocket().emit('submit_equation', { roomId, expression: currentExpression }, (res: any) => {
      if (res.success) {
        setFoundEquations(prev => [currentExpression, ...prev]);
        setFeedback({ message: '정답입니다! 1점 획득 🎉', isError: false });
      } else {
        setFeedback({ message: res.message, isError: true });
      }
    });
  };

  return (
    <div className="w-full flex flex-col items-center max-w-3xl mx-auto">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="mb-10 w-full flex justify-center">
          <NumberingEditor
            difficulty="HARD"
            digits={digits}
            operatorSlots={operatorSlots}
            parentheses={[]}
            selection={{ type: 'none' }}
            lastChangedSlotIndex={lastChangedSlotIndex}
            onDigitPointerDown={() => {}}
            onDigitPointerEnter={() => {}}
            onDigitPointerUp={() => {}}
            onSelectSlot={(index) => {
              // Click to clear
              setOperatorSlots(prev => prev.map(s => s.index === index ? { ...s, operator: null } : s));
            }}
            onOperatorDrop={handleOperatorDrop}
          />
        </div>

        <div className="mb-10">
          <DraggableOperatorBar />
        </div>

        {feedback && (
          <div className={`mb-6 text-sm font-medium ${feedback.isError ? 'text-red-500' : 'text-[#28A745]'} animate-in fade-in slide-in-from-bottom-2`}>
            {feedback.message}
          </div>
        )}

        <button 
          onClick={handleSubmit}
          className="w-full md:w-64 py-4 rounded-2xl bg-[#111111] text-white font-medium hover:bg-[#222222] transition-colors shadow-md active:scale-[0.98]"
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
