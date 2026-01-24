# File Explorer - Complete Functionality Guide

## ✅ All Features Now Working

### 1. File Operations

#### Create New File
- **Button**: Click the file+ icon in the explorer header
- **Keyboard**: Click "New File" button
- **Process**:
  1. Input field appears at the top of file list
  2. Type filename (e.g., `main.js`, `index.html`)
  3. Press Enter to create
  4. File appears in the explorer
  5. Output shows: "File created: filename"

#### Create New Folder
- **Button**: Click the folder+ icon in the explorer header
- **Process**:
  1. Input field appears
  2. Type folder name
  3. Press Enter or click away to create
  4. Folder appears in the explorer
  5. Output shows: "Folder created: foldername"

#### Open File
- **Click**: Single click on any file
- **Result**: File opens in the editor
- **Tab**: File tab appears at the top
- **Content**: File content loads in Monaco editor

#### Rename File/Folder
- **Method 1**: Right-click → Rename
- **Method 2**: Context menu → Rename
- **Process**:
  1. Input field appears with current name
  2. Edit the name
  3. Press Enter or click away to confirm
  4. File/folder is renamed
  5. Output shows: "File renamed: old → new"

#### Delete File/Folder
- **Method**: Right-click → Delete
- **Confirmation**: "Are you sure?" dialog appears
- **Result**: File/folder is permanently deleted
- **Output**: "File deleted: filename"
- **Note**: If deleted file is open, editor closes it

#### Copy File
- **Method**: Right-click → Copy
- **Result**: File is copied to clipboard
- **Output**: "Copied: filename"
- **Indicator**: Paste option appears in context menu

#### Cut File
- **Method**: Right-click → Cut
- **Result**: File is cut to clipboard
- **Output**: "Cut: filename"
- **Indicator**: Paste option appears in context menu

#### Paste File
- **Method**: Right-click → Paste (only visible if clipboard has content)
- **Result**: File is pasted to selected location
- **Note**: Cut files are removed from clipboard after paste

### 2. Folder Operations

#### Expand/Collapse Folders
- **Click**: Click on folder name or chevron icon
- **Expanded**: Shows folder contents with chevron-down icon
- **Collapsed**: Hides contents with chevron-right icon
- **State**: Expansion state is maintained

#### Create File in Folder
- **Method**: Right-click folder → New File
- **Result**: Input appears inside the folder
- **File**: Created inside the selected folder

### 3. Context Menu

Right-click on any file or folder to see:

```
┌─────────────────────┐
│ 📂 Open             │
│ ✏️  Rename          │
│ 📋 Copy             │
│ ✂️  Cut             │
│ 📄 Paste (if copied)│
│ ─────────────────── │
│ 🗑️  Delete          │
└─────────────────────┘
```

### 4. Explorer Header Actions

Located in the "LUMOFLOW UI" section header:

- **📄+ New File**: Creates a new file at root level
- **📁+ New Folder**: Creates a new folder at root level
- **🔄 Refresh**: Reloads the file tree from disk

### 5. Visual Feedback

#### File Icons
- 📄 Regular files: Blue file-code icon
- 📁 Folders: Yellow folder icon
- 📂 Expanded folders: Open folder icon

#### Hover Effects
- Files/folders highlight on hover (#2a2d2e)
- Selected folder has darker background (#2d2d30)
- Context menu items highlight on hover

#### Active States
- Currently open file is highlighted
- Expanded folders show chevron-down
- Collapsed folders show chevron-right

### 6. Keyboard Support

#### Input Fields
- **Enter**: Confirm creation/rename
- **Escape**: Cancel operation
- **Blur**: Auto-confirm if valid name

#### Editor
- **Ctrl+S**: Save current file
- **Ctrl+N**: New file (future)
- **Ctrl+W**: Close file (future)

## State Management

### File Explorer State
```typescript
const [files, setFiles] = useState<any[]>([]);
const [isCreatingFile, setIsCreatingFile] = useState(false);
const [isCreatingFolder, setIsCreatingFolder] = useState(false);
const [newFileName, setNewFileName] = useState('');
const [newFolderName, setNewFolderName] = useState('');
const [renameFile, setRenameFile] = useState<string | null>(null);
const [newName, setNewName] = useState('');
const [clipboard, setClipboard] = useState<any>(null);
const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
const [creatingInFolder, setCreatingInFolder] = useState<string | null>(null);
const [contextMenu, setContextMenu] = useState<any>(null);
```

## API Integration

### File Operations
```typescript
// Read all files
window.api.readProjectFiles() → Promise<File[]>

// Read file content
window.api.readFile(path) → Promise<string>

// Create file
window.api.createFile({ fileName, content }) → Promise<{success, msg}>

// Create folder
window.api.createFolder(name) → Promise<{success, msg}>

// Delete file
window.api.deleteFile(path) → Promise<{success, msg}>

// Rename file
window.api.renameFile(oldPath, newName) → Promise<{success, newPath, msg}>
```

## Error Handling

All operations include try-catch blocks:
- Errors are logged to console
- User-friendly messages appear in Output tab
- Operations fail gracefully without crashing

## Output Messages

All file operations provide feedback in the Output tab:
- ✅ "File created: filename"
- ✅ "Folder created: foldername"
- ✅ "File renamed: old → new"
- ✅ "File deleted: filename"
- ✅ "Copied: filename"
- ✅ "Cut: filename"
- ✅ "Files refreshed"
- ❌ "Error creating file: message"

## Context Menu Styling

```css
Background: #252526
Border: 1px solid #454545
Border Radius: 4px
Box Shadow: 0 4px 12px rgba(0,0,0,0.5)
Font Size: 13px
Color: #cccccc

Hover:
  Background: #2a2d2e

Delete Item:
  Color: #f48771 (red)
```

## File Tree Structure

```
LUMOFLOW UI
├── 📁 src
│   ├── 📄 index.js
│   ├── 📄 App.js
│   └── 📁 components
│       ├── 📄 Header.js
│       └── 📄 Footer.js
├── 📁 public
│   └── 📄 index.html
├── 📄 package.json
└── 📄 README.md
```

## Best Practices

1. **Always confirm deletions**: Prevents accidental data loss
2. **Reload after operations**: Ensures file tree is up-to-date
3. **Check output tab**: See operation results and errors
4. **Use context menu**: Quick access to all operations
5. **Expand folders**: See nested file structure

## Troubleshooting

### File not appearing after creation
- Click the refresh button (🔄)
- Check Output tab for errors

### Can't rename file
- Make sure file is not currently open
- Check if name is valid (no special characters)

### Context menu not showing
- Right-click directly on file/folder name
- Make sure you're in the Explorer sidebar

### Delete not working
- Confirm the deletion dialog
- Check file permissions
- See Output tab for error details

## Future Enhancements

- Drag and drop files
- Multi-select files
- Keyboard navigation (arrow keys)
- Search in files
- File filters
- Sort options (name, date, type)
- File preview on hover
- Recent files list
- Favorites/bookmarks
