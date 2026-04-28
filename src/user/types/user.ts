import { TSID_String } from "@/global/types/common";

export type UserStatus = "ACTIVE" | "DELETED" | "BANNED" | "SLEEP";

/**
 * 유저 프로필 응답 (UserInfoDto)
 */
export interface UserInfoDto {
    id: TSID_String;
    nickname: string;
    imageUrl: string;
    status?: UserStatus;
}

export type LinkedOAuthProvider = "KAKAO" | "NAVER";

export interface UserSecurityInfoDto {
    email: string | null;
    hasLocalCredentials: boolean;
    providerInfo: LinkedOAuthProvider | null;
    hasOAuth2Link: boolean;
}

export interface RegisterEmailPasswordDto {
    email: string;
    password: string;
}
