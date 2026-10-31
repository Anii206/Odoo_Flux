import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { api } from '../../api';
import { UserSummary } from '../../types';
import {
  PasswordValidatorWidget,
  evaluatePasswordPolicy,
  isPasswordValid,
} from './PasswordValidatorWidget';

interface StaffManagementProps {
  onSuccess: (user: UserSummary) => void;
  onError: (error: string) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const checks = evaluatePasswordPolicy(password);
  const isValid = isPasswordValid(checks);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      onError('Temporary staff password does not meet complexity requirements.');
      return;
    }
    setLoading(true);
    try {
      const user = await api.createStaff({ email, password });
      onSuccess(user);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-4">
      <div className="mb-4 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200">
        <strong className="block mb-1">RequireAdmin Extractor Enforced</strong>
        Only accounts with the <code>admin</code> role can call{' '}
        <code className="text-amber-100 font-mono">POST /api/admin/staff</code> to onboard internal staff members.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Staff Member Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff.ops@brightloop.io"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Temporary Staff Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Temporary secure password"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono"
          />
        </div>

        {/* Live Password Validator Widget */}
        <PasswordValidatorWidget checks={checks} />

        <button
          type="submit"
          disabled={!isValid || loading}
          className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white transition shadow-lg shadow-rose-600/20 text-sm flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {loading ? 'Creating...' : 'Create Staff Account'}
        </button>
      </form>
    </div>
  );
};
