<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { SpeciesLabels } from "@/adoption/enums/Species";
import { SexLabels } from "@/adoption/enums/Sex";
import { NeuteringLabels } from "@/adoption/enums/Neutering";
import { AdoptionPostStatus, getAdoptionStatusLabel } from "@/adoption/enums/AdoptionPostStatus.ts";
import { deleteAdoptionPost, getAdoptionPostDetail, updateAdoptionPostStatus, getAdoptionCandidates, completeAdoption, cancelCompleteAdoption } from '@/adoption/api/adoptionPost.api';
import { getOrCreateChatRoom } from '@/chat/api/chat.api';

import { useAuthStore } from '@/auth/stores/auth';

import { useAlert } from '@/global/composables/useAlert';
import { AdoptionPostDetailResponse, AdoptionCandidateResponse } from "@/adoption/types/adoptionPost.ts";
import { RouteHelper } from "@/global/router/routeHelper.ts";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { confirm, toast, alert } = useAlert();

const detail = ref<AdoptionPostDetailResponse | null>(null);

const candidates = ref<AdoptionCandidateResponse[]>([]);
const showCandidateModal = ref(false);
const selectedAdopterId = ref<string>('');

// 로그인 상태 확인
const isLoggedIn = computed(() => authStore.isLoggedIn);
const currentUserId = computed(() => authStore.userId);

// 작성자 본인인지 확인
const isAuthor = computed(() => {
  if (!detail.value || !currentUserId.value) return false;
  return detail.value.writer?.id === currentUserId.value;
});

// 날짜 포맷팅 함수 (YYYY-MM-DD HH:mm)
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fetchDetail = async (id: string | string[]) => {
  try {
    detail.value = await getAdoptionPostDetail(Array.isArray(id) ? id[0] : id);
  } catch (error) {
    router.push(RouteHelper.adoption.list());
  }
};

// 게시글 수정
const editPost = () => {
  const postId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
  router.push(RouteHelper.adoption.update(postId));
};

// 게시글 삭제 확인
const confirmDelete = async () => {
  if (await confirm("경고", "정말로 이 게시글을 삭제하시겠습니까?")) {
    deletePost();
  }
};

// 게시글 삭제
const deletePost = async () => {
  try {
    await deleteAdoptionPost(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id);
    toast.success('게시글이 삭제되었습니다.');
    router.push(RouteHelper.home());
  } catch (error) {
    console.error("게시글 삭제 중 오류 발생:", error);
    toast.error("게시글 삭제 중 오류가 발생했습니다.");
  }
};

const handleStatusChange = async (status: AdoptionPostStatus) => {
  if (!detail.value) return;
  try {
    await updateAdoptionPostStatus(detail.value.id, status);
    detail.value.status = status;
    toast.success(`상태가 '${getAdoptionStatusLabel(status)}'(으)로 변경되었습니다.`);
  } catch (error) {
    console.error("상태 변경 오류:", error);
    toast.error("상태 변경 중 오류가 발생했습니다.");
  }
};

const handleCompleteAdoptionClick = async () => {
  if (!detail.value) return;
  try {
    const data = await getAdoptionCandidates(detail.value.id);
    if (data.length === 0) {
      await alert("알림", "입양 문의 채팅 내역이 없어 입양 완료 처리를 할 수 없습니다.");
      return;
    }
    candidates.value = data;
    selectedAdopterId.value = '';
    showCandidateModal.value = true;
  } catch (error) {
    console.error(error);
    toast.error("후보자 목록을 불러오는 데 실패했습니다.");
  }
};

const confirmCompleteAdoption = async () => {
  if (!selectedAdopterId.value) {
    toast.error("입양자를 선택해주세요.");
    return;
  }
  if (!detail.value) return;
  try {
    await completeAdoption(detail.value.id, { adopterId: selectedAdopterId.value });
    toast.success("입양 완료 처리되었습니다.");
    showCandidateModal.value = false;
    await fetchDetail(detail.value.id.toString());
  } catch (error) {
    console.error(error);
    toast.error("입양 완료 처리 중 오류가 발생했습니다.");
  }
};

const handleCancelCompleteAdoption = async () => {
  if (!detail.value) return;
  if (await confirm("확인", "입양 완료를 취소하시겠습니까?")) {
    try {
      await cancelCompleteAdoption(detail.value.id);
      toast.success("입양 완료가 취소되었습니다.");
      await fetchDetail(detail.value.id.toString());
    } catch (error) {
      console.error(error);
      toast.error("입양 완료 취소 중 오류가 발생했습니다.");
    }
  }
};

