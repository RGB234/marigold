# 문서 목차와 관리 규칙

- [코드 구조](frontend-architecture.md)
- [환경변수·모드·설정](configuration.md)
- [개발과 테스트](development-guide.md)
- [배포와 복구](deployment.md)
- [클라이언트 API·인증 구현](api-and-auth.md)
- [화면 접근 제어](routes.md)
- [민감 정보 취급](security-sensitive-areas.md)

## 정보의 기준

빠른 실행은 루트 README, 배포 절차는 deployment.md, 상세 문서 목록은 이 파일에서 관리합니다. 설정 기본값은 코드·설정파일, 변수 목록과 예제는 루트 .env.example, 로딩 방법과 모드별 차이는 configuration.md가 기준입니다. 같은 설명을 복제하기보다 담당 문서를 연결합니다.

API 상세 명세와 인증 계약은 백엔드가 소유하고 프론트 문서는 호출·상태 관리·화면 전환을 설명합니다. 검증 정책의 원본은 백엔드 Java ValidationPolicy이며 두 저장소의 JSON은 계약 검사로 확인합니다. 다른 저장소의 변경이 필요하면 PR에 상대 저장소의 PR 또는 커밋을 기록합니다.

## 변경과 함께 최신화

| 변경 | 함께 검토할 문서·파일 |
| --- | --- |
| 환경변수·설정 | .env.example, configuration.md, 배포 주입 설정 |
| 실행·배포 명령 | 루트 README, deployment.md |
| 인증·API 계약 | 백엔드 auth-flow.md·OpenAPI, 프론트 api-and-auth.md |
| Entity 관계 | 백엔드 erd.md |
| 라우트·접근 조건 | 프론트 routes.md |
| 검증 정책 | 백엔드 Java·JSON, 프론트 JSON, 계약 검사 |

코드와 문서는 같은 PR에서 수정합니다. PR 작성자가 영향 문서를 확인하고 변경이 없으면 사유를 적습니다. 문서 추가·이름 변경 시 이 목차도 수정합니다. 수동 수정일 대신 Git 이력을 사용합니다. 파일은 UTF-8로 저장합니다.
