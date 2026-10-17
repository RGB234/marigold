import axios from "axios";
import type { ProblemDetail } from "@/shared/types/common";
import { isProblemDetail } from "@/shared/types/common";
import { getErrorMessage } from "@/shared/errors/errorMessages";

export type AppError =
  | { type: "api"; status: number; problem: ProblemDetail | null }
  | { type: "network" }
  | { type: "timeout" }
  | { type: "cancelled" }
  | { type: "unknown"; cause: unknown };

export function extractProblemDetail(error: unknown): ProblemDetail | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const responseData = error.response?.data;
  return isProblemDetail(responseData) ? responseData : null;
}

export function normalizeApiError(error: unknown): AppError {
  if (!axios.isAxiosError(error)) {
    return { type: "unknown", cause: error };
  }
  if (error.code === "ERR_CANCELED") {
    return { type: "cancelled" };
  }
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return { type: "timeout" };
  }
  if (!error.response) {
    return { type: "network" };
  }
  return {
    type: "api",
    status: error.response.status,
    problem: isProblemDetail(error.response.data) ? error.response.data : null,
  };
}

export function getApiErrorMessage(error: unknown, fallback?: string): string {
  const normalized = normalizeApiError(error);
  switch (normalized.type) {
    case "cancelled":
      return "";
    case "network":
      return "서버에 연결할 수 없습니다. 네트워크 상태를 확인한 후 다시 시도해주세요.";
    case "timeout":
      return "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.";
    case "api":
      return getErrorMessage(normalized.problem, fallback);
    default:
      return getErrorMessage(null, fallback);
  }
}
