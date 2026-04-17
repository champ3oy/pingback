import { ApiProperty } from '@nestjs/swagger';

class RegisteredJobResponse {
  @ApiProperty({ example: 'send-review-emails' })
  name: string;

  @ApiProperty({ example: 'active' })
  status: string;
}

export class RegistrationResponse {
  @ApiProperty({ type: [RegisteredJobResponse] })
  jobs: RegisteredJobResponse[];
}
