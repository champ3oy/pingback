import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsUrl()
  endpointUrl: string;

  @IsString()
  @IsOptional()
  domain?: string;
}
