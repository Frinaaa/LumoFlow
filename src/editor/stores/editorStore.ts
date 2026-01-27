import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EditorTab, Problem, Theme, WordWrap, SidebarView, BottomPanelTab } from '../types';

/**
 * Editor UI State Store
 * Manages tabs, UI visibility, and editor settings
 */

interface EditorState {
  // Tabs
  tabs: EditorTab[];
  activeTabId: string | null;

  // UI State
  sidebarVisible: boolean;
  sidebarWidth: number;
  terminalVisible: boolean;
  terminalHeight: number;
  activeSidebar: SidebarView;
  activeBottomTab: BottomPanelTab;
  commandPaletteVisible: boolean;

  // Settings
  theme: Theme;
  fontSize: number;
  wordWrap: WordWrap;
  autoSave: boolean;
  autoSaveDelay: number;

  // Output
  terminalOutput: string;
  outputData: string;
  debugData: string;
  problems: Problem[];

  // Tab Actions
  addTab: (filePath: string, fileName: string, content: string, language: string) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabDirty: (tabId: string, isDirty: boolean) => void;
  updateCursorPosition: (tabId: string, line: number, column: number) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;

  // UI Actions
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleTerminal: () => void;
  setTerminalHeight: (height: number) => void;
  setActiveSidebar: (sidebar: SidebarView) => void;
  setActiveBottomTab: (tab: BottomPanelTab) => void;
  toggleCommandPalette: () => void;

  // Settings Actions
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  toggleWordWrap: () => void;
  toggleAutoSave: () => void;

  // Output Actions
  appendTerminalOutput: (output: string) => void;
  clearTerminalOutput: () => void;
  appendOutputData: (output: string) => void;
  clearOutputData: () => void;
  appendDebugData: (output: string) => void;
  clearDebugData: () => void;
  setProblems: (problems: Problem[]) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      // Initial State
      tabs: [],
      activeTabId: null,
      sidebarVisible: true,
      sidebarWidth: 260,
      terminalVisible: true,
      terminalHeight: 240,
      activeSidebar: 'Explorer',
      activeBottomTab: 'Terminal',
      commandPaletteVisible: false,
      theme: 'dark',
      fontSize: 14,
      wordWrap: 'off',
      autoSave: false,
      autoSaveDelay: 5000,
      terminalOutput: '',
      outputData: '',
      debugData: '',
      problems: [],

      // Tab Actions
      addTab: (filePath, fileName, content, language) => {
        const existingTab = get().tabs.find(t => t.filePath === filePath);
        if (existingTab) {
          set({ activeTabId: existingTab.id });
          return;
        }

        const newTab: EditorTab = {
          id: `${Date.now()}-${Math.random()}`,
          filePath,
          fileName,
          content,
          language,
          isDirty: false,
          cursorPosition: { line: 1, column: 1 },
        };

        set(state => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));
      },

      removeTab: (tabId) => {
        set(state => {
          const tabs = state.tabs.filter(t => t.id !== tabId);
          let activeTabId = state.activeTabId;

          if (activeTabId === tabId) {
            const index = state.tabs.findIndex(t => t.id === tabId);
            if (tabs.length > 0) {
              activeTabId = tabs[Math.max(0, index - 1)]?.id || tabs[0]?.id;
            } else {
              activeTabId = null;
            }
          }

          return { tabs, activeTabId };
        });
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      updateTabContent: (tabId, content) => {
        set(state => ({
          tabs: state.tabs.map(t =>
            t.id === tabId ? { ...t, content, isDirty: true } : t
          ),
        }));
      },

      markTabDirty: (tabId, isDirty) => {
        set(state => ({
          tabs: state.tabs.map(t =>
            t.id === tabId ? { ...t, isDirty } : t
          ),
        }));
      },

      updateCursorPosition: (tabId, line, column) => {
        set(state => ({
          tabs: state.tabs.map(t =>
            t.id === tabId ? { ...t, cursorPosition: { line, column } } : t
          ),
        }));
      },

      closeAllTabs: () => set({ tabs: [], activeTabId: null }),

      closeOtherTabs: (tabId) => {
        set(state => {
          const tabToKeep = state.tabs.find(t => t.id === tabId);
          if (!tabToKeep) return state;
          return {
            tabs: [tabToKeep],
            activeTabId: tabId
          };
        });
      },

      // UI Actions
      toggleSidebar: () => set(state => ({ sidebarVisible: !state.sidebarVisible })),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      toggleTerminal: () => set(state => ({ terminalVisible: !state.terminalVisible })),
      setTerminalHeight: (height) => set({ terminalHeight: height }),
      setActiveSidebar: (sidebar) => set({ activeSidebar: sidebar }),
      setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),
      toggleCommandPalette: () => set(state => ({ commandPaletteVisible: !state.commandPaletteVisible })),

      // Settings Actions
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },

      setFontSize: (size) => set({ fontSize: size }),
      toggleWordWrap: () => set(state => ({ wordWrap: state.wordWrap === 'on' ? 'off' : 'on' })),
      toggleAutoSave: () => set(state => ({ autoSave: !state.autoSave })),

      // Output Actions
      appendTerminalOutput: (output) => set(state => ({ terminalOutput: state.terminalOutput + output })),
      clearTerminalOutput: () => set({ terminalOutput: '' }),
      appendOutputData: (output) => set(state => ({ outputData: state.outputData + output })),
      clearOutputData: () => set({ outputData: '' }),
      appendDebugData: (output) => set(state => ({ debugData: state.debugData + output })),
      clearDebugData: () => set({ debugData: '' }),
      setProblems: (problems) => set({ problems }),
    }),
    {
      name: 'editor-storage',
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        wordWrap: state.wordWrap,
        autoSave: state.autoSave,
        sidebarWidth: state.sidebarWidth,
        terminalHeight: state.terminalHeight,
      }),
    }
  )
);
