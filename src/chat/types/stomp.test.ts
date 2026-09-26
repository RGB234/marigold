import { describe, expect, it } from 'vitest';
import { parseStompErrorResponse } from './stomp';

describe('parseStompErrorResponse', () => {
  it('parses the STOMP error contract', () => {
    const error = parseStompErrorResponse(
      JSON.stringify({
        timestamp: '2026-09-25T12:00:00',
        errorCode: 'INVALID_INPUT_VALUE',
        message: '입력값이 올바르지 않습니다.',
        fatal: false,
      }),
    );

    expect(error?.errorCode).toBe('INVALID_INPUT_VALUE');
  });

  it('rejects malformed or unrelated payloads', () => {
    expect(parseStompErrorResponse('not-json')).toBeNull();
    expect(parseStompErrorResponse('{"message":"missing fields"}')).toBeNull();
  });
});
