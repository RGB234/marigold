import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import { useAuthStore } from "@/auth/stores/auth";
import { useUserStore } from "@/user/stores/user";
import apiClient from "@/shared/http/client";
import { installHttpClient } from "@/app/bootstrap/installHttpClient";
import App from "@/app/App.vue";
import router from "@/app/router";
import { RouteHelper } from "@/shared/navigation/routeHelper";
import { createVuetify } from "vuetify";
import "vuetify/styles";
import "./main.css"; // 최하단에서 import


import { logger } from "@/shared/lib/logger";


const vuetify = createVuetify();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
const authStore = useAuthStore(pinia);
const userStore = useUserStore(pinia);

watch(
  () => authStore.userId,
  (userId) => {
    if (!userId) {
      userStore.clearCurrentUser();
      return;
    }

    void userStore.loadCurrentUser(userId).catch((error) => {
      logger.error("[User Profile] Failed to synchronize the current user", error);
    });
  },
  { immediate: true, flush: "sync" },
);

watch(
  () => authStore.phase,
  (phase) => {
    if (phase === "anonymous" && router.currentRoute.value.meta.requiresAuth) {
      void router.push(RouteHelper.auth.login());
    }
  },
);

installHttpClient(apiClient, authStore);
app.use(router);
app.use(vuetify);

app.config.errorHandler = (error, _instance, info) => {
  logger.error(`[Vue Error] info=${info}`, error);
};

router.onError((error, to) => {
  logger.error(`[Router Error] target=${to.fullPath}`, error);
});

app.mount("#app");
