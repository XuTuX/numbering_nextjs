'use client';

import { buildExpression } from '@/lib/expression';
import { OperatorSlot, ParenthesisRange } from '@/types/game';

interface ExpressionPreviewProps {
  digits: string[];
  operatorSlots: OperatorSlot[];
  parentheses: ParenthesisRange[];
  status: 'playing' | 'correct' | 'wrong' | 'idle';
  warningMessage?: string;
}

export default function ExpressionPreview({
  digits,
  operatorSlots,
  parentheses,
  status,
  warningMessage,
}: ExpressionPreviewProps) {
  const expression = buildExpression(digits, operatorSlots, parentheses);

  return (
    <div className="w-full max-w-lg mx-auto bg-white border border-[#EAEAEA] rounded-2xl p-6 flex flex-col items-center justify-center min-h-[7rem] shadow-sm mb-6 transition-all duration-300">
      {/* Complete Equation Text */}
      <div
        className={`text-2xl md:text-3xl font-medium tracking-wide text-center transition-colors break-all leading-relaxed ${
          status === 'correct'
            ? 'text-[#28A745]'
            : status === 'wrong'
            ? 'text-[#DC3545]'
            : 'text-[#111111]'
        }`}
      >
        {expression || ' '}
      </div>

      {/* Dynamic Status / Hint Message */}
      <div className="min-h-[1.25rem] mt-2 flex items-center justify-center">
        {warningMessage && status === 'playing' ? (
          <span className="text-xs md:text-sm text-[#E58A00] font-medium text-center animate-in fade-in zoom-in-95 duration-200">
            {warningMessage}
          </span>
        ) : (
          <span className="text-xs text-[#A0A0A0] text-center font-normal">
            {status === 'playing' ? '숫자 사이를 클릭하여 연산자를 삽입하세요.' : ' '}
          </span>
        )}
      </div>
    </div>
  );
}
