import { Component } from '@angular/core';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.scss']
})
export class ChatViewComponent {
  messages$ = this.chat.messages$;
  constructor(private chat: ChatService) {}
}
