<template>
  <section>
    <div class="writing-wrap">
      <div class="writing-header">
        <h1>입양글 작성</h1>
      </div>
      <div class="writing-content">
        <div class="field">
          <label for="species">종</label>
          <select id="species" v-model="form.species">
            <option :value="species.DOG">개</option>
            <option :value="species.CAT">고양이</option>
            <option :value="species.RODENTS">설치류</option>
            <option :value="species.BIRDS">조류</option>
            <option :value="species.REPTILES">파충류</option>
            <option :value="species.OTHER">기타 외</option>
          </select>
          <!-- 에러 메시지 표시 -->
          <div v-if="errors.species" class="error">{{ errors.species }}</div>
        </div>
        <div class="field">
          <label for="name">이름</label>
          <input type="text" id="name" v-model="form.name" />
          <div v-if="errors.name" class="error">{{ errors.name }}</div>
        </div>
        <div class="field">
          <label for="age">나이</label>
          <input type="number" id="age" v-model="form.age" />
          <div v-if="errors.age" class="error">{{ errors.age }}</div>
        </div>
        <div class="field">
          <label for="sex">성별</label>
          <select id="sex" v-model="form.sex">
            <option :value="sex.FEMALE">암</option>
            <option :value="sex.MALE">수</option>
            <option :value="sex.UNKNOWN">불명(모름)</option>
            <option :value="sex.OTHER">기타</option>
          </select>
          <div v-if="errors.sex" class="error">{{ errors.sex }}</div>
        </div>
        <div class="field">
          <label for="area">위치</label>
          <input type="text" id="area" v-model="form.area" />
          <div v-if="errors.area" class="error">{{ errors.area }}</div>
        </div>
        <div class="field">
          <label for="weight">체중</label>
          <input type="number" id="weight" v-model="form.weight" />
          <div v-if="errors.weight" class="error">{{ errors.weight }}</div>
        </div>
        <div class="field">
          <label for="neutering">중성화 여부</label>
          <select id="neutering" v-model="form.neutering">
            <option :value="neutering.YES">예</option>
            <option :value="neutering.NO">아니오</option>
          </select>
          <div v-if="errors.neutering" class="error">
            {{ errors.neutering }}
          </div>
        </div>
        <div class="field">
          <label for="features">특징</label>
          <input type="text" id="features" v-model="form.features" />
          <div v-if="errors.features" class="error">{{ errors.features }}</div>
        </div>
        <!-- 이미지 업로드 필드 -->
        <div class="field full">
          <label for="images">이미지 (최대 5개)</label>
          <input
            type="file"
            id="images"
            accept="image/*"
            multiple
            @change="handleImageChange"
            class="file-input"
          />
          <div v-if="errors.images" class="error">{{ errors.images }}</div>
          
          <!-- 이미지 미리보기 -->
          <div v-if="imagePreviews.length > 0" class="image-preview-container">
            <div
              v-for="(preview, index) in imagePreviews"
              :key="index"
              class="image-preview"
            >
              <img :src="preview" :alt="`미리보기 ${index + 1}`" />
              <button
                type="button"
                class="remove-image"
                @click="removeImage(index)"
                title="이미지 제거"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- ✅ 버튼 영역 -->
      <div class="btn-row">
        <button type="button" class="button secondary" @click="handleCancel">
          취소
        </button>
        <button type="submit" class="button" @click="handleSubmit">제출</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from "vue";
import api from "@/api";
import { useRouter } from "vue-router";

const species = Object.freeze({
  DOG: "DOG",
  CAT: "CAT",
  RODENTS: "RODENTS",
  BIRDS: "BIRDS",
  REPTILES: "REPTILES",
  FISH: "FISH",
  OTHER: "OTHER",
});

const sex = Object.freeze({
  MALE: "MALE",
  FEMALE: "FEMALE",
  UNKNOWN: "UNKNOWN",
  OTHER: "OTHER",
});

const neutering = Object.freeze({
  YES: "YES",
  NO: "NO",
});

const form = reactive({
  species: "DOG",
  name: "",
  age: 0,
  sex: "UNKNOWN",
  area: "",
  weight: 0,
  neutering: "NO",
  features: "",
  images: [],
});

const errors = reactive({
  species: "",
  name: "",
  age: "",
  sex: "",
  area: "",
  weight: "",
  neutering: "",
  features: "",
  images: "",
});

const router = useRouter();
const imagePreviews = ref([]);

const apiAdoptionCreate = import.meta.env.VITE_API_ADOPTION_CREATE;
const adoptionFormUrl = import.meta.env.VITE_APP_ADOPTION;

// 이미지 파일 변경 핸들러
const handleImageChange = (event) => {
  const files = Array.from(event.target.files);
  
  // 최대 5개 제한
  if (files.length > 5) {
    errors.images = "이미지는 최대 5개까지 업로드 가능합니다.";
    return;
  }
  
  // 각 파일 크기 체크 (5MB 제한)
  const maxSize = 5 * 1024 * 1024; // 5MB
  for (const file of files) {
    if (file.size > maxSize) {
      errors.images = `파일 크기는 최대 5MB까지 가능합니다. (${file.name})`;
      return;
    }
  }
  
  errors.images = "";
  form.images = files;
  
  // 미리보기 생성
  imagePreviews.value = [];
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreviews.value.push(e.target.result);
    };
    reader.readAsDataURL(file);
  });
};

// 이미지 제거
const removeImage = (index) => {
  const newImages = Array.from(form.images);
  newImages.splice(index, 1);
  form.images = newImages;
  imagePreviews.value.splice(index, 1);
  
  // 파일 input 초기화
  const fileInput = document.getElementById("images");
  if (fileInput && newImages.length === 0) {
    fileInput.value = "";
  }
};

