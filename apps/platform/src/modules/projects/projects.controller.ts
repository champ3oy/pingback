import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateProjectDto) {
    const user = req.user as { id: string };
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.projectsService.findAllByUser(user.id);
  }

  @Get(':projectId')
  findOne(@Req() req: Request, @Param('projectId') projectId: string) {
    const user = req.user as { id: string };
    return this.projectsService.findOneByUser(projectId, user.id);
  }

  @Delete(':projectId')
  remove(@Req() req: Request, @Param('projectId') projectId: string) {
    const user = req.user as { id: string };
    return this.projectsService.remove(projectId, user.id);
  }
}
