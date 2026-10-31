import { useState, useRef } from 'react';
import { NotificationState } from '../components/common/NotificationBanner';

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const timerRef = useRef<any>(null);

  const notify = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification({ text, type });
    timerRef.current = setTimeout(() => setNotification(null), 6000);
  };

  const clearNotification = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(null);
  };

  return { notification, notify, clearNotification };
}
