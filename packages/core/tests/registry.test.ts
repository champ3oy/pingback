import { Registry } from '../src/registry';

describe('Registry', () => {
  let registry: Registry;

  beforeEach(() => {
    registry = new Registry();
  });

  test('registers a cron function', () => {
    const handler = async () => ({ done: true });
    registry.cron('my-job', '*/15 * * * *', handler, { retries: 3 });

    const fn = registry.get('my-job');
    expect(fn).toBeDefined();
    expect(fn!.name).toBe('my-job');
    expect(fn!.type).toBe('cron');
    expect(fn!.schedule).toBe('*/15 * * * *');
    expect(fn!.options.retries).toBe(3);
  });

  test('registers a task function', () => {
    const handler = async () => ({ sent: true });
    registry.task('send-email', handler, { retries: 2, timeout: '15s' });

    const fn = registry.get('send-email');
    expect(fn).toBeDefined();
    expect(fn!.name).toBe('send-email');
    expect(fn!.type).toBe('task');
    expect(fn!.schedule).toBeUndefined();
  });

  test('returns undefined for unregistered function', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  test('lists all registered functions', () => {
    registry.cron('job-a', '* * * * *', async () => {});
    registry.task('task-b', async () => {});

    const all = registry.getAll();
    expect(all).toHaveLength(2);
    expect(all.map(f => f.name).sort()).toEqual(['job-a', 'task-b']);
  });

  test('overwrites function with same name', () => {
    registry.cron('my-job', '*/5 * * * *', async () => {});
    registry.cron('my-job', '*/10 * * * *', async () => {});

    const fn = registry.get('my-job');
    expect(fn!.schedule).toBe('*/10 * * * *');
    expect(registry.getAll()).toHaveLength(1);
  });

  test('getMetadata returns definitions without handlers', () => {
    registry.cron('my-job', '*/15 * * * *', async () => {}, { retries: 3, timeout: '60s', concurrency: 1 });

    const meta = registry.getMetadata();
    expect(meta).toHaveLength(1);
    expect(meta[0]).toEqual({
      name: 'my-job',
      type: 'cron',
      schedule: '*/15 * * * *',
      options: { retries: 3, timeout: '60s', concurrency: 1 },
    });
    expect((meta[0] as any).handler).toBeUndefined();
  });
});
