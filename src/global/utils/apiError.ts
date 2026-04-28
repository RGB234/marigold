import axios from "axios";
import type { ApiResponse } from "@/global/types/common";
import { isApiResponse } from "@/global/types/common";

export function extractApiErrorResponse<T = unknown>(error: unknown): ApiResponse<T> | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const responseData = error.response?.data;
  return isApiResponse<T>(responseData) ? responseData : null;
}
