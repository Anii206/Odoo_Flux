import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface PasswordPolicyCheck {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  special: boolean;
}

export function evaluatePasswordPolicy(password: string): PasswordPolicyCheck {
  return {
    length: password.length > 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    special: /[^a-zA-Z0-9\s]/.test(password),
  };
}

export function isPasswordValid(input: PasswordPolicyCheck | string): boolean {
  const checks = typeof input === 'string' ? evaluatePasswordPolicy(input) : input;
  return checks.length && checks.uppercase && checks.lowercase && checks.special;
}

interface PasswordValidatorWidgetProps {
  checks?: PasswordPolicyCheck;
  password?: string;
}

export const PasswordValidatorWidget: React.FC<PasswordValidatorWidgetProps> = ({ checks, password }) => {
  const activeChecks = checks ?? (password !== undefined ? evaluatePasswordPolicy(password) : {
    length: false,
    uppercase: false,
    lowercase: false,
    special: false,
  });

  return (
    <div className="p-3 bg-[#000000] border border-[#222222] rounded-lg space-y-2 text-xs">
      <div className="font-mono text-[10px] uppercase tracking-wider text-[#888888]">
        Password Complexity Rules:
      </div>
      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
        <div className={`flex items-center gap-1.5 ${activeChecks.length ? 'text-[#10B981]' : 'text-[#666666]'}`}>
          {activeChecks.length ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          &gt; 8 Characters
        </div>
        <div className={`flex items-center gap-1.5 ${activeChecks.uppercase ? 'text-[#10B981]' : 'text-[#666666]'}`}>
          {activeChecks.uppercase ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          &ge; 1 Uppercase
        </div>
        <div className={`flex items-center gap-1.5 ${activeChecks.lowercase ? 'text-[#10B981]' : 'text-[#666666]'}`}>
          {activeChecks.lowercase ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          &ge; 1 Lowercase
        </div>
        <div className={`flex items-center gap-1.5 ${activeChecks.special ? 'text-[#10B981]' : 'text-[#666666]'}`}>
          {activeChecks.special ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          &ge; 1 Special Char
        </div>
      </div>
    </div>
  );
};
