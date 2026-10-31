import React, { useState } from 'react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { UserSummary } from '../../types';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { StaffManagement } from './StaffManagement';

export type AuthSubTab = 'login' | 'signup' | 'forgot' | 'reset' | 'staff';

interface AuthSectionProps {
  currentUser: UserSummary | null;
  onLoginSuccess: (user: UserSummary) => void;
  onSignupSuccess: (user: UserSummary) => void;
  onForgotSuccess: (msg: string) => void;
  onResetSuccess: (msg: string) => void;
  onStaffSuccess: (user: UserSummary) => void;
  onError: (error: string) => void;
  activeSubTab?: AuthSubTab;
  onSubTabChange?: (tab: AuthSubTab) => void;
  initialResetToken?: string;
  prefillEmail?: string;
  prefillPassword?: string;
}

export const AuthSection: React.FC<AuthSectionProps> = ({
  currentUser,
  onLoginSuccess,
  onSignupSuccess,
  onForgotSuccess,
  onResetSuccess,
  onStaffSuccess,
  onError,
  activeSubTab = 'login',
  onSubTabChange,
  initialResetToken,
  prefillEmail,
  prefillPassword,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<AuthSubTab>(activeSubTab);
  const currentSubTab = onSubTabChange ? activeSubTab : internalSubTab;

  const setSubTab = (tab: AuthSubTab) => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Authentication & Role-Based Access Control (RBAC)
            </h2>
            <p className="text-xs text-slate-400">
              Self-built Argon2 password hashing, custom password complexity validator, HMAC-SHA256 JWT, and Axum extractors.
            </p>
          </div>

          {/* Sub tabs */}
          <div className="flex flex-wrap space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSubTab('login')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                currentSubTab === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setSubTab('signup')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                currentSubTab === 'signup' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Customer Signup
            </button>
            <button
              onClick={() => setSubTab('forgot')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                currentSubTab === 'forgot' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Forgot Password
            </button>
            <button
              onClick={() => setSubTab('reset')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                currentSubTab === 'reset' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Reset Password
            </button>
            <button
              onClick={() => setSubTab('staff')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                currentSubTab === 'staff'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Staff Onboarding (Admin)
            </button>
          </div>
        </div>

        {/* SubTab Content */}
        {currentSubTab === 'login' && (
          <LoginForm
            onSuccess={onLoginSuccess}
            onError={onError}
            prefillEmail={prefillEmail}
            prefillPassword={prefillPassword}
          />
        )}
        {currentSubTab === 'signup' && (
          <SignupForm onSuccess={onSignupSuccess} onError={onError} />
        )}
        {currentSubTab === 'forgot' && (
          <ForgotPasswordForm onSuccess={onForgotSuccess} onError={onError} />
        )}
        {currentSubTab === 'reset' && (
          <ResetPasswordForm
            initialToken={initialResetToken}
            onSuccess={onResetSuccess}
            onError={onError}
          />
        )}
        {currentSubTab === 'staff' && (
          <StaffManagement onSuccess={onStaffSuccess} onError={onError} />
        )}
      </div>
    </div>
  );
};
