import { describe, expect, it } from "vitest";
import { normalizeApiError } from "@/global/utils/apiError";

describe("normalizeApiError", () => {
  it("Problem Details 응답을 API 오류로 정규화한다", () => {
    const problem = {
      type: "urn:marigold:error:INVALID_INPUT_VALUE",
      title: "Bad Request",
      status: 400,
      detail: "입력값이 올바르지 않습니다.",
      errorCode: "INVALID_INPUT_VALUE",
    };

    expect(
      normalizeApiError({
        isAxiosError: true,
        response: { status: 400, data: problem },
      }),
    ).toEqual({ type: "api", status: 400, problem });
  });

  it("응답이 없으면 네트워크 오류로 분류한다", () => {
    expect(normalizeApiError({ isAxiosError: true, code: "ERR_NETWORK" })).toEqual({
      type: "network",
    });
  });

  it("취소와 timeout을 구분한다", () => {
    expect(normalizeApiError({ isAxiosError: true, code: "ERR_CANCELED" })).toEqual({
      type: "cancelled",
    });
    expect(normalizeApiError({ isAxiosError: true, code: "ECONNABORTED" })).toEqual({
      type: "timeout",
    });
  });
});
