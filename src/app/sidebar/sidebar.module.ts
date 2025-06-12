import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from './sidebar.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatItemComponent } from './chat-item/chat-item.component';
import { SidebarFooterComponent } from './sidebar-footer/sidebar-footer.component';

@NgModule({
  declarations: [
    SidebarComponent,
    ChatListComponent,
    ChatItemComponent,
    SidebarFooterComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    SidebarComponent
  ]
})
export class SidebarModule { }
