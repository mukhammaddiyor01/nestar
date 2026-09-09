import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection<WebSocket>, OnGatewayDisconnect<WebSocket> {
	private logger: Logger = new Logger('SocketEventsGateway');
	private summaryClient: number = 0;

	public afterInit(server: Server) {
		this.logger.log(`WebSocket Server Initialized total: ${this.summaryClient}`);
	}

	handleConnection(client: WebSocket, ...args: any[]) {
		this.summaryClient++;
		this.logger.log(`== Client Connected total: ${this.summaryClient} ==`);
	}

	handleDisconnect(client: WebSocket) {
		this.summaryClient--;
		this.logger.log(`== Client Disconnected total: ${this.summaryClient} ==`);
	}

	@SubscribeMessage('message')
	handleMessage(client: WebSocket, payload: any): string {
		return 'Hello world!';
	}
}
