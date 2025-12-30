/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_HOME: string

  readonly VITE_APP_AUTH_LOGIN: string
  readonly VITE_APP_AUTH_LOGIN_CALLBACK: string
  readonly VITE_APP_AUTH_SIGNUP: string
  
  readonly VITE_APP_ADOPTION: string
  readonly VITE_APP_ADOPTION_WRITE: string

  readonly VITE_APP_PROFILE: string
  
  readonly VITE_API_OAUTH2_LOGIN_KAKAO: string
  readonly VITE_API_OAUTH2_LOGIN_NAVER: string
  readonly VITE_API_AUTH_STATUS: string
  readonly VITE_API_AUTH_LOGOUT: string

  readonly VITE_API_ADOPTION: string
  readonly VITE_API_ADOPTION_CREATE: string
  readonly VITE_API_ADOPTION_SEARCH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}