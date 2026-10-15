import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import RetryButton from './RetryButton.vue';

describe('RetryButton', () => {
  it('renders the default label and forwards click events', async () => {
    const onClick = vi.fn();
    const wrapper = mount(RetryButton, { attrs: { onClick } });

    expect(wrapper.text()).toBe('다시 시도');
    await wrapper.get('button').trigger('click');

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('forwards the disabled attribute to the button', () => {
    const wrapper = mount(RetryButton, { attrs: { disabled: true } });

    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
  });
});
