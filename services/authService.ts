import axios, { AxiosInstance } from 'axios';
import console from 'console';
import process from 'process';

// Backend URL configuration
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000' 
  : process.env.REACT_APP_API_URL || 'https://api.lumoflow.com';

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Type definitions
export interface LoginResponse {
  msg: string;
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: {
      role_name: string;
    };
    pinCode?: string;
    status: string;
  };
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  pinCode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Storage using localStorage for web/Electron
const storage = {
  setItem: async (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  getItem: async (key: string) => {
    if (typeof localStorage !== 'undefined') {
      return Promise.resolve(localStorage.getItem(key) || null);
    }
    return Promise.resolve(null);
  },
  removeItem: async (key: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
};

class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

      // Store token
      if (response.data.token) {
        await storage.setItem('authToken', response.data.token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }

      return response.data;
    } catch (error) {
      // Note: handleError returns a string, usually you might want to log it or throw a new Error(msg)
      console.error(this.handleError(error));
      throw error;
    }
  }

  /**
   * NGO Login with email and password
   */
  async ngoLogin(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/ngo-login', credentials);

      if (response.data.token) {
        await storage.setItem('authToken', response.data.token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }

      return response.data;
    } catch (error) {
      console.error(this.handleError(error));
      throw error;
    }
  }

  /**
   * Sign up a new user
   */
  async signup(data: SignupRequest): Promise<{ msg: string }> {
    try {
      const response = await apiClient.post<{ msg: string }>('/auth/signup', data);
      return response.data;
    } catch (error) {
      console.error(this.handleError(error));
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ msg: string }> {
    try {
      const response = await apiClient.post<{ msg: string }>('/auth/forgot-password', {
        email,
      });
      return response.data;
    } catch (error) {
      console.error(this.handleError(error));
      throw error;
    }
  }

  /**
   * Reset password with code
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ msg: string }> {
    try {
      const response = await apiClient.post<{ msg: string }>('/auth/reset-password', {
        email,
        code,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error(this.handleError(error));
      throw error;
    }
  }

  /**
   * Get current auth token from storage
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await storage.getItem('authToken');
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  /**
   * Set authorization header with token
   */
  async setAuthToken(token: string): Promise<void> {
    try {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await storage.setItem('authToken', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  /**
   * Clear auth token
   */
  async clearToken(): Promise<void> {
    try {
      await storage.removeItem('authToken');
      delete apiClient.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return error.response.data?.msg || 'An error occurred';
      } else if (error.request) {
        return 'No response from server. Please check your connection.';
      }
      return error.message || 'An error occurred';
    }
    return 'An unexpected error occurred';
  }
}

export default new AuthService();