import { createHmac, timingSafeEqual } from 'crypto';

export function signPayload(payload: Record<string, unknown>, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

export function verifySignature(
  payload: Record<string, unknown>,
  signature: string,
  timestamp: number,
  secret: string,
): boolean {
  const age = Date.now() - timestamp;
  if (age > 5 * 60 * 1000) {
    return false;
  }

  const expected = signPayload(payload, secret);

  if (expected.length !== signature.length) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}
