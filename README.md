# Marigold Frontend

Marigold의 입양 게시글, 사용자 인증·프로필, 실시간 채팅을 제공하는 Vue 기반 SPA입니다. 기능별 코드는 도메인 디렉터리에 두고, 애플리케이션 조립·초기화·라우팅은 `app`, 도메인에 의존하지 않는 HTTP·오류·피드백·UI·검증 코드는 `shared`에서 관리합니다.

## 1. 기술 스택

- Vue 3, Vite, TypeScript
- Pinia, Vue Router, Vuetify
- Axios
- SockJS, STOMP
- Vitest, Vue Test Utils, Playwright
- Cloudflare Vite Plugin, Wrangler

의존성 범위는 `package.json`, 실제 설치 버전은 `package-lock.json`을 기준으로 합니다. Node.js 22.12 이상을 권장합니다.

## 2. 로컬 실행과 주요 명령어

`.env.example`을 `.env.local`로 복사하고 백엔드 주소를 확인한 뒤 실행합니다. 기본 설정은 백엔드가 `http://localhost:8080`에서 실행 중인 환경을 기준으로 하며, 백엔드 설정은 [백엔드 README](../back/README.md)를 참고합니다.

```bash
npm ci
npm run dev
```

개발 서버의 기본 주소는 `http://localhost:8000`입니다. 처음 E2E 테스트를 실행하는 환경에서는 `npx playwright install chromium`으로 브라우저를 설치합니다.

| 명령어 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run test:unit -- --run` | 단위 테스트 1회 실행 |
| `npm run test:e2e` | Playwright E2E 테스트 실행 |
| `npm run build:dev` | 개발 환경 빌드 |
| `npm run build:prod` | 운영 환경 빌드 |
| `npm run check:env` | `.env.example` 선언과 소스의 환경변수 참조 일치 여부 확인 |
| `npm run preview` | 개발 빌드 후 Wrangler로 로컬 미리보기 |
| `npm run check:validation-policy` | 백엔드와 검증 정책이 동기화되었는지 확인 |
| `npm run sync:validation-policy` | 백엔드의 검증 정책을 프론트엔드로 복사 |
| `npm run deploy` | 운영 빌드 후 Wrangler로 배포 |

`npm run deploy`를 실행하려면 대상 Cloudflare 계정에 대한 Wrangler 인증이 필요합니다.

### 검증 정책 동기화

검증 정책은 백엔드의 `ValidationPolicy.java`를 원본으로 관리합니다.

1. `back`에서 `./gradlew generateValidationPolicy`를 실행하여 `back/src/main/resources/validation-policy.json`을 생성합니다.
2. `front`에서 `npm run sync:validation-policy`를 실행하여 `front/src/shared/validation/validation-policy.json`을 갱신합니다.

기본 스크립트는 저장소 루트에 `back`과 `front`가 함께 있는 구조를 기준으로 합니다. 원본 JSON의 위치가 다르면 스크립트를 수정하는 대신 `VALIDATION_POLICY_SOURCE` 환경변수로 경로를 지정합니다.

## 3. 주요 디렉터리와 역할

```text
src/
  adoption/  입양 게시글과 댓글
  auth/      로그인, 회원가입, 인증 상태 복구
  chat/      채팅방, 메시지, 첨부 파일, 실시간 연결
  user/      프로필과 보안 설정
  app/       애플리케이션 셸, 초기화, 라우터
  shared/    HTTP, 오류, 피드백, 내비게이션, UI, 검증, 공통 유틸리티·타입
  assets/    이미지와 폰트
