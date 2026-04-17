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
import { ApiKeyGuard } from '../auth/api-key.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@UseGuards(ApiKeyGuard)
@Controller('api/v1/jobs')
export class JobsApiController {
  constructor(private jobsService: JobsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateJobDto) {
    const { project } = req.user as any;
    return this.jobsService.create(project.id, dto);
  }

  @Get()
  findAll(@Req() req: Request, @Query('status') status?: string) {
    const { project } = req.user as any;
    return this.jobsService.findAllByProject(project.id, { status });
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const { project } = req.user as any;
    return this.jobsService.findOne(id, project.id);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    const { project } = req.user as any;
    return this.jobsService.update(id, project.id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const { project } = req.user as any;
    return this.jobsService.remove(id, project.id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/jobs')
export class JobsDashboardController {
  constructor(
    private jobsService: JobsService,
    private projectsService: ProjectsService,
  ) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.jobsService.findAllByProject(projectId, { status, type });
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.jobsService.findOne(id, projectId);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.jobsService.update(id, projectId, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.jobsService.remove(id, projectId);
  }

  @Post(':id/run')
  async triggerRun(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    const job = await this.jobsService.findOne(id, projectId);
    return { message: 'Run triggered', jobId: job.id };
  }
}
