import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installHttpClient } from './installHttpClient';
import apiClient, { API_TIMEOUT_MS } from '@/shared/http/client';

function failure(config: InternalAxiosRequestConfig, status: number, errorCode = 'INTERNAL_SERVER_ERROR') {
  return new AxiosError('request failed', 'ERR_BAD_RESPONSE', config, undefined, {
    config, status, statusText: '', headers: {},
    data: { type: 'urn:test', title: 'error', status, errorCode },
  });
}
function install(client: AxiosInstance, auth: { accessToken: string; refreshAccessToken: ReturnType<typeof vi.fn> }) {
  installHttpClient(client, auth as unknown as Parameters<typeof installHttpClient>[1]);
}

describe('API interceptors', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('rejects concurrent failures without waiting for global UI', async () => {
    const client = axios.create({ adapter: async config => { throw failure(config, 500); } });
    install(client, { accessToken: '', refreshAccessToken: vi.fn() });
    const requests = await Promise.allSettled([client.get('/one'), client.get('/two')]);

    expect(requests.every(result => result.status === 'rejected')).toBe(true);
  });

  it('leaves failures to the caller', async () => {
    const client = axios.create({ adapter: async config => { throw failure(config, 409); } });
    install(client, { accessToken: '', refreshAccessToken: vi.fn() });
    await expect(client.patch('/profile', {})).rejects.toBeInstanceOf(AxiosError);
  });

  it('delegates refresh to the auth store and retries each request at most once', async () => {
    const attempts = new Map<string, number>();
    const client = axios.create({ adapter: async config => {
      const count = (attempts.get(config.url!) ?? 0) + 1;
      attempts.set(config.url!, count);
      if (count === 1) throw failure(config, 401, 'AUTH_TOKEN_EXPIRED');
      return { config, data: 'ok', headers: {}, status: 200, statusText: 'OK' };
    } });
    const auth = { accessToken: 'token', refreshAccessToken: vi.fn(async () => 'fresh-token') };
    install(client, auth);
    await Promise.all([client.get('/one'), client.get('/two')]);
    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(2);
    expect([...attempts.values()]).toEqual([2, 2]);
  });

  it('propagates a temporary refresh failure without redirecting', async () => {
    const temporary = new AxiosError('offline', 'ERR_NETWORK');
    const client = axios.create({ adapter: async config => { throw failure(config, 401, 'AUTH_TOKEN_EXPIRED'); } });
    const auth = { accessToken: 'token', refreshAccessToken: vi.fn().mockRejectedValue(temporary) };
    install(client, auth);
    await expect(client.get('/private')).rejects.toBe(temporary);
  });

  it('limits normal requests and keeps an explicit timeout', async () => {
    const received: number[] = [];
    const client = axios.create({ timeout: apiClient.defaults.timeout, adapter: async config => {
      received.push(config.timeout!);
      return { config, data: {}, headers: {}, status: 200, statusText: 'OK' };
    } });
    install(client, { accessToken: '', refreshAccessToken: vi.fn() });
    await client.get('/list');
    await client.post('/slow', {}, { timeout: 90_000 });
    expect(received).toEqual([API_TIMEOUT_MS, 90_000]);
    expect(API_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it('does not refresh again when the retried request also returns 401', async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      throw failure(config, 401, 'AUTH_TOKEN_EXPIRED');
    });
    const client = axios.create({ adapter });
    const auth = { accessToken: 'token', refreshAccessToken: vi.fn().mockResolvedValue('fresh-token') };
    install(client, auth);
    await expect(client.get('/private')).rejects.toBeInstanceOf(AxiosError);
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(auth.refreshAccessToken).toHaveBeenCalledOnce();
  });

});
