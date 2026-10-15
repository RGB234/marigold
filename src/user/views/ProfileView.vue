<template>
  <div class="my-page-container">
    <RequestLoadingState v-if="loading" message="프로필을 불러오는 중입니다..." />
    <RequestErrorState v-else-if="loadError" :message="loadError" @retry="retryFetchProfile" />
    <section v-if="userInfo" class="profile-section">
      <div class="profile-image-wrapper">
        <img :src="userInfo.imageUrl || defaultProfileImage" alt="프로필 이미지" class="profile-img" />
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
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getUserProfile } from '@/user/api/user.api';
import { useAuthStore } from '@/auth/stores/auth';
import { useUserStore } from '@/user/stores/user';
import type { UserInfoDto } from '@/user/types/user';
import defaultProfileImage from '@/assets/images/default-profile.png';
import { RouteHelper } from '@/global/router/routeHelper';
import RequestErrorState from '@/shared/ui/request-state/RequestErrorState.vue';
import RequestLoadingState from '@/shared/ui/request-state/RequestLoadingState.vue';
import { getApiErrorMessage } from '@/shared/errors/apiError';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const userStore = useUserStore();

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

const viewedProfile = ref<UserInfoDto | null>(null);
const loading = ref(false);
const loadError = ref('');
const userInfo = computed(() => isMyProfile.value ? userStore.profile : viewedProfile.value);
let profileRequestId = 0;

// --- 메서드 (Methods) ---

// 데이터 불러오기
const fetchUserProfile = async (userId: string) => {
  const requestId = ++profileRequestId;
  loading.value = true;
  loadError.value = '';
  try {
    if (userId === authStore.userId) {
      await userStore.loadCurrentUser(userId);
      return;
    }

    const profile = await getUserProfile(userId);
    if (requestId === profileRequestId) {
      viewedProfile.value = profile;
    }
  } catch (error) {
    if (requestId === profileRequestId) {
      loadError.value = getApiErrorMessage(error, '프로필을 불러오지 못했습니다.');
    }
  } finally {
    if (requestId === profileRequestId) {
      loading.value = false;
    }
  }
}

const retryFetchProfile = async () => {
  if (targetUserId.value) {
    await fetchUserProfile(targetUserId.value);
  }
};

const goToProfileEdit = () => {
  router.push(RouteHelper.user.profileUpdate());
}

const goToSecurityAccess = () => {
  router.push(RouteHelper.user.securityVerify());
}


watch(
  targetUserId,
  async (userId) => {
    viewedProfile.value = null;
    if (userId) {
      await fetchUserProfile(userId);
    }
  },
  { immediate: true },
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
