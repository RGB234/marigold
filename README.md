# Marigold Frontend

Marigold의 입양 게시글, 사용자 인증·프로필, 실시간 채팅을 제공하는 Vue 기반 SPA입니다. 기능별 코드는 도메인 디렉터리에 두고, HTTP·라우팅·전역 상태 같은 공통 기능은 `global`에서 관리합니다.

## 1. 기술 스택

- Vue 3, Vite, TypeScript
- Pinia, Vue Router, Vuetify
- Axios
- SockJS, STOMP
- Vitest, Vue Test Utils, Playwright
- Cloudflare Vite Plugin, Wrangler

정확한 라이브러리 버전은 `package.json`과 `package-lock.json`을 기준으로 합니다. Node.js 22 LTS 22.12 이상을 권장합니다.

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
| `npm run check:env` | 환경변수 선언과 사용 여부 확인 |
| `npm run preview` | 개발 빌드 후 Wrangler로 로컬 미리보기 |
| `npm run check:validation-policy` | 백엔드와 검증 정책이 동기화되었는지 확인 |
| `npm run sync:validation-policy` | 백엔드의 검증 정책을 프론트엔드로 복사 |
| `npm run deploy` | 운영 빌드 후 Wrangler로 배포 |

`npm run deploy`를 실행하려면 대상 Cloudflare 계정에 대한 Wrangler 인증이 필요합니다.

### 검증 정책 동기화

검증 정책은 백엔드의 `ValidationPolicy.java`를 원본으로 관리합니다.

1. `back`에서 `./gradlew generateValidationPolicy`를 실행하여 `back/src/main/resources/validation-policy.json`을 생성합니다.
2. `front`에서 `npm run sync:validation-policy`를 실행하여 `front/src/global/validation/validation-policy.json`을 갱신합니다.

기본 스크립트는 저장소 루트에 `back`과 `front`가 함께 있는 구조를 기준으로 합니다. 원본 JSON의 위치가 다르면 스크립트를 수정하는 대신 `VALIDATION_POLICY_SOURCE` 환경변수로 경로를 지정합니다.

## 3. 주요 디렉터리와 역할

```text
src/
  adoption/  입양 게시글과 댓글
  auth/      로그인, 회원가입, 인증 상태 복구
  chat/      채팅방, 메시지, 첨부 파일, 실시간 연결
  user/      프로필과 보안 설정
  global/    HTTP, 라우터, 공통 상태·UI·오류·검증
  assets/    이미지와 폰트
```

각 도메인은 필요에 따라 `views`, `components`, `api`, `stores`, `services`, `types`, `utils`를 가집니다. 여러 도메인에서 함께 사용하는 코드만 `global`에 둡니다.

## 4. 애플리케이션 구조

`main.js`는 Pinia와 공통 API interceptor를 구성하고 Router와 Vuetify를 등록한 뒤 `App.vue`를 마운트합니다. `App.vue`는 내비게이션, 현재 사용자 메뉴, `router-view`, 전역 dialog와 toast host를 유지하는 애플리케이션 셸입니다.

### 전역 상태

- `auth`: 인증 단계와 세션을 관리합니다. access token과 `userId`, 권한 목록은 메모리에만 저장합니다.
- `user`: 현재 로그인 사용자의 프로필 조회·수정 상태를 관리합니다.
- `dialog`: 사용자의 결정을 받아야 하는 alert와 confirm 대기열을 관리합니다.
- `toast`: 명시적으로 요청된 성공, 오류, 경고, 정보 메시지를 관리합니다.

요청의 로딩과 오류 상태는 각 View가 관리합니다. 최초 조회 화면은 `RequestLoadingState`와 `RequestErrorState`, 중복 실행을 막아야 하는 액션은 `AsyncButton`을 재사용합니다. 백그라운드 요청은 전역 로딩 UI를 만들지 않습니다.

### 라우팅과 접근 제어

라우트 컴포넌트는 동적 `import()`로 지연 로딩합니다. 전역 guard는 다음 라우트 메타데이터를 확인합니다.

- `requiresAuth`: 로그인한 사용자만 접근할 수 있습니다.
- `roles`: 지정된 권한 중 하나를 가진 사용자만 접근할 수 있습니다.
- `requiresRecentAuth`: 최근에 본인 인증을 완료한 사용자만 접근할 수 있습니다.

`requiresRecentAuth`의 프론트엔드 표식은 사용자별로 `sessionStorage`에 저장되며 5분 동안 유효합니다. 이 표식은 화면 이동을 제어하기 위한 것이며, 민감한 API의 최근 인증 여부는 백엔드가 별도로 검증합니다. 조건을 만족하지 못하면 본인 인증 화면으로 이동합니다.

