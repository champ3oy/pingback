import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './alert.entity';
import { Execution } from '../executions/execution.entity';
import { Job } from '../jobs/job.entity';
import { User } from '../../entities/user.entity';
import { Project } from '../projects/project.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { EmailNotifier } from './notifiers/email.notifier';
import { ProjectsModule } from '../projects/projects.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, Execution, Job, User, Project]),
    ProjectsModule,
    SubscriptionModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService, EmailNotifier],
  exports: [AlertsService],
})
export class AlertsModule {}
