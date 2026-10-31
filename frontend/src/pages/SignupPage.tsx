import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { signup } from '../api';
import { User } from '../types';
import { PasswordValidatorWidget, isPasswordValid } from '../components/auth/PasswordValidatorWidget';

interface SignupPageProps {
  onLoginSuccess: (token: string, user: User) => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  onLoginSuccess,
  onError,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      onError('Password does not meet all complexity requirements.');
      return;
    }

    try {
      setLoading(true);
      const res = await signup(email, password);
      onLoginSuccess(res.token, res.user);
      onSuccess(`Account created for ${res.user.email}! Welcome to Brightloop.`);
      navigate('/portal');
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Signup failed');
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
        <h2 className="text-lg font-bold tracking-tight text-white">Create Customer Account</h2>
        <p className="text-xs text-[#888888] font-mono mt-1">Self-service subscription billing & service management</p>
      </div>

      <div className="p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@company.com"
              required
              className="w-full text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">Secure Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              required
              className="w-full text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
          </div>

          <PasswordValidatorWidget password={password} />

          <button
            type="submit"
            disabled={loading || !isPasswordValid(password) || !email}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#EAEAEA] text-black font-semibold py-2.5 rounded-md text-xs transition disabled:opacity-40"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{loading ? 'Registering...' : 'Complete Registration'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-[#888888] pt-3 border-t border-[#161616]">
          Already registered?{' '}
          <Link to="/login" className="text-white font-medium hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
