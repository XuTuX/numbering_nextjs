'use client';

import { PuzzleDifficulty } from '@/lib/puzzleTypes';

interface BottomGameActionsProps {
  difficulty: PuzzleDifficulty;
  hintCount: number;
  isSubmitEnabled: boolean;
  onHintClick: () => void;
  onResetClick: () => void;
  onSubmitClick: () => void;
  onWrapParentheses?: () => void;
  onUnwrapParentheses?: () => void;
  hasSelectedRange?: boolean;
  selectedParenthesisId?: string | null;
}

export default function BottomGameActions({
  difficulty,
  hintCount,
  isSubmitEnabled,
  onHintClick,
  onResetClick,
  onSubmitClick,
  onWrapParentheses,
  onUnwrapParentheses,
  hasSelectedRange = false,
  selectedParenthesisId = null,
}: BottomGameActionsProps) {
  const isHard = difficulty === 'HARD';

  return (
    <div className="mx-auto mt-6 w-full max-w-lg px-2">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <button
          onClick={onHintClick}
          disabled={hintCount <= 0}
          className={`h-12 flex-1 rounded-lg border text-sm font-medium transition-all ${
            hintCount > 0
              ? 'cursor-pointer border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:scale-95'
              : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
          }`}
        >
          힌트
        </button>

        {isHard && onWrapParentheses && (
          selectedParenthesisId ? (
            <button
              onClick={onUnwrapParentheses}
              className="flex h-12 flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 text-sm font-medium text-red-600 transition-all hover:bg-red-100 active:scale-95 cursor-pointer"
              aria-label="괄호 해제"
            >
              괄호 해제
            </button>
          ) : (
            <button
              onClick={onWrapParentheses}
              disabled={!hasSelectedRange}
              className={`flex h-12 flex-1 items-center justify-center gap-1 rounded-lg border text-sm font-medium transition-all ${
                hasSelectedRange
                  ? 'cursor-pointer border-gray-200 bg-white text-black hover:bg-gray-50 active:scale-95'
                  : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
              }`}
              aria-label="괄호로 묶기"
            >
              <span className="font-bold">( )</span> 묶기
            </button>
          )
        )}

        <button
          onClick={onResetClick}
          className="h-12 flex-1 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
        >
          초기화
        </button>

        <button
          onClick={onSubmitClick}
          disabled={!isSubmitEnabled}
          className={`h-12 rounded-lg px-7 text-base font-semibold transition-all ${
            isHard ? 'flex-[1.2]' : 'flex-[1.5]'
          } ${
            isSubmitEnabled
              ? 'bg-[#111111] text-white hover:bg-[#222222] active:scale-[0.98]'
              : 'bg-[#EAEAEA] text-[#A0A0A0] cursor-not-allowed'
          }`}
        >
          제출
        </button>
      </div>
    </div>
  );
}