const handleChatRequest = async () => {
  if (!detail.value || !detail.value.writer) return;

  try {
    // 채팅방 생성 (이미 있으면 기존 방 반환)
    const adoptionInfoId = detail.value.id;
    const writerId = detail.value.writer.id;

    // 없으면 생성, 이미 있으면 GET
    const chatRoom = await getOrCreateChatRoom(adoptionInfoId, writerId);

    router.push(RouteHelper.chat.room(chatRoom.id.toString()));
  } catch (error) {
    console.log(error);
    toast.error("채팅방 생성 중 오류가 발생했습니다.");
  }
};

const goToProfile = () => {
  if (!detail.value) return;
  const writerId = detail.value.writer?.id;
  if (writerId) router.push(RouteHelper.user.profile(writerId));
};

const goToChatList = () => {
  if (detail.value) {
    router.push(RouteHelper.adoption.chatList(detail.value.id.toString()));
  }
};

const goBack = () => {
  router.back();
};

onMounted(async () => {
  const id = route.params.id;
  await fetchDetail(id);
});
</script>

<template>
  <div class="detail-container">
    <div class="back-btn-wrapper">
      <button class="btn-back" @click="goBack">
        < 뒤로가기
      </button>
    </div>
    <div v-if="detail" class="content-wrapper">
      <div class="header-section">
        <div class="header-top">
          <div class="title-row">
            <span class="badge species">{{ SpeciesLabels[detail.species] }}</span>
            <span class="badge" :class="detail.status">{{
              getAdoptionStatusLabel(detail.status)
            }}</span>
            <h1 class="name">{{ detail.title }}</h1>
          </div>
          <!-- 작성자 본인만 수정/삭제 버튼 표시 (상단 우측) -->
          <div v-if="isLoggedIn && isAuthor" class="action-buttons">
            <button class="btn-small edit" @click="editPost">수정</button>
            <button class="btn-small delete" @click="confirmDelete">삭제</button>
          </div>
        </div>
        <div class="meta-info">
          <span @click="goToProfile()" class="clickable">작성자: {{
            detail.writer?.nickname || '알 수 없음'
          }}</span>
          <span class="divider">|</span>
          <span>등록일: {{ formatDate(detail.createdAt) }}</span>
          <span class="divider">|</span>
          <span>수정일: {{ formatDate(detail.modifiedAt) }}</span>
        </div>
      </div>

      <hr class="separator" />

      <div class="info-grid">
        <div class="info-item">
          <span class="label">제목</span>
          <span class="value">{{ detail.title }}</span>
        </div>
        <div class="image-container">
          <div v-for="imageUrl in detail.imageUrls" :key="imageUrl">
            <img :src="imageUrl" alt="이미지" />
          </div>
        </div>
        <div class="info-item">
          <span class="label">나이</span>
          <span class="value">{{ detail.age }}살</span>
        </div>
        <div class="info-item">
          <span class="label">성별</span>
          <span class="value">{{ SexLabels[detail.sex] }}</span>
        </div>
        <div class="info-item">
          <span class="label">몸무게</span>
          <span class="value">{{ detail.weight }} kg</span>
        </div>
        <div class="info-item">
          <span class="label">중성화</span>
          <span class="value">{{ NeuteringLabels[detail.neutering] }}</span>
        </div>
        <div class="info-item full-width">
          <span class="label">보호 지역</span>
          <span class="value">{{ detail.area }}</span>
        </div>
      </div>

      <hr class="separator" />

      <div class="features-section">
        <h3>특징 및 상세 설명</h3>
        <p class="features-text">
          {{ detail.features }}
        </p>
      </div>

      <div class="button-group">
        <div class="action-buttons-wrapper">
          <!-- 작성자가 아닌 경우: 입양 문의하기 -->
          <button
            v-if="isLoggedIn && !isAuthor && detail.status === AdoptionPostStatus.PROCEEDING || detail.adopter?.id === detail.writer?.id"
            class="btn primary" @click="handleChatRequest">
            입양 문의 {{ detail.chatRoomCount !== undefined ? `(${detail.chatRoomCount})` : '' }}
          </button>

          <!-- 작성자일 경우 -->
          <div v-if="isLoggedIn && isAuthor && detail.status" class="author-actions">
            <div class="status-actions">
              <button
                v-if="detail.status !== AdoptionPostStatus.PROCEEDING && detail.status !== AdoptionPostStatus.COMPLETED"
                class="btn reserved" @click="handleStatusChange(AdoptionPostStatus.PROCEEDING)">
                모집중으로 변경
              </button>
              <button
                v-if="detail.status !== AdoptionPostStatus.RESERVED && detail.status !== AdoptionPostStatus.COMPLETED"
                class="btn proceeding" @click="handleStatusChange(AdoptionPostStatus.RESERVED)">
                예약중으로 변경
              </button>
              <button v-if="detail.status !== AdoptionPostStatus.COMPLETED" class="btn completed"
                @click="handleCompleteAdoptionClick">
                입양 완료 처리
              </button>
              <button v-if="detail.status === AdoptionPostStatus.COMPLETED" class="btn cancel"
                @click="handleCancelCompleteAdoption">
                입양 완료 취소
              </button>
            </div>
            <button class="btn chat-list" @click="goToChatList">
              문의 온 채팅 {{ detail.chatRoomCount !== undefined ? `(${detail.chatRoomCount})` : '' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 입양자 선택 모달 -->
    <div v-if="showCandidateModal" class="modal-overlay">
      <div class="modal-content">
        <h3>입양자 선택</h3>
        <p>채팅을 진행한 사용자 중 입양자를 선택해주세요.</p>

        <div class="candidates-list">
          <div v-for="candidate in candidates" :key="candidate.id" class="candidate-item"
            :class="{ selected: selectedAdopterId === candidate.id }" @click="selectedAdopterId = candidate.id">
            <div class="candidate-profile">
              <img :src="candidate.imageUrl || undefined" alt="프로필" class="candidate-img" />
              <span class="candidate-nickname">{{ candidate.nickname }}</span>
            </div>
            <div class="candidate-radio">
              <input type="radio" :value="candidate.id" v-model="selectedAdopterId" />
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn secondary" @click="showCandidateModal = false">취소</button>
          <button class="btn primary" @click="confirmCompleteAdoption">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-btn-wrapper {
  margin-bottom: 20px;
}

.btn-back {
  background: none;
  border: none;
  color: #666;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  transition: color 0.2s;
}

.btn-back:hover {
  color: #333;
}

.clickable {
  cursor: pointer;
  color: #2196f3;
}

/* 컨테이너 */
.detail-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 40px 20px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}


/* 헤더 */
.header-section {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 10px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.badge {
  background-color: #ff9800;
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
}

.badge.COMPLETED {
  background-color: #888;
}

.badge.RESERVED {
  background-color: #2196f3;
}

.name {
  font-size: 28px;
  margin: 0;
  color: #333;
}

.meta-info {
  font-size: 14px;
  color: #888;
}

.divider {
  margin: 0 8px;
  color: #ddd;
}

/* 상단 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-small {
  padding: 6px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  font-size: 13px;
  transition: background 0.2s;
}

.btn-small.edit {
  background-color: #2196f3;
  color: white;
}

.btn-small.delete {
  background-color: #f44336;
  color: white;
}

/* 구분선 */
.separator {
  border: 0;
  height: 1px;
  background-color: #eee;
  margin: 24px 0;
}

/* 정보 그리드 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  background-color: #f9f9f9;
  padding: 24px;
  border-radius: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item.full-width {
  grid-column: span 2;
}

.label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.value {
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

/* 이미지 */
.image-container {
  grid-column: span 2;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.image-container>div {
  flex: 0 0 auto;
  max-width: 200px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.image-container>div:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-container img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

/* 특징 섹션 */
.features-section h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
}

.features-text {
  line-height: 1.6;
  color: #444;
  white-space: pre-wrap;
}

/* 하단 버튼 그룹 */
.button-group {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
}

.action-buttons-wrapper {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  font-size: 15px;
  transition: background 0.2s;
  background-color: #f0f0f0;
  color: #333;
}

.btn.primary {
  background-color: #ff9800;
  color: white;
}

.btn.secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn.chat-list {
  background-color: #ff9800;
  color: white;
  border: 1px solid #ddd;
}

.author-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.status-actions {
  display: flex;
  gap: 8px;
}


/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 8px;
}

.candidates-list {
  margin: 20px 0;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.candidate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.candidate-item:last-child {
  border-bottom: none;
}

.candidate-item:hover,
.candidate-item.selected {
  background-color: #f5f9ff;
}

.candidate-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.candidate-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.candidate-nickname {
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 반응형 */
@media (max-width: 600px) {
  .header-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item.full-width {
    grid-column: span 1;
  }

  .image-container {
    grid-column: span 1;
  }

  .image-container>div {
    max-width: 100%;
  }

  .image-container img {
    height: 250px;
  }
}
</style>