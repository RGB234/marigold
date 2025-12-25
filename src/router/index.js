import { createRouter, createWebHistory } from "vue-router";

// 화면 컴포넌트 불러오기
import HomeForm from "../views/HomeForm.vue";
import LoginForm from "../views/login/LoginForm.vue";
import AdoptionForm from "@/views/adoption/AdoptionForm.vue";
import VolunteerForm from "@/views/VolunteerForm.vue";
import ProfileForm from "@/views/ProfileForm.vue";
import AdoptionWriteForm from "@/views/adoption/AdoptionWriteForm.vue";
import SignupForm from "@/views/signup/SignupForm.vue";
import { useAuthStore } from "@/stores/auth";

const routes = [
  { name: "Home", path: import.meta.env.VITE_APP_HOME, component: HomeForm },
  { name: "Login", path: import.meta.env.VITE_APP_LOGIN, component: LoginForm },
  { name: "Signup", path: import.meta.env.VITE_APP_SIGNUP, component: SignupForm },
  {
    name: "Adoption",
    path: import.meta.env.VITE_APP_ADOPTION,
    component: AdoptionForm,
  },
  {
    name: "Adoption_write",
    path: import.meta.env.VITE_APP_ADOPTION_WRITE,
    component: AdoptionWriteForm,
    meta: {
      requiresAuth: true,
    },
  },
  {
    name: "Volunteer",
    path: import.meta.env.VITE_APP_VOLUNTEER,
    component: VolunteerForm,
  },
  {
    name: "Profile",
    path: import.meta.env.VITE_APP_PROFILE,
    component: ProfileForm,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 전역 설정
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  await authStore.getAuthStatus();
  // 권한 필요
  if (to.meta.requiresAuth) {
    // 인증 X
    if (!authStore.isAuthenticated) {
      alert("로그인 필요");
      return next({ name: "Login" });
    }

    if (Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
      const hasAuthority = authStore.authorities.some((auth) =>
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
