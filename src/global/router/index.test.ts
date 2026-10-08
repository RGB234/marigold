import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteHelper } from './routeHelper';
import './index';

const mocks = vi.hoisted(() => ({
  beforeEach: vi.fn(), initialize: vi.fn(), apiError: vi.fn(), alert: vi.fn(),
  auth: { isLoggedIn: true },
}));
vi.mock('vue-router', () => ({
  createRouter: () => ({ beforeEach: mocks.beforeEach }), createWebHistory: vi.fn(),
}));
vi.mock('@/auth/stores/auth', () => ({
  useAuthStore: () => ({ ...mocks.auth, initializeAuth: mocks.initialize }),
}));
vi.mock('@/global/composables/useAlert', () => ({
  useAlert: () => ({ alert: mocks.alert, apiError: mocks.apiError }),
}));

const guard = mocks.beforeEach.mock.calls[0][0];

describe('authentication navigation failures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.isLoggedIn = true;
    mocks.alert.mockResolvedValue(true);
  });

  it.each([true, false])('does not request login on a temporary status failure (existing route: %s)', async existingRoute => {
    const error = { isAxiosError: true, code: 'ERR_NETWORK' };
    mocks.initialize.mockRejectedValueOnce(error);
    const next = vi.fn();
    await guard({ meta: { requiresAuth: true } }, { matched: existingRoute ? [{}] : [] }, next);
    expect(next).toHaveBeenCalledWith(existingRoute ? false : RouteHelper.home());
    expect(mocks.apiError).toHaveBeenCalledWith(error, expect.any(String));
    expect(mocks.alert).not.toHaveBeenCalled();
  });

  it('still redirects an unauthenticated user to login', async () => {
    mocks.initialize.mockResolvedValueOnce(true);
    mocks.auth.isLoggedIn = false;
    const next = vi.fn();
    await guard({ meta: { requiresAuth: true } }, { matched: [] }, next);
    expect(next).toHaveBeenCalledWith(RouteHelper.auth.login());
  });
});
