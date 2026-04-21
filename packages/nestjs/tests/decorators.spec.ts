import 'reflect-metadata';
import { Cron, Task, PINGBACK_FUNCTION_METADATA, PingbackFunctionMetadata } from '../src/decorators';

class TestService {
  @Cron('daily-sync', '0 0 * * *', { retries: 3, timeout: '60s' })
  async dailySync() {}

  @Cron('simple-job', '* * * * *')
  async simpleJob() {}

  @Task('send-email', { retries: 2, timeout: '15s' })
  async sendEmail() {}

  @Task('simple-task')
  async simpleTask() {}

  async noDecorator() {}
}

describe('Cron decorator', () => {
  it('should store cron metadata on the method', () => {
    const meta: PingbackFunctionMetadata = Reflect.getMetadata(
      PINGBACK_FUNCTION_METADATA,
      TestService.prototype,
      'dailySync',
    );
    expect(meta).toEqual({
      name: 'daily-sync',
      type: 'cron',
      schedule: '0 0 * * *',
      options: { retries: 3, timeout: '60s' },
    });
  });

  it('should default options to empty object', () => {
    const meta: PingbackFunctionMetadata = Reflect.getMetadata(
      PINGBACK_FUNCTION_METADATA,
      TestService.prototype,
      'simpleJob',
    );
    expect(meta).toEqual({
      name: 'simple-job',
      type: 'cron',
      schedule: '* * * * *',
      options: {},
    });
  });
});

describe('Task decorator', () => {
  it('should store task metadata on the method', () => {
    const meta: PingbackFunctionMetadata = Reflect.getMetadata(
      PINGBACK_FUNCTION_METADATA,
      TestService.prototype,
      'sendEmail',
    );
    expect(meta).toEqual({
      name: 'send-email',
      type: 'task',
      options: { retries: 2, timeout: '15s' },
    });
  });

  it('should default options to empty object', () => {
    const meta: PingbackFunctionMetadata = Reflect.getMetadata(
      PINGBACK_FUNCTION_METADATA,
      TestService.prototype,
      'simpleTask',
    );
    expect(meta).toEqual({
      name: 'simple-task',
      type: 'task',
      options: {},
    });
  });
});

describe('No decorator', () => {
  it('should not have metadata on undecorated methods', () => {
    const meta = Reflect.getMetadata(
      PINGBACK_FUNCTION_METADATA,
      TestService.prototype,
      'noDecorator',
    );
    expect(meta).toBeUndefined();
  });
});
