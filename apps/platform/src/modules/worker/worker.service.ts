import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHmac } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExecutionsService } from '../executions/executions.service';
import { QueueService } from '../queue/queue.service';
import { AlertsService } from '../alerts/alerts.service';
import { JobsService } from '../jobs/jobs.service';
import { PlanLimitsService } from '../subscription/plan-limits.service';
import { User } from '../../entities/user.entity';
import { Project } from '../projects/project.entity';

interface QueueMessage {
  executionId: string;
  jobId: string;
  projectId: string;
  functionName: string;
  endpointUrl: string;
  cronSecret: string;
  attempt: number;
  maxRetries: number;
  timeoutSeconds: number;
  scheduledAt: string;
  payload?: any;
}

@Injectable()
export class WorkerService implements OnModuleInit {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private executionsService: ExecutionsService,
    private queueService: QueueService,
    private alertsService: AlertsService,
    private jobsService: JobsService,
    private planLimitsService: PlanLimitsService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
  ) {}

  onModuleInit() {
    // Disabled: Go worker now handles execution processing
    // this.queueService.work('pingback-execution', (jobs: any) => {
    //   const jobList = Array.isArray(jobs) ? jobs : [jobs];
    //   return Promise.all(jobList.map((j: any) => this.processJob(j)));
    // });
    this.logger.log('Worker subscription disabled - Go worker handles execution');
  }

  async processJob(job: any) {
    const msg: QueueMessage = job.data || job;
    this.logger.log(`Processing execution ${msg.executionId} for ${msg.functionName}`);

    try {
      await this.executionsService.markRunning(msg.executionId);

      // Load project owner for plan checks
      const project = await this.projectRepo.findOne({ where: { id: msg.projectId } });
      let user: User | null = null;
      if (project) {
        user = await this.userRepo.findOne({ where: { id: project.userId } });
      }

      if (user) {
        // Lazy reset of monthly counter
        if (user.executionsResetAt && new Date() > user.executionsResetAt) {
          user.executionsThisMonth = 0;
          user.executionsResetAt = new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            1,
          );
          await this.userRepo.save(user);
        }

        // Check execution limit
        const execCheck = this.planLimitsService.canExecute(user);
        if (!execCheck.allowed) {
          await this.executionsService.markCompleted(msg.executionId, {
            status: 'failed',
            errorMessage: execCheck.message || 'Monthly execution limit reached',
          });
          return;
        }

        // Increment execution counter
        user.executionsThisMonth += 1;
        await this.userRepo.save(user);
      }

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({
        function: msg.functionName,
        executionId: msg.executionId,
        attempt: msg.attempt,
        scheduledAt: msg.scheduledAt,
        ...(msg.payload !== undefined ? { payload: msg.payload } : {}),
      });

      const signature = createHmac('sha256', msg.cronSecret)
        .update(`${timestamp}.${body}`)
        .digest('hex');

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        msg.timeoutSeconds * 1000,
      );

      try {
        const response = await fetch(msg.endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Pingback-Signature': signature,
            'X-Pingback-Timestamp': timestamp,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const responseText = await response.text();

        if (response.ok) {
          let logs: Array<{ timestamp: number; message: string }> = [];
          let tasks: Array<{ name: string; payload: any }> = [];
          try {
            const parsed = JSON.parse(responseText);
            logs = parsed.logs || [];
            tasks = parsed.tasks || [];
          } catch {}

          await this.executionsService.markCompleted(msg.executionId, {
            status: 'success',
            httpStatus: response.status,
            responseBody: responseText,
            logs,
          });

          // Fan-out: dispatch child tasks
          let tasksToDispatch = tasks;
          if (user) {
            tasksToDispatch = this.planLimitsService.capFanOut(user, tasks);
            if (tasksToDispatch.length < tasks.length) {
              this.logger.warn(
                `Fan-out capped: ${tasks.length} tasks requested, ${tasksToDispatch.length} allowed for ${user.plan} plan`,
              );
            }
          }
          for (const task of tasksToDispatch) {
            try {
              const taskJob = await this.jobsService.findByName(
                msg.projectId,
                task.name,
              );
              if (!taskJob) {
                this.logger.warn(
                  `Fan-out: task function "${task.name}" not registered, skipping`,
                );
                continue;
              }

              const childExec = await this.executionsService.createPending(
                taskJob.id,
                new Date(),
                1,
                { parentId: msg.executionId, payload: task.payload },
              );

              await this.queueService.send('pingback-execution', {
                executionId: childExec.id,
                jobId: taskJob.id,
                projectId: msg.projectId,
                functionName: task.name,
                endpointUrl: msg.endpointUrl,
                cronSecret: msg.cronSecret,
                attempt: 1,
                maxRetries: taskJob.retries,
                timeoutSeconds: taskJob.timeoutSeconds,
                scheduledAt: new Date().toISOString(),
                payload: task.payload,
              });
            } catch (err) {
              this.logger.error(
                `Fan-out error for task "${task.name}": ${(err as Error).message}`,
              );
            }
          }
        } else {
          let failLogs: Array<{ timestamp: number; message: string }> = [];
          try {
            const parsed = JSON.parse(responseText);
            failLogs = parsed.logs || [];
          } catch {}

          const failResult = {
            httpStatus: response.status,
            errorMessage: `HTTP ${response.status}`,
            logs: failLogs,
          };

          if (msg.attempt <= msg.maxRetries) {
            await this.handleFailure(msg, failResult);
          } else {
            await this.executionsService.markCompleted(msg.executionId, {
              status: 'failed',
              httpStatus: response.status,
              responseBody: responseText,
              errorMessage: `HTTP ${response.status}`,
              logs: failLogs,
            });
            await this.handleFailure(msg, failResult);
          }
        }
      } catch (err) {
        clearTimeout(timeout);
        const errResult = {
          errorMessage: (err as Error).message,
          logs: [] as Array<{ timestamp: number; message: string }>,
        };

        if (msg.attempt <= msg.maxRetries) {
          await this.handleFailure(msg, errResult);
        } else {
          await this.executionsService.markCompleted(msg.executionId, {
            status: 'failed',
            errorMessage: (err as Error).message,
          });
          await this.handleFailure(msg, errResult);
        }
      }
    } catch (err) {
      this.logger.error(
        `Worker error for execution ${msg.executionId}: ${(err as Error).message}`,
      );
    }
  }

  private async handleFailure(
    msg: QueueMessage,
    result: {
      httpStatus?: number;
      errorMessage?: string;
      logs?: Array<{ timestamp: number; message: string }>;
    },
  ) {
    if (msg.attempt <= msg.maxRetries) {
      // Save failed attempt and reset execution for retry
      await this.executionsService.saveAttemptAndRetry(msg.executionId, {
        status: 'failed',
        httpStatus: result.httpStatus,
        errorMessage: result.errorMessage,
        logs: result.logs,
      });

      const backoffSeconds = Math.min(Math.pow(2, msg.attempt), 60);
      await this.queueService.send(
        'pingback-execution',
        { ...msg, attempt: msg.attempt + 1 },
        { startAfter: backoffSeconds },
      );
    } else {
      await this.alertsService.evaluate(msg.jobId, msg.executionId);
    }
  }
}
