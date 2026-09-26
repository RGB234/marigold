import type { ErrorDetail } from '@/global/types/common';

export interface StompErrorResponse {
  timestamp: string;
  errorCode: string;
  message: string;
  fatal: boolean;
  command?: string;
  destination?: string;
  errors?: ErrorDetail[];
}

export const parseStompErrorResponse = (body: string): StompErrorResponse | null => {
  try {
    const value: unknown = JSON.parse(body);
    if (typeof value !== 'object' || value === null) return null;

    const error = value as Partial<StompErrorResponse>;
    if (
      typeof error.timestamp !== 'string' ||
      typeof error.errorCode !== 'string' ||
      typeof error.message !== 'string' ||
      typeof error.fatal !== 'boolean'
    ) {
      return null;
    }
    return error as StompErrorResponse;
  } catch {
    return null;
  }
};
