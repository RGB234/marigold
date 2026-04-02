<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import {useAuthStore} from '@/auth/stores/auth';
import {getChatRoomMessages, getChatRoom} from '@/chat/api/chat.api';
import {getAdoptionPostSummary} from '@/adoption/api/adoptionPost.api';
import {ChatMessageDto} from '@/chat/types/chat';
import type {AdoptionPostResponse} from '@/adoption/types/adoptionPost';
import {RouteHelper} from '@/global/router/routeHelper';
import {AdoptionPostStatus, getAdoptionStatusLabel} from '@/adoption/enums/AdoptionPostStatus';
import NoImage from '@/assets/images/no-image.jpeg';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const roomId = computed(() => Array.isArray(route.params) ? route.params[0].roomId : route.params.roomId);
const currentUserId = computed(() => authStore.userId);

const messages = ref<ChatMessageDto[]>([]);
const newMessage = ref('');
const messageContainer = ref<HTMLElement | null>(null);

const postInfo = ref<AdoptionPostResponse | null>(null);

const isReconnecting = ref(false);
const isConnectionFailed = ref(false);
const retryCount = ref(0);
const MAX_RETRIES = 5;

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

const sendMessage = () => {
  if (newMessage.value.trim() === '' || !stompClient || !stompClient.connected) return;

  const messageDto = {
    roomId: roomId.value,
    senderId: currentUserId.value,
    message: newMessage.value,
  };

  stompClient.publish({
    destination: '/pub/chat/message',
    body: JSON.stringify(messageDto),
  });

  newMessage.value = '';
};

const fetchPostDetail = async () => {
  try {
    const room = await getChatRoom(roomId.value);
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

    <div class="messages-wrapper" ref="messageContainer">
      <div v-for="(msg, index) in messages" :key="index"
           :class="['message-item', msg.senderId === currentUserId ? 'my-message' : 'other-message']">
        <div class="sender-name" v-if="msg.senderId !== currentUserId">{{
            msg.senderNickname
          }}
        </div>
        <div class="message-bubble">
          <p>{{ msg.message }}</p>
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

    <div class="input-area">
      <textarea v-model="newMessage" @keyup.enter.prevent="sendMessage" placeholder="메시지를 입력하세요..."
                rows="1"></textarea>
      <button @click="sendMessage" :disabled="!newMessage.trim()">전송</button>
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

.sender-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  margin-left: 4px;
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
  gap: 12px;
  align-items: flex-end;
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
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}
</style>
