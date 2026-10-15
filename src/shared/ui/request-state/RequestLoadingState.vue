<template>
  <div class="request-loading-state" role="status" aria-live="polite">
    <span class="request-loading-state__spinner" aria-hidden="true" />
    <p><slot>{{ message }}</slot></p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string }>(), {
  message: "불러오는 중입니다...",
});
</script>

<style scoped>
.request-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 16px;
  color: #777;
  text-align: center;
}

.request-loading-state p {
  margin: 0;
}

.request-loading-state__spinner {
  width: 32px;
  height: 32px;
  border: 4px solid #eee;
  border-top-color: #ff9800;
  border-radius: 50%;
  animation: request-state-spin 0.8s linear infinite;
}

@keyframes request-state-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
