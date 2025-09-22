<template>
  <div class="main-container">
    <!-- 로고 -->
    <div class="logo">
      <img src="@/assets/logo.png" alt="Marigold" />
      <h1>Marigold</h1>
    </div>

    <!-- 카카오 로그인 -->
    <button class="login-btn-kakao" @click="loginWithKakao">
      <!-- <span class="mr-2">💬</span> 카카오톡으로 로그인 -->
      <img src="@/assets/kakaotalk-icon.png" /> 카카오톡으로 로그인
    </button>

    <!-- 네이버 로그인 -->
    <button
      class="login-btn-naver"
      style="background-color: #03c75a"
      @click="loginWithNaver"
    >
      <img src="@/assets/naver-icon.png" /> 네이버로 로그인
    </button>

    <!-- 구분선 -->
    <div class="divider"></div>

    <!-- 기관회원 로그인 -->
    <button class="login-btn-institution" @click="loginAsInstitution">
      <img src="@/assets/mail-icon.png" /> 기관회원 로그인
    </button>

    <!-- 회원가입 -->
    <p class="signup-page-btn" @click="goToSignup">회원가입하기</p>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

// 카카오 로그인
async function loginWithKakao() {
  const kakaoLoginUrl = process.env.VUE_APP_API_OAUTH2_KAKAO_LOGIN;
  window.location.href = kakaoLoginUrl;
}

// 네이버 로그인
function loginWithNaver() {
  const naverLoginUrl = process.env.VUE_APP_API_OAUTH2_NAVER_LOGIN;
  window.location.href = naverLoginUrl;
}

// 기관회원 로그인
function loginAsInstitution() {
  alert("기관회원 로그인 페이지 준비중...");
}

// 회원가입 페이지 이동
function goToSignup() {
  router.push(process.env.VUE_APP_SIGNUP_URL);
}
</script>

<style scoped>
/* 전체 화면 중앙 정렬 */
div.main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: white;
}

/* 로고 영역 */
div.main-container > div.logo {
  margin-bottom: 2rem; /* mb-8 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

div.logo > img {
  width: 8rem; /* w-32 */
  height: 8rem; /* h-32 */
  margin-bottom: 0.5rem; /* mb-2 */
}

div.logo > h1 {
  font-size: 1.5rem; /* text-2xl */
  font-weight: bold;
  color: #b45309; /* text-amber-800 */
}

/* 로그인 버튼 공통 */
button {
  width: 16rem; /* w-64 */
  padding: 0.75rem 0; /* py-3 */
  border-radius: 0.5rem; /* rounded-lg */
  font-weight: 600; /* font-semibold */
  font-size: 0.875rem; /* text-sm */
  display: flex;
  align-items: center;
  justify-content: left;
  padding-left: 2rem;
  cursor: pointer;
}

button > img {
  width: 2rem;
  margin-right: 1rem;
}

/* 카카오 로그인 */
button.login-btn-kakao {
  background-color: #ffeb00;
  color: #191919; /* text-gray-800 */
  margin-bottom: 0.75rem; /* mb-3 */
}

/* 네이버 로그인 */
button.login-btn-naver {
  background-color: #00bf18;
  color: white;
  margin-bottom: 1.5rem; /* mb-6 */
}

/* 기관회원 로그인 */
button.login-btn-institution {
  background-color: white;
  border: 1px solid #9ca3af; /* border-gray-400 */
  color: #374151; /* text-gray-700 */
  font-weight: 500; /* font-medium */
  margin-bottom: 1rem; /* mb-4 */
}

/* 구분선 */
div.divider {
  width: 16rem; /* w-64 */
  border-top: 1px solid #d1d5db; /* border-gray-300 */
  margin-bottom: 1.5rem; /* mb-6 */
}

/* 회원가입 텍스트 */
p.signup-page-btn {
  font-size: 0.875rem; /* text-sm */
  color: #4b5563; /* text-gray-600 */
  cursor: pointer;
}

p.signup-page-btn:hover {
  text-decoration: underline;
}
</style>
