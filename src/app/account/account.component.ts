import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, User } from '../shared/services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  user: User | null = null;
  isEditing = false;
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  editForm = {
    username: '',
    email: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        this.user = authState.user;
        if (this.user) {
          this.editForm = {
            username: this.user.username,
            email: this.user.email || ''
          };
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startEditing(): void {
    this.isEditing = true;
    this.clearMessage();
  }

  cancelEditing(): void {
    this.isEditing = false;
    if (this.user) {
      this.editForm = {
        username: this.user.username,
        email: this.user.email || ''
      };
    }
    this.clearMessage();
  }

  saveChanges(): void {
    if (!this.user) return;

    if (!this.editForm.username.trim()) {
      this.showMessage('Username is required', 'error');
      return;
    }

    this.isLoading = true;
    // In a real app, this would be an API call
    // For now, we'll simulate the update
    setTimeout(() => {
      this.isLoading = false;
      this.isEditing = false;
      this.showMessage('Profile updated successfully!', 'success');
    }, 1000);
  }

  upgradeToPro(): void {
    if (!this.user || this.user.accountType === 'pro') return;
    
    this.isLoading = true;
    this.authService.upgradeToProAccount().subscribe(result => {
      this.isLoading = false;
      if (result.success) {
        this.showMessage(result.message, 'success');
      } else {
        this.showMessage(result.message, 'error');
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    this.isLoading = true;
    this.authService.deleteAccount().subscribe(result => {
      this.isLoading = false;
      if (result.success) {
        // Account deleted successfully, user is already logged out
        this.router.navigate(['/login']);
      } else {
        this.showMessage(result.message, 'error');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/chat']);
  }

  getAccountTypeLabel(): string {
    if (!this.user) return '';
    return this.user.accountType === 'pro' ? 'Pro Account' : 'Free Account';
  }

  getJoinDate(): string {
    if (!this.user) return '';
    const date = new Date(this.user.createdAt);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => this.clearMessage(), 5000);
  }

  private clearMessage(): void {
    this.message = '';
  }
} 