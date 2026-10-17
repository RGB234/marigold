import { flushPromises, shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AuthCallbackView from './AuthCallbackView.vue';

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(), replace: vi.fn(), clearPending: vi.fn(), clearSecurity: vi.fn(),
}));
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { auth_status: 'LOGIN_SUCCESS' } }),
  useRouter: () => ({ replace: mocks.replace, resolve: () => ({ fullPath: '/' }) }),
}));
vi.mock('@/auth/stores/auth', () => ({
  useAuthStore: () => ({ restoreSession: mocks.initialize, isAuthenticated: true, userId: 'user' }),
}));
vi.mock('@/shared/feedback/dialog/useDialog', () => ({ useDialog: () => ({ alert: vi.fn() }) }));
vi.mock('@/auth/utils/pendingAuth', () => ({
  getPendingAuthState: () => ({ redirectTo: '/chat', expectedUserId: 'user' }),
  clearPendingAuthState: mocks.clearPending,
}));
vi.mock('@/auth/utils/securityAccess', () => ({ clearSecurityAccess: mocks.clearSecurity, grantSecurityAccess: vi.fn() }));

describe('OAuth restoration retry', () => {
  it('preserves pending authentication on network failure and completes after retry', async () => {
    mocks.initialize.mockRejectedValueOnce({ isAxiosError: true, code: 'ERR_NETWORK' }).mockResolvedValueOnce(true);
    const wrapper = shallowMount(AuthCallbackView, {
      global: { stubs: { RequestErrorState: false, RetryButton: false } },
    });
    try {
      await flushPromises();
      expect(wrapper.get('[role="alert"]').text()).toContain('네트워크');
      expect(mocks.clearPending).not.toHaveBeenCalled();
      expect(mocks.clearSecurity).not.toHaveBeenCalled();
      expect(mocks.replace).not.toHaveBeenCalled();
      await wrapper.get('button').trigger('click');
      await flushPromises();
      expect(mocks.initialize).toHaveBeenCalledTimes(2);
      expect(mocks.clearPending).toHaveBeenCalledOnce();
      expect(mocks.replace).toHaveBeenCalledWith('/chat');
    } finally { wrapper.unmount(); }
  });
});
