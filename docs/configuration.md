# 설정과 환경변수

## 기준 파일

| 파일 | 책임 |
| --- | --- |
| [.env.example](../.env.example) | 필수 공개 URL 목록과 로컬 예제 |
| `.env.dev.local` | 개인 개발 설정, Git 제외 |
| `.env.prod` | Git으로 관리하는 운영 공개 URL |
| [vite.config.ts](../vite.config.ts) | 개발 서버·번들 설정 |
| [wrangler.jsonc](../wrangler.jsonc) | Cloudflare 배포 대상과 SPA 설정 |
| [package.json](../package.json) | 실행·빌드·배포 명령 |

`VITE_*`에는 비밀값을 넣지 않습니다. 기존 `.env.local`도 지원하지만 모든 모드에 적용되므로 새 개발 환경은 `.env.dev.local`을 사용합니다. 기존 파일을 복사하거나 이동할 때 값을 덮어쓰지 않습니다.

## 로컬 준비

`.env.example`을 `.env.dev.local`로 복사하고 URL을 조정한 뒤 `npm ci`, `npm run dev`를 실행합니다. 기본 프론트 포트는 8000, 백엔드 포트는 8080입니다. 환경파일 수정 후 개발 서버를 다시 시작합니다.

| 키 | 용도 |
| --- | --- |
| `VITE_BACKEND_URL` | 채팅 `/ws` 연결 기준 URL, 끝의 `/` 제외 |
| `VITE_API_V1_BASE` | `/api/v1`을 포함한 REST API 주소 |
| `VITE_API_OAUTH2_KAKAO` | Kakao OAuth 시작 주소 |
| `VITE_API_OAUTH2_NAVER` | Naver OAuth 시작 주소 |

## 모드와 우선순위

이 저장소의 모드 이름은 `dev`, `prod`입니다. `npm run prod`는 운영 URL을 사용하는 개발 서버이며 배포 명령은 아닙니다. `build:dev`와 `build:prod`는 각각 해당 모드의 URL을 넣어 번들을 만듭니다. Vite의 mode와 `NODE_ENV`는 별개이며 `build:dev`도 기본적으로 production 빌드입니다.

우선순위는 프로세스 환경변수 → `.env.[mode].local` → `.env.[mode]` → `.env.local` → `.env`입니다. 운영 공개값의 기준은 `.env.prod`이며 배포 환경변수로 같은 키를 중복 정의하지 않는 것을 원칙으로 합니다. 임시 재정의가 필요하면 배포 기록에 남깁니다.

환경변수는 빌드 시 번들에 반영됩니다. Cloudflare 실행 환경의 값을 바꾸는 것만으로 이미 빌드한 프론트 URL은 변경되지 않으므로 다시 빌드·배포합니다. [Vite 공식 문서](https://vite.dev/guide/env-and-mode)를 참고하세요.

## 변경 시 검사

변수 추가·삭제 시 코드와 `.env.example`을 함께 수정합니다. `npm run check:env -- prod`는 선택한 모드의 필수 값 누락을 검사하며 값은 출력하지 않습니다. 빌드 명령에도 이 검사가 포함됩니다.
