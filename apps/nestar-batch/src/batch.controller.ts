import { Controller, Get, Logger } from '@nestjs/common';
import { BatchService } from './batch.service';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { BATCH_ROLLBACK, BATCH_TOP_AGENTS, BATCH_TOP_PROPERTIES } from './lib/config';

@Controller()
export class BatchController {
	private logger: Logger = new Logger('BatchController');

	constructor(private readonly batchService: BatchService) {}

	@Timeout(1000)
	handleTimeout() {
		this.logger.debug('BATCH SERVER READY!');
	}

	@Cron('00 * * * * * ', { name: BATCH_ROLLBACK }) // 00 har 00 sekund, */20 - har 20 sekundda ishga tushadi
	public async batchRollback() {
		try {
			this.logger['context'] = BATCH_ROLLBACK;
			this.logger.debug('EXECUTED!');
			await this.batchService.batchRollback();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('20 * * * * * ', { name: BATCH_TOP_PROPERTIES }) // har 20-minutda ishga tushadi
	public async batchProperties() {
		try {
			this.logger['context'] = BATCH_TOP_PROPERTIES;
			this.logger.debug('EXECUTED!');
			await this.batchService.batchProperties();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('40 * * * * * ', { name: BATCH_TOP_AGENTS }) // har 40-minutda ishga tushadi
	public async batchAgents() {
		try {
			this.logger['context'] = BATCH_TOP_AGENTS;
			this.logger.debug('EXECUTED!');
			await this.batchService.batchAgents();
		} catch (err) {
			this.logger.error(err);
		}
	}

	/*
	@Interval(1000)
	handleInterval() {
		this.logger.debug('INTERVAL TEST');
	}
	*/
	@Get()
	getHello(): string {
		return this.batchService.getHello();
	}
}
