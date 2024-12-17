import { Injectable } from '@nestjs/common'

@Injectable()
export class ChatService {
  private messages: { username: string; message: string }[] = []

  addMessage(username: string, message: string) {
    this.messages.push({ username, message })
  }

  getAllMessages() {
    return this.messages
  }
}
