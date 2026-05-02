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
      <h3 class="section-title">계정 관리</h3>
      <div class="account-action-list">
        <button class="account-action-button" type="button" @click="goToSecurityAccess">
          보안
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getUserProfile } from '@/user/api/user.api';
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
  return Boolean(authStore.userId && targetUserId.value === authStore.userId);
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

const goToSecurityAccess = () => {
  router.push(RouteHelper.user.securityVerify());
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

.account-action-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.account-action-button {
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e1ded4;
  background: #fffdf8;
  color: #4f422c;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.account-action-button:hover {
  transform: translateY(-1px);
  border-color: #d6c094;
  box-shadow: 0 8px 18px rgba(108, 84, 35, 0.08);
}

.account-action-button.is-danger {
  color: #c53a2f;
  border-color: #f0cbc7;
  background: #fff7f6;
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
</style>
