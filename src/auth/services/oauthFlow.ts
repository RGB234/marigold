import {
  clearPendingAuthState,
  savePendingAuthState,
  type PendingAuthState,
} from "@/auth/utils/pendingAuth";
import { ProviderInfo } from "@/auth/types/auth";

interface OAuthOptions extends Partial<PendingAuthState> {
  action?: "link";
}

export function startOAuth(provider: ProviderInfo, options: OAuthOptions = {}): void {
  if (options.redirectTo) {
    savePendingAuthState({
      redirectTo: options.redirectTo,
      expectedUserId: options.expectedUserId ?? null,
      grantSecurityAccess: options.grantSecurityAccess,
    });
  } else {
    clearPendingAuthState();
  }

  const baseUrl =
    provider === ProviderInfo.KAKAO
      ? import.meta.env.VITE_API_OAUTH2_KAKAO
      : import.meta.env.VITE_API_OAUTH2_NAVER;
  const url = new URL(baseUrl);

  if (options.action) {
    url.searchParams.set("action", options.action);
  }

  window.location.assign(url.toString());
}
