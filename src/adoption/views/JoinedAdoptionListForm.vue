<template>
  <div class="card-header">
    <h3>참가중인 채팅방</h3>
  </div>

  <div class="card-container">
    <div v-for="(item, index) in visibleCards" :key="index" class="item-wrapper">
      <!-- 게시글 정보 영역 (왼쪽) -->
      <div class="card adoption-card" @click="handleAdoptionClick(item.adoptionInfo)">
        <div class="card-image">
          <img :src="item.adoptionInfo.imageUrl" alt="대표이미지" class="thumb" />
        </div>

        <div class="card-body">
          <span class="status-badge" :class="item.adoptionInfo.status">
              {{ getAdoptionStatusLabel(item.adoptionInfo.status) }}
          </span>
          <div class="card-meta">
            <span class="species">{{ SpeciesLabels[item.adoptionInfo.species] }}</span>
            <span class="divider">|</span>
            <span class="date">{{ item.adoptionInfo.createdAt ? new Date(item.adoptionInfo.createdAt).toLocaleDateString('ko-KR') : '' }}</span>
          </div>
          <h3 class="card-title">{{ item.adoptionInfo.title }}</h3>
          <div class="card-info">
            <span>{{ item.adoptionInfo.age }}살</span>
            <span>|</span>
            <span>{{ SexLabels[item.adoptionInfo.sex] }}</span>
            <span>|</span>
            <span>{{ item.adoptionInfo.area }}</span>
          </div>
        </div>
      </div>

      <!-- 채팅방 정보 영역 (오른쪽) -->
      <div class="chat-info-area" @click="handleChatClick(item.chatRoomId)">
        <div class="chat-header">
          <span class="chat-label">채팅방</span>
          <span class="chat-date">{{ item.chatCreatedAt ? formatDate(item.chatCreatedAt) : '' }}</span>
        </div>
        <div class="chat-partner">
          <span class="partner-name">{{ item.receiverNickname }}</span> 님과의 대화
        </div>
        <div class="chat-action">
          채팅방으로 이동 >
        </div>
      </div>
    </div>
  </div>
  <div class="pagination">
    <button @click="handleSearch(currentPage - 1)" :disabled="currentPage === 0">전</button>
    <button
        v-for="page in visiblePages"
        :key="page"
        :class="{ active: currentPage === page }"
        @click="handleSearch(page)"
    >
      {{ page + 1 }}
    </button>
    <button @click="handleSearch(currentPage + 1)" :disabled="currentPage >= totalServerPages - 1">후</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { SpeciesLabels } from "@/global/enums/Species";
import { SexLabels } from "@/global/enums/Sex";
import { getAdoptionStatusLabel } from "@/global/enums/AdoptionStatus";
import { getUserAdoptionsByJoinedChat } from "@/adoption/api/adoption.api";
import { useAuthStore } from "@/auth/stores/auth.ts";
import { useAlert } from "@/global/composables/useAlert.ts";
import {
  AdoptionWithChatResponse,
  AdoptionWithChatPageResponse
} from "@/adoption/types/adoption";

// ==========================================
// 데이터 호출 및 상태 관리
// ==========================================

const router = useRouter();
const authStore = useAuthStore();
const { toast } = useAlert();

const searchResult = ref<AdoptionWithChatResponse[]>([]);

// ==========================================
// 서버 사이드 페이지네이션
// ==========================================

const currentPage = ref(0);      // 서버 페이지 번호 (0부터 시작)
const totalServerPages = ref(1); // 서버에서 반환한 총 페이지 수
const totalElements = ref(0);    // 서버에서 반환한 총 아이템 수
const visiblePageCount = 10;     // 페이지네이션 바에 표시할 페이지 버튼 수

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// page를 인자로 받아 서버에서 해당 페이지 데이터를 불러옴
const handleSearch = async (page = 0) => {
  currentPage.value = page;
  searchResult.value = [];

    const userId = authStore.userId;
    if (userId){
      try {
        const data: AdoptionWithChatPageResponse = await getUserAdoptionsByJoinedChat({ page, size: 10 });
        searchResult.value = data.content ?? [];
        totalServerPages.value = data.page.totalPages ?? 1;
        totalElements.value = data.page.totalElements ?? 0;
      } catch (error) {
        console.error("데이터 로드 실패:", error);
        toast.error("데이터를 불러오는데 실패했습니다.");
      }
    }else{
      toast.error("유효하지 않은 유저입니다");
    }
};



// 페이지네이션 바에 표시될 페이지 번호 목록 (0-indexed)
const visiblePages = computed(() => {
  const half = Math.floor(visiblePageCount / 2);
  const start = Math.max(0, currentPage.value - half);
  const end = Math.min(totalServerPages.value - 1, start + visiblePageCount - 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// 현재 페이지에 표시되는 카드 (서버가 이미 페이지 단위로 반환)
const visibleCards = computed(() => searchResult.value);

// ==========================================
// 기타 이벤트 핸들러
// ==========================================

// 게시글 상세 페이지로 이동
const handleAdoptionClick = (adoptionInfo: any) => {
  router.push({ name: "Adoption_detail", params: { id: String(adoptionInfo.id) } });
};

// 채팅방으로 이동
const handleChatClick = (chatRoomId: number) => {
  router.push({ name: "Chat_room", params: { roomId: String(chatRoomId) } });
};

onMounted(async () => {
  await handleSearch(0); // 초기 로드 시 첫 페이지 검색
});
</script>

<style lang="css" scoped>


.card-header {
  max-width: 800px;
  margin: 0 auto 1rem auto;
  padding: 0 20px;
}

/* card */

.card-container {
  max-width: 800px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.item-wrapper {
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  background: white;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 180px;
}

.item-wrapper:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.card.adoption-card {
  flex: 2;
  display: flex;
  flex-direction: row;
  cursor: pointer;
  border-right: 1px dashed #eee;
}

.card.adoption-card:hover {
  background-color: #fcfcfc;
}

.card-image {
  width: 160px;
  min-width: 160px;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.card-body {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.status-badge {
  display: inline-block;
  width: fit-content;
  background-color: #ff9800;
  color: white;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 6px;
}

.status-badge.COMPLETED { background-color: #888; }
.status-badge.RESERVED { background-color: #2196f3; }

.card-meta {
  font-size: 12px;
  color: #888;
  margin-bottom: 5px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-info {
  font-size: 13px;
  color: #666;
  display: flex;
  gap: 6px;
}

/* 채팅 정보 영역 */
.chat-info-area {
  flex: 1;
  background-color: #fff9f0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-info-area:hover {
  background-color: #fff2e0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chat-label {
  font-size: 12px;
  font-weight: bold;
  color: #eaa221;
  background: white;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #ffd8a8;
}

.chat-date {
  font-size: 11px;
  color: #999;
}

.chat-partner {
  font-size: 14px;
  color: #444;
  margin-bottom: 15px;
}

.partner-name {
  font-weight: bold;
  color: #333;
}

.chat-action {
  font-size: 12px;
  font-weight: 600;
  color: #eaa221;
  text-align: right;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin: 2rem 0;
}

.pagination button {
  border: 1px solid #ccc;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}

.pagination button.active {
  background-color: #eaa221;
  color: white;
  border-color: #eaa221;
}

@media (max-width: 640px) {
  .item-wrapper {
    flex-direction: column;
    height: auto;
  }
  .card.adoption-card {
    border-right: none;
    border-bottom: 1px dashed #eee;
  }
  .chat-info-area {
    padding: 15px;
  }
}
</style>
