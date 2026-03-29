<template>
  <v-app>
    <nav>
      <router-link :to="{ name: 'Home' }">홈</router-link>
      <router-link v-if="!isLoggedIn" :to="{ name: 'Login' }">로그인</router-link>
      <router-link v-if="!isLoggedIn" :to="{ name: 'Signup' }">회원가입</router-link>
      <router-link v-if="isLoggedIn" :to="{ name: 'Home' }" @click="authStore.logout()">로그아웃</router-link>
      <a v-if="isLoggedIn && userId" @click="drawer = !drawer">
        <img :src="userInfo.imageUrl" alt="프로필 이미지" class="profile-image">
      </a>
    </nav>

    <!-- 사이드바 -->
    <!-- <v-navigation-drawer v-if="isLoggedIn && userId" v-model="drawer" temporary location="right">
      <v-list>
          <v-list-item @click="router.push(Navigator.adoption.history(userId))" link>
          <v-list-item-title>내 작성글</v-list-item-title>
        </v-list-item>
          <v-list-item  @click="router.push(Navigator.chat.myList())" link>
          <v-list-item-title>내 채팅</v-list-item-title>
        </v-list-item>
        <v-list-item @click="router.push(Navigator.user.myProfile())" link>
          <v-list-item-title>설정</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer> -->

    <v-navigation-drawer v-if="isLoggedIn && userId" v-model="drawer" temporary location="right" class="custom-drawer">
      <div class="drawer-header">
        <span>내 메뉴</span>
      </div>
      <v-divider class="mb-2"></v-divider>

      <v-list class="drawer-list">
        <v-list-item @click="router.push(Navigator.adoption.history(userId))" link class="drawer-item">
          <template v-slot:prepend>
            <v-icon class="item-icon">mdi-pencil-box-outline</v-icon>
          </template>
          <v-list-item-title class="item-title">내 작성글</v-list-item-title>
        </v-list-item>

        <v-list-item @click="router.push(Navigator.chat.myList())" link class="drawer-item">
          <template v-slot:prepend>
            <v-icon class="item-icon">mdi-chat-outline</v-icon>
          </template>
          <v-list-item-title class="item-title">내 채팅</v-list-item-title>
        </v-list-item>

        <v-list-item @click="router.push(Navigator.user.myProfile())" link class="drawer-item">
          <template v-slot:prepend>
            <v-icon class="item-icon">mdi-cog-outline</v-icon>
          </template>
          <v-list-item-title class="item-title">설정</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <router-view />
    <!-- 여기서 URL에 맞는 화면이 바뀜 -->

    <LoadingOverlay v-if="loadingStore.isLoading" />
    <GlobalAlert />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useAuthStore } from "./auth/stores/auth";
import { useAlert } from "@/global/composables/useAlert";
import { useLoadingStore } from "@/global/stores/loading";
import LoadingOverlay from "@/global/components/LoadingOverlay.vue";
import { Navigator, RouteNames } from "@/global/router/routeHelper.ts";
import router from "@/global/router";
import { getUserProfile } from "./user/api/user.api";
import { UserProfileResponse } from "./user/types/user";

const loadingStore = useLoadingStore();
const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);
const userId = computed(() => authStore.userId);
const { alert } = useAlert();

const drawer = ref(false);
const userInfo = ref<UserProfileResponse>({
  id: '',
  nickname: '',
  imageUrl: ''
});

onMounted(async () => {
  // 앱 시작 시 로그인 상태 초기화 (전역 상태 업데이트)
  try {
    await authStore.initializeAuth();
  } catch (error) {
    alert("Error", "앱 시작 시 로그인 상태 초기화 실패");
  }
  if (isLoggedIn.value && userId.value) {
    const data = await getUserProfile(userId.value); // nickname, imageUrl
    userInfo.value = data;
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
  width: 100%;
  min-width: max-content;
  box-sizing: border-box;
}

a {
  text-decoration: none;
  /* 밑줄 제거 */
  color: inherit;
  /* 부모 색상 상속 (기본 파란색 제거) */
  cursor: pointer;
  /* 선택 시 커서 포인터 */
}

.profile-image {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
}

/* Drawer 전체 배경색 설정 (원하시면 변경 가능) */
.custom-drawer {
  background-color: #ffffff;
}

/* Drawer 상단 헤더 부분 */
.drawer-header {
  padding: 24px 20px 12px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
}

/* 리스트 전체 여백 */
.drawer-list {
  padding: 8px 12px;
}

/* 개별 리스트 아이템 스타일 */
.drawer-item {
  border-radius: 10px !important;
  /* 모서리를 둥글게 */
  margin-bottom: 8px;
  /* 메뉴 사이 간격 */
  transition: all 0.2s ease;
  /* 부드러운 애니메이션 효과 */
}

/* 마우스 호버(올렸을 때) 효과 */
.drawer-item:hover {
  background-color: #f4f4f9 !important;
  /* 연한 회색/파란색 톤 배경 */
  transform: translateX(4px);
  /* 오른쪽으로 살짝 이동하는 효과 */
}

/* 아이콘 스타일 */
.item-icon {
  color: #666;
  font-size: 1.4rem;
  margin-right: 8px;
}

/* 텍스트 스타일 */
.item-title {
  font-size: 1rem;
  font-weight: 500;
  color: #444;
}
</style>
