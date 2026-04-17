import { IsString, IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAlertDto {
  @ApiPropertyOptional({ description: 'Job ID to scope the alert to (omit for project-wide)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @ApiProperty({ description: 'Notification channel', enum: ['email'], example: 'email' })
  @IsEnum(['email'])
  channel: 'email';

  @ApiProperty({ description: 'Alert target (e.g. email address)', example: 'ops@example.com' })
  @IsString()
  target: string;

  @ApiProperty({ description: 'Condition that triggers the alert', enum: ['consecutive_failures', 'duration_exceeded', 'missed_run'], example: 'consecutive_failures' })
  @IsEnum(['consecutive_failures', 'duration_exceeded', 'missed_run'])
  triggerType: 'consecutive_failures' | 'duration_exceeded' | 'missed_run';

  @ApiProperty({ description: 'Threshold value for the trigger (e.g. number of failures)', example: 3, minimum: 1 })
  @IsInt()
  @Min(1)
  triggerValue: number;

  @ApiPropertyOptional({ description: 'Minimum seconds between repeated alerts', example: 3600, minimum: 60 })
  @IsInt()
  @IsOptional()
  @Min(60)
  cooldownSeconds?: number;
}
