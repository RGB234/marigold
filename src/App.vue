<template>
  <div class="app-container">
    <nav>
      <router-link :to=RouteHelper.home()>홈</router-link>
      <router-link v-if="!isLoggedIn" :to=RouteHelper.auth.login()>로그인</router-link>
      <router-link v-if="!isLoggedIn" :to=RouteHelper.auth.signup()>회원가입</router-link>
      
      <div v-if="isLoggedIn && userId" class="profile-menu-container" ref="menuContainer">
        <a class="profile-activator" @click="toggleMenu">
          <img :src="userInfo.imageUrl" alt="프로필 이미지" class="profile-image">
        </a>

        <!-- 드롭다운 메뉴 (Vuetify 대체) -->
        <div v-if="isMenuOpen" class="dropdown-menu">
          <div class="menu-header" @click="handleNavigation(RouteHelper.user.profile(userId))">
            <UserProfileLink class="app-profile-link" :userId="userId" :nickname="userInfo.nickname" :imageUrl="userInfo.imageUrl" :showImage="true" imageSize="2.5rem" />
          </div>
          
          <div class="divider"></div>

          <div class="menu-list">
            <div class="menu-item" @click="handleNavigation(RouteHelper.adoption.writerList(userId))">
              <i class="mdi mdi-pencil-box-outline item-icon"></i>
              <span class="item-title">작성글 목록</span>
            </div>

            <div class="menu-item" @click="handleNavigation(RouteHelper.adoption.adopterList(userId))">
              <i class="mdi mdi-heart-outline item-icon"></i>
              <span class="item-title">입양 목록</span>
            </div>

            <div class="menu-item" @click="handleNavigation(RouteHelper.chat.list())">
              <i class="mdi mdi-chat-outline item-icon"></i>
              <span class="item-title">대화 목록</span>
            </div>

            <div class="menu-item" @click="handleNavigation(RouteHelper.user.profile(userId))">
              <i class="mdi mdi-cog-outline item-icon"></i>
              <span class="item-title">설정</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="menu-list">
            <div class="menu-item" @click="handleLogout">
              <i class="mdi mdi-logout item-icon"></i>
              <span class="item-title">로그아웃</span>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <router-view />
    <LoadingOverlay v-if="loadingStore.isLoading" />
    <GlobalAlert />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from "vue";
import { useAuthStore } from "./auth/stores/auth";
import { useAlert } from "@/global/composables/useAlert";
import { useLoadingStore } from "@/global/stores/loading";
import LoadingOverlay from "@/global/components/LoadingOverlay.vue";
import { RouteHelper } from "@/global/router/routeHelper.ts";
import router from "@/global/router";
import { getUserProfile } from "./user/api/user.api";
import { UserInfoDto } from "./user/types/user";
import { RouteLocationRaw } from "vue-router";
import UserProfileLink from '@/global/components/UserProfileLink.vue';

const loadingStore = useLoadingStore();
const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);
const userId = computed(() => authStore.userId);
const { alert } = useAlert();

// 드롭다운 메뉴 상태 관리
const isMenuOpen = ref(false);
const menuContainer = ref<HTMLElement | null>(null);

const userInfo = ref<UserInfoDto>({
  id: '',
  nickname: '',
  imageUrl: ''
});

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// 메뉴 외부 클릭 시 닫기
const closeMenu = (e: MouseEvent) => {
  if (menuContainer.value && !menuContainer.value.contains(e.target as Node)) {
    isMenuOpen.value = false;
  }
};

const handleNavigation = (path: RouteLocationRaw) => {
  router.push(path);
  isMenuOpen.value = false;
};

// 로그아웃 후 홈으로 이동하는 함수 추가
const handleLogout = () => {
  authStore.logout();
  router.push(RouteHelper.home());
  isMenuOpen.value = false;
};

onMounted(async () => {
  document.addEventListener('click', closeMenu);
  
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

onUnmounted(() => {
  document.removeEventListener('click', closeMenu);
});

</script>

<style scoped>
/* Vuetify v-app 역할을 대체하는 기본 컨테이너 */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f9f9f9; /* 필요에 따라 전체 배경색 지정 */
}

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
  align-items: center;
  padding-right: 2rem;
  font-size: 1.3rem;
  font-weight: 700;
  width: 100%;
  min-width: max-content;
  box-sizing: border-box;
}

a {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

/* Nav 우측 프로필 이미지 및 테두리 설정 */
.profile-image {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eba421; /* 테두리 추가 및 두께 조절 부분 */
}

/* 메뉴 호출용 버튼 래퍼 */
.profile-menu-container {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.profile-activator {
  display: flex;
  align-items: center;
  transition: opacity 0.2s;
}

.profile-activator:hover {
  opacity: 0.8;
}

/* 드롭다운 메뉴 스타일 (Vuetify v-card, v-menu 대체) */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  animation: scale-in 0.2s cubic-bezier(0.2, 0, 0, 1);
  transform-origin: top right;
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 구분선 (Vuetify v-divider 대체) */
.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 0;
}

/* 팝업 메뉴 상단 헤더 */
.menu-header {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menu-header:hover {
  background-color: #f5f5f5;
}

/* UserProfileLink 오버라이딩 */
:deep(.app-profile-link) {
  pointer-events: none; /* 자체 링크 클릭 방지, 부모 div 이벤트 사용 */
}

:deep(.app-profile-link .nickname) {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
}

/* 팝업 메뉴 리스트 스타일 */
.menu-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
}

/* 개별 리스트 아이템 스타일 (Vuetify v-list-item 대체) */
.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  gap: 12px;
}

.menu-item:last-child {
  margin-bottom: 0;
}

/* 확실한 Hover 효과 (문제 해결) */
.menu-item:hover {
  background-color: #f5f5f5; /* 이제 검은색이나 투명도 없이 완전한 회색으로 적용됩니다. */
}

/* 아이콘 스타일 */
.item-icon {
  color: #666;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 텍스트 스타일 */
.item-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: #444;
}
</style>
