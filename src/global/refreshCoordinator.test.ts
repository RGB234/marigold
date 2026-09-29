import { describe, expect, it, vi } from "vitest";
import { RefreshCoordinator } from "@/global/refreshCoordinator";

describe("RefreshCoordinator", () => {
  it("동시에 들어온 요청은 하나의 갱신 작업을 공유한다", async () => {
    const coordinator = new RefreshCoordinator<string>();
    const refresh = vi.fn(async () => "new-token");

    const results = await Promise.all([
      coordinator.run(refresh),
      coordinator.run(refresh),
      coordinator.run(refresh),
    ]);

    expect(results).toEqual(["new-token", "new-token", "new-token"]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("실패도 모든 대기 요청에 전달되고 이후에는 다시 시도할 수 있다", async () => {
    const coordinator = new RefreshCoordinator<string>();
    const failure = new Error("refresh failed");
    const refresh = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce("new-token");

    const first = coordinator.run(refresh);
    const second = coordinator.run(refresh);

    await expect(first).rejects.toBe(failure);
    await expect(second).rejects.toBe(failure);
    await expect(coordinator.run(refresh)).resolves.toBe("new-token");
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
