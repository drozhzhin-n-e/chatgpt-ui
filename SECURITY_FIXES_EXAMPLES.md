# 🔒 Примеры исправления проблем безопасности

## 1. Безопасное хранение паролей

### Текущая проблема
```typescript
// src/app/shared/services/auth.service.ts:75
const userWithPassword = { ...newUser, password }; // Пароль в открытом виде!
users.push(userWithPassword);
this.saveUsers(users); // Сохраняется в localStorage без шифрования
```

### Решение

#### Шаг 1: Установить bcryptjs
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

#### Шаг 2: Создать CryptoService
```typescript
// src/app/shared/services/crypto.service.ts
import { Injectable } from '@angular/core';
import * as bcrypt from 'bcryptjs';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private readonly SALT_ROUNDS = 12;

  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  // Дополнительная защита - шифрование данных в localStorage
  encryptData(data: string, key: string): string {
    // Простое XOR шифрование для демонстрации
    // В продакшене использовать crypto-js или Web Crypto API
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  decryptData(encryptedData: string, key: string): string {
    try {
      const data = atob(encryptedData);
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch {
      return '';
    }
  }
}
```

#### Шаг 3: Обновить AuthService
```typescript
// src/app/shared/services/auth.service.ts
import { CryptoService } from './crypto.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private cryptoService: CryptoService) {
    this.initializeAuth();
  }

  async register(username: string, password: string, email?: string): Promise<{ success: boolean; message: string }> {
    try {
      const users = this.getUsers();
      
      // Проверка существующих пользователей
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, message: 'Username already exists' };
      }

      if (email && users.find(u => u.email?.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: 'Email already exists' };
      }

      // Валидация пароля
      if (password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters long' };
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return { success: false, message: 'Password must contain uppercase, lowercase and number' };
      }

      // Создание пользователя с хешированным паролем
      const newUser: User = {
        id: this.generateId(),
        username,
        email,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        accountType: 'free'
      };

      // Хеширование пароля
      const hashedPassword = await this.cryptoService.hashPassword(password);
      const userWithPassword = { ...newUser, password: hashedPassword };
      
      users.push(userWithPassword);
      this.saveUsers(users);

      // Автоматический вход
      this.setCurrentUser(newUser);
      
      return { success: true, message: 'Account created successfully!' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const users = this.getUsers();
      const user = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase()
      );

      if (!user) {
        return { success: false, message: 'Invalid username or password' };
      }

      // Проверка пароля с хешем
      const isValidPassword = await this.cryptoService.verifyPassword(password, (user as any).password);
      
      if (!isValidPassword) {
        return { success: false, message: 'Invalid username or password' };
      }

      // Обновление времени последнего входа
      user.lastLoginAt = new Date().toISOString();
      this.saveUsers(users);

      // Установка текущего пользователя
      const { password: _, ...userWithoutPassword } = user as any;
      this.setCurrentUser(userWithoutPassword);

      return { success: true, message: 'Signed in successfully!' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Sign in failed' };
    }
  }

  // Безопасное сохранение пользователей
  private saveUsers(users: any[]): void {
    try {
      const userData = JSON.stringify(users);
      const encryptedData = this.cryptoService.encryptData(userData, this.getEncryptionKey());
      localStorage.setItem(this.USERS_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to save users:', error);
    }
  }

  // Безопасное получение пользователей
  private getUsers(): any[] {
    try {
      const encryptedData = localStorage.getItem(this.USERS_KEY);
      if (!encryptedData) return [];
      
      const decryptedData = this.cryptoService.decryptData(encryptedData, this.getEncryptionKey());
      return decryptedData ? JSON.parse(decryptedData) : [];
    } catch (error) {
      console.error('Failed to load users:', error);
      return [];
    }
  }

  // Генерация ключа шифрования на основе браузера
  private getEncryptionKey(): string {
    return navigator.userAgent + window.location.hostname;
  }
}
```

## 2. Защита от XSS атак

