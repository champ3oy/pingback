import { IsString, IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  schedule?: string;

  @IsEnum(['active', 'paused'])
  @IsOptional()
  status?: 'active' | 'paused';

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10)
  retries?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(300)
  timeoutSeconds?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  concurrency?: number;
}
