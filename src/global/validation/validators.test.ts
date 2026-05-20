import { describe, expect, it } from "vitest";
import { validationPolicy } from "@/global/validation/validationPolicy";
import {
  validateChatAttachmentFiles,
  validateImageFiles,
  validateNickname,
  validatePassword,
  validateTsid,
} from "@/global/validation/validators";

const file = (name: string, type: string, size: number) => {
  return new File(["a".repeat(size)], name, { type });
};

describe("validation policy validators", () => {
  it("uses shared password minimum length", () => {
    expect(validatePassword("a".repeat(validationPolicy.password.minLength - 1))).not.toBeNull();
    expect(validatePassword("a".repeat(validationPolicy.password.minLength))).toBeNull();
  });

  it("uses shared nickname policy", () => {
    expect(validateNickname("가")).not.toBeNull();
    expect(validateNickname("가나")).toBeNull();
    expect(validateNickname("invalid!")).not.toBeNull();
  });

  it("uses shared image type, size, and count policy", () => {
    expect(
      validateImageFiles([file("image.png", "image/png", validationPolicy.image.maxSizeBytes)], {
        field: "images",
        minCount: validationPolicy.adoptionPost.images.minCount,
        maxCount: validationPolicy.adoptionPost.images.maxCount,
      }),
    ).toBeNull();

    expect(
      validateImageFiles([file("image.png", "image/png", validationPolicy.image.maxSizeBytes + 1)], {
        field: "images",
        minCount: validationPolicy.adoptionPost.images.minCount,
        maxCount: validationPolicy.adoptionPost.images.maxCount,
      }),
    ).not.toBeNull();
  });

  it("uses shared chat attachment policy", () => {
    expect(
      validateChatAttachmentFiles([
        file("document.pdf", "application/pdf", validationPolicy.chatAttachment.maxFileSizeBytes),
      ]),
    ).toBeNull();

    expect(validateChatAttachmentFiles([file("script.exe", "", 10)])).not.toBeNull();
  });

  it("uses shared tsid policy", () => {
    expect(validateTsid("01ARZ3NDEKTSV")).toBe(true);
    expect(validateTsid("not-valid")).toBe(false);
  });
});
