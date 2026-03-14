<template>
  <section>
    <div class="writing-wrap">
      <div class="writing-header">
        <h1>입양글 작성</h1>
      </div>
      <div class="writing-content">
        <div class="field">
          <label for="species" class="required">종</label>
          <select id="species" v-model="form.species">
            <option :value="Species.DOG">개</option>
            <option :value="Species.CAT">고양이</option>
            <option :value="Species.RODENTS">설치류</option>
            <option :value="Species.BIRDS">조류</option>
            <option :value="Species.REPTILES">파충류</option>
            <option :value="Species.OTHER">기타 외</option>
          </select>
          <!-- 에러 메시지 표시 -->
          <div v-if="errors.species" class="error">{{ errors.species }}</div>
        </div>
        <div class="field">
          <label for="title" class="required">제목</label>
          <input type="text" id="title" v-model="form.title" />
          <div v-if="errors.title" class="error">{{ errors.title }}</div>
        </div>
        <div class="field">
          <label for="age" class="required">나이</label>
          <input type="number" id="age" v-model="form.age" />
          <div v-if="errors.age" class="error">{{ errors.age }}</div>
        </div>
        <div class="field">
          <label for="sex" class="required">성별</label>
          <select id="sex" v-model="form.sex">
            <option :value="Sex.FEMALE">암</option>
            <option :value="Sex.MALE">수</option>
            <option :value="Sex.UNKNOWN">불명(모름)</option>
            <option :value="Sex.OTHER">기타</option>
          </select>
          <div v-if="errors.sex" class="error">{{ errors.sex }}</div>
        </div>
        <div class="field">
          <label for="area" class="required">위치</label>
          <input type="text" id="area" v-model="form.area" />
          <div v-if="errors.area" class="error">{{ errors.area }}</div>
        </div>
        <div class="field">
          <label for="weight" class="required">체중</label>
          <input type="number" id="weight" v-model="form.weight" />
          <div v-if="errors.weight" class="error">{{ errors.weight }}</div>
        </div>
        <div class="field">
          <label for="neutering" class="required">중성화 여부</label>
          <select id="neutering" v-model="form.neutering">
            <option :value="Neutering.YES">예</option>
            <option :value="Neutering.NO">아니오</option>
            <option :value="Neutering.UNKNOWN">불명</option>
          </select>
          <div v-if="errors.neutering" class="error">
            {{ errors.neutering }}
          </div>
        </div>
        <div class="field full">
          <label for="features" class="required">특징</label>
          <textarea id="features" v-model="form.features" rows="4"></textarea>
          <div v-if="errors.features" class="error">{{ errors.features }}</div>
        </div>
        <!-- 이미지 업로드 필드 -->
        <div class="field full">
          <span class="required field-label">이미지 (최대 {{ MAX_IMAGE_COUNT }}개)</span>
          <input
            type="file"
            id="images"
            accept="image/*"
            multiple
            @change="handleImageChange"
            class="file-input-hidden"
            ref="fileInputRef"
          />
          <div class="image-upload-area">
            <div class="image-preview-container">
              <!-- 이미지 미리보기 -->
              <div
                v-if="imagePreviews.length < MAX_IMAGE_COUNT"
                v-for="(preview, index) in imagePreviews"
                :key="index"
                class="image-preview"
              >
                <img
                  :src="preview"
                  :alt="`미리보기 ${index + 1}`"
                  @click="openLightbox(index)"
                />
                <button
                  type="button"
                  class="remove-image"
                  @click="removeImage(index)"
                  title="이미지 제거"
                >×</button>
              </div>
              <!-- 추가 버튼  -->
              <label
                
                for="images"
                class="image-add-btn"
                title="이미지 추가"
              >
                <span class="image-add-icon">+</span>
                <span class="image-add-text">{{ imagePreviews.length === 0 ? '이미지 추가' : '' }}</span>
              </label>
            </div>
          </div>
          <div v-if="errors.images" class="error">{{ errors.images }}</div>
        </div>

        <!-- 이미지 팝업 뷰어 -->
        <Teleport to="body">
          <div v-if="lightboxIndex !== null" class="lightbox-overlay" @click.self="closeLightbox">
            <button type="button" class="lightbox-close" @click="closeLightbox">×</button>
            <img :src="imagePreviews[lightboxIndex]" class="lightbox-img" :alt="`이미지 ${lightboxIndex + 1}`" />
          </div>
        </Teleport>
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

