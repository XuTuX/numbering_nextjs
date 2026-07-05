'use client';

import React, { useState } from 'react';
import {
  InlineMenuState,
  InlineOperator,
  NumberRangeSelection,
  OperatorSlot,
  ParenthesisRange,
} from '@/types/game';
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

  const selectedStart =
    selectedRange.startDigitIndex === null
      ? null
      : Math.min(
          selectedRange.startDigitIndex,
          selectedRange.endDigitIndex ?? selectedRange.startDigitIndex
        );
  const selectedEnd =
    selectedRange.startDigitIndex === null
      ? null
      : Math.max(
          selectedRange.startDigitIndex,
          selectedRange.endDigitIndex ?? selectedRange.startDigitIndex
        );

  const getSlotOperator = (index: number) =>
    operatorSlots.find((slot) => slot.index === index)?.operator ?? null;

  const getContainingParenthesis = (index: number) => {
    return [...parentheses]
      .filter((range) => range.startDigitIndex <= index && index <= range.endDigitIndex)
      .sort((a, b) => a.endDigitIndex - a.startDigitIndex - (b.endDigitIndex - b.startDigitIndex))[0];
  };

  const renderParenthesisMenu = (range: ParenthesisRange) => (
    <>
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={(event) => {
          event.stopPropagation();
          setActiveParenthesisMenuId(null);
        }}
      />
      <div
        className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-md border border-gray-100 bg-white/95 p-1 shadow-sm backdrop-blur-md"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="괄호 범위 메뉴"
      >
        <button
          onClick={() => {
            onDeleteParenthesis(range.id);
            setActiveParenthesisMenuId(null);
          }}
          className="h-8 rounded px-3 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-red-500 active:scale-95"
        >
          괄호 해제
        </button>
      </div>
    </>
  );

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
      >
        {digits.map((digit, index) => {
          const opens = parentheses.filter((range) => range.startDigitIndex === index);
          const closes = parentheses.filter((range) => range.endDigitIndex === index);
          const containingParenthesis = getContainingParenthesis(index);
          const isParenthesisMenuOpen =
            containingParenthesis !== undefined &&
            activeParenthesisMenuId === containingParenthesis.id;
          const isSelected =
            selectedStart !== null &&
            selectedEnd !== null &&
            selectedStart <= index &&
            index <= selectedEnd;
          const isSelectionStartOnly =
            selectedRange.startDigitIndex === index && selectedRange.endDigitIndex === null;
          const slotOperator = index < digits.length - 1 ? getSlotOperator(index) : null;
          const isSlotOpen = inlineMenu.openSlotIndex === index;
          const isChanged = lastChangedSlotIndex === index;

          return (
            <React.Fragment key={`digit-${index}`}>
              {opens.map((range) => (
                <button
                  key={`open-${range.id}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveParenthesisMenuId(
                      activeParenthesisMenuId === range.id ? null : range.id
                    );
                  }}
                  className="relative -mr-[0.1em] px-[0.1em] text-[0.8em] font-light text-gray-300 transition-colors hover:text-gray-600"
                  aria-label="여는 괄호, 괄호 해제 메뉴 열기"
                >
                  (
                </button>
              ))}

              <span className="relative inline-flex items-center">
                <button
                  aria-disabled={!isHard}
                  tabIndex={isHard ? 0 : -1}
                  onClick={() => {
                    if (!isHard) return;
                    if (containingParenthesis) {
                      setActiveParenthesisMenuId(
                        activeParenthesisMenuId === containingParenthesis.id
                          ? null
                          : containingParenthesis.id
                      );
                      return;
                    }
                    setActiveParenthesisMenuId(null);
                    onDigitClick(index);
                  }}
                  className={`relative flex h-[1.3em] min-w-[0.65em] items-center justify-center rounded-lg px-[0.1em] outline-none transition-all duration-200 ${
                    isHard
                      ? 'cursor-pointer hover:bg-black/[0.02]'
                      : 'cursor-default'
                  } ${
                    isSelected || isSelectionStartOnly
                      ? 'bg-black/[0.05] text-black scale-105'
                      : 'bg-transparent text-black/90'
                  }`}
                  aria-label={
                    isHard
                      ? `숫자 ${digit}, 괄호 범위 선택 ${isSelected ? '선택됨' : '가능'}`
                      : `숫자 ${digit}`
                  }
                >
                  {digit}
                </button>

                {isParenthesisMenuOpen &&
                  containingParenthesis &&
                  renderParenthesisMenu(containingParenthesis)}
              </span>

              {closes.map((range) => (
                <button
                  key={`close-${range.id}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveParenthesisMenuId(
                      activeParenthesisMenuId === range.id ? null : range.id
                    );
                  }}
                  className="relative -ml-[0.1em] px-[0.1em] text-[0.8em] font-light text-gray-300 transition-colors hover:text-gray-600"
                  aria-label="닫는 괄호, 괄호 해제 메뉴 열기"
                >
                  )
                </button>
              ))}

              {index < digits.length - 1 && (
                <span
                  className="relative inline-flex items-center justify-center transition-[width] duration-300 ease-out"
                  style={{ width: slotOperator ? slotWidthFilled : slotWidthEmpty }}
                >
                  <button
                    onClick={() => {
                      setActiveParenthesisMenuId(null);
                      onOpenMenu(index);
                    }}
                    className="absolute inset-y-[-0.2em] left-1/2 flex min-h-[44px] min-w-[44px] w-[1.5em] -translate-x-1/2 items-center justify-center rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-black/10 hover:bg-black/[0.03]"
                    aria-label={`${digits[index]}와 ${digits[index + 1]} 사이 ${
                      slotOperator ? `${slotOperator} 연산자 수정` : '연산자 삽입'
                    }`}
                  >
                    {slotOperator ? (
                      <span
                        className={`text-[0.7em] font-light text-[#151515] transition-transform ${
                          isChanged ? 'animate-bump scale-110' : ''
                        }`}
                      >
                        {slotOperator}
                      </span>
                    ) : null}
                  </button>

                  {isSlotOpen && (
                    <InlineOperatorMenu
                      currentOperator={slotOperator}
                      onSelect={(newOperator) => onSelectOperator(index, newOperator)}
                      onClose={onCloseMenu}
                      ariaLabelPrefix={`${digits[index]}와 ${digits[index + 1]} 사이 연산자 선택`}
                    />
                  )}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

