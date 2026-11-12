// 서버는 이미 회전된 refresh token이 다시 오면 탈취로 보고 세션을 폐기하므로,
// 같은 refresh 쿠키를 쓰는 다른 탭과도 갱신이 겹치지 않게 한다.
export const REFRESH_LOCK_NAME = "marigold-auth-refresh";

/** 동시에 발생한 인증 갱신 요청이 하나의 작업과 결과를 공유하고, 다른 탭의 갱신과는 차례로 실행되도록 합니다. */
export class RefreshCoordinator<T> {
  private pending: Promise<T> | null = null;

  run(refresh: () => Promise<T>): Promise<T> {
    if (!this.pending) {
      this.pending = runExclusively(refresh).finally(() => {
        this.pending = null;
      });
    }
    return this.pending;
  }
}

function runExclusively<T>(task: () => Promise<T>): Promise<T> {
  // Web Locks가 없는 환경에서는 탭 안의 중복 제거만 한다.
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  if (!locks) {
    return Promise.resolve().then(task);
  }
  return locks.request(REFRESH_LOCK_NAME, () => task());
}
