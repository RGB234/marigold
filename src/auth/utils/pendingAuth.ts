import type { TSID_String } from "@/global/types/common";

const PENDING_AUTH_STORAGE_KEY = "auth.pending";

export interface PendingAuthState {
  redirectTo: string;
  expectedUserId?: TSID_String | null;
  grantSecurityAccess?: boolean;
}

export function savePendingAuthState(state: PendingAuthState): void {
  sessionStorage.setItem(PENDING_AUTH_STORAGE_KEY, JSON.stringify(state));
}

export function getPendingAuthState(): PendingAuthState | null {
  const rawValue = sessionStorage.getItem(PENDING_AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as PendingAuthState;
  } catch {
    clearPendingAuthState();
    return null;
  }
}

export function clearPendingAuthState(): void {
  sessionStorage.removeItem(PENDING_AUTH_STORAGE_KEY);
}
