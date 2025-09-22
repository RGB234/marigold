import { createRouter, createWebHistory } from "vue-router";

// 화면 컴포넌트 불러오기
import HomeForm from "../views/HomeForm.vue";
import LoginForm from "../views/LoginForm.vue";
import AdoptionForm from "@/views/AdoptionForm.vue";
import VolunteerForm from "@/views/VolunteerForm.vue";
import ProfileForm from "@/views/ProfileForm.vue";
import AdoptionWriteForm from "@/views/AdoptionWriteForm.vue";

const routes = [
  { path: process.env.VUE_APP_HOME, component: HomeForm },
  // Login
  { path: process.env.VUE_APP_LOGIN, component: LoginForm },
  // Adoption
  { path: process.env.VUE_APP_ADOPTION, component: AdoptionForm },
  { path: process.env.VUE_APP_ADOPTION_WRITE, component: AdoptionWriteForm },
  // Volunteer
  { path: process.env.VUE_APP_VOLUNTEER, component: VolunteerForm },
  // Profile
  { path: process.env.VUE_APP_PROFILE, component: ProfileForm },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
