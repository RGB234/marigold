<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { useAuthStore } from '@/auth/stores/auth';
import {
  getChatRoomMessages,
  getChatRoom,
  createChatFileMessage,
  getChatAttachmentDownloadUrl,
} from '@/chat/api/chat.api';
import { getAdoptionPostSummary } from '@/adoption/api/adoptionPost.api';
import type { ChatAttachmentDto, ChatMessageDto, ChatRoomDto } from '@/chat/types/chat';
import type { AdoptionPostResponse } from '@/adoption/types/adoptionPost';
import { RouteHelper } from '@/global/router/routeHelper';
import { AdoptionPostStatus, getAdoptionStatusLabel } from '@/adoption/enums/AdoptionPostStatus';
import NoImage from '@/assets/images/no-image.jpeg';
import UserProfileLink from '@/global/components/UserProfileLink.vue';
import { useAlert } from '@/global/composables/useAlert';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { toast } = useAlert();
const roomId = computed(() => {
  const id = route.params.roomId;
  return Array.isArray(id) ? id[0] : id;
});
const currentUserId = computed(() => authStore.userId);
const getStompAuthHeaders = (): Record<string, string> =>
  authStore.accessToken ? { Authorization: `Bearer ${authStore.accessToken}` } : {};

const messages = ref<ChatMessageDto[]>([]);
const newMessage = ref('');
const selectedFiles = ref<File[]>([]);
const selectedAttachment = ref<ChatAttachmentDto | null>(null);
const messageContainer = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const chatRoom = ref<ChatRoomDto | null>(null);
const postInfo = ref<AdoptionPostResponse | null>(null);

const isReconnecting = ref(false);
const isConnectionFailed = ref(false);
const isSending = ref(false);
const retryCount = ref(0);
const MAX_RETRIES = 5;
const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_FILE_SIZE = 30 * 1024 * 1024;
const allowedFileExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'xlsx', 'pptx', 'txt', 'csv', 'hwpx'];
const fileAccept = allowedFileExtensions.map((extension) => `.${extension}`).join(',');
const canSend = computed(() => newMessage.value.trim() !== '' || selectedFiles.value.length > 0);

let stompClient: Client | null = null;
let isManualDisconnect = false;

