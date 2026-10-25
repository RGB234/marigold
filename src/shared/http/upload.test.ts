import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/shared/http/client";
import { DirectUploadError, uploadFiles } from "@/shared/http/upload";
import { getApiErrorMessage } from "@/shared/errors/apiError";

vi.mock("@/shared/http/client", () => ({
  default: { post: vi.fn() },
  UPLOAD_TIMEOUT_MS: 60_000,
}));

const post = vi.mocked(api.post);
const fetchMock = vi.fn();

const file = (name: string, content = "x") => new File([content], name, { type: "image/png" });

describe("uploadFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not call the server when there are no files", async () => {
    await expect(uploadFiles("ADOPTION_POST_IMAGE", [])).resolves.toEqual([]);
    expect(post).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("puts each file to its issued URL and returns tokens in file order", async () => {
    const first = file("a.png", "first");
    const second = file("b.jpg", "second!");
    post.mockResolvedValue({
      data: [
        { uploadUrl: "https://bucket/a", contentType: "image/png", uploadToken: "token-a" },
        { uploadUrl: "https://bucket/b", contentType: "image/jpeg", uploadToken: "token-b" },
      ],
    });
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await expect(uploadFiles("ADOPTION_POST_IMAGE", [first, second])).resolves.toEqual([
      "token-a",
      "token-b",
    ]);

    expect(post).toHaveBeenCalledWith("/storage/uploads", {
      purpose: "ADOPTION_POST_IMAGE",
      files: [
        { fileName: "a.png", size: first.size },
        { fileName: "b.jpg", size: second.size },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://bucket/b",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: second,
      }),
    );
  });

  it("fails with DirectUploadError when the storage rejects the file", async () => {
    post.mockResolvedValue({
      data: [{ uploadUrl: "https://bucket/a", contentType: "image/png", uploadToken: "token-a" }],
    });
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));

    const result = uploadFiles("CHAT_ATTACHMENT", [file("a.png")]);

    await expect(result).rejects.toBeInstanceOf(DirectUploadError);
    await expect(result).rejects.toMatchObject({ status: 403 });
  });

  it("fails with DirectUploadError when the network request fails", async () => {
    post.mockResolvedValue({
      data: [{ uploadUrl: "https://bucket/a", contentType: "image/png", uploadToken: "token-a" }],
    });
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(uploadFiles("USER_PROFILE_IMAGE", [file("a.png")])).rejects.toBeInstanceOf(
      DirectUploadError,
    );
  });

  it("shows an upload failure message instead of a generic error", () => {
    expect(getApiErrorMessage(new DirectUploadError(403))).toContain("파일 업로드에 실패했습니다");
  });
});
