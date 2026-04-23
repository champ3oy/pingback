import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerService } from './worker.service';
import { ExecutionsModule } from '../executions/executions.module';
import { AlertsModule } from '../alerts/alerts.module';
import { JobsModule } from '../jobs/jobs.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { User } from '../../entities/user.entity';
import { Project } from '../projects/project.entity';

@Module({
  imports: [
    ExecutionsModule,
    AlertsModule,
    JobsModule,
    SubscriptionModule,
    TypeOrmModule.forFeature([User, Project]),
  ],
  providers: [WorkerService],
})
export class WorkerModule {}
