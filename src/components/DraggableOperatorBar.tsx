'use client';

import React from 'react';
import { InlineOperator } from '@/types/game';

interface DraggableOperatorBarProps {
  onDragStart: (operator: InlineOperator) => void;
}

const operators: InlineOperator[] = ['+', '-', '×', '÷', '='];

export default function DraggableOperatorBar({ onDragStart }: DraggableOperatorBarProps) {
  return (
    <div className="flex w-full justify-center items-center gap-4 py-4 px-6 mb-4">
      <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-full shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] border border-gray-100">
        {operators.map((op) => (
          <div
            key={op}
            draggable
            onDragStart={(e) => {
              // Store operator type
              e.dataTransfer.setData('text/plain', op);
              e.dataTransfer.effectAllowed = 'copy';
              onDragStart(op);
            }}
            className="flex h-12 w-12 cursor-grab active:cursor-grabbing items-center justify-center rounded-full bg-gray-50 text-2xl font-light text-gray-800 transition-transform hover:scale-110 hover:bg-gray-100 hover:shadow-sm"
            aria-label={`${op} 연산자 드래그`}
          >
            {op}
          </div>
        ))}
      </div>
    </div>
  );
}
