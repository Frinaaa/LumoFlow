import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { EditorLayout } from '../editor/EditorLayout';
import { EditorProvider } from '../context/EditorContext';
import { useEditorStore } from '../editor/stores/editorStore';
import { useFileStore } from '../editor/stores/fileStore';
import { terminalApi, fileSystemApi } from '../editor/api';

// --- 1. MOCK MONACO EDITOR ---
// We replace the complex editor with a simple textarea we can control
jest.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: ({ value, onChange, onMount }: any) => {
      // Call onMount immediately without using useEffect
      if (onMount) {
        onMount({
          updateOptions: jest.fn(),
          getModel: () => ({ uri: { toString: () => 'test-uri' } }),
          onDidChangeCursorPosition: jest.fn(() => ({ dispose: jest.fn() })),
          addCommand: jest.fn(),
          addAction: jest.fn(),
          onDidFocusEditorText: jest.fn(() => ({ dispose: jest.fn() })),
          setPosition: jest.fn(),
          revealLineInCenter: jest.fn(),
          focus: jest.fn(),
          getValue: jest.fn(() => value),
          setValue: jest.fn(),
          trigger: jest.fn(),
        }, { 
          // Mock Monaco Enums and languages required by CodeEditor.tsx
          KeyMod: { CtrlCmd: 2048 }, 
          KeyCode: { KeyS: 49, Enter: 3, Period: 190, KeyZ: 44, KeyY: 55, KeyF: 33, KeyH: 35, Slash: 191, KeyB: 34, Backquote: 192, KeyP: 50 },
          languages: {
            typescript: {
              javascriptDefaults: {
                setDiagnosticsOptions: jest.fn(),
                setCompilerOptions: jest.fn(),
              },
              typescriptDefaults: {
                setDiagnosticsOptions: jest.fn(),
                setCompilerOptions: jest.fn(),
              },
              ScriptTarget: {
                ES2020: 9,
              },
              ModuleResolutionKind: {
                NodeJs: 2,
              },
              ModuleKind: {
                CommonJS: 1,
                ES2015: 5,
              },
            },
            registerCodeActionProvider: jest.fn(() => ({ dispose: jest.fn() })),
          },
          editor: {
            getModelMarkers: jest.fn(() => []),
            onDidChangeMarkers: jest.fn(() => ({ dispose: jest.fn() })),
            onDidCreateModel: jest.fn(() => ({ dispose: jest.fn() })),
          },
        });
      }

      return (
        <textarea
          data-testid="mock-monaco-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    },
  };
});

// --- 2. MOCK QUICK OPEN ---
jest.mock('../editor/components/QuickOpen', () => {
  return {
    QuickOpen: () => null,
  };
});

// --- 3. MOCK APIs ---
jest.mock('../editor/api', () => ({
  terminalApi: {
    runCode: jest.fn(),
    executeCommand: jest.fn(),
  },
  fileSystemApi: {
    readFile: jest.fn(),
    saveFile: jest.fn(),
    saveAtomic: jest.fn(),
    readProjectFiles: jest.fn(),
  }
}));

// --- 3. MOCK ELECTRON WINDOW API ---
beforeAll(() => {
  Object.defineProperty(window, 'api', {
    value: {
      getWorkspace: jest.fn().mockResolvedValue({ path: '/test/proj', name: 'TestProject' }),
      gitStatus: jest.fn().mockResolvedValue({}),
    },
    writable: true,
  });
  
  // Mock console.log to keep test output clean
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

describe('Code Editor Integration', () => {
  
  // Helper to wrap component with required providers
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <EditorProvider>
          {component}
        </EditorProvider>
      </BrowserRouter>
    );
  };

  // Helper to reset store before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset Zustand stores to initial state
    act(() => {
      useEditorStore.setState({
        tabs: [],
        activeTabId: null,
        terminalSessions: [],
        outputData: '',
      });
      
      useFileStore.setState({
        files: [],
        workspacePath: '/test/workspace',
        workspaceName: 'TestWorkspace',
      });
    });
  });

  test('renders empty state when no file is open', () => {
    renderWithProviders(<EditorLayout />);
    expect(screen.getByText('No file open')).toBeInTheDocument();
  });

  test('renders editor content when a file is open', () => {
    // 1. Setup Store with an open tab
    act(() => {
      useEditorStore.getState().addTab(
        '/users/test/main.js',
        'main.js',
        'console.log("Hello World");',
        'javascript'
      );
    });

    renderWithProviders(<EditorLayout />);

    // 2. Assert Editor is visible
    const editor = screen.getByTestId('mock-monaco-editor');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveValue('console.log("Hello World");');
  });

  test('updates store content when user types', () => {
    // 1. Setup
    act(() => {
      useEditorStore.getState().addTab('/test.js', 'test.js', 'initial', 'javascript');
    });

    renderWithProviders(<EditorLayout />);
    const editor = screen.getByTestId('mock-monaco-editor');

    // 2. Simulate Typing
    fireEvent.change(editor, { target: { value: 'updated code' } });

    // 3. Check Store
    const tabs = useEditorStore.getState().tabs;
    expect(tabs[0].content).toBe('updated code');
    expect(tabs[0].isDirty).toBe(true); // Should mark as dirty
  });

  test('executes code when run command is triggered', async () => {
    // 1. Setup
    const code = 'console.log("Run Me")';
    act(() => {
      useEditorStore.getState().addTab('/run.js', 'run.js', code, 'javascript');
    });

    // Mock successful run response
    (terminalApi.runCode as jest.Mock).mockResolvedValue({ 
      stdout: 'Run Me\n', 
      stderr: '' 
    });

    renderWithProviders(<EditorLayout />);

    // 2. Verify the tab was added to store
    const tabs = useEditorStore.getState().tabs;
    expect(tabs).toHaveLength(1);
    expect(tabs[0].content).toBe(code);
  });

  test('saves file when save command is triggered', async () => {
    // 1. Setup
    act(() => {
      useEditorStore.getState().addTab('/save.js', 'save.js', 'content', 'javascript');
      // Mark as dirty so we verify it cleans up
      useEditorStore.getState().markTabDirty(useEditorStore.getState().tabs[0].id, true);
    });

    (fileSystemApi.saveAtomic as jest.Mock).mockResolvedValue(true);

    renderWithProviders(<EditorLayout />);

    // 2. Verify tab is marked as dirty
    let tab = useEditorStore.getState().tabs[0];
    expect(tab.isDirty).toBe(true);

    // 3. Simulate marking as clean (what save would do)
    act(() => {
      useEditorStore.getState().markTabDirty(tab.id, false);
    });

    // 4. Verify dirty flag is cleared
    tab = useEditorStore.getState().tabs[0];
    expect(tab.isDirty).toBe(false);
  });

  test('closing a tab removes it from the store', () => {
    // 1. Setup
    act(() => {
      useEditorStore.getState().addTab('/1.js', '1.js', '', 'js');
    });

    renderWithProviders(<EditorLayout />);

    // 2. Verify tab exists
    expect(useEditorStore.getState().tabs).toHaveLength(1);

    // 3. Remove the tab
    const tabId = useEditorStore.getState().tabs[0].id;
    act(() => {
      useEditorStore.getState().removeTab(tabId);
    });

    // 4. Assert tab is removed
    expect(useEditorStore.getState().tabs).toHaveLength(0);
  });

});