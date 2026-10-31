import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';
import { forgotPassword } from '../api';

interface ForgotPasswordPageProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await forgotPassword(email);
      setSubmitted(true);
      onSuccess(`Password reset email written to self-hosted Local Outbox!`);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-[#0A0A0A] rounded-xl border border-[#222222] overflow-hidden">
      <div className="p-6 bg-[#000000] border-b border-[#222222] text-center">
        <div className="flex justify-center mb-2">
          <svg viewBox="0 0 75 65" height="24" width="28" fill="currentColor" className="text-white">
            <polygon points="37.5,0 75,65 0,65" />
          </svg>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-white">Account Recovery</h2>
        <p className="text-xs text-[#888888] font-mono mt-1">Zero-SaaS self-hosted password reset</p>
      </div>

      <div className="p-6 space-y-4">
        {submitted ? (
          <div className="bg-[#000000] border border-[#222222] rounded-lg p-4 text-xs text-[#CCCCCC] space-y-2">
            <div className="font-semibold font-mono flex items-center gap-1.5 text-white">
              <Mail className="w-4 h-4 text-[#0070F3]" />
              <span>Reset Email Generated!</span>
            </div>
            <p>
              A password reset link for <strong className="text-white font-mono">{email}</strong> has been logged to the{' '}
              <strong className="text-white">Local Outbox Drawer</strong> in the bottom right corner.
            </p>
            <p className="text-[#888888]">
              Open the Outbox drawer to view the email and click the one-click reset link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#888888] mb-1">Account Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="account@brightloop.io"
                required
                className="w-full text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#EAEAEA] text-black font-semibold py-2.5 rounded-md text-xs transition disabled:opacity-40"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{loading ? 'Generating...' : 'Send Recovery Link'}</span>
            </button>
          </form>
        )}

        <div className="text-center text-xs text-[#888888] pt-3 border-t border-[#161616]">
          <Link to="/login" className="text-white font-medium hover:underline">
            &larr; Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
