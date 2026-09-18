import { Module } from '@nestjs/common';
import { CycleModule } from './cycle/cycle.module';
import { DatabaseModule } from './database/database.module';
import { HistoryModule } from './history/history.module';
import { MetaModule } from './meta/meta.module';

@Module({
  imports: [
    DatabaseModule,
    HistoryModule.withTypeOrm(),
    CycleModule,
    MetaModule,
  ],
})
export class AppModule {}
