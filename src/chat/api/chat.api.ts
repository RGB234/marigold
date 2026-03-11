import api from "@/global/api";
import { ChatRoomDto, ChatMessageDto } from "@/chat/types/chat";

export const createChatRoom = async (receiverId: string): Promise<ChatRoomDto> => {

    console.log((await api.post<ChatRoomDto>(`/chat/rooms?receiverId=${receiverId}`)));
    return (await api.post<ChatRoomDto>(`/chat/rooms?receiverId=${receiverId}`)).data;
};

export const getMyChatRooms = async (): Promise<ChatRoomDto[]> => {
    return (await api.get<ChatRoomDto[]>("/chat/rooms")).data;
};

export const getChatRoomMessages = async (roomId: number): Promise<ChatMessageDto[]> => {
    return (await api.get<ChatMessageDto[]>(`/chat/rooms/${roomId}/messages`)).data;
};
