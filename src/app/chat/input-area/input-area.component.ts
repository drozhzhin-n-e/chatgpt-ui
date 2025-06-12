import { Component } from '@angular/core';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-input-area',
  templateUrl: './input-area.component.html',
  styleUrls: ['./input-area.component.scss']
})
export class InputAreaComponent {
  text = '';
  constructor(private chat: ChatService) {}

  onEnter(ev: Event) {
    const e = ev as KeyboardEvent;
    if (!e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  send() {
    const t = this.text.trim();
    if (!t) return;
    this.chat.send(t);
    this.text = '';
  }
}
