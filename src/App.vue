<template>
  <div>
    <nav>
      <router-link :to="homeUrl">홈</router-link>
      <router-link :to="adoptionUrl">입양하기</router-link>
      <router-link :to="volunteerUrl">봉사활동</router-link>
      <router-link v-if="!authStore.isAuthenticated" :to="loginUrl"
        >로그인</router-link
      >
      <router-link v-if="!authStore.isAuthenticated" :to="signupUrl"
        >회원가입</router-link
      >
      <router-link
        v-if="authStore.isAuthenticated"
        :to="homeUrl"
        @click="handleLogout"
        >로그아웃</router-link
      >
      <router-link v-if="authStore.isAuthenticated" :to="profileUrl"
        >프로필</router-link
      >
    </nav>

    <router-view />
    <!-- 여기서 URL에 맞는 화면이 바뀜 -->
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import { useRouter } from "vue-router";

const homeUrl = process.env.VUE_APP_HOME;
const adoptionUrl = process.env.VUE_APP_ADOPTION;
const volunteerUrl = process.env.VUE_APP_VOLUNTEER;
const loginUrl = process.env.VUE_APP_LOGIN;
const signupUrl = process.env.VUE_APP_SIGNUP;
const profileUrl = process.env.VUE_APP_PROFILE;

const authStore = useAuthStore();

authStore.isAuthenticated;

const router = useRouter();

async function handleLogout() {
  try {
    await authStore.logout();
    router.push(homeUrl);
  } catch (err) {
    alert("로그아웃 실패");
    console.error("로그아웃 실패");
    console.error(err);
  }
}

onMounted(async () => {
  await authStore.getAuthStatus();
});
</script>

<style scoped>
nav {
  height: 4rem;
  background-color: white;
  border-bottom: 1.5px solid #d6d6da;
  border-left: none;
  border-right: none;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 2rem;
  justify-content: flex-end; /* 오른쪽 정렬 */
  align-items: center; /* 세로 중앙 정렬 */
  padding-right: 2rem;
  font-size: 1.2rem;
}

a {
  text-decoration: none; /* 밑줄 제거 */
  color: inherit; /* 부모 색상 상속 (기본 파란색 제거) */
  cursor: pointer; /* 선택 시 커서 포인터 */
}
</style>
