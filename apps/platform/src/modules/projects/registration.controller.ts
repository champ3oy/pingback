import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { RegistrationService } from './registration.service';
import { SdkRegisterDto } from './dto/register.dto';
import { RegistrationResponse } from './dto/registration-response.dto';

@ApiTags('SDK Registration')
@ApiBearerAuth('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api/v1/register')
export class RegistrationController {
  constructor(private registrationService: RegistrationService) {}

  @Post()
  @ApiOperation({ summary: 'Register functions from the SDK' })
  @ApiResponse({ status: 201, description: 'Functions registered successfully', type: RegistrationResponse })
  @ApiResponse({ status: 403, description: 'API key does not belong to this project' })
  register(@Req() req: Request, @Body() dto: SdkRegisterDto) {
    const { project } = req.user as any;
    if (project.id !== dto.project_id) {
      throw new ForbiddenException('API key does not belong to this project');
    }
    return this.registrationService.register(dto.project_id, dto.functions);
  }
}