### Проблема
```typescript
// Потенциальная уязвимость в отображении сообщений
<div [innerHTML]="message.content"></div> // Опасно!
```

### Решение
```typescript
// src/app/shared/services/sanitizer.service.ts
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SanitizerService {
  constructor(private domSanitizer: DomSanitizer) {}

  sanitizeHtml(html: string): SafeHtml {
    return this.domSanitizer.sanitize(SecurityContext.HTML, html) || '';
  }

  // Очистка пользовательского ввода
  sanitizeUserInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Разрешенные HTML теги для сообщений
  sanitizeMessageContent(content: string): string {
    const allowedTags = ['b', 'i', 'u', 'br', 'p', 'strong', 'em'];
    // Реализация whitelist фильтрации
    return this.filterAllowedTags(content, allowedTags);
  }

  private filterAllowedTags(html: string, allowedTags: string[]): string {
    // Простая реализация - в продакшене использовать DOMPurify
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    return html.replace(tagRegex, (match, tagName) => {
      return allowedTags.includes(tagName.toLowerCase()) ? match : '';
    });
  }
}
```

## 3. CSRF защита

### Решение
```typescript
// src/app/shared/interceptors/csrf.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Добавление CSRF токена к запросам
    if (req.method !== 'GET') {
      const csrfToken = this.getCsrfToken();
      const csrfReq = req.clone({
        headers: req.headers.set('X-CSRF-Token', csrfToken)
      });
      return next.handle(csrfReq);
    }
    return next.handle(req);
  }

  private getCsrfToken(): string {
    // Получение CSRF токена из meta тега или cookie
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag?.getAttribute('content') || '';
  }
}
```

## 4. Content Security Policy

### index.html
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ChatGPT UI</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  
  <!-- Content Security Policy -->
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self'; 
                 script-src 'self' 'unsafe-inline'; 
                 style-src 'self' 'unsafe-inline'; 
                 img-src 'self' data: https:; 
                 connect-src 'self' https://api.openai.com;
                 font-src 'self';
                 object-src 'none';
                 base-uri 'self';
                 form-action 'self';">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

## 5. Валидация данных

### Улучшенная валидация
```typescript
// src/app/shared/validators/custom-validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const isValidLength = value.length >= 8;

      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && isValidLength;

      return passwordValid ? null : {
        strongPassword: {
          hasUpperCase,
          hasLowerCase,
          hasNumeric,
          hasSpecialChar,
          isValidLength
        }
      };
    };
  }

  static noSqlInjection(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(--|\/\*|\*\/|;|'|"|<|>)/
      ];

      const hasSqlInjection = sqlPatterns.some(pattern => pattern.test(value));
      return hasSqlInjection ? { sqlInjection: true } : null;
    };
  }

  static sanitizeInput(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      // Проверка на потенциально опасные символы
      const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
      ];

      const isDangerous = dangerousPatterns.some(pattern => pattern.test(value));
      return isDangerous ? { unsafeContent: true } : null;
    };
  }
}
```

## 6. Безопасная конфигурация Angular

### angular.json - Production настройки
```json
{
  "configurations": {
    "production": {
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "500kb",
          "maximumError": "1mb"
        }
      ],
      "outputHashing": "all",
      "extractCss": true,
      "namedChunks": false,
      "extractLicenses": true,
      "vendorChunk": false,
      "buildOptimizer": true,
      "optimization": true,
      "sourceMap": false,
      "aot": true,
      "serviceWorker": true,
      "ngswConfigPath": "ngsw-config.json"
    }
  }
}
```

## Заключение

Эти исправления значительно повысят безопасность приложения:

1. **Хеширование паролей** - защита от утечки данных
2. **XSS защита** - предотвращение выполнения вредоносного кода
3. **CSRF токены** - защита от межсайтовых запросов
4. **CSP заголовки** - ограничение источников контента
5. **Валидация данных** - предотвращение инъекций

**Приоритет внедрения:** Критический - все изменения должны быть внедрены до продакшена.

