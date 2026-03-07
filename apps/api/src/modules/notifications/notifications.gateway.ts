import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * WebSocket Gateway cho real-time notifications.
 * Client kết nối với auth token:
 *   socket = io(WS_URL, { auth: { token: accessToken } })
 * Mỗi user được join vào room cá nhân: `user:{userId}`
 */
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  // Map socketId → userId để cleanup khi disconnect
  private readonly connectedUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Xác thực token từ handshake auth
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId: string = payload.sub;
      this.connectedUsers.set(client.id, userId);

      // Join room cá nhân
      await client.join(`user:${userId}`);
    } catch {
      // Token không hợp lệ → ngắt kết nối
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  /**
   * Client đánh dấu đã đọc notification qua WebSocket.
   * Emit 'notification:read_ack' về client để cập nhật UI ngay.
   */
  @SubscribeMessage('notification:read')
  handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    client.emit('notification:read_ack', { id: data.notificationId });
  }

  /** Gửi notification đến 1 user cụ thể (fire-and-forget) */
  sendToUser(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  /** Broadcast đến tất cả user trong 1 organization */
  sendToOrganization(organizationId: string, event: string, payload: unknown) {
    this.server.to(`org:${organizationId}`).emit(event, payload);
  }
}
