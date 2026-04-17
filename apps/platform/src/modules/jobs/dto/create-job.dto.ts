import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateJobDto {
  @IsString()
  name: string;

  @IsString()
  schedule: string;

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
