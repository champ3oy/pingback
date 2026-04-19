import { Context, LogEntry, ExecutionPayload, TaskRequest } from './types';

export interface ContextWithInternals extends Context {
  _getLogs(): LogEntry[];
  _getTasks(): TaskRequest[];
}

export function createContext(payload: ExecutionPayload): ContextWithInternals {
  const logs: LogEntry[] = [];
  const tasks: TaskRequest[] = [];

  return {
    executionId: payload.executionId,
    attempt: payload.attempt,
    scheduledAt: new Date(payload.scheduledAt),

    log(message: string): void {
      logs.push({ timestamp: Date.now(), message });
    },

    async task(name: string, taskPayload: any): Promise<void> {
      tasks.push({ name, payload: taskPayload });
    },

    _getLogs(): LogEntry[] {
      return logs;
    },

    _getTasks(): TaskRequest[] {
      return tasks;
    },
  };
}
