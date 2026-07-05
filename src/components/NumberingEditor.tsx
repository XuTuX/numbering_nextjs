'use client';

import React, { useState } from 'react';
import { OperatorSlot, ParenthesisRange, NumberRangeSelection, InlineMenuState, InlineOperator } from '@/types/game';
import { PuzzleDifficulty } from '@/lib/puzzleTypes';
import InlineOperatorMenu from './InlineOperatorMenu';

interface NumberingEditorProps {
  difficulty: PuzzleDifficulty;
  digits: string[];
  operatorSlots: OperatorSlot[];
  parentheses: ParenthesisRange[];
  selectedRange: NumberRangeSelection;
  inlineMenu: InlineMenuState;
  lastChangedSlotIndex: number | null;
  onDigitClick: (index: number) => void;
  onOpenMenu: (index: number) => void;
  onCloseMenu: () => void;
  onSelectOperator: (index: number, op: InlineOperator | null) => void;
  onDeleteParenthesis: (id: string) => void;
}

export default function NumberingEditor({
  difficulty,
  digits,
  operatorSlots,
  parentheses,
  selectedRange,
  inlineMenu,
  lastChangedSlotIndex,
  onDigitClick,
  onOpenMenu,
  onCloseMenu,
  onSelectOperator,
  onDeleteParenthesis,
}: NumberingEditorProps) {
  const [activeParenthesisMenuId, setActiveParenthesisMenuId] = useState<string | null>(null);

  const isHard = difficulty === 'HARD';

  // Find selection range limits (ordered)
  const getSelectionRange = () => {
    const { startDigitIndex, endDigitIndex } = selectedRange;
    if (startDigitIndex === null) return { start: null, end: null };
    if (endDigitIndex === null) return { start: startDigitIndex, end: startDigitIndex };
    return {
      start: Math.min(startDigitIndex, endDigitIndex),
      end: Math.max(startDigitIndex, endDigitIndex),
    };
  };

  const { start: selectStart, end: selectEnd } = getSelectionRange();

  const isDigitSelected = (index: number) => {
    if (selectStart === null) return false;
    return index >= selectStart && index <= (selectEnd ?? selectStart);
  };

  return (
    <div className="w-full overflow-x-auto flex justify-start md:justify-center items-center py-12 px-6 scrollbar-none">
      <div className="flex items-center flex-nowrap shrink-0 gap-0">
        {digits.map((digit, i) => {
          // Find if there is an opening parenthesis that starts at this digit
          const openParens = parentheses.filter((p) => p.startDigitIndex === i);
          // Find if there is a closing parenthesis that ends at this digit
          const closeParens = parentheses.filter((p) => p.endDigitIndex === i);

          const isSelected = isDigitSelected(i);
          const isSelectionStart = selectedRange.startDigitIndex === i;

          return (
            <React.Fragment key={`digit-group-${i}`}>
              {/* 1. Opening Parentheses */}
              {openParens.map((paren) => (
                <span
                  key={`open-${paren.id}`}
                  className="relative inline-block"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveParenthesisMenuId(
                        activeParenthesisMenuId === paren.id ? null : paren.id
                      );
                    }}
                    className="text-5xl md:text-7xl font-light text-gray-300 hover:text-red-500 transition-colors px-1 cursor-pointer select-none"
                    aria-label="여는 괄호, 클릭하여 제거 메뉴 열기"
                  >
                    (
                  </button>
                  {activeParenthesisMenuId === paren.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveParenthesisMenuId(null);
                        }}
                      />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-lg animate-popover-top flex items-center gap-1">
                        <button
                          onClick={() => {
                            onDeleteParenthesis(paren.id);
                            setActiveParenthesisMenuId(null);
                          }}
                          className="text-xs font-semibold text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 transition-colors whitespace-nowrap active:scale-95"
                        >
                          괄호 제거
                        </button>
                      </div>
                    </>
                  )}
                </span>
              ))}

              {/* 2. The Digit Card/Text */}
              <span className="relative inline-block">
                <button
                  disabled={!isHard}
                  onClick={() => onDigitClick(i)}
                  className={`text-5xl md:text-7xl font-semibold select-none transition-all outline-none pb-1 ${
                    isHard
                      ? 'cursor-pointer hover:opacity-80 active:scale-95'
                      : 'cursor-default text-black'
                  } ${
                    isSelected
                      ? 'text-black border-b-4 border-black/80'
                      : isSelectionStart
                      ? 'text-black border-b-4 border-black/30'
                      : 'text-black border-b-4 border-transparent'
                  }`}
                  aria-label={
                    isHard
                      ? `숫자 ${digit}, 범위 선택하려면 누르세요. 현재 ${
                          isSelected ? '선택됨' : '선택되지 않음'
                        }`
                      : `숫자 ${digit}`
                  }
                >
                  {digit}
                </button>
              </span>

              {/* 3. Closing Parentheses */}
              {closeParens.map((paren) => (
                <span
                  key={`close-${paren.id}`}
                  className="relative inline-block"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveParenthesisMenuId(
                        activeParenthesisMenuId === paren.id ? null : paren.id
                      );
                    }}
                    className="text-5xl md:text-7xl font-light text-gray-300 hover:text-red-500 transition-colors px-1 cursor-pointer select-none"
                    aria-label="닫는 괄호, 클릭하여 제거 메뉴 열기"
                  >
                    )
                  </button>
                  {activeParenthesisMenuId === paren.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveParenthesisMenuId(null);
                        }}
                      />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-lg animate-popover-top flex items-center gap-1">
                        <button
                          onClick={() => {
                            onDeleteParenthesis(paren.id);
                            setActiveParenthesisMenuId(null);
                          }}
                          className="text-xs font-semibold text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 transition-colors whitespace-nowrap active:scale-95"
                        >
                          괄호 제거
                        </button>
                      </div>
                    </>
                  )}
                </span>
              ))}

              {/* 4. Operator Slot between digits */}
              {i < digits.length - 1 && (() => {
                const slot = operatorSlots.find((s) => s.index === i);
                const op = slot?.operator || null;
                const isMenuOpen = inlineMenu.openSlotIndex === i || inlineMenu.editingSlotIndex === i;
                const hasBump = lastChangedSlotIndex === i;

                return (
                  <div
                    key={`slot-${i}`}
                    className="relative flex items-center justify-center min-w-[2.5rem] md:min-w-[3.5rem] h-16 md:h-24 mx-1"
                  >
                    <button
                      onClick={() => onOpenMenu(i)}
                      className={`w-full h-full flex items-center justify-center rounded-xl transition-all outline-none focus:ring-2 focus:ring-gray-200 ${
                        op
                          ? 'text-4xl md:text-6xl text-gray-800 font-medium hover:opacity-80 active:scale-95'
                          : 'hover:bg-gray-100/30'
                      }`}
                      aria-label={`${digits[i]}와(과) ${digits[i + 1]} 사이 연산자 ${
                        op ? `'${op}'` : '비어있음'
                      }, 기호 삽입하려면 클릭`}
                    >
                      {op ? (
                        <span className={hasBump ? 'animate-bump' : ''}>
                          {op}
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-200 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity" />
                      )}
                    </button>

                    {/* Inline Popover Menu */}
                    {isMenuOpen && (
                      <InlineOperatorMenu
                        difficulty={difficulty}
                        currentOperator={op}
                        onSelect={(newOp) => onSelectOperator(i, newOp)}
                        onClose={onCloseMenu}
                        ariaLabelPrefix={`${digits[i]}와(과) ${digits[i + 1]} 사이 연산자 선택`}
                      />
                    )}
                  </div>
                );
              })()}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
