import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  PasswordValidatorWidget,
  evaluatePasswordPolicy,
  isPasswordValid,
} from './PasswordValidatorWidget';

interface ResetPasswordFormProps {
  initialToken?: string;
  onSuccess: (msg: string) => void;
  onError: (error: string) => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  initialToken,
  onSuccess,
  onError,
}) => {
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const checks = evaluatePasswordPolicy(newPassword);
  const isValid = isPasswordValid(checks);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      onError('New password does not satisfy all policy rules.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.resetPassword({ token, new_password: newPassword });
      onSuccess(res.message);
      setToken('');
      setNewPassword('');
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Reset Token
          </label>
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste reset token from Local Outbox"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            New Password
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Choose new strong password"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono"
          />
        </div>

        {/* Live Password Validator Widget */}
        <PasswordValidatorWidget checks={checks} />

        <button
          type="submit"
          disabled={!isValid || loading}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white transition shadow-lg shadow-indigo-600/20 text-sm"
        >
          {loading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};
