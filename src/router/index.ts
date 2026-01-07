import { useAuthStore } from "@/stores/auth";
import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

// 라우트 설정에 RouteRecordRaw 타입 적용
const routes: Array<RouteRecordRaw> = [
  {
    name: "Home",
    path: import.meta.env.VITE_APP_HOME as string,
    component: () => import("@/views/HomeForm.vue"),
    meta:{
      requiresAuth: false,
    }
  },
  {
    name: "Login",
    path: import.meta.env.VITE_APP_AUTH_LOGIN as string,
    component: () => import("@/views/auth/login/LoginForm.vue"),
    meta:{
      requiresAuth: false,
    }
  },
  {
    name: "Signup",
    path: import.meta.env.VITE_APP_AUTH_SIGNUP as string,
    component: () => import("@/views/auth/signup/SignupForm.vue"),
    meta:{
      requiresAuth: false,
    }
  },
  {
    name: "Adoption",
    path: import.meta.env.VITE_APP_ADOPTION as string,
    component: () => import("@/views/adoption/AdoptionForm.vue"),
    meta:{
      requiresAuth: false,
    }
  },
  {
    name: "Adoption_write",
    path: import.meta.env.VITE_APP_ADOPTION_WRITE as string,
    component: () => import("@/views/adoption/AdoptionWriteForm.vue"),
    meta: {
      requiresAuth: true,
      // 필요한 경우 roles 추가 예시: roles: ['ROLE_USER']
    },
  },
  {
    name: "Adoption_detail",
    path: import.meta.env.VITE_APP_ADOPTION_DETAIL as string,
    component: () => import("@/views/adoption/AdoptionDetail.vue"),
    meta:{
      requiresAuth: false,
    }
  },
  {
    name: "Profile",
    path: import.meta.env.VITE_APP_PROFILE as string,
    component: () => import("@/views/ProfileForm.vue"),
    meta:{
      requiresAuth: true,
    }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 전역 가드 설정
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // meta 필드 접근 시 타입 안정성을 위해 옵셔널 체이닝 사용 권장
  if (to.meta?.requiresAuth) {
    // 인증 X - 로그인 상태 확인
    authStore.initializeAuth();
    if (!authStore.authenticated) {
      alert("로그인이 필요한 서비스입니다.");
      return next({ name: "Login" });
    }

    // 특정 역할(role) 필요
    // TypeScript에서 to.meta.roles가 배열인지 확인
    const roles = to.meta.roles;
    
    if (Array.isArray(roles) && roles.length > 0) {
      // roles 중 하나라도 만족하면 True
      const hasAuthority = authStore.hasAnyAuthority(roles);
      // 권한 부족
      if (!hasAuthority) {
        alert("권한이 없습니다");
        return next({ name: "Home" });
      }
    }
  }
  next();
});

export default router;