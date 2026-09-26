# 개발 가이드

설정 준비는 [설정 안내](configuration.md), 변경별 문서 갱신 규칙은 [문서 목차](README.md)를 따릅니다.

## 기본 원칙

- 기능별 코드는 해당 기능 디렉터리에 둡니다.
- 한 번만 쓰는 코드를 성급하게 `global`로 올리지 않습니다.
- API 호출은 공통 Axios 인스턴스 `api`를 사용합니다.
- 라우터 이동은 `RouteHelper`를 우선 사용합니다.
- validation 정책의 기준은 백엔드 Java 상수 `ValidationPolicy`이며, 프론트엔드는 `validation-policy.json` 사본을 사용합니다.
- 환경변수 값, token, cookie, 다운로드 URL 등 민감 값은 로그와 문서에 남기지 않습니다.

## 새 화면 추가

1. 기능 디렉터리 아래 `views`에 Vue 파일을 추가합니다.
2. [../src/global/router/index.ts](../src/global/router/index.ts)에 route를 추가합니다.
3. [../src/global/router/routeHelper.ts](../src/global/router/routeHelper.ts)에 helper를 추가합니다.
4. 인증이 필요하면 `meta.requiresAuth`를 명시합니다.
5. 보안 재인증이 필요하면 `meta.requiresAuth: true`와 `meta.requiresRecentAuth: true`를 함께 명시합니다.

## 새 API 추가

1. 기능 디렉터리의 `api/*.api.ts`에 함수를 추가합니다.
2. 요청/응답 타입은 해당 기능의 `types`에 둡니다.
3. `api` 인스턴스를 사용합니다.
4. 페이지에서 직접 처리해야 하는 오류는 `handledErrorStatuses`를 사용합니다.
5. 전역 alert를 피해야 하는 요청은 `skipAlert`를 사용합니다.

예시:

```ts
await api.patch<void>("/resource/1", payload, {
  handledErrorStatuses: [400],
});
```

## validation 추가

1. 백엔드 Java 상수 `ValidationPolicy`를 변경하고 `back/src/main/resources/validation-policy.json`을 맞춥니다.
2. 백엔드 JSON을 [../src/global/validation/validation-policy.json](../src/global/validation/validation-policy.json)에 반영합니다.
3. 구현은 [../src/global/validation/validators.ts](../src/global/validation/validators.ts)에 두고, [../src/global/validation/validators.test.ts](../src/global/validation/validators.test.ts)에 관련 테스트를 추가합니다.
4. 백엔드에서 `./gradlew test --tests '*ValidationPolicyContractTest'`, 프론트엔드에서 `npm run check:validation-policy`를 실행합니다.

프론트 검사는 두 JSON만 비교하므로 백엔드 계약 테스트도 필요합니다. 기본적으로 `front`와 `back`이 형제 디렉터리에 있어야 하며, 다른 배치에서는 `VALIDATION_POLICY_SOURCE`로 백엔드 JSON 경로를 지정합니다. 기본 경로는 실행 디렉터리가 아닌 스크립트 위치를 기준으로 합니다. 명시한 상대 경로는 실행 디렉터리 기준입니다.

프론트 단독 CI의 문서·설정 검사는 백엔드를 요구하지 않습니다. 공유 정책 변경 시 PR에 비교한 백엔드 커밋을 기록하고, 그 커밋을 체크아웃한 환경에서 두 계약 검사를 실행합니다. 백엔드 접근 권한·기준 커밋 없이 프론트 사본만 비교하는 검사를 계약 검증으로 간주하지 않습니다.

## 인증이 필요한 기능

보호 라우트는 `requiresAuth`로 처리합니다. API 함수 내부에서 로그인 여부를 다시 판단하지 않습니다. 401과 refresh 처리는 공통 interceptor에 맡깁니다.

최근 인증이 필요한 기능은 `requiresAuth: true`와 `requiresRecentAuth: true`를 함께 사용합니다. `roles` 검사도 `requiresAuth: true`인 경우에만 실행합니다. 현재 최근 인증 사용 예시는 `/user/profile/security`입니다.

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
