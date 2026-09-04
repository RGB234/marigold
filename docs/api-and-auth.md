# API와 인증

## 환경변수

REST API와 OAuth/채팅 연결은 다음 Vite 환경변수를 사용합니다.

| 키 | 사용 위치 | 설명 |
| --- | --- | --- |
| `VITE_API_V1_BASE` | `src/global/api.ts` | Axios base URL |
| `VITE_BACKEND_URL` | `src/chat/views/ChatRoomView.vue` | SockJS 연결 URL 기준 |
| `VITE_API_OAUTH2_KAKAO` | `src/auth/stores/auth.ts` | Kakao OAuth 시작 URL |
| `VITE_API_OAUTH2_NAVER` | `src/auth/stores/auth.ts` | Naver OAuth 시작 URL |

`VITE_*` 값은 브라우저에서 볼 수 있으므로 secret으로 취급하면 안 됩니다.

## Axios 인스턴스

[../src/global/api.ts](../src/global/api.ts)가 공통 Axios 인스턴스를 생성합니다.

기본 설정:

- `baseURL`: `import.meta.env.VITE_API_V1_BASE`
- `withCredentials: true`
- 요청/응답 interceptor 사용
- 커스텀 config: `skipAlert`, `handledErrorStatuses`

## 요청 interceptor

요청마다 다음을 수행합니다.

1. `loadingStore.start()` 호출
2. `authStore.accessToken`이 있으면 `Authorization` 헤더 추가
3. `POST`, `PUT`, `PATCH`, `DELETE` 요청에는 CSRF token이 있으면 `X-CSRF-TOKEN` 헤더 추가

CSRF token은 `XSRF-TOKEN` cookie 또는 응답 헤더 캐시에서 읽습니다.

## 응답 interceptor

성공 응답:

- `loadingStore.stop()` 호출
- `X-CSRF-TOKEN` 응답 헤더가 있으면 캐시

실패 응답:

- `loadingStore.stop()` 호출
- API 에러를 개발 모드 console에 기록
- 401이면 refresh token으로 access token 갱신 시도
- refresh 성공 시 원 요청 재시도
- refresh 실패 시 인증 상태 초기화 후 보호 라우트에서는 로그인 화면으로 이동
- `handledErrorStatuses`에 포함된 상태 코드는 전역 alert 전에 caller에게 반환
- `skipAlert`가 있으면 전역 alert를 생략

## 토큰 갱신 queue

여러 요청이 동시에 401을 받으면 첫 요청만 refresh를 실행합니다. 나머지 요청은 `refreshSubscribers` queue에 들어가고, refresh 성공 후 새 access token으로 재시도됩니다.

이 구조를 바꿀 때는 중복 refresh, 무한 재시도, 실패 시 queue 정리 여부를 같이 확인해야 합니다.

## 인증 store

[../src/auth/stores/auth.ts](../src/auth/stores/auth.ts)의 `auth` store가 인증 상태를 관리합니다.

State:

- `id`: 로그인 사용자 TSID
- `authorities`: 권한 목록
- `accessToken`: 메모리에만 저장되는 access token

주요 action:

| Action | 역할 |
| --- | --- |
| `initializeAuth()` | `/auth/status` 조회, refresh cookie가 있으면 silent refresh 후 상태 복구 |
| `silentRefresh()` | `/auth/refresh`로 새 access token 요청 |
| `login(providerCode, options)` | OAuth 시작 URL로 이동 |
| `localLogin(dto)` | 이메일 로그인 |
| `localSignup(dto)` | 이메일 회원가입 |
| `logout()` | 서버 로그아웃 요청 후 로컬 인증 상태 초기화 |
| `resetAuthState()` | user id, authorities, access token, 보안 접근 상태 초기화 |

## OAuth callback

[../src/auth/views/AuthCallbackView.vue](../src/auth/views/AuthCallbackView.vue)는 백엔드 OAuth 처리 결과를 query string으로 전달받습니다.

사용하는 query:

- `error`
- `error_description`
- `auth_status`

성공 상태면 `authStore.initializeAuth()`로 인증 상태를 복구하고, pending redirect가 있으면 해당 경로로 이동합니다. 보안 페이지 재인증 흐름에서는 sessionStorage의 pending state를 확인해 최근 인증 접근 권한을 부여합니다.

## API 모듈

| 모듈 | 파일 | 주요 엔드포인트 |
| --- | --- | --- |
| 입양글 | `src/adoption/api/adoptionPost.api.ts` | `/adoption`, `/adoption/{id}`, `/adoption/{id}/comments`, `/adoption/{id}/complete` |
| 채팅 | `src/chat/api/chat.api.ts` | `/chat/rooms`, `/chat/rooms/{roomId}`, `/chat/rooms/{roomId}/messages`, `/chat/rooms/{roomId}/messages/files` |
| 사용자 | `src/user/api/user.api.ts` | `/user/profile/{userId}`, `/user`, `/user/security`, `/user/credentials`, `/user/delete` |
| 인증 | `src/auth/stores/auth.ts` | `/auth/status`, `/auth/refresh`, `/auth/login`, `/auth/signup`, `/auth/logout` |

## STOMP 채팅

[../src/chat/views/ChatRoomView.vue](../src/chat/views/ChatRoomView.vue)는 `VITE_BACKEND_URL` 기준으로 `${base}/ws`에 SockJS 연결을 만듭니다.

연결 시 REST 요청과 동일하게 가능한 경우 다음 헤더를 포함합니다.

- `Authorization: Bearer ...`
- `X-CSRF-TOKEN`

구독:

- `/sub/chat/room/{roomId}`

발행:

- `/pub/chat/message`

파일 메시지는 STOMP가 아니라 REST API로 전송합니다.
