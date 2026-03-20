import {Long_String, TSID_String} from "@/global/types/common.ts";

export interface ChatRoomDto {
    id: TSID_String;
    parentPostId: Long_String;
    parentPostTitle: string;
    user1Id: TSID_String; // TSID
    user1Nickname: string;
    user2Id: TSID_String;
    user2Nickname: string;
    createdAt: string;
}

export interface ChatMessageDto {
    roomId: TSID_String;
    senderId: TSID_String;
    senderNickname: string;
    message: string;
    createdAt: string;
}
