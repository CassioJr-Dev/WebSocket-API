import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server

  private users: Record<string, string> = {}

  handleConnection(client: any, ...args: any[]) {
    console.log(`Cliente conectado: ${client.id}`)
  }

  handleDisconnect(client: any) {
    console.log(`Cliente desconectado: ${client.id}`)
    delete this.users[client.id]
    this.broadcastUsers()
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, username: string): void {
    this.users[client.id] = username
    this.broadcastUsers()
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: { message: string }): void {
    const username = this.users[client.id] || 'Anônimo'
    this.server.emit('message', { username, message: payload.message })
  }

  private broadcastUsers() {
    this.server.emit('users', Object.values(this.users))
  }
}
