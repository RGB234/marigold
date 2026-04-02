<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/auth/stores/auth';
import { getMyChatRooms } from '@/chat/api/chat.api';
import type { ChatRoomDto } from '@/chat/types/chat';
import { RouteHelper } from '@/global/router/routeHelper';

const router = useRouter();
const authStore = useAuthStore();
const allRooms = ref<ChatRoomDto[]>([]);
const loading = ref(false);

// 탭 상태: 'writer' (내가 올린 공고에 대한 채팅) | 'inquirer' (내가 문의한 채팅)
const currentTab = ref<'inquirer' | 'writer'>('inquirer');

const fetchRooms = async () => {
  loading.value = true;
  try {
    const response = await getMyChatRooms({ 
      type: currentTab.value,
      size: 10, 
      sort: 'createdAt', 
      direction: 'DESC' 
    });
    allRooms.value = response.content || [];
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

watch(currentTab, () => {
  fetchRooms();
});

const goToChatRoom = (roomId: string) => {
  router.push(RouteHelper.chat.room(roomId));
};

const goToPostDetail = (postId: string) => {
  router.push(RouteHelper.adoption.detail(postId));
};

// 상대방 닉네임 구하기 로직
const getOtherUserNickname = (room: ChatRoomDto) => {
  return room.user1Id === authStore.userId ? room.user2Nickname : room.user1Nickname;
};

// 날짜 포맷팅
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

onMounted(() => fetchRooms());
</script>

<template>
  <div class="chat-list-container">
    <div class="page-header">
      <h2>대화 목록</h2>
      <p>진행 중인 모든 채팅 내역입니다.</p>
    </div>

    <!-- 탭 토글 UI -->
    <div class="tab-toggle">
      <button 
        class="tab-btn"
        :class="{ active: currentTab === 'inquirer' }" 
        @click="currentTab = 'inquirer'"
      >
        내가 문의한 채팅
      </button>
      <button 
        class="tab-btn"
        :class="{ active: currentTab === 'writer' }" 
        @click="currentTab = 'writer'"
      >
        내 게시글로 온 채팅
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>목록을 불러오는 중입니다...</p>
    </div>

    <div v-else-if="allRooms.length > 0" class="room-list">
      <div v-for="room in allRooms" :key="room.id" class="room-card" @click="goToChatRoom(room.id)">
        <div class="room-info">
          <div class="user-info">
            <span class="avatar">👤</span>
            <span class="nickname">{{ getOtherUserNickname(room) }}</span>
            <span class="date">{{ formatDate(room.createdAt) }}</span>
          </div>
          <div class="post-title" @click.stop="goToPostDetail(room.postId.toString())">
            게시글: {{ room.postTitle }} <span class="link-arrow">〉</span>
          </div>
        </div>
        <div class="action-arrow">
          대화하기 〉
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">💬</div>
      <p v-if="currentTab === 'inquirer'">문의한 채팅 내역이 없습니다.</p>
      <p v-else>내 공고에 온 채팅 내역이 없습니다.</p>
    </div>
  </div>
</template>

<style scoped>
.chat-list-container {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 20px;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.page-header p {
  color: #666;
}

/* 탭 토글 */
.tab-toggle {
  display: flex;
  margin-bottom: 30px;
  border-bottom: 2px solid #eee;
}

.tab-btn {
  flex: 1;
  padding: 16px 0;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-btn.active {
  color: #ff9800;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #ff9800;
}

.tab-btn:hover:not(.active) {
  color: #555;
  background-color: #fafafa;
}

/* 리스트 */
.room-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.room-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #ddd;
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  font-size: 20px;
}

.nickname {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.date {
  font-size: 13px;
  color: #999;
  margin-left: 8px;
}

.post-title {
  font-size: 14px;
  color: #666;
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 6px;
  display: inline-block;
  width: fit-content;
  transition: background 0.2s;
}

.post-title:hover {
  background: #eee;
  color: #333;
}

.link-arrow {
  font-size: 11px;
  color: #aaa;
}

.action-arrow {
  font-size: 14px;
  font-weight: 600;
  color: #ccc;
  transition: color 0.2s;
}

.room-card:hover .action-arrow {
  color: #ff9800;
}

/* 로딩 & 빈 상태 */
.loading-state, .empty-state {
  text-align: center;
  padding: 80px 0;
  color: #888;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff9800;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>