<script setup lang="ts">
import { reactive, ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { createAdoption } from "@/adoption/api/adoption.api";
import { Species } from "@/global/enums/Species";
import { Sex } from "@/global/enums/Sex";
import { Neutering } from "@/global/enums/Neutering";
import { convertToFormData } from "@/global/utils/objectUtils";
import { isApiResponse } from "@/global/types/apiResponse";
import { ErrorDetail } from "@/global/types/common";
import { useAlert } from "@/global/composables/useAlert";

const MAX_IMAGE_COUNT = Number(import.meta.env.VITE_MAX_IMAGE_COUNT);
const MIN_IMAGE_COUNT = Number(import.meta.env.VITE_MIN_IMAGE_COUNT);
const MAX_FILE_SIZE = Number(import.meta.env.VITE_MAX_FILE_SIZE);

interface AdoptionForm {
  species: Species | string;
  title: string;
  age: number;
  sex: Sex | string;
  area: string;
  weight: number;
  neutering: Neutering | string;
  features: string;
  images: File[];
}

const form = reactive<AdoptionForm>({
  species: "DOG",
  title: "",
  age: 0,
  sex: "UNKNOWN",
  area: "",
  weight: 0,
  neutering: "NO",
  features: "",
  images: [],
});

const errors = reactive<Record<keyof AdoptionForm, string>>({
  species: "",
  title: "",
  age: "",
  sex: "",
  area: "",
  weight: "",
  neutering: "",
  features: "",
  images: "",
});


const router = useRouter();
const imagePreviews = ref<string[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);
const lightboxIndex = ref<number | null>(null);
const { toast } = useAlert();

const openLightbox = (index: number) => { lightboxIndex.value = index; };
const closeLightbox = () => { lightboxIndex.value = null; };

// 이미지 파일 변경 핸들러
const handleImageChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files) return;

  const newFiles = Array.from(target.files);
  const currentImages = Array.from(form.images || []);

  // 각 파일 크기 체크 (5MB 제한)
  const maxSize = MAX_FILE_SIZE;
  for (const file of newFiles) {
    if (file.size > maxSize) {
      errors.images = `파일 크기는 최대 ${MAX_FILE_SIZE}MB까지 가능합니다. (${file.name})`;
      if (fileInputRef.value) fileInputRef.value.value = "";
      return;
    }
  }

  const merged = [...currentImages, ...newFiles];
  if (merged.length > MAX_IMAGE_COUNT || merged.length < MIN_IMAGE_COUNT) {
    errors.images = `이미지는 최소 ${MIN_IMAGE_COUNT}개, 최대 ${MAX_IMAGE_COUNT}개까지 업로드 가능합니다.`;
    if (fileInputRef.value) fileInputRef.value.value = "";
    return;
  }

  errors.images = "";
  form.images = merged;

  // 신규 파일 미리보기 추가
  newFiles.forEach((file) => {
    imagePreviews.value.push(URL.createObjectURL(file));
  });

  if (fileInputRef.value) fileInputRef.value.value = "";
};

// 이미지 제거
const removeImage = (index: number) => {
  const urlToRemove = imagePreviews.value[index];
  if (urlToRemove && urlToRemove.startsWith('blob:')) {
    URL.revokeObjectURL(urlToRemove);
  }

  const newImages = Array.from(form.images);
  newImages.splice(index, 1);
  form.images = newImages;
  imagePreviews.value.splice(index, 1);
  if (lightboxIndex.value !== null) closeLightbox();
};

onUnmounted(() => {
  imagePreviews.value.forEach((url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
});

const handleSubmit = async () => {
  // 에러 초기화
  Object.keys(errors).forEach((key) => (errors[key as keyof AdoptionForm] = ""));
  
  const formData = convertToFormData({ ...form }) as FormData;
  
  try {
    const response = await createAdoption(formData);
    const createdPostId = response.data?.id;
    toast.success("입양글 작성이 완료되었습니다.");
    router.push({ name: 'Adoption_detail', params: { id: createdPostId } });
  } catch (err: any) {
    if(isApiResponse(err)){
      if(err.errors && Array.isArray(err.errors)){
        err.errors.forEach((error: ErrorDetail) => {
          errors[error.field as keyof AdoptionForm] = error.message;
        });
      }
    }else{
      console.error("입양글 작성 중 오류 발생:", err);
    }
  }
};

const handleCancel = () => {
  router.push({name: 'Adoption_list'});
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
.field label,
.field .field-label {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 8px;
  font-weight: 600;
}

/* 필수 입력 필드 라벨 */
.field label.required::after {
  content: " *";
  color: #dc2626;
  font-weight: 700;
}

/* 공통 입력/셀렉트 스타일 */
.field input[type="text"],
.field input[type="number"],
.field select,
.field textarea {
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

/* textarea 세로 크기 조절만 허용 */
.field textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  line-height: 1.5;
}

/* 포커스 상태 */
.field input:focus,
.field select:focus,
.field textarea:focus {
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
.field .error {
  margin-top: 6px;
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
}

/* 숨겨진 파일 input */
.file-input-hidden {
  display: none;
}

/* 이미지 업로드 영역 */
.image-upload-area {
  margin-top: 4px;
}

/* 이미지 미리보기 + 추가 버튼 컨테이너 */
.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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
  flex-shrink: 0;
}

.image-preview:hover {
  transform: scale(1.02);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
  display: block;
}

/* 이미지 제거 버튼 */
.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.1s ease;
  z-index: 1;
}

.remove-image:hover {
  background: rgba(220, 38, 38, 1);
  transform: scale(1.1);
}

.remove-image:active {
  transform: scale(0.95);
}

/* 이미지 추가 버튼 */
.image-add-btn {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  border: 2px dashed var(--border);
  background: #fafbfc;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: border-color 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
  user-select: none;
}

.image-add-btn:hover {
  border-color: var(--accent);
  background: #fff9f0;
}

.image-add-icon {
  font-size: 28px;
  line-height: 1;
  color: var(--muted);
}

.image-add-text {
  font-size: 11px;
  color: var(--muted);
}

/* 라이트박스 오버레이 */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 85vh;
  border-radius: 10px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  object-fit: contain;
}

.lightbox-close {
  position: fixed;
  top: 18px;
  right: 22px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 22px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
  z-index: 10000;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
