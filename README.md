# Marigold Frontend

Marigold의 입양 게시글, 사용자 인증·프로필, 실시간 채팅을 제공하는 Vue 기반 SPA입니다. 기능별 코드는 도메인 디렉터리에 두고, HTTP·라우팅·전역 상태 같은 공통 기능은 `global`에서 관리합니다.

## 1. 프로젝트와 기술 스택

- Vue 3, Vite, TypeScript
- Pinia, Vue Router, Vuetify
- Axios
- SockJS, STOMP
- Vitest, Vue Test Utils, Playwright
- Cloudflare Vite Plugin, Wrangler

## 2. 설치·실행·테스트·빌드

`.env.example`을 `.env.local`로 복사하고 백엔드 주소를 확인한 뒤 실행합니다.

```bash
npm ci
npm run dev
```

개발 서버의 기본 주소는 `http://localhost:8000`입니다.

| 명령어 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run test:unit -- --run` | 단위 테스트 1회 실행 |
| `npm run test:e2e` | Playwright E2E 테스트 실행 |
| `npm run build:dev` | 개발 환경 빌드 |
| `npm run build:prod` | 운영 환경 빌드 |
| `npm run check:validation-policy` | 백엔드와 검증 정책이 동기화되었는지 확인 |
| `npm run sync:validation-policy` | 백엔드의 검증 정책을 프론트엔드로 복사 |
| `npm run deploy` | 운영 빌드 후 Wrangler 배포 |

검증 정책의 원본은 백엔드 `ValidationPolicy.java`입니다.

프론트엔드와 백엔드 사이 검증 정책을 동기화하기 위해서는 다음과 같은 과정이 필요합니다.

1. 백엔드에서 `./gradlew generateValidationPolicy`를 실행하여 back/src/main/resources/validation-policy.json 파일을 생성
2. 생성한 파일을 `npm run sync:validation-policy`로 프론트엔드 front/src/global/validation-policy.json에 복사하여 갱신.

루트 폴더 내에 프론트엔드와 백엔드 프로젝트가 둘 다 존재하는 모노레포 환경에서 구현한 검증 스크립트이므로, 다른 환경이라면 수동으로 복사-붙여넣기하여 갱신하거나 scripts/sync-validation.policy.mjs 파일을 일부 수정해야 합니다.


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

각 도메인은 필요에 따라 `views`, `components`, `api`, `types`를 가집니다. 여러 도메인에서 함께 사용하는 코드만 `global`에 둡니다.

## 4. 앱 시작과 라우팅·상태 구성

`main.js`가 Pinia, API interceptor, Router, Vuetify와 전역 오류 처리를 등록한 뒤 `App.vue`를 마운트합니다. `App.vue`는 내비게이션, 현재 사용자 정보, `router-view`, 전역 로딩과 알림을 담당합니다.

라우트는 `global/router`에서 지연 로딩합니다. 전역 guard는 라우트 메타데이터의 로그인, 권한, 최근 인증 조건을 확인합니다.

전역 Pinia 상태는 다음 세 가지로 제한합니다.

- `auth`: 사용자 ID, 권한, access token
- `loading`: 진행 중인 API 요청 수
- `alert`: alert, confirm, toast 대기열

그 밖의 화면 데이터는 각 View의 로컬 상태에서 관리합니다.

## 5. REST 인증·오류 처리 흐름

```text
View → 도메인 API 모듈 → 공통 Axios client → 백엔드 REST API
```

- **Access token**: 로그인 성공 시 또는 토큰 갱신시 응답 body로 Access token을 받고 Pinia 메모리에만 보관합니다. 공통 interceptor가 API 요청의 `Authorization: Bearer` header에 추가합니다.
- **Refresh token**: 로그인 성공 시 백엔드가 HttpOnly cookie로 발급하므로 프론트엔드에서 직접 읽지 않습니다. `withCredentials=true`로 지정한 요청일 경우 브라우저가 자동으로 해당 쿠키를 포함하여 요청을 보냅니다. access token 갱신에 사용됩니다.
- **CSRF token**: 백엔드는 로컬 로그인, OAuth 로그인·가입, token 갱신 성공 시 발급하고, 인증 상태 조회 시 refresh token cookie가 있으면 다시 발급합니다. 프론트엔드는 `XSRF-TOKEN` cookie 또는 `X-CSRF-TOKEN` 응답 header의 값을 보관하고, `POST`, `PUT`, `PATCH`, `DELETE` 요청의 `X-CSRF-TOKEN` header에 추가합니다.

인증 오류로 access token이 만료되면 동시 갱신 요청을 하나로 모아 처리하고, 갱신 성공 시 원래 요청을 한 번만 재시도합니다. 로그아웃하면 메모리의 access token을 비우고 백엔드가 refresh·CSRF cookie를 삭제합니다.

공통 interceptor는 요청 중 로딩 상태와 오류 알림도 관리합니다. 화면이 직접 오류를 표현해야 하는 요청은 `errorMode: "local"`을 사용하고, 나머지는 공통 alert로 처리합니다.

## 6. 실시간 채팅 구조

채팅방과 기존 메시지 조회, 파일 업로드·다운로드는 REST를 사용합니다. 텍스트 메시지 송수신은 SockJS/STOMP 연결을 사용합니다.

채팅 연결 전 access token을 갱신하고 사용자 오류 queue와 현재 채팅방을 구독합니다. 연결이 끊기면 제한적으로 재연결하며, 복구할 수 없는 오류는 화면에 표시하고 연결을 종료합니다.

## 7. 환경변수

| 변수 | 용도 |
| --- | --- |
| `VITE_BACKEND_URL` | 백엔드와 WebSocket 기본 주소 |
| `VITE_API_V1_BASE` | REST API 기본 주소 |
| `VITE_API_OAUTH2_KAKAO` | Kakao OAuth 시작 주소 |
| `VITE_API_OAUTH2_NAVER` | Naver OAuth 시작 주소 |

`VITE_*` 값은 브라우저 번들에 포함될 수 있으므로 비밀값을 넣지 않습니다.