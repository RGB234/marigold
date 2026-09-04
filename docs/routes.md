# 라우트 문서

라우트 정의는 [../src/global/router/index.ts](../src/global/router/index.ts)에 있습니다. 코드에서 이동할 때는 문자열 path를 직접 만들기보다 [../src/global/router/routeHelper.ts](../src/global/router/routeHelper.ts)의 `RouteHelper`를 사용합니다.

## 접근 제어 기준

| meta | 의미 |
| --- | --- |
| `requiresAuth: true` | 로그인 필요 |
| `requiresRecentAuth: true` | 최근 보안 인증 필요 |
| `roles` | 권한 목록 중 하나 필요 |

## 라우트 목록

| 이름 | Path | 컴포넌트 | 접근 |
| --- | --- | --- | --- |
| `Home` | `/` | `adoption/views/AdoptionPostListView.vue` | 공개 |
| `callback` | `/auth/callback` | `auth/views/AuthCallbackView.vue` | 공개 |
| `login` | `/auth/login` | `auth/views/LoginView.vue` | 공개 |
| `signup` | `/auth/signup` | `auth/views/SignupView.vue` | 공개 |
| `email_signup` | `/auth/signup/email` | `auth/views/EmailSignupView.vue` | 공개 |
| `adoption_list` | `/adoption` | `adoption/views/AdoptionPostListView.vue` | 공개 |
| `adoption_create` | `/adoption/create` | `adoption/views/AdoptionPostCreateView.vue` | 로그인 필요 |
| `adoption_deleted` | `/adoption/deleted` | `adoption/views/AdoptionPostDeletedView.vue` | 공개 |
| `adoption_detail` | `/adoption/:id` | `adoption/views/AdoptionPostDetailView.vue` | 공개 |
| `adoption_update` | `/adoption/:id/update` | `adoption/views/AdoptionPostUpdateView.vue` | 로그인 필요 |
| `adoption_writer_list` | `/adoption/writer/:userId` | `adoption/views/AdoptionPostListByWriterView.vue` | 로그인 필요 |
| `adoption_chat_list` | `/adoption/:id/chats` | `adoption/views/AdoptionPostChatListView.vue` | 로그인 필요 |
| `adoption_adopter_list` | `/adoption/adopter/:userId` | `adoption/views/AdoptionPostListByAdopterView.vue` | 로그인 필요 |
| `user_security_verify` | `/user/profile/security/verify` | `user/views/ProfileSecurityAccessView.vue` | 로그인 필요 |
| `user_security` | `/user/profile/security` | `user/views/ProfileSecurityView.vue` | 로그인 + 최근 인증 필요 |
| `user_profile` | `/user/profile/:userId` | `user/views/ProfileView.vue` | 로그인 필요 |
| `user_profile_update` | `/user/profile/update` | `user/views/ProfileUpdateView.vue` | 로그인 필요 |
| `chat_list` | `/chat` | `chat/views/MyChatRoomListView.vue` | 로그인 필요 |
| `chat_room` | `/chat/:roomId` | `chat/views/ChatRoomView.vue` | 로그인 필요 |

## 최근 인증 흐름

`/user/profile/security`는 `requiresRecentAuth`가 켜져 있습니다. 접근 시 [../src/user/utils/securityAccess.ts](../src/user/utils/securityAccess.ts)의 sessionStorage 상태를 확인합니다.

최근 인증이 없으면 `/user/profile/security/verify`로 이동합니다. OAuth 재인증 또는 이메일 비밀번호 재로그인 후 5분 동안 보안 페이지 접근이 허용됩니다.

이 sessionStorage 값은 보안상 민감한 흐름 제어 정보입니다. 자세한 내용은 [security-sensitive-areas.md](./security-sensitive-areas.md)를 확인하세요.
