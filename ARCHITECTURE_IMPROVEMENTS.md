# 🏗️ Архитектурные улучшения ChatGPT UI

## 1. Внедрение State Management (NgRx)

### Текущая проблема
```typescript
// Состояние разбросано по сервисам
// chat.service.ts
private _chats = new BehaviorSubject<Chat[]>(this.loadChats());
private _currentId = new BehaviorSubject<string | null>(this.loadCurrentId());

// auth.service.ts  
private authStateSubject = new BehaviorSubject<AuthState>({
  isAuthenticated: false,
  user: null
});
```

### Решение: Централизованное управление состоянием

#### Установка NgRx
```bash
ng add @ngrx/store
ng add @ngrx/effects
ng add @ngrx/store-devtools
```

#### State структура
```typescript
// src/app/store/app.state.ts
export interface AppState {
  auth: AuthState;
  chat: ChatState;
  ui: UiState;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export interface UiState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notifications: Notification[];
}
```

#### Actions
```typescript
// src/app/store/auth/auth.actions.ts
import { createAction, props } from '@ngrx/store';

export const login = createAction(
  '[Auth] Login',
  props<{ username: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const logout = createAction('[Auth] Logout');

export const register = createAction(
  '[Auth] Register',
  props<{ username: string; password: string; email?: string }>()
);
```

#### Reducers
```typescript
// src/app/store/auth/auth.reducer.ts
import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';

export const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AuthActions.loginSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false,
    user: null
  })),
  on(AuthActions.logout, () => initialState)
);
```

#### Effects
```typescript
// src/app/store/auth/auth.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(action =>
        this.authService.login(action.username, action.password).pipe(
          map(result => 
            result.success 
              ? AuthActions.loginSuccess({ user: result.user })
              : AuthActions.loginFailure({ error: result.message })
          ),
          catchError(error => of(AuthActions.loginFailure({ error: error.message })))
        )
      )
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      })
    ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router
  ) {}
}
```

#### Selectors
```typescript
// src/app/store/auth/auth.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(
  selectAuthState,
  state => state.user
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  state => state.isAuthenticated
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  state => state.loading
);

export const selectAuthError = createSelector(
  selectAuthState,
  state => state.error
);
```

## 2. Улучшение архитектуры модулей

### Feature Modules структура
```
src/app/
├── core/                    # Singleton сервисы
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── error-handler.service.ts
│   │   └── notification.service.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   ├── error.interceptor.ts
│   │   └── loading.interceptor.ts
│   └── core.module.ts
├── shared/                  # Переиспользуемые компоненты
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   ├── models/
│   └── shared.module.ts
├── features/               # Feature модули
│   ├── auth/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   └── auth.module.ts
│   ├── chat/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   └── chat.module.ts
│   └── account/
└── layout/                 # Layout компоненты
    ├── header/
    ├── sidebar/
    └── layout.module.ts
```

### Core Module
```typescript
// src/app/core/core.module.ts
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { LoadingInterceptor } from './interceptors/loading.interceptor';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }
}
```

## 3. Улучшение типизации

### Строгие типы для API
```typescript
// src/app/shared/models/api.models.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Строгие типы для форм
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm extends LoginForm {
  email: string;
  confirmPassword: string;
}
```

### Generic сервисы
```typescript
// src/app/core/services/base-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export abstract class BaseApiService<T, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  constructor(
    protected http: HttpClient,
    protected baseUrl: string
  ) {}

  getAll(): Observable<ApiResponse<T[]>> {
    return this.http.get<ApiResponse<T[]>>(this.baseUrl);
  }

  getById(id: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${id}`);
  }

  create(data: CreateDto): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.baseUrl, data);
  }

  update(id: string, data: UpdateDto): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}

// Использование
@Injectable()
export class ChatApiService extends BaseApiService<Chat, CreateChatDto, UpdateChatDto> {
  constructor(http: HttpClient) {
    super(http, '/api/chats');
  }

  // Дополнительные методы специфичные для чатов
  getMessagesByChat(chatId: string): Observable<ApiResponse<Message[]>> {
    return this.http.get<ApiResponse<Message[]>>(`${this.baseUrl}/${chatId}/messages`);
  }
}
```

## 4. Dependency Injection улучшения

### Injection Tokens
```typescript
// src/app/core/tokens/app.tokens.ts
import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
  appName: string;
  version: string;
  features: {
    enableNotifications: boolean;
    enableAnalytics: boolean;
  };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

export interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

export const STORAGE_SERVICE = new InjectionToken<StorageService>('storage.service');
```

### Провайдеры с фабриками
```typescript
// src/app/app.module.ts
import { APP_CONFIG, STORAGE_SERVICE } from './core/tokens/app.tokens';

function createAppConfig(): AppConfig {
  return {
    apiUrl: environment.apiUrl,
    appName: 'ChatGPT UI',
    version: '1.0.0',
    features: {
      enableNotifications: environment.production,
      enableAnalytics: environment.production
    }
  };
}

