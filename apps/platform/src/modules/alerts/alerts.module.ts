import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './alert.entity';
import { Execution } from '../executions/execution.entity';
import { Job } from '../jobs/job.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { EmailNotifier } from './notifiers/email.notifier';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, Execution, Job]),
    ProjectsModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService, EmailNotifier],
  exports: [AlertsService],
})
export class AlertsModule {}
