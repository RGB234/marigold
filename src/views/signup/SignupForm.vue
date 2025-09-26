<template>
  <div class="main-container">
    <!-- 로고 -->
    <div class="logo">
      <img src="@/assets/logo.png" alt="Marigold" />
      <h1>Marigold</h1>
    </div>

    <div class="content">
      <div class="type-selection">
        <button class="type-btn">개인회원</button>
        <button class="type-btn" @click="goToSignupSubmitForm">기관회원</button>
      </div>

      <!-- 카카오 연동 -->
      <button class="login-btn-kakao" @click="loginWithKakao">
        <!-- <span class="mr-2">💬</span> 카카오톡으로 로그인 -->
        <img src="@/assets/kakaotalk-icon.png" /> 카카오톡 연동 회원가입
      </button>

      <!-- 네이버 연동 -->
      <button
        class="login-btn-naver"
        style="background-color: #03c75a"
        @click="loginWithNaver"
      >
        <img src="@/assets/naver-icon.png" /> 네이버 연동 회원가입
      </button>
      <!-- 로그인 -->
      <p class="login-page-btn" @click="goToLoginForm">로그인 화면으로</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

// 기업 회원가입 입력 양식화면 이동
function goToSignupSubmitForm() {
  router.push(process.env.VUE_APP_SIGNUP_SUBMIT);
}

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

// 회원가입 페이지 이동
function goToLoginForm() {
  router.push(process.env.VUE_APP_LOGIN);
}
</script>

<style scoped>
/* 전체 화면 중앙 정렬 */
.main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  min-height: 100vh;
  background-color: white;
}

/* 로고 영역 */
.logo {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo > img {
  width: 12rem;
  height: 12rem;
  margin-bottom: 0.5rem;
}

.logo > h1 {
  font-size: 1.5rem; /* text-2xl */
  font-weight: bold;
  color: #b45309; /* text-amber-800 */
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* 회원가입 타입 선택 버튼*/
div.type-selection {
  display: flex;
  width: 16rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  /* overflow: hidden; */
  border: none;
}

button.type-btn {
  flex: 1;
  background: #ffffff;
}

button.type-btn:first-child {
  border: 1.6px solid #eaa221;
}

button.type-btn:last-child {
  border: 1px solid #0000005c;
  border-left: none;
}

/* 로그인 버튼 공통 */
button {
  width: 16rem;
  padding: 0.75rem 0;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: left;
  padding-left: 2rem;
  cursor: pointer;
  border: 1px solid #0000005c;
  /* border: none; */
}

button > img {
  width: 2rem;
  margin-right: 1rem;
}

/* 카카오 로그인 */
button.login-btn-kakao {
  background-color: #ffeb00;
  color: #191919; /* text-gray-800 */
  border-radius: 0.5rem; /* rounded-lg */
}

/* 네이버 로그인 */
button.login-btn-naver {
  background-color: #00bf18;
  color: white;
  border-radius: 0.5rem; /* rounded-lg */
}

/* 기관회원 로그인 */
button.login-btn-institution {
  background-color: white;
  border: 1px solid #9ca3af; /* border-gray-400 */
  color: #374151; /* text-gray-700 */
  font-weight: 500; /* font-medium */
  margin-bottom: 1rem; /* mb-4 */
}

/* 로그인 텍스트 */
p.login-page-btn {
  font-size: 0.875rem; /* text-sm */
  color: #4b5563; /* text-gray-600 */
  cursor: pointer;
}

p.login-page-btn:hover {
  text-decoration: underline;
}
</style>
