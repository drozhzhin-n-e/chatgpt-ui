export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
  lastLoginAt: string;
  accountType: 'free' | 'pro';
}

export interface UserWithPassword extends User {
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

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
  userId?: string; // Привязка к пользователю
}
