<template>
  <button :type="type" :disabled="disabled || pending" :aria-busy="pending">
    <slot v-if="!pending" />
    <slot v-else name="pending">{{ pendingLabel }}</slot>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    pending?: boolean;
    pendingLabel?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    pending: false,
    pendingLabel: "처리 중...",
    disabled: false,
    type: "button",
  },
);
</script>
