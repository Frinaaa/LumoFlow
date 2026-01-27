# LumoFlow Components

> **Note:** This documentation has been updated to reflect the current project structure. The primary editor components now reside in `src/editor/components/`.

## Project Structure

```
src/
├── components/           # Shared UI Components
│   ├── AnalysisPanel/   # Code analysis visualization
│   ├── CustomTitlebar.tsx  # Full-featured titlebar for IDE
│   └── SimpleTitlebar.tsx  # Minimal titlebar for other screens
│
├── config/              # Centralized Configuration
│   └── fileTypes.ts     # Unified file extension/icon/language mappings
│
├── editor/              # IDE Components (Main Editor)
│   ├── components/
│   │   ├── Explorer/    # File explorer sidebar
│   │   ├── Layout/      # Panel layouts
│   │   ├── Monaco/      # Monaco editor wrapper
│   │   ├── Terminal/    # Integrated terminal
│   │   ├── Workspace/   # Tab management
│   │   └── MenuBar.tsx  # Application menu
│   ├── hooks/           # Editor-specific hooks
│   ├── stores/          # Zustand stores for editor state
│   └── EditorLayout.tsx # Main editor layout
│
├── hooks/               # Shared React Hooks
│   └── useWindowControls.ts  # Electron window controls
│
├── services/            # API & Business Logic
│   ├── apiProvider.ts   # Unified Electron/Web API layer
│   └── authService.ts   # Authentication service
│
├── screens/             # Full-page screens
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── GameSelectorScreen.tsx
│   └── ... (game screens)
│
└── utils/
    ├── generators/      # Game puzzle generators (consolidated)
    │   ├── bugHuntGenerator.ts
    │   ├── debugGenerator.ts
    │   └── index.ts
    └── utils.ts         # Shared utility functions
```

---

## Key Components

### CustomTitlebar
**Location:** `src/components/CustomTitlebar.tsx`

Full-featured VS Code-style titlebar with:
- Brand logo
- Menu bar (File, Edit, View)
- Search bar
- Analyze & Run buttons
- Window controls (minimize, maximize, close)

Uses the `useWindowControls` hook for Electron window operations.

---

### Editor Components
**Location:** `src/editor/components/`

The main IDE functionality is split into:

| Component | Purpose |
|-----------|---------|
| `Explorer/FileTree` | File tree navigation |
| `Monaco/CodeEditor` | Monaco editor wrapper |
| `Terminal/Terminal` | Integrated terminal |
| `Workspace/TabBar` | Open file tabs |
| `Layout/Sidebar` | Collapsible sidebar |

---

## Shared Utilities

### File Type Configuration
**Location:** `src/config/fileTypes.ts`

Single source of truth for:
- File extension → Language mapping
- File extension → Icon mapping
- File extension → Color mapping

```typescript
import { getFileTypeInfo, getLanguageFromFile } from '../config/fileTypes';

const info = getFileTypeInfo('app.tsx');
// { lang: 'typescript', icon: 'fa-brands fa-react', color: '#3178c6' }
```

---

### API Provider
**Location:** `src/services/apiProvider.ts`

Unified API layer that automatically routes requests:
- **Electron:** Uses IPC channels
- **Web:** Uses fetch API

```typescript
import { apiProvider } from '../services/apiProvider';

const result = await apiProvider.execute('login', credentials);
```

---

### Window Controls Hook
**Location:** `src/hooks/useWindowControls.ts`

Shared hook for Electron window operations:

```typescript
import { useWindowControls } from '../hooks/useWindowControls';

const { minimize, maximize, close } = useWindowControls();
```

---

## Game Generators
**Location:** `src/utils/generators/`

All puzzle generators are consolidated here:

```typescript
import { 
  getNextBugLevel,    // Bug Hunt game
  getNextBug,         // Debug Race game
  getNextErrorRound,  // Error Match game
} from '../utils/generators';
```

---

## Architecture Benefits

1. **Single Source of Truth** - No duplicate implementations
2. **Backwards Compatibility** - Re-exports maintain existing imports
3. **Environment Agnostic** - Same code runs in Electron and web
4. **Type Safety** - Full TypeScript support
5. **Easy Maintenance** - Changes in one place affect everywhere
