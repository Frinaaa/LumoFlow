# LumoFlow Components

## IDE Components

### IDEHeader
**Location:** `src/components/IDEHeader/IDEHeader.tsx`

Header component for the code editor with action buttons.

**Props:**
- `onAnalyze: () => void` - Callback for analyze button
- `onRun: () => void` - Callback for run button
- `onSave: () => void` - Callback for save button
- `isRunning: boolean` - Loading state for run button

**Features:**
- Brand logo display
- Analyze, Run, Save buttons
- Navigation to Dashboard and Settings

---

### FileExplorer
**Location:** `src/components/FileExplorer/FileExplorer.tsx`

Sidebar component for browsing project files.

**Props:**
- `files: any[]` - Array of file objects with `name` and `path`
- `selectedFile: string | null` - Currently selected file path
- `onFileSelect: (file: any) => void` - Callback when file is clicked

**Features:**
- File list with icons (Python/JavaScript)
- Active file highlighting
- Sidebar tabs (Explorer, Search, GitHub)

---

### CodeEditor
**Location:** `src/components/CodeEditor/CodeEditor.tsx`

Monaco editor wrapper for code editing.

**Props:**
- `code: string` - Current code content
- `onChange: (value: string) => void` - Callback on code change
- `selectedFile: string | null` - Currently open file
- `onSave: () => void` - Callback for save action

**Features:**
- Syntax highlighting (Python/JavaScript)
- Minimap display
- Tab display with file name
- Dark theme

---

### Terminal
**Location:** `src/components/Terminal/Terminal.tsx`

Terminal output display component.

**Props:**
- `output: string[]` - Array of terminal output lines

**Features:**
- Auto-scroll to latest output
- Blinking cursor animation
- Multiple tabs (Terminal, Output, Debug Console)
- Monospace font rendering

---

## Usage Example

```tsx
import { IDEHeader, FileExplorer, CodeEditor, Terminal } from '../components';

// In your screen component
<IDEHeader 
  onAnalyze={handleAnalyze}
  onRun={handleRun}
  onSave={handleSave}
  isRunning={isRunning}
/>

<FileExplorer 
  files={files}
  selectedFile={selectedFile}
  onFileSelect={handleFileSelect}
/>

<CodeEditor 
  code={code}
  onChange={setCode}
  selectedFile={selectedFile}
  onSave={handleSave}
/>

<Terminal output={terminalOutput} />
```

---

## Component Architecture

```
src/
├── components/
│   ├── IDEHeader/
│   │   └── IDEHeader.tsx
│   ├── FileExplorer/
│   │   └── FileExplorer.tsx
│   ├── CodeEditor/
│   │   └── CodeEditor.tsx
│   ├── Terminal/
│   │   └── Terminal.tsx
│   ├── index.ts
│   └── README.md
├── screens/
│   └── TerminalScreen.tsx
└── styles/
    └── TerminalScreen.css
```

---

## Benefits of Component-Based Architecture

1. **Reusability** - Components can be used in other screens
2. **Maintainability** - Each component has a single responsibility
3. **Testability** - Easier to unit test isolated components
4. **Scalability** - Easy to add new features or components
5. **Readability** - Cleaner, more organized code structure

---

## Future Enhancements

- Add file context menu (delete, rename, duplicate)
- Implement code formatting (Prettier integration)
- Add breakpoint debugging
- Support for multiple file tabs
- Code completion and IntelliSense
- Theme customization
