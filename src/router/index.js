import { useAuthStore } from "@/stores/auth";
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    name: "Home",
    path: import.meta.env.VITE_APP_HOME,
    component: () => import("@/views/HomeForm.vue")
  },
  { 
    name: "Login", 
    path: import.meta.env.VITE_APP_AUTH_LOGIN, 
    component: () => import("@/views/auth/login/LoginForm.vue") 
  },
  { name: "Signup", 
    path: import.meta.env.VITE_APP_AUTH_SIGNUP, 
    component: () => import("@/views/auth/signup/SignupForm.vue") 
  },
  {
    name: "Adoption",
    path: import.meta.env.VITE_APP_ADOPTION,
    component: () => import("@/views/adoption/AdoptionForm.vue"),
  },
  {
    name: "Adoption_write",
    path: import.meta.env.VITE_APP_ADOPTION_WRITE,
    component: () => import("@/views/adoption/AdoptionWriteForm.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: "Profile",
    path: import.meta.env.VITE_APP_PROFILE,
    component: () => import("@/views/ProfileForm.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 전역 설정
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // 권한 필요
  if (to.meta.requiresAuth) {
    // 인증 X - 토큰 유효성 검사
    if (!authStore.checkTokenValid()) {
      alert("로그인 필요");
      return next({ name: "Login" });
    }

    // 특정 역할(role) 필요
    if (Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
      const hasAuthority = authStore.userAuthorities.some((auth) =>
        to.meta.roles.includes(auth)
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
