<template>
  <div class="main-container">
    <!-- 로고 -->
    <div class="logo">
      <img src="@/assets/logo.png" alt="Marigold" />
      <h1>Marigold</h1>
    </div>

    <!-- 구분선 -->
    <div class="divider">
      <span class="divider-text">소셜 계정으로 로그인</span>
    </div>

    <!-- 카카오 로그인 -->
    <button class="login-btn-kakao" @click="loginWithKakao">
      <img src="@/assets/kakaotalk-icon.png" /> <span>카카오 로그인</span>
    </button>

    <!-- 네이버 로그인 -->
    <button class="login-btn-naver" @click="loginWithNaver">
      <img src="@/assets/naver-icon.png" /> <span>네이버 로그인</span>
    </button>

    <!-- 회원가입 -->
    <p class="signup-page-btn" @click="goToSignupForm">회원가입 화면으로</p>
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

// 회원가입 페이지 이동
function goToSignupForm() {
  router.push(process.env.VUE_APP_SIGNUP);
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
  font-family: Suit-ExtraBold, sans-serif;
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
  left: 15px; /* 왼쪽 여백 조절 */
  
  /* 이미지 세로 중앙 정렬 */
  top: 50%;
  transform: translateY(-50%);
}

/* 카카오 로그인 */
button.login-btn-kakao {
  background-color: #fae100;
  color: #000000;
  /* text-gray-800 */
  margin-bottom: 0.75rem;
  /* mb-3 */
}

/* 네이버 로그인 */
button.login-btn-naver {
  background-color: #03c158;
  color: #000000;
  margin-bottom: 1.5rem;
  /* mb-6 */
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
