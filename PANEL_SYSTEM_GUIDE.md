# Bottom Panel System - Complete Guide

## Overview
The bottom panel has 4 distinct tabs, each with a specific purpose matching VS Code behavior.

## 1. PROBLEMS Tab 🔴

### Purpose
Shows code errors, warnings, and linting issues detected by Monaco Editor

### Features
- **Auto-detection**: Problems are automatically detected as you type
- **Real-time updates**: Problem count badge updates live
- **Color coding**: 
  - Errors: Red (#f48771)
  - Warnings: Yellow (#cca700)
- **Clickable items**: Each problem shows:
  - Error/warning icon
  - Problem message
  - File name and line number
- **Empty state**: Shows "No problems detected" with checkmark icon

### Data Source
- Monaco Editor diagnostics (syntax errors, type errors, etc.)
- Passed via `onProblemsDetected` callback from CodeEditor
- Stored in `problems` state array

### Example Problems
```javascript
{
  message: "Unexpected token ';'",
  line: 15,
  source: "main.js",
  type: "error"
}
```

## 2. OUTPUT Tab 📤

### Purpose
Shows output from program execution (when you click "Run" button)

### Features
- **Program output**: stdout from executed code
- **Execution logs**: Shows what file is being run
- **Auto-scroll**: Automatically scrolls to latest output
- **Monospace font**: Consolas for code-like appearance
- **Clear button**: Clears only output data

### Data Source
- Set by "Run" button click
- Executes: `node <filename>`
- Result stored in `outputData` state
- Automatically switches to Output tab when running

### Example Output
```
Running main.js...
Hello, World!
Result: 42
Process completed successfully
```

## 3. DEBUG CONSOLE Tab 🐛

### Purpose
For debugging output, console.log statements, and debug information

### Features
- **Debug output**: Shows debug-specific information
- **Console logs**: Can capture console.log() output
- **Stack traces**: Display error stack traces
- **Monospace font**: For code readability
- **Separate from output**: Keeps debug info isolated

### Data Source
- Stored in `debugData` state
- Can be populated by:
  - Debug sessions
  - Console.log() capture
  - Error stack traces
  - Custom debug messages

### Future Enhancements
- Breakpoint integration
- Variable inspection
- Step-through debugging
- Watch expressions

## 4. TERMINAL Tab 💻

### Purpose
Interactive command-line interface for running shell commands

### Features
- **Interactive input**: Type commands and press Enter
- **Command execution**: Real shell command execution via Electron IPC
- **Command history**: All commands and outputs displayed
- **Auto-scroll**: Scrolls to latest command output
- **Clear button**: Clears terminal history
- **Prompt indicator**: Green $ prompt

### Data Source
- User input from terminal input field
- Commands executed via `window.api.executeCommand()`
- Output stored in `terminalOutput` state

### Example Usage
```bash
$ ls
main.js
package.json
node_modules/

$ node main.js
Hello, World!

$ npm install express
Installing express...
```

## State Management

### EditorScreen State
```typescript
const [activeBottomTab, setActiveBottomTab] = useState('Terminal');
const [problems, setProblems] = useState<Problem[]>([]);
const [outputData, setOutputData] = useState('');
const [debugData, setDebugData] = useState('');
const [terminalOutput, setTerminalOutput] = useState('');
```

### Data Flow

#### Problems
```
CodeEditor (Monaco) 
  → detects syntax/type errors
  → onProblemsDetected callback
  → setProblems(detectedProblems)
  → Terminal component displays in Problems tab
```

#### Output
```
User clicks "Run" button
  → editorContext.onRun()
  → executeCommand(`node ${file}`)
  → setOutputData(result)
  → setActiveBottomTab('Output')
  → Terminal component displays in Output tab
```

#### Terminal
```
User types command + Enter
  → handleCommand(cmd)
  → executeCommand(cmd)
  → setTerminalOutput(prev + result)
  → Terminal component displays in Terminal tab
```

#### Debug
```
Debug session starts
  → Debug events captured
  → setDebugData(debugInfo)
  → Terminal component displays in Debug tab
```

## Clear Button Behavior

The clear button clears only the active tab's data:

```typescript
onClear={() => {
  if (activeBottomTab === 'Terminal') setTerminalOutput('');
  else if (activeBottomTab === 'Output') setOutputData('');
  else if (activeBottomTab === 'Debug') setDebugData('');
  // Problems are not cleared manually - they update automatically
}}
```

## Tab Switching

Users can switch between tabs by clicking the tab headers. Each tab maintains its own data independently.

## Visual Design

### Tab Header
- Active tab: White text with cyan bottom border (#00f2ff)
- Inactive tabs: Gray text (#858585)
- Hover: Lighter gray (#cccccc)
- Problems badge: Shows count with color (red if errors, gray if none)

### Content Area
- Background: #1e1e1e (VS Code dark)
- Text: #cccccc (light gray)
- Monospace font: Consolas, "Courier New", monospace
- Font size: 13px
- Line height: 1.5
- Padding: 12px 16px

### Icons
- Problems: Circle X (error), Triangle ! (warning)
- Clear: Trash icon
- Maximize: Chevron up
- Close: X mark

## Keyboard Shortcuts (Future)

- `Ctrl+Shift+M` - Toggle Problems panel
- `Ctrl+Shift+U` - Show Output
- `Ctrl+Shift+Y` - Show Debug Console
- `Ctrl+` ` - Toggle Terminal
- `Ctrl+K Ctrl+H` - Clear active panel

## Integration Points

### With CodeEditor
- CodeEditor detects problems via Monaco diagnostics
- Passes problems to EditorScreen via callback
- Problems update in real-time as user types

### With Run Button
- Run button executes current file
- Output goes to Output tab
- Automatically switches to Output tab
- Shows execution status and results

### With Terminal
- Terminal executes arbitrary shell commands
- Independent from Run button
- Maintains command history
- Supports all shell commands available in system

### With Debug System (Future)
- Debug sessions will populate Debug Console
- Breakpoints will pause execution
- Variables can be inspected
- Step-through debugging support

## Best Practices

1. **Problems**: Auto-detected, don't manually populate
2. **Output**: Only for program execution output (Run button)
3. **Debug**: Only for debugging information
4. **Terminal**: For interactive command execution

This separation keeps each panel focused and prevents confusion about where output appears.
