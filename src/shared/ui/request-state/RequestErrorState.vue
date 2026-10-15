<template>
  <div class="request-error-state" role="alert">
    <p>{{ message }}</p>
    <RetryButton v-if="retryable" :disabled="retrying" @click="$emit('retry')">
      {{ retrying ? "다시 시도 중..." : "다시 시도" }}
    </RetryButton>
  </div>
</template>

<script setup lang="ts">
import RetryButton from "@/shared/ui/request-state/RetryButton.vue";

withDefaults(
  defineProps<{
    message: string;
    retryable?: boolean;
    retrying?: boolean;
  }>(),
  {
    retryable: true,
    retrying: false,
  },
);

defineEmits<{
  retry: [];
}>();
</script>

<style scoped>
.request-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 16px;
  color: #666;
  text-align: center;
}

.request-error-state p {
  margin: 0;
}
</style>
