/**
 * API Provider - Strategy Pattern for Electron/Web Communication
 * 
 * This eliminates the repeated `if (window.api) { ... } else { fetch(...) }`
 * blocks throughout the codebase by providing a unified interface.
 * 
 * Benefits:
 * - Single source of truth for API communication logic
 * - Eliminates 10+ redundant if/else blocks in AuthService
 * - Easy to add new environments (e.g., mobile) in the future
 * - Centralized error handling
 */

// Check if running in Electron environment
export const isElectron = typeof window !== 'undefined' && !!(window as any).api;

// API method names mapped to web endpoints
const API_ENDPOINT_MAP: Record<string, { method: string; endpoint: string }> = {
    // Auth
    'login': { method: 'POST', endpoint: '/api/auth/login' },
    'signup': { method: 'POST', endpoint: '/api/auth/signup' },
    'logout': { method: 'POST', endpoint: '/api/auth/logout' },
    'forgotPassword': { method: 'POST', endpoint: '/api/auth/forgot-password' },
    'resetPassword': { method: 'POST', endpoint: '/api/auth/reset-password' },
    'googleOAuth': { method: 'POST', endpoint: '/api/auth/google/callback' },
    'githubOAuth': { method: 'POST', endpoint: '/api/auth/github/callback' },

    // User
    'updateProfile': { method: 'PUT', endpoint: '/api/user/profile' },
    'getDashboardStats': { method: 'GET', endpoint: '/api/user/dashboard' },
    'getProfile': { method: 'GET', endpoint: '/api/user/profile' },
};

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    msg?: string;
    error?: string;
    [key: string]: any;
}

/**
 * Execute an API call through either Electron IPC or Web fetch
 * @param channel - The API method/channel name (e.g., 'login', 'signup')
 * @param data - Optional data payload
 * @param options - Additional options like auth token
 */
async function execute<T = any>(
    channel: string,
    data?: any,
    options: { token?: string; urlParam?: string } = {}
): Promise<ApiResponse<T>> {
    try {
        if (isElectron) {
            // Electron IPC path
            const api = (window as any).api;
            if (typeof api[channel] === 'function') {
                return await api[channel](data);
            } else {
                console.warn(`Electron API method '${channel}' not found`);
                return { success: false, msg: `API method '${channel}' not available` };
            }
        } else {
            // Web fetch path
            return await executeWebRequest<T>(channel, data, options);
        }
    } catch (error: any) {
        console.error(`API Error (${channel}):`, error);
        return {
            success: false,
            msg: error.message || 'Connection failed',
            error: error.message
        };
    }
}

/**
 * Execute a web request for non-Electron environments
 */
async function executeWebRequest<T>(
    channel: string,
    data?: any,
    options: { token?: string; urlParam?: string } = {}
): Promise<ApiResponse<T>> {
    const endpointConfig = API_ENDPOINT_MAP[channel];

    if (!endpointConfig) {
        console.warn(`No endpoint mapping for channel: ${channel}`);
        return { success: false, msg: `Unknown API endpoint: ${channel}` };
    }

    let { method, endpoint } = endpointConfig;

    // Append URL parameter if provided (e.g., for /api/user/profile/:userId)
    if (options.urlParam) {
        endpoint = `${endpoint}/${options.urlParam}`;
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
    }

    const fetchOptions: RequestInit = {
        method,
        headers,
    };

    // Add body for POST/PUT/PATCH requests
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, fetchOptions);

    if (!response.ok) {
        if (response.status === 404) {
            return { success: false, msg: 'Service not available' };
        }
        return { success: false, msg: `Server error: ${response.status}` };
    }

    const text = await response.text();
    if (!text) {
        return { success: false, msg: 'Empty response from server' };
    }

    return JSON.parse(text);
}

/**
 * Check if a specific API method is available in the current environment
 */
function isMethodAvailable(methodName: string): boolean {
    if (isElectron) {
        return typeof (window as any).api?.[methodName] === 'function';
    }
    return !!API_ENDPOINT_MAP[methodName];
}

/**
 * Get the current environment name
 */
function getEnvironment(): 'electron' | 'web' {
    return isElectron ? 'electron' : 'web';
}

export const apiProvider = {
    execute,
    isMethodAvailable,
    getEnvironment,
    isElectron,
};

export default apiProvider;