## 5. HTTP 클라이언트와 인증

```text
View → 도메인 API 모듈 → 공통 Axios client → 백엔드 REST API
```

- 로그인 또는 token 갱신으로 받은 access token과 인증 주체를 `auth` store에 저장합니다. 공통 interceptor는 access token을 `Authorization: Bearer` header에 추가합니다.
- refresh token은 HttpOnly cookie이므로 프론트엔드에서 직접 읽지 않습니다. 공통 Axios client는 `withCredentials: true`를 사용하여 인증 cookie를 요청에 포함합니다.
- 프론트엔드는 `X-CSRF-TOKEN` 응답 header의 CSRF token을 메모리에 보관하고, `POST`, `PUT`, `PATCH`, `DELETE` 요청에 같은 header로 전달합니다. `XSRF-TOKEN` cookie는 브라우저가 자동으로 전송합니다.

access token 만료로 여러 요청이 동시에 실패하면 갱신 요청을 하나로 모읍니다. 갱신 성공 후 실패했던 요청은 각각 한 번만 재시도하며, 로그아웃하면 메모리의 인증 세션과 현재 사용자 프로필을 비웁니다.

공통 interceptor는 인증 header, CSRF, timeout, access token 갱신, 오류 로깅만 담당합니다. API 오류는 네트워크, 시간 초과, HTTP 응답, 요청 취소 등으로 정규화되고 호출 화면으로 전달됩니다. 화면은 요청 목적에 맞춰 오류 상태, dialog 또는 toast 중 하나를 명시적으로 선택합니다.

## 6. 실시간 채팅

채팅방과 기존 메시지 조회, 파일 업로드·다운로드는 REST를 사용합니다. 텍스트 메시지 송수신은 SockJS/STOMP 연결을 사용합니다.

채팅 라우트 진입 전에 전역 라우터 가드가 refresh_token 쿠키를 이용해 프런트의 인증 상태를 복원합니다. 인증이 확인되면 채팅 화면에서 REST API로 채팅방과 기존 메시지를 조회한 후 WebSocket 연결을 수행합니다.

WebSocket 최초 연결과 자동 재연결 직전에는 access token을 갱신한 뒤 `/ws` endpoint의 STOMP `CONNECT` frame에 다음 header를 설정합니다.


- `Authorization: Bearer {accessToken}`
- `X-CSRF-TOKEN: {csrfToken}`

채팅방을 나간 사용자는 메시지와 첨부파일에 접근할 수 없습니다. 다시 참여하면 참여 시점 이전의 대화 내용도 볼 수 있습니다.

클라이언트가 사용하는 destination은 다음과 같습니다.

- `/pub/chat/message`: 텍스트 메시지 전송
- `/sub/chat/room/{roomId}`: 현재 채팅방 메시지 구독
- `/user/queue/errors`: 현재 사용자의 메시지 처리 오류 구독

서버는 연결 시 인증을 확인하고, 메시지 전송과 구독 시 채팅방 참가 권한을 검증합니다.

파일을 첨부한 메시지는 서버에 파일을 REST로 업로드한 뒤, 파일 접근 URL을 포함한 메시지로 채팅방에 발행됩니다. 첨부 파일 다운로드 URL은 인증이 필요한 별도 REST 요청으로 받으며, 서버는 요청 사용자가 현재 채팅방 참가자인지 확인합니다.

연결이 끊기면 5초 간격으로 재연결하고, 연속 연결 실패가 5회에 도달하면 자동 재시도를 중단합니다. 재연결 전에는 access token을 다시 갱신하고, 연결되면 사용자 오류 queue와 현재 채팅방을 다시 구독합니다.

refresh token 만료로 갱신할 수 없으면 로그인 화면으로 이동합니다. 네트워크 오류 같은 일시적인 실패는 로그인 상태를 유지하면서 자동 재연결을 중단하고, 사용자가 다시 시도할 수 있는 화면을 표시합니다.

## 7. 환경변수

| 변수 | 용도 |
| --- | --- |
| `VITE_BACKEND_URL` | SockJS/WebSocket 기본 주소 |
| `VITE_API_V1_BASE` | REST API 기본 주소 |
| `VITE_API_OAUTH2_KAKAO` | Kakao OAuth 시작 주소 |
| `VITE_API_OAUTH2_NAVER` | Naver OAuth 시작 주소 |

`VITE_*` 값은 브라우저 번들에 포함될 수 있으므로 비밀값을 넣지 않습니다.
