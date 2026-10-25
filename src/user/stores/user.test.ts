import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
} from "@/user/api/user.api";
import { useUserStore } from "@/user/stores/user";
import type { UserInfoDto } from "@/user/types/user";

vi.mock("@/user/api/user.api", () => ({
  getCurrentUserProfile: vi.fn(),
  updateCurrentUserProfile: vi.fn(),
}));

const getCurrentUser = vi.mocked(getCurrentUserProfile);
const updateCurrentUser = vi.mocked(updateCurrentUserProfile);

const profile = (id: string, nickname = "marigold"): UserInfoDto => ({
  id,
  nickname,
  imageUrl: null,
  status: "ACTIVE",
});

describe("user store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("loads the current user once for concurrent consumers", async () => {
    let finish!: (value: UserInfoDto) => void;
    getCurrentUser.mockImplementation(
      () => new Promise((resolve) => {
        finish = resolve;
      }),
    );

    const user = useUserStore();
    const first = user.loadCurrentUser("user-a");
    const second = user.loadCurrentUser("user-a");
    finish(profile("user-a"));

    await Promise.all([first, second]);
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(user.profile?.nickname).toBe("marigold");
    expect(user.phase).toBe("ready");
  });

  it("does not restore a profile after the session was cleared", async () => {
    let finish!: (value: UserInfoDto) => void;
    getCurrentUser.mockImplementation(
      () => new Promise((resolve) => {
        finish = resolve;
      }),
    );

    const user = useUserStore();
    const pending = user.loadCurrentUser("user-a");
    user.clearCurrentUser();
    finish(profile("user-a"));
    await pending;

    expect(user.ownerId).toBeNull();
    expect(user.profile).toBeNull();
    expect(user.phase).toBe("idle");
  });

  it("ignores the older response after an account switch", async () => {
    const finishes: Array<(value: UserInfoDto) => void> = [];
    getCurrentUser.mockImplementation(
      () => new Promise((resolve) => {
        finishes.push(resolve);
      }),
    );

    const user = useUserStore();
    const first = user.loadCurrentUser("user-a");
    const second = user.loadCurrentUser("user-b");
    finishes[1](profile("user-b", "second"));
    finishes[0](profile("user-a", "first"));
    await Promise.all([first, second]);

    expect(user.ownerId).toBe("user-b");
    expect(user.profile?.nickname).toBe("second");
  });

  it("applies the profile returned by an update", async () => {
    getCurrentUser.mockResolvedValue(profile("user-a", "before"));
    updateCurrentUser.mockResolvedValue(profile("user-a", "after"));

    const user = useUserStore();
    await user.loadCurrentUser("user-a");
    await user.updateCurrentUser({ nickname: "after", removeImage: false }, null);

    expect(user.profile?.nickname).toBe("after");
    expect(user.phase).toBe("ready");
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("rejects a profile that does not belong to the authenticated session", async () => {
    getCurrentUser.mockResolvedValue(profile("user-b"));

    const user = useUserStore();

    await expect(user.loadCurrentUser("user-a")).rejects.toThrow(
      "Current user profile does not match the authenticated session",
    );
    expect(user.profile).toBeNull();
    expect(user.phase).toBe("error");
  });
});
