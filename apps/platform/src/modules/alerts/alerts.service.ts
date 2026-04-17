import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alert.entity';
import { Execution } from '../executions/execution.entity';
import { Job } from '../jobs/job.entity';
import { EmailNotifier } from './notifiers/email.notifier';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert) private alertRepo: Repository<Alert>,
    @InjectRepository(Execution) private execRepo: Repository<Execution>,
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    private emailNotifier: EmailNotifier,
  ) {}

  async evaluate(jobId: string, executionId: string) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['project'],
    });
    if (!job) return;

    const execution = await this.execRepo.findOne({
      where: { id: executionId },
    });
    if (!execution) return;

    const alerts = await this.alertRepo.find({
      where: [
        { projectId: job.projectId, jobId: undefined, enabled: true },
        { projectId: job.projectId, jobId, enabled: true },
      ],
    });

    for (const alert of alerts) {
      if (this.isInCooldown(alert)) continue;

      let shouldFire = false;

      switch (alert.triggerType) {
        case 'consecutive_failures':
          shouldFire = await this.checkConsecutiveFailures(
            jobId,
            alert.triggerValue,
          );
          break;
        case 'duration_exceeded':
          shouldFire =
            execution.durationMs != null &&
            execution.durationMs > alert.triggerValue * 1000;
          break;
        case 'missed_run':
          continue;
      }

      if (shouldFire) {
        await this.emailNotifier.send({
          to: alert.target,
          jobName: job.name,
          projectName: job.project.name,
          errorMessage: execution.errorMessage || 'Unknown error',
          attempt: execution.attempt,
          executionId: execution.id,
          projectId: job.projectId,
        });

        alert.lastFiredAt = new Date();
        await this.alertRepo.save(alert);
      }
    }
  }

  private isInCooldown(alert: Alert): boolean {
    if (!alert.lastFiredAt) return false;
    const cooldownUntil =
      alert.lastFiredAt.getTime() + alert.cooldownSeconds * 1000;
    return Date.now() < cooldownUntil;
  }

  private async checkConsecutiveFailures(
    jobId: string,
    threshold: number,
  ): Promise<boolean> {
    const recent = await this.execRepo.find({
      where: { jobId },
      order: { createdAt: 'DESC' },
      take: threshold,
    });
    return (
      recent.length >= threshold &&
      recent.every((e) => e.status === 'failed')
    );
  }

  async create(projectId: string, dto: CreateAlertDto) {
    const alert = this.alertRepo.create({
      projectId,
      jobId: dto.jobId || undefined,
      channel: dto.channel,
      target: dto.target,
      triggerType: dto.triggerType,
      triggerValue: dto.triggerValue,
      cooldownSeconds: dto.cooldownSeconds ?? 3600,
    });
    return this.alertRepo.save(alert);
  }

  async findAllByProject(projectId: string, jobId?: string) {
    const where: any = { projectId };
    if (jobId) where.jobId = jobId;
    return this.alertRepo.find({ where });
  }

  async findOne(id: string, projectId: string) {
    const alert = await this.alertRepo.findOne({
      where: { id, projectId },
    });
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async update(id: string, projectId: string, dto: UpdateAlertDto) {
    const alert = await this.findOne(id, projectId);
    Object.assign(alert, dto);
    return this.alertRepo.save(alert);
  }

  async remove(id: string, projectId: string) {
    await this.findOne(id, projectId);
    await this.alertRepo.delete(id);
  }
}
