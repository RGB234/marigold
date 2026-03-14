import api from "@/global/api";
import {ChatMessageDto, ChatRoomDto} from "@/chat/types/chat";

export const createChatRoom = async (adoptionInfoId: BigInt, receiverId: string): Promise<ChatRoomDto> => {
  return (await api.post<ChatRoomDto>(`/chat/rooms`, {adoptionInfoId, receiverId})).data;
};

export const getMyChatRooms = async (): Promise<ChatRoomDto[]> => {
  return (await api.get<ChatRoomDto[]>("/chat/rooms")).data;
};

export const getChatRoomMessages = async (roomId: number): Promise<ChatMessageDto[]> => {
  return (await api.get<ChatMessageDto[]>(`/chat/rooms/${roomId}/messages`)).data;
};
