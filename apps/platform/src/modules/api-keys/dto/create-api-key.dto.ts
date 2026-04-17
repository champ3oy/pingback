import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Human-readable name for the API key', example: 'Production Key' })
  @IsString()
  name: string;
}
