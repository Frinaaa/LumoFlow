/**
 * Unified Game Generators
 * 
 * This module consolidates all puzzle/game generators into a single source of truth.
 * Previously, these generators were duplicated in both:
 * - electron/utils/ (Node.js/Electron environment)
 * - src/utils/ (React/Browser environment)
 * 
 * Now they exist only here. If the Electron main process needs to generate puzzles,
 * it should import from this location or receive the data from the renderer process.
 * 
 * This eliminates the "Parallel Implementation Syndrome" where changes in one
 * environment are not reflected in the other.
 */

// Bug Hunt Game - Find the bug in the code
export {
    getNextBugLevel,
    reshuffleLevels,
    getTotalLevels,
    type BugHuntLevel
} from './bugHuntGenerator';

// Debug Race Game - Fix the buggy code
export {
    getNextBug,
    reshuffleBugs,
    getTotalBugs,
    type BugLevel
} from './debugGenerator';

// Error Match Game - Match errors to descriptions
export {
    getNextError,
    getNextErrorCard,
    reshuffleErrors,
    getTotalErrors,
    type ErrorCardData
} from './errorGenerator';

// Logic Puzzle Game - Logical reasoning puzzles
export {
    getNextPuzzle,
    reshufflePuzzles,
    getTotalPuzzles,
    type PuzzleData,
    type PuzzleFragment
} from './logicPuzzleGenerator';

// Predict Game - Predict code output
export {
    getNextChallenge,
    reshuffleChallenges,
    getTotalChallenges,
    type PredictChallenge
} from './predictGenerator';
