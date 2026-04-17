import {
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class FunctionOptionsDto {
  @ApiPropertyOptional({ description: 'Number of retry attempts on failure', example: 3, minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  retries?: number;

  @ApiPropertyOptional({ description: 'Execution timeout duration', example: '30s' })
  @IsString()
  @IsOptional()
  timeout?: string;

  @ApiPropertyOptional({ description: 'Max concurrent executions', example: 1, minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  concurrency?: number;
}

class FunctionMetadataDto {
  @ApiProperty({ description: 'Function name', example: 'send-weekly-digest' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Function type', enum: ['cron', 'task'], example: 'cron' })
  @IsEnum(['cron', 'task'])
  type: 'cron' | 'task';

  @ApiPropertyOptional({ description: 'Cron expression (required for cron type)', example: '0 9 * * 1' })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiPropertyOptional({ description: 'Function execution options', type: FunctionOptionsDto })
  @ValidateNested()
  @Type(() => FunctionOptionsDto)
  @IsOptional()
  options?: FunctionOptionsDto;
}

export class RegisterDto {
  @ApiProperty({ description: 'Project ID to register functions for', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  project_id: string;

  @ApiProperty({ description: 'Array of functions to register', type: [FunctionMetadataDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FunctionMetadataDto)
  functions: FunctionMetadataDto[];
}
