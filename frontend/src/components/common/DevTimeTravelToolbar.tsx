import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FastForward, Database, ChevronUp, ChevronDown } from 'lucide-react';
import { bulkSeed, runBillingCycle, login } from '../../api';
import { User } from '../../types';

interface DevTimeTravelToolbarProps {
  currentUser: User | null;
  onRoleSwitch: (token: string, user: User) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const DevTimeTravelToolbar: React.FC<DevTimeTravelToolbarProps> = ({
  currentUser,
  onRoleSwitch,
  onSuccess,
  onError,
}) => {
  if (!import.meta.env.DEV) {
    return null;
  }

  const [collapsed, setCollapsed] = useState(false);
  const [simDate, setSimDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRoleSwitch = async (email: string, pass: string, targetPath: string, roleName: string) => {
    try {
      setLoadingRole(roleName);
      const res = await login(email, pass);
      onRoleSwitch(res.token, res.user);
      onSuccess(`1-Click: Switched to ${roleName}!`);
      setTimeout(() => {
        navigate(targetPath);
      }, 50);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Role switch failed');
    } finally {
      setLoadingRole(null);
    }
  };

  const handleSeed = async () => {
    try {
      setLoadingSeed(true);
      const res = await bulkSeed();
      onSuccess(`⚡ Seeded ${res.subscriptions_seeded.toLocaleString()} subs in ${res.elapsed_ms}ms (<1s SLA)!`);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Seeding failed');
    } finally {
      setLoadingSeed(false);
    }
  };

  const handleBillingSimulation = async () => {
    try {
      setLoadingBilling(true);
      const t0 = performance.now();
      const res = await runBillingCycle({ target_date: simDate });
      const elapsed = Math.round(performance.now() - t0);
      onSuccess(`🚀 Simulated ${res.target_date}: Scanned ${res.subscriptions_scanned}, generated ${res.invoices_generated} invs in ${elapsed}ms!`);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Billing simulation failed');
    } finally {
      setLoadingBilling(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 select-none max-w-[calc(100vw-1rem)]">
      <div className="rounded-full border border-neutral-800 bg-black/90 backdrop-blur-xl px-3.5 py-1.5 shadow-2xl flex items-center gap-2.5 text-xs font-mono text-[#EDEDED] transition-all overflow-x-auto max-w-full">
        {/* Toggle / Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#888888] hover:text-white transition px-1"
        >
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="hidden sm:inline">Vercel DevToolbar</span>
          {collapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {!collapsed && (
          <>
            <span className="h-4 w-[1px] bg-neutral-800" />

            {/* 1-Click Role Switcher */}
            <div className="flex items-center gap-1">
              {[
                { name: 'Admin', email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || '', pass: import.meta.env.VITE_DEMO_ADMIN_PASS || '', path: '/admin', active: currentUser?.role === 'admin' },
                { name: 'Staff', email: import.meta.env.VITE_DEMO_STAFF_EMAIL || '', pass: import.meta.env.VITE_DEMO_STAFF_PASS || '', path: '/workspace', active: currentUser?.role === 'staff' && !currentUser?.email.includes('finance') },
                { name: 'Finance', email: import.meta.env.VITE_DEMO_FINANCE_EMAIL || '', pass: import.meta.env.VITE_DEMO_FINANCE_PASS || '', path: '/finance', active: currentUser?.email.includes('finance') },
                { name: 'Customer', email: import.meta.env.VITE_DEMO_CUSTOMER_EMAIL || '', pass: import.meta.env.VITE_DEMO_CUSTOMER_PASS || '', path: '/portal', active: currentUser?.role === 'customer' },
              ].map((r) => (
                <button
                  key={r.name}
                  data-testid={`role-switch-${r.name.toLowerCase()}`}
                  disabled={loadingRole !== null}
                  onClick={() => handleRoleSwitch(r.email, r.pass, r.path, r.name)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition ${
                    r.active ? 'bg-white text-black font-bold' : 'text-[#888888] hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>

            <span className="h-4 w-[1px] bg-neutral-800 hidden md:inline" />

            {/* Time-Travel Simulator */}
            <div className="hidden md:flex items-center gap-1.5">
              <input
                data-testid="devtoolbar-sim-date"
                type="date"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[#CCCCCC] text-[10px] focus:outline-none"
              />
              <button
                data-testid="devtoolbar-simulate-billing"
                title="Simulate Billing Day"
                aria-label="Simulate Billing Day"
                disabled={loadingBilling}
                onClick={handleBillingSimulation}
                className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-2 py-0.5 rounded text-[11px] transition border border-neutral-700"
              >
                <FastForward className="w-3 h-3 text-[#F5A623]" />
                <span>Simulate Billing Day</span>
              </button>
            </div>

            <span className="h-4 w-[1px] bg-neutral-800" />

            {/* Stress Test Seeder */}
            <button
              data-testid="devtoolbar-seed"
              title="Seed 2,500 Subscriptions"
              aria-label="Seed 2,500 Subscriptions"
              disabled={loadingSeed}
              onClick={handleSeed}
              className="flex items-center gap-1 bg-white hover:bg-neutral-200 text-black font-bold px-2.5 py-0.5 rounded-full text-[11px] transition shadow-xs shrink-0"
            >
              <Database className="w-3 h-3 text-black" />
              <span className="hidden sm:inline">Seed 2,500 Subscriptions</span>
              <span className="sm:hidden">Seed 2.5k</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
