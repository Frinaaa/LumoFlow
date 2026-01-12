// --- 1. Type Definitions for Electron Bridge ---
declare global {
  interface Window {
    api: {
      signup: (data: any) => Promise<any>;
      login: (credentials: any) => Promise<any>;
      logout: () => Promise<any>;
      forgotPassword: (email: string) => Promise<{ success: boolean; msg: string }>;
      getAppInfo: () => Promise<any>;
    };
  }
}

// --- 2. The Service Class ---
class AuthService {
  async login(credentials: any) {
    try {
      if (!window.api) throw new Error('Electron API not available');
      const response = await window.api.login(credentials);
      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
      }
      return response;
    } catch (error) {
      return { success: false, msg: 'Login failed' };
    }
  }

  async signup(data: any) {
    try {
      if (!window.api) throw new Error('Electron API not available');
      return await window.api.signup(data);
    } catch (error) {
      return { success: false, msg: 'Signup failed' };
    }
  }

  async forgotPassword(email: string) {
    try {
      if (!window.api) throw new Error('Electron API not available');
      return await window.api.forgotPassword(email);
    } catch (error) {
      console.error('Forgot Password error:', error);
      return { success: false, msg: 'Failed to request reset' };
    }
  }

  async logout() {
    try {
      localStorage.removeItem('authToken');
      if (window.api) return await window.api.logout();
      return { success: true, msg: 'Logged out' };
    } catch (error) {
      return { success: false, msg: 'Logout failed' };
    }
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }
}

// --- 3. THE CRITICAL LINE (The fix for your error) ---
export default new AuthService();