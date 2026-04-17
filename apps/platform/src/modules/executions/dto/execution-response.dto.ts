import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogEntryResponse {
  @ApiProperty({ example: 1713355200 })
  timestamp: number;

  @ApiProperty({ example: 'Processing 12 records' })
  message: string;
}

export class ExecutionResponse {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  jobId: string;

  @ApiProperty({ enum: ['pending', 'running', 'success', 'failed'], example: 'success' })
  status: string;

  @ApiProperty({ example: 1 })
  attempt: number;

  @ApiProperty()
  scheduledAt: Date;

  @ApiPropertyOptional()
  startedAt: Date;

  @ApiPropertyOptional()
  completedAt: Date;

  @ApiPropertyOptional({ example: 4523 })
  durationMs: number;

  @ApiPropertyOptional({ example: 200 })
  httpStatus: number;

  @ApiPropertyOptional({ example: '{"processed":12}' })
  responseBody: string;

  @ApiPropertyOptional({ example: 'HTTP 500' })
  errorMessage: string;

  @ApiProperty({ type: [LogEntryResponse] })
  logs: LogEntryResponse[];

  @ApiProperty()
  createdAt: Date;
}

export class PaginatedExecutionsResponse {
  @ApiProperty({ type: [ExecutionResponse] })
  items: ExecutionResponse[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export class FlatLogEntryResponse {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  executionId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  jobId: string;

  @ApiPropertyOptional({ example: 'send-review-emails' })
  jobName: string;

  @ApiProperty({ example: 1713355200 })
  timestamp: number;

  @ApiProperty({ example: 'Processing 12 records' })
  message: string;
}

export class PaginatedLogsResponse {
  @ApiProperty({ type: [FlatLogEntryResponse] })
  items: FlatLogEntryResponse[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  limit: number;
}
