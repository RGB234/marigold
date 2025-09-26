<template>
  <div id="wrap">
    <div id="header"></div>
    <div id="body">
      <div class="login_wrap">
        <form class="login_form" @submit.prevent="handleSubmit">
          <div class="input_item email">
            <input
              type="text"
              id="email"
              aria-label="이메일"
              v-model="form.email"
            />
            <label for="email" id="email_label">이메일</label>
          </div>

          <div class="input_item password">
            <input
              type="password"
              id="password"
              aria-label="비밀번호"
              v-model="form.password"
            />
            <label for="password" id="password_label">비밀번호</label>
          </div>

          <div class="btn_login_wrap">
            <button type="submit">
              <span class="btn_text" @click="handleSubmit">로그인 버튼</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    <div id="footer"></div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import api from "@/api";
import { useRouter } from "vue-router";

const form = reactive({
  username: "",
  password: "",
});

const apiLoginInst = process.env.VUE_APP_API_AUTH_LOGIN_INSTITUTION;
const homeUrl = process.env.VUE_APP_HOME;

const router = useRouter();

const handleSubmit = async () => {
  // const payload = { ...form };
  const formData = new URLSearchParams();
  formData.append("username", form.email); // Spring Security는 username 필드 사용
  formData.append("password", form.password);
  try {
    const response = api.post(apiLoginInst, formData, {
      withCredentials: true,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    console.log(response);
    router.push(homeUrl);
  } catch (err) {
    alert("로그인 실패");
    console.error(err);
  }
};
</script>

<style>
/* 전체 레이아웃 */
#wrap {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: "Noto Sans KR", sans-serif;
}

#header,
#footer {
  height: 60px;
  background-color: #f5f5f5;
}

#body {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
}

/* 로그인 폼 래퍼 */
.login_wrap {
  background: #ffffff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 360px;
}

/* 로그인 폼 */
.login_form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 인풋 항목 */
.input_item {
  position: relative;
}

.input_item input {
  width: 100%;
  padding: 12px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border 0.2s;
}

.input_item input:focus {
  border-color: #4a90e2;
}

/* 라벨 */
.input_item label {
  position: absolute;
  left: 12px;
  top: 12px;
  color: #aaa;
  font-size: 14px;
  pointer-events: none;
  transition: 0.2s all;
}

/* 포커스 시 라벨 이동 */
.input_item input:focus + label,
.input_item input:not(:placeholder-shown) + label,
.input_item input[value]:not([value=""]) + label {
  top: -8px;
  left: 8px;
  font-size: 12px;
  background: #fff;
  padding: 0 4px;
  color: #4a90e2;
}

/* 로그인 버튼 */
.btn_login_wrap {
  margin-top: 20px;
}

.btn_login_wrap button {
  width: 100%;
  padding: 12px 0;
  border: none;
  border-radius: 6px;
  background-color: #4a90e2;
  cursor: pointer;
  transition: background 0.2s;
}

.btn_login_wrap button:hover {
  background-color: #357ab8;
}

.btn_login_wrap .btn_text {
  color: #fff;
  font-weight: bold;
  font-size: 16px;
}
</style>
