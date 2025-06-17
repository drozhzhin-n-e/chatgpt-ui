import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserWithPassword, AuthState, Chat } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_KEY = 'chatgpt-ui-users';
  private readonly CURRENT_USER_KEY = 'chatgpt-ui-current-user';
  
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null
  });

  public authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const currentUser = this.getCurrentUserFromStorage();
    if (currentUser) {
      this.authStateSubject.next({
        isAuthenticated: true,
        user: currentUser
      });
    }
  }

  register(username: string, password: string, email?: string): Observable<{ success: boolean; message: string }> {
    return new Observable(observer => {
      try {
        const users = this.getUsers();
        
        // Check if user already exists
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
          observer.next({ success: false, message: 'Username already exists' });
          observer.complete();
          return;
        }

        if (email && users.find(u => u.email?.toLowerCase() === email.toLowerCase())) {
          observer.next({ success: false, message: 'Email already exists' });
          observer.complete();
          return;
        }

        // Create new user
        const newUser: User = {
          id: this.generateId(),
          username,
          email,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          accountType: 'free' // New users start with free account
        };

        // Save password separately (should be hashed in production)
        const userWithPassword = { ...newUser, password };
        users.push(userWithPassword);
        this.saveUsers(users);

        // Auto login
        this.setCurrentUser(newUser);
        
        observer.next({ success: true, message: 'Account created successfully!' });
        observer.complete();
      } catch (error) {
        observer.next({ success: false, message: 'Registration failed' });
        observer.complete();
      }
    });
  }

  login(username: string, password: string): Observable<{ success: boolean; message: string }> {
    return new Observable(observer => {
      try {
        const users = this.getUsers();
        const user = users.find(u => 
          u.username.toLowerCase() === username.toLowerCase() && 
          u.password === password
        );

        if (!user) {
          observer.next({ success: false, message: 'Invalid username or password' });
          observer.complete();
          return;
        }

        // Update last login time
        user.lastLoginAt = new Date().toISOString();
        this.saveUsers(users);

        // Set current user
        const { password: _, ...userWithoutPassword } = user;
        this.setCurrentUser(userWithoutPassword);

        observer.next({ success: true, message: 'Signed in successfully!' });
        observer.complete();
      } catch (error) {
        observer.next({ success: false, message: 'Sign in failed' });
        observer.complete();
      }
    });
  }

  logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.authStateSubject.next({
      isAuthenticated: false,
      user: null
    });
  }

  getCurrentUser(): User | null {
    return this.authStateSubject.value.user;
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  upgradeToProAccount(): Observable<{ success: boolean; message: string }> {
    return new Observable(observer => {
      try {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
          observer.next({ success: false, message: 'User not found' });
          observer.complete();
          return;
        }

        // Update user account type
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], accountType: 'pro' };
          this.saveUsers(users);

          // Update current user state
          const updatedUser = { ...currentUser, accountType: 'pro' as const };
          this.setCurrentUser(updatedUser);

          observer.next({ success: true, message: 'Upgraded to Pro Account!' });
        } else {
          observer.next({ success: false, message: 'Failed to upgrade account' });
        }
        observer.complete();
      } catch (error) {
        observer.next({ success: false, message: 'Upgrade failed' });
        observer.complete();
      }
    });
  }

  deleteAccount(): Observable<{ success: boolean; message: string }> {
    return new Observable(observer => {
      try {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
          observer.next({ success: false, message: 'User not found' });
          observer.complete();
          return;
        }

        // Remove user from users list
        const users = this.getUsers();
        const filteredUsers = users.filter(u => u.id !== currentUser.id);
        this.saveUsers(filteredUsers);

        // Remove user's chats
        this.deleteUserChats(currentUser.id);

        // Clear current user session
        this.logout();

        observer.next({ success: true, message: 'Account deleted successfully!' });
        observer.complete();
      } catch (error) {
        observer.next({ success: false, message: 'Failed to delete account' });
        observer.complete();
      }
    });
  }

  private deleteUserChats(userId: string): void {
    try {
      // Remove user's chats from localStorage
      const CHATS_KEY = 'chatgpt-ui-chats-v1';
      const CURRENT_ID_KEY = 'chatgpt-ui-current-id-v1';
      
      const chatsData = localStorage.getItem(CHATS_KEY);
      if (chatsData) {
        const allChats = JSON.parse(chatsData);
        const filteredChats = allChats.filter((chat: Chat) => chat.userId !== userId);
        localStorage.setItem(CHATS_KEY, JSON.stringify(filteredChats));
      }

      // Clear current chat ID if it belonged to deleted user
      localStorage.removeItem(CURRENT_ID_KEY);
    } catch (error) {
      console.error('Error deleting user chats:', error);
    }
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    this.authStateSubject.next({
      isAuthenticated: true,
      user
    });
  }

  private getCurrentUserFromStorage(): User | null {
    try {
      const userData = localStorage.getItem(this.CURRENT_USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  private getUsers(): UserWithPassword[] {
    try {
      const usersData = localStorage.getItem(this.USERS_KEY);
      return usersData ? JSON.parse(usersData) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: UserWithPassword[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
}
