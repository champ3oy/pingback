import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './job.entity';
import { JobsService } from './jobs.service';
import { JobsApiController, JobsDashboardController } from './jobs.controller';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    ProjectsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [JobsApiController, JobsDashboardController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
