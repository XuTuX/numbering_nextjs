import { GeneratedPuzzle } from '@/lib/puzzleTypes';
import { useEffect } from 'react';

interface PuzzleResultModalProps {
  status: 'correct' | 'wrong';
  puzzle: GeneratedPuzzle | null;
  onNext: () => void;
}

export default function PuzzleResultModal({ status, puzzle, onNext }: PuzzleResultModalProps) {
  useEffect(() => {
    if (status === 'correct') {
      const timer = setTimeout(() => {
        onNext();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [status, onNext]);

  if (status !== 'correct') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-in zoom-in-95 fade-in duration-200 flex flex-col items-center">
        <span className="text-6xl md:text-8xl font-bold text-[#111111] tracking-tight drop-shadow-sm" 
          style={{ animation: 'correctPop 1.2s ease-out forwards' }}>
          정답!
        </span>
      </div>
      <style jsx>{`
        @keyframes correctPop {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; transform: scale(1.15); }
          40% { transform: scale(1); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9) translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
