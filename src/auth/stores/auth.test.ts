import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/global/api";
import { useAuthStore } from "@/auth/stores/auth";

vi.mock("@/global/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/user/utils/securityAccess", () => ({
  clearSecurityAccess: vi.fn(),
}));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);

describe("auth store initialization", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("does not refresh an anonymous session without a refresh token cookie", async () => {
    get.mockResolvedValueOnce({
      data: {
        data: {
          userId: null,
          authorities: [],
          refreshTokenPresent: false,
        },
      },
    } as never);

    await useAuthStore().initializeAuth();

    expect(get).toHaveBeenCalledTimes(1);
    expect(post).not.toHaveBeenCalled();
  });

  it("refreshes a session with a refresh token cookie and reloads its status", async () => {
    get
      .mockResolvedValueOnce({
        data: {
          data: {
            userId: null,
            authorities: [],
            refreshTokenPresent: true,
          },
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          data: {
            userId: "01ARZ3NDEKTSV",
            authorities: ["ROLE_PERSON"],
            refreshTokenPresent: true,
          },
        },
      } as never);
    post.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: "access-token",
        },
      },
    } as never);

    const authStore = useAuthStore();
    await authStore.initializeAuth();

    expect(post).toHaveBeenCalledWith("/auth/refresh", {}, { skipAlert: true });
    expect(get).toHaveBeenCalledTimes(2);
    expect(authStore.accessToken).toBe("access-token");
    expect(authStore.userId).toBe("01ARZ3NDEKTSV");
  });
});
