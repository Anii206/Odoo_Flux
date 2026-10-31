import React from 'react';

interface VercelStatusPillProps {
  status: string;
  className?: string;
}

export const VercelStatusPill: React.FC<VercelStatusPillProps> = ({ status, className = '' }) => {
  const normalized = status.toLowerCase().trim();

  let dotColor = 'bg-slate-400';
  let badgeStyle = 'bg-neutral-500/10 border-neutral-500/20 text-neutral-400';
  let pulse = false;

  switch (normalized) {
    case 'active':
      dotColor = 'bg-[#10B981]';
      badgeStyle = 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]';
      pulse = true;
      break;
    case 'paid':
      dotColor = 'bg-[#10B981]';
      badgeStyle = 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]';
      break;
    case 'confirmed':
    case 'quotation':
      dotColor = 'bg-[#0070F3]';
      badgeStyle = 'bg-[#0070F3]/10 border-[#0070F3]/20 text-[#0070F3]';
      break;
    case 'draft':
    case 'paused':
      dotColor = 'bg-[#F5A623]';
      badgeStyle = 'bg-[#F5A623]/10 border-[#F5A623]/20 text-[#F5A623]';
      break;
    case 'overdue':
    case 'closed':
    case 'cancelled':
      dotColor = 'bg-[#EE0000]';
      badgeStyle = 'bg-[#EE0000]/10 border-[#EE0000]/20 text-[#EE0000]';
      break;
    default:
      dotColor = 'bg-neutral-400';
      badgeStyle = 'bg-neutral-500/10 border-neutral-500/20 text-neutral-300';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-mono uppercase tracking-wider font-semibold tabular-nums select-none ${badgeStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${pulse ? 'animate-pulse' : ''}`} />
      <span>{status}</span>
    </span>
  );
};
