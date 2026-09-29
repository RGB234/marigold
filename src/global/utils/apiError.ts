import axios from "axios";
import type { ProblemDetail } from "@/global/types/common";
import { isProblemDetail } from "@/global/types/common";

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
