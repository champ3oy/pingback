import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { ExecutionsModule } from '../executions/executions.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [ExecutionsModule, AlertsModule],
  providers: [WorkerService],
})
export class WorkerModule {}
