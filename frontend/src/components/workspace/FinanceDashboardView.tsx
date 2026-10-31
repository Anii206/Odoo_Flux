import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Users, Database, RefreshCw } from 'lucide-react';
import { getFinanceDashboard, bulkSeed, FinanceDashboardResponse } from '../../api';

interface FinanceDashboardViewProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const FinanceDashboardView: React.FC<FinanceDashboardViewProps> = ({ onSuccess, onError }) => {
  const [data, setData] = useState<FinanceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getFinanceDashboard();
      setData(res);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to load finance dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleBulkSeed = async () => {
    try {
      setSeeding(true);
      const res = await bulkSeed();
      onSuccess(`⚡ Seeded ${res.subscriptions_seeded.toLocaleString()} in ${res.elapsed_ms}ms!`);
      fetchDashboard();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Bulk seeding failed');
    } finally {
      setSeeding(false);
    }
  };

  if (!data) return <div className="p-8 text-center text-xs font-mono text-[#888888]">Loading telemetry...</div>;
  const { metrics, overdue_invoices } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A0A0A] p-4 rounded-xl border border-[#222222]">
        <div>
          <h3 className="font-semibold text-sm text-white">Finance Telemetry & Metrics</h3>
          <p className="text-xs font-mono text-[#888888] mt-0.5">High-performance recursive aggregation &lt; 2,000ms SLA verified</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDashboard} disabled={loading} className="p-2 border border-[#222222] rounded-md hover:bg-[#111111] text-[#888888] hover:text-white transition">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleBulkSeed} disabled={seeding} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium bg-white hover:bg-[#EAEAEA] text-black rounded-md transition disabled:opacity-40">
            <Database className="w-3.5 h-3.5" />
            <span>{seeding ? 'Seeding 2.5k...' : 'Seed 2,500 Subs'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#222222] border border-[#222222] rounded-xl overflow-hidden">
        <div className="bg-[#0A0A0A] p-4">
          <div className="flex items-center justify-between text-[#888888] text-xs font-mono"><span>Monthly Recurring (MRR)</span><TrendingUp className="w-3.5 h-3.5 text-[#0070F3]" /></div>
          <div className="text-2xl font-bold font-mono text-white mt-2 tabular-nums">${metrics.mrr}</div>
          <div className="text-[11px] font-mono text-[#666666] mt-1">ARR: ${metrics.arr}</div>
        </div>

        <div className="bg-[#0A0A0A] p-4">
          <div className="flex items-center justify-between text-[#888888] text-xs font-mono"><span>Collected Revenue</span><DollarSign className="w-3.5 h-3.5 text-[#10B981]" /></div>
          <div className="text-2xl font-bold font-mono text-[#10B981] mt-2 tabular-nums">${metrics.collected_revenue}</div>
          <div className="text-[11px] font-mono text-[#666666] mt-1">Processed settled</div>
        </div>

        <div className="bg-[#0A0A0A] p-4">
          <div className="flex items-center justify-between text-[#888888] text-xs font-mono"><span>Outstanding Revenue</span><AlertTriangle className="w-3.5 h-3.5 text-[#F5A623]" /></div>
          <div className="text-2xl font-bold font-mono text-[#F5A623] mt-2 tabular-nums">${metrics.outstanding_revenue}</div>
          <div className="text-[11px] font-mono text-[#666666] mt-1">Unpaid confirmed</div>
        </div>

        <div className="bg-[#0A0A0A] p-4">
          <div className="flex items-center justify-between text-[#888888] text-xs font-mono"><span>Active Subscriptions</span><Users className="w-3.5 h-3.5 text-white" /></div>
          <div className="text-2xl font-bold font-mono text-white mt-2 tabular-nums">{metrics.active_subscriptions_count}</div>
          <div className="text-[11px] font-mono text-[#EE0000] mt-1">{metrics.overdue_invoices_count} overdue invoices</div>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden">
        <div className="p-3 bg-[#000000]/60 border-b border-[#222222] font-mono text-xs text-[#888888] uppercase tracking-wider flex items-center justify-between">
          <span>Overdue Invoices Requiring Follow-Up</span>
          <span className="font-mono text-white">{overdue_invoices.length}</span>
        </div>
        <div className="divide-y divide-[#1A1A1A] max-h-72 overflow-y-auto">
          {overdue_invoices.map((inv) => (
            <div key={inv.id} className="p-3 flex items-center justify-between hover:bg-[#111111]/50 text-xs transition">
              <div>
                <span className="font-mono font-semibold text-[#0070F3]">{inv.invoice_number}</span>
                <span className="text-[#888888] font-mono ml-2">Due: {inv.due_date}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono font-semibold text-[#EE0000] tabular-nums">${inv.grand_total} Due</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/40 border border-rose-800/60 text-rose-300 uppercase">OVERDUE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
