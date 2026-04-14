import { FunctionDefinition, FunctionOptions } from './types';

export class Registry {
  private functions = new Map<string, FunctionDefinition>();

  cron(
    name: string,
    schedule: string,
    handler: FunctionDefinition['handler'],
    options: FunctionOptions = {},
  ): { name: string; type: 'cron' } {
    this.functions.set(name, { name, type: 'cron', schedule, handler, options });
    return { name, type: 'cron' };
  }

  task(
    name: string,
    handler: FunctionDefinition['handler'],
    options: FunctionOptions = {},
  ): { name: string; type: 'task' } {
    this.functions.set(name, { name, type: 'task', handler, options });
    return { name, type: 'task' };
  }

  get(name: string): FunctionDefinition | undefined {
    return this.functions.get(name);
  }

  getAll(): FunctionDefinition[] {
    return Array.from(this.functions.values());
  }

  getMetadata(): Array<Omit<FunctionDefinition, 'handler'>> {
    return this.getAll().map(({ handler, ...rest }) => rest);
  }
}
