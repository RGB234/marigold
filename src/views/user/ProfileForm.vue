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
      <h3 class="section-title" @click="goToProfileHistory">작성한 글 목록</h3>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getUserProfile } from '@/api/user';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const loading = ref(false);

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
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;
}

.section-title:hover {
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
</style>