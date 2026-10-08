import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { installApiInterceptors } from './installApiInterceptors';
import { useAlertStore } from './stores/alert';
import { useLoadingStore } from './stores/loading';
import apiClient, { API_TIMEOUT_MS, UPLOAD_TIMEOUT_MS } from './apiClient';

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('@/global/router', () => ({ default: {
  currentRoute: { value: { meta: { requiresAuth: true } } },
  ...navigation,
} }));

function failure(config: InternalAxiosRequestConfig, status: number, errorCode = 'INTERNAL_SERVER_ERROR') {
  return new AxiosError('request failed', 'ERR_BAD_RESPONSE', config, undefined, {
    config, status, statusText: '', headers: {},
    data: { type: 'urn:test', title: 'error', status, errorCode },
  });
}
function install(client: AxiosInstance, auth: { accessToken: string; silentRefresh: ReturnType<typeof vi.fn>; resetAuthState: ReturnType<typeof vi.fn> }) {
  installApiInterceptors(client, auth as unknown as Parameters<typeof installApiInterceptors>[1]);
}

describe('API error handling', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('rejects both failed requests before the user closes any alert', async () => {
    const client = axios.create({ adapter: async config => { throw failure(config, 500); } });
    install(client, { accessToken: '', silentRefresh: vi.fn(), resetAuthState: vi.fn() });
    const settled = vi.fn();
    const requests = Promise.allSettled([client.get('/one'), client.get('/two')]).then(settled);
    await flushPromises();
    expect(settled).toHaveBeenCalledOnce();
    expect(useAlertStore().dialog.show).toBe(true);
    expect(useLoadingStore().requestCount).toBe(0);
    useAlertStore().handleDialogAction(true);
    useAlertStore().handleDialogAction(true);
    await requests;
  });

  it('leaves local failures to the caller', async () => {
    const client = axios.create({ adapter: async config => { throw failure(config, 409); } });
    install(client, { accessToken: '', silentRefresh: vi.fn(), resetAuthState: vi.fn() });
    await expect(client.patch('/profile', {}, { errorMode: 'local' })).rejects.toBeInstanceOf(AxiosError);
    expect(useAlertStore().dialog.show).toBe(false);
  });

  it('shares refresh and retries each request at most once', async () => {
    const attempts = new Map<string, number>();
    const client = axios.create({ adapter: async config => {
      const count = (attempts.get(config.url!) ?? 0) + 1;
      attempts.set(config.url!, count);
      if (count === 1) throw failure(config, 401, 'AUTH_TOKEN_EXPIRED');
      return { config, data: 'ok', headers: {}, status: 200, statusText: 'OK' };
    } });
    const auth = { accessToken: 'token', silentRefresh: vi.fn(async () => true), resetAuthState: vi.fn() };
    install(client, auth);
    await Promise.all([client.get('/one'), client.get('/two')]);
    expect(auth.silentRefresh).toHaveBeenCalledOnce();
    expect([...attempts.values()]).toEqual([2, 2]);
    expect(useAlertStore().dialog.show).toBe(false);
    expect(useLoadingStore().requestCount).toBe(0);
  });

  it('propagates a temporary refresh failure without resetting auth or redirecting', async () => {
    const temporary = new AxiosError('offline', 'ERR_NETWORK');
    const client = axios.create({ adapter: async config => { throw failure(config, 401, 'AUTH_TOKEN_EXPIRED'); } });
    const auth = { accessToken: 'token', silentRefresh: vi.fn().mockRejectedValue(temporary), resetAuthState: vi.fn() };
    install(client, auth);
    await expect(client.get('/private', { errorMode: 'local' })).rejects.toBe(temporary);
    expect(auth.resetAuthState).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(useAlertStore().dialog.show).toBe(false);
  });

  it('limits normal requests and gives multipart uploads a longer timeout', async () => {
    const received: number[] = [];
    const client = axios.create({ timeout: apiClient.defaults.timeout, adapter: async config => {
      received.push(config.timeout!);
      return { config, data: {}, headers: {}, status: 200, statusText: 'OK' };
    } });
    install(client, { accessToken: '', silentRefresh: vi.fn(), resetAuthState: vi.fn() });
    await client.get('/list');
    await client.post('/upload', new FormData());
    await client.post('/upload', new FormData(), { timeout: 90_000 });
    expect(received).toEqual([API_TIMEOUT_MS, UPLOAD_TIMEOUT_MS, 90_000]);
    expect(API_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it('does not refresh again when the retried request also returns 401', async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      throw failure(config, 401, 'AUTH_TOKEN_EXPIRED');
    });
    const client = axios.create({ adapter });
    const auth = { accessToken: 'token', silentRefresh: vi.fn().mockResolvedValue(true), resetAuthState: vi.fn() };
    install(client, auth);
    await expect(client.get('/private', { errorMode: 'local' })).rejects.toBeInstanceOf(AxiosError);
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(auth.silentRefresh).toHaveBeenCalledOnce();
    expect(useLoadingStore().requestCount).toBe(0);
  });

});
