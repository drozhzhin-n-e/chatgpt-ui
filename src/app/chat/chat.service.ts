import { Injectable } from '@angular/core';
import { BehaviorSubject, of, combineLatest } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';

export interface Message {
  id: string;
  author: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string – проще хранить
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly STORAGE_KEY = 'chatgpt-ui-chats-v1';
  private readonly CURRENT_ID_KEY = 'chatgpt-ui-current-id-v1';

  // ---------- state subjects ----------
  private _chats = new BehaviorSubject<Chat[]>(this.loadChats());
  readonly chats$ = this._chats.asObservable();

  private _currentId = new BehaviorSubject<string | null>(this.loadCurrentId());
  readonly currentId$ = this._currentId.asObservable();

  // messages derived from current chat
  readonly messages$ = combineLatest([this.chats$, this.currentId$]).pipe(
    map(([chats, id]) => chats.find(c => c.id === id)?.messages ?? [])
  );

  // demo replies for stubbed bot
  private demoResponses: Record<string, string> = {
    'квантов': 'Квантовая физика — это удивительная область науки!',
    'default': 'Отличный вопрос! Чем могу помочь?'
  };

  // ---------- public API ----------

  newChat(initialTitle = 'New chat'): string {
    const id = this.genId();
    const chat: Chat = { id, title: initialTitle, messages: [] };
    this._chats.next([chat, ...this._chats.value]);
    this._currentId.next(id);
    this.saveCurrentId();
    this.save();
    return id;
  }

  selectChat(id: string) {
    if (this._currentId.value !== id) {
      this._currentId.next(id);
      this.saveCurrentId();
    }
  }

  renameChat(id: string, title: string) {
    const chats = this._chats.value.map(c => c.id === id ? { ...c, title } : c);
    this._chats.next(chats);
    this.save();
  }

  deleteChat(id: string) {
    let chats = this._chats.value.filter(c => c.id !== id);
    this._chats.next(chats);
    // if deleted current – always go to welcome screen (null)
    if (this._currentId.value === id) {
      this._currentId.next(null);
      this.saveCurrentId();
    }
    this.save();
  }

  send(text: string) {
    const currentId = this._currentId.value ?? this.newChat();
    const chats = this._chats.value;
    const idx = chats.findIndex(c => c.id === currentId);
    if (idx === -1) return;

    const userMsg: Message = {
      id: this.genId(),
      author: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    chats[idx] = { ...chats[idx], messages: [...chats[idx].messages, userMsg] };
    
    // Auto-generate title from first message
    if (chats[idx].messages.length === 1 && chats[idx].title === 'New chat') {
      const title = this.generateTitle(text);
      chats[idx] = { ...chats[idx], title };
    }
    
    this._chats.next([...chats]);

    // small delay for natural feel (without typing indicator)
    const reply = this.getReply(text);
    of(reply)
      .pipe(
        delay(800), // shorter delay - feels more natural
        tap(content => {
          const botMsg: Message = {
            id: this.genId(),
            author: 'assistant',
            content,
            timestamp: new Date().toISOString()
          };
          
          const chats2 = this._chats.value;
          const i = chats2.findIndex(c => c.id === currentId);
          if (i !== -1) {
            chats2[i] = { ...chats2[i], messages: [...chats2[i].messages, botMsg] };
            this._chats.next([...chats2]);
            this.save();
          }
        })
      ).subscribe();

    this.save();
  }

  // ---------- helpers ----------

  private genId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  private save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._chats.value));
    } catch {
      // ignored
    }
  }

  private loadChats(): Chat[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore parsing errors
    }
    // default empty - show welcome screen
    return [];
  }

  private getReply(userText: string): string {
    const lower = userText.toLowerCase();
    for (const key of Object.keys(this.demoResponses)) {
      if (key !== 'default' && lower.includes(key)) {
        return this.demoResponses[key];
      }
    }
    return this.demoResponses['default'];
  }

  private generateTitle(text: string): string {
    // Take first 30 chars, clean up, add ellipsis if needed
    const clean = text.trim().replace(/\s+/g, ' ');
    if (clean.length <= 30) return clean;
    return clean.substring(0, 30).trim() + '...';
  }

  private loadCurrentId(): string | null {
    try {
      const raw = localStorage.getItem(this.CURRENT_ID_KEY);
      if (raw) {
        return raw;
      }
    } catch {
      // ignore parsing errors
    }
    return null;
  }

  private saveCurrentId() {
    try {
      localStorage.setItem(this.CURRENT_ID_KEY, this._currentId.value ?? '');
    } catch {
      // ignored
    }
  }
} 