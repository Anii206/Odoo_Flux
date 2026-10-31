import { request } from './client';
import { LocalEmail } from '../types';

export async function getDevEmails(): Promise<LocalEmail[]> {
  return request<LocalEmail[]>('/dev/emails');
}

export const outboxApi = {
  getDevEmails,
};
