import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-messages-container',
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

  trackByMessageId(index: number, message: any): string {
    return message.id;
  }
}
