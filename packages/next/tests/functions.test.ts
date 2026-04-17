import { cron, task, registry } from '../src/functions';

describe('functions', () => {
  beforeEach(() => {
    (registry as any).functions = new Map();
  });

  describe('cron', () => {
    it('should register a cron function in the shared registry', () => {
      const handler = async () => ({ done: true });
      const result = cron('send-emails', '*/15 * * * *', handler, { retries: 3 });

      expect(result).toEqual({ name: 'send-emails', type: 'cron' });
      const registered = registry.get('send-emails');
      expect(registered).toBeDefined();
      expect(registered!.type).toBe('cron');
      expect(registered!.schedule).toBe('*/15 * * * *');
      expect(registered!.options.retries).toBe(3);
      expect(registered!.handler).toBe(handler);
    });

    it('should work with default options', () => {
      cron('simple-job', '0 * * * *', async () => {});
      const registered = registry.get('simple-job');
      expect(registered).toBeDefined();
      expect(registered!.options).toEqual({});
    });
  });

  describe('task', () => {
    it('should register a task function in the shared registry', () => {
      const handler = async () => ({ sent: true });
      const result = task('send-single-email', handler, { retries: 2, timeout: '15s' });

      expect(result).toEqual({ name: 'send-single-email', type: 'task' });
      const registered = registry.get('send-single-email');
      expect(registered).toBeDefined();
      expect(registered!.type).toBe('task');
      expect(registered!.schedule).toBeUndefined();
      expect(registered!.options.retries).toBe(2);
      expect(registered!.options.timeout).toBe('15s');
    });
  });

  describe('shared registry', () => {
    it('should accumulate functions across multiple calls', () => {
      cron('job-a', '* * * * *', async () => {});
      cron('job-b', '0 * * * *', async () => {});
      task('task-c', async () => {});
      expect(registry.getAll()).toHaveLength(3);
    });

    it('should expose metadata without handlers', () => {
      cron('my-cron', '*/5 * * * *', async () => {}, { retries: 1 });
      const metadata = registry.getMetadata();
      expect(metadata).toHaveLength(1);
      expect(metadata[0]).toEqual({
        name: 'my-cron',
        type: 'cron',
        schedule: '*/5 * * * *',
        options: { retries: 1 },
      });
      expect(metadata[0]).not.toHaveProperty('handler');
    });
  });
});
