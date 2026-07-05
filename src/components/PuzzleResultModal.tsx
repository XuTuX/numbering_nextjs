import { GeneratedPuzzle } from '@/lib/puzzleTypes';

interface PuzzleResultModalProps {
  status: 'correct' | 'wrong';
  puzzle: GeneratedPuzzle | null;
  onNext: () => void;
}

export default function PuzzleResultModal({ status, puzzle, onNext }: PuzzleResultModalProps) {
  if (status !== 'correct') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 max-w-sm w-full text-center border border-[#EAEAEA] animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-[#28A745] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-[#111111] mb-2 tracking-tight">정답입니다!</h2>
        
        {puzzle && (
          <p className="text-[#8A8A8A] text-sm mb-8 bg-[#F5F7FA] py-3 px-4 rounded-xl font-mono tracking-wider">
            원래 수식: {puzzle.answerExpression}
          </p>
        )}
        
        <button
          onClick={onNext}
          className="w-full py-4 bg-[#111111] text-white rounded-2xl font-medium text-lg hover:bg-[#222222] active:scale-[0.98] transition-all shadow-md"
        >
          다음 문제
        </button>
      </div>
    </div>
  );
}
