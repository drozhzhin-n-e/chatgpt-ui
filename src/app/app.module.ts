import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';

import { SidebarModule } from './sidebar/sidebar.module';

import { AppComponent } from './app.component';

import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/chat', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(c => c.LoginComponent) },
  { path: 'chat', loadComponent: () => import('./chat/chat-view/chat-view.component').then(c => c.ChatViewComponent), canActivate: [AuthGuard] },
  { path: 'account', loadComponent: () => import('./account/account.component').then(c => c.AccountComponent), canActivate: [AuthGuard] },
  { path: 'design-system', loadComponent: () => import('./design-system/design-system.component').then(c => c.DesignSystemComponent), canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/chat' }
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    SidebarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
