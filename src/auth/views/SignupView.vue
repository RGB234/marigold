<template>
  <div class="main-container">
    <!-- 로고 -->
    <div class="logo">
      <img src="@/assets/images/logo.png" alt="Marigold" />
      <h1>Marigold</h1>
    </div>

    <!-- 이메일 회원가입 버튼 -->
    <button class="btn-email-signup" @click="goToEmailSignup">
<!--    <button class="signup-buttons" @click="goToEmailSignup">-->
      <span class="icon">✉️</span>
      <span>이메일로 회원가입</span>
    </button>

    <!-- 구분선 -->
    <div class="divider">
      <span class="divider-text">또는 소셜 계정으로 회원가입</span>
    </div>

    <!-- 소셜 회원가입 -->
    <div class="signup-buttons">
      <button v-for="provider in providers" :key="provider.name" :class="provider.class"
        @click="handleSocialSignUp(provider.name)">
        <img :src="provider.icon" />
        <span>{{ provider.description }}</span>
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
import { RouteNames } from '@/global/router/routeHelper';

interface Provider {
  name: ProviderInfo;
  description: string;
  class: string;
  icon: string;
}

// 소셜 로그인 제공자 데이터
const providers = ref<Provider[]>([
  { name: ProviderInfo.NAVER, description: '네이버 계정으로 회원가입', class: 'btn-naver', icon: naverIcon },
  { name: ProviderInfo.KAKAO, description: '카카오 계정으로 회원가입', class: 'btn-kakao', icon: kakaoIcon },
]);

const authStore = useAuthStore();

// 이메일 회원가입 페이지 이동
function goToEmailSignup() {
  router.push({ name: RouteNames.AUTH.EMAIL_SIGNUP });
}

// 소셜 계정으로 회원가입
const handleSocialSignUp = (providerCode: ProviderInfo) => {
  authStore.signup(providerCode);
};

// 로그인 페이지 이동
function goToLoginForm() {
  router.push({ name: RouteNames.AUTH.LOGIN });
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
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

div.logo>img {
  width: 8rem;
  height: 8rem;
  margin-bottom: 0.5rem;
}

div.logo>h1 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #b45309;
}

/* 공통 버튼 베이스 */
.btn-email-signup,
.signup-buttons button {
  width: 16rem;
  padding: 0.75rem 0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 이메일 회원가입 버튼 */
.btn-email-signup {
  background-color: #b45309;
  color: white;
  margin-bottom: 2rem;
  padding: 0.7rem 0;
}

.btn-email-signup .icon {
  margin-right: 0.5rem;
  font-size: 1.125rem;
}

.btn-email-signup:hover {
  background-color: #92400e;
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
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
}

.signup-buttons button img {
  width: 2rem;
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
}

.signup-buttons button span {
  padding-left: 2rem;
}

/* 각 브랜드별 색상 */
button.btn-kakao {
  background-color: #FEE500;
  color: #3C1E1E;
}

button.btn-naver {
  background-color: #00bf18;
  color: white;
}

/* 로그인 텍스트 */
p.login-page-btn {
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
}

p.login-page-btn:hover {
  text-decoration: underline;
}
</style>