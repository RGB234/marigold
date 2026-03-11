<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { useAuthStore } from '@/auth/stores/auth';
import { getChatRoomMessages } from '@/chat/api/chat.api';
import { ChatMessageDto } from '@/chat/types/chat';

const route = useRoute();
const authStore = useAuthStore();
const roomId = computed(() => Number(route.params.roomId));
const currentUserId = computed(() => authStore.userId);

const messages = ref<ChatMessageDto[]>([]);
const newMessage = ref('');
const messageContainer = ref<HTMLElement | null>(null);

let stompClient: Client | null = null;

const scrollToBottom = async () => {
    await nextTick();
    if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
};

const connectWebSocket = () => {
    const apiBase = import.meta.env.VITE_BACKEND_URL;
    // SockJS endpoint is usually /ws
    const socket = new SockJS(`${apiBase}/ws`, null, {});
    
    stompClient = new Client({
        webSocketFactory: () => socket,
        debug: (str) => {
            console.log(str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = () => {
        console.log('Connected to WebSocket');
        stompClient?.subscribe(`/sub/chat/room/${roomId.value}`, (message) => {
            const receivedMessage: ChatMessageDto = JSON.parse(message.body);
            messages.value.push(receivedMessage);
            scrollToBottom();
        });
    };

    stompClient.onStompError = (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
    };

    stompClient.activate();
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

onMounted(async () => {
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
    if (stompClient) {
        stompClient.deactivate();
    }
});
</script>

<template>
    <div class="chat-container">
        <div class="chat-header">
            <h2>1:1 채팅</h2>
        </div>
        
        <div class="messages-wrapper" ref="messageContainer">
            <div v-for="(msg, index) in messages" :key="index" 
                 :class="['message-item', msg.senderId === currentUserId ? 'my-message' : 'other-message']">
                <div class="sender-name" v-if="msg.senderId !== currentUserId">{{ msg.senderNickname }}</div>
                <div class="message-bubble">
                    <p>{{ msg.message }}</p>
                    <span class="message-time">{{ new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
                </div>
            </div>
            <div v-if="messages.length === 0" class="no-messages">
                메시지가 없습니다. 대화를 시작해보세요!
            </div>
        </div>

        <div class="input-area">
            <textarea v-model="newMessage" @keyup.enter.prevent="sendMessage" placeholder="메시지를 입력하세요..." rows="1"></textarea>
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
    margin: 0 auto;
    background: #f5f5f5;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.chat-header {
    padding: 16px;
    background: #fff;
    border-bottom: 1px solid #eee;
    text-align: center;
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
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
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
</style>
