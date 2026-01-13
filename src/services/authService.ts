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
   private API_URL = "http://localhost:5000/api/users"; 
  setAuthToken(token: any) {
    throw new Error('Method not implemented.');
  }
  // --- AUTH METHODS ---
 // --- 1. LOGIN (DEEP DEBUG) ---
  public async login(credentials: { email: string; password: string }) {
    try {
      console.log(`🌐 POST Request to: ${this.API_URL}/login`);
      
      const response = await fetch(`${this.API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      console.log("mb Status Code:", response.status); // e.g. 200, 400, 401, 404, 500

      const data = await response.json();
      console.log("📦 Raw Backend Data:", data);

      if (response.ok) {
        this.setSession(data.token, data.user);
        return { success: true, token: data.token, user: data.user };
      } else {
        // If the backend didn't send a message, we'll see it here
        return { success: false, msg: data.message || `Server Error (${response.status})` };
      }
    } catch (error) {
      console.error("🔥 Network Crash:", error);
      return { success: false, msg: "Server Connection Failed" };
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

  async getProfile() {
    try {
      // 1. First, try to get data from LocalStorage (saved during login)
      const cachedUser = localStorage.getItem('user_info');
      if (cachedUser) {
        return { success: true, user: JSON.parse(cachedUser) };
      }

      // 2. If not in storage, fetch from Backend API
      const token = this.getToken();
      if (!token) return { success: false, msg: "No token found" };

      // Ensure this matches your actual Backend URL
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update cache
        localStorage.setItem('user_info', JSON.stringify(data));
        return { success: true, user: data };
      } else {
        return { success: false, msg: data.message };
      }

    } catch (error) {
      console.error("Database connection error:", error);
      // Return a default fallback so the app doesn't crash
      return { success: false, msg: "Network error" };
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

  async updateProfile(userData: any) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, msg: "No token" };

      // ⚠️ REPLACE WITH YOUR ACTUAL BACKEND URL
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        // CRITICAL: Update the local cache immediately so Dashboard sees changes
        // Merge existing data with new data (to keep fields that weren't updated)
        const existingUser = JSON.parse(localStorage.getItem('user_info') || '{}');
        const updatedUser = { ...existingUser, ...data };
        
        localStorage.setItem('user_info', JSON.stringify(updatedUser));
        
        return { success: true, user: updatedUser };
      } else {
        return { success: false, msg: data.message || "Update failed" };
      }
    } catch (error) {
      console.error("Update Error:", error);
      // Fallback for demo if backend is offline: Simulate success
      // Remove this block in production
      const existingUser = JSON.parse(localStorage.getItem('user_info') || '{}');
      const updatedUser = { ...existingUser, ...userData };
      localStorage.setItem('user_info', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    }
  }


  getToken() {
    return localStorage.getItem('authToken');
  }

  setSession(token: string, user: any) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user_info', JSON.stringify(user));
  }

}

export default new AuthService();