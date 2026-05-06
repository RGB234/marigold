import api from "@/global/api";
import {ChatMessageDto, ChatRoomDto, ChatRoomPageResponse} from "@/chat/types/chat";
import {ApiResponse, Long_String, PageableParams} from "@/global/types/common.ts";

export const getOrCreateChatRoom = async (adoptionPostId: Long_String, receiverId: Long_String): Promise<ChatRoomDto> => {
  const {data: apiResponse} = await api.post<ApiResponse<ChatRoomDto>>(`/chat/rooms`, {adoptionPostId, receiverId});
  if (!apiResponse.data) {
    throw new Error("채팅방 생성 중 오류가 발생했습니다.");
  }
  return apiResponse.data;
};

export interface ChatRoomSearchParams extends PageableParams {
  type?: 'writer' | 'inquirer'; // 'all'도 요청가능하지만 사용하지 않는다.
}

export const getChatRoom = async (roomId: Long_String): Promise<ChatRoomDto> => {
  const {data: apiResponse} = await api.get<ApiResponse<ChatRoomDto>>(`/chat/rooms/${roomId}`);
  if (!apiResponse.data) {
    throw new Error("채팅방 데이터를 불러오지 못했습니다.");
  }
  return apiResponse.data;
};

export const getMyChatRooms = async (params?: ChatRoomSearchParams): Promise<ChatRoomPageResponse> => {
  const {data: apiResponse} =  await api.get<ApiResponse<ChatRoomPageResponse>>(`/chat/rooms`, {params});
  const page = apiResponse.data;

  if (!page) {
    throw new Error("채팅방 목록 데이터를 불러오지 못했습니다.");
  }

  return page;
};

export const getChatRoomMessages = async (roomId: Long_String): Promise<ChatMessageDto[]> => {
  const {data: apiResponse} = await api.get<ApiResponse<ChatMessageDto[]>>(`/chat/rooms/${roomId}/messages`);
  if (!apiResponse.data) {
    throw new Error("채팅방 메시지 데이터를 불러오지 못했습니다.");
  }
  return apiResponse.data;
};

export const createChatFileMessage = async (roomId: Long_String, formData: FormData): Promise<ChatMessageDto> => {
  const {data: apiResponse} = await api.post<ApiResponse<ChatMessageDto>>(`/chat/rooms/${roomId}/messages/files`, formData, {
    handledErrorStatuses: [400],
  });
  if (!apiResponse.data) {
    throw new Error("파일 메시지 전송 중 오류가 발생했습니다.");
  }
  return apiResponse.data;
};

export const getChatAttachmentDownloadUrl = async (roomId: Long_String, attachmentId: Long_String): Promise<string> => {
  const {data: apiResponse} = await api.get<ApiResponse<string>>(`/chat/rooms/${roomId}/attachments/${attachmentId}/download-url`);
  if (!apiResponse.data) {
    throw new Error("파일 다운로드 URL을 불러오지 못했습니다.");
  }
  return apiResponse.data;
};

export const leaveChatRoom = async (roomId: Long_String): Promise<void> => {
  await api.delete(`/chat/rooms/${roomId}/leave`);
};
