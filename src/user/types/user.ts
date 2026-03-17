import { TSID_String, ImageUrl } from "@/global/types/common";

/**
 * 유저 프로필 응답 (UserInfoDto)
 */
export interface UserProfileResponse {
    id: TSID_String;
    nickname: string;
    imageUrl: ImageUrl;
}
