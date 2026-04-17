import { createHmac } from 'crypto';
import { createRouteHandler } from '../src/handler';
import { registry } from '../src/functions';

function signBody(body: string, timestamp: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
}

function mockRequest(body: object, secret: string): Request {
  const bodyStr = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signBody(bodyStr, timestamp, secret);

  return new Request('http://localhost/api/__pingback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Pingback-Signature': signature,
      'X-Pingback-Timestamp': timestamp,
    },
    body: bodyStr,
  });
}

describe('createRouteHandler', () => {
  const TEST_SECRET = 'test-cron-secret-123';

  beforeEach(() => {
    (registry as any).functions = new Map();
    process.env.PINGBACK_CRON_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.PINGBACK_CRON_SECRET;
  });

  it('should return 200 with success result for a valid request', async () => {
    registry.cron('send-emails', '*/15 * * * *', async (ctx) => {
      ctx.log('processing');
      return { processed: 5 };
    });

    const handler = createRouteHandler();
    const req = mockRequest(
      { function: 'send-emails', executionId: 'exec-1', attempt: 1, scheduledAt: '2026-04-17T12:00:00.000Z' },
      TEST_SECRET,
    );

    const res = await handler(req);
    const data = await res.json() as any;

    expect(res.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.result).toEqual({ processed: 5 });
    expect(data.logs).toHaveLength(1);
    expect(data.logs[0].message).toBe('processing');
    expect(data.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should return 500 with error when handler throws', async () => {
    registry.cron('failing-job', '* * * * *', async () => {
      throw new Error('Something broke');
    });

    const handler = createRouteHandler();
    const req = mockRequest(
      { function: 'failing-job', executionId: 'exec-2', attempt: 1, scheduledAt: '2026-04-17T12:00:00.000Z' },
      TEST_SECRET,
    );

    const res = await handler(req);
    const data = await res.json() as any;

    expect(res.status).toBe(500);
    expect(data.status).toBe('error');
    expect(data.error).toBe('Something broke');
  });

  it('should return 401 for invalid signature', async () => {
    registry.cron('my-job', '* * * * *', async () => {});

    const handler = createRouteHandler();
    const bodyStr = JSON.stringify({
      function: 'my-job', executionId: 'exec-3', attempt: 1, scheduledAt: '2026-04-17T12:00:00.000Z',
    });

    const req = new Request('http://localhost/api/__pingback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pingback-Signature': 'invalid-signature',
        'X-Pingback-Timestamp': Math.floor(Date.now() / 1000).toString(),
      },
      body: bodyStr,
    });

    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it('should return 404 for unknown function', async () => {
    const handler = createRouteHandler();
    const req = mockRequest(
      { function: 'nonexistent', executionId: 'exec-4', attempt: 1, scheduledAt: '2026-04-17T12:00:00.000Z' },
      TEST_SECRET,
    );

    const res = await handler(req);
    expect(res.status).toBe(404);
  });

  it('should return 401 when PINGBACK_CRON_SECRET is not set', async () => {
    delete process.env.PINGBACK_CRON_SECRET;
    registry.cron('my-job', '* * * * *', async () => {});

    const handler = createRouteHandler();
    const req = mockRequest(
      { function: 'my-job', executionId: 'exec-5', attempt: 1, scheduledAt: '2026-04-17T12:00:00.000Z' },
      TEST_SECRET,
    );

    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it('should return 401 for expired timestamp', async () => {
    registry.cron('my-job', '* * * * *', async () => {});

    const handler = createRouteHandler();
    const bodyStr = JSON.stringify({
      function: 'my-job', executionId: 'exec-6', attempt: 1, scheduledAt: '2026-04-17T12:00:00.000Z',
    });
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString();
    const signature = signBody(bodyStr, oldTimestamp, TEST_SECRET);

    const req = new Request('http://localhost/api/__pingback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pingback-Signature': signature,
        'X-Pingback-Timestamp': oldTimestamp,
      },
      body: bodyStr,
    });

    const res = await handler(req);
    expect(res.status).toBe(401);
  });
});
