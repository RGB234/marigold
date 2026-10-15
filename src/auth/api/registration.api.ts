import api from "@/shared/api/apiClient";
import type { PasswordSignupRequest } from "@/auth/types/auth";

export async function registerWithPassword(payload: PasswordSignupRequest): Promise<void> {
  await api.post<void>("/auth/signup", payload, { skipAuthRefresh: true });
}
