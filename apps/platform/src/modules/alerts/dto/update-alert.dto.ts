import { IsString, IsEnum, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpdateAlertDto {
  @IsString()
  @IsOptional()
  target?: string;

  @IsEnum(['consecutive_failures', 'duration_exceeded', 'missed_run'])
  @IsOptional()
  triggerType?: 'consecutive_failures' | 'duration_exceeded' | 'missed_run';

  @IsInt()
  @IsOptional()
  @Min(1)
  triggerValue?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsInt()
  @IsOptional()
  @Min(60)
  cooldownSeconds?: number;
}
