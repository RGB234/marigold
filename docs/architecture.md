# 프론트엔드 아키텍처

이 문서는 프론트엔드 코드의 구조와, 백엔드 계약을 프론트엔드에서 어떻게 구현했는지를 설명합니다. 계약 자체(응답 형식, 토큰·CSRF 규칙, 업로드 절차, STOMP
경로와 종료 코드)는 백엔드의 [contracts](../../back/docs/contracts/http.md) 문서를 기준으로 하며 여기서는 다시 적지 않습니다.

## 디렉터리와 의존 방향

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

애플리케이션 수준의 조립 코드는 `app`, 특정 도메인에 의존하지 않고 여러 기능에서 재사용하는 기반 코드는 `shared`에 둡니다. `shared`는 `app`이나
특정 도메인에 의존하지 않습니다. 도메인 간 협력이 필요한 화면에서는 다른 도메인의 모듈을 직접 사용합니다.

## 애플리케이션 초기화

`main.js`가 Pinia, 라우터, Vuetify를 구성하고 `installHttpClient`로 공통 HTTP client에 인터셉터를 설치합니다.

- Pinia는 클라이언트 인증 상태, 현재 사용자 정보, dialog와 toast 상태를 관리합니다.
- 인증 store의 `userId`가 바뀌면 현재 사용자 정보를 다시 읽고, 로그아웃하면 비웁니다.
- 인증 상태가 `anonymous`로 바뀌었을 때 로그인이 필요한 화면에 있으면 로그인 화면으로 이동합니다.

## 인증 상태

access token과 인증 주체는 메모리에만 저장합니다. refresh token은 HttpOnly 쿠키라 읽지 않고, CSRF token은 응답의 `X-CSRF-TOKEN` 헤더에서
받아 메모리에 보관합니다(`@/shared/http/client`).

인증 store(`@/auth/stores/auth`)는 `uninitialized → restoring → authenticated | anonymous | unavailable` 상태를 가집니다.

- 첫 라우팅 때 `ensureInitialized`가 `/auth/status`로 refresh 쿠키를 확인하고, 있으면 `/auth/refresh`로 access token을 받습니다.
- 복원 중 네트워크 오류가 나면 `unavailable`이 되고, 로그인이 필요한 화면으로의 이동은 막거나(이전 화면이 있을 때) 홈으로 보냅니다.
- 동시에 여러 요청이 갱신을 시도해도 `RefreshCoordinator`가 한 번의 갱신 결과를 공유합니다. 갱신이 401이면 세션을 비웁니다.

## 라우팅과 접근 제어

라우트 메타데이터로 접근을 제어합니다(`@/app/router`).

- `requiresAuth`: 로그인한 사용자만 접근할 수 있습니다.
- `roles`: 라우트에 지정하면 해당 권한 중 하나를 가진 사용자만 접근할 수 있습니다. 현재 이 메타데이터를 적용한 라우트는 없습니다.
- `requiresRecentAuth`: 최근에 본인 인증을 완료한 사용자만 접근할 수 있습니다. 조건을 만족하지 못하면 본인 인증 화면으로 이동합니다.

`requiresRecentAuth`의 프론트엔드 표식은 사용자별로 `sessionStorage`에 저장되며 5분 동안 유효합니다. 이 표식은 화면 이동을 제어하기 위한 것이며,
민감한 API의 최근 인증 여부는 백엔드가 별도로 검증합니다.

## HTTP client

```text
UI 또는 Store → 도메인 API 모듈(*.api.ts) → 공통 HTTP client → 백엔드 REST API
```

모든 REST 요청은 `@/shared/http/client`의 단일 Axios 인스턴스를 씁니다. `@/app/bootstrap/installHttpClient`가 설치하는 인터셉터는 다음만 합니다.

