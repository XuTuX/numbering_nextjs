'use client';

import React from 'react';
import { InlineOperator } from '@/types/game';

interface InlineOperatorMenuProps {
  currentOperator: InlineOperator | null;
  onSelect: (op: InlineOperator | null) => void;
  ariaLabelPrefix?: string;
}

export default function InlineOperatorMenu({
  currentOperator,
  onSelect,
  ariaLabelPrefix = '연산자 선택',
}: InlineOperatorMenuProps) {
  const operators: InlineOperator[] = ['+', '-', '×', '÷', '='];

  return (
    <div
      className="w-full max-w-lg mx-auto flex flex-col items-center justify-center gap-2 p-2 transition-all duration-200 ease-out"
      role="dialog"
      aria-label={ariaLabelPrefix}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="text-xs font-medium text-gray-500">
        선택한 위치에 넣을 기호를 고르세요.
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
        {operators.map((op) => {
          const isSelected = currentOperator === op;
          return (
            <button
              key={op}
              onClick={() => {
                onSelect(op);
              }}
              className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl font-medium transition-all ${
                isSelected
                  ? 'bg-[#111111] text-white scale-[1.02]'
                  : 'bg-transparent hover:bg-gray-50 text-gray-800 active:scale-95'
              }`}
              aria-label={`${op} 삽입`}
            >
              {op}
            </button>
          );
        })}
        
      </div>
    </div>
  );
}
