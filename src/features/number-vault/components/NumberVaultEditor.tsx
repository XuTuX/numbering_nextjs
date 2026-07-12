'use client';

import { CSSProperties, Fragment, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { InlineOperator, OperatorSlot, ParenthesisRange } from '@/lib/equation/types';

export interface VaultDigit {
  id: string;
  value: number;
}

interface NumberVaultEditorProps {
  digits: VaultDigit[];
  operatorSlots: OperatorSlot[];
  parentheses: ParenthesisRange[];
  selectionStart: number | null;
  lastChangedSlotIndex: number | null;
  onDigitClick: (index: number) => void;
  onParenthesisClick: (id: string) => void;
  onOperatorClick: (index: number) => void;
}

export default function NumberVaultEditor({
  digits,
  operatorSlots,
  parentheses,
  selectionStart,
  lastChangedSlotIndex,
  onDigitClick,
  onParenthesisClick,
  onOperatorClick,
}: NumberVaultEditorProps) {
  const getSlotOperator = (index: number) =>
    operatorSlots.find((slot) => slot.index === index)?.operator ?? null;
  const viewportScale = 100 / (digits.length * 1.3);

  return (
    <div className="w-full select-none overflow-hidden px-3 py-10 md:px-6 md:py-16">
      <div
        className="flex items-center justify-center font-medium tracking-tight text-[#151515]"
        style={{ fontSize: `clamp(2rem, ${viewportScale}vw, 4.5rem)` }}
        aria-label="숫자 금고 수식 편집 영역"
      >
        {digits.map((digit, index) => {
          const opens = parentheses.filter((range) => range.startDigitIndex === index);
          const closes = parentheses.filter((range) => range.endDigitIndex === index);
          const slotOperator = index < digits.length - 1 ? getSlotOperator(index) : null;

          return (
            <Fragment key={digit.id}>
              {opens.map((range) => (
                <button
                  key={`open-${range.id}`}
                  type="button"
                  onClick={() => onParenthesisClick(range.id)}
                  className="relative z-20 -mr-[0.1em] px-[0.1em] text-[0.8em] font-light text-gray-300 transition-colors hover:text-red-500"
                  aria-label="여는 괄호 삭제"
                >
                  (
                </button>
              ))}

              <DraggableDigit
                digit={digit}
                index={index}
                selected={selectionStart === index}
                onClick={() => onDigitClick(index)}
              />

              {closes.map((range) => (
                <button
                  key={`close-${range.id}`}
                  type="button"
                  onClick={() => onParenthesisClick(range.id)}
                  className="relative z-20 -ml-[0.1em] px-[0.1em] text-[0.8em] font-light text-gray-300 transition-colors hover:text-red-500"
                  aria-label="닫는 괄호 삭제"
                >
                  )
                </button>
              ))}

              {index < digits.length - 1 && (
                <VaultOperatorSlot
                  index={index}
                  operator={slotOperator}
                  changed={lastChangedSlotIndex === index}
                  left={digit.value}
                  right={digits[index + 1].value}
                  onClick={() => onOperatorClick(index)}
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function DraggableDigit({
  digit,
  index,
  selected,
  onClick,
}: {
  digit: VaultDigit;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: digit.id,
    data: { type: 'vault-digit', value: digit.value },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `vault-digit-position-${index}`,
    data: { type: 'vault-digit-position', index },
  });
  const setNodeRef = useCallback((node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  }, [setDragRef, setDropRef]);
  const style: CSSProperties = { transform: CSS.Translate.toString(transform) };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      onClick={onClick}
      {...listeners}
      {...attributes}
      className={`relative z-10 flex h-[1.3em] min-w-[0.65em] touch-none cursor-grab items-center justify-center rounded-lg px-[0.1em] outline-none transition-all active:cursor-grabbing ${
        selected ? 'bg-black/[0.04] text-black' : 'text-black/90 hover:bg-black/[0.02]'
      } ${isOver ? 'ring-2 ring-black/10' : ''} ${isDragging ? 'opacity-20' : 'opacity-100'}`}
      aria-label={`숫자 ${digit.value}, 드래그해 위치 변경`}
    >
      {digit.value}
      {selected && (
        <span className="pointer-events-none absolute bottom-[0.08em] left-[0.12em] right-[0.12em] h-[0.045em] rounded-full bg-black/35" />
      )}
    </button>
  );
}

function VaultOperatorSlot({
  index,
  operator,
  changed,
  left,
  right,
  onClick,
}: {
  index: number;
  operator: InlineOperator | null;
  changed: boolean;
  left: number;
  right: number;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `vault-operator-slot-${index}`,
    data: { type: 'vault-operator-slot', index },
  });

  return (
    <span
      ref={setNodeRef}
      className="relative inline-flex items-center justify-center transition-all duration-300"
      style={{ width: isOver ? '1.8em' : operator ? '0.9em' : '0.45em' }}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[56px] min-w-[56px] items-center justify-center rounded-full outline-none"
        aria-label={`${left}와 ${right} 사이 ${operator ? `${operator} 연산자 삭제` : '연산자 삽입'}`}
      >
        {operator ? (
          <span className={`text-[0.7em] font-light ${changed ? 'animate-bump' : ''} ${isOver ? 'opacity-20' : ''}`}>
            {operator}
          </span>
        ) : isOver ? (
          <span className="h-2 w-2 animate-pulse rounded-full bg-black/20" />
        ) : null}
      </button>
    </span>
  );
}
