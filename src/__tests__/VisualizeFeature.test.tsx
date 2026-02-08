import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VisualizeTab from '../components/AnalysisPanel/VisualizeTab';
import { useEditorStore } from '../editor/stores/editorStore';
import { useAnalysisStore } from '../editor/stores/analysisStore';
import { useUserStore } from '../stores/userStore';

// --- 1. MOCK STORES ---
jest.mock('../editor/stores/editorStore');
jest.mock('../editor/stores/analysisStore');
jest.mock('../stores/userStore');

// --- 2. MOCK BROWSER APIS ---
Object.defineProperty(window, 'speechSynthesis', {
    value: {
        cancel: jest.fn(),
        speak: jest.fn(),
        paused: false,
        pending: false,
        speaking: false,
    },
    writable: true
});

global.SpeechSynthesisUtterance = jest.fn() as any;

Object.defineProperty(window, 'api', {
    value: {
        saveVisualization: jest.fn().mockResolvedValue({ success: true }),
    },
    writable: true
});

// --- HELPER TO MOCK STORE STATE ---
const mockStoreState = (
    content: string,
    frames: any[] = [],
    currentFrameIndex = 0,
    isPlaying = false
) => {
    (useUserStore as unknown as jest.Mock).mockReturnValue({ user: { _id: 'test-user-id' } });

    (useEditorStore as unknown as jest.Mock).mockReturnValue({
        activeTabId: 'tab-1',
        tabs: [{
            id: 'tab-1',
            fileName: 'test.js',
            content: content,
            language: 'javascript'
        }],
        outputData: '',
        debugData: ''
    });

    const setTraceFrames = jest.fn();
    const setFrameIndex = jest.fn();

    (useAnalysisStore as unknown as jest.Mock).mockReturnValue({
        traceFrames: frames,
        currentFrameIndex: currentFrameIndex,
        setFrameIndex: setFrameIndex,
        setTraceFrames: setTraceFrames,
        isPlaying: isPlaying,
        togglePlay: jest.fn(),
        isReplaying: false,
        setReplaying: jest.fn(),
    });

    return { setTraceFrames, setFrameIndex };
};

describe('VisualizeTab Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- TEST 1: EMPTY STATE ---
    test('renders loading/empty state when no code provided', () => {
        mockStoreState('');
        render(<VisualizeTab />);
        expect(screen.getByText(/SCANNING CODE.../i)).toBeInTheDocument();
    });

    // --- TEST 2: UNSUPPORTED LANGUAGE ---
    test('renders unsupported message for non-JS files', () => {
        (useUserStore as unknown as jest.Mock).mockReturnValue({ user: { _id: 'test-user-id' } });
        (useEditorStore as unknown as jest.Mock).mockReturnValue({
            activeTabId: 'tab-1',
            tabs: [{ id: 'tab-1', fileName: 'style.css', content: 'body { color: red; }', language: 'css' }],
            outputData: ''
        });
        (useAnalysisStore as unknown as jest.Mock).mockReturnValue({
            traceFrames: [],
            setTraceFrames: jest.fn(),
            setFrameIndex: jest.fn(),
        });

        render(<VisualizeTab />);
        expect(screen.getByText(/Visuals not supported/i)).toBeInTheDocument();
    });

    // --- TEST 3: BUBBLE SORT DETECTION ---
    test('generates bubble sort frames when sorting code is detected', async () => {
        const bubbleSortCode = `
          // bubble sort
          let arr = [5, 1, 4];
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
              if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
              }
            }
          }
        `;

        const { setTraceFrames } = mockStoreState(bubbleSortCode, []);
        render(<VisualizeTab />);

        // We MUST wait for the actual trace frames, not just any call
        await waitFor(() => {
            const calls = setTraceFrames.mock.calls;
            const validCall = calls.find(c => c[0].length > 0);
            expect(validCall).toBeDefined();
            expect(validCall![0][0].desc).toMatch(/Let's start/i);
        }, { timeout: 3000 });
    });

    // --- TEST 4: RENDERING BUBBLES (UI CHECK) ---
    test('renders bubble elements when trace frames exist', () => {
        const mockFrames = [{
            id: 0,
            memory: { arr: [5, 1, 4], comparing: [0, 1] },
            activeVariable: 'arr',
            action: 'READ',
            desc: 'Comparing 5 and 1'
        }];
        mockStoreState('let arr = [5, 1, 4]; // sort', mockFrames, 0);
        const { container } = render(<VisualizeTab />);
        const bubbles = container.getElementsByClassName('bubble');
        expect(bubbles.length).toBe(3);
        expect(screen.getByText('Comparing 5 and 1')).toBeInTheDocument();
    });

    // --- TEST 5: QUEUE VISUALIZATION ---
    test('renders queue boxes when queue code is active', () => {
        const mockFrames = [{
            id: 0,
            memory: { queue: ['A', 'B'], adding: 'C' },
            activeVariable: 'queue',
            action: 'WRITE',
            desc: 'Adding C to queue'
        }];
        mockStoreState('let queue = []; queue.push("A");', mockFrames, 0);
        const { container } = render(<VisualizeTab />);
        expect(screen.getByText(/QUEUE \(First In, First Out\)/i)).toBeInTheDocument();
        const boxes = container.getElementsByClassName('queue-stack-box');
        expect(boxes.length).toBe(2);
    });

    // --- TEST 6: PLAYBACK CONTROLS ---
    test('clicking play button toggles playback', () => {
        const mockFrames = [{ id: 0, memory: {}, desc: 'Step 1' }];
        const { setFrameIndex } = mockStoreState('code', mockFrames, 0, false);
        const togglePlayMock = jest.fn();
        (useAnalysisStore as unknown as jest.Mock).mockReturnValue({
            traceFrames: mockFrames,
            currentFrameIndex: 0,
            isPlaying: false,
            togglePlay: togglePlayMock,
            setFrameIndex,
            setTraceFrames: jest.fn(),
        });
        render(<VisualizeTab />);
        const playBtn = screen.getByTitle('Play');
        fireEvent.click(playBtn);
        expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });

    // --- TEST 7: SAVE VISUALIZATION ---
    test('save button triggers API call', async () => {
        const mockFrames = [{ id: 0, memory: {}, desc: 'Step 1' }];
        mockStoreState('let x = 1;', mockFrames);
        render(<VisualizeTab />);
        const saveBtn = screen.getByTitle(/Save this visualization/i);
        fireEvent.click(saveBtn);
        await waitFor(() => {
            expect(window.api.saveVisualization).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'test-user-id'
            }));
        });
    });
});