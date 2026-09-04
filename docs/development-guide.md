# 개발 가이드

## 기본 원칙

- 기능별 코드는 해당 기능 디렉터리에 둡니다.
- 한 번만 쓰는 코드를 성급하게 `global`로 올리지 않습니다.
- API 호출은 공통 Axios 인스턴스 `api`를 사용합니다.
- 라우터 이동은 `RouteHelper`를 우선 사용합니다.
- validation 기준은 `validation-policy.json`에서 시작합니다.
- 환경변수 값, token, cookie, 다운로드 URL 등 민감 값은 로그와 문서에 남기지 않습니다.

## 새 화면 추가

1. 기능 디렉터리 아래 `views`에 Vue 파일을 추가합니다.
2. [../src/global/router/index.ts](../src/global/router/index.ts)에 route를 추가합니다.
3. [../src/global/router/routeHelper.ts](../src/global/router/routeHelper.ts)에 helper를 추가합니다.
4. 인증이 필요하면 `meta.requiresAuth`를 명시합니다.
5. 보안 재인증이 필요하면 `meta.requiresRecentAuth`를 명시합니다.

## 새 API 추가

1. 기능 디렉터리의 `api/*.api.ts`에 함수를 추가합니다.
2. 요청/응답 타입은 해당 기능의 `types`에 둡니다.
3. `api` 인스턴스를 사용합니다.
4. 페이지에서 직접 처리해야 하는 오류는 `handledErrorStatuses`를 사용합니다.
5. 전역 alert를 피해야 하는 요청은 `skipAlert`를 사용합니다.

예시:

```ts
await api.patch<ApiResponse<void>>("/resource/1", payload, {
  handledErrorStatuses: [400],
});
```

## validation 추가

1. 정책 값은 [../src/global/validation/validation-policy.json](../src/global/validation/validation-policy.json)에 추가합니다.
2. 구현은 [../src/global/validation/validators.ts](../src/global/validation/validators.ts)에 둡니다.
3. [../src/global/validation/validators.test.ts](../src/global/validation/validators.test.ts)에 테스트를 추가합니다.
4. 백엔드와 공유되는 정책이면 `npm run check:validation-policy`를 실행합니다.

## 인증이 필요한 기능

보호 라우트는 `requiresAuth`로 처리합니다. API 함수 내부에서 로그인 여부를 다시 판단하지 않습니다. 401과 refresh 처리는 공통 interceptor에 맡깁니다.

최근 인증이 필요한 기능은 `requiresRecentAuth`를 사용합니다. 현재 사용 예시는 `/user/profile/security`입니다.

## 파일 업로드 기능

입양글 이미지, 댓글 이미지, 채팅 첨부 파일은 모두 사용자 생성 파일입니다. 다음을 지킵니다.

- 프론트엔드 validation은 사용자 경험용으로만 봅니다.
- 서버 검증을 우회할 수 있다고 가정합니다.
- 파일명, MIME type, 다운로드 URL을 로그에 남기지 않습니다.
- 미리보기 URL과 다운로드 URL은 사용자 개인정보 또는 민감 자료가 될 수 있습니다.

## 테스트 추가 기준

| 변경 유형 | 권장 테스트 |
| --- | --- |
| validation 변경 | Vitest 단위 테스트 |
| auth store 변경 | Vitest store 테스트 |
| router guard 변경 | 라우팅/스토어 단위 테스트 |
| 사용자 주요 흐름 변경 | Playwright E2E 테스트 |
| API error 처리 변경 | interceptor 또는 호출부 테스트 |

## 현재 테스트 주의사항

- [../tests/setup/vitest.setup.ts](../tests/setup/vitest.setup.ts)의 MSW 설정은 placeholder입니다.
- [../e2e/user-flow.spec.ts](../e2e/user-flow.spec.ts)는 실제 사용자 흐름을 아직 대부분 주석으로 남겨둔 상태입니다.
