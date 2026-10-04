import type { ProblemDetail } from "@/global/types/common";

// 언어를 추가할 때 같은 errorCode 키로 사전을 등록합니다.
export const errorMessages: Record<string, Record<string, string>> = {
  ko: {
    ADOPTION_COMMENT_DELETED: "이미 삭제된 댓글입니다.",
    ADOPTION_COMMENT_IMAGE_INVALID: "댓글 이미지 정보가 올바르지 않습니다.",
    ADOPTION_COMMENT_NOT_FOUND: "존재하지 않는 댓글입니다.",
    ADOPTION_COMMENT_POST_MISMATCH: "해당 게시글의 댓글이 아닙니다.",
    ADOPTION_POST_ALREADY_COMPLETED: "이미 입양 완료된 게시글입니다.",
    ADOPTION_POST_DELETED: "삭제된 게시글입니다.",
    ADOPTION_POST_IMAGE_INVALID: "입양 게시글 이미지 정보가 올바르지 않습니다.",
    ADOPTION_POST_NOT_COMPLETED: "입양 완료 상태가 아닙니다.",
    ADOPTION_POST_NOT_FOUND: "존재하지 않는 입양 게시글입니다.",
    AUTH_ACCESS_DENIED: "권한이 없습니다.",
    AUTH_INTERNAL_SERVER_ERROR: "인증과정에서 서버 오류가 발생했습니다.",
    AUTH_INVALID_CREDENTIALS: "이메일이나 비밀번호가 올바르지 않습니다.",
    AUTH_INVALID_PROVIDER: "지원하지 않는 OAuth2 Provider입니다.",
    AUTH_OAUTH2_LOGIN_FAILURE: "OAuth2 로그인이 실패했습니다.",
    AUTH_OAUTH2_USER_INFO_NOT_FOUND: "OAuth2 사용자 정보를 찾을 수 없습니다.",
    AUTH_RECENT_AUTH_REQUIRED: "최근 인증이 필요합니다.",
    AUTH_TOKEN_EXPIRED: "토큰이 만료되었습니다.",
    AUTH_TOKEN_INVALID: "토큰이 유효하지 않습니다.",
    AUTH_UNAUTHORIZED: "인증이 필요합니다.",
    CHAT_MESSAGE_EMPTY: "메시지 또는 첨부파일을 입력해주세요.",
    CHAT_PARTICIPANT_ALREADY_EXISTS: "이미 참여 중인 채팅방입니다.",
    CHAT_ROOM_CLOSED: "종료된 채팅방에는 메시지를 보낼 수 없습니다.",
    CHAT_ROOM_NOT_FOUND: "존재하지 않는 채팅방입니다.",
    CHAT_ROOM_TYPE_INVALID: "채팅방 조회 유형이 올바르지 않습니다.",
    FILE_INVALID: "파일이 올바르지 않습니다.",
    FILE_NOT_FOUND: "파일을 찾을 수 없습니다.",
    FILE_READ_FAILED: "파일을 읽는 중 오류가 발생했습니다.",
    FILE_TOO_LARGE: "파일 또는 요청의 최대 업로드 용량을 초과했습니다.",
    FILE_UPLOAD_FAILED: "파일 업로드에 실패했습니다.",
    INTERNAL_SERVER_ERROR: "서버 오류가 발생했습니다.",
    INVALID_INPUT_VALUE: "입력값이 올바르지 않습니다.",
    RESOURCE_CONFLICT: "이미 존재하는 데이터와 충돌합니다.",
    RESOURCE_NOT_FOUND: "요청한 리소스를 찾을 수 없습니다.",
    USER_ALREADY_EXISTS: "이미 존재하는 사용자입니다.",
    USER_BANNED: "이용이 제한된 사용자입니다.",
    USER_DELETED: "탈퇴한 사용자입니다.",
    USER_IMAGE_CONFLICT: "프로필 이미지가 변경되었습니다. 다시 시도해주세요.",
    USER_LOCAL_CREDENTIALS_ALREADY_EXISTS: "이미 이메일/비밀번호 로그인 정보가 등록된 사용자입니다.",
    USER_NICKNAME_ALREADY_EXISTS: "이미 존재하는 닉네임입니다.",
    USER_NOT_FOUND: "존재하지 않는 사용자입니다.",
    USER_OAUTH2_ACCOUNT_ALREADY_IN_USE: "이미 다른 계정에 연결된 소셜 계정입니다.",
    USER_OAUTH2_ALREADY_LINKED: "이미 소셜 로그인 정보가 연동된 사용자입니다.",
    USER_SLEEPING: "휴면 상태인 사용자입니다.",
  },
};

export function getErrorMessage(
  problem: Pick<ProblemDetail, "errorCode" | "detail"> | null | undefined,
  fallback = "예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  locale = "ko",
): string {
  const messages = errorMessages[locale];
  const code = problem?.errorCode;
  const translated = code && messages && Object.hasOwn(messages, code) ? messages[code] : undefined;
  return translated || problem?.detail || fallback;
}
