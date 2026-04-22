import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { Job } from '../jobs/job.entity';
import { Execution } from '../executions/execution.entity';
import { QueueService } from '../queue/queue.service';

@ApiTags('SDK Trigger')
@ApiBearerAuth('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api/v1/trigger')
export class TriggerController {
  constructor(
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    @InjectRepository(Execution) private execRepo: Repository<Execution>,
    private queueService: QueueService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Trigger a task execution' })
  @ApiResponse({ status: 201, description: 'Task triggered' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async trigger(
    @Req() req: Request,
    @Body() body: { task: string; payload?: any },
  ) {
    const { project } = req.user as any;

    const job = await this.jobRepo.findOne({
      where: { projectId: project.id, name: body.task },
    });

    if (!job) {
      throw new NotFoundException(`Task "${body.task}" not found in this project`);
    }

    const execution = this.execRepo.create({
      jobId: job.id,
      status: 'pending' as const,
      scheduledAt: new Date(),
      attempt: 1,
      payload: body.payload,
    });
    await this.execRepo.save(execution);

    await this.queueService.send('pingback-execution', {
      executionId: execution.id,
      jobId: job.id,
      projectId: project.id,
      functionName: job.name,
      endpointUrl: project.endpointUrl,
      cronSecret: project.cronSecret,
      attempt: 1,
      maxRetries: job.retries,
      timeoutSeconds: job.timeoutSeconds,
      scheduledAt: new Date().toISOString(),
      payload: body.payload,
    });

    return { executionId: execution.id, task: body.task };
  }
}
