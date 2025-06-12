import { Component } from '@angular/core';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-welcome-screen',
  templateUrl: './welcome-screen.component.html',
  styleUrls: ['./welcome-screen.component.scss']
})
export class WelcomeScreenComponent {
  constructor(private chat: ChatService) {}

  useExample(text: string) {
    this.chat.send(text);
  }
}
