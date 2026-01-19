/**
 * Centralized routing configuration for LumoFlow
 * Defines all navigation paths and route metadata
 */

export const navigationPaths = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  EDITOR: '/editor',
  TERMINAL: '/terminal',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ABOUT: '/about',
  AUTH_GOOGLE_CALLBACK: '/auth/google/callback',
  AUTH_GITHUB_CALLBACK: '/auth/github/callback',
} as const;

export type NavigationPath = typeof navigationPaths[keyof typeof navigationPaths];

/**
 * Route metadata for organizing routes by type
 */
export const routeMetadata = {
  public: [
    navigationPaths.LOGIN,
    navigationPaths.SIGNUP,
    navigationPaths.FORGOT_PASSWORD,
    navigationPaths.RESET_PASSWORD,
    navigationPaths.ABOUT,
    navigationPaths.AUTH_GOOGLE_CALLBACK,
    navigationPaths.AUTH_GITHUB_CALLBACK,
  ],
  protected: [
    navigationPaths.DASHBOARD,
    navigationPaths.SETTINGS,
    navigationPaths.EDITOR,
    navigationPaths.TERMINAL,
  ],
  redirects: {
    unauthenticated: navigationPaths.LOGIN,
    authenticated: navigationPaths.DASHBOARD,
    notFound: navigationPaths.LOGIN,
  },
} as const;

/**
 * Check if a route requires authentication
 */
export const isProtectedRoute = (path: string | NavigationPath): boolean => {
  return routeMetadata.protected.includes(path as any);
};

/**
 * Check if a route is public
 */
export const isPublicRoute = (path: string | NavigationPath): boolean => {
  return routeMetadata.public.includes(path as any);
};
