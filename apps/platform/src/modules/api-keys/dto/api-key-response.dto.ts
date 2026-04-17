import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiKeyCreatedResponse {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Production Key' })
  name: string;

  @ApiProperty({ description: 'Full API key — shown only once', example: 'pb_live_abc123def456...' })
  key: string;

  @ApiProperty({ example: 'pb_live_abc12345' })
  keyPrefix: string;
}

export class ApiKeyResponse {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Production Key' })
  name: string;

  @ApiProperty({ example: 'pb_live_abc12345' })
  keyPrefix: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  projectId: string;

  @ApiPropertyOptional()
  lastUsedAt: Date;

  @ApiProperty()
  createdAt: Date;
}
