import { Module } from '@nestjs/common';
import { NestarBatchController } from './nbatch.controller';
import { NestarBatchService } from './batch.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
	imports: [ConfigModule.forRoot(), DatabaseModule, ScheduleModule.forRoot()],
	controllers: [NestarBatchController],
	providers: [NestarBatchService],
})
export class NestarBatchModule {}
