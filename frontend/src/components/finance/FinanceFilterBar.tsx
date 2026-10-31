import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Plan } from '../../types';

interface FinanceFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  status: string;
  onStatusChange: (s: string) => void;
  planId: string;
  onPlanChange: (id: string) => void;
  fromDate: string;
  onFromDateChange: (d: string) => void;
  toDate: string;
  onToDateChange: (d: string) => void;
  plans: Plan[];
  onReset: () => void;
}

export const FinanceFilterBar: React.FC<FinanceFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  status,
  onStatusChange,
  planId,
  onPlanChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  plans,
  onReset,
}) => {
  return (
    <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-3 flex flex-wrap items-center gap-2.5 text-xs font-mono text-[#EDEDED]">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter customer or invoice #..."
          className="w-full pl-9 pr-3 py-1.5 bg-[#111111] border border-[#222222] rounded-md text-[#EDEDED] placeholder-[#555555] focus:border-white focus:outline-none transition text-xs"
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5">
        <select
          data-testid="finance-status-filter"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-[#111111] border border-[#222222] rounded-md px-2.5 py-1.5 text-[#EDEDED] focus:border-white focus:outline-none transition text-xs font-mono"
        >
          <option value="">Status: All</option>
          <option value="confirmed">Confirmed</option>
          <option value="paid">Paid</option>
          <option value="draft">Draft</option>
          <option value="overdue">Overdue Only</option>
        </select>
      </div>

      {/* Plan */}
      <div>
        <select
          value={planId}
          onChange={(e) => onPlanChange(e.target.value)}
          className="bg-[#111111] border border-[#222222] rounded-md px-2.5 py-1.5 text-[#EDEDED] focus:border-white focus:outline-none transition text-xs font-mono"
        >
          <option value="">Plan: All ({plans.length})</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* From */}
      <div className="flex items-center gap-1 text-[#888888]">
        <span>From:</span>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="bg-[#111111] border border-[#222222] rounded-md px-2 py-1 text-[#EDEDED] focus:border-white focus:outline-none transition text-xs"
        />
      </div>

      {/* To */}
      <div className="flex items-center gap-1 text-[#888888]">
        <span>To:</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="bg-[#111111] border border-[#222222] rounded-md px-2 py-1 text-[#EDEDED] focus:border-white focus:outline-none transition text-xs"
        />
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        title="Reset Filters"
        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] rounded-md text-[#888888] hover:text-white transition"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Reset</span>
      </button>
    </div>
  );
};
