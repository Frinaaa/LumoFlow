import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { EditorLayout } from '../editor/EditorLayout';
import { EditorProvider } from '../context/EditorContext';
import { useEditorStore } from '../editor/stores/editorStore';
import { useAnalysisStore } from '../editor/stores/analysisStore';

// --- 1. MOCK MONACO & DEPENDENCIES ---
// Reuse the simple textarea mock for the editor
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-editor">Editor Content</div>,
}));

// Mock the complex visualization components to avoid SVG/Canvas issues in JSDOM
jest.mock('../components/AnalysisPanel/VisualizeTab', () => () => <div>Mock Visualization</div>);
jest.mock('../components/AnalysisPanel/ExplanationTab', () => () => <div>Mock Explanation</div>);

// --- 2. MOCK WINDOW API ---
const mockAnalyzeCode = jest.fn();

beforeAll(() => {
  // Mock ResizeObserver (required by some layout libraries)
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock Electron API
  Object.defineProperty(window, 'api', {
    value: {
      analyzeCode: mockAnalyzeCode,
      getWorkspace: jest.fn().mockResolvedValue({ path: '/', name: 'Test' }),
      gitStatus: jest.fn().mockResolvedValue({}),
      readProjectFiles: jest.fn().mockResolvedValue([]),
    },
    writable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAnalyzeCode.mockReset(); // Reset the mock implementation too
  
  // Reset Stores
  act(() => {
    useEditorStore.setState({
      tabs: [],
      activeTabId: null,
    });
    useAnalysisStore.setState({
      isVisible: false,
      isAnalyzing: false,
      data: null
    });
  });
});

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

describe('Analysis Feature Integration', () => {

  // --- TEST 1: BUTTON STATE ---
  test('Analyze button is disabled when no file is open', () => {
    renderWithProviders(<EditorLayout />);
    
    // Find button by text "Analyze"
    const analyzeBtn = screen.getByRole('button', { name: /Analyze/i });
    expect(analyzeBtn).toBeDisabled();
  });

  test('Analyze button is enabled when a file is open', () => {
    // Open a file in the store
    act(() => {
      useEditorStore.getState().addTab('/test.js', 'test.js', 'console.log("hi")', 'javascript');
    });

    renderWithProviders(<EditorLayout />);
    
    const analyzeBtn = screen.getByRole('button', { name: /Analyze/i });
    expect(analyzeBtn).not.toBeDisabled();
  });

  // --- TEST 2: API INTERACTION & LOADING STATE ---
  test('Clicking Analyze triggers API and shows loading state', async () => {
    // 1. Setup Data
    const code = 'function test() { return true; }';
    act(() => {
      useEditorStore.getState().addTab('/logic.js', 'logic.js', code, 'javascript');
    });

    // 2. Mock API implementation to delay slightly so we can catch loading state
    const mockAnalysisData = {
      language: 'JavaScript',
      explanation: ['Function declaration'],
      flowchart: { nodes: [], connections: [] }
    };

    mockAnalyzeCode.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      return { success: true, analysis: mockAnalysisData };
    });

    renderWithProviders(<EditorLayout />);
    const analyzeBtn = screen.getByRole('button', { name: /Analyze/i });

    // 3. Click
    await act(async () => {
      fireEvent.click(analyzeBtn);
    });

    // 4. Assert Loading State (Spinner icon usually replaces or accompanies text)
    // Looking for the spinner icon class defined in CustomTitlebar.tsx
    // The button disables while analyzing
    expect(analyzeBtn).toBeDisabled();
    
    // Check Store State
    expect(useAnalysisStore.getState().isAnalyzing).toBe(true);
    expect(useAnalysisStore.getState().isVisible).toBe(true); // Panel should open

    // 5. Verify API Call arguments
    expect(mockAnalyzeCode).toHaveBeenCalledWith({
      code: code,
      language: 'javascript'
    });

    // 6. Wait for analysis to complete
    await waitFor(() => {
      expect(useAnalysisStore.getState().isAnalyzing).toBe(false);
    });
  });

  // --- TEST 3: SUCCESSFUL ANALYSIS ---
  test('Displays analysis panel upon successful API response', async () => {
    // 1. Setup
    act(() => {
      useEditorStore.getState().addTab('/algo.py', 'algo.py', 'print("hello")', 'python');
    });

    // 2. Mock Success Response
    const mockAnalysisData = {
      language: 'Python',
      explanation: ['Line 1: Print statement'],
      flowchart: { nodes: [], connections: [] }
    };

    mockAnalyzeCode.mockResolvedValue({
      success: true,
      analysis: mockAnalysisData
    });

    renderWithProviders(<EditorLayout />);
    
    // 3. Click
    const analyzeBtn = screen.getByRole('button', { name: /Analyze/i });
    await act(async () => {
      fireEvent.click(analyzeBtn);
    });

    // 4. Wait for async operation to finish
    await waitFor(() => {
      expect(useAnalysisStore.getState().isAnalyzing).toBe(false);
    });

    // 5. Assert Store Data Update
    const storeData = useAnalysisStore.getState().data;
    expect(storeData).toEqual(mockAnalysisData);

    // 6. Assert UI: Check if the Analysis Panel title is visible
    // "LUMO ANALYSIS" is the header text in AnalysisPanel/index.tsx
    expect(screen.getByText('LUMO ANALYSIS')).toBeInTheDocument();
  });

  // --- TEST 4: ERROR HANDLING ---
  test('Handles API failure gracefully', async () => {
    act(() => {
      useEditorStore.getState().addTab('/bad.js', 'bad.js', 'error', 'javascript');
    });

    // Mock Failure
    mockAnalyzeCode.mockResolvedValue({
      success: false,
      msg: 'Parser Error'
    });

    // Mock console.error to keep test output clean
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(<EditorLayout />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    });

    await waitFor(() => {
      expect(useAnalysisStore.getState().isAnalyzing).toBe(false);
    });

    // Data should remain null (or previous state)
    expect(useAnalysisStore.getState().data).toBeNull();

    consoleSpy.mockRestore();
  });

});