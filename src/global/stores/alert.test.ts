import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAlertStore } from './alert';

describe('dialog queue', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('settles queued dialogs in order without sharing their answers', async () => {
    const store = useAlertStore();
    const confirmation = store.showConfirm('delete', 'confirm deletion');
    const alert = store.showAlert('error', 'request failed');
    expect(store.dialog.type).toBe('confirm');
    store.handleDialogAction(false);
    await expect(confirmation).resolves.toBe(false);
    expect(store.dialog.type).toBe('alert');
    expect(store.dialog.title).toBe('error');
    store.handleDialogAction(true);
    await expect(alert).resolves.toBe(true);
    expect(store.dialog.show).toBe(false);
  });
});
