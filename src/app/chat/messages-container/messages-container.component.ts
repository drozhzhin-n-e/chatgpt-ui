import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChatService } from '../chat.service';
import { Message } from '../../shared/models/interfaces';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

@Component({
  selector: 'app-messages-container',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent],
  templateUrl: './messages-container.component.html',
  styleUrls: ['./messages-container.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class MessagesContainerComponent {
  messages$ = this.chat.messages$;

  constructor(private chat: ChatService) {}

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }
}
