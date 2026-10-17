/** 동시에 발생한 인증 갱신 요청이 하나의 작업과 결과를 공유하도록 합니다. */
export class RefreshCoordinator<T> {
  private pending: Promise<T> | null = null;

  run(refresh: () => Promise<T>): Promise<T> {
    if (!this.pending) {
      this.pending = Promise.resolve()
        .then(refresh)
        .finally(() => {
          this.pending = null;
        });
    }
    return this.pending;
  }
}
