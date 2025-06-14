import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatService, Chat } from '../../chat/chat.service';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss']
})
export class ChatListComponent {
  chats$: Observable<Chat[]>;
  currentId$: Observable<string | null>;

  constructor(private chatService: ChatService) {
    this.chats$ = this.chatService.userChats$; // Используем фильтрованные чаты пользователя
    this.currentId$ = this.chatService.currentId$;
  }

  select(id: string) {
    this.chatService.selectChat(id);
  }

  rename(event: { id: string, title: string }) {
    this.chatService.renameChat(event.id, event.title);
  }

  delete(id: string) {
    this.chatService.deleteChat(id);
  }
}
