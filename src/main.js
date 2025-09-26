import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const vuetify = createVuetify({
  components,
  directives,
});

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

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

app.use(router);
app.use(vuetify);
app.mount("#app");
