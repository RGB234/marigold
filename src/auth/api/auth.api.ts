import api from "@/shared/api/apiClient";
import type {
  AuthSession,
  AuthStatusResponse,
  PasswordLoginRequest,
} from "@/auth/types/auth";

const localAuthRequest = {
  skipAuthRefresh: true,
};

export async function getAuthStatus(): Promise<AuthStatusResponse> {
  const { data } = await api.get<AuthStatusResponse>("/auth/status", localAuthRequest);
  return data;
}

export async function loginWithPassword(
  credentials: PasswordLoginRequest,
): Promise<AuthSession> {
  const { data } = await api.post<AuthSession>("/auth/login", credentials, localAuthRequest);
  return data;
}

export async function refreshAuthSession(): Promise<AuthSession> {
  const { data } = await api.post<AuthSession>("/auth/refresh", {}, localAuthRequest);
  return data;
}

export async function requestLogout(): Promise<void> {
  await api.post<void>("/auth/logout", {}, localAuthRequest);
}
