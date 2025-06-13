import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../chat.service';
import { WelcomeScreenComponent } from '../welcome-screen/welcome-screen.component';
import { MessagesContainerComponent } from '../messages-container/messages-container.component';
import { InputAreaComponent } from '../input-area/input-area.component';

@Component({
  selector: 'app-chat-view',
  standalone: true,
  imports: [CommonModule, WelcomeScreenComponent, MessagesContainerComponent, InputAreaComponent],
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.scss']
})
export class ChatViewComponent {
  messages$ = this.chat.messages$;
  
  constructor(private chat: ChatService) {}
}
