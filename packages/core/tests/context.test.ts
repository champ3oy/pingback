import { createContext } from '../src/context';

describe('createContext', () => {
  const payload = {
    function: 'my-job',
    executionId: 'exec_123',
    attempt: 1,
    scheduledAt: '2026-04-14T10:30:00Z',
  };

  test('creates context with correct fields', () => {
    const ctx = createContext(payload);
    expect(ctx.executionId).toBe('exec_123');
    expect(ctx.attempt).toBe(1);
    expect(ctx.scheduledAt).toEqual(new Date('2026-04-14T10:30:00Z'));
  });

  test('ctx.log() collects log entries', () => {
    const ctx = createContext(payload);
    ctx.log('Starting');
    ctx.log('Done');

    const logs = ctx._getLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].message).toBe('Starting');
    expect(logs[1].message).toBe('Done');
    expect(typeof logs[0].timestamp).toBe('number');
  });

  test('ctx.task() collects task requests', async () => {
    const ctx = createContext(payload);
    await ctx.task('sub-task', { id: 1 });
    await ctx.task('another-task', { id: 2 });

    const tasks = ctx._getTasks();
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toEqual({ name: 'sub-task', payload: { id: 1 } });
    expect(tasks[1]).toEqual({ name: 'another-task', payload: { id: 2 } });
  });

  test('logs start empty', () => {
    const ctx = createContext(payload);
    expect(ctx._getLogs()).toEqual([]);
  });
});
