import React, { useState } from 'react';
import { Package, Calendar, Percent, UserPlus, Users } from 'lucide-react';
import { useCatalogData, useRulesData } from '../hooks';
import { getUsers } from '../api';
import { User } from '../types';
import { ProductManager } from '../components/admin/ProductManager';
import { PlanConfigurator } from '../components/admin/PlanConfigurator';
import { RulesManager } from '../components/admin/RulesManager';
import { StaffModal } from '../components/auth/StaffModal';
import { VercelStatusPill } from '../components/common/VercelStatusPill';

interface AdminPageProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onSuccess, onError }) => {
  const [tab, setTab] = useState<'products' | 'plans' | 'rules' | 'staff'>('products');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const { products, plans, refresh: refreshCatalog } = useCatalogData();
  const { taxRules, discountRules, templates, refresh: refreshRules } = useRulesData();

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setAllUsers(res);
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    if (tab === 'staff') fetchUsers();
  }, [tab]);

  const refreshAll = () => {
    refreshCatalog();
    refreshRules();
    if (tab === 'staff') fetchUsers();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans text-[#EDEDED]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Control Center</h1>
          <p className="text-xs font-mono text-[#888888] mt-1">Configure business entities, product variants, and provision staff operators</p>
        </div>
        <button
          onClick={() => setIsStaffModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-white hover:bg-[#EAEAEA] text-black rounded-md transition shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Provision Staff</span>
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-[#222222] overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setTab('products')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-medium border-b-2 transition-all ${
            tab === 'products' ? 'border-white text-white font-bold' : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Products & Variants ({products.length})</span>
        </button>
        <button
          onClick={() => setTab('plans')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-medium border-b-2 transition-all ${
            tab === 'plans' ? 'border-white text-white font-bold' : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Plans Configurator ({plans.length})</span>
        </button>
        <button
          onClick={() => setTab('rules')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-medium border-b-2 transition-all ${
            tab === 'rules' ? 'border-white text-white font-bold' : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Taxes & Discounts</span>
        </button>
        <button
          onClick={() => setTab('staff')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-medium border-b-2 transition-all ${
            tab === 'staff' ? 'border-white text-white font-bold' : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff Accounts ({allUsers.filter((u) => u.role === 'staff').length})</span>
        </button>
      </div>

      {tab === 'products' && (
        <ProductManager products={products} onRefresh={refreshAll} onSuccess={onSuccess} onError={onError} />
      )}
      {tab === 'plans' && (
        <PlanConfigurator plans={plans} onRefresh={refreshAll} onSuccess={onSuccess} onError={onError} />
      )}
      {tab === 'rules' && (
        <RulesManager
          taxRules={taxRules}
          discountRules={discountRules}
          templates={templates}
          plans={plans}
          products={products}
          onRefresh={refreshAll}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}
      {tab === 'staff' && (
        <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg overflow-hidden">
          <div className="p-3 bg-[#111111] border-b border-[#222222] font-mono font-bold text-xs text-[#888888] uppercase">
            Internal Staff & Administrators ({allUsers.filter((u) => u.role === 'admin' || u.role === 'staff').length})
          </div>
          <div className="divide-y divide-[#161616]">
            {allUsers
              .filter((u) => u.role === 'admin' || u.role === 'staff')
              .map((u) => (
                <div key={u.id} className="p-3.5 flex items-center justify-between text-xs font-mono hover:bg-[#111111] transition-colors">
                  <div>
                    <span className="font-bold text-white">{u.email}</span>
                    <span className="text-[#555555] ml-2 font-sans text-[11px]">ID: {u.id}</span>
                  </div>
                  <VercelStatusPill status={u.role} />
                </div>
              ))}
          </div>
        </div>
      )}

      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onStaffCreated={refreshAll}
        onSuccess={onSuccess}
        onError={onError}
      />
    </div>
  );
};
