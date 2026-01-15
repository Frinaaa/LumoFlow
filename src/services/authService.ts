// --- 1. Type Definitions for Electron Bridge ---

// --- 2. The Service Class ---
class AuthService {
  
  // --- LOGIN ---
  public async login(credentials: { email: string; password: string }) {
    try {
      if (!window.api) throw new Error('Bridge missing');
      const response = await window.api.login(credentials);
      
      if (response.success && response.token) {
        this.setSession(response.token, response.user);
      }
      return response;
    } catch (error) {
      console.error("Login IPC Error:", error);
      return { success: false, msg: "System Connection Failed" };
    }
  }

  // --- SIGNUP ---
  async signup(data: any) {
    try {
      return await window.api.signup(data);
    } catch (error) {
      return { success: false, msg: 'Signup failed' };
    }
  }

  // --- LOGOUT ---
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

  // --- FETCH REFRESHED PROFILE DATA ---
  async getProfile() {
    try {
      const userString = localStorage.getItem('user_info');
      if (!userString) return { success: false };
      
      const cachedUser = JSON.parse(userString);
      // 🟢 FORCE FETCH from DB to get the latest email/avatar
      const res = await window.api.getDashboardStats(cachedUser._id || cachedUser.id);
      
      if (res.success && res.user) {
        localStorage.setItem('user_info', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: true, user: cachedUser };
    } catch (e) {
      return { success: false };
    }
  }

  async updateProfile(userData: any) {
    try {
      const userString = localStorage.getItem('user_info');
      const currentUser = JSON.parse(userString || '{}');
      
      // 🟢 Fix ID mismatch: Use _id (Google/Mongo) or id (Manual)
      const payload = { 
        name: userData.name,
        bio: userData.bio,
        avatar: userData.avatar, // Send Base64 directly
        userId: currentUser._id || currentUser.id 
      };

      console.log("AuthService updateProfile - Sending payload with userId:", payload.userId);

      const res = await window.api.updateProfile(payload);
      
      console.log("AuthService updateProfile - Response:", res);

      if (res.success) {
        // 🟢 Update local session so Dashboard sees the change
        localStorage.setItem('user_info', JSON.stringify(res.user));
        // 🟢 Broadcast change to Dashboard
        window.dispatchEvent(new Event('profile-updated'));
        return { success: true, user: res.user };
      }
      return res;
    } catch (error) {
      console.error("AuthService updateProfile error:", error);
      return { success: false, msg: "Connection Error" };
    }
  }

  // --- DASHBOARD ---
  async getDashboardData(userId: string) {
    try {
      if (!window.api) return { success: false, msg: "API missing" };
      return await window.api.getDashboardStats(userId);
    } catch (error) {
      return { success: false, msg: "Failed to load stats" };
    }
  }

  // --- GOOGLE ---
  async startGoogleLogin() {
    // We now use openExternalURL in LoginScreen.tsx, so this is just a fallback
    console.warn("startGoogleLogin is deprecated. Use openExternalURL flow.");
    return { success: false, msg: "Please use the Google button on the login screen." };
  }

  // --- GITHUB ---
  async githubOAuth(code: string) {
    try {
      const res = await window.api.githubOAuth(code);
      if (res.success && res.token) {
        this.setSession(res.token, res.user);
      }
      return res;
    } catch (e) {
      return { success: false, msg: "GitHub OAuth failed" };
    }
  }

  // --- GOOGLE ---
  async googleOAuth(code: string) {
    try {
      const res = await window.api.googleOAuth(code);
      if (res.success && res.token) {
        this.setSession(res.token, res.user);
      }
      return res;
    } catch (e) {
      return { success: false, msg: "Google OAuth failed" };
    }
  }

  // --- PASSWORD RECOVERY ---
  async forgotPassword(email: string) {
    return await window.api.forgotPassword({ email });
  }

  async resetPassword(data: any) {
    return await window.api.resetPassword(data);
  }

  // --- SESSION HELPERS ---
  getToken() {
    return localStorage.getItem('authToken');
  }

  setAuthToken(token: string) {
    localStorage.setItem('authToken', token);
  }

  setSession(token: string, user: any) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user_info', JSON.stringify(user));
  }
}

export default new AuthService();