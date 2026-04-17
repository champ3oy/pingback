import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token obtained from login', example: 'eyJhbGciOiJIUzI1NiIs...' })
  @IsString()
  refreshToken: string;
}
