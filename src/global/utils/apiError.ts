import axios from "axios";
import type { ProblemDetail } from "@/global/types/common";
import { isProblemDetail } from "@/global/types/common";

export function extractProblemDetail(error: unknown): ProblemDetail | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const responseData = error.response?.data;
  return isProblemDetail(responseData) ? responseData : null;
}
