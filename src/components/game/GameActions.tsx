'use client';

interface GameActionsProps {
  hintCount: number;
  onHintClick: () => void;
  onResetClick: () => void;
}

export default function GameActions({
  hintCount,
  onHintClick,
  onResetClick,
}: GameActionsProps) {
  return (
    <div
      className="mx-auto mt-6 w-full max-w-lg px-2"
      onClick={(event) => event.stopPropagation()}
    >
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



        <button
          onClick={onResetClick}
          className="h-12 flex-1 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
        >
          초기화
        </button>

      </div>
    </div>
  );
}
