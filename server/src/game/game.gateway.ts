import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { GameService, TURN_TIME_MS } from './game.service';
import { HandResult } from './game.service';

interface SocketUser {
  userId: string;
  username: string;
  displayName: string;
  role: string;
}

const NEXT_HAND_DELAY_MS = 7000;

@WebSocketGateway({
  cors: { origin: 'http://localhost:5173', credentials: true },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private usersBySocket = new Map<string, SocketUser>();
  private socketsByUser = new Map<string, string>();
  private turnTimers = new Map<string, NodeJS.Timeout>();
  private nextHandTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private gameService: GameService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    try {
      const payload = this.jwtService.verify(token);
      const user: SocketUser = {
        userId: payload.sub,
        username: payload.username,
        displayName: payload.displayName ?? payload.username,
        role: payload.role,
      };
      this.usersBySocket.set(client.id, user);
      this.socketsByUser.set(user.userId, client.id);

      const location = await this.gameService.findSeatLocation(user.userId);
      if (location) {
        await this.gameService.setSeatConnected(user.userId, true);
        client.join(this.roomName(location.tableId));
        const cards = await this.gameService.getHoleCards(location.tableId, user.userId);
        if (cards) {
          client.emit('your_cards', { cards });
        }
        await this.broadcastTableState(location.tableId);
      }
    } catch {
      client.emit('error', { message: 'Autenticação inválida' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = this.usersBySocket.get(client.id);
    this.usersBySocket.delete(client.id);
    if (!user) {
      return;
    }
    if (this.socketsByUser.get(user.userId) === client.id) {
      this.socketsByUser.delete(user.userId);
    }
    const tableId = await this.gameService.setSeatConnected(user.userId, false);
    if (tableId) {
      await this.broadcastTableState(tableId);
    }
  }

  @SubscribeMessage('join_table')
  async onJoinTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { tableId: string; buyIn?: number },
  ) {
    const user = this.usersBySocket.get(client.id);
    if (!user || !body?.tableId) {
      return;
    }
    try {
      const location = await this.gameService.findSeatLocation(user.userId);
      if (location && location.tableId === body.tableId) {
        await this.gameService.setSeatConnected(user.userId, true);
      } else if (location) {
        throw new Error('Você já está sentado em outra mesa');
      } else {
        await this.gameService.addPlayerToTable(body.tableId, user.userId, body.buyIn);
      }
      client.join(this.roomName(body.tableId));
      const cards = await this.gameService.getHoleCards(body.tableId, user.userId);
      if (cards) {
        client.emit('your_cards', { cards });
      }
      await this.broadcastTableState(body.tableId);
    } catch (error) {
      client.emit('error', { message: this.errorMessage(error) });
    }
  }

  @SubscribeMessage('leave_table')
  async onLeaveTable(@ConnectedSocket() client: Socket) {
    const user = this.usersBySocket.get(client.id);
    if (!user) {
      return;
    }
    try {
      const location = await this.gameService.findSeatLocation(user.userId);
      if (!location) {
        return;
      }
      const outcome = await this.gameService.removePlayerFromTable(user.userId, location.tableId);
      client.leave(this.roomName(location.tableId));
      await this.afterGameUpdate(location.tableId, outcome.handResult);
    } catch (error) {
      client.emit('error', { message: this.errorMessage(error) });
    }
  }

  @SubscribeMessage('player_action')
  async onPlayerAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { action: string; amount?: number },
  ) {
    const user = this.usersBySocket.get(client.id);
    if (!user || !body?.action) {
      return;
    }
    try {
      const location = await this.gameService.findSeatLocation(user.userId);
      if (!location) {
        throw new Error('Você não está sentado em uma mesa');
      }
      const game = await this.gameService.getOrCreateGame(location.tableId);
      this.clearTurnTimer(location.tableId);
      const outcome = await this.gameService.processAction(
        game.id,
        user.userId,
        body.action as any,
        body.amount,
      );
      await this.afterGameUpdate(location.tableId, outcome.handResult);
    } catch (error) {
      client.emit('error', { message: this.errorMessage(error) });
      const location = await this.gameService.findSeatLocation(user.userId);
      if (location) {
        await this.emitActionRequired(location.tableId);
      }
    }
  }

  @SubscribeMessage('request_start_hand')
  async onRequestStartHand(@ConnectedSocket() client: Socket) {
    const user = this.usersBySocket.get(client.id);
    if (!user) {
      return;
    }
    const location = await this.gameService.findSeatLocation(user.userId);
    if (!location) {
      client.emit('error', { message: 'Você não está sentado em uma mesa' });
      return;
    }
    await this.startHand(location.tableId, client);
  }

  @SubscribeMessage('chat_message')
  async onChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { message?: string },
  ) {
    const user = this.usersBySocket.get(client.id);
    const message = String(body?.message ?? '').trim().slice(0, 200);
    if (!user || !message) {
      return;
    }
    const location = await this.gameService.findSeatLocation(user.userId);
    if (!location) {
      return;
    }
    this.server.to(this.roomName(location.tableId)).emit('chat_message', {
      userId: user.userId,
      displayName: user.displayName,
      message,
      timestamp: Date.now(),
    });
  }

  async startHand(tableId: string, requester?: Socket) {
    try {
      this.clearNextHandTimer(tableId);
      const outcome = await this.gameService.startNewHand(tableId);
      for (const dealt of outcome.dealt) {
        const socketId = this.socketsByUser.get(dealt.userId);
        if (socketId) {
          this.server.to(socketId).emit('your_cards', { cards: dealt.cards });
        }
      }
      await this.afterGameUpdate(tableId, outcome.handResult);
    } catch (error) {
      if (requester) {
        requester.emit('error', { message: this.errorMessage(error) });
      }
    }
  }

  async kickPlayer(tableId: string, userId: string) {
    const outcome = await this.gameService.removePlayerFromTable(userId, tableId);
    const socketId = this.socketsByUser.get(userId);
    if (socketId) {
      const socket = this.server.sockets.sockets.get(socketId);
      socket?.leave(this.roomName(tableId));
      socket?.emit('error', { message: 'Você foi removido da mesa pelo manager' });
    }
    await this.afterGameUpdate(tableId, outcome.handResult);
  }

  async closeTable(tableId: string) {
    this.clearTurnTimer(tableId);
    this.clearNextHandTimer(tableId);
    const affectedUserIds = await this.gameService.closeTable(tableId);
    for (const userId of affectedUserIds) {
      const socketId = this.socketsByUser.get(userId);
      if (socketId) {
        const socket = this.server.sockets.sockets.get(socketId);
        socket?.emit('error', { message: 'A mesa foi fechada pelo manager' });
        socket?.leave(this.roomName(tableId));
      }
    }
    this.server.to(this.roomName(tableId)).emit('table_closed', { tableId });
  }

  async broadcastTableState(tableId: string) {
    const room = this.server.sockets.adapter.rooms.get(this.roomName(tableId));
    if (!room) {
      return;
    }
    for (const socketId of room) {
      const user = this.usersBySocket.get(socketId);
      if (!user) {
        continue;
      }
      const state = await this.gameService.getTableState(tableId, user.userId);
      this.server.to(socketId).emit('table_state', state);
    }
  }

  private async afterGameUpdate(tableId: string, handResult: HandResult | null) {
    await this.broadcastTableState(tableId);
    if (handResult) {
      this.clearTurnTimer(tableId);
      this.server.to(this.roomName(tableId)).emit('hand_result', handResult);
      this.scheduleNextHand(tableId);
      return;
    }
    await this.emitActionRequired(tableId);
  }

  private async emitActionRequired(tableId: string) {
    const turnInfo = await this.gameService.getCurrentTurnInfo(tableId);
    if (!turnInfo) {
      return;
    }
    const socketId = this.socketsByUser.get(turnInfo.userId);
    if (socketId) {
      this.server.to(socketId).emit('action_required', {
        options: turnInfo.options,
        deadline: turnInfo.deadline,
      });
    }
    this.startTurnTimer(tableId, turnInfo.userId);
  }

  private startTurnTimer(tableId: string, userId: string) {
    this.clearTurnTimer(tableId);
    const timer = setTimeout(async () => {
      this.turnTimers.delete(tableId);
      try {
        const turnInfo = await this.gameService.getCurrentTurnInfo(tableId);
        if (!turnInfo || turnInfo.userId !== userId) {
          return;
        }
        const result = await this.gameService.autoActCurrentTurn(tableId);
        if (result) {
          await this.afterGameUpdate(tableId, result.outcome.handResult);
        }
      } catch {
        await this.broadcastTableState(tableId);
      }
    }, TURN_TIME_MS + 1000);
    this.turnTimers.set(tableId, timer);
  }

  private scheduleNextHand(tableId: string) {
    this.clearNextHandTimer(tableId);
    const timer = setTimeout(async () => {
      this.nextHandTimers.delete(tableId);
      if (await this.gameService.canStartHand(tableId)) {
        await this.startHand(tableId);
      }
    }, NEXT_HAND_DELAY_MS);
    this.nextHandTimers.set(tableId, timer);
  }

  private clearTurnTimer(tableId: string) {
    const timer = this.turnTimers.get(tableId);
    if (timer) {
      clearTimeout(timer);
      this.turnTimers.delete(tableId);
    }
  }

  private clearNextHandTimer(tableId: string) {
    const timer = this.nextHandTimers.get(tableId);
    if (timer) {
      clearTimeout(timer);
      this.nextHandTimers.delete(tableId);
    }
  }

  private roomName(tableId: string): string {
    return `table:${tableId}`;
  }

  private errorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as Error).message);
    }
    return 'Erro inesperado';
  }
}
