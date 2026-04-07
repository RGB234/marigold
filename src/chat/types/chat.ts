import {Long_String, PageResponse, TSID_String} from "@/global/types/common.ts";

export interface ChatRoomDto {
    id: TSID_String;
    postId: Long_String;
    postTitle: string;
    postWriterId: TSID_String;
    user1Id: TSID_String; // TSID
    user1Nickname: string;
    user2Id: TSID_String;
    user2Nickname: string;
    createdAt: string;
    status: 'ACTIVE' | 'CLOSED';
}

export interface ChatMessageDto {
    roomId: TSID_String;
    senderId: TSID_String;
    senderNickname: string;
    senderImageUrl: string;
    message: string;
    createdAt: string;
}

export type ChatRoomPageResponse = PageResponse<ChatRoomDto>;
