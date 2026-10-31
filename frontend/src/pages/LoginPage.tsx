import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Shield, Briefcase, BarChart3, UserCheck } from 'lucide-react';
import { login } from '../api';
import { User } from '../types';

interface LoginPageProps {
  user: User | null;
  onLoginSuccess: (token: string, user: User) => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  user,
  onLoginSuccess,
  onError,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@brightloop.io');
  const [password, setPassword] = useState('Admin@Brightloop2026!');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/workspace');
      else navigate('/portal');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await login(email, password);
      onLoginSuccess(res.token, res.user);
      onSuccess(`Welcome back, ${res.user.email} (${res.user.role})!`);
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'staff') navigate('/workspace');
      else navigate('/portal');
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const setFastLogin = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-[#0A0A0A] rounded-xl border border-[#222222] overflow-hidden">
      <div className="p-6 bg-[#000000] border-b border-[#222222] text-center">
        {/* Minimalist Vercel Triangle Logo */}
        <div className="flex justify-center mb-2">
          <svg viewBox="0 0 75 65" height="24" width="28" fill="currentColor" className="text-white">
            <polygon points="37.5,0 75,65 0,65" />
          </svg>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-white">Sign In to Brightloop</h2>
        <p className="text-xs text-[#888888] font-mono mt-1">Zero-SaaS Subscription Management & ERP</p>
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-[#000000] p-3 rounded-lg border border-[#222222] text-xs">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#888888] mb-2">1-Click Fast Login Credentials:</div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setFastLogin('admin@brightloop.io', 'Admin@Brightloop2026!')}
              className="flex items-center gap-1.5 p-1.5 rounded bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-[#EDEDED] transition"
            >
              <Shield className="w-3 h-3 text-[#0070F3]" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setFastLogin('staff@brightloop.io', 'Staff@Brightloop2026!')}
              className="flex items-center gap-1.5 p-1.5 rounded bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-[#EDEDED] transition"
            >
              <Briefcase className="w-3 h-3 text-[#10B981]" />
              <span>Staff / Sales</span>
            </button>
            <button
              type="button"
              onClick={() => setFastLogin('finance@brightloop.io', 'Finance@Brightloop2026!')}
              className="flex items-center gap-1.5 p-1.5 rounded bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-[#EDEDED] transition"
            >
              <BarChart3 className="w-3 h-3 text-[#F5A623]" />
              <span>Finance Lead</span>
            </button>
            <button
              type="button"
              onClick={() => setFastLogin('customer@brightloop.io', 'Customer@Brightloop2026!')}
              className="flex items-center gap-1.5 p-1.5 rounded bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-[#EDEDED] transition"
            >
              <UserCheck className="w-3 h-3 text-[#7928CA]" />
              <span>Customer</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono text-[#888888]">Password</label>
              <Link to="/forgot-password" className="text-xs font-mono text-[#888888] hover:text-white transition">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#EAEAEA] text-black font-semibold py-2.5 rounded-md text-xs transition disabled:opacity-40"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-[#888888] pt-3 border-t border-[#161616]">
          Need a customer subscription account?{' '}
          <Link to="/signup" className="text-white font-medium hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
