import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export interface NotificationState {
  text: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationBannerProps {
  notification: NotificationState | null;
  onDismiss: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ notification, onDismiss }) => {
  if (!notification) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-3 w-full animate-in fade-in slide-in-from-top-2 duration-150">
      <div
        className={`px-4 py-2.5 rounded-lg flex items-center justify-between text-xs font-mono border backdrop-blur-md ${
          notification.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
            : notification.type === 'error'
            ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
            : 'bg-[#111111]/90 border-[#333333] text-[#CCCCCC]'
        }`}
      >
        <div className="flex items-center gap-2">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          ) : notification.type === 'error' ? (
            <XCircle className="w-4 h-4 text-[#EE0000] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#0070F3] shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
        <button
          onClick={onDismiss}
          className="text-[11px] text-[#888888] hover:text-white ml-4 font-mono transition"
        >
          [dismiss]
        </button>
      </div>
    </div>
  );
};
