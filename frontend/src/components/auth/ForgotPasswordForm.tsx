import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '../../api';

interface ForgotPasswordFormProps {
  onSuccess: (msg: string) => void;
  onError: (error: string) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      onSuccess(res.message);
      setEmail('');
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-4">
      <div className="mb-4 text-xs text-slate-400">
        Entering an email will generate a secure reset token and queue an HTML email into the self-hosted{' '}
        <code className="text-indigo-300">local_emails</code> table with zero SaaS dependencies.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Registered Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@brightloop.io"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-semibold text-white transition shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Dispatching...' : 'Dispatch Reset Token to Local Outbox'}
        </button>
      </form>
    </div>
  );
};
