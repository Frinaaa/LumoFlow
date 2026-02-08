import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Terminal from '../editor/components/Terminal/Terminal';
import { useEditorStore } from '../editor/stores/editorStore';

// --- 1. MOCK STORE ---
// The Terminal component accesses the store for terminal sessions
jest.mock('../editor/stores/editorStore');

const mockStore = {
  terminalSessions: [
    { id: '1', name: 'PowerShell', type: 'powershell', content: '' }
  ],
  activeTerminalSessionId: '1',
  clearTerminalOutput: jest.fn(),
  appendTerminalOutput: jest.fn(),
  createTerminalSession: jest.fn(),
  removeTerminalSession: jest.fn(),
  setActiveTerminalSession: jest.fn(),
  splitTerminal: jest.fn(),
};

(useEditorStore as unknown as jest.Mock).mockReturnValue(mockStore);

// --- 2. SETUP MOCKS ---
beforeAll(() => {
  // Mock window.dispatchEvent to catch navigation events
  jest.spyOn(window, 'dispatchEvent');
  
  // Mock scrollIntoView (not implemented in JSDOM)
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe('Terminal Component - Debug & Problems', () => {
  
  const defaultProps = {
    activeTab: 'Terminal',
    problems: [],
    outputData: '',
    debugData: '',
    onCommand: jest.fn(),
    onClear: jest.fn(),
    onTabChange: jest.fn(),
    onClose: jest.fn(),
    onMaximize: jest.fn(),
    onNavigateToLine: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ====================================================
  // TEST SUITE 1: DEBUG CONSOLE
  // ====================================================
  
  test('renders Debug Console content correctly', () => {
    const debugText = 'Variable x is undefined at line 10';
    
    render(
      <Terminal 
        {...defaultProps} 
        activeTab="Debug Console" 
        debugData={debugText} 
      />
    );

    // 1. Check if tab is active (styled differently)
    const debugTab = screen.getByText('Debug Console');
    expect(debugTab).toBeInTheDocument();
    
    // 2. Check if content is rendered
    const content = screen.getByText(debugText);
    expect(content).toBeInTheDocument();
    
    // 3. Verify specific styling for debug console (color #ce9178)
    expect(content).toHaveStyle({ color: '#ce9178' });
  });

  test('displays "No debug data" when empty', () => {
    render(
      <Terminal 
        {...defaultProps} 
        activeTab="Debug Console" 
        debugData="" 
      />
    );

    expect(screen.getByText('No debug data')).toBeInTheDocument();
  });

  // ====================================================
  // TEST SUITE 2: PROBLEMS TAB
  // ====================================================

  test('renders empty state when no problems exist', () => {
    render(
      <Terminal 
        {...defaultProps} 
        activeTab="Problems" 
        problems={[]} 
      />
    );

    expect(screen.getByText('No problems detected!')).toBeInTheDocument();
    expect(screen.getByText(/error-free/i)).toBeInTheDocument();
  });

  test('renders list of problems grouped by file', () => {
    const mockProblems = [
      { message: 'Syntax Error', line: 5, source: 'script.js', type: 'error' as const },
      { message: 'Unused Variable', line: 10, source: 'script.js', type: 'warning' as const },
      { message: 'Import failed', line: 1, source: 'utils.js', type: 'error' as const }
    ];

    render(
      <Terminal 
        {...defaultProps} 
        activeTab="Problems" 
        problems={mockProblems} 
      />
    );

    // 1. Check Header Summary
    expect(screen.getByText('3 Problems Found')).toBeInTheDocument();

    // 2. Check File Groups
    expect(screen.getByText('script.js')).toBeInTheDocument();
    expect(screen.getByText('utils.js')).toBeInTheDocument();

    // 3. Check Messages
    expect(screen.getByText('Syntax Error')).toBeInTheDocument();
    expect(screen.getByText('Unused Variable')).toBeInTheDocument();
  });

  test('problem navigation dispatches monaco command', () => {
    const mockProblems = [
      { message: 'ReferenceError: x is not defined', line: 15, column: 5, source: 'app.js', type: 'error' as const }
    ];

    render(
      <Terminal 
        {...defaultProps} 
        activeTab="Problems" 
        problems={mockProblems} 
      />
    );

    // Find the problem row
    const problemRow = screen.getByText('ReferenceError: x is not defined');
    
    // Simulate Click
    fireEvent.click(problemRow);

    // Verify Custom Event Dispatch
    // The component dispatches 'monaco-cmd' with action 'revealLine'
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'monaco-cmd',
        detail: {
          action: 'revealLine',
          value: 15,
          column: 5,
          file: 'app.js'
        }
      })
    );
  });

  test('displays correct badge counts on tabs', () => {
    const mockProblems = [
      { message: 'Error 1', line: 1, source: 'a.js', type: 'error' as const },
      { message: 'Error 2', line: 2, source: 'a.js', type: 'error' as const }
    ];

    render(
      <Terminal 
        {...defaultProps} 
        activeTab="Terminal" // Active tab is NOT problems, but badge should still show
        problems={mockProblems} 
      />
    );

    // Find the Problems tab text container
    const problemsTab = screen.getByText('Problems').closest('div');
    
    // Check if it contains the badge with count "2"
    expect(problemsTab).toHaveTextContent('2');
  });

  // ====================================================
  // TEST SUITE 3: INTERACTION
  // ====================================================

  test('clicking tabs triggers onTabChange', () => {
    const handleTabChange = jest.fn();

    render(
      <Terminal 
        {...defaultProps} 
        onTabChange={handleTabChange} 
      />
    );

    // Click "Debug Console"
    fireEvent.click(screen.getByText('Debug Console'));
    expect(handleTabChange).toHaveBeenCalledWith('Debug Console');

    // Click "Problems"
    fireEvent.click(screen.getByText('Problems'));
    expect(handleTabChange).toHaveBeenCalledWith('Problems');
  });

  test('clear button calls onClear and store clear method', () => {
    const handleClear = jest.fn();
    
    render(
      <Terminal 
        {...defaultProps} 
        activeTab="Output"
        onClear={handleClear} 
      />
    );

    // Find the ban/clear icon
    const clearBtn = screen.getByTitle('Clear Output');
    fireEvent.click(clearBtn);

    expect(mockStore.clearTerminalOutput).toHaveBeenCalled();
    expect(handleClear).toHaveBeenCalled();
  });

});