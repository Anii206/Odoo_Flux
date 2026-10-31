import { useState, useCallback } from 'react';
import { getDevEmails } from '../api';
import { LocalEmail } from '../types';

export function useOutboxData(onError?: (error: string) => void) {
  const [emails, setEmails] = useState<LocalEmail[]>([]);

  const loadEmails = useCallback(async () => {
    try {
      const data = await getDevEmails();
      setEmails(data);
    } catch (err: unknown) {
      if (onError && err instanceof Error) onError(err.message);
    }
  }, [onError]);

  return { emails, loadEmails, refresh: loadEmails };
}
