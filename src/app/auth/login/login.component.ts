import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  isLoginMode = true;
  isLoading = false;
  
  loginForm = {
    username: '',
    password: ''
  };

  registerForm = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  message = '';
  messageType: 'success' | 'error' = 'error';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.clearMessage();
    this.clearForms();
  }

  onLogin(): void {
    if (!this.loginForm.username || !this.loginForm.password) {
      this.showMessage('Please fill in all fields', 'error');
      return;
    }

    this.isLoading = true;
    this.authService.login(this.loginForm.username, this.loginForm.password)
      .subscribe(result => {
        this.isLoading = false;
        if (result.success) {
          // Reset to welcome screen for new login session
          this.resetChatState();
          this.router.navigate(['/chat']);
        } else {
          this.showMessage(result.message, 'error');
        }
      });
  }

  private resetChatState(): void {
    // Clear current chat to show welcome screen
    localStorage.removeItem('chatgpt-ui-current-id-v1');
  }

  onRegister(): void {
    if (!this.registerForm.username || !this.registerForm.password) {
      this.showMessage('Please fill in required fields', 'error');
      return;
    }

    if (this.registerForm.password !== this.registerForm.confirmPassword) {
      this.showMessage('Passwords do not match', 'error');
      return;
    }

    if (this.registerForm.password.length < 4) {
      this.showMessage('Password must be at least 4 characters long', 'error');
      return;
    }

    this.isLoading = true;
    this.authService.register(
      this.registerForm.username, 
      this.registerForm.password,
      this.registerForm.email || undefined
    ).subscribe(result => {
      this.isLoading = false;
      if (result.success) {
        this.showMessage(result.message, 'success');
        setTimeout(() => {
          this.router.navigate(['/chat']);
        }, 1000);
      } else {
        this.showMessage(result.message, 'error');
      }
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

  private clearForms(): void {
    this.loginForm = { username: '', password: '' };
    this.registerForm = { username: '', email: '', password: '', confirmPassword: '' };
  }
} 