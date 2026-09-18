import { Module } from '@nestjs/common';
import { ConventionsController } from './conventions.controller';
import { HealthController } from './health.controller';

@Module({
  controllers: [ConventionsController, HealthController],
})
export class MetaModule {}
