// Authentication service for iKasiLink
// Handles JWT tokens, login, logout, and token refresh

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'moderator' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

class AuthService {
  private readonly baseUrl = process.env.VITE_AUTH_API_URL || 'http://localhost:4010';
  private readonly tokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';

  async signIn(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(errorData.error || 'Login failed');
    }

    const tokens: AuthTokens = await response.json();
    this.storeTokens(tokens);
    return tokens;
  }

  async signUp(data: SignUpData): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(errorData.error || 'Registration failed');
    }

    const tokens: AuthTokens = await response.json();
    this.storeTokens(tokens);
    return tokens;
  }

  async signOut(): Promise<void> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    
    if (refreshToken) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }

    this.clearTokens();
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Token refresh failed' }));
      throw new Error(errorData.error || 'Token refresh failed');
    }

    const tokens: AuthTokens = await response.json();
    this.storeTokens(tokens);
    return tokens;
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${this.baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.handleTokenExpiry();
        throw new Error('Session expired');
      }
      const errorData = await response.json().catch(() => ({ error: 'Failed to get user info' }));
      throw new Error(errorData.error || 'Failed to get user info');
    }

    return response.json();
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.tokenKey, tokens.access_token);
    localStorage.setItem(this.refreshTokenKey, tokens.refresh_token);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  private async handleTokenExpiry(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.refreshToken(refreshToken);
      } catch (error) {
        this.clearTokens();
        throw error;
      }
    } else {
      this.clearTokens();
      throw new Error('No refresh token available');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export individual functions for backward compatibility
export const signIn = (credentials: LoginCredentials) => authService.signIn(credentials);
export const signUp = (data: SignUpData) => authService.signUp(data);
export const signOut = () => authService.signOut();
export const refreshToken = (token: string) => authService.refreshToken(token);
export const getCurrentUser = () => authService.getCurrentUser();
export const validateToken = (token: string) => authService.validateToken(token);
export const getAccessToken = () => authService.getAccessToken();
export const isAuthenticated = () => authService.isAuthenticated();