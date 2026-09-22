import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatRoomView from './ChatRoomView.vue';

const mocks = vi.hoisted(() => ({
  clients: [] as any[],
  refresh: vi.fn(),
  replace: vi.fn(),
  auth: { accessToken: 'old-token', userId: 'user' } as any,
}));

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    activate = vi.fn();
    deactivate = vi.fn().mockResolvedValue(undefined);
    subscribe = vi.fn();
    constructor(options: any) {
      Object.assign(this, options);
      mocks.clients.push(this);
    }
  },
}));
vi.mock('sockjs-client', () => ({ default: vi.fn() }));
vi.mock('@/auth/stores/auth', () => ({
  useAuthStore: () => ({ ...mocks.auth, silentRefresh: mocks.refresh,
    get accessToken() { return mocks.auth.accessToken; } }),
}));
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { roomId: 'room' } }),
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
}));
vi.mock('@/global/api', () => ({
  CSRF_TOKEN_HEADER_NAME: 'X-CSRF-TOKEN', getCsrfToken: () => 'csrf',
}));
vi.mock('@/global/composables/useAlert', () => ({ useAlert: () => ({ toast: vi.fn() }) }));
vi.mock('@/chat/api/chat.api', () => ({
  getChatRoom: vi.fn().mockResolvedValue({ postId: 'post' }),
  getChatRoomMessages: vi.fn().mockResolvedValue([]),
  createChatFileMessage: vi.fn(), getChatAttachmentDownloadUrl: vi.fn(),
}));
vi.mock('@/adoption/api/adoptionPost.api', () => ({
  getAdoptionPostSummary: vi.fn().mockResolvedValue({ id: 'post' }),
}));

describe('chat connection authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clients.length = 0;
    mocks.auth.accessToken = 'old-token';
    mocks.refresh.mockImplementation(async () => {
      mocks.auth.accessToken = 'fresh-token';
      return true;
    });
  });

  it('refreshes CONNECT headers on reconnect and subscribes again', async () => {
    const wrapper = shallowMount(ChatRoomView);
    try {
      await flushPromises();
      const client = mocks.clients[0];
      await client.beforeConnect();
      expect(client.connectHeaders).toEqual({
        Authorization: 'Bearer fresh-token', 'X-CSRF-TOKEN': 'csrf',
      });
      client.onConnect();
      client.onWebSocketClose({ code: 4001 });
      mocks.refresh.mockImplementationOnce(async () => {
        mocks.auth.accessToken = 'renewed-token';
        return true;
      });
      await client.beforeConnect();
      client.onConnect();
      expect(client.connectHeaders.Authorization).toBe('Bearer renewed-token');
      expect(client.subscribe).toHaveBeenCalledTimes(2);
      expect(client.subscribe).toHaveBeenLastCalledWith('/sub/chat/room/room', expect.any(Function));
    } finally { wrapper.unmount(); }
  });

  it('stops reconnecting and requests login when refresh fails', async () => {
    const wrapper = shallowMount(ChatRoomView);
    try {
      await flushPromises();
      mocks.refresh.mockResolvedValueOnce(false);
      const client = mocks.clients[0];
      await client.beforeConnect();
      expect(client.reconnectDelay).toBe(0);
      expect(client.deactivate).toHaveBeenCalled();
      expect(mocks.replace).toHaveBeenCalled();
    } finally { wrapper.unmount(); }
  });

  it('does not update connection headers after unmount during refresh', async () => {
    const wrapper = shallowMount(ChatRoomView);
    await flushPromises();
    let finish!: (value: boolean) => void;
    mocks.refresh.mockImplementationOnce(() => new Promise<boolean>(resolve => { finish = resolve; }));
    const client = mocks.clients[0];
    const pending = client.beforeConnect();
    wrapper.unmount();
    finish(true);
    await pending;
    expect(client.connectHeaders).toBeUndefined();
    expect(client.deactivate).toHaveBeenCalled();
  });
});
