import {Long_String, TSID_Long, TSID_String} from "@/global/types/common.ts";

export const RouteNames = {
  HOME: "Home",
  AUTH: {
    LOGIN: "login",
    SIGNUP: "signup",
    EMAIL_SIGNUP: "email_signup",
    CALLBACK: "callback",
  },
  ADOPTION: {
    LIST: "adoption_list",
    DETAIL: "adoption_detail",
    CREATE: "adoption_create",
    UPDATE: "adoption_update",
    ADOPTER_LIST: "adoption_adopter_list",
    WRITER_LIST: "adoption_writer_list",
    CHAT_LIST: "adoption_chat_list",
    DELETED: "adoption_deleted",
  },
  USER: {
    PROFILE: "user_profile",
    PROFILE_UPDATE: "user_profile_update",
    SECURITY_VERIFY: "user_security_verify",
    SECURITY: "user_security",
  },
  CHAT: {
    LIST: "chat_list",
    ROOM: "chat_room",
  },
} as const;

/**
 * 라우터 이동 시 파라미터를 강제하고 오타를 방지하기 위해 사용합니다.
 * 사용법: router.push(RouteHelper.adoption.detail(123))
 */
export const RouteHelper = {
  home: () => ({name: RouteNames.HOME}),
  auth: {
    login: () => ({name: RouteNames.AUTH.LOGIN}),
    signup: () => ({name: RouteNames.AUTH.SIGNUP}),
    emailSignup: () => ({name: RouteNames.AUTH.EMAIL_SIGNUP}),
    callback: () => ({name: RouteNames.AUTH.CALLBACK}),
  },
  adoption: {
    list: () => ({name: RouteNames.ADOPTION.LIST}),
    detail: (id: Long_String) => ({
      name: RouteNames.ADOPTION.DETAIL,
      params: {id: id},
    }),
    create: () => ({name: RouteNames.ADOPTION.CREATE}),
    update: (id: Long_String) => ({
      name: RouteNames.ADOPTION.UPDATE,
      params: {id: id},
    }),
    adopterList: (userId: TSID_String) => ({
      name: RouteNames.ADOPTION.ADOPTER_LIST,
      params: {userId: userId.toString()},
    }),
    writerList: (userId: TSID_String) => ({
      name: RouteNames.ADOPTION.WRITER_LIST,
      params: {userId: userId.toString()},
    }),
    chatList: (id: Long_String) => ({
      name: RouteNames.ADOPTION.CHAT_LIST,
      params: {id: id},
    }),
    deleted: () => ({name: RouteNames.ADOPTION.DELETED}),
  },
  user: {
    profile: (id: TSID_String) => ({
      name: RouteNames.USER.PROFILE,
      params: {userId: id.toString()},
    }),
    profileUpdate: () => ({name: RouteNames.USER.PROFILE_UPDATE}),
    securityVerify: () => ({name: RouteNames.USER.SECURITY_VERIFY}),
    security: () => ({name: RouteNames.USER.SECURITY}),
  },
  chat: {
    list: () => ({name: RouteNames.CHAT.LIST}),
    room: (roomId: TSID_Long) => ({
      name: RouteNames.CHAT.ROOM,
      params: {roomId: roomId},
      // params: {roomId: roomId},
    }),
  },
};
