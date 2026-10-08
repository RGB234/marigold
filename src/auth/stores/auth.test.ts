import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/global/apiClient";
import { useAuthStore } from "@/auth/stores/auth";

vi.mock("@/global/apiClient", () => ({
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
        userId: null,
        authorities: [],
        refreshTokenPresent: false,
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
          userId: null,
          authorities: [],
          refreshTokenPresent: true,
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          userId: "01ARZ3NDEKTSV",
          authorities: ["ROLE_PERSON"],
          refreshTokenPresent: true,
        },
      } as never);
    post.mockResolvedValueOnce({
      data: {
        accessToken: "access-token",
      },
    } as never);

    const authStore = useAuthStore();
    await authStore.initializeAuth();

    expect(post).toHaveBeenCalledWith("/auth/refresh", {}, {
      errorMode: "local",
      skipAuthRefresh: true,
    });
    expect(get).toHaveBeenCalledTimes(2);
    expect(authStore.accessToken).toBe("access-token");
    expect(authStore.userId).toBe("01ARZ3NDEKTSV");
  });

  it('preserves authentication and the cause when refresh fails temporarily', async () => {
    const failure = { isAxiosError: true, code: 'ERR_NETWORK' };
    const auth = useAuthStore();
    auth.$patch({ id: '01ARZ3NDEKTSV', accessToken: 'existing-token', authorities: ['ROLE_PERSON'] });
    post.mockRejectedValueOnce(failure);
    await expect(auth.silentRefresh()).rejects.toBe(failure);
    expect(auth.userId).toBe('01ARZ3NDEKTSV');
    expect(auth.accessToken).toBe('existing-token');
    expect(auth.authorities).toEqual(['ROLE_PERSON']);
  });

  it('clears authentication when the refresh token is rejected with 401', async () => {
    const auth = useAuthStore();
    auth.$patch({ id: '01ARZ3NDEKTSV', accessToken: 'existing-token' });
    post.mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } });
    await expect(auth.silentRefresh()).resolves.toBe(false);
    expect(auth.accessToken).toBeNull();
    expect(auth.userId).toBeNull();
  });

  it('does not clear authentication when the status endpoint is unavailable', async () => {
    const auth = useAuthStore();
    auth.$patch({ id: '01ARZ3NDEKTSV', accessToken: 'existing-token' });
    const failure = { isAxiosError: true, response: { status: 503 } };
    get.mockRejectedValueOnce(failure);
    await expect(auth.initializeAuth()).rejects.toBe(failure);
    expect(auth.accessToken).toBe('existing-token');
  });

});
