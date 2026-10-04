import { createApp } from "vue";
import { createPinia } from "pinia";
import { useAuthStore } from "@/auth/stores/auth";
import apiClient from "@/global/apiClient";
import { installApiInterceptors } from "@/global/installApiInterceptors";
import App from "./App.vue";
import router from "./global/router";
import { createVuetify } from "vuetify";
import "vuetify/styles";
import "./main.css"; // 최하단에서 import


import LoadingOverlay from "@/global/components/LoadingOverlay.vue";
import GlobalAlert from "@/global/components/GlobalAlert.vue";
import { logger } from "@/global/logger";


const vuetify = createVuetify();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
const authStore = useAuthStore(pinia);
installApiInterceptors(apiClient, authStore);
app.use(router);
app.use(vuetify);

app.config.errorHandler = (error, _instance, info) => {
  logger.error(`[Vue Error] info=${info}`, error);
};

router.onError((error, to) => {
  logger.error(`[Router Error] target=${to.fullPath}`, error);
});

app.component('LoadingOverlay', LoadingOverlay);
app.component('GlobalAlert', GlobalAlert);
app.mount("#app");
