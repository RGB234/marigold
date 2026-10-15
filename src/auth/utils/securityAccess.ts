import type { TSID_String } from "@/global/types/common";

const SECURITY_ACCESS_STORAGE_KEY = "user.security.access";
const SECURITY_ACCESS_TTL_MS = 5 * 60 * 1000;

interface SecurityAccessState {
  userId: TSID_String;
  grantedAt: number;
  token: string;
}

export function grantSecurityAccess(userId: TSID_String): void {
  sessionStorage.setItem(
    SECURITY_ACCESS_STORAGE_KEY,
    JSON.stringify({
      userId,
      grantedAt: Date.now(),
      token: createSecurityAccessToken(),
    } satisfies SecurityAccessState),
  );
}

export function hasSecurityAccess(userId: TSID_String): boolean {
  const rawValue = sessionStorage.getItem(SECURITY_ACCESS_STORAGE_KEY);
  if (!rawValue) {
    return false;
  }

  try {
    const state = JSON.parse(rawValue) as SecurityAccessState;
    const isExpired = Date.now() - state.grantedAt > SECURITY_ACCESS_TTL_MS;

    if (isExpired || state.userId !== userId || !state.token) {
      clearSecurityAccess();
      return false;
    }

    return true;
  } catch {
    clearSecurityAccess();
    return false;
  }
}

export function clearSecurityAccess(): void {
  sessionStorage.removeItem(SECURITY_ACCESS_STORAGE_KEY);
}

function createSecurityAccessToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
