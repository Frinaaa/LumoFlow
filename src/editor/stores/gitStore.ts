import { create } from 'zustand';

interface GitState {
  branch: string;
  changes: Array<{ file: string; status: string }>;
  isRepo: boolean;
  loading: boolean;
  setGitStatus: (status: { branch: string; changes: any[]; isRepo: boolean }) => void;
  setLoading: (loading: boolean) => void;
}

export const useGitStore = create<GitState>((set) => ({
  branch: '',
  changes: [],
  isRepo: false,
  loading: false,
  setGitStatus: (status) => set({ ...status }),
  setLoading: (loading) => set({ loading }),
}));
