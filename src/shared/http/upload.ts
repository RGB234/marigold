import api, { UPLOAD_TIMEOUT_MS } from "@/shared/http/client";

export type UploadPurpose =
  | "ADOPTION_POST_IMAGE"
  | "ADOPTION_COMMENT_IMAGE"
  | "USER_PROFILE_IMAGE"
  | "CHAT_ATTACHMENT";

interface UploadIssueResponse {
  uploadUrl: string;
  contentType: string;
  uploadToken: string;
}

/** 저장소로 파일을 직접 PUT하지 못했습니다. 서버 Problem Details가 없어 따로 구분합니다. */
export class DirectUploadError extends Error {
  constructor(readonly status?: number) {
    super(status ? `direct upload failed: status=${status}` : "direct upload failed");
    this.name = "DirectUploadError";
  }
}

/**
 * 파일을 저장소에 직접 올리고, 도메인 API에 보낼 업로드 토큰을 파일 순서대로 돌려줍니다.
 */
export const uploadFiles = async (purpose: UploadPurpose, files: File[]): Promise<string[]> => {
  if (files.length === 0) {
    return [];
  }

  const { data } = await api.post<UploadIssueResponse[]>("/storage/uploads", {
    purpose,
    files: files.map((file) => ({ fileName: file.name, size: file.size })),
  });
  await Promise.all(data.map((issued, index) => putFile(issued, files[index])));
  return data.map((issued) => issued.uploadToken);
};

// 공용 apiClient를 쓰지 않는다. 인터셉터가 붙이는 인증·CSRF 헤더와 쿠키 때문에 S3 presigned URL 서명이 어긋나거나 CORS에서 막힌다.
const putFile = async (issued: UploadIssueResponse, file: File): Promise<void> => {
  let response: Response;
  try {
    response = await fetch(issued.uploadUrl, {
      method: "PUT",
      // S3는 발급 때 서명한 Content-Type과 다르면 거부한다
      headers: { "Content-Type": issued.contentType },
      body: file,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });
  } catch {
    throw new DirectUploadError();
  }
  if (!response.ok) {
    throw new DirectUploadError(response.status);
  }
};
