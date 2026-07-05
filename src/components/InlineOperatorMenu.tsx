'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InlineOperator } from '@/types/game';
import { PuzzleDifficulty } from '@/lib/puzzleTypes';

interface InlineOperatorMenuProps {
  difficulty: PuzzleDifficulty;
  currentOperator: InlineOperator | null;
  onSelect: (op: InlineOperator | null) => void;
  onClose: () => void;
  ariaLabelPrefix?: string;
}

export default function InlineOperatorMenu({
  difficulty,
  currentOperator,
  onSelect,
  onClose,
  ariaLabelPrefix = '연산자 선택',
}: InlineOperatorMenuProps) {
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const popoverRef = useRef<HTMLDivElement>(null);

  const easyOperators: InlineOperator[] = ['+', '-', '='];
  const normalOperators: InlineOperator[] = ['+', '-', '×', '÷', '='];
  
  const operators = difficulty === 'EASY' ? easyOperators : normalOperators;

  useEffect(() => {
    if (!popoverRef.current) return;
    
    // Check if the popover overflows the top of the viewport
    const rect = popoverRef.current.getBoundingClientRect();
    if (rect.top < 60) {
      setPlacement('bottom');
    } else {
      setPlacement('top');
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
        className={`absolute left-1/2 z-50 flex items-center gap-1.5 p-1.5 bg-white border border-[#E5E7EB] rounded-2xl shadow-lg pointer-events-auto transition-transform ${
          placement === 'top' 
            ? 'bottom-full mb-3 origin-bottom -translate-x-1/2 animate-popover-top' 
            : 'top-full mt-3 origin-top -translate-x-1/2 animate-popover-bottom'
        }`}
        role="dialog"
        aria-label={ariaLabelPrefix}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the menu itself
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
