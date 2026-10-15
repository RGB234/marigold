import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./errorMessages";

describe("error message localization", () => {
  it("prefers a code translation over the server message", () => {
    expect(getErrorMessage({ errorCode: "AUTH_INVALID_CREDENTIALS", detail: "server" }))
      .toBe("이메일이나 비밀번호가 올바르지 않습니다.");
  });
  it("falls back to the server for unknown codes and unsupported languages", () => {
    expect(getErrorMessage({ errorCode: "FUTURE_CODE", detail: "server" })).toBe("server");
    expect(getErrorMessage({ errorCode: "AUTH_INVALID_CREDENTIALS", detail: "server" }, "fallback", "en"))
      .toBe("server");
  });
  it("uses the caller fallback when no public message exists", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
    expect(getErrorMessage({ errorCode: "toString" }, "fallback")).toBe("fallback");
  });
});
