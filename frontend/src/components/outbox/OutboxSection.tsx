import React, { useState } from 'react';
import { Mail, RefreshCw, Eye, KeyRound } from 'lucide-react';
import { LocalEmail } from '../../types';
import { EmailPreviewModal } from './EmailPreviewModal';

interface OutboxSectionProps {
  emails: LocalEmail[];
  onRefresh: () => void;
  onUseToken: (token: string) => void;
}

export const OutboxSection: React.FC<OutboxSectionProps> = ({
  emails,
  onRefresh,
  onUseToken,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<LocalEmail | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              Self-Hosted Outbox / Dev Mailbox (local_emails)
            </h2>
            <p className="text-xs text-slate-400">
              Captures all outgoing password resets and notifications directly in PostgreSQL. Zero external email SaaS required.
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Outbox
          </button>
        </div>

        {emails.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No emails in the outbox yet. Use "Forgot Password" to trigger a reset email!
          </div>
        ) : (
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            {emails.map((m) => (
              <div
                key={m.id}
                className="p-4 hover:bg-slate-900/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200 text-sm">{m.subject}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
                      To: {m.recipient_email}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    ID: {m.id} &bull; {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedEmail(m)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View HTML Body
                  </button>
                  {m.body_html.includes('token=') && (
                    <button
                      onClick={() => {
                        const match = m.body_html.match(/token=([a-zA-Z0-9_-]+)/);
                        if (match && match[1]) {
                          onUseToken(match[1]);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Use Reset Link
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EmailPreviewModal email={selectedEmail} onClose={() => setSelectedEmail(null)} />
    </div>
  );
};
