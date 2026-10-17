import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteHelper, RouteNames } from '@/shared/navigation/routeHelper';
import './index';

const mocks = vi.hoisted(() => ({
  beforeEach: vi.fn(), initialize: vi.fn(), toastError: vi.fn(), alert: vi.fn(),
  auth: { isAuthenticated: true },
}));
vi.mock('vue-router', () => ({
  createRouter: () => ({ beforeEach: mocks.beforeEach }), createWebHistory: vi.fn(),
}));
vi.mock('@/auth/stores/auth', () => ({
  useAuthStore: () => ({ ...mocks.auth, ensureInitialized: mocks.initialize }),
}));
vi.mock('@/shared/feedback/dialog/useDialog', () => ({ useDialog: () => ({ alert: mocks.alert }) }));
vi.mock('@/shared/feedback/toast/useToast', () => ({ useToast: () => ({ error: mocks.toastError }) }));

const guard = mocks.beforeEach.mock.calls[0][0];

describe('authentication navigation failures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.isAuthenticated = true;
    mocks.alert.mockResolvedValue(true);
  });

  it.each([true, false])('does not request login on a temporary status failure (existing route: %s)', async existingRoute => {
    const error = { isAxiosError: true, code: 'ERR_NETWORK' };
    mocks.initialize.mockRejectedValueOnce(error);
    const next = vi.fn();
    await guard({ meta: { requiresAuth: true } }, { matched: existingRoute ? [{}] : [] }, next);
    expect(next).toHaveBeenCalledWith(existingRoute ? false : RouteHelper.home());
    expect(mocks.toastError).toHaveBeenCalledWith(expect.any(String));
    expect(mocks.alert).not.toHaveBeenCalled();
  });

  it('redirects an unauthenticated user even when the alert is dismissed', async () => {
    mocks.initialize.mockResolvedValueOnce(true);
    mocks.auth.isAuthenticated = false;
    mocks.alert.mockResolvedValueOnce(false);
    const next = vi.fn();
    await guard({ meta: { requiresAuth: true } }, { matched: [] }, next);
    expect(next).toHaveBeenCalledWith(RouteHelper.auth.login());
  });

  it('restores authentication before a public route', async () => {
    mocks.initialize.mockResolvedValueOnce(undefined);
    const next = vi.fn();

    await guard({ name: RouteNames.HOME, meta: { requiresAuth: false } }, { matched: [] }, next);

    expect(mocks.initialize).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('lets the OAuth callback own its restoration flow', async () => {
    const next = vi.fn();

    await guard(
      { name: RouteNames.AUTH.CALLBACK, meta: { requiresAuth: false } },
      { matched: [] },
      next,
    );

    expect(mocks.initialize).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});
