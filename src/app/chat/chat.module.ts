import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared.module';
import { FormsModule } from '@angular/forms';
import { ChatViewComponent } from './chat-view/chat-view.component';
import { WelcomeScreenComponent } from './welcome-screen/welcome-screen.component';
import { MessagesContainerComponent } from './messages-container/messages-container.component';
import { MessageBubbleComponent } from './message-bubble/message-bubble.component';
import { InputAreaComponent } from './input-area/input-area.component';

@NgModule({
  declarations: [
    ChatViewComponent,
    WelcomeScreenComponent,
    MessagesContainerComponent,
    MessageBubbleComponent,
    InputAreaComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule
  ],
  exports: [
    ChatViewComponent
  ]
})
export class ChatModule { }
