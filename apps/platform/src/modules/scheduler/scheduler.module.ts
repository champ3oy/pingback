import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../jobs/job.entity';
import { SchedulerService } from './scheduler.service';
import { ExecutionsModule } from '../executions/executions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Job]), ExecutionsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
