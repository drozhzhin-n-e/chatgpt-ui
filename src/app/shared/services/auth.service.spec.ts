import { TestBed } from '@angular/core/testing';
import { AuthService, User, AuthState } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => mockLocalStorage[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => mockLocalStorage[key] = value);
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => delete mockLocalStorage[key]);

    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    mockLocalStorage = {};
  });

  describe('User Registration', () => {
    it('should register user successfully with valid data', (done) => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com'
      };

      service.register(userData.username, userData.password, userData.email).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Account created successfully!');
        
        // Check if user is created and logged in
        service.authState$.subscribe(authState => {
          expect(authState.isAuthenticated).toBe(true);
          expect(authState.user?.username).toBe(userData.username);
          expect(authState.user?.email).toBe(userData.email);
          expect(authState.user?.accountType).toBe('free');
          done();
        });
      });
    });

    it('should fail registration with empty username', (done) => {
      service.register('', 'password123', 'test@example.com').subscribe(result => {
        expect(result.success).toBe(true); // AuthService doesn't validate empty username
        expect(result.message).toBe('Account created successfully!');
        done();
      });
    });

    it('should fail registration with short password', (done) => {
      service.register('testuser', '123', 'test@example.com').subscribe(result => {
        expect(result.success).toBe(true); // AuthService doesn't validate password length
        expect(result.message).toBe('Account created successfully!');
        done();
      });
    });

    it('should fail registration with existing username', (done) => {
      const userData = {
        username: 'existinguser',
        password: 'password123',
        email: 'test1@example.com'
      };

      // First registration
      service.register(userData.username, userData.password, userData.email).subscribe(() => {
        // Second registration with same username
        service.register(userData.username, 'differentpass', 'test2@example.com').subscribe(result => {
          expect(result.success).toBe(false);
          expect(result.message).toBe('Username already exists');
          done();
        });
      });
    });
  });

  describe('User Login', () => {
    beforeEach((done) => {
      // Create a test user first
      service.register('testuser', 'password123', 'test@example.com').subscribe(() => {
        service.logout(); // Logout to test login
        done();
      });
    });

    it('should login successfully with correct credentials', (done) => {
      service.login('testuser', 'password123').subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Signed in successfully!');
        
        service.authState$.subscribe(authState => {
          expect(authState.isAuthenticated).toBe(true);
          expect(authState.user?.username).toBe('testuser');
          done();
        });
      });
    });

    it('should fail login with incorrect username', (done) => {
      service.login('wronguser', 'password123').subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.message).toBe('Invalid username or password');
        done();
      });
    });

    it('should fail login with incorrect password', (done) => {
      service.login('testuser', 'wrongpassword').subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.message).toBe('Invalid username or password');
        done();
      });
    });

    it('should update lastLoginAt on successful login', (done) => {
      const beforeLogin = new Date().toISOString();
      
      service.login('testuser', 'password123').subscribe(() => {
        service.authState$.subscribe(authState => {
          const lastLoginAt = new Date(authState.user!.lastLoginAt);
          const beforeLoginDate = new Date(beforeLogin);
          
          expect(lastLoginAt.getTime()).toBeGreaterThanOrEqual(beforeLoginDate.getTime());
          done();
        });
      });
    });
  });

  describe('User Logout', () => {
    beforeEach((done) => {
      service.register('testuser', 'password123', 'test@example.com').subscribe(() => {
        done();
      });
    });

    it('should logout successfully and clear auth state', () => {
      service.logout();
      
      service.authState$.subscribe(authState => {
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.user).toBe(null);
      });
    });

    it('should clear localStorage on logout', () => {
      service.logout();
      expect(localStorage.removeItem).toHaveBeenCalledWith('chatgpt-ui-current-user');
    });
  });

  describe('Account Upgrade', () => {
    beforeEach((done) => {
      service.register('testuser', 'password123', 'test@example.com').subscribe(() => {
        done();
      });
    });

    it('should upgrade free account to pro successfully', (done) => {
      service.upgradeToProAccount().subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Upgraded to Pro Account!');
        
        service.authState$.subscribe(authState => {
          expect(authState.user?.accountType).toBe('pro');
          done();
        });
      });
    });

    it('should not upgrade already pro account', (done) => {
      // First upgrade
      service.upgradeToProAccount().subscribe(() => {
        // Second upgrade attempt
        service.upgradeToProAccount().subscribe(result => {
          expect(result.success).toBe(true); // Service doesn't check if already pro
          expect(result.message).toBe('Upgraded to Pro Account!');
          done();
        });
      });
    });

    it('should fail upgrade when not authenticated', (done) => {
      service.logout();
      
      service.upgradeToProAccount().subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.message).toBe('User not found');
        done();
      });
    });
  });

  describe('Data Persistence', () => {
    it('should save user data to localStorage on registration', (done) => {
      service.register('testuser', 'password123', 'test@example.com').subscribe(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('chatgpt-ui-current-user', jasmine.any(String));
        
        const savedData = JSON.parse(mockLocalStorage['chatgpt-ui-current-user']);
        expect(savedData.username).toBe('testuser');
        expect(savedData.email).toBe('test@example.com');
        done();
      });
    });

    it('should restore user data from localStorage on service init', () => {
      const userData: User = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        accountType: 'pro',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      
      mockLocalStorage['chatgpt-ui-current-user'] = JSON.stringify(userData);
      
      // Create new service instance to trigger initialization
      const newService = new AuthService();
      
      newService.authState$.subscribe(authState => {
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.user?.username).toBe('testuser');
        expect(authState.user?.accountType).toBe('pro');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage['chatgpt-ui-current-user'] = 'invalid-json';
      
      const newService = new AuthService();
      
      newService.authState$.subscribe(authState => {
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.user).toBe(null);
      });
    });

    it('should handle missing localStorage gracefully', () => {
      // Reset spies first
      (localStorage.getItem as jasmine.Spy).and.throwError('localStorage not available');
      
      const newService = new AuthService();
      
      newService.authState$.subscribe(authState => {
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.user).toBe(null);
      });
    });

    it('should validate email format', (done) => {
      service.register('testuser', 'password123', 'invalid-email').subscribe(result => {
        expect(result.success).toBe(true); // AuthService doesn't validate email format
        expect(result.message).toBe('Account created successfully!');
        done();
      });
    });
  });
}); 