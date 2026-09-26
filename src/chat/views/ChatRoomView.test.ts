import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatRoomView from './ChatRoomView.vue';

const mocks = vi.hoisted(() => ({
  clients: [] as any[],
  refresh: vi.fn(),
  replace: vi.fn(),
  toastError: vi.fn(),
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
vi.mock('@/global/composables/useAlert', () => ({
  useAlert: () => ({ toast: { error: mocks.toastError } }),
}));
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
      expect(client.subscribe).toHaveBeenCalledTimes(4);
      expect(client.subscribe).toHaveBeenNthCalledWith(3, '/user/queue/errors', expect.any(Function));
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

  it('shows a recoverable STOMP message error received from the user queue', async () => {
    const wrapper = shallowMount(ChatRoomView);
    try {
      await flushPromises();
      const client = mocks.clients[0];
      client.onConnect();
      const errorCallback = client.subscribe.mock.calls[0][1];

      errorCallback({
        body: JSON.stringify({
          timestamp: '2026-09-25T12:00:00',
          errorCode: 'INVALID_INPUT_VALUE',
          message: '메시지를 입력해주세요.',
          fatal: false,
          command: 'SEND',
          destination: '/pub/chat/message',
        }),
      });

      expect(mocks.toastError).toHaveBeenCalledWith('메시지를 입력해주세요.');
    } finally {
      wrapper.unmount();
    }
  });

  it('shows the JSON body from a fatal STOMP ERROR frame', async () => {
    const wrapper = shallowMount(ChatRoomView);
    try {
      await flushPromises();
      const client = mocks.clients[0];

      client.onStompError({
        headers: { message: 'fallback' },
        body: JSON.stringify({
          timestamp: '2026-09-25T12:00:00',
          errorCode: 'AUTH_TOKEN_INVALID',
          message: '토큰이 유효하지 않습니다.',
          fatal: true,
          command: 'CONNECT',
        }),
      });

      expect(mocks.toastError).toHaveBeenCalledWith('토큰이 유효하지 않습니다.');
      expect(client.deactivate).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
  });

  it('stops reconnecting after a non-retryable fatal STOMP error', async () => {
    const wrapper = shallowMount(ChatRoomView);
    try {
      await flushPromises();
      const client = mocks.clients[0];

      client.onStompError({
        headers: { message: '권한이 없습니다.' },
        body: JSON.stringify({
          timestamp: '2026-09-25T12:00:00',
          errorCode: 'AUTH_ACCESS_DENIED',
          message: '권한이 없습니다.',
          fatal: true,
          command: 'SUBSCRIBE',
          destination: '/sub/chat/room/room',
        }),
      });

      expect(client.reconnectDelay).toBe(0);
      expect(client.deactivate).toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
  });
});
