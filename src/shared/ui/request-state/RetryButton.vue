<template>
  <button type="button" class="retry-button">
    <slot>다시 시도</slot>
  </button>
</template>

<style scoped>
.retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
  min-height: 36px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #ff9800;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #f57c00;
}

.retry-button:focus-visible {
  outline: 3px solid rgba(255, 152, 0, 0.35);
  outline-offset: 2px;
}

.retry-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
