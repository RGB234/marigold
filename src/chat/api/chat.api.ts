import api from "@/global/api";
import {ChatMessageDto, ChatRoomDto, ChatRoomPageResponse} from "@/chat/types/chat";
import {Long_String, PageableParams, TSID_String} from "@/global/types/common.ts";

export const getOrCreateChatRoom = async (adoptionPostId: Long_String, receiverId: TSID_String): Promise<ChatRoomDto> => {
  const {data} = await api.post<ChatRoomDto>(`/chat/rooms`, {adoptionPostId, receiverId});
  return data;
};

export interface ChatRoomSearchParams extends PageableParams {
  type?: 'writer' | 'inquirer'; // 'all'도 요청가능하지만 사용하지 않는다.
}

export const getChatRoom = async (roomId: TSID_String): Promise<ChatRoomDto> => {
  const {data} = await api.get<ChatRoomDto>(`/chat/rooms/${roomId}`);
  return data;
};

export const getMyChatRooms = async (params?: ChatRoomSearchParams): Promise<ChatRoomPageResponse> => {
  const {data} = await api.get<ChatRoomPageResponse>(`/chat/rooms`, {params});
  return data;
};

export const getChatRoomMessages = async (roomId: TSID_String): Promise<ChatMessageDto[]> => {
  const {data} = await api.get<ChatMessageDto[]>(`/chat/rooms/${roomId}/messages`);
  return data;
};

export const createChatFileMessage = async (roomId: TSID_String, formData: FormData): Promise<ChatMessageDto> => {
  const {data} = await api.post<ChatMessageDto>(`/chat/rooms/${roomId}/messages/files`, formData, {
    handledErrorStatuses: [400],
  });
  return data;
};

export const getChatAttachmentDownloadUrl = async (roomId: TSID_String, attachmentId: Long_String): Promise<string> => {
  const {data} = await api.get<string>(`/chat/rooms/${roomId}/attachments/${attachmentId}/download-url`);
  return data;
};

export const leaveChatRoom = async (roomId: TSID_String): Promise<void> => {
  await api.delete(`/chat/rooms/${roomId}/leave`);
};
