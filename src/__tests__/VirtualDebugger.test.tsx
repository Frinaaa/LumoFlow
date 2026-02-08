import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VirtualDebuggerTab from '../components/AnalysisPanel/VirtualDebuggerTab';
import { useEditorStore } from '../editor/stores/editorStore';

// --- 1. MOCK STORE ---
jest.mock('../editor/stores/editorStore');

const mockEditorState = (
    problems: any[] = [],
    activeTabId = 'tab-1',
    tabs: any[] = []
) => {
    // Default tab if none provided
    const currentTabs = tabs.length > 0 ? tabs : [
        { id: 'tab-1', fileName: 'script.js', content: 'const x = 10\nconsole.log(x)' }
    ];

    (useEditorStore as unknown as jest.Mock).mockImplementation((selector: any) => {
        const state = {
            staticProblems: problems,
            problems: problems,
            activeTabId: activeTabId,
            tabs: currentTabs
        };
        return selector ? selector(state) : state;
    });
};

describe('Virtual Debugger Tab (AI Analysis)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- TEST 1: EMPTY STATE ---
    test('renders clean state when no errors exist', () => {
        mockEditorState([], 'tab-1');
        render(<VirtualDebuggerTab />);

        expect(screen.getByText(/Workspace Clean/i)).toBeInTheDocument();
        expect(screen.getByText(/No critical errors detected/i)).toBeInTheDocument();
    });

    // --- TEST 2: MISSING SEMICOLON FIX ---
    test('correctly suggests fix for missing semicolon', () => {
        const code = 'const x = 10';
        const problems = [{
            message: 'Missing semicolon',
            line: 1,
            source: 'script.js',
            type: 'error'
        }];

        mockEditorState(problems, 'tab-1', [
            { id: 'tab-1', fileName: 'script.js', content: code }
        ]);

        render(<VirtualDebuggerTab />);

        // Check Header
        expect(screen.getByText('Focused Repair: script.js')).toBeInTheDocument();

        // Check "Before" Code
        expect(screen.getByText('const x = 10')).toBeInTheDocument();

        // Check "After" Code (The Fix)
        expect(screen.getByText(/const x = 10;/)).toBeInTheDocument();

        // Check Explanation and Analogy presence - using more specific matchers to avoid multiple hits
        expect(screen.getByText(/Missing an ending mark/i)).toBeInTheDocument();
        expect(screen.getByText(/Like finishing a sentence/i)).toBeInTheDocument();
    });

    // --- TEST 3: UNDEFINED VARIABLE FIX ---
    test('correctly suggests fix for undefined variable', () => {
        const code = 'console.log(myVar)';
        const problems = [{
            message: 'ReferenceError: myVar is not defined',
            line: 1,
            source: 'script.js',
            type: 'error'
        }];

        mockEditorState(problems, 'tab-1', [
            { id: 'tab-1', fileName: 'script.js', content: code }
        ]);

        render(<VirtualDebuggerTab />);

        // The AI logic usually suggests defining the variable
        // Expecting: const myVar = ""; or similar based on logic
        const fixElement = screen.getByText(/const myVar/i);
        expect(fixElement).toBeInTheDocument();

        // Check Explanation
        expect(screen.getByText(/introduce it first/i)).toBeInTheDocument();
    });

    // --- TEST 4: NAVIGATION ---
    test('navigates between multiple issues', () => {
        const code = 'const x = 10\nconsole.log(y)';
        const problems = [
            { message: 'Missing semicolon', line: 1, source: 'script.js', type: 'error' },
            { message: 'y is not defined', line: 2, source: 'script.js', type: 'error' }
        ];

        mockEditorState(problems, 'tab-1', [
            { id: 'tab-1', fileName: 'script.js', content: code }
        ]);

        render(<VirtualDebuggerTab />);

        // 1. Should start at Issue 1
        expect(screen.getByText('ISSUE 1 OF 2')).toBeInTheDocument();
        expect(screen.getByText('LINE 1')).toBeInTheDocument();

        // 2. Click Next
        const nextBtn = screen.getByText(/Next Issue/i);
        fireEvent.click(nextBtn);

        // 3. Should show Issue 2
        expect(screen.getByText('ISSUE 2 OF 2')).toBeInTheDocument();
        expect(screen.getByText('LINE 2')).toBeInTheDocument();

        // 4. Click Previous
        const prevBtn = screen.getByText(/Previous Issue/i);
        fireEvent.click(prevBtn);

        // 5. Back to Issue 1
        expect(screen.getByText('ISSUE 1 OF 2')).toBeInTheDocument();
    });

    // --- TEST 5: FILE SYNC ---
    test('updates view when switching tabs', () => {
        const tabs = [
            { id: 'tab-1', fileName: 'fileA.js', content: 'errorA' },
            { id: 'tab-2', fileName: 'fileB.js', content: 'errorB' }
        ];

        const problems = [
            { message: 'Error in A', line: 1, source: 'fileA.js', type: 'error' },
            { message: 'Error in B', line: 1, source: 'fileB.js', type: 'error' }
        ];

        // Initialize with Tab 2 active
        mockEditorState(problems, 'tab-2', tabs);

        render(<VirtualDebuggerTab />);

        // Should show File B because it's the active tab
        expect(screen.getByText('Focused Repair: fileB.js')).toBeInTheDocument();
        expect(screen.queryByText('Focused Repair: fileA.js')).not.toBeInTheDocument();
    });
});