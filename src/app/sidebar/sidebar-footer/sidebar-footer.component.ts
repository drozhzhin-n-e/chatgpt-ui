import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService, Theme } from '../../shared/services/theme.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar-footer',
  templateUrl: './sidebar-footer.component.html',
  styleUrls: ['./sidebar-footer.component.scss']
})
export class SidebarFooterComponent {
  theme$: Observable<Theme>;

  constructor(
    private themeService: ThemeService,
    private router: Router
  ) {
    this.theme$ = this.themeService.theme$;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  navigateToChat(): void {
    this.router.navigate(['/chat']);
  }
} 