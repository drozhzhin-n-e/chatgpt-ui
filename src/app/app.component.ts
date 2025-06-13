import { Component } from '@angular/core';
import { ThemeService } from './shared/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'chatgpt-ui';

  constructor(private themeService: ThemeService) {
    // Theme service will initialize automatically
  }
}
