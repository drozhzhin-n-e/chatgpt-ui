import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Chat } from '../../chat/chat.service';

@Component({
  selector: 'app-chat-item',
  templateUrl: './chat-item.component.html',
  styleUrls: ['./chat-item.component.scss'],
  animations: [
    trigger('listItem', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' }))
      ])
    ])
  ]
})
export class ChatItemComponent implements AfterViewInit {
  @Input() chat!: Chat;
  @Input() active = false;
  @Output() rename = new EventEmitter<{ id: string, title: string }>();
  @Output() delete = new EventEmitter<string>();
  
  @ViewChild('titleInput') titleInput?: ElementRef<HTMLInputElement>;
  
  isEditing = false;
  editTitle = '';
  
  ngAfterViewInit() {
    if (this.isEditing && this.titleInput) {
      this.titleInput.nativeElement.focus();
      this.titleInput.nativeElement.select();
    }
  }
  
  startEdit() {
    this.isEditing = true;
    this.editTitle = this.chat.title;
    // Focus after view update
    setTimeout(() => {
      if (this.titleInput) {
        this.titleInput.nativeElement.focus();
        this.titleInput.nativeElement.select();
      }
    });
  }
  
  saveEdit() {
    if (this.editTitle.trim() && this.editTitle !== this.chat.title) {
      this.rename.emit({ id: this.chat.id, title: this.editTitle.trim() });
    }
    this.isEditing = false;
  }
  
  cancelEdit() {
    this.isEditing = false;
    this.editTitle = '';
  }
  
  deleteChat() {
    if (confirm(`Delete "${this.chat.title}"?`)) {
      this.delete.emit(this.chat.id);
    }
  }
}
