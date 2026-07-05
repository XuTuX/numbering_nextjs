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
        className="absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="괄호 범위 메뉴"
      >
        <button
          onClick={() => {
            onDeleteParenthesis(range.id);
            setActiveParenthesisMenuId(null);
          }}
          className="h-9 rounded-md px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:scale-95"
        >
          괄호 해제
        </button>
      </div>
    </>
  );

  return (
    <div className="w-full overflow-x-auto px-3 py-12 md:px-6 md:py-16">
      <div className="mx-auto flex w-max min-w-full items-center justify-start md:justify-center">
        <div
          className="flex items-center whitespace-nowrap text-[3.5rem] font-semibold leading-none tracking-normal text-[#111111] md:text-[5.5rem]"
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
                    className="relative -mr-1 px-0.5 text-[0.85em] font-medium text-[#333333] transition-colors hover:text-black"
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
                    className={`relative flex h-[1.25em] min-w-[0.62em] items-center justify-center rounded-md px-0.5 outline-none transition-colors ${
                      isHard
                        ? 'cursor-pointer hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-300'
                        : 'cursor-default'
                    } ${
                      isSelected
                        ? 'bg-gray-200/60'
                        : isSelectionStartOnly
                        ? 'bg-gray-100'
                        : 'bg-transparent'
                    }`}
                    aria-label={
                      isHard
                        ? `숫자 ${digit}, 괄호 범위 선택 ${isSelected ? '선택됨' : '가능'}`
                        : `숫자 ${digit}`
                    }
                  >
                    {digit}
                    {(isSelected || isSelectionStartOnly) && (
                      <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-black/35" />
                    )}
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
                    className="relative -ml-1 px-0.5 text-[0.85em] font-medium text-[#333333] transition-colors hover:text-black"
                    aria-label="닫는 괄호, 괄호 해제 메뉴 열기"
                  >
                    )
                  </button>
                ))}

                {index < digits.length - 1 && (
                  <span
                    className={`relative inline-flex h-[1.25em] items-center justify-center align-middle transition-[width] duration-150 ${
                      slotOperator || isSlotOpen
                        ? 'w-[0.88em] md:w-[0.95em]'
                        : 'w-[0.42em] md:w-[0.5em]'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveParenthesisMenuId(null);
                        onOpenMenu(index);
                      }}
                      className="absolute inset-y-[-0.18em] left-1/2 flex min-h-12 w-12 -translate-x-1/2 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gray-300"
                      aria-label={`${digits[index]}와 ${digits[index + 1]} 사이 ${
                        slotOperator ? `${slotOperator} 연산자 수정` : '연산자 삽입'
                      }`}
                    >
                      {slotOperator ? (
                        <span
                          className={`text-[0.74em] font-medium leading-none text-[#222222] ${
                            isChanged ? 'animate-bump' : ''
                          }`}
                        >
                          {slotOperator}
                        </span>
                      ) : (
                        isSlotOpen && (
                          <span className="h-[0.86em] w-px rounded-full bg-black/70" />
                        )
                      )}
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
    </div>
  );
}
