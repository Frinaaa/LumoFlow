import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

interface UserStats {
    linesWritten: number;
    bugsDetected: number;
    conceptsVisualized: number;
    totalScore: number;
    level: string;
    xp: number;
}

interface RecentActivity {
    id: string | number;
    title: string;
    type: string;
    time: string;
    xp: number;
    color: string;
    icon: string;
}

interface UserState {
    user: any | null;
    stats: UserStats;
    recentActivity: RecentActivity[];
    skillMatrix: any[];
    loading: boolean;
    isSyncing: boolean; // Add this

    // Actions
    setUser: (user: any) => void;
    updateStats: (updates: Partial<UserStats>) => void;
    addActivity: (activity: RecentActivity) => void;
    fetchUserData: () => Promise<void>;
    syncWithBackend: () => Promise<void>;
    clearStore: () => void;
    setSyncing: (syncing: boolean) => void; // Add this
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            stats: {
                linesWritten: 0,
                bugsDetected: 0,
                conceptsVisualized: 0,
                totalScore: 0,
                level: 'LVL 0: DETECTING...',
                xp: 0
            },
            recentActivity: [],
            skillMatrix: [], // Add this
            loading: false,
            isSyncing: false,

            setUser: (user) => set({ user }),
            setSyncing: (isSyncing) => set({ isSyncing }),

            updateStats: (updates) => {
                set((state) => {
                    const newStats = { ...state.stats, ...updates };

                    // 🟢 SYNC XP with Total Score
                    if (updates.totalScore !== undefined) {
                        newStats.xp = newStats.totalScore;
                    } else if (updates.xp !== undefined) {
                        newStats.totalScore = newStats.xp;
                    }

                    // 🟢 Real-time Level Calculation
                    const xp = newStats.totalScore || 0;
                    if (xp < 500) newStats.level = "LVL 0: DETECTING...";
                    else if (xp < 1500) newStats.level = "LVL 1: NOVICE FLOW";
                    else if (xp < 3000) newStats.level = "LVL 2: LOGIC BUILDER";
                    else if (xp < 6000) newStats.level = "LVL 3: SYNTAX SORCERER";
                    else newStats.level = `LVL ${Math.floor(xp / 2000)}: ARCHITECT`;

                    // Sync user object inside store to avoid confusion
                    const newUser = state.user ? { ...state.user, ...newStats } : null;

                    return { stats: newStats, user: newUser };
                });
            },

            addActivity: (activity) => {
                set((state) => ({
                    recentActivity: [activity, ...state.recentActivity].slice(0, 5)
                }));
            },

            fetchUserData: async () => {
                const userString = localStorage.getItem('user_info');
                if (!userString) return;
                const cachedUser = JSON.parse(userString);
                const userId = cachedUser._id || cachedUser.id;

                set({ loading: true });
                try {
                    console.log("🔄 STORE: Fetching Real-time Stats from DB for:", userId);
                    const res = await authService.getDashboardData(userId);
                    if (res.success) {
                        console.log("📥 STORE: Received Stats from DB:", res.stats);

                        const currentStats = get().stats;
                        const currentActivity = get().recentActivity;

                        // Merge Strategy: Keep whichever is higher to prevent losing local progress 
                        const mergedStats = {
                            linesWritten: Math.max(currentStats.linesWritten, res.stats.linesWritten || 0),
                            bugsDetected: Math.max(currentStats.bugsDetected, res.stats.bugsDetected || 0),
                            conceptsVisualized: Math.max(currentStats.conceptsVisualized, res.stats.conceptsVisualized || 0),
                            totalScore: Math.max(currentStats.totalScore, res.stats.totalScore || 0),
                            level: res.stats.level || currentStats.level,
                            xp: Math.max(currentStats.xp, res.stats.xp || 0)
                        };

                        // 🟢 Activity Merge Strategy: Don't let local "just now" items vanish
                        const incomingActivity = res.recentActivity || [];
                        const mergedActivity = [...incomingActivity];

                        // Keep local activities that are "just now" and not yet in the incoming list
                        currentActivity.forEach(local => {
                            if (local.time === 'just now') {
                                const exists = incomingActivity.find((remote: any) =>
                                    remote.title === local.title && remote.type === local.type
                                );
                                if (!exists) {
                                    mergedActivity.unshift(local);
                                }
                            }
                        });

                        set({
                            user: { ...res.user, ...mergedStats },
                            stats: mergedStats,
                            recentActivity: mergedActivity.slice(0, 10),
                            skillMatrix: (res.skillMatrix && res.skillMatrix.length > 0) ? res.skillMatrix : get().skillMatrix
                        });

                        // Update local cache with merged values
                        localStorage.setItem('user_info', JSON.stringify({ ...res.user, ...mergedStats }));
                    }
                } catch (error) {
                    console.error("❌ STORE: Fetch User Data Error:", error);
                } finally {
                    set({ loading: false });
                }
            },

            syncWithBackend: async () => {
                const { stats, user } = get();
                if (!user) return;
                const userId = user._id || user.id;

                // Note: In real app, we usually only send diffs, 
                // but for this MVP, we'll let the components handle the the trackStats call.
            },

            clearStore: () => {
                set({
                    user: null,
                    stats: {
                        linesWritten: 0,
                        bugsDetected: 0,
                        conceptsVisualized: 0,
                        totalScore: 0,
                        level: "LVL 0: DETECTING...",
                        xp: 0
                    },
                    recentActivity: [],
                    skillMatrix: []
                });
                localStorage.removeItem('user-storage'); // Clear persisted state
            }
        }),
        {
            name: 'user-storage',
            partialize: (state) => ({
                stats: state.stats,
                recentActivity: state.recentActivity,
                skillMatrix: state.skillMatrix, // Add this
                user: state.user
            })
        }
    )
);
