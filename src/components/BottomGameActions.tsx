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
  hasSelectedRange?: boolean;
}

export default function BottomGameActions({
  difficulty,
  hintCount,
  isSubmitEnabled,
  onHintClick,
  onResetClick,
  onSubmitClick,
  onWrapParentheses,
  hasSelectedRange = false,
}: BottomGameActionsProps) {
  const isHard = difficulty === 'HARD';

  return (
    <div className="w-full max-w-lg mx-auto px-2 mt-6">
      <div className="flex justify-between items-center gap-3">
        {/* Hint Button */}
        <button
          onClick={onHintClick}
          disabled={hintCount <= 0}
          className={`flex-1 py-4 rounded-2xl text-sm font-medium transition-all shadow-sm border ${
            hintCount > 0
              ? 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50 cursor-pointer active:scale-95'
              : 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed'
          }`}
        >
          힌트 {hintCount}
        </button>

        {/* Parentheses Button - Hard Mode Only */}
        {isHard && onWrapParentheses && (
          <button
            onClick={onWrapParentheses}
            disabled={!hasSelectedRange}
            className={`flex-1 py-4 rounded-2xl text-sm font-medium transition-all shadow-sm border flex items-center justify-center gap-1 ${
              hasSelectedRange
                ? 'text-black bg-white border-gray-200 hover:bg-gray-50 cursor-pointer active:scale-95'
                : 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed'
            }`}
            aria-label="괄호로 묶기"
          >
            <span className="font-bold">( )</span> 묶기
          </button>
        )}

        {/* Reset Button */}
        <button
          onClick={onResetClick}
          className="flex-1 py-4 rounded-2xl text-sm font-medium text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          초기화
        </button>

        {/* Submit Button */}
        <button
          onClick={onSubmitClick}
          disabled={!isSubmitEnabled}
          className={`px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-sm ${
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
