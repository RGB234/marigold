import type { TSID_String } from "@/global/types/common";

const SECURITY_ACCESS_STORAGE_KEY = "user.security.access";
const SECURITY_ACCESS_TTL_MS = 5 * 60 * 1000;

interface SecurityAccessState {
  userId: TSID_String;
  grantedAt: number;
  token: string;
}

export function grantSecurityAccess(userId: TSID_String): void {
  persistSecurityAccess({
    userId,
    grantedAt: Date.now(),
    token: createSecurityAccessToken(),
  });
}

export function hasSecurityAccess(userId: TSID_String): boolean {
  return getValidatedSecurityAccess(userId) !== null;
}

function getValidatedSecurityAccess(userId: TSID_String): SecurityAccessState | null {
  const rawValue = sessionStorage.getItem(SECURITY_ACCESS_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const state = JSON.parse(rawValue) as SecurityAccessState;
    const isExpired = Date.now() - state.grantedAt > SECURITY_ACCESS_TTL_MS;

    if (isExpired || state.userId !== userId || !state.token) {
      clearSecurityAccess();
      return null;
    }

    return state;
  } catch {
    clearSecurityAccess();
    return null;
  }
}

export function clearSecurityAccess(): void {
  sessionStorage.removeItem(SECURITY_ACCESS_STORAGE_KEY);
}

function persistSecurityAccess(state: SecurityAccessState): void {
  sessionStorage.setItem(SECURITY_ACCESS_STORAGE_KEY, JSON.stringify(state));
}

function createSecurityAccessToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
