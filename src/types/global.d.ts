interface WindowAPI {
  login: (credentials: any) => Promise<any>;
  signup: (data: any) => Promise<any>;
  logout: () => Promise<any>;
  googleOAuth: (code: string) => Promise<any>;
  githubOAuth: (code: string) => Promise<any>;
  getDashboardStats: (userId: string) => Promise<any>;
  updateProfile: (data: any) => Promise<any>;
  readProjectFiles: () => Promise<Array<{ name: string; path: string }>>;
  readFile: (filePath: string) => Promise<string>;
  saveFile: (payload: { filePath: string; content: string }) => Promise<any>;
  runCode: (payload: { filePath: string; code: string }) => Promise<string[]>;
  getAppInfo: () => Promise<any>;
  openExternalURL: (url: string) => Promise<any>;
  sendAuthCode: (provider: string, code: string) => void;
  sendAuthError: (provider: string, error: string) => void;
  onAuthCallback: (provider: string, callback: (data: any) => void) => void;
  removeAuthListener: (provider: string) => void;
}

declare global {
  interface Window {
    api: WindowAPI;
  }
}

export {};
