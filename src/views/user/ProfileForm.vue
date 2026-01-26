<template>
  <LoadingOverlay v-if="loading"></LoadingOverlay>
  <div class="my-page-container">

    <section class="profile-section">
      <div class="profile-image-wrapper">
        <img :src="userInfo.imageUrl" alt="프로필 이미지" class="profile-img" />
      </div>
      <h2 class="nickname">{{ userInfo.nickname }}</h2>
      <button class="edit-btn" @click="goToEditProfile">프로필 수정</button>
    </section>

    <!-- 작성한 글 목록 -->
    <section class="posts-section">
      <h3 class="section-title clickable" @click="goToProfileHistory">작성한 글 목록</h3>
    </section>
    <section class="account-section">
      <h3 class="section-title">
        계정 관리
      </h3>
      <div class=" account-delete-btn clickable" @click="openDeleteModal">
        계정 삭제
      </div>
    </section>

    <!-- 계정 삭제 모달 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content">
        <h3>계정 삭제</h3>
        <p class="warning-text">계정을 삭제하면 복구할 수 없습니다.</p>
        <p class="instruction-text">
          삭제하시려면 아래 문구를 똑같이 입력해 주세요.<br>
          <strong>"계정을 삭제하겠습니다"</strong>
        </p>
        <input 
          v-model="deleteConfirmationInput" 
          type="text" 
          placeholder="계정을 삭제하겠습니다"
          class="confirm-input"
          @keyup.enter="confirmDelete"
        />
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeDeleteModal">취소</button>
          <button 
            class="confirm-delete-btn" 
            :disabled="!isDeleteConfirmed"
            @click="confirmDelete"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getUserProfile, deleteUser } from '@/api/user';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const loading = ref(false);

// 모달 관련 상태
const showDeleteModal = ref(false);
const deleteConfirmationInput = ref('');
const DELETE_CONFIRM_TEXT = "계정을 삭제하겠습니다";

const isDeleteConfirmed = computed(() => {
  return deleteConfirmationInput.value === DELETE_CONFIRM_TEXT;
});

// 유저 정보
const userInfo = ref({
  nickname: '',
  imageUrl: ''
});

const authStore = useAuthStore();
const userId = computed(() => authStore.userId);

// --- 메서드 (Methods) ---

// 데이터 불러오기
const fetchUserProfile = async (UUID) => {
  try {
    loading.value = true;
    const data = await getUserProfile(UUID); // nickname, imageUrl

    userInfo.value = data;
    loading.value = false;
  } catch (error) {
    console.error("프로필 조회 중 오류 발생:", error);
    alert("프로필 조회 중 오류가 발생했습니다.");
    throw error;
  }
}

const goToEditProfile = () => {
  router.push({ name: "Profile_edit" });
}

const goToProfileHistory = () => {
  router.push({ name: "Profile_history" });
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
    loading.value = true;
    const response = await deleteUser(userId.value);
    authStore.logout();
    router.push({name:"Home"})
  } catch (error) {
    console.error("계정 삭제 중 오류 발생:", error);
    // console.log(response); // response is not defined here if error occurs
    alert("계정 삭제 중 오류가 발생했습니다.");
  } finally {
    loading.value = false;
    closeDeleteModal();
  }
}

// --- 라이프사이클 ---
onMounted(async () => {
  await fetchUserProfile(userId.value);
});
</script>

<style scoped>
/* 전체 컨테이너 */
.my-page-container {
  max-width: 600px;
  margin: 0 auto;
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
  max-width: 400px;
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