# Marigold Frontend

Marigold 프론트엔드 애플리케이션입니다. Vue 3, Vite, Pinia, Vue Router, Vuetify를 사용하며 `back` 저장소의 백엔드 API와 통신합니다.

## 빠른 시작

Node.js 22 이상을 준비하고 [.env.example](.env.example)을 `.env.dev.local`로 복사한 뒤 URL을 확인합니다. 기존 파일은 덮어쓰지 않습니다. 자세한 로딩 규칙은 [설정 안내](docs/configuration.md)를 봅니다.

```bash
npm ci
npm run dev
```

개발 서버 포트는 [vite.config.ts](./vite.config.ts)의 `server.port` 값에 따라 기본 `8000`입니다.

## 주요 명령어

| 명령어 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (`--mode dev`) |
| `npm run prod` | 운영 URL을 사용하는 개발 서버 실행 (`--mode prod`) |
| `npm run build:dev` | dev 환경설정을 반영한 빌드 |
| `npm run build:prod` | prod 환경설정을 반영한 빌드 |
| `npm run preview` | 개발 빌드 후 Wrangler 로컬 실행 |
| `npm run test:unit` | Vitest 단위 테스트 실행 |
| `npm run test:unit:ui` | Vitest UI 실행 |
| `npm run test:e2e` | Playwright E2E 테스트 실행 |
| `npm run deploy` | 프로덕션 빌드 후 Wrangler 배포 |
| `npm run check:validation-policy` | 백엔드와 공유하는 validation 정책 검사 |
| `npm run check:env -- prod` | 운영 모드 필수 환경변수 누락 검사 |

## 환경변수

이 프로젝트는 Vite 환경변수만 사용합니다. `VITE_*` 값은 브라우저 번들에 포함될 수 있으므로 secret을 넣으면 안 됩니다.

변수 목록은 [.env.example](.env.example), 용도와 우선순위는 [설정 안내](docs/configuration.md)가 기준입니다.

보안상 민감한 위치와 주의점은 [docs/security-sensitive-areas.md](./docs/security-sensitive-areas.md)를 먼저 확인하세요.

## 문서

[전체 문서와 관리 규칙](docs/README.md)에서 주제별 문서를 찾습니다.

## 현재 주의사항
- [tests/setup/vitest.setup.ts](./tests/setup/vitest.setup.ts)의 MSW 설정은 아직 placeholder 상태입니다.
- `.env.prod`는 Git에 추적되고 있습니다. 값 자체가 secret이면 안 되며, 변경 시 리뷰가 필요합니다.
