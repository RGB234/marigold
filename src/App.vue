<template>
  <v-app>
    <nav>
      <router-link :to="{ name: 'Home' }">홈</router-link>
      <router-link v-if="!isLoggedIn" :to="{ name: 'Login' }">로그인</router-link>
      <router-link v-if="!isLoggedIn" :to="{ name: 'Signup' }">회원가입</router-link>
      <router-link v-if="isLoggedIn" :to="{ name: 'Home' }" @click="authStore.logout()">로그아웃</router-link>
      <router-link v-if="isLoggedIn && userId" :to="{ name: 'MyProfile' }">내 계정</router-link>
    </nav>

    <router-view />
    <!-- 여기서 URL에 맞는 화면이 바뀜 -->

    <LoadingOverlay v-if="loadingStore.isLoading" />
    <GlobalAlert />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useAuthStore } from "./auth/stores/auth";
import { useAlert } from "@/global/composables/useAlert";
import { useLoadingStore } from "@/global/stores/loading";
import LoadingOverlay from "@/global/components/LoadingOverlay.vue";

const loadingStore = useLoadingStore();
const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);
const userId = computed(() => authStore.userId);
const { alert } = useAlert();

onMounted(async () => {
  // 앱 시작 시 로그인 상태 초기화 (전역 상태 업데이트)
  try{
    await authStore.initializeAuth();
  }catch(error){
    alert("Error", "앱 시작 시 로그인 상태 초기화 실패");
  }
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
  justify-content: flex-end;
  /* 오른쪽 정렬 */
  align-items: center;
  /* 세로 중앙 정렬 */
  padding-right: 2rem;
  font-size: 1.3rem;
  font-weight: 700;
}

a {
  text-decoration: none;
  /* 밑줄 제거 */
  color: inherit;
  /* 부모 색상 상속 (기본 파란색 제거) */
  cursor: pointer;
  /* 선택 시 커서 포인터 */
}
</style>