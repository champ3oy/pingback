import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ description: 'Unique job name', example: 'send-review-emails' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Cron expression for the schedule', example: '*/15 * * * *' })
  @IsString()
  schedule: string;

  @ApiPropertyOptional({ description: 'Number of retry attempts on failure', example: 3, minimum: 0, maximum: 10 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10)
  retries?: number;

  @ApiPropertyOptional({ description: 'Execution timeout in seconds', example: 30, minimum: 1, maximum: 300 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(300)
  timeoutSeconds?: number;

  @ApiPropertyOptional({ description: 'Maximum concurrent executions', example: 1, minimum: 1, maximum: 10 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  concurrency?: number;
}
