<script setup>
// 별도의 로직이 없다면 script 부분은 비워두거나 생략해도 됩니다.
</script>

<template>
    <div class="loading-overlay">
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>
                <slot>처리 중입니다...</slot>
            </p>
        </div>
    </div>
</template>

<style scoped>
/* 스타일을 여기에 정의하여 컴포넌트가 스타일을 가지고 다니게 합니다 */
.loading-overlay {
    position: fixed;
    /* 혹은 absolute, 부모 기준에 따라 다름 */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.spinner {
    /* 스피너 CSS 예시 */
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>