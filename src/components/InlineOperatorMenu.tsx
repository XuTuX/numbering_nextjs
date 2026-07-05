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
      className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 p-2 transition-all duration-200 ease-out"
      role="dialog"
      aria-label={ariaLabelPrefix}
    >
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
        
        {currentOperator && (
          <>
            <div className="w-px h-8 bg-gray-200 mx-1" />
            <button
              onClick={() => {
                onSelect(null);
              }}
              className="px-4 h-12 flex items-center justify-center rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all"
              aria-label="연산자 삭제"
            >
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
}