```

애플리케이션 수준의 조립 코드는 `app`, 특정 도메인에 의존하지 않고 여러 기능에서 재사용하는 기반 코드는 `shared`에 둡니다. `shared`는 `app`이나 특정 도메인에 의존하지 않습니다. 도메인 간 협력이 필요한 화면에서는 다른 도메인의 모듈을 직접 사용합니다.

## 4. 애플리케이션 구조

main.js에서 `app`과 Pinia를 구성합니다.

`app`은 애플리케이션 초기화와 라우팅, 공통 화면 구성을 담당합니다.

Pinia는 클라이언트 인증 상태, 현재 사용자 정보, dialog와 toast 상태를 관리합니다.

### 라우팅과 접근 제어

라우터는 로그인 여부, 역할 기반 권한, 최근 본인 인증 여부에 따른 접근 제어를 지원합니다.

- `requiresAuth`: 로그인한 사용자만 접근할 수 있습니다.
- `roles`: 라우트에 지정하면 해당 권한 중 하나를 가진 사용자만 접근할 수 있습니다. 현재 이 메타데이터를 적용한 라우트는 없습니다.
- `requiresRecentAuth`: 최근에 본인 인증을 완료한 사용자만 접근할 수 있습니다.

`requiresRecentAuth`의 프론트엔드 표식은 사용자별로 `sessionStorage`에 저장되며 5분 동안 유효합니다. 이 표식은 화면 이동을 제어하기 위한 것이며, 민감한 API의 최근 인증 여부는 백엔드가 별도로 검증합니다. 조건을 만족하지 못하면 본인 인증 화면으로 이동합니다.

## 5. HTTP 클라이언트와 인증

```text
UI 또는 Store → 도메인 API 모듈 → 공통 HTTP client → 백엔드 REST API
```

- access token과 인증 주체는 메모리에만 저장합니다.
- refresh token은 HttpOnly cookie로 관리하므로 프론트엔드에서 직접 읽지 않습니다.
- CSRF token은 인증 관련 응답의 `X-CSRF-TOKEN` 헤더에서 받아 메모리에 보관합니다. 백엔드는 같은 값을 `XSRF-TOKEN` 쿠키에도 설정하며, 상태 변경 요청에서는 브라우저가 전송하는 쿠키와 프론트엔드가 추가하는 헤더를 함께 검증하여 CSRF 공격을 방어합니다.
- `/auth/status`는 refresh token cookie의 존재 여부를 확인하고, `/auth/refresh`는 token을 검증하여 인증 상태를 복원합니다.
- 공통 HTTP client는 만료된 access token의 갱신과 요청 재시도를 처리합니다. 로그아웃하면 메모리의 인증 상태와 현재 사용자 정보를 비웁니다.
- 파일은 `@/shared/http/upload`의 `uploadFiles`로 올립니다. 백엔드에서 업로드 URL과 토큰을 발급받아 저장소에 직접 `PUT`하고, 도메인 API에는 JSON으로 토큰만 보냅니다. 직접 `PUT`은 인증 헤더와 쿠키가 붙지 않도록 공통 HTTP client 대신 `fetch`를 씁니다.

## 6. 실시간 채팅

채팅방과 기존 메시지 조회, 첨부 파일 업로드와 다운로드 URL 조회는 REST를 사용합니다. 텍스트 메시지 송수신은 SockJS/STOMP 연결을 사용합니다. 실시간 연결과 메시지 처리 시 서버가 인증 상태와 채팅방 참가 여부를 검증합니다.

채팅방을 나간 사용자는 메시지와 첨부파일에 접근할 수 없습니다. 다시 참여하면 참여 시점 이전의 대화 내용도 볼 수 있습니다.

## 7. 환경변수

| 변수 | 용도 |
| --- | --- |
| `VITE_BACKEND_URL` | SockJS/WebSocket 기본 주소 |
| `VITE_API_V1_BASE` | REST API 기본 주소 |
| `VITE_API_OAUTH2_KAKAO` | Kakao OAuth 시작 주소 |
| `VITE_API_OAUTH2_NAVER` | Naver OAuth 시작 주소 |

로컬 개발은 `.env.local`, 운영 빌드(`npm run build:prod`, `npm run deploy`)는 `.env.prod`를 읽습니다. 두 파일 모두 저장소에 포함하지 않으므로 `.env.example`을 복사해 환경에 맞는 주소로 채웁니다.

`VITE_*` 값은 브라우저 번들에 포함될 수 있으므로 비밀값을 넣지 않습니다.
