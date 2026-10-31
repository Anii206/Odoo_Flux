import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Briefcase, BarChart3, User, Database, FastForward, X } from 'lucide-react';
import { bulkSeed, runBillingCycle } from '../../api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNotify }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { label: 'Admin Control Center', path: '/admin', icon: Shield, group: 'Navigation' },
    { label: 'Internal ERP Workspace', path: '/workspace', icon: Briefcase, group: 'Navigation' },
    { label: 'Finance Lead Analytics', path: '/finance', icon: BarChart3, group: 'Navigation' },
    { label: 'Customer Self-Service Portal', path: '/portal', icon: User, group: 'Navigation' },
    {
      label: 'Seed 2,500 Subscriptions (Stress Test)',
      icon: Database,
      group: 'Quick Action',
      run: async () => {
        onNotify('Seeding 2,500 records via SQL UNNEST...', 'success');
        const res = await bulkSeed();
        onNotify(`⚡ Seeded ${res.subscriptions_seeded.toLocaleString()} in ${res.elapsed_ms}ms!`, 'success');
      },
    },
    {
      label: 'Simulate Billing Day (Next Cycle)',
      icon: FastForward,
      group: 'Quick Action',
      run: async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const res = await runBillingCycle({ target_date: tomorrow.toISOString().split('T')[0] });
        onNotify(`🚀 Scanned ${res.subscriptions_scanned} subs, generated ${res.invoices_generated} invoices!`, 'success');
      },
    },
  ];

  const filtered = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = async (action: typeof actions[0]) => {
    onClose();
    if (action.path) navigate(action.path);
    else if (action.run) await action.run();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-100">
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl shadow-2xl max-w-xl w-full overflow-hidden text-[#EDEDED] font-sans">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#222222]">
          <Search className="w-4 h-4 text-[#888888]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search views (e.g. 'finance', 'seed', 'portal')..."
            className="flex-1 bg-transparent text-sm text-[#EDEDED] placeholder-[#666666] focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1A1A1A] text-[#888888] border border-[#333333]">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-[#1A1A1A] p-2 text-xs">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-[#666666]">No matching commands found.</div>
          ) : (
            filtered.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.label}
                  onClick={() => handleSelect(action)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#161616] cursor-pointer transition text-[#CCCCCC] hover:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#888888]" />
                    <span className="font-medium">{action.label}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-[#666666] bg-[#111111] px-2 py-0.5 rounded border border-[#222222]">
                    {action.group}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
