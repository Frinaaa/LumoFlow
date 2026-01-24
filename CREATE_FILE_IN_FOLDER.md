# How to Create Files Inside Folders ✅

## Method 1: Right-Click Context Menu (Recommended)

### Steps:
1. **Right-click on any folder** in the file explorer
2. Select **"New File"** from the context menu
3. The folder will automatically expand (if collapsed)
4. An input field appears **inside the folder** (indented)
5. Type the filename (e.g., `index.js`, `style.css`)
6. Press **Enter** to create the file

### Visual Example:
```
📁 src (right-click here)
   ├─ 📄 [Type filename here...] ← Input appears here
   └─ 📄 existing-file.js
```

## Method 2: Using Header Buttons

### For Root Level Files:
1. Click the **📄+ (file plus)** icon in the "LUMOFLOW UI" header
2. Input appears at the top level
3. Type filename and press Enter

### Note:
- Header buttons create files at root level only
- To create inside folders, use the context menu (Method 1)

## Context Menu Options for Folders

When you right-click a folder, you'll see:

```
┌─────────────────────┐
│ 📄 New File         │ ← Creates file inside folder
│ 📁 New Folder       │ ← Creates subfolder (coming soon)
│ ─────────────────── │
│ ✏️  Rename          │
│ 📋 Copy             │
│ ✂️  Cut             │
│ 📄 Paste            │
│ ─────────────────── │
│ 🗑️  Delete          │
└─────────────────────┘
```

## Context Menu Options for Files

When you right-click a file, you'll see:

```
┌─────────────────────┐
│ 📂 Open             │
│ ✏️  Rename          │
│ 📋 Copy             │
│ ✂️  Cut             │
│ 📄 Paste            │
│ ─────────────────── │
│ 🗑️  Delete          │
└─────────────────────┘
```

## How It Works

### File Path Construction
When you create a file inside a folder:
- Folder path: `src`
- Filename: `index.js`
- **Result**: `src/index.js`

### Nested Folders
For deeply nested structures:
- Folder path: `src/components/Header`
- Filename: `Header.js`
- **Result**: `src/components/Header/Header.js`

## Visual Feedback

### Before Creating File:
```
📁 src
   └─ 📄 App.js
```

### After Right-Click "New File":
```
📁 src (expanded)
   ├─ 📄 [filename.js] ← Input field (cyan border)
   └─ 📄 App.js
```

### After Typing and Pressing Enter:
```
📁 src
   ├─ 📄 filename.js ← New file created!
   └─ 📄 App.js
```

## Output Messages

Success:
```
File created: src/filename.js
```

Error:
```
Error creating file: [error message]
```

## Keyboard Shortcuts

While in the input field:
- **Enter**: Create the file
- **Escape**: Cancel creation
- **Blur** (click away): Cancel if empty, create if has name

## Tips

1. **Expand folders first**: You can click to expand a folder, then right-click to add files
2. **Auto-expand**: Right-clicking "New File" automatically expands the folder
3. **Indentation**: Files inside folders are visually indented (32px)
4. **File icons**: All files show a blue file-code icon
5. **Folder icons**: Folders show yellow folder icons

## Example Workflow

### Creating a Component File:

1. Right-click on `components` folder
2. Click "New File"
3. Type: `Button.jsx`
4. Press Enter
5. ✅ File created at `components/Button.jsx`
6. File appears in the explorer
7. Output shows: "File created: components/Button.jsx"

### Creating Multiple Files:

1. Right-click `src` → New File → `index.js` → Enter
2. Right-click `src` → New File → `App.js` → Enter
3. Right-click `src` → New File → `styles.css` → Enter

Result:
```
📁 src
   ├─ 📄 index.js
   ├─ 📄 App.js
   └─ 📄 styles.css
```

## Troubleshooting

### Input field not appearing?
- Make sure you right-clicked on a **folder** (yellow icon)
- Check if the folder is expanded
- Try clicking the folder first to select it

### File not created?
- Check the Output tab for error messages
- Make sure filename is valid (no special characters like `/ \ : * ? " < > |`)
- Verify you pressed Enter to confirm

### File created at wrong location?
- Make sure you right-clicked the correct folder
- Check the Output tab to see the full path
- Use the refresh button (🔄) to reload the file tree

## Future Enhancements

- Create subfolders inside folders
- Drag and drop files between folders
- Multi-file creation
- File templates
- Quick file creation with keyboard shortcuts
