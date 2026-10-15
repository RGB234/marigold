import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAuthStatus,
  loginWithPassword,
  refreshAuthSession,
  requestLogout,
} from "@/auth/api/auth.api";
import { clearCsrfToken } from "@/shared/api/apiClient";
import { useAuthStore } from "@/auth/stores/auth";
import type { AuthSession } from "@/auth/types/auth";

vi.mock("@/auth/api/auth.api", () => ({
  getAuthStatus: vi.fn(),
  loginWithPassword: vi.fn(),
  refreshAuthSession: vi.fn(),
  requestLogout: vi.fn(),
}));

vi.mock("@/auth/utils/pendingAuth", () => ({
  clearPendingAuthState: vi.fn(),
}));

vi.mock("@/auth/utils/securityAccess", () => ({
  clearSecurityAccess: vi.fn(),
}));

vi.mock("@/shared/api/apiClient", () => ({
  clearCsrfToken: vi.fn(),
}));

const status = vi.mocked(getAuthStatus);
const login = vi.mocked(loginWithPassword);
const refresh = vi.mocked(refreshAuthSession);
const logout = vi.mocked(requestLogout);
const clearCsrf = vi.mocked(clearCsrfToken);

const session = (token = "access-token", userId = "01ARZ3NDEKTSV"): AuthSession => ({
  accessToken: token,
  principal: {
    userId,
    authorities: ["ROLE_PERSON"],
  },
});

