import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService, Theme } from '../../shared/services/theme.service';
import { AuthService, User } from '../../shared/services/auth.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar-footer',
  templateUrl: './sidebar-footer.component.html',
  styleUrls: ['./sidebar-footer.component.scss']
})
export class SidebarFooterComponent implements OnInit, OnDestroy {
  theme$: Observable<Theme>;
  user: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private router: Router
  ) {
    this.theme$ = this.themeService.theme$;
  }

  ngOnInit(): void {
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        this.user = authState.user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToChat(): void {
    this.router.navigate(['/chat']);
  }

  navigateToAccount(): void {
    this.router.navigate(['/account']);
  }

  getUserEmail(): string {
    return this.user?.email || this.user?.username || 'User';
  }

  getAccountTypeLabel(): string {
    if (!this.user) return '';
    return this.user.accountType === 'pro' ? 'Pro Account' : 'Free Account';
  }

  upgradeToPro(): void {
    if (!this.user || this.user.accountType === 'pro') return;
    
    this.authService.upgradeToProAccount().subscribe(result => {
      if (result.success) {
        // Show success message or notification
        console.log(result.message);
      } else {
        console.error(result.message);
      }
    });
  }
} 