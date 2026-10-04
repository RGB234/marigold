<template>
  <svg
    class="app-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="paths[name]" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
import {
  mdiChatOutline,
  mdiClose,
  mdiCogOutline,
  mdiDownload,
  mdiFileOutline,
  mdiHeartOutline,
  mdiLogout,
  mdiPencilBoxOutline,
} from "@mdi/js";

const paths = {
  chat: mdiChatOutline,
  close: mdiClose,
  cog: mdiCogOutline,
  download: mdiDownload,
  file: mdiFileOutline,
  heart: mdiHeartOutline,
  logout: mdiLogout,
  pencil: mdiPencilBoxOutline,
} as const;

defineProps<{ name: keyof typeof paths }>();
</script>

<style scoped>
.app-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}
</style>
