import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PgBoss from 'pg-boss';
import { QueueService } from './queue.service';

@Global()
@Module({
  providers: [
    {
      provide: 'PG_BOSS_INSTANCE',
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const boss = new PgBoss(config.get<string>('database.url') as string);
        await boss.start();
        await boss.createQueue('pingback-execution');
        await boss.createQueue('pingback-alert-evaluation');
        return boss;
      },
    },
    QueueService,
  ],
  exports: [QueueService],
})
export class QueueModule {}
