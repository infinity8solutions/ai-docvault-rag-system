export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }

    return response.json();
  },

  async signup(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/user/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Signup failed');
    }

    return response.json();
  },

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },

  setUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
