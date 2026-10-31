import React, { useState, useEffect } from 'react';
import { Mail, X, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDevEmails } from '../../api';
import { LocalEmail } from '../../types';

export const OutboxDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [emails, setEmails] = useState<LocalEmail[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const data = await getDevEmails();
      setEmails(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  const handleApplyReset = (html: string) => {
    const match = html.match(/token=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      setIsOpen(false);
      navigate(`/reset-password?token=${match[1]}`);
    }
  };

  return (
    <>
      <button
        data-testid="outbox-toggle-btn"
        aria-label="Toggle Outbox"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-[#0A0A0A] hover:bg-[#111111] text-[#EDEDED] px-3.5 py-2 rounded-full shadow-2xl transition border border-[#222222] hover:border-[#444444] font-mono text-xs"
      >
        <Mail className="w-3.5 h-3.5 text-[#0070F3]" />
        <span>Outbox ({emails.length})</span>
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0A0A0A] shadow-2xl border-l border-[#222222] flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-4 bg-[#000000] border-b border-[#222222] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#0070F3]" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-[#CCCCCC]">Local Email Outbox</h3>
            </div>
            <div className="flex items-center gap-1">
              <button data-testid="outbox-refresh-btn" onClick={fetchEmails} className="p-1 hover:bg-[#1A1A1A] rounded text-[#888888] hover:text-white transition" title="Refresh">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-[#1A1A1A] rounded text-[#888888] hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#000000] border-b border-[#222222] text-[11px] font-mono text-[#888888]">
            Self-hosted SMTP table: password resets & invoice notifications with zero external dependencies.
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {emails.length === 0 ? (
              <div className="text-center py-12 text-[#666666] font-mono text-xs">No sent emails recorded yet.</div>
            ) : (
              emails.map((email) => {
                const isExpanded = expandedId === email.id;
                const hasResetToken = email.body_html.includes('token=');
                return (
                  <div key={email.id} className="border border-[#222222] rounded-lg p-3 hover:border-[#333333] transition bg-[#000000]">
                    <div
                      data-testid="outbox-email-header"
                      className="cursor-pointer flex items-start justify-between"
                      onClick={() => setExpandedId(isExpanded ? null : email.id)}
                    >
                      <div className="pr-2">
                        <div className="text-xs font-semibold text-[#EDEDED]">{email.subject}</div>
                        <div className="text-[11px] font-mono text-[#888888] mt-0.5">To: {email.recipient_email}</div>
                        <div className="text-[10px] font-mono text-[#666666] mt-0.5">{new Date(email.created_at).toLocaleTimeString()}</div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#888888]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#1A1A1A]">
                        <div
                          className="text-xs text-[#CCCCCC] bg-[#0A0A0A] p-2.5 rounded border border-[#222222] max-h-48 overflow-y-auto font-mono text-[11px]"
                          dangerouslySetInnerHTML={{ __html: email.body_html }}
                        />
                        {hasResetToken && (
                          <button
                            data-testid="apply-reset-link-btn"
                            onClick={() => handleApplyReset(email.body_html)}
                            className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-white hover:bg-[#EAEAEA] text-black text-xs font-semibold py-1.5 px-3 rounded-md transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Apply Reset Link Directly</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};
