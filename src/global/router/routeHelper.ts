import {Long_String, TSID_Long, TSID_String} from "@/global/types/common.ts";

export const RouteNames = {
  HOME: "Home",
  AUTH: {
    LOGIN: "Login",
    SIGNUP: "Signup",
    EMAIL_SIGNUP: "EmailSignup",
    CALLBACK: "AuthCallback",
  },
  ADOPTION: {
    LIST: "Adoption_list",
    DETAIL: "Adoption_detail",
    WRITE: "Adoption_write",
    EDIT: "Adoption_edit",
    HISTORY: "UserAdoption_list",
  },
  USER: {
    MY_PROFILE: "MyProfile",
    PROFILE: "Profile",
    PROFILE_EDIT: "Profile_edit",
  },
  CHAT: {
    MY_LIST: "MyChatRoom_list",
    ROOM: "ChatRoom",
  },
} as const;

/**
 * 중앙 집중식 Navigator
 * 라우터 이동 시 파라미터를 강제하고 오타를 방지하기 위해 사용합니다.
 * 사용법: router.push(Navigator.adoption.detail(123))
 */
export const Navigator = {
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
    write: () => ({name: RouteNames.ADOPTION.WRITE}),
    edit: (id: Long_String) => ({
      name: RouteNames.ADOPTION.EDIT,
      params: {id: id},
    }),
    history: (userId: TSID_String) => ({
      name: RouteNames.ADOPTION.HISTORY,
      params: {userId: userId.toString()},
    }),
  },
  user: {
    myProfile: () => ({name: RouteNames.USER.MY_PROFILE}),
    profile: (id: TSID_String) => ({
      name: RouteNames.USER.PROFILE,
      params: {id: id},
    }),
    profileEdit: () => ({name: RouteNames.USER.PROFILE_EDIT}),
  },
  chat: {
    myList: () => ({name: RouteNames.CHAT.MY_LIST}),
    room: (roomId: TSID_Long) => ({
      name: RouteNames.CHAT.ROOM,
      params: {roomId: roomId},
      // params: {roomId: roomId},
    }),
  },
};
