<template>
  <v-snackbar
    v-model="store.show"
    :color="store.color"
    :timeout="store.timeout"
    location="top middle"
    rounded="pill"
  >
    {{ store.text }}

    <template #actions>
      <v-btn color="white" variant="text" icon size="small" @click="store.show = false">
        <AppIcon name="close" />
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import AppIcon from "@/global/components/AppIcon.vue";
import { useToastStore } from "@/app/feedback/toast/toast.store";

const store = useToastStore();
</script>
