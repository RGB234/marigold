import { TSID_String } from "@/shared/types/common";

export type UserStatus = "ACTIVE" | "DELETED" | "BANNED" | "SLEEP";

/**
 * 유저 프로필 응답 (UserInfoDto)
 */
export interface UserInfoDto {
    id: TSID_String;
    nickname: string;
    imageUrl: string | null;
    status?: UserStatus;
}

export type LinkedOAuthProvider = "KAKAO" | "NAVER";

export interface UserSecurityInfoDto {
    email: string | null;
    hasLocalCredentials: boolean;
    providerInfo: LinkedOAuthProvider | null;
    hasOAuth2Link: boolean;
}

/**
 * 프로필 수정 요청. 새 이미지는 API 모듈이 업로드 토큰으로 바꿔 보냅니다.
 */
export interface UserUpdateRequest {
    nickname: string;
    removeImage: boolean;
}

export interface RegisterEmailPasswordDto {
    email: string;
    password: string;
}
