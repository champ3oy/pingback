import 'reflect-metadata';

export const PINGBACK_FUNCTION_METADATA = 'pingback:function';

export interface PingbackFunctionMetadata {
  name: string;
  type: 'cron' | 'task';
  schedule?: string;
  options: {
    retries?: number;
    timeout?: string;
    concurrency?: number;
  };
}

export function Cron(
  name: string,
  schedule: string,
  options?: PingbackFunctionMetadata['options'],
): MethodDecorator {
  return (target, propertyKey) => {
    const meta: PingbackFunctionMetadata = {
      name,
      type: 'cron',
      schedule,
      options: options || {},
    };
    Reflect.defineMetadata(PINGBACK_FUNCTION_METADATA, meta, target, propertyKey);
  };
}

export function Task(
  name: string,
  options?: PingbackFunctionMetadata['options'],
): MethodDecorator {
  return (target, propertyKey) => {
    const meta: PingbackFunctionMetadata = {
      name,
      type: 'task',
      options: options || {},
    };
    Reflect.defineMetadata(PINGBACK_FUNCTION_METADATA, meta, target, propertyKey);
  };
}
