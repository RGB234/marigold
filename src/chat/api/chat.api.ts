import api from "@/global/api";
import {ChatMessageDto, ChatRoomDto} from "@/chat/types/chat";
import {Long_String} from "@/global/types/common.ts";

export const createChatRoom = async (adoptionPostId: Long_String, receiverId: Long_String): Promise<ChatRoomDto> => {
  return (await api.post<ChatRoomDto>(`/chat/rooms`, {adoptionPostId, receiverId})).data;
};

export const getChatRoomMessages = async (roomId: Long_String): Promise<ChatMessageDto[]> => {
  return (await api.get<ChatMessageDto[]>(`/chat/rooms/${roomId}/messages`)).data;
};

export const deleteChatRoom = async (roomId: Long_String): Promise<void> => {
  await api.delete(`/chat/rooms/${roomId}`);
};
