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
    <div className="mx-auto mb-6 flex min-h-24 w-full max-w-lg flex-col items-center justify-center rounded-lg border border-[#EAEAEA] bg-white px-5 py-4 transition-all duration-300">
      <div
        className={`break-all text-center text-2xl font-medium leading-relaxed tracking-normal transition-colors md:text-3xl ${
          status === 'correct'
            ? 'text-[#28A745]'
            : status === 'wrong'
            ? 'text-[#DC3545]'
            : 'text-[#111111]'
        }`}
      >
        {expression || ' '}
      </div>

      <div className="mt-2 flex min-h-[1.25rem] items-center justify-center">
        {warningMessage && status === 'playing' ? (
          <span className="animate-in fade-in zoom-in-95 text-center text-xs font-medium text-[#9A6A00] duration-200 md:text-sm">
            {warningMessage}
          </span>
        ) : (
          <span className="text-xs text-transparent">.</span>
        )}
      </div>
    </div>
  );
}
