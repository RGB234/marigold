# 배포

운영 공개 URL은 `.env.prod`, 배포 대상은 [wrangler.jsonc](../wrangler.jsonc)가 기준입니다. [설정 안내](configuration.md)에서 환경변수 우선순위를 먼저 확인합니다.

## 검증과 배포

```sh
npm ci
npm run test:unit -- --run
npm run build:prod
```

빌드는 배포하지 않습니다. 결과 확인 후 Cloudflare 권한이 있는 환경에서 `npm run deploy`로 다시 빌드하고 배포합니다. `npm run preview`는 dev 모드 빌드와 Wrangler 로컬 실행이며 운영 배포 검증과 구분합니다.

배포 후 초기 화면과 직접 접근한 하위 라우트, 로그인·로그아웃, API 호출, 채팅 연결을 확인합니다. 프론트 주소와 백엔드 CORS·OAuth redirect 설정이 일치해야 합니다.

## 복구

문제가 생기면 직전 정상 배포를 Cloudflare 배포 이력에서 복원하거나 검증된 커밋과 당시 공개 환경설정으로 재빌드·배포합니다. 프론트만 복구해도 현재 백엔드 API와 호환되는지 확인합니다. 배포 기록에는 프론트 커밋, 연동 백엔드 버전, 설정 변경 여부를 남깁니다.
