export enum JobStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  INACTIVE = 'inactive',
}

export enum JobSource {
  SDK = 'sdk',
  MANUAL = 'manual',
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum AlertChannel {
  EMAIL = 'email',
}

export enum AlertTriggerType {
  CONSECUTIVE_FAILURES = 'consecutive_failures',
  DURATION_EXCEEDED = 'duration_exceeded',
  MISSED_RUN = 'missed_run',
}

export interface QueueMessage {
  executionId: string;
  jobId: string;
  projectId: string;
  functionName: string;
  endpointUrl: string;
  cronSecret: string;
  attempt: number;
  maxRetries: number;
  timeoutSeconds: number;
  scheduledAt: string;
}

export interface ExecutionResponse {
  status: 'success' | 'error';
  result?: unknown;
  error?: string;
  logs: Array<{ timestamp: number; message: string }>;
  durationMs: number;
}
