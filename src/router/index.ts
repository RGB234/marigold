import { useAuthStore } from "@/stores/auth";
import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

// 라우트 설정에 RouteRecordRaw 타입 적용
const routes: Array<RouteRecordRaw> = [
  {
    name: "Home",
    path: import.meta.env.VITE_APP_HOME as string,
    component: () => import("@/views/HomeForm.vue"),
  },
  {
    name: "Login",
    path: import.meta.env.VITE_APP_AUTH_LOGIN as string,
    component: () => import("@/views/auth/login/LoginForm.vue"),
  },
  {
    name: "Signup",
    path: import.meta.env.VITE_APP_AUTH_SIGNUP as string,
    component: () => import("@/views/auth/signup/SignupForm.vue"),
  },
  {
    name: "Adoption",
    path: import.meta.env.VITE_APP_ADOPTION as string,
    component: () => import("@/views/adoption/AdoptionForm.vue"),
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
    name: "Profile",
    path: import.meta.env.VITE_APP_PROFILE as string,
    component: () => import("@/views/ProfileForm.vue"),
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
    if (!authStore.isLoggedIn) {
      alert("로그인 필요");
      return next({ name: "Login" });
    }

    // 특정 역할(role) 필요
    // TypeScript에서 to.meta.roles가 배열인지 확인
    const roles = to.meta.roles;
    
    if (Array.isArray(roles) && roles.length > 0) {
      // roles 배열의 요소를 string으로 간주하고 비교
      const hasAuthority = authStore.userAuthorities.some((auth: string) =>
        roles.includes(auth)
      );

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