import { Component } from '@angular/core';
import { ChatService } from '../chat/chat.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  constructor(private chat: ChatService) {}

  newChat() {
    this.chat.newChat();
  }
}
