import { RegistrationClient } from '../src/registration';

describe('RegistrationClient', () => {
  let client: RegistrationClient;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    client = new RegistrationClient('https://api.pingback.dev', 'pk_test_key');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sends registration request with correct payload', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ jobs: [] }),
    });

    await client.register(
      [
        {
          name: 'send-emails',
          type: 'cron' as const,
          schedule: '*/15 * * * *',
          options: { retries: 3, timeout: '60s', concurrency: 1 },
        },
      ],
      { projectId: 'proj_123' },
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.pingback.dev/api/v1/register',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer pk_test_key',
        },
        body: JSON.stringify({
          functions: [
            {
              name: 'send-emails',
              type: 'cron',
              schedule: '*/15 * * * *',
              options: { retries: 3, timeout: '60s', concurrency: 1 },
            },
          ],
          project_id: 'proj_123',
        }),
      },
    );
  });

  test('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    await expect(
      client.register([], { projectId: 'proj_123' }),
    ).rejects.toThrow('Registration failed (401): Unauthorized');
  });

  test('returns response data on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ jobs: [{ name: 'send-emails', status: 'active' }] }),
    });

    const result = await client.register(
      [{ name: 'send-emails', type: 'cron' as const, schedule: '* * * * *', options: {} }],
      { projectId: 'proj_123' },
    );

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].name).toBe('send-emails');
  });
});
