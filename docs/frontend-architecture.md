# 프론트엔드 구조

## 앱 진입점

[../src/main.js](../src/main.js)에서 Vue 앱을 생성하고 Pinia, Router, Vuetify를 등록합니다. `LoadingOverlay`, `GlobalAlert`는 전역 컴포넌트로 등록됩니다.

[../src/App.vue](../src/App.vue)는 최상위 레이아웃입니다. 주요 책임은 다음과 같습니다.

- 상단 내비게이션 렌더링
- 로그인 여부에 따른 메뉴 분기
- 앱 mount 시 `authStore.initializeAuth()` 호출
- 로그인 사용자 프로필 조회
- 전역 로딩/알림 컴포넌트 렌더링

## 디렉터리 구조

```text
src/
  adoption/   입양글, 댓글, 입양 상태, 입양 관련 채팅 진입
  auth/       로그인, 회원가입, OAuth callback, 인증 store
  chat/       채팅방 목록, 채팅방, STOMP 메시징, 첨부 파일
  user/       프로필, 보안 설정, 재인증
  global/     API, router, 공통 store, validation, 공통 컴포넌트
  assets/     이미지, 폰트
```

## 모듈 책임

### `src/auth`

인증 상태는 [../src/auth/stores/auth.ts](../src/auth/stores/auth.ts)의 Pinia store가 관리합니다. Refresh token은 백엔드가 HttpOnly cookie로 관리한다고 가정하고, 프론트엔드는 access token만 메모리에 저장합니다.

OAuth 로그인은 Kakao/Naver 시작 URL로 브라우저를 이동시키고, callback 화면에서 인증 상태를 복구합니다.

### `src/adoption`

입양글 목록, 상세, 작성, 수정, 삭제, 작성자/입양자별 목록, 댓글, 입양 후보자, 입양 완료/취소 API를 포함합니다. API 함수는 [../src/adoption/api/adoptionPost.api.ts](../src/adoption/api/adoptionPost.api.ts)에 모여 있습니다.

### `src/chat`

채팅방 API는 [../src/chat/api/chat.api.ts](../src/chat/api/chat.api.ts)에 있습니다. 채팅방 화면은 REST API로 기존 메시지를 불러온 뒤 SockJS/STOMP로 실시간 메시지를 구독합니다.

텍스트 메시지는 STOMP `/pub/chat/message`로 publish합니다. 파일 메시지는 REST API `POST /chat/rooms/{roomId}/messages/files`로 전송합니다.

### `src/user`

프로필 조회/수정, 보안 정보 조회, 이메일 로그인 등록, 회원 탈퇴 API가 있습니다. 보안 설정 화면은 최근 인증이 필요한 라우트로 보호됩니다.

### `src/global`

공통 API 클라이언트, 라우터, 전역 store, 공통 컴포넌트, validation 정책을 둡니다. 새 기능을 추가할 때 공통화가 필요하지 않으면 기능 디렉터리 안에 먼저 둡니다.

## 상태 관리

| Store | 경로 | 역할 |
| --- | --- | --- |
| `auth` | `src/auth/stores/auth.ts` | user id, authorities, access token |
| `loading` | `src/global/stores/loading.ts` | Axios 요청 수 기반 전역 로딩 |
| `alert` | `src/global/stores/alert.ts` | confirm/alert dialog, snackbar |

## 라우팅

라우트 정의는 [../src/global/router/index.ts](../src/global/router/index.ts)에 있습니다. 라우트 이동 객체는 [../src/global/router/routeHelper.ts](../src/global/router/routeHelper.ts)의 `RouteHelper`를 우선 사용합니다.

전역 가드의 인증·최근 인증·권한 검사 조건과 라우트 목록은 [라우트 문서](routes.md)를 기준으로 합니다.

## API 흐름

모든 REST 호출은 [../src/global/api.ts](../src/global/api.ts)의 Axios 인스턴스를 사용합니다.

이 인스턴스가 전역 로딩, 인증·CSRF 헤더, 토큰 갱신과 오류 처리를 담당합니다. 재시도 조건과 queue 동작은 [API와 인증](api-and-auth.md)을 봅니다.

## Validation

검증 정책의 원본은 백엔드 Java `ValidationPolicy`입니다. 프론트의 [validation-policy.json](../src/global/validation/validation-policy.json)은 공유 계약 사본이며, 적용 코드는 [validators.ts](../src/global/validation/validators.ts)에 있습니다.

변경 순서와 백엔드·프론트 검사 방법은 [개발 가이드](development-guide.md)의 validation 절을 따릅니다.
