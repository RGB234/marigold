<template>
  <div class="my-page-container">
    <section class="profile-section">
      <div class="profile-image-wrapper">
        <img :src="userInfo.imageUrl" alt="프로필 이미지" class="profile-img" />
      </div>
      <h2 class="nickname">{{ userInfo.nickname }}</h2>
      <button v-if="isMyProfile" class="edit-btn" @click="goToProfileEdit">프로필 수정</button>
    </section>

    <section v-if="isMyProfile" class="account-section">
      <h3 class="section-title">
        계정 관리
      </h3>
      <div class="account-delete-btn clickable" @click="openDeleteModal">
        계정 삭제
      </div>
    </section>

    <!-- 계정 삭제 모달 -->
    <div v-if="showDeleteModal && isMyProfile" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content">
        <h3>계정 삭제</h3>
        <p class="warning-text">계정을 삭제하면 복구할 수 없습니다.</p>
        <p class="instruction-text">
          삭제하시려면 아래 문구를 똑같이 입력해 주세요.<br>
          <strong>"계정을 삭제하겠습니다"</strong>
        </p>
        <input v-model="deleteConfirmationInput" type="text" placeholder="계정을 삭제하겠습니다" class="confirm-input"
          @keyup.enter="confirmDelete" />
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeDeleteModal">취소</button>
          <button class="confirm-delete-btn" :disabled="!isDeleteConfirmed" @click="confirmDelete">
            삭제하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getUserProfile, deleteUser } from '@/user/api/user.api';
import { useAuthStore } from '@/auth/stores/auth';
import { useAlert } from '@/global/composables/useAlert';
import { RouteHelper } from '@/global/router/routeHelper';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { toast } = useAlert();

// 대상 유저 ID (Path Variable이 있으면 사용, 없으면 내 로그인 ID 사용)
const targetUserId = computed(() => {
  const paramId = route.params.userId;
  // route.params.userId는 string 또는 string[] 일 수 있음
  const id = Array.isArray(paramId) ? paramId[0] : paramId;
  return id || authStore.userId;
});

// 내 프로필인지 여부 판별
const isMyProfile = computed(() => {
  // 1. MyProfile 라우트인 경우
  if (route.name === 'MyProfile') return true;
  // 2. 현재 로그인한 사용자의 ID와 대상 ID가 일치하는 경우
  if (authStore.userId && targetUserId.value === authStore.userId) return true;

  return false;
});

// 모달 관련 상태
const showDeleteModal = ref(false);
const deleteConfirmationInput = ref('');
const DELETE_CONFIRM_TEXT = "계정을 삭제하겠습니다";

const isDeleteConfirmed = computed(() => {
  return deleteConfirmationInput.value === DELETE_CONFIRM_TEXT;
});

// 유저 정보
interface UserInfo {
  id: string;
  nickname: string;
  imageUrl: string;
}

const userInfo = ref<UserInfo>({
  id: '',
  nickname: '',
  imageUrl: ''
});

// --- 메서드 (Methods) ---

// 데이터 불러오기
const fetchUserProfile = async (userId: string) => {
  try {
    const data = await getUserProfile(userId); // nickname, imageUrl
    userInfo.value = data;
  } catch (error) {
    console.error("프로필 조회 중 오류 발생:", error);
    toast.error("프로필 조회 중 오류가 발생했습니다.");
    throw error;
  }
}

const goToProfileEdit = () => {
  router.push(RouteHelper.user.profileUpdate());
}

const openDeleteModal = () => {
  showDeleteModal.value = true;
  deleteConfirmationInput.value = '';
}

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deleteConfirmationInput.value = '';
}

const confirmDelete = async () => {
  if (!isDeleteConfirmed.value) return;

  await deleteAccount();
}

const deleteAccount = async () => {
  try {
    await deleteUser();
    authStore.logout();
    router.push(RouteHelper.home());
  } catch (error) {
    console.error("계정 삭제 중 오류 발생:", error);
    toast.error("계정 삭제 중 오류가 발생했습니다.");
  } finally {
    closeDeleteModal();
  }
}

// --- 라이프사이클 ---
onMounted(async () => {
  if (targetUserId.value) {
    await fetchUserProfile(targetUserId.value);
  }
});

// 라우트 파라미터가 변경되거나(예: 다른 사람 프로필 클릭), 
// MyProfile <-> Profile 이동 시 데이터 갱신
watch(
  () => route.params.userId,
  async (newId) => {
    // 새 ID가 있으면 그 ID로, 없으면 내 ID로 조회
    const idToFetch = Array.isArray(newId) ? newId[0] : newId || authStore.userId;
    if (idToFetch) {
      await fetchUserProfile(idToFetch);
    }
  }
);
</script>

<style scoped>
/* 전체 컨테이너 */
.my-page-container {
  max-width: 600px;
  min-width: max-content;
  width: 100%;
  box-sizing: border-box;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  min-height: 100vh;
}

/* 공통 섹션 스타일 */
section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
}

.clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.clickable:hover {
  color: #2196f3;
}

.account-delete-btn {
  font-size: 16px;
  font-weight: bold;
  margin-top: 20px;
}

.account-delete-btn:hover {
  color: #2196f3;
}

/* 1. 프로필 영역 스타일 */
.profile-section {
  text-align: center;
}

.profile-image-wrapper {
  width: 100px;
  height: 100px;
  margin: 0 auto 10px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #eee;
}

.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nickname {
  font-size: 22px;
  margin: 5px 0;
  font-weight: bold;
}

.edit-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  box-sizing: border-box;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.warning-text {
  color: #ff4444;
  margin-bottom: 15px;
  font-size: 14px;
}

.instruction-text {
  margin-bottom: 20px;
  line-height: 1.5;
  color: #555;
}

.confirm-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 16px;
  text-align: center;
}

.confirm-input:focus {
  border-color: #ff4444;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.cancel-btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: #f5f5f5;
}

.confirm-delete-btn {
  padding: 10px 20px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: opacity 0.2s;
}

.confirm-delete-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.confirm-delete-btn:not(:disabled):hover {
  opacity: 0.9;
}
</style>