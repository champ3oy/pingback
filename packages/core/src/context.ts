import { Context, LogEntry, ExecutionPayload } from './types';

export interface ContextWithLogs extends Context {
  _getLogs(): LogEntry[];
}

export function createContext(payload: ExecutionPayload): ContextWithLogs {
  const logs: LogEntry[] = [];

  return {
    executionId: payload.executionId,
    attempt: payload.attempt,
    scheduledAt: new Date(payload.scheduledAt),

    log(message: string): void {
      logs.push({ timestamp: Date.now(), message });
    },

    async task(_name: string, _payload: any): Promise<void> {
      throw new Error(
        'ctx.task() is not available in the current plan. Upgrade to Pro for fan-out tasks.',
      );
    },

    _getLogs(): LogEntry[] {
      return logs;
    },
  };
}
