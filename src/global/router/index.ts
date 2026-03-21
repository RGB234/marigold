import { useAuthStore } from "@/auth/stores/auth";
import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useAlert } from "@/global/composables/useAlert";
import { RouteNames } from "./routeHelper";

// 라우트 설정에 RouteRecordRaw 타입 적용
const routes: Array<RouteRecordRaw> = [
  {
    name: RouteNames.HOME,
    path: "/",
    component: () => import("@/adoption/views/AdoptionPostListView.vue"),
    meta: {
      requiresAuth: false,
    },
  },
  {
    name: RouteNames.AUTH.CALLBACK,
    path: "/auth/callback",
    component: () => import("@/auth/views/AuthCallbackView.vue"),
    meta: {
      requiresAuth: false,
    },
  },
  {
    name: RouteNames.ADOPTION.LIST,
    path: "/adoption",
    component: () => import("@/adoption/views/AdoptionPostListView.vue"),
    meta: {
      requiresAuth: false,
    },
  },
  {
    name: RouteNames.AUTH.LOGIN,
    path: "/auth/login",
    component: () => import("@/auth/views/LoginView.vue"),
    meta: {
      requiresAuth: false,
    },
  },
  {
    name: RouteNames.AUTH.SIGNUP,
    path: "/auth/signup",
    component: () => import("@/auth/views/SignupView.vue"),
    meta: {
      requiresAuth: false,
    },
  },
  {
    name: RouteNames.AUTH.EMAIL_SIGNUP,
    path: "/auth/signup/email",
    component: () => import("@/auth/views/EmailSignupView.vue"),
    meta: {
      requiresAuth: false,
    },
  },
  {
    name: RouteNames.ADOPTION.WRITE,
    path: "/adoption/write",
    component: () => import("@/adoption/views/AdoptionPostWriteView.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: RouteNames.ADOPTION.DETAIL,
    path: "/adoption/:id",
    component: () => import("@/adoption/views/AdoptionPostDetailView.vue"),
    meta: {
      requiresAuth: false,
    },
  },
  {
    name: RouteNames.ADOPTION.EDIT,
    path: "/adoption/:id/edit",
    component: () => import("@/adoption/views/AdoptionPostEditView.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: RouteNames.USER.MY_PROFILE,
    path: "/profile",
    component: () => import("@/user/views/ProfileView.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: RouteNames.USER.PROFILE,
    path: "/profile/:id",
    component: () => import("@/user/views/ProfileView.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: RouteNames.USER.PROFILE_EDIT,
    path: "/profile/edit",
    component: () => import("@/user/views/ProfileEditView.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: RouteNames.ADOPTION.HISTORY,
    path: "/profile/history/:userId",
    component: () => import("@/adoption/views/UserAdoptionPostListView.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: RouteNames.CHAT.MY_LIST,
    path: "/chat",
    component: () => import("@/chat/views/MyChatRoomListView.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: RouteNames.CHAT.ROOM,
    path: "/chat/:roomId",
    component: () => import("@/chat/views/ChatRoomView.vue"),
    meta: {
      requiresAuth: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 전역 가드 설정
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  const { alert } = useAlert();

  if (to.meta?.requiresAuth) {
    await authStore.initializeAuth();
    if (!authStore.isLoggedIn) {
      if (await alert("Error", "로그인이 필요한 서비스입니다.")) {
        return next({ name: RouteNames.AUTH.LOGIN });
      }
    }

    const roles = to.meta.roles;

    if (Array.isArray(roles) && roles.length > 0) {
      const hasAuthority = authStore.hasAnyAuthority(roles);
      if (!hasAuthority) {
        if (await alert("Error", "권한이 없습니다")) {
          return next({ name: RouteNames.HOME });
        }
      }
    }
  }
  next();
});

export default router;