describe("auth store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("restores an anonymous session without refreshing", async () => {
    status.mockResolvedValue({ refreshTokenPresent: false });

    const auth = useAuthStore();
    await auth.ensureInitialized();

    expect(auth.phase).toBe("anonymous");
    expect(auth.isAuthenticated).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("restores a complete session without a second status request", async () => {
    status.mockResolvedValue({ refreshTokenPresent: true });
    refresh.mockResolvedValue(session());

    const auth = useAuthStore();
    await auth.ensureInitialized();

    expect(status).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(auth.phase).toBe("authenticated");
    expect(auth.accessToken).toBe("access-token");
    expect(auth.userId).toBe("01ARZ3NDEKTSV");
    expect(auth.authorities).toEqual(["ROLE_PERSON"]);
  });

  it("shares concurrent initialization", async () => {
    let finishStatus!: (value: { refreshTokenPresent: boolean }) => void;
    status.mockImplementation(
      () => new Promise((resolve) => {
        finishStatus = resolve;
      }),
    );

    const auth = useAuthStore();
    const first = auth.ensureInitialized();
    const second = auth.ensureInitialized();
    finishStatus({ refreshTokenPresent: false });

    await Promise.all([first, second]);
    expect(status).toHaveBeenCalledTimes(1);
  });

  it("commits local login as one complete session", async () => {
    login.mockResolvedValue(session("login-token"));

    const auth = useAuthStore();
    await auth.signInWithPassword({ email: "user@example.com", password: "password" });

    expect(auth.phase).toBe("authenticated");
    expect(auth.accessToken).toBe("login-token");
    expect(status).not.toHaveBeenCalled();
  });

  it("preserves an authenticated session when refresh fails temporarily", async () => {
    login.mockResolvedValue(session("existing-token"));
    const failure = { isAxiosError: true, code: "ERR_NETWORK" };
    refresh.mockRejectedValue(failure);

    const auth = useAuthStore();
    await auth.signInWithPassword({ email: "user@example.com", password: "password" });

    await expect(auth.refreshAccessToken()).rejects.toBe(failure);
    expect(auth.phase).toBe("authenticated");
    expect(auth.accessToken).toBe("existing-token");
  });

  it("does not partially apply an invalid refresh response", async () => {
    login.mockResolvedValue(session("existing-token"));
    refresh.mockResolvedValue({ accessToken: "new-token", principal: null } as unknown as AuthSession);

    const auth = useAuthStore();
    await auth.signInWithPassword({ email: "user@example.com", password: "password" });

    await expect(auth.refreshAccessToken()).rejects.toThrow(
      "Invalid authentication session response",
    );
    expect(auth.phase).toBe("authenticated");
    expect(auth.accessToken).toBe("existing-token");
    expect(auth.userId).toBe("01ARZ3NDEKTSV");
  });

  it("invalidates the whole session when refresh is rejected", async () => {
    login.mockResolvedValue(session("existing-token"));
    refresh.mockRejectedValue({ isAxiosError: true, response: { status: 401 } });

    const auth = useAuthStore();
    await auth.signInWithPassword({ email: "user@example.com", password: "password" });

    await expect(auth.refreshAccessToken()).resolves.toBeNull();
    expect(auth.phase).toBe("anonymous");
    expect(auth.accessToken).toBeNull();
    expect(auth.userId).toBeNull();
  });

  it("shares concurrent token refresh", async () => {
    login.mockResolvedValue(session("existing-token"));
    let finishRefresh!: (value: AuthSession) => void;
    refresh.mockImplementation(
      () => new Promise((resolve) => {
        finishRefresh = resolve;
      }),
    );

    const auth = useAuthStore();
    await auth.signInWithPassword({ email: "user@example.com", password: "password" });
    const first = auth.refreshAccessToken();
    const second = auth.refreshAccessToken();
    await Promise.resolve();
    finishRefresh(session("fresh-token"));

    await expect(Promise.all([first, second])).resolves.toEqual(["fresh-token", "fresh-token"]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("always clears the local session when logout fails", async () => {
    login.mockResolvedValue(session());
    logout.mockRejectedValue({ isAxiosError: true, code: "ERR_NETWORK" });

    const auth = useAuthStore();
    await auth.signInWithPassword({ email: "user@example.com", password: "password" });
    await auth.signOut();

    expect(auth.phase).toBe("anonymous");
    expect(auth.userId).toBeNull();
    expect(clearCsrf).not.toHaveBeenCalled();
  });

  it("clears the CSRF token after successful logout", async () => {
    login.mockResolvedValue(session());
    logout.mockResolvedValue(undefined);

    const auth = useAuthStore();
    await auth.signInWithPassword({ email: "user@example.com", password: "password" });
    await auth.signOut();

    expect(clearCsrf).toHaveBeenCalledOnce();
  });

  it("does not revive a session when refresh finishes after logout", async () => {
    login.mockResolvedValue(session("existing-token"));
    logout.mockResolvedValue(undefined);
    let finishRefresh!: (value: AuthSession) => void;
    refresh.mockImplementation(
      () => new Promise((resolve) => {
        finishRefresh = resolve;
      }),
    );

    const auth = useAuthStore();
    await auth.signInWithPassword({ email: "user@example.com", password: "password" });
    const pendingRefresh = auth.refreshAccessToken();
    await auth.signOut();
    finishRefresh(session("late-token"));

    await expect(pendingRefresh).resolves.toBeNull();
    expect(auth.phase).toBe("anonymous");
    expect(auth.accessToken).toBeNull();
  });

  it("ignores a stale refresh rejection after a newer login", async () => {
    login
      .mockResolvedValueOnce(session("existing-token"))
      .mockResolvedValueOnce(session("new-login-token"));
    let failRefresh!: (reason: unknown) => void;
    refresh.mockImplementation(
      () => new Promise((_resolve, reject) => {
        failRefresh = reject;
      }),
    );

    const auth = useAuthStore();
    await auth.signInWithPassword({ email: "user@example.com", password: "password" });
    const pendingRefresh = auth.refreshAccessToken();
    await auth.signInWithPassword({ email: "user@example.com", password: "password" });
    failRefresh({ isAxiosError: true, response: { status: 401 } });

    await expect(pendingRefresh).resolves.toBe("new-login-token");
    expect(auth.phase).toBe("authenticated");
    expect(auth.accessToken).toBe("new-login-token");
  });
});