const handleSubmit = async () => {
  // 에러 초기화
  Object.keys(errors).forEach((key) => (errors[key] = ""));
  
  // FormData 생성 (파일 업로드를 위해)
  const formData = new FormData();
  
  // 텍스트 필드 추가
  formData.append("species", form.species);
  formData.append("name", form.name);
  formData.append("age", form.age);
  formData.append("sex", form.sex);
  formData.append("area", form.area);
  formData.append("weight", form.weight);
  formData.append("neutering", form.neutering);
  formData.append("features", form.features);
  
  // 이미지 파일 추가
  if (form.images && form.images.length > 0) {
    form.images.forEach((file) => {
      formData.append("images", file);
    });
  }

  try {
    const response = await api.post(apiAdoptionCreate, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    alert("성공");
    router.push(adoptionFormUrl);
  } catch (err) {
    const msg = err.response.data;

    if (msg.species) errors.species = msg.species;
    if (msg.name) errors.name = msg.name;
    if (msg.age) errors.age = msg.age;
    if (msg.sex) errors.sex = msg.sex;
    if (msg.area) errors.area = msg.area;
    if (msg.weight) errors.weight = msg.weight;
    if (msg.neutering) errors.neutering = msg.neutering;
    if (msg.features) errors.features = msg.features;
    if (msg.images) errors.images = msg.images;
  }
};

const handleCancel = () => {
  router.push(adoptionFormUrl);
};
</script>

<style lang="css">
/* 색상 변수 */
:root {
  --bg: #fbfdff;
  --card: #ffffff;
  --muted: #6b7280;
  --accent: #eaa221;
  --accent-dark: #d08a11;
  --border: #e6e9ee;
  --shadow: 0 6px 18px rgba(20, 24, 36, 0.06);
  --radius: 12px;
  --gap: 16px;
}

/* 전체 섹션 여백 */
section {
  padding: 28px 16px;
  background: linear-gradient(180deg, var(--bg), #f6f8fb);
  font-family: Inter, "Noto Sans KR", system-ui, -apple-system, "Segoe UI",
    Roboto, "Helvetica Neue", Arial;
  color: #111827;
}

/* 카드 컨테이너 */
.writing-wrap {
  max-width: 920px;
  margin: 0 auto;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 22px;
}

/* 헤더 */
.writing-header h1 {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

/* 콘텐츠 그리드: 반응형 (2열 -> 1열) */
.writing-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: calc(var(--gap) * 1.25);
  align-items: start;
}

/* 각 필드 스타일 */
.field {
  display: flex;
  flex-direction: column;
}

/* 라벨 */
.field label {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 8px;
  font-weight: 600;
}

/* 공통 입력/셀렉트 스타일 */
.field input[type="text"],
.field input[type="number"],
.field select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #ffffff;
  transition: box-shadow 0.15s ease, border-color 0.15s ease,
    transform 0.08s ease;
  outline: none;
}

/* placeholder 가독성 */
.field input::placeholder {
  color: #9aa3b2;
}

/* 포커스 상태 */
.field input:focus,
.field select:focus {
  border-color: var(--accent);
  box-shadow: 0 6px 18px rgba(234, 162, 33, 0.12);
  transform: translateY(-1px);
}

/* select 화살표 조금 패딩 맞춤(브라우저별 약간 다름) */
.field select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%),
    linear-gradient(135deg, var(--muted) 50%, transparent 50%);
  background-position: calc(100% - 18px) calc(1em + 2px),
    calc(100% - 13px) calc(1em + 2px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
  padding-right: 36px;
}

/* 숫자 input에서 화살표 숨기기(Chrome, Edge, Firefox) */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

/* 한 줄로 표시하고 싶은 라벨+필드 조합(예: 전체 너비로 쓰기) */
.writing-content .full {
  grid-column: 1 / -1;
}

/* 작은 화면일 때 1열로 */
@media (max-width: 720px) {
  .writing-wrap {
    padding: 18px;
  }
  .writing-content {
    grid-template-columns: 1fr;
  }
}

/* 버튼 스타일(참고용) */
.btn-row {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 18px;
  grid-column: 1 / -1;
}
.button {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  background: var(--accent);
  color: white;
  box-shadow: 0 6px 12px rgba(208, 138, 17, 0.12);
  transition: transform 0.08s ease, filter 0.12s ease;
}
.button.secondary {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  box-shadow: none;
}
.button:active {
  transform: translateY(1px) scale(0.998);
}
.button:hover {
  filter: brightness(0.98);
}

/* 입력 설명 / 오류 텍스트 (있을 경우) */
.field .help {
  margin-top: 6px;
  font-size: 12px;
  color: #8b949e;
}
.field .error {
  margin-top: 6px;
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
}

/* 파일 입력 스타일 */
.file-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 2px dashed var(--border);
  border-radius: 8px;
  background: #fafbfc;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.file-input:hover {
  border-color: var(--accent);
  background: #fff9f0;
}

.file-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 4px 12px rgba(234, 162, 33, 0.1);
}

/* 이미지 미리보기 컨테이너 */
.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

/* 개별 이미지 미리보기 */
.image-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s ease;
}

.image-preview:hover {
  transform: scale(1.02);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 이미지 제거 버튼 */
.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.1s ease;
}

.remove-image:hover {
  background: rgba(220, 38, 38, 1);
  transform: scale(1.1);
}

.remove-image:active {
  transform: scale(0.95);
}
</style>
