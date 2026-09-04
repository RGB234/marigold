# Marigold Frontend

Marigold 프론트엔드 애플리케이션입니다. Vue 3, Vite, Pinia, Vue Router, Vuetify를 사용하며 `back` 저장소의 백엔드 API와 통신합니다.

## 빠른 시작

```bash
npm install
npm run dev
```

개발 서버 포트는 [vite.config.ts](./vite.config.ts)의 `server.port` 값에 따라 기본 `8000`입니다.

## 주요 명령어

| 명령어 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (`--mode dev`) |
| `npm run prod` | 프로덕션 모드로 개발 서버 실행 (`--mode prod`) |
| `npm run build:dev` | 개발 모드 빌드 |
| `npm run build:prod` | 프로덕션 모드 빌드 |
| `npm run preview` | 개발 빌드 후 Wrangler 로컬 실행 |
| `npm run test:unit` | Vitest 단위 테스트 실행 |
| `npm run test:unit:ui` | Vitest UI 실행 |
| `npm run test:e2e` | Playwright E2E 테스트 실행 |
| `npm run deploy` | 프로덕션 빌드 후 Wrangler 배포 |
| `npm run check:validation-policy` | 백엔드와 공유하는 validation 정책 검사 |

## 환경변수

이 프로젝트는 Vite 환경변수만 사용합니다. `VITE_*` 값은 브라우저 번들에 포함될 수 있으므로 secret을 넣으면 안 됩니다.

필요한 키:

| 키 | 용도 |
| --- | --- |
| `VITE_BACKEND_URL` | SockJS/STOMP 채팅 연결 기준 URL |
| `VITE_API_V1_BASE` | Axios REST API base URL |
| `VITE_API_OAUTH2_KAKAO` | 카카오 OAuth 로그인 시작 URL |
| `VITE_API_OAUTH2_NAVER` | 네이버 OAuth 로그인 시작 URL |

보안상 민감한 위치와 주의점은 [docs/security-sensitive-areas.md](./docs/security-sensitive-areas.md)를 먼저 확인하세요.

## 문서

| 문서 | 내용 |
| --- | --- |
| [docs/frontend-architecture.md](./docs/frontend-architecture.md) | 앱 구조, 모듈 책임, 주요 흐름 |
| [docs/routes.md](./docs/routes.md) | 라우트 목록과 접근 제어 |
| [docs/api-and-auth.md](./docs/api-and-auth.md) | API 클라이언트, 인증, 토큰 갱신, 에러 처리 |
| [docs/development-guide.md](./docs/development-guide.md) | 화면/API/검증 추가 시 작업 방식 |
| [docs/security-sensitive-areas.md](./docs/security-sensitive-areas.md) | 민감 정보 위치와 취급 기준 |

## 현재 주의사항
- [tests/setup/vitest.setup.ts](./tests/setup/vitest.setup.ts)의 MSW 설정은 아직 placeholder 상태입니다.
- `.env.prod`는 Git에 추적되고 있습니다. 값 자체가 secret이면 안 되며, 변경 시 리뷰가 필요합니다.
