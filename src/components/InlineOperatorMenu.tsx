'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InlineOperator } from '@/types/game';

interface InlineOperatorMenuProps {
  currentOperator: InlineOperator | null;
  onSelect: (op: InlineOperator | null) => void;
  onClose: () => void;
  ariaLabelPrefix?: string;
}

export default function InlineOperatorMenu({
  currentOperator,
  onSelect,
  onClose,
  ariaLabelPrefix = '연산자 선택',
}: InlineOperatorMenuProps) {
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const operators: InlineOperator[] = ['+', '-', '×', '÷', '='];

  useEffect(() => {
    if (!popoverRef.current) return;

    const rect = popoverRef.current.getBoundingClientRect();
    const viewportPadding = 12;

    if (rect.left < viewportPadding) {
      setHorizontalOffset(viewportPadding - rect.left);
    } else if (rect.right > window.innerWidth - viewportPadding) {
      setHorizontalOffset(window.innerWidth - viewportPadding - rect.right);
    } else {
      setHorizontalOffset(0);
    }
  }, []);

  return (
    <>
      {/* Backdrop for closing popover when clicking outside */}
      <div 
        className="fixed inset-0 z-40 bg-transparent cursor-default" 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      
      {/* Popover Menu */}
      <div
        ref={popoverRef}
        className="absolute left-1/2 top-full z-50 mt-3 flex origin-top items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-lg pointer-events-auto"
        style={{
          transform: `translateX(calc(-50% + ${horizontalOffset}px))`,
        }}
        role="dialog"
        aria-label={ariaLabelPrefix}
        onClick={(e) => e.stopPropagation()}
      >
        {operators.map((op) => {
          const isSelected = currentOperator === op;
          return (
            <button
              key={op}
              onClick={() => {
                onSelect(op);
                onClose();
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl text-lg font-medium transition-all ${
                isSelected
                  ? 'bg-[#111111] text-white'
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
            <div className="w-px h-6 bg-gray-200 mx-0.5" />
            <button
              onClick={() => {
                onSelect(null);
                onClose();
              }}
              className="px-3 h-10 flex items-center justify-center rounded-xl text-xs font-semibold text-red-500 bg-red-50/50 hover:bg-red-50 border border-red-100 hover:border-red-200 active:scale-95 transition-all"
              aria-label="연산자 삭제"
            >
              삭제
            </button>
          </>
        )}
      </div>
    </>
  );
}
