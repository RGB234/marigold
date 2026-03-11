<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getMyChatRooms } from '@/chat/api/chat.api';
import { ChatRoomDto } from '@/chat/types/chat';
import { useAuthStore } from '@/auth/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const rooms = ref<ChatRoomDto[]>([]);
const currentUserId = computed(() => Number(authStore.userId));

const fetchRooms = async () => {
    try {
        rooms.value = await getMyChatRooms();
    } catch (error) {
        console.error('Failed to fetch chat rooms:', error);
    }
};

const goToRoom = (roomId: number) => {
    router.push({ name: 'Chat_room', params: { roomId: roomId.toString() } });
};

const getOtherUserNickname = (room: ChatRoomDto) => {
    return room.user1Id === currentUserId.value ? room.user2Nickname : room.user1Nickname;
};

onMounted(() => {
    fetchRooms();
});
</script>

<template>
    <div class="chat-list-container">
        <div class="header">
            <h1>채팅 목록</h1>
        </div>
        <div class="room-list">
            <div v-for="room in rooms" :key="room.id" class="room-item" @click="goToRoom(room.id)">
                <div class="room-info">
                    <span class="other-user">{{ getOtherUserNickname(room) }} 님과의 대화</span>
                    <span class="last-active">{{ new Date(room.createdAt).toLocaleDateString() }}</span>
                </div>
                <div class="chevron">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                    </svg>
                </div>
            </div>
            <div v-if="rooms.length === 0" class="no-rooms">
                진행 중인 채팅이 없습니다.
            </div>
        </div>
    </div>
</template>

<style scoped>
.chat-list-container {
    max-width: 600px;
    margin: 40px auto;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    overflow: hidden;
}

.header {
    padding: 24px;
    border-bottom: 1px solid #eee;
}

.header h1 {
    font-size: 24px;
    margin: 0;
    color: #333;
}

.room-list {
    display: flex;
    flex-direction: column;
}

.room-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #f9f9f9;
    cursor: pointer;
    transition: background 0.2s;
}

.room-item:hover {
    background: #fcfcfc;
}

.room-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.other-user {
    font-weight: 600;
    font-size: 16px;
    color: #333;
}

.last-active {
    font-size: 12px;
    color: #888;
}

.chevron {
    color: #ccc;
}

.no-rooms {
    padding: 40px;
    text-align: center;
    color: #888;
}
</style>
