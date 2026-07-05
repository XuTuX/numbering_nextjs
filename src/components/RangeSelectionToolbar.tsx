'use client';

import { NumberRangeSelection } from '@/types/game';

interface RangeSelectionToolbarProps {
  selectedRange: NumberRangeSelection;
  onWrapParentheses: () => void;
  onClearSelection: () => void;
  isSelectionActive: boolean;
}

export default function RangeSelectionToolbar({
  selectedRange,
  onWrapParentheses,
  onClearSelection,
  isSelectionActive,
}: RangeSelectionToolbarProps) {
  const hasRange = selectedRange.startDigitIndex !== null && selectedRange.endDigitIndex !== null;

  return (
    <div className="flex items-center justify-center gap-3 my-4 h-12 transition-all">
      {isSelectionActive && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={onWrapParentheses}
            disabled={!hasRange}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 shadow-sm border ${
              hasRange
                ? 'bg-white border-[#EAEAEA] text-black hover:bg-[#FAFAFA] active:scale-95'
                : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="font-semibold">( )</span> 묶기
          </button>
          
          <button
            onClick={onClearSelection}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            선택 취소
          </button>
        </div>
      )}
    </div>
  );
}