const scrollToBottom = async () => {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

const connectWebSocket = () => {
  const apiBase = import.meta.env.VITE_BACKEND_URL;

  if (stompClient) {
    stompClient.deactivate();
  }

  isManualDisconnect = false;
  isConnectionFailed.value = false;
  isReconnecting.value = false;
  retryCount.value = 0;

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${apiBase}/ws`),
    connectHeaders: getStompAuthHeaders(),
    debug: (str) => {
      console.log(str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = () => {
    console.log('WebSocket 연결됨');
    retryCount.value = 0;
    isReconnecting.value = false;
    isConnectionFailed.value = false;

    stompClient?.subscribe(`/sub/chat/room/${roomId.value}`, (message) => {
      const receivedMessage: ChatMessageDto = JSON.parse(message.body);
      messages.value.push(receivedMessage);
      scrollToBottom();
    });
  };

  stompClient.onStompError = (frame) => {
    console.error('STOMP error: ' + frame.headers['message']);
  };

  stompClient.onWebSocketError = (event) => {
    console.error('WebSocket error:', event);
  };

  stompClient.onWebSocketClose = () => {
    // 수동 종료(페이지 이탈 등)는 재시도 카운트에서 제외
    if (isManualDisconnect) return;

    retryCount.value += 1;
    console.log(`WebSocket 연결 끊김 (${retryCount.value}/${MAX_RETRIES}회 재시도)`);

    if (retryCount.value >= MAX_RETRIES) {
      stompClient?.deactivate();
      isReconnecting.value = false;
      isConnectionFailed.value = true;
      console.warn('최대 재연결 횟수 초과. 재시도를 중단합니다.');
    } else {
      isReconnecting.value = true;
    }
  };

  stompClient.activate();
};

const retryConnect = () => {
  connectWebSocket();
};

const getFileExtension = (fileName: string) => fileName.split('.').pop()?.toLowerCase() ?? '';

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const isImageAttachment = (attachment: ChatAttachmentDto) => attachment.contentType?.startsWith('image/') ?? false;

const openAttachmentPreview = (attachment: ChatAttachmentDto) => {
  selectedAttachment.value = attachment;
};

const closeAttachmentPreview = () => {
  selectedAttachment.value = null;
};

const triggerDownload = (url: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadAttachment = async (attachment: ChatAttachmentDto) => {
  try {
    const downloadUrl = await getChatAttachmentDownloadUrl(roomId.value, attachment.id);
    triggerDownload(downloadUrl, attachment.originalFileName);
  } catch (error) {
    console.error('Failed to download attachment:', error);
    toast.error('파일 다운로드 중 오류가 발생했습니다.');
  }
};

const clearSelectedFiles = () => {
  selectedFiles.value = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const removeSelectedFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files) return;

  const files = Array.from(target.files);
  const nextFiles = [...selectedFiles.value, ...files];

  if (nextFiles.length > MAX_FILE_COUNT) {
    toast.error(`파일은 최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있습니다.`);
    target.value = '';
    return;
  }

  const invalidFile = files.find((file) => {
    const extension = getFileExtension(file.name);
    return file.size <= 0 || !allowedFileExtensions.includes(extension);
  });

  if (invalidFile) {
    toast.error('지원하지 않는 파일 형식입니다.');
    target.value = '';
    return;
  }

  const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);
  if (oversizedFile) {
    toast.error(`파일 1개는 ${formatFileSize(MAX_FILE_SIZE)} 이하여야 합니다.`);
    target.value = '';
    return;
  }

  const totalSize = nextFiles.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_FILE_SIZE) {
    toast.error(`첨부 파일 총 용량은 ${formatFileSize(MAX_TOTAL_FILE_SIZE)} 이하여야 합니다.`);
    target.value = '';
    return;
  }

  selectedFiles.value = nextFiles;
  target.value = '';
};

const sendTextMessage = () => {
  if (newMessage.value.trim() === '' || !stompClient || !stompClient.connected) return;

  const messageDto = {
    roomId: roomId.value,
    senderId: currentUserId.value,
    message: newMessage.value,
  };

  stompClient.publish({
    destination: '/pub/chat/message',
    headers: getStompAuthHeaders(),
    body: JSON.stringify(messageDto),
  });

  newMessage.value = '';
};

const sendFileMessage = async () => {
  const formData = new FormData();
  if (newMessage.value.trim()) {
    formData.append('message', newMessage.value);
  }
  selectedFiles.value.forEach((file) => {
    formData.append('files', file);
  });

  isSending.value = true;
  try {
    const savedMessage = await createChatFileMessage(roomId.value, formData);
    if (!stompClient?.connected) {
      messages.value.push(savedMessage);
      scrollToBottom();
    }
    newMessage.value = '';
    clearSelectedFiles();
  } catch (error) {
    console.error('Failed to send file message:', error);
    toast.error('파일 전송 중 오류가 발생했습니다.');
  } finally {
    isSending.value = false;
  }
};

const sendMessage = async () => {
  if (!canSend.value || isSending.value || chatRoom.value?.status === 'CLOSED') return;

  if (selectedFiles.value.length > 0) {
    await sendFileMessage();
    return;
  }

  sendTextMessage();
};

const fetchPostDetail = async () => {
  try {
    const room = await getChatRoom(roomId.value);
    chatRoom.value = room;
    const postInfoData = await getAdoptionPostSummary(room.postId.toString());
    postInfo.value = postInfoData;
  } catch (error) {
    console.error('Failed to fetch post detail:', error);
  }
};

const goToPostDetail = () => {
  if (postInfo.value) {
    router.push(RouteHelper.adoption.detail(postInfo.value.id.toString()));
  }
};

onMounted(async () => {
  await fetchPostDetail();

  try {
    const initialMessages = await getChatRoomMessages(roomId.value);
    messages.value = initialMessages;
    scrollToBottom();
  } catch (error) {
    console.error('Failed to fetch messages:', error);
  }
  connectWebSocket();
});

onUnmounted(() => {
  isManualDisconnect = true;
  stompClient?.deactivate();
});
</script>

<template>
  <div class="chat-container">
    <div class="chat-header">
      <div v-if="postInfo" class="post-summary" @click="goToPostDetail">
        <div class="summary-img">
          <img :src="postInfo.imageUrl as string || NoImage" alt="썸네일" />
        </div>
        <div class="summary-info">
          <div class="summary-status-row">
            <span class="status-badge" :class="{ done: postInfo.status === AdoptionPostStatus.COMPLETED }">
              {{ getAdoptionStatusLabel(postInfo.status) }}
            </span>
          </div>
          <div class="summary-title">{{ postInfo.title }}</div>
        </div>
        <div class="shortcut-btn">게시글 바로가기 〉</div>
      </div>
      <h2 v-else>1:1 채팅</h2>
    </div>

    <div v-if="isReconnecting" class="connection-banner reconnecting">
      서버와 연결이 끊겼습니다. 재연결 중... ({{ retryCount }}/{{ MAX_RETRIES }})
    </div>
    <div v-if="isConnectionFailed" class="connection-banner failed">
      서버에 연결할 수 없습니다.
      <button class="retry-btn" @click="retryConnect">다시 시도</button>
    </div>

    <div v-if="chatRoom?.status === 'CLOSED'" class="connection-banner failed"
      style="background: #e2e3e5; color: #383d41;">
      종료된 채팅방입니다. 더 이상 메시지를 보낼 수 없습니다.
    </div>

    <div class="messages-wrapper" ref="messageContainer">
      <div v-for="(msg, index) in messages" :key="index"
        :class="['message-item', msg.senderId === currentUserId ? 'my-message' : 'other-message']">
        <div v-if="msg.senderId !== currentUserId" class="sender-profile">
          <UserProfileLink :userId="msg.senderId" :nickname="msg.senderNickname" :showImage="true" :imageUrl="msg.senderImageUrl" />
        </div>
        <div class="message-bubble">
          <p v-if="msg.message">{{ msg.message }}</p>
          <div v-if="msg.attachments?.length" class="attachments">
            <div
              v-for="attachment in msg.attachments"
              :key="attachment.id || attachment.downloadUrl"
              class="attachment-item"
              role="button"
              tabindex="0"
              @click="openAttachmentPreview(attachment)"
              @keyup.enter="openAttachmentPreview(attachment)"
              @keyup.space.prevent="openAttachmentPreview(attachment)"
            >
              <span v-if="isImageAttachment(attachment)" class="attachment-preview-frame">
                <img
                  class="attachment-preview"
                  :src="attachment.downloadUrl"
                  :alt="attachment.originalFileName"
                />
              </span>
              <span v-else class="attachment-file-icon">
                <i class="mdi mdi-file-outline" aria-hidden="true"></i>
              </span>
              <span class="attachment-info">
                <span class="attachment-name">{{ attachment.originalFileName }}</span>
                <span class="attachment-size">{{ formatFileSize(attachment.fileSize) }}</span>
              </span>
            </div>
          </div>
          <span class="message-time">{{
            new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          }}</span>
        </div>
      </div>
      <div v-if="messages.length === 0" class="no-messages">
        메시지가 없습니다. 대화를 시작해보세요!
      </div>
    </div>

    <Teleport to="body">
      <div v-if="selectedAttachment" class="chat-attachment-popup-overlay" @click.self="closeAttachmentPreview">
        <div class="chat-attachment-popup-content">
          <div class="chat-attachment-popup-actions">
            <button
              type="button"
              class="chat-attachment-popup-action"
              :aria-label="`${selectedAttachment.originalFileName} 다운로드`"
              title="다운로드"
              @click="downloadAttachment(selectedAttachment)"
            >
              <i class="mdi mdi-download" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              class="chat-attachment-popup-close"
              aria-label="파일 미리보기 닫기"
              title="닫기"
              @click="closeAttachmentPreview"
            >
              <i class="mdi mdi-close" aria-hidden="true"></i>
            </button>
          </div>
          <img
            v-if="isImageAttachment(selectedAttachment)"
            :src="selectedAttachment.downloadUrl"
            :alt="selectedAttachment.originalFileName"
            class="chat-attachment-popup-img"
          />
          <div v-else class="chat-file-popup-preview">
            <i class="mdi mdi-file-outline" aria-hidden="true"></i>
            <div class="chat-file-popup-name">{{ selectedAttachment.originalFileName }}</div>
            <div class="chat-file-popup-size">{{ formatFileSize(selectedAttachment.fileSize) }}</div>
          </div>
          <div v-if="isImageAttachment(selectedAttachment)" class="chat-attachment-popup-name">
            {{ selectedAttachment.originalFileName }}
          </div>
        </div>
      </div>
    </Teleport>

    <div class="input-area">
      <div v-if="selectedFiles.length > 0" class="selected-files">
        <div v-for="(file, index) in selectedFiles" :key="`${file.name}-${file.size}-${index}`" class="selected-file">
          <span class="selected-file-name">{{ file.name }}</span>
          <span class="selected-file-size">{{ formatFileSize(file.size) }}</span>
          <button class="selected-file-remove" @click="removeSelectedFile(index)" :disabled="isSending">×</button>
        </div>
      </div>
      <div class="input-controls">
        <label class="file-upload-btn" :class="{ disabled: selectedFiles.length >= MAX_FILE_COUNT || chatRoom?.status === 'CLOSED' || isSending }">
          파일
          <input
            ref="fileInput"
            type="file"
            multiple
            :accept="fileAccept"
            :disabled="selectedFiles.length >= MAX_FILE_COUNT || chatRoom?.status === 'CLOSED' || isSending"
            @change="handleFileChange"
            hidden
          />
        </label>
        <textarea v-model="newMessage" @keyup.enter.prevent="sendMessage" placeholder="메시지를 입력하세요..." rows="1"
          :disabled="chatRoom?.status === 'CLOSED' || isSending"></textarea>
        <button @click="sendMessage" :disabled="!canSend || chatRoom?.status === 'CLOSED' || isSending">전송</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  max-width: 600px;
  width: 100%;
  margin: 20px auto;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chat-header {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.post-summary {
  display: flex;
  gap: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.post-summary:hover {
  background-color: #f1f3f5;
}

.summary-img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.summary-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.summary-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.status-badge {
  display: inline-block;
  background-color: #ff9800;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 6px;
}

.status-badge.done {
  background-color: #888;
}

.summary-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.shortcut-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.post-summary:hover .shortcut-btn {
  color: #ff9800;
}

.messages-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.my-message {
  align-self: flex-end;
  align-items: flex-end;
}

.other-message {
  align-self: flex-start;
}

.sender-profile {
  margin-bottom: 4px;
  margin-left: 4px;
}

:deep(.sender-profile .nickname) {
  font-size: 12px;
  color: #666;
  font-weight: 400;
}

:deep(.sender-profile .profile-img) {
  width: 28px !important;
  height: 28px !important;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.my-message .message-bubble {
  background: #ff9800;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.other-message .message-bubble {
  background: #fff;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-bubble p {
  margin: 0;
  line-height: 1.4;
  word-break: break-all;
}

.message-bubble p + .attachments {
  margin-top: 8px;
}

.attachments {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  padding: 8px;
  max-width: min(280px, 100%);
  cursor: pointer;
}

.other-message .attachment-item {
  background: #f6f6f6;
}

.attachment-preview-frame,
.attachment-file-icon {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  flex-shrink: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.2);
}

.other-message .attachment-preview-frame,
.other-message .attachment-file-icon {
  background: #e9ecef;
}

.attachment-preview {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attachment-file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
}

.attachment-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.attachment-name {
  width: 100%;
  font-size: 13px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-item:hover .attachment-name {
  text-decoration: underline;
}

.attachment-size {
  font-size: 11px;
  opacity: 0.75;
}

.attachment-item:hover {
  opacity: 0.85;
}

.message-time {
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.7;
  align-self: flex-end;
}

.input-area {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
}

.selected-files {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f8f9fa;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 12px;
}

.selected-file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-file-size {
  color: #777;
  flex-shrink: 0;
}

.input-controls {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  width: 100%;
}

.file-upload-btn {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: #f8f9fa;
  color: #555;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.file-upload-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

textarea {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 10px 16px;
  resize: none;
  outline: none;
  font-family: inherit;
  max-height: 100px;
}

button {
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.selected-file .selected-file-remove {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 13px;
  background: #ddd;
  color: #555;
  flex-shrink: 0;
}

.selected-file .selected-file-remove:disabled {
  background: #eee;
  color: #aaa;
}

.no-messages {
  text-align: center;
  color: #888;
  margin-top: 40px;
}

.connection-banner {
  padding: 10px 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.connection-banner.reconnecting {
  background: #fff3cd;
  color: #856404;
}

.connection-banner.failed {
  background: #f8d7da;
  color: #842029;
}

.retry-btn {
  background: #842029;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  width: auto;
  height: auto;
  font-size: 13px;
  cursor: pointer;
}

.chat-attachment-popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.78);
}

.chat-attachment-popup-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(92vw, 1000px);
  height: min(82vh, 760px);
}

.chat-attachment-popup-actions {
  position: absolute;
  top: -16px;
  right: -16px;
  z-index: 1;
  display: flex;
  gap: 8px;
}

.chat-attachment-popup-action,
.chat-attachment-popup-close {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.chat-attachment-popup-action:hover,
.chat-attachment-popup-close:hover {
  background: #fff;
}

.chat-attachment-popup-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.chat-file-popup-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: min(72vw, 420px);
  min-height: 220px;
  padding: 40px 32px;
  border-radius: 8px;
  background: #fff;
  color: #333;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.chat-file-popup-preview .mdi {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  color: #666;
  font-size: 56px;
  line-height: 1;
  margin-bottom: 16px;
}

.chat-file-popup-preview .mdi::before {
  line-height: 1;
}

.chat-file-popup-name {
  width: 100%;
  overflow-wrap: anywhere;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
}

.chat-file-popup-size {
  margin-top: 8px;
  color: #777;
  font-size: 13px;
}

.chat-attachment-popup-name {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -36px;
  overflow: hidden;
  color: #fff;
  font-size: 13px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
