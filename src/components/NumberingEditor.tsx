'use client';

import React from 'react';
import {
  EditorSelection,
  OperatorSlot,
  ParenthesisRange,
  InlineOperator,
} from '@/types/game';
import { PuzzleDifficulty } from '@/lib/puzzleTypes';
import { useDroppable, useDndContext } from '@dnd-kit/core';

interface NumberingEditorProps {
  difficulty: PuzzleDifficulty;
  digits: string[];
  operatorSlots: OperatorSlot[];
  parentheses: ParenthesisRange[];
  selection: EditorSelection;
  lastChangedSlotIndex: number | null;
  onDigitPointerDown: (index: number) => void;
  onDigitPointerEnter: (index: number) => void;
  onDigitPointerUp: () => void;
  onParenthesisClick?: (id: string) => void;
  onSelectSlot: (index: number) => void;
  onOperatorDrop: (index: number, operator: InlineOperator) => void;
}

export default function NumberingEditor({
  difficulty,
  digits,
  operatorSlots,
  parentheses,
  selection,
  lastChangedSlotIndex,
  onDigitPointerDown,
  onDigitPointerEnter,
  onDigitPointerUp,
  onParenthesisClick,
  onSelectSlot,
  onOperatorDrop,
}: NumberingEditorProps) {



  const selectedStart =
    selection.type !== 'range'
      ? null
      : Math.min(
          selection.startDigitIndex,
          selection.endDigitIndex ?? selection.startDigitIndex
        );
  const selectedEnd =
    selection.type !== 'range'
      ? null
      : Math.max(
          selection.startDigitIndex,
          selection.endDigitIndex ?? selection.startDigitIndex
        );

  const getSlotOperator = (index: number) =>
    operatorSlots.find((slot) => slot.index === index)?.operator ?? null;

  const digitCount = digits.length;
  const isLong = digitCount > 6;
  // Fluid font size calculation based on number of digits
  const vwScale = 100 / (digitCount * 1.3);
  const maxFontSize = isLong ? '3.2rem' : '4.5rem';
  const slotWidthEmpty = isLong ? '0.3em' : '0.45em';
  const slotWidthFilled = isLong ? '0.7em' : '0.9em';

  return (
    <div className="w-full flex justify-center px-3 py-10 md:px-6 md:py-16 overflow-hidden select-none">
      <div
        className="flex items-center justify-center text-[#151515] font-medium tracking-tight"
        style={{ fontSize: `clamp(1.5rem, ${vwScale}vw, ${maxFontSize})` }}
        aria-label="수식 편집 영역"
        onClick={(event) => event.stopPropagation()}
      >
        {digits.map((digit, index) => {
          const opens = parentheses.filter((range) => range.startDigitIndex === index);
          const closes = parentheses.filter((range) => range.endDigitIndex === index);
          const isSelected =
            selectedStart !== null &&
            selectedEnd !== null &&
            selectedStart <= index &&
            index <= selectedEnd;
          const isSelectionStartOnly =
            selection.type === 'range' &&
            selection.startDigitIndex === index &&
            selection.endDigitIndex === null;
          const slotOperator = index < digits.length - 1 ? getSlotOperator(index) : null;
          const isActiveSlot =
            (selection.type === 'slot' || selection.type === 'operator') &&
            selection.slotIndex === index;
          const isChanged = lastChangedSlotIndex === index;

          return (
            <React.Fragment key={`digit-${index}`}>
              {opens.map((range) => (
                <button
                  key={`open-${range.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onParenthesisClick?.(range.id);
                  }}
                  className="relative z-20 -mr-[0.1em] px-[0.1em] text-[0.8em] font-light text-gray-300 hover:text-red-500 cursor-pointer transition-colors"
                  aria-label="여는 괄호 삭제"
                >
                  (
                </button>
              ))}

              <span className="relative inline-flex items-center z-10 touch-none">
                <button
                  tabIndex={0}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.releasePointerCapture(e.pointerId);
                    onDigitPointerDown(index);
                  }}
                  onPointerEnter={() => onDigitPointerEnter(index)}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    onDigitPointerUp();
                  }}
                  className={`relative flex h-[1.3em] min-w-[0.65em] items-center justify-center rounded-lg px-[0.1em] outline-none transition-all duration-200 cursor-pointer hover:bg-black/[0.02] ${
                    isSelected || isSelectionStartOnly
                      ? 'text-black'
                      : 'bg-transparent text-black/90'
                  }`}
                  aria-label={`숫자 ${digit}, 괄호 범위 선택 ${isSelected ? '선택됨' : '가능'}`}
                >
                  {digit}
                  {(isSelected || isSelectionStartOnly) && (
                    <span
                      className="pointer-events-none absolute bottom-[0.08em] left-[0.12em] right-[0.12em] h-[0.045em] rounded-full bg-black/35"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </span>

              {closes.map((range) => (
                <button
                  key={`close-${range.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onParenthesisClick?.(range.id);
                  }}
                  className="relative z-20 -ml-[0.1em] px-[0.1em] text-[0.8em] font-light text-gray-300 hover:text-red-500 cursor-pointer transition-colors"
                  aria-label="닫는 괄호 삭제"
                >
                  )
                </button>
              ))}

              {index < digits.length - 1 && (
                <DroppableSlot
                  index={index}
                  slotOperator={slotOperator}
                  isActiveSlot={isActiveSlot}
                  isChanged={isChanged}
                  slotWidthEmpty={slotWidthEmpty}
                  slotWidthFilled={slotWidthFilled}
                  digits={digits}
                  onSelectSlot={onSelectSlot}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function DroppableSlot({
  index,
  slotOperator,
  isActiveSlot,
  isChanged,
  slotWidthEmpty,
  slotWidthFilled,
  digits,
  onSelectSlot,
}: {
  index: number;
  slotOperator: InlineOperator | null;
  isActiveSlot: boolean;
  isChanged: boolean;
  slotWidthEmpty: string;
  slotWidthFilled: string;
  digits: string[];
  onSelectSlot: (index: number) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${index}`,
    data: { index },
  });
  const { active } = useDndContext();
  const isDragging = active !== null;

  // When dragging and hovering over this slot, widen it to show the drop target clearly.
  const dynamicWidth = isOver ? '1.5em' : (slotOperator ? slotWidthFilled : slotWidthEmpty);

  return (
    <span
      ref={setNodeRef}
      className="relative inline-flex items-center justify-center transition-all duration-300 ease-out"
      style={{ 
        width: dynamicWidth,
        // Raise zIndex so hit area is huge when dragging, allowing easy drops.
        zIndex: (isDragging || slotOperator !== null) ? 30 : 0
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelectSlot(index);
        }}
        className={`absolute top-1/2 left-1/2 flex items-center justify-center rounded-full outline-none transition-all
          ${isDragging ? 'min-h-[100px] min-w-[80px]' : 'min-h-[56px] min-w-[56px] w-[2.5em]'}
          -translate-x-1/2 -translate-y-1/2
        `}
        aria-label={`${digits[index]}와 ${digits[index + 1]} 사이 ${
          slotOperator ? `${slotOperator} 연산자 수정` : '연산자 삽입'
        }`}
      >
        <div className={`flex items-center justify-center transition-all duration-300 rounded-full
          ${isOver ? 'w-10 h-10 bg-black/5 scale-110 shadow-inner' : 'w-full h-full'}
        `}>
          {slotOperator ? (
            <span
              className={`text-[0.7em] font-light text-[#151515] transition-transform ${
                isChanged ? 'animate-bump scale-110' : ''
              } ${isOver ? 'opacity-30' : 'opacity-100'}`}
            >
              {slotOperator}
            </span>
          ) : null}
        </div>
      </button>
      {isActiveSlot && (
        <span
          className="pointer-events-none absolute left-1/2 top-[1.08em] h-[0.08em] w-4 -translate-x-1/2 rounded-full bg-black/25"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
