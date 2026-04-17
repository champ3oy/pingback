import { IsString, IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateJobDto {
  @ApiPropertyOptional({ description: 'Updated cron expression', example: '0 */6 * * *' })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiPropertyOptional({ description: 'Job status', enum: ['active', 'paused'], example: 'active' })
  @IsEnum(['active', 'paused'])
  @IsOptional()
  status?: 'active' | 'paused';

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
