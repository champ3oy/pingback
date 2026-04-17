import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JobResponse {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  projectId: string;

  @ApiProperty({ example: 'send-review-emails' })
  name: string;

  @ApiPropertyOptional({ example: '*/15 * * * *', description: 'Null for task-type functions' })
  schedule: string;

  @ApiProperty({ enum: ['active', 'paused', 'inactive'], example: 'active' })
  status: string;

  @ApiPropertyOptional()
  nextRunAt: Date;

  @ApiPropertyOptional()
  lastRunAt: Date;

  @ApiProperty({ example: 3 })
  retries: number;

  @ApiProperty({ example: 30 })
  timeoutSeconds: number;

  @ApiProperty({ example: 1 })
  concurrency: number;

  @ApiProperty({ enum: ['sdk', 'manual'], example: 'sdk' })
  source: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
