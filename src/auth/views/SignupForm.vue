<template>
  <div class="main-container">
    <!-- 로고 -->
    <div class="logo">
      <img src="@/assets/images/logo.png" alt="Marigold" />
      <h1>Marigold</h1>
    </div>
    <!-- 구분선 -->
    <div class="divider">
      <span class="divider-text">소셜 계정으로 회원가입</span>
    </div>

    <!-- 회원가입 -->
    <div class="signup-buttons">
      <button v-for="provider in providers" :key="provider.name" :class="provider.class"
        @click="handleSocialSignUp(provider.name)">
        <img :src="provider.icon" />
      </button>
    </div>

    <!-- 로그인 리다이렉션 -->
    <p class="login-page-btn" @click="goToLoginForm">로그인 화면으로</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {ProviderInfo, useAuthStore } from '@/auth/stores/auth';
import naverIcon from '@/assets/images/naver-icon.png';
import kakaoIcon from '@/assets/images/kakaotalk-icon.png';
import router from '@/global/router';

interface Provider {
  name: ProviderInfo;
  description: string;
  class: string;
  icon: string;
}

// 소셜 로그인 제공자 데이터
const providers = ref<Provider[]>([
  { name: ProviderInfo.NAVER, description: '네이버 계정으로 화원가입', class: 'btn-naver', icon: naverIcon },
  { name: ProviderInfo.KAKAO, description: '카카오 계정으로 회원가입', class: 'btn-kakao', icon: kakaoIcon },
]);

const authStore = useAuthStore();


// 소셜 계정으로 회원가입
const handleSocialSignUp = (providerCode: ProviderInfo) => {
  authStore.signup(providerCode);
};

// 회원가입 페이지 이동
function goToLoginForm() {
  router.push(import.meta.env.VITE_APP_LOGIN);
}
</script>

<style scoped>
/* 전체 화면 중앙 정렬 */
div.main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  background-color: white;
}

/* 로고 영역 */
div.main-container>div.logo {
  margin-bottom: 2rem;
  /* mb-8 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

div.logo>img {
  width: 8rem;
  height: 8rem;
  margin-bottom: 0.5rem;
  justify-content: center;
  align-items: center;
}

div.logo>h1 {
  font-size: 1.5rem;
  /* text-2xl */
  font-weight: bold;
  color: #b45309;
  /* text-amber-800 */
}

/* 1. 구분선 스타일 */
.divider {
  display: flex;
  align-items: center;
  width: 30%;
  min-width: 300px;
  margin-bottom: 24px;
  color: #888;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.divider-text {
  padding: 0 10px;
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

/* 2. 소셜 버튼 컨테이너 */
.signup-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 30px;
}

/* 공통 버튼 스타일 */
button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  transition: transform 0.2s;
}

button:hover {
  transform: scale(1.05);
}

button img {
  width: 90%;
  height: auto;
  object-fit: cover;
}

/* 각 브랜드별 색상 (이미지가 없을 때 배경색으로 표현) */

button.btn-kakao {
  background-color: #FEE500;
  color: #3C1E1E;
  /* 카카오 갈색 */
}

button.btn-naver {
  background-color: #00bf18;
  color: white;
}

/* 로그인 텍스트 */
p.login-page-btn {
  font-size: 0.875rem;
  /* text-sm */
  color: #4b5563;
  /* text-gray-600 */
  cursor: pointer;
}

p.login-page-btn:hover {
  text-decoration: underline;
}
</style>