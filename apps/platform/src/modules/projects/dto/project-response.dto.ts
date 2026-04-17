import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectResponse {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'My App' })
  name: string;

  @ApiProperty({ example: 'https://myapp.com/api/__pingback' })
  endpointUrl: string;

  @ApiPropertyOptional({ example: 'myapp.vercel.app' })
  domain: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
