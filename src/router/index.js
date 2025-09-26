import { createRouter, createWebHistory } from "vue-router";

// 화면 컴포넌트 불러오기
import HomeForm from "../views/HomeForm.vue";
import LoginForm from "../views/login/LoginForm.vue";
import AdoptionForm from "@/views/adoption/AdoptionForm.vue";
import VolunteerForm from "@/views/VolunteerForm.vue";
import ProfileForm from "@/views/ProfileForm.vue";
import AdoptionWriteForm from "@/views/adoption/AdoptionWriteForm.vue";
import SignupForm from "@/views/signup/SignupForm.vue";
import SignupSubmitForm from "@/views/signup/SignupSubmitForm.vue";
import InstitutionLoginForm from "@/views/login/InstitutionLoginForm.vue";

const routes = [
  { name: "Home", path: process.env.VUE_APP_HOME, component: HomeForm },
  { name: "Login", path: process.env.VUE_APP_LOGIN, component: LoginForm },
  {
    name: "Login_institution",
    path: process.env.VUE_APP_LOGIN_INSTITUTION,
    component: InstitutionLoginForm,
  },
  { name: "Signup", path: process.env.VUE_APP_SIGNUP, component: SignupForm },
  {
    name: "Signup_submit",
    path: process.env.VUE_APP_SIGNUP_SUBMIT,
    component: SignupSubmitForm,
  },
  {
    name: "Adoption",
    path: process.env.VUE_APP_ADOPTION,
    component: AdoptionForm,
  },
  {
    name: "Adoption_write",
    path: process.env.VUE_APP_ADOPTION_WRITE,
    component: AdoptionWriteForm,
    meta: {
      requiresAuth: true,
      roles: ["ROLE_ADMIN", "ROLE_PERSON", "ROLE_INSTITUTION"],
    },
  },
  {
    name: "Volunteer",
    path: process.env.VUE_APP_VOLUNTEER,
    component: VolunteerForm,
  },
  {
    name: "Profile",
    path: process.env.VUE_APP_PROFILE,
    component: ProfileForm,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
