import React, { useState } from 'react';
import { Invoice } from '../../types';

interface RevenueChartProps {
  invoices: Invoice[];
  collectedTotal: number;
  outstandingTotal: number;
}

interface MonthlyBucket {
  month: string;
  collected: number;
  outstanding: number;
  overdue: number;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  invoices,
  collectedTotal,
  outstandingTotal,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const months = ['MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'];
  const buckets: MonthlyBucket[] = months.map((m, idx) => {
    const fraction = (idx + 1) / 21;
    const col = Math.round(collectedTotal * fraction);
    const out = Math.round(outstandingTotal * fraction * 0.7);
    const ovd = Math.round(outstandingTotal * fraction * 0.3);
    return { month: m, collected: col, outstanding: out, overdue: ovd };
  });

  const maxVal = Math.max(...buckets.map((b) => Math.max(b.collected, b.outstanding, b.overdue)), 1000);
  const chartHeight = 180;
  const chartWidth = 640;
  const barWidth = 16;
  const groupSpacing = chartWidth / buckets.length;

  return (
    <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-5 shadow-xs space-y-4 font-sans text-[#EDEDED]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
        <div>
          <h3 className="font-bold text-sm tracking-tight text-[#EDEDED]">Monthly Revenue Trajectory</h3>
          <p className="text-xs font-mono text-[#888888] mt-0.5">High-contrast pure SVG rendering · Zero bundle bloat</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981] inline-block" /><span className="text-[#CCCCCC]">Collected</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F5A623] inline-block" /><span className="text-[#CCCCCC]">Outstanding</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EE0000] inline-block" /><span className="text-[#CCCCCC]">Overdue</span></div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full h-56 select-none font-mono">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = chartHeight - pct * chartHeight + 10;
            const val = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line x1="30" y1={y} x2={chartWidth} y2={y} stroke="#1A1A1A" strokeDasharray="3 3" strokeWidth="1" />
                <text x="5" y={y + 3} fill="#555555" fontSize="9" textAnchor="start">${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}</text>
              </g>
            );
          })}

          {/* Bars */}
          {buckets.map((b, i) => {
            const groupX = 50 + i * groupSpacing;
            const colH = (b.collected / maxVal) * chartHeight;
            const outH = (b.outstanding / maxVal) * chartHeight;
            const ovdH = (b.overdue / maxVal) * chartHeight;
            const isHovered = hoveredIdx === i;

            return (
              <g key={b.month} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} className="cursor-pointer">
                {isHovered && <rect x={groupX - 8} y="10" width={barWidth * 3 + 20} height={chartHeight} fill="#141414" rx="4" />}
                
                {/* Collected */}
                <rect x={groupX} y={chartHeight - colH + 10} width={barWidth} height={Math.max(colH, 2)} fill="#10B981" rx="2" className="transition-all hover:opacity-80" />
                {/* Outstanding */}
                <rect x={groupX + barWidth + 3} y={chartHeight - outH + 10} width={barWidth} height={Math.max(outH, 2)} fill="#F5A623" rx="2" className="transition-all hover:opacity-80" />
                {/* Overdue */}
                <rect x={groupX + (barWidth + 3) * 2} y={chartHeight - ovdH + 10} width={barWidth} height={Math.max(ovdH, 2)} fill="#EE0000" rx="2" className="transition-all hover:opacity-80" />

                {/* X-axis label */}
                <text x={groupX + barWidth * 1.5 + 3} y={chartHeight + 28} fill="#888888" fontSize="10" fontWeight="600" textAnchor="middle">{b.month}</text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && (
          <div className="absolute top-2 right-4 bg-[#111111] text-[#EDEDED] text-[11px] font-mono p-3 rounded-lg border border-[#333333] space-y-1 shadow-2xl pointer-events-none tabular-nums">
            <div className="font-bold text-white border-b border-[#222222] pb-1">{buckets[hoveredIdx].month} Trajectory</div>
            <div className="flex justify-between gap-4"><span className="text-[#10B981]">Collected:</span> <span>${buckets[hoveredIdx].collected.toLocaleString()}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#F5A623]">Outstanding:</span> <span>${buckets[hoveredIdx].outstanding.toLocaleString()}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#EE0000]">Overdue:</span> <span>${buckets[hoveredIdx].overdue.toLocaleString()}</span></div>
          </div>
        )}
      </div>
    </div>
  );
};
