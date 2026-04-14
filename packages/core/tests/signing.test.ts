import { signPayload, verifySignature } from '../src/signing';

describe('signing', () => {
  const secret = 'test-secret-key-256-bits-long-ok';
  const payload = {
    function: 'my-job',
    executionId: 'exec_123',
    attempt: 1,
    scheduledAt: '2026-04-14T10:30:00Z',
  };

  test('signPayload returns a hex string', () => {
    const signature = signPayload(payload, secret);
    expect(typeof signature).toBe('string');
    expect(signature).toMatch(/^[a-f0-9]+$/);
  });

  test('verifySignature returns true for valid signature', () => {
    const now = Date.now();
    const signature = signPayload(payload, secret);
    expect(verifySignature(payload, signature, now, secret)).toBe(true);
  });

  test('verifySignature returns false for wrong signature', () => {
    const now = Date.now();
    expect(verifySignature(payload, 'bad-signature', now, secret)).toBe(false);
  });

  test('verifySignature returns false for wrong secret', () => {
    const now = Date.now();
    const signature = signPayload(payload, secret);
    expect(verifySignature(payload, signature, now, 'wrong-secret')).toBe(false);
  });

  test('verifySignature returns false for expired timestamp (>5 min)', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000 - 1;
    const signature = signPayload(payload, secret);
    expect(verifySignature(payload, signature, fiveMinutesAgo, secret)).toBe(false);
  });

  test('verifySignature returns true for timestamp within 5 min', () => {
    const fourMinutesAgo = Date.now() - 4 * 60 * 1000;
    const signature = signPayload(payload, secret);
    expect(verifySignature(payload, signature, fourMinutesAgo, secret)).toBe(true);
  });

  test('different payloads produce different signatures', () => {
    const sig1 = signPayload(payload, secret);
    const sig2 = signPayload({ ...payload, attempt: 2 }, secret);
    expect(sig1).not.toBe(sig2);
  });
});
