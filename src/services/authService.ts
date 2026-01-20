// --- 1. Type Definitions for Electron Bridge ---

// --- 2. The Service Class ---
class AuthService {
  
  // --- LOGIN ---
  public async login(credentials: { email: string; password: string }) {
    try {
      // Check if running in Electron
      if (window.api) {
        console.log('Using Electron IPC for login');
        const response = await window.api.login(credentials);
        
        if (response.success && response.token) {
          this.setSession(response.token, response.user);
        }
        return response;
      } else {
        // Web fallback - call backend API directly
        console.log('Using Web API for login - calling /api/auth/login');
        return await this.loginWeb(credentials);
      }
    } catch (error) {
      console.error("Login Error:", error);
      return { success: false, msg: "System Connection Failed" };
    }
  }

  // --- WEB LOGIN FALLBACK ---
  private async loginWeb(credentials: { email: string; password: string }) {
    try {
      // Try to call the backend API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`);
        
        // If 404, backend is not running - offer demo mode
        if (response.status === 404) {
          console.log('Backend not found. Offering demo mode...');
          return this.loginDemo(credentials);
        }
        
        return { success: false, msg: `Server error: ${response.status}` };
      }

      const text = await response.text();
      if (!text) {
        return { success: false, msg: "Empty response from server" };
      }

      const data = JSON.parse(text);

      if (data.success && data.token) {
        this.setSession(data.token, data.user);
      }
      return data;
    } catch (error) {
      console.error("Web Login Error:", error);
      // Fallback to demo mode if backend is not available
      return this.loginDemo(credentials);
    }
  }

  // --- DEMO LOGIN (for development without backend) ---
  private loginDemo(credentials: { email: string; password: string }) {
    console.log('🎭 Using DEMO mode - no backend server required');
    
    // Accept any email/password combination for demo
    if (credentials.email && credentials.password) {
      const demoUser = {
        _id: 'demo-user-' + Date.now(),
        id: 'demo-user-' + Date.now(),
        email: credentials.email,
        name: credentials.email.split('@')[0],
        avatar: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
        bio: 'Demo User'
      };
      
      const demoToken = 'demo-token-' + Date.now();
      
      this.setSession(demoToken, demoUser);
      
      return {
        success: true,
        token: demoToken,
        user: demoUser,
        msg: 'Demo mode - no backend server'
      };
    }
    
    return { success: false, msg: "Invalid credentials" };
  }

  // --- SIGNUP ---
  async signup(data: any) {
    try {
      if (window.api) {
        return await window.api.signup(data);
      } else {
        return await this.signupWeb(data);
      }
    } catch (error) {
      return { success: false, msg: 'Signup failed' };
    }
  }

  // --- WEB SIGNUP FALLBACK ---
  private async signupWeb(data: any) {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.token) {
        this.setSession(result.token, result.user);
      }
      return result;
    } catch (error) {
      console.error("Web Signup Error:", error);
      return { success: false, msg: 'Signup failed' };
    }
  }

  // --- LOGOUT ---
  async logout() {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user_info');
      if (window.api) {
        return await window.api.logout();
      } else {
        return await this.logoutWeb();
      }
    } catch (error) {
      return { success: false };
    }
  }

  // --- WEB LOGOUT FALLBACK ---
  private async logoutWeb() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
    } catch (error) {
      return { success: true };
    }
  }

  // --- FETCH REFRESHED PROFILE DATA ---
  async getProfile() {
    try {
      const userString = localStorage.getItem('user_info');
      if (!userString) return { success: false };
      
      const cachedUser = JSON.parse(userString);
      
      if (window.api) {
        const res = await window.api.getDashboardStats(cachedUser._id || cachedUser.id);
        
        if (res.success && res.user) {
          localStorage.setItem('user_info', JSON.stringify(res.user));
          return { success: true, user: res.user };
        }
      } else {
        const res = await this.getProfileWeb(cachedUser._id || cachedUser.id);
        
        if (res.success && res.user) {
          localStorage.setItem('user_info', JSON.stringify(res.user));
          return { success: true, user: res.user };
        }
      }
      
      return { success: true, user: cachedUser };
    } catch (e) {
      return { success: false };
    }
  }

  // --- WEB GET PROFILE FALLBACK ---
  private async getProfileWeb(userId: string) {
    try {
      const response = await fetch(`/api/user/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false };
    }
  }

  async updateProfile(userData: any) {
    try {
      const userString = localStorage.getItem('user_info');
      const currentUser = JSON.parse(userString || '{}');
      
      const payload = { 
        name: userData.name,
        bio: userData.bio,
        avatar: userData.avatar,
        userId: currentUser._id || currentUser.id 
      };

      console.log("AuthService updateProfile - Sending payload with userId:", payload.userId);

      let res;
      if (window.api) {
        res = await window.api.updateProfile(payload);
      } else {
        res = await this.updateProfileWeb(payload);
      }
      
      console.log("AuthService updateProfile - Response:", res);

      if (res.success) {
        localStorage.setItem('user_info', JSON.stringify(res.user));
        window.dispatchEvent(new Event('profile-updated'));
        return { success: true, user: res.user };
      }
      return res;
    } catch (error) {
      console.error("AuthService updateProfile error:", error);
      return { success: false, msg: "Connection Error" };
    }
  }

  // --- WEB UPDATE PROFILE FALLBACK ---
  private async updateProfileWeb(payload: any) {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error) {
      console.error("Web updateProfile error:", error);
      return { success: false, msg: "Connection Error" };
    }
  }

  // --- DASHBOARD ---
  async getDashboardData(userId: string) {
    try {
      if (window.api) {
        return await window.api.getDashboardStats(userId);
      } else {
        return await this.getDashboardDataWeb(userId);
      }
    } catch (error) {
      return { success: false, msg: "Failed to load stats" };
    }
  }

  // --- WEB GET DASHBOARD DATA FALLBACK ---
  private async getDashboardDataWeb(userId: string) {
    try {
      const response = await fetch(`/api/user/dashboard/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
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
      if (window.api) {
        const res = await window.api.githubOAuth(code);
        if (res.success && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
        return res;
      } else {
        return await this.githubOAuthWeb(code);
      }
    } catch (e) {
      return { success: false, msg: "GitHub OAuth failed" };
    }
  }

  // --- WEB GITHUB OAUTH FALLBACK ---
  private async githubOAuthWeb(code: string) {
    try {
      const response = await fetch('/api/auth/github/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      const res = await response.json();
      if (res.success && res.token && res.user) {
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
      if (window.api) {
        const res = await window.api.googleOAuth(code);
        if (res.success && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
        return res;
      } else {
        return await this.googleOAuthWeb(code);
      }
    } catch (e) {
      return { success: false, msg: "Google OAuth failed" };
    }
  }

  // --- WEB GOOGLE OAUTH FALLBACK ---
  private async googleOAuthWeb(code: string) {
    try {
      const response = await fetch('/api/auth/google/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      const res = await response.json();
      if (res.success && res.token && res.user) {
        this.setSession(res.token, res.user);
      }
      return res;
    } catch (e) {
      return { success: false, msg: "Google OAuth failed" };
    }
  }

  // --- PASSWORD RECOVERY ---
  async forgotPassword(email: string) {
    if (window.api) {
      return await window.api.forgotPassword(email);
    } else {
      return await this.forgotPasswordWeb(email);
    }
  }

  // --- WEB FORGOT PASSWORD FALLBACK ---
  private async forgotPasswordWeb(email: string) {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, msg: "Failed to send reset email" };
    }
  }

  async resetPassword(data: any) {
    if (window.api) {
      return await window.api.resetPassword(data);
    } else {
      return await this.resetPasswordWeb(data);
    }
  }

  // --- WEB RESET PASSWORD FALLBACK ---
  private async resetPasswordWeb(data: any) {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, msg: "Failed to reset password" };
    }
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