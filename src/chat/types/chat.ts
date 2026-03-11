export interface ChatRoomDto {
    id: number;
    user1Id: string; // TSID
    user1Nickname: string;
    user2Id: string;
    user2Nickname: string;
    createdAt: string;
}

export interface ChatMessageDto {
    roomId: number;
    senderId: string;
    senderNickname: string;
    message: string;
    createdAt: string;
}
