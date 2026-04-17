import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/alerts')
export class AlertsController {
  constructor(
    private alertsService: AlertsService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  async create(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Body() dto: CreateAlertDto,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.create(projectId, dto);
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Query('jobId') jobId?: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.findAllByProject(projectId, jobId);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.update(id, projectId, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.remove(id, projectId);
  }
}
