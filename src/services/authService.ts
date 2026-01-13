// --- 1. Type Definitions for Electron Bridge ---
declare global {
  interface Window {
    api: {
      // Auth
      signup: (data: any) => Promise<any>;
      login: (credentials: any) => Promise<any>;
      logout: () => Promise<any>;
      forgotPassword: (email: string) => Promise<{ success: boolean; msg: string }>;
      resetPassword: (data: any) => Promise<any>;
      
      // Google
      startGoogleLogin: () => Promise<any>;
      googleLogin: (data: any) => Promise<any>;

      // Dashboard (This defines the shape, doesn't run code)
      getDashboardStats: (userId: string) => Promise<any>;
      
      // App
      getAppInfo: () => Promise<any>;
    };
  }
}

// --- 2. The Service Class ---
class AuthService {
  // --- AUTH METHODS ---
  async login(credentials: any) {
    try {
      if (!window.api) throw new Error('Electron API not available');
      const response = await window.api.login(credentials);
      if (response.success && response.token) {
        this.setAuthToken(response.token);
        // Store user info for Dashboard to use
        if (response.user) {
          localStorage.setItem('user_info', JSON.stringify(response.user));
        }
      }
      return response;
    } catch (error) {
      return { success: false, msg: 'Login failed' };
    }
  }

  async signup(data: any) {
    try {
      return await window.api.signup(data);
    } catch (error) {
      return { success: false, msg: 'Signup failed' };
    }
  }

  async logout() {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user_info');
      if (window.api) return await window.api.logout();
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  // --- DASHBOARD DATA METHOD ---
  // This is the actual function logic
  async getDashboardData(userId: string) {
    try {
      if (!window.api) return { success: false, msg: "API missing" };
      return await window.api.getDashboardStats(userId);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      return { success: false, msg: "Failed to load dashboard data" };
    }
  }

  // --- GOOGLE METHODS ---
  async startGoogleLogin() {
    try {
      return await window.api.startGoogleLogin();
    } catch (e) {
      return { success: false, msg: "Google Login unavailable" };
    }
  }

  // --- PASSWORD RECOVERY ---
  async forgotPassword(email: string) {
    return await window.api.forgotPassword(email);
  }

  async resetPassword(data: any) {
    return await window.api.resetPassword(data);
  }

  // --- UTILS ---
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }
}

export default new AuthService();