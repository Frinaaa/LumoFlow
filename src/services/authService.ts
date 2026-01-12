// Define the structure of the API exposed by preload.js
declare global {
  interface Window {
    api: {
      signup: (data: SignupRequest) => Promise<SignupResponse>;
      login: (credentials: LoginRequest) => Promise<LoginResponse>;
      logout: () => Promise<LogoutResponse>;
      getAppInfo: () => Promise<AppInfo>;
    };
  }
}

export interface LoginResponse {
  success: boolean;
  msg: string;
  token?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: {
      role_name: string;
    };
    status: string;
  };
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface SignupResponse {
  success: boolean;
  msg: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutResponse {
  success: boolean;
  msg: string;
}

export interface AppInfo {
  appVersion: string;
  platform: string;
  nodeVersion: string;
  isDev: boolean;
}

// Local storage helper
const storage = {
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) { console.error(e); }
  },
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) { return null; }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) { console.error(e); }
  }
};

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      if (!window.api) {
        throw new Error('Electron API not available');
      }

      // Call Electron Main Process
      const response = await window.api.login(credentials);

      if (response.success && response.token) {
        storage.setItem('authToken', response.token);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async signup(data: SignupRequest): Promise<SignupResponse> {
    try {
      if (!window.api) {
        throw new Error('Electron API not available');
      }

      const response = await window.api.signup(data);
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Signup failed',
      };
    }
  }

  async logout(): Promise<LogoutResponse> {
    try {
      storage.removeItem('authToken');
      if (window.api) {
        return await window.api.logout();
      }
      return { success: true, msg: 'Logged out locally' };
    } catch (error) {
      return { success: false, msg: 'Logout failed' };
    }
  }

  getToken(): string | null {
    return storage.getItem('authToken');
  }

  setAuthToken(token: string): void {
    storage.setItem('authToken', token);
  }
}

export default new AuthService();