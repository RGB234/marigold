import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./global/router";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "./main.css"; // 최하단에서 import


import LoadingOverlay from "@/global/components/LoadingOverlay.vue";
import GlobalAlert from "@/global/components/GlobalAlert.vue";


const vuetify = createVuetify({
  components,
  directives,
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify);

app.component('LoadingOverlay', LoadingOverlay);
app.component('GlobalAlert', GlobalAlert);
app.mount("#app");
