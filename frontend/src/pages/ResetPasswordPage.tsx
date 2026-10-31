import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Key } from 'lucide-react';
import { resetPassword } from '../api';
import { PasswordValidatorWidget, isPasswordValid } from '../components/auth/PasswordValidatorWidget';

interface ResetPasswordPageProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qToken = searchParams.get('token');
    if (qToken) setToken(qToken);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(newPassword)) {
      onError('New password must satisfy complexity requirements.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, newPassword);
      onSuccess('Password reset successfully! Please sign in with your new credentials.');
      navigate('/login');
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Password reset failed');
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
        <h2 className="text-lg font-bold tracking-tight text-white">Reset Password</h2>
        <p className="text-xs text-[#888888] font-mono mt-1">Provide your reset token and new secure password</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-mono text-[#888888] mb-1">Reset Security Token</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token from Outbox..."
            required
            className="w-full text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-[#888888] mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password..."
            required
            className="w-full text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
          />
        </div>

        <PasswordValidatorWidget password={newPassword} />

        <button
          type="submit"
          disabled={loading || !token || !isPasswordValid(newPassword)}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#EAEAEA] text-black font-semibold py-2.5 rounded-md text-xs transition disabled:opacity-40"
        >
          <Key className="w-3.5 h-3.5" />
          <span>{loading ? 'Resetting...' : 'Save New Password'}</span>
        </button>

        <div className="text-center text-xs text-[#888888] pt-3 border-t border-[#161616]">
          <Link to="/login" className="text-white font-medium hover:underline">
            &larr; Return to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};
