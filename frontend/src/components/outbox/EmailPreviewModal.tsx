import React from 'react';
import { XCircle } from 'lucide-react';
import { LocalEmail } from '../../types';

interface EmailPreviewModalProps {
  email: LocalEmail | null;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ email, onClose }) => {
  if (!email) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="font-bold text-white text-sm">{email.subject}</h3>
            <p className="text-xs text-slate-400 font-mono">Recipient: {email.recipient_email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-white rounded-xl p-4 text-slate-900">
          <iframe
            srcDoc={email.body_html}
            title="Email Preview"
            className="w-full h-96 border-0"
          />
        </div>
      </div>
    </div>
  );
};
