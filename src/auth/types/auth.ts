import type { TSID_String } from "@/global/types/common";

export enum ProviderInfo {
  KAKAO = "KAKAO",
  NAVER = "NAVER",
}

export interface AuthPrincipal {
  userId: TSID_String;
  authorities: string[];
}

export interface AuthSession {
  accessToken: string;
  principal: AuthPrincipal;
}

export interface AuthStatusResponse {
  refreshTokenPresent: boolean;
}

export interface PasswordLoginRequest {
  email: string;
  password: string;
}

export interface PasswordSignupRequest extends PasswordLoginRequest {
  nickname: string;
}

export type AuthPhase =
  | "uninitialized"
  | "restoring"
  | "anonymous"
  | "authenticated"
  | "unavailable";

export type AuthState =
  | { phase: "uninitialized" | "restoring" | "anonymous" | "unavailable"; session: null }
  | { phase: "authenticated"; session: AuthSession };
