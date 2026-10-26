# Marigold Frontend

Marigold의 입양 게시글, 사용자 인증·프로필, 실시간 채팅을 제공하는 Vue 기반 SPA입니다. 기능별 코드는 도메인 디렉터리에 두고, 애플리케이션 조립·초기화·라우팅은 `app`, 도메인에 의존하지 않는 HTTP·오류·피드백·UI·검증 코드는 `shared`에서 관리합니다.

## 1. 기술 스택

- Vue 3, Vite, TypeScript
- Pinia, Vue Router, Vuetify
- Axios
- SockJS, STOMP
- Vitest, Vue Test Utils, Playwright
- Cloudflare Vite Plugin, Wrangler

의존성 범위는 `package.json`, 실제 설치 버전은 `package-lock.json`을 기준으로 합니다. Node.js 22.12 이상을 권장합니다.

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
| `npm run check:env` | `.env.example` 선언과 소스의 환경변수 참조 일치 여부 확인 |
| `npm run preview` | 개발 빌드 후 Wrangler로 로컬 미리보기 |
| `npm run check:validation-policy` | 백엔드와 검증 정책이 동기화되었는지 확인 |
| `npm run sync:validation-policy` | 백엔드의 검증 정책을 프론트엔드로 복사 |
| `npm run deploy` | 운영 빌드 후 Wrangler로 배포 |

`npm run deploy`를 실행하려면 대상 Cloudflare 계정에 대한 Wrangler 인증이 필요합니다.

### 검증 정책 동기화

검증 정책은 백엔드의 `ValidationPolicy.java`를 원본으로 관리합니다.

1. `back`에서 `./gradlew generateValidationPolicy`를 실행하여 `back/src/main/resources/validation-policy.json`을 생성합니다.
2. `front`에서 `npm run sync:validation-policy`를 실행하여 `front/src/shared/validation/validation-policy.json`을 갱신합니다.

기본 스크립트는 저장소 루트에 `back`과 `front`가 함께 있는 구조를 기준으로 합니다. 원본 JSON의 위치가 다르면 스크립트를 수정하는 대신 `VALIDATION_POLICY_SOURCE` 환경변수로 경로를 지정합니다.

## 3. 환경변수

| 변수 | 용도 |
| --- | --- |
| `VITE_BACKEND_URL` | SockJS/WebSocket 기본 주소 |
| `VITE_API_V1_BASE` | REST API 기본 주소 |
| `VITE_API_OAUTH2_KAKAO` | Kakao OAuth 시작 주소 |
| `VITE_API_OAUTH2_NAVER` | Naver OAuth 시작 주소 |

로컬 개발은 `.env.local`, 운영 빌드(`npm run build:prod`, `npm run deploy`)는 `.env.prod`를 읽습니다. 두 파일 모두 저장소에 포함하지 않으므로 `.env.example`을 복사해 환경에 맞는 주소로 채웁니다. 변수 목록의 원본은 `.env.example`이며, `npm run check:env`가 소스의 참조와 맞는지 확인합니다.

`VITE_*` 값은 브라우저 번들에 포함될 수 있으므로 비밀값을 넣지 않습니다.

## 4. 문서

| 문서 | 내용 |
| --- | --- |
| [아키텍처](docs/architecture.md) | 디렉터리와 의존 방향, 초기화, 인증 상태, 라우팅, HTTP client, 오류 표시, 업로드, 채팅 연결 |
| [백엔드 계약](../back/docs/contracts/http.md) | 응답·오류 형식. 같은 폴더에 [인증](../back/docs/contracts/auth.md), [업로드](../back/docs/contracts/uploads.md), [실시간](../back/docs/contracts/realtime.md) |

백엔드와 주고받는 형식과 규칙은 백엔드 계약 문서가 기준입니다. 프론트엔드 문서는 그 계약을 이 코드에서 어떻게 구현했는지만 설명합니다.
