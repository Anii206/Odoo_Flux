import React, { useState } from 'react';
import { api, setToken } from '../../api';
import { UserSummary } from '../../types';
import {
  PasswordValidatorWidget,
  evaluatePasswordPolicy,
  isPasswordValid,
} from './PasswordValidatorWidget';

interface SignupFormProps {
  onSuccess: (user: UserSummary) => void;
  onError: (error: string) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const checks = evaluatePasswordPolicy(password);
  const isValid = isPasswordValid(checks);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      onError('Password does not meet all security policy requirements.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.signup({ email, password });
      setToken(res.token);
      onSuccess(res.user);
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@example.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create complex password"
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
          {loading ? 'Creating Account...' : 'Sign Up as Customer'}
        </button>
      </form>
    </div>
  );
};
