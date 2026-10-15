import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDialogStore } from '@/app/feedback/dialog/dialog.store';
import { useToastStore } from '@/app/feedback/toast/toast.store';

describe('dialog queue', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('settles queued dialogs in order without sharing their answers', async () => {
    const store = useDialogStore();
    const confirmation = store.showConfirm('delete', 'confirm deletion');
    const alert = store.showAlert('error', 'request failed');
    expect(store.current.type).toBe('confirm');
    store.close(false);
    await expect(confirmation).resolves.toBe(false);
    expect(store.current.type).toBe('alert');
    expect(store.current.title).toBe('error');
    store.close(true);
    await expect(alert).resolves.toBe(true);
    expect(store.current.show).toBe(false);
  });
});

describe('toast state', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('opens transient feedback independently from dialogs', () => {
    vi.useFakeTimers();
    const store = useToastStore();

    store.open('saved', 'success');
    vi.runAllTimers();

    expect(store.show).toBe(true);
    expect(store.text).toBe('saved');
    expect(store.color).toBe('success');
    vi.useRealTimers();
  });
});
