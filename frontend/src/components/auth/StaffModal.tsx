import React, { useState } from 'react';
import { X, Shield, CheckCircle } from 'lucide-react';
import { createStaff } from '../../api';
import { PasswordValidatorWidget, isPasswordValid } from './PasswordValidatorWidget';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffCreated: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  onStaffCreated,
  onError,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      onError('Password does not meet complexity requirements.');
      return;
    }

    try {
      setLoading(true);
      await createStaff(email, password);
      onSuccess(`Internal staff account created for ${email}`);
      setEmail('');
      setPassword('');
      onStaffCreated();
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to create staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0A0A0A] rounded-xl max-w-md w-full overflow-hidden border border-[#222222]">
        <div className="p-4 bg-[#000000] border-b border-[#222222] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-white" />
            <h3 className="font-semibold text-xs tracking-wider uppercase text-[#CCCCCC]">Provision Internal Staff Account</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#1A1A1A] rounded text-[#888888] hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">Staff Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@brightloop.io"
              required
              className="w-full text-xs bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">Initial Temporary Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="StaffSecret2026!"
              required
              className="w-full text-xs font-mono bg-[#000000] border border-[#222222] focus:border-white rounded-md px-3 py-2 text-[#EDEDED] placeholder-[#555555] outline-none transition"
            />
          </div>

          <PasswordValidatorWidget password={password} />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#161616]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-[#888888] hover:text-[#EDEDED] rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isPasswordValid(password) || !email}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white hover:bg-[#EAEAEA] text-black rounded-md transition disabled:opacity-40"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Provision Staff'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
