import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { useAlertStore } from './stores/alert';
import ProfileUpdateView from '@/user/views/ProfileUpdateView.vue';
import AdoptionPostCreateView from '@/adoption/views/AdoptionPostCreateView.vue';
import MyChatRoomListView from '@/chat/views/MyChatRoomListView.vue';
import AdoptionCommentList from '@/adoption/components/AdoptionCommentList.vue';

const mocks = vi.hoisted(() => ({
  updateProfile: vi.fn(), createPost: vi.fn(), getRooms: vi.fn(), getComments: vi.fn(),
  push: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/auth/stores/auth', () => ({ useAuthStore: () => ({ userId: '01ARZ3NDEKTSV' }) }));
vi.mock('@/user/api/user.api', () => ({
  getUserProfile: vi.fn().mockResolvedValue({ nickname: '기존닉네임', imageUrl: '' }),
  updateUserProfile: mocks.updateProfile,
}));
vi.mock('@/adoption/api/adoptionPost.api', () => ({
  createAdoptionPost: mocks.createPost, getAdoptionComments: mocks.getComments,
}));
vi.mock('@/chat/api/chat.api', () => ({ getMyChatRooms: mocks.getRooms }));
vi.mock('@/global/validation/validators', async importOriginal => ({
  ...await importOriginal<typeof import('@/global/validation/validators')>(),
  validateAdoptionPostForm: () => [],
}));

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  mocks.getRooms.mockReset();
  mocks.getComments.mockReset();
});

describe('local save errors', () => {
  it('shows a profile failure while keeping input', async () => {
    const failure = new AxiosError('offline', 'ERR_NETWORK');
    mocks.updateProfile.mockRejectedValueOnce(failure);
    const wrapper = shallowMount(ProfileUpdateView);
    try {
      await flushPromises();
      await wrapper.get('#nickname').setValue('수정닉네임');
      await wrapper.get('form').trigger('submit');
      await flushPromises();
      expect(wrapper.get('[role="alert"]').text()).toContain('네트워크');
      expect((wrapper.get('#nickname').element as HTMLInputElement).value).toBe('수정닉네임');
      expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined();
      expect(mocks.push).not.toHaveBeenCalled();
    } finally { wrapper.unmount(); }
  });

  it('retains inline field errors without an additional general error', async () => {
    mocks.updateProfile.mockRejectedValueOnce({ isAxiosError: true, response: { status: 400, data: {
      type: 'urn:test', title: 'Bad Request', status: 400,
      errors: [{ field: 'nickname', message: '닉네임 확인 필요' }],
    } } });
    const wrapper = shallowMount(ProfileUpdateView);
    try {
      await flushPromises();
      await wrapper.get('form').trigger('submit');
      await flushPromises();
      expect(wrapper.text()).toContain('닉네임 확인 필요');
      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    } finally { wrapper.unmount(); }
  });

  it('shows a post save failure even without Problem Details', async () => {
    const failure = new AxiosError('offline', 'ERR_NETWORK');
    mocks.createPost.mockRejectedValueOnce(failure);
    const store = useAlertStore();
    const toast = vi.spyOn(store, 'showToast');
    const wrapper = shallowMount(AdoptionPostCreateView);
    try {
      await wrapper.get('.btn-row .button:not(.secondary)').trigger('click');
      await flushPromises();
      expect(toast).toHaveBeenCalledWith(expect.stringContaining('다시 시도'), 'error');
      expect(mocks.push).not.toHaveBeenCalled();
    } finally { wrapper.unmount(); }
  });
});

describe.each([
  { name: 'chat rooms', mount: () => shallowMount(MyChatRoomListView), request: mocks.getRooms,
    result: { content: [] }, empty: '문의한 채팅 내역이 없습니다.' },
  { name: 'comments', mount: () => shallowMount(AdoptionCommentList, { props: { postId: '1', canComment: false } }),
    request: mocks.getComments, result: [], empty: '아직 등록된 댓글이 없습니다.' },
])('$name load recovery', ({ mount, request, result, empty }) => {
  it('distinguishes failure from empty results and allows retry', async () => {
    request.mockRejectedValueOnce(new AxiosError('offline', 'ERR_NETWORK')).mockResolvedValueOnce(result);
    const wrapper = mount();
    try {
      await flushPromises();
      expect(wrapper.get('[role="alert"]').text()).toContain('네트워크');
      expect(wrapper.text()).not.toContain(empty);
      await wrapper.get('[role="alert"] button').trigger('click');
      await flushPromises();
      expect(request).toHaveBeenCalledTimes(2);
      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
      expect(wrapper.text()).toContain(empty);
    } finally { wrapper.unmount(); }
  });
});
