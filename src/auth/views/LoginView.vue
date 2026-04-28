<template>
  <div class="main-container">
    <!-- 로고 -->
    <div class="logo">
      <img src="@/assets/images/logo.png" alt="Marigold" />
      <h1>Marigold</h1>
    </div>

    <!-- 로컬 로그인 폼 -->
    <form @submit.prevent="handleLocalLogin" class="local-auth-form">
      <input type="email" v-model="loginDto.email" placeholder="이메일" required />
      <div class="password-wrapper">
        <input :type="showPassword ? 'text' : 'password'" v-model="loginDto.password" placeholder="비밀번호" required />
        <span class="toggle-password" @click="showPassword = !showPassword">
          <img v-if="!showPassword" src="@/assets/images/visibility_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" width="20" height="20" alt="비밀번호 표시" />
          <img v-else src="@/assets/images/visibility_off_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" width="20" height="20" alt="비밀번호 숨김" />
        </span>
      </div>
      <button type="submit" class="btn-local-auth">이메일로 로그인</button>
    </form>

    <!-- 구분선 -->
    <div class="divider">
      <span class="divider-text">또는 소셜 계정으로 로그인</span>
    </div>

    <button v-for="provider in providers" @click="loginWithSocial(provider.name)" :class="provider.class"
      :key="provider.name">
      <img :src="provider.icon" />
      <span>{{ provider.description }}</span>
    </button>

    <!-- 회원가입 -->
    <p class="signup-page-btn" @click="goToSignupForm">회원가입 화면으로</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { ProviderInfo, useAuthStore } from "@/auth/stores/auth";
import { useAlert } from '@/global/composables/useAlert';

import naverIcon from '@/assets/images/naver-icon.png';
import kakaoIcon from '@/assets/images/kakaotalk-icon.png';
import router from '@/global/router';
import { RouteHelper } from '@/global/router/routeHelper';

const authStore = useAuthStore();
const { toast, alert } = useAlert();

const loginDto = ref({ email: '', password: '' });
const showPassword = ref(false);

interface Provider {
  name: ProviderInfo;
  description: string;
  class: string;
  icon: string;
}

const providers = ref<Provider[]>([
  { name: ProviderInfo.NAVER, description: '네이버 계정으로 로그인', class: 'btn-naver', icon: naverIcon },
  { name: ProviderInfo.KAKAO, description: '카카오 계정으로 로그인', class: 'btn-kakao', icon: kakaoIcon },
]);

const handleLocalLogin = async () => {
  try {
    await authStore.localLogin(loginDto.value);
    router.push(RouteHelper.home());
  } catch (error: any) {
    alert("로그인 실패", "이메일이나 비밀번호가 유효하지 않습니다.");
  }
};

function loginWithSocial(providerCode: ProviderInfo) {
  authStore.login(providerCode);
}

// 회원가입 페이지 이동
function goToSignupForm() {
  router.push(RouteHelper.auth.signup());
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
}

div.logo>img {
  width: 8rem;
  /* w-32 */
  height: 8rem;
  /* h-32 */
  margin-bottom: 0.5rem;
  /* mb-2 */
}

div.logo>h1 {
  font-size: 1.5rem;
  /* text-2xl */
  font-weight: bold;
  color: #b45309;
  /* text-amber-800 */
}

/* 로컬 인증 폼 스타일 */
.local-auth-form {
  display: flex;
  flex-direction: column;
  width: 16rem;
  margin-bottom: 1.5rem;
}

.local-auth-form input {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

.password-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 0.5rem;
}

.password-wrapper input {
  margin-bottom: 0;
  padding-right: 2.5rem;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-password:hover {
  color: #374151;
}

.local-auth-form input:focus {
  outline: none;
  border-color: #b45309;
}

.btn-local-auth {
  background-color: #b45309;
  color: white;
  padding: 0.75rem 0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-local-auth:hover {
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

/* 로그인 버튼 공통 */
button {
  width: 16rem;
  padding: 0.75rem 0;
  border-radius: 0.5rem;
  font-size: 0.875rem;

  display: flex;
  align-items: center;
  justify-content: center;

  padding-left: 2rem;
  cursor: pointer;
  border: none;

  position: relative;
}

button>img {
  width: 2rem;
  margin-right: 1rem;

  position: absolute;
  left: 15px;
  /* 왼쪽 여백 조절 */

  /* 이미지 세로 중앙 정렬 */
  top: 50%;
  transform: translateY(-50%);
}

/* 네이버 로그인 */
button.btn-naver {
  background-color: #00bf18;
  color: #000000;
  margin-bottom: 1.5rem;
  /* mb-6 */
}

/* 카카오 로그인 */
button.btn-kakao {
  background-color: #fae100;
  color: #000000;
  /* text-gray-800 */
  margin-bottom: 0.75rem;
  /* mb-3 */
}

/* 회원가입 텍스트 */
p.signup-page-btn {
  font-size: 0.875rem;
  /* text-sm */
  color: #4b5563;
  /* text-gray-600 */
  cursor: pointer;
}

p.signup-page-btn:hover {
  text-decoration: underline;
}
</style>
