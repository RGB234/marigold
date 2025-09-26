<template>
  <v-container align="center">
    <v-card max-width="480px">
      <v-card-item>
        <!-- Vuetify v-form 대신 vee-validate Form 생략 가능 -->
        <v-form @submit.prevent="onSubmit">
          <v-text-field
            v-model="email"
            label="이메일"
            :error-messages="emailError"
          />
          <v-text-field
            v-model="password"
            label="비밀번호"
            :error-messages="passwordError"
          />
          <v-text-field
            v-model="confirmPassword"
            label="비밀번호 확인"
            :error-messages="confirmPasswordError"
          />
          <v-text-field
            v-model="companyName"
            label="회사(기관)명"
            :error-messages="companyNameError"
          />
          <v-text-field
            v-model="repName"
            label="대표자 성함"
            :error-messages="repNameError"
          />
          <v-text-field
            v-model="brn"
            label="사업자 등록번호"
            :error-messages="brnError"
            type="number"
          />
          <v-text-field
            v-model="zipCode"
            label="우편번호"
            :error-messages="zipCodeError"
            type="number"
          />
          <v-text-field
            v-model="address"
            label="주소"
            :error-messages="addressError"
          />
          <v-text-field
            v-model="detailedAddress"
            label="상세주소"
            :error-messages="detailedAddressError"
          />
          <v-btn type="submit">제출</v-btn>
        </v-form>
      </v-card-item>
    </v-card>
  </v-container>
</template>

<script setup>
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import api from "@/api";

const schema = yup.object({
  email: yup
    .string()
    .email("유효한 이메일 형식이 아닙니다")
    .required("이메일을 입력해주세요"),
  password: yup
    .string()
    .matches(
      /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/,
      "영문자와 숫자, 특수문자(!@#$%^&*)를 포함한 8자리 이상"
    )
    .required("비밀번호를 입력해주세요"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "비밀번호가 일치하지 않습니다")
    .required("확인을 위해 비밀번호를 다시 한 번 입력해주세요"),
  companyName: yup.string().required("회사명을 입력해주세요"),
  repName: yup.string().required("대표자 성함을 입력해주세요"),
  brn: yup
    .string()
    .matches(
      /^\d{10}$/,
      "하이픈(-)없이 사업자 등록번호 10자리를 입력해야 합니다"
    )
    .required("사업자 등록번호를 입력해주세요"),
  zipCode: yup
    .string()
    .matches(/^\d{5}$/, "우편번호는 5자리 숫자여야합니다")
    .required("우편번호를 입력해주세요"),
  address: yup.string().required("주소를 입력해주세요"),
  detailedAddress: yup.string().required("상세주소를 입력해주세요"),
});

const { handleSubmit } = useForm({
  validationSchema: schema,
});

const { value: email, errorMessage: emailError } = useField("email");
const { value: password, errorMessage: passwordError } = useField("password");
const { value: confirmPassword, errorMessage: confirmPasswordError } =
  useField("confirmPassword");
const { value: companyName, errorMessage: companyNameError } =
  useField("companyName");
const { value: repName, errorMessage: repNameError } = useField("repName");
const { value: brn, errorMessage: brnError } = useField("brn");
const { value: zipCode, errorMessage: zipCodeError } = useField("zipCode");
const { value: address, errorMessage: addressError } = useField("address");
const { value: detailedAddress, errorMessage: detailedAddressError } =
  useField("detailedAddress");

const apiCreateUser = process.env.VUE_APP_API_USER_CREATE_INSTITUTION;
const onSubmit = handleSubmit(async (values) => {
  values.brn = values.brn.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");
  const payload = { ...values };
  try {
    await api.post(apiCreateUser, payload);
    alert("성공");
  } catch (err) {
    alert("실패: \n" + err);
  }
});
</script>

<style scoped></style>
