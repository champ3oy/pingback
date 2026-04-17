import {
  Injectable,
  Inject,
  OnModuleDestroy,
} from '@nestjs/common';
import PgBoss from 'pg-boss';

@Injectable()
export class QueueService implements OnModuleDestroy {
  constructor(@Inject('PG_BOSS_INSTANCE') private boss: PgBoss) {}

  async send(
    name: string,
    data: Record<string, any>,
    options?: PgBoss.SendOptions,
  ): Promise<string | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.boss as any).send(name, data, options);
  }

  async work(name: string, handler: PgBoss.WorkHandler<any>): Promise<string> {
    return this.boss.work(name, handler);
  }

  async onModuleDestroy() {
    await this.boss.stop();
  }
}
