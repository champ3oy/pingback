import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AlertResponse {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  projectId: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  jobId: string;

  @ApiProperty({ enum: ['email'], example: 'email' })
  channel: string;

  @ApiProperty({ example: 'dev@myapp.com' })
  target: string;

  @ApiProperty({ enum: ['consecutive_failures', 'duration_exceeded', 'missed_run'], example: 'consecutive_failures' })
  triggerType: string;

  @ApiProperty({ example: 3 })
  triggerValue: number;

  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiPropertyOptional()
  lastFiredAt: Date;

  @ApiProperty({ example: 3600 })
  cooldownSeconds: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