function createStorageService(): StorageService {
  return {
    get: <T>(key: string): T | null => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    },
    set: <T>(key: string, value: T): void => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    remove: (key: string): void => {
      localStorage.removeItem(key);
    },
    clear: (): void => {
      localStorage.clear();
    }
  };
}

@NgModule({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: createAppConfig
    },
    {
      provide: STORAGE_SERVICE,
      useFactory: createStorageService
    }
  ]
})
export class AppModule {}
```

## 5. Error Handling архитектура

### Централизованная обработка ошибок
```typescript
// src/app/core/services/error-handler.service.ts
import { Injectable, ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface AppError {
  message: string;
  code?: string;
  timestamp: Date;
  url?: string;
  userId?: string;
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private notificationService: NotificationService,
    private loggingService: LoggingService
  ) {}

  handleError(error: any): void {
    const appError = this.normalizeError(error);
    
    // Логирование
    this.loggingService.logError(appError);
    
    // Уведомление пользователя
    this.notificationService.showError(appError.message);
    
    // Отправка в систему мониторинга
    this.sendToMonitoring(appError);
  }

  private normalizeError(error: any): AppError {
    if (error instanceof HttpErrorResponse) {
      return {
        message: this.getHttpErrorMessage(error),
        code: error.status.toString(),
        timestamp: new Date(),
        url: error.url || undefined
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        timestamp: new Date()
      };
    }

    return {
      message: 'An unexpected error occurred',
      timestamp: new Date()
    };
  }

  private getHttpErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 401:
        return 'You are not authorized to perform this action';
      case 403:
        return 'Access denied';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Server error. Please try again later';
      default:
        return error.error?.message || 'Network error occurred';
    }
  }
}
```

## 6. Validation архитектура

### Реактивные формы с валидацией
```typescript
// src/app/shared/validators/form-validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

export class FormValidators {
  static passwordMatch(passwordField: string, confirmPasswordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formGroup = control as FormGroup;
      const password = formGroup.get(passwordField);
      const confirmPassword = formGroup.get(confirmPasswordField);

      if (!password || !confirmPassword) {
        return null;
      }

      return password.value === confirmPassword.value ? null : { passwordMismatch: true };
    };
  }

  static asyncUsernameValidator(authService: AuthService): ValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return authService.checkUsernameAvailability(control.value).pipe(
        map(isAvailable => isAvailable ? null : { usernameExists: true }),
        catchError(() => of(null))
      );
    };
  }
}

// Использование в компоненте
export class RegisterComponent {
  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)], [FormValidators.asyncUsernameValidator(this.authService)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, {
    validators: FormValidators.passwordMatch('password', 'confirmPassword')
  });
}
```

## 7. Testing архитектура

### Test Utilities
```typescript
// src/app/testing/test-utils.ts
import { ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

export class TestUtils {
  static getElement<T>(fixture: ComponentFixture<T>, selector: string): HTMLElement {
    return fixture.debugElement.query(By.css(selector))?.nativeElement;
  }

  static getAllElements<T>(fixture: ComponentFixture<T>, selector: string): HTMLElement[] {
    return fixture.debugElement.queryAll(By.css(selector)).map(de => de.nativeElement);
  }

  static clickElement<T>(fixture: ComponentFixture<T>, selector: string): void {
    const element = this.getElement(fixture, selector);
    element?.click();
    fixture.detectChanges();
  }

  static setInputValue<T>(fixture: ComponentFixture<T>, selector: string, value: string): void {
    const input = this.getElement(fixture, selector) as HTMLInputElement;
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
  }
}

// Mock Factory
export class MockFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: 'test-id',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      accountType: 'free',
      ...overrides
    };
  }

  static createChat(overrides: Partial<Chat> = {}): Chat {
    return {
      id: 'test-chat-id',
      title: 'Test Chat',
      messages: [],
      userId: 'test-user-id',
      ...overrides
    };
  }
}
```

## 8. Конфигурация Environment

### Типизированные environments
```typescript
// src/environments/environment.interface.ts
export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  version: string;
  features: {
    enableServiceWorker: boolean;
    enableAnalytics: boolean;
    enableNotifications: boolean;
    enableWebLLM: boolean;
  };
  storage: {
    prefix: string;
    encryptionEnabled: boolean;
  };
  auth: {
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
}

// src/environments/environment.ts
export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appName: 'ChatGPT UI Dev',
  version: '0.0.0',
  features: {
    enableServiceWorker: false,
    enableAnalytics: false,
    enableNotifications: true,
    enableWebLLM: true
  },
  storage: {
    prefix: 'chatgpt-ui-dev',
    encryptionEnabled: false
  },
  auth: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5
  }
};
```

## Заключение

Эти архитектурные улучшения обеспечат:

1. **Масштабируемость** - четкое разделение ответственности
2. **Maintainability** - легкость поддержки и развития
3. **Testability** - простота тестирования
4. **Type Safety** - строгая типизация
5. **Error Handling** - централизованная обработка ошибок
6. **State Management** - предсказуемое управление состоянием

**Приоритет внедрения:** Средний - важно для долгосрочного развития проекта.

