import React from 'react';
import { Check, Circle } from 'lucide-react';
import { SubscriptionStatus } from '../../types';

interface StatusRibbonProps {
  currentStatus: SubscriptionStatus;
}

const STAGES: { key: SubscriptionStatus; label: string; code: string }[] = [
  { key: 'draft', label: 'Draft', code: '01' },
  { key: 'quotation', label: 'Quotation', code: '02' },
  { key: 'confirmed', label: 'Confirmed', code: '03' },
  { key: 'active', label: 'Active', code: '04' },
  { key: 'paused', label: 'Paused', code: '05' },
  { key: 'closed', label: 'Closed', code: '06' },
];

export const StatusRibbon: React.FC<StatusRibbonProps> = ({ currentStatus }) => {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="inline-flex items-center min-w-full px-2">
        {STAGES.map((stage, idx) => {
          const isCurrent = stage.key === currentStatus;
          const isCompleted = currentIndex > idx && currentStatus !== 'closed';
          const isPending = currentIndex < idx;

          return (
            <React.Fragment key={stage.key}>
              {/* Stage Node */}
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border transition-all ${
                    isCurrent
                      ? stage.key === 'active'
                        ? 'border-[#10B981] bg-[#10B981]/20 text-[#10B981] ring-2 ring-[#10B981]/30 animate-pulse'
                        : stage.key === 'paused'
                        ? 'border-[#F5A623] bg-[#F5A623]/20 text-[#F5A623] ring-2 ring-[#F5A623]/30'
                        : stage.key === 'closed'
                        ? 'border-[#EE0000] bg-[#EE0000]/20 text-[#EE0000]'
                        : 'border-[#0070F3] bg-[#0070F3]/20 text-[#0070F3] ring-2 ring-[#0070F3]/30'
                      : isCompleted
                      ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
                      : 'border-[#222222] bg-[#0A0A0A] text-[#555555]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : stage.code}
                </div>

                <div className="flex flex-col">
                  <span
                    className={`text-xs font-mono font-medium ${
                      isCurrent
                        ? 'text-white font-bold'
                        : isCompleted
                        ? 'text-[#CCCCCC]'
                        : 'text-[#555555]'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              </div>

              {/* 1px Hairline Connector Line */}
              {idx < STAGES.length - 1 && (
                <div
                  className={`flex-1 min-w-[32px] sm:min-w-[48px] h-[1px] mx-2 transition-colors ${
                    isCompleted ? 'bg-[#10B981]/50' : isCurrent ? 'bg-[#333333]' : 'bg-[#222222]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
