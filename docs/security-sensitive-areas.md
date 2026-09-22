# 보안상 민감한 부분

이 문서는 프론트엔드 코드에서 민감하게 다뤄야 하는 위치를 정리합니다. 값 자체는 문서에 적지 않습니다.

## 원칙

- 프론트엔드 번들에 들어가는 값은 사용자가 볼 수 있다고 봅니다.
- `VITE_*` 환경변수는 secret 저장소가 아닙니다.
- access token, refresh cookie, CSRF token, OAuth callback query, sessionStorage 값은 로그와 문서에 남기지 않습니다.
- 파일명, 이미지 URL, 다운로드 URL도 사용자 정보가 될 수 있습니다.

## 민감 영역 표

| 위치 | 민감도 | 이유 | 취급 기준 |
| --- | --- | --- | --- |
| `.env.dev.local`, `.env.local` | 환경설정 | 개인별 공개 API/OAuth URL | Git 제외, secret 금지 |
| `.env.prod` | 환경설정 | Git으로 관리하는 운영 공개 URL | secret 금지, 변경 리뷰 필요 |
| `VITE_API_V1_BASE` | 중간 | REST API base URL | 공개 가능 URL만 사용 |
| `VITE_BACKEND_URL` | 중간 | SockJS/STOMP 연결 URL | 공개 가능 URL만 사용 |
| `VITE_API_OAUTH2_KAKAO` | 중간 | OAuth 시작 URL | client secret 포함 금지 |
| `VITE_API_OAUTH2_NAVER` | 중간 | OAuth 시작 URL | client secret 포함 금지 |
| `authStore.accessToken` | 높음 | API 인증 bearer token | 메모리에만 유지, 로그 금지 |
| Refresh token cookie | 높음 | 세션 복구에 사용 | HttpOnly/SameSite/Secure 설정은 백엔드에서 관리 |
| `XSRF-TOKEN` cookie | 높음 | CSRF 방어에 사용 | 로그 금지, 헤더명만 문서화 |
| `X-CSRF-TOKEN` header | 높음 | 변경 요청 보호 | 값 로그 금지 |
| `Authorization` header | 높음 | REST/STOMP 인증 | 값 로그 금지 |
| `sessionStorage: auth.pending` | 중간 | OAuth 후 redirect와 예상 사용자 정보 | 값 로그 금지, callback 후 제거 |
| `sessionStorage: user.security.access` | 중간-높음 | 최근 보안 인증 상태 | 5분 TTL 유지, 로그 금지 |
| OAuth callback query | 중간 | 에러/상태 정보가 URL에 노출 | query 원문 로그 금지 |
| 채팅 첨부 파일 | 높음 | 사용자 파일과 다운로드 URL | 파일명/URL/미리보기 로그 금지 |
| 입양글/댓글 이미지 | 중간-높음 | 사용자 업로드 이미지 | 원본 URL/파일명 로그 금지 |
| 사용자 프로필 | 중간 | 닉네임, 이미지, 상태 | 필요 최소 표시 |
| `wrangler.jsonc` | 환경설정 | Git으로 관리하는 배포 설정 | secret 금지, 변경 리뷰 필요 |
| `.wrangler`, `.dev.vars*` | 높음 | 로컬 상태 또는 실제 환경값 포함 가능 | Git 제외. `.dev.vars.example`은 비밀값 없는 예제만 허용 |

## 현재 저장소 상태에서 확인한 점

환경파일의 역할과 우선순위는 [설정 안내](configuration.md), 제외 패턴은 [.gitignore](../.gitignore)가 기준입니다. 공개 URL 자체를 인증 비밀값과 혼동하지 않습니다. `.gitignore`는 이미 추적 중인 파일을 추적 해제하지 않으므로 커밋 대상도 확인합니다.

## 인증 관련 민감 흐름

### Access token

Access token은 [../src/auth/stores/auth.ts](../src/auth/stores/auth.ts)의 Pinia store 메모리에 저장됩니다. 새로고침 후에는 `/auth/status`와 `/auth/refresh`를 통해 복구합니다.

### Refresh token

프론트엔드 코드는 refresh token 값을 직접 읽지 않습니다. `/auth/status`의 `refreshTokenPresent` 값으로 존재 여부만 확인합니다.

### CSRF token

[../src/global/api.ts](../src/global/api.ts)는 `XSRF-TOKEN` cookie 또는 응답 헤더에서 CSRF token을 읽어 변경 요청에 `X-CSRF-TOKEN`으로 보냅니다.

### 최근 보안 인증

[../src/user/utils/securityAccess.ts](../src/user/utils/securityAccess.ts)는 `sessionStorage`에 사용자 id, 부여 시각, 로컬에서 생성한 token을 저장합니다. TTL은 해당 코드가 기준입니다. 이 값은 화면 접근 흐름에 사용하며 서버 인증의 증거가 아닙니다. 민감 API의 최근 인증 여부는 백엔드가 별도로 검증합니다.

## 로깅 기준

[../src/global/logger.ts](../src/global/logger.ts)는 개발 모드에서만 console에 기록합니다. 그래도 다음 값은 개발 모드에서도 찍지 않습니다.

- access token
- CSRF token
- cookie 값
- Authorization header
- OAuth callback query 원문
- 이메일/비밀번호
- 파일 다운로드 URL
- 사용자 업로드 파일명 또는 원본 URL

## 커밋 전 확인

```bash
git status --short
git diff -- .env.prod
```

`.env.prod` 변경이 있으면 값이 secret이 아닌지 확인하고, 필요한 경우 URL 일부도 리뷰에서 직접 노출하지 않습니다.
