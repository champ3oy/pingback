import { IsString, IsEnum, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAlertDto {
  @ApiPropertyOptional({ description: 'Updated alert target', example: 'ops@example.com' })
  @IsString()
  @IsOptional()
  target?: string;

  @ApiPropertyOptional({ description: 'Updated trigger condition', enum: ['consecutive_failures', 'duration_exceeded', 'missed_run'], example: 'consecutive_failures' })
  @IsEnum(['consecutive_failures', 'duration_exceeded', 'missed_run'])
  @IsOptional()
  triggerType?: 'consecutive_failures' | 'duration_exceeded' | 'missed_run';

  @ApiPropertyOptional({ description: 'Updated threshold value', example: 5, minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  triggerValue?: number;

  @ApiPropertyOptional({ description: 'Whether the alert is enabled', example: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Minimum seconds between repeated alerts', example: 3600, minimum: 60 })
  @IsInt()
  @IsOptional()
  @Min(60)
  cooldownSeconds?: number;
}
