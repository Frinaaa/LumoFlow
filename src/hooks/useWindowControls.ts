/**
 * Window Controls Hook
 * 
 * Shared hook for window control operations (minimize, maximize, close).
 * Eliminates duplicate implementations in CustomTitlebar.tsx and SimpleTitlebar.tsx.
 * 
 * Benefits:
 * - Single source of truth for window control logic
 * - If IPC channel names change, only update this file
 * - Consistent error handling across all titlebars
 * - Easy to extend with new window operations
 */

import { useCallback } from 'react';

interface WindowControlsReturn {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isElectronAvailable: boolean;
}

/**
 * Hook for Electron window control operations
 * Provides minimize, maximize, and close functions with proper error handling
 */
export const useWindowControls = (): WindowControlsReturn => {
    const isElectronAvailable = typeof window !== 'undefined' && !!(window as any).api;

    const minimize = useCallback(async () => {
        if (!isElectronAvailable) {
            console.log('Window controls not available in web environment');
            return;
        }

        try {
            const api = (window as any).api;
            if (api.minimizeWindow) {
                await api.minimizeWindow();
            }
        } catch (error) {
            console.error('Error minimizing window:', error);
        }
    }, [isElectronAvailable]);

    const maximize = useCallback(async () => {
        if (!isElectronAvailable) {
            console.log('Window controls not available in web environment');
            return;
        }

        try {
            const api = (window as any).api;
            if (api.maximizeWindow) {
                await api.maximizeWindow();
            }
        } catch (error) {
            console.error('Error maximizing window:', error);
        }
    }, [isElectronAvailable]);

    const close = useCallback(async () => {
        if (!isElectronAvailable) {
            console.log('Window controls not available in web environment');
            return;
        }

        try {
            const api = (window as any).api;
            if (api.closeWindow) {
                await api.closeWindow();
            }
        } catch (error) {
            console.error('Error closing window:', error);
        }
    }, [isElectronAvailable]);

    return {
        minimize,
        maximize,
        close,
        isElectronAvailable,
    };
};

export default useWindowControls;
