'use client';

import React from 'react';
import { InlineOperator } from '@/types/game';

interface OperatorToolbarProps {
  activeOperator: InlineOperator | null;
  onSelectOperator: (operator: InlineOperator) => void;
}

const operators: InlineOperator[] = ['+', '-', '×', '÷', '='];

export default function OperatorToolbar({ activeOperator, onSelectOperator }: OperatorToolbarProps) {
  return (
    <div className="flex w-full justify-center items-center gap-4 py-4 px-6 mb-4 touch-none">
      <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-full shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] border border-gray-100">
        {operators.map((op) => {
          const isActive = activeOperator === op;
          return (
            <button
              key={op}
              onClick={() => onSelectOperator(op)}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl font-light transition-all outline-none 
                ${
                  isActive
                    ? 'bg-[#111111] text-white shadow-md scale-110'
                    : 'bg-gray-50 text-gray-800 hover:scale-110 hover:bg-gray-100 hover:shadow-sm'
                }`}
              aria-label={`${op} 연산자 선택`}
              aria-pressed={isActive}
            >
              {op}
            </button>
          );
        })}
      </div>
    </div>
  );
}
