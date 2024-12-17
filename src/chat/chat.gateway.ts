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

  private users: Record<string, { username: string; socketId: string }> = {}

  handleConnection(client: any, ...args: any[]) {
    console.log(`Cliente conectado: ${client.id}`)
  }

  handleDisconnect(client: any) {
    console.log(`Cliente desconectado: ${client.id}`)
    const user = Object.keys(this.users).find(
      key => this.users[key].socketId === client.id,
    )

    if (user) {
      delete this.users[user]
      this.broadcastUsers()
    }
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, username: string): void {
    this.users[username] = { username, socketId: client.id }
    this.broadcastUsers()
  }

  @SubscribeMessage('private_message')
  handlePrivateMessage(
    client: Socket,
    payload: { to: string; message: string },
  ): void {
    const sender = Object.keys(this.users).find(
      key => this.users[key].socketId === client.id,
    )

    if (!sender) {
      client.emit(
        'error',
        'Você precisa estar registrado para enviar mensagens.',
      )
      return
    }

    const recipient = this.users[payload.to]
    if (recipient) {
      this.server.to(recipient.socketId).emit('private_message', {
        from: sender,
        message: payload.message,
      })

      client.emit('private_message', {
        from: `Você`,
        message: payload.message,
      })
    } else {
      client.emit('error', `Usuário ${payload.to} não encontrado.`)
    }
  }

  private broadcastUsers() {
    const usernames = Object.values(this.users).map(user => user.username)
    this.server.emit('users', usernames)
  }
}
