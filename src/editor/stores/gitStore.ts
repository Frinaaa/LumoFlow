import { create } from 'zustand';

interface GitState {
  branch: string;
  changes: Array<{ file: string; status: string }>;
  isRepo: boolean;
  loading: boolean;
  pushing: boolean;
  pulling: boolean;
  ahead: number;
  behind: number;
  lastSyncMessage: string;
  setGitStatus: (status: { branch: string; changes: any[]; isRepo: boolean }) => void;
  setLoading: (loading: boolean) => void;
  setPushing: (pushing: boolean) => void;
  setPulling: (pulling: boolean) => void;
  setAheadBehind: (ahead: number, behind: number) => void;
  setLastSyncMessage: (message: string) => void;
}

export const useGitStore = create<GitState>((set) => ({
  branch: '',
  changes: [],
  isRepo: false,
  loading: false,
  pushing: false,
  pulling: false,
  ahead: 0,
  behind: 0,
  lastSyncMessage: '',
  setGitStatus: (status) => set({ ...status }),
  setLoading: (loading) => set({ loading }),
  setPushing: (pushing) => set({ pushing }),
  setPulling: (pulling) => set({ pulling }),
  setAheadBehind: (ahead, behind) => set({ ahead, behind }),
  setLastSyncMessage: (lastSyncMessage) => set({ lastSyncMessage }),
}));
