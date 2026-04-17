import { IsString, IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateAlertDto {
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @IsEnum(['email'])
  channel: 'email';

  @IsString()
  target: string;

  @IsEnum(['consecutive_failures', 'duration_exceeded', 'missed_run'])
  triggerType: 'consecutive_failures' | 'duration_exceeded' | 'missed_run';

  @IsInt()
  @Min(1)
  triggerValue: number;

  @IsInt()
  @IsOptional()
  @Min(60)
  cooldownSeconds?: number;
}
