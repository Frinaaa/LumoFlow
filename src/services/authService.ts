import apiProvider, { isElectron } from './apiProvider';

/**
 * AuthService - Handles user authentication and profile management
 * 
 * Refactored to use the unified apiProvider (Strategy Pattern).
 * This service now focuses on business logic and session management,
 * while the apiProvider handles the environment-specific communication.
 */
class AuthService {

  // --- LOGIN ---
  public async login(credentials: { email: string; password: string }) {
    try {
      const response = await apiProvider.execute('login', credentials);

      if (response.success && response.token) {
        this.setSession(response.token, response.user);
        return response;
      }

      // Fallback to demo mode if backend is not available (404/Connection Error)
      if (!response.success && (response.msg?.includes('not available') || response.msg?.includes('Connection'))) {
        return this.loginDemo(credentials);
      }

      return response;
    } catch (error) {
      console.error("Login Error:", error);
      return this.loginDemo(credentials);
    }
  }

  // --- DEMO LOGIN (for development without backend) ---
  private loginDemo(credentials: { email: string; password: string }) {
    console.log('🎭 Using DEMO mode - no backend server required');

    if (credentials.email && credentials.password) {
      const demoUser = {
        _id: 'demo-user-' + Date.now(),
        id: 'demo-user-' + Date.now(),
        email: credentials.email,
        name: credentials.email.split('@')[0],
        avatar: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
        bio: 'Demo User (Local Environment)'
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
      const res = await apiProvider.execute('signup', data);
      if (res.success && res.token) {
        this.setSession(res.token, res.user);
      }
      return res;
    } catch (error) {
      return { success: false, msg: 'Signup failed' };
    }
  }

  // --- LOGOUT ---
  async logout() {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user_info');

      // Clear Zustand store
      import('../stores/userStore').then(m => m.useUserStore.getState().clearStore());

      return await apiProvider.execute('logout');
    } catch (error) {
      return { success: true };
    }
  }

  // --- PROFILE & DASHBOARD ---
  async getProfile() {
    try {
      const userString = localStorage.getItem('user_info');
      if (!userString) return { success: false };
      const cachedUser = JSON.parse(userString);
      const userId = cachedUser._id || cachedUser.id;

      const res = await apiProvider.execute('getDashboardStats', userId, { urlParam: userId });

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

      const payload = {
        name: userData.name,
        bio: userData.bio,
        avatar: userData.avatar,
        userId: currentUser._id || currentUser.id
      };

      const res = await apiProvider.execute('updateProfile', payload);

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

  async getDashboardData(userId: string) {
    try {
      return await apiProvider.execute('getDashboardStats', userId);
    } catch (error) {
      return { success: false, msg: "Failed to load stats" };
    }
  }

  async updateStats(data: { userId: string, linesWritten?: number, bugsDetected?: number, conceptsVisualized?: number, totalScore?: number }) {
    try {
      return await apiProvider.execute('updateStats', data);
    } catch (error) {
      return { success: false, msg: "Failed to update stats" };
    }
  }

  async addActivity(data: { userId: string, activity: { title: string, type: string, xp: number, color: string, icon: string } }) {
    try {
      return await apiProvider.execute('addActivity', data);
    } catch (error) {
      return { success: false, msg: "Failed to add activity" };
    }
  }

  async saveGameProgress(data: { userId: string, gameName: string, score: number, level: string | number }) {
    try {
      return await apiProvider.execute('saveGameProgress', data);
    } catch (error) {
      return { success: false, msg: "Failed to save game progress" };
    }
  }

  // --- OAUTH ---
  async githubOAuth(code: string) {
    try {
      // Electron expects string, Web expects { code } object
      const payload = isElectron ? code : { code };
      const res = await apiProvider.execute('githubOAuth', payload);

      if (res.success && res.token && res.user) {
        this.setSession(res.token, res.user);
        if (res.githubAccessToken) {
          localStorage.setItem('github_token', res.githubAccessToken);
        }
        // Update user store
        import('../stores/userStore').then(m => m.useUserStore.getState().setUser(res.user));
      }
      return res;
    } catch (e) {
      return { success: false, msg: "GitHub OAuth failed" };
    }
  }

  async googleOAuth(code: string) {
    try {
      // Electron expects string, Web expects { code } object
      const payload = isElectron ? code : { code };
      const res = await apiProvider.execute('googleOAuth', payload);

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
    // Electron expects string, Web expects { email } object
    const payload = isElectron ? email : { email };
    return await apiProvider.execute('forgotPassword', payload);
  }

  async resetPassword(data: any) {
    return await apiProvider.execute('resetPassword', data);
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