- access token을 `Authorization` 헤더에, POST·PUT·PATCH·DELETE에는 CSRF 헤더를 붙입니다.
- 응답 헤더의 CSRF token을 캐시합니다.
- 오류를 로그로 남깁니다.
- 인증 오류 코드(`AUTH_UNAUTHORIZED`, `AUTH_TOKEN_INVALID`, `AUTH_TOKEN_EXPIRED`)가 담긴 401에서만 access token을 갱신하고 요청을 한 번 다시 보냅니다.

그 밖의 실패는 그대로 호출한 쪽에 넘깁니다. 전역 오류 알림이나 404 이동은 없으며, 각 화면이 오류를 표시합니다.

### 오류 표시

- `@/shared/errors/apiError`의 `normalizeApiError`는 요청 오류를 `api`, `network`, `timeout`, `cancelled`, `unknown`으로 분류합니다.
- 화면에 보여 줄 문구는 `getApiErrorMessage`로 얻습니다. `errorMessages.ts`에 해당 `errorCode`의 문구가 있으면 그 문구를, 없으면 응답의 `detail`을,
  그것도 없으면 호출한 쪽이 넘긴 기본 문구를 씁니다. 취소된 요청은 빈 문자열을 반환하고, 저장소 직접 업로드 실패는 별도 문구를 씁니다.
- 입력 검증 오류는 `extractProblemDetail`로 꺼낸 `errors`를 필드별 오류로 표시합니다.
- 백엔드에 오류 코드를 추가하면 `errorMessages.ts`에 같은 키로 문구를 추가합니다.

## 파일 업로드

파일은 `@/shared/http/upload`의 `uploadFiles(purpose, files)`로 올리고, 도메인 API에는 돌려받은 토큰만 JSON으로 보냅니다. 저장소로 직접 보내는 `PUT`은
공통 HTTP client 대신 `fetch`를 씁니다. client의 인증·CSRF 헤더와 쿠키가 붙으면 S3 presigned URL 서명과 CORS가 깨지기 때문입니다. 절차와 오류
코드는 [업로드 계약](../../back/docs/contracts/uploads.md)을 따릅니다.

## 실시간 채팅

채팅방 화면(`@/chat/views/ChatRoomView.vue`)이 방마다 STOMP client 하나를 만듭니다. 서버 쪽 검사와 종료 코드는
[실시간 계약](../../back/docs/contracts/realtime.md)을 따릅니다.

1. 화면을 열면 채팅방 정보와 메시지 이력을 REST로 읽은 뒤 연결합니다.
2. 연결할 때마다(자동 재연결 포함) `beforeConnect`가 access token을 갱신하고 새 토큰과 CSRF 헤더로 CONNECT합니다. 갱신이 401이면 로그인 화면으로,
   일시적 오류면 재시도 화면으로 갑니다.
3. 연결되면 `/user/queue/errors`와 방 경로를 구독하고, 이력을 다시 읽어 메시지 `id` 기준으로 합칩니다. 끊긴 동안 온 메시지를 채우기 위해서입니다.
4. 연결이 끊기면 5초 뒤 다시 연결하며, 연속 5번 실패하면 멈추고 재시도 버튼을 보여 줍니다. 서버는 토큰 만료로 약 10분마다 연결을 끊으므로 이 재연결은
   정상 흐름입니다.
5. STOMP `ERROR` frame 중 서버 내부 오류와 CONNECT의 인증 오류만 재시도하고, 그 밖의 오류(예: 나간 방의 SUBSCRIBE 거부)는 연결을 멈춥니다.
6. 나가기 버튼은 확인을 받은 뒤 연결부터 닫고 나가기 API를 호출합니다. 서버가 보내는 `4003` 종료를 재연결 대상으로 보지 않기 위해서입니다. 성공하면
   채팅 목록으로 이동하고, 실패하면 오류를 보여 주고 다시 연결합니다.

텍스트 메시지는 STOMP로 보내고, 첨부파일 메시지는 업로드 후 REST로 만듭니다. 첨부 메시지를 보낼 때 연결이 끊겨 있으면 REST 응답을 바로 목록에
추가합니다.
