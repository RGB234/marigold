import { TSID_String } from "@/global/types/common";

/**
 * 유저 프로필 응답 (UserInfoDto)
 */
export interface UserInfoDto {
    id: TSID_String;
    nickname: string;
    imageUrl: string;
}
