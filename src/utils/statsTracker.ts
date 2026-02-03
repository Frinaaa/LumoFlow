import authService from '../services/authService';
import { useUserStore } from '../stores/userStore';

/**
 * Helper to track user stats and activities across the application.
 */
// 🟢 Stats Buffer & Debouncer
let statsBuffer: any = {
    linesWritten: 0,
    bugsDetected: 0,
    conceptsVisualized: 0,
    totalScore: 0
};
let trackerTimeout: any = null;

export const trackStats = async (stats: {
    linesWritten?: number;
    bugsDetected?: number;
    conceptsVisualized?: number;
    totalScore?: number;
}) => {
    try {
        const userString = localStorage.getItem('user_info');
        if (!userString) return;
        const user = JSON.parse(userString);
        const userId = user._id || user.id;

        // 1. Update Local Store Immediately (for UI feedback)
        const userStore = useUserStore.getState();
        userStore.updateStats({
            linesWritten: (userStore.stats.linesWritten || 0) + (stats.linesWritten || 0),
            bugsDetected: (userStore.stats.bugsDetected || 0) + (stats.bugsDetected || 0),
            conceptsVisualized: (userStore.stats.conceptsVisualized || 0) + (stats.conceptsVisualized || 0),
            totalScore: (userStore.stats.totalScore || 0) + (stats.totalScore || 0),
        });

        // 2. Buffer for Backend Update (Debounced)
        statsBuffer.linesWritten += stats.linesWritten || 0;
        statsBuffer.bugsDetected += stats.bugsDetected || 0;
        statsBuffer.conceptsVisualized += stats.conceptsVisualized || 0;
        statsBuffer.totalScore += stats.totalScore || 0;

        if (trackerTimeout) clearTimeout(trackerTimeout);
        trackerTimeout = setTimeout(async () => {
            const finalStats = { ...statsBuffer };
            // Reset buffer before call
            statsBuffer = { linesWritten: 0, bugsDetected: 0, conceptsVisualized: 0, totalScore: 0 };

            console.log(`📡 SYNCING Stats to DB for User: ${userId}`, finalStats);
            userStore.setSyncing(true);
            try {
                const res = await authService.updateStats({ userId, ...finalStats });
                console.log(`✅ SYNC COMPLETE:`, res);
            } finally {
                userStore.setSyncing(false);
            }

            // Notify dashboard to refresh full data (recent activity, levels etc)
            window.dispatchEvent(new Event('stats-updated'));
        }, 2000); // 2 second debounce

    } catch (err) {
        console.error('❌ TRACKER Fail:', err);
    }
};

export const trackActivity = async (activity: {
    title: string;
    type: string;
    xp: number;
    color: string;
    icon: string;
}) => {
    try {
        const userString = localStorage.getItem('user_info');
        if (!userString) return;
        const user = JSON.parse(userString);
        const userId = user._id || user.id;

        // 🟢 Real-time local update
        const userStore = useUserStore.getState();
        userStore.addActivity({
            ...activity,
            id: Date.now(),
            time: 'just now'
        });

        await authService.addActivity({ userId, activity });

        // Dispatch event as backup
        window.dispatchEvent(new Event('stats-updated'));
    } catch (err) {
        console.error('Failed to track activity:', err);
    }
};

export const trackGameProgress = async (gameData: {
    gameName: string;
    score: number;
    level: string | number;
}) => {
    try {
        const userString = localStorage.getItem('user_info');
        if (!userString) return;
        const user = JSON.parse(userString);
        const userId = user._id || user.id;

        // 1. Update Local Store Immediately (for UI feedback)
        const userStore = useUserStore.getState();
        userStore.updateStats({
            totalScore: (userStore.stats.totalScore || 0) + (gameData.score || 0),
        });

        // 2. Persist to Backend (GameProgress + User.totalScore increment)
        await authService.saveGameProgress({ userId, ...gameData });

        // 3. Dispatch event
        window.dispatchEvent(new Event('stats-updated'));
    } catch (err) {
        console.error('❌ Game Progress Tracker Fail:', err);
    }
};
