import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { Job } from '../jobs/job.entity';
import { ApiKey } from '../api-keys/api-key.entity';
import { Execution } from '../executions/execution.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { TriggerController } from './trigger.controller';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { ApiKeysController } from '../api-keys/api-keys.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Job, ApiKey, Execution]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ProjectsController, RegistrationController, TriggerController, ApiKeysController],
  providers: [ProjectsService, RegistrationService, ApiKeysService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
