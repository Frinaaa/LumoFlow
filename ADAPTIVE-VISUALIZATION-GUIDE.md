# 🎨 Adaptive AI Visualization System

## What's New?

The visualization system is now **truly adaptive** - each file gets its own **unique visualization** based on its specific code content!

## Key Features

### 1. **File-Specific Visualizations**
- Each file is analyzed independently
- Visualizations are created based on the actual code content
- No two files will have the same visualization (unless they have identical code)

### 2. **Automatic Clearing**
- When you switch files, the previous visualization is **immediately cleared**
- New visualization is generated from scratch for the new file
- No more "repeating" visualizations across different files

### 3. **Code Fingerprinting**
- Each code file gets a unique identifier
- The system tracks what makes each code unique
- Shows specific operations that are unique to that file

### 4. **Smart AI Analysis**
- Extracts actual data from your code (arrays, numbers, strings)
- Analyzes console.log outputs to understand the goal
- Creates step-by-step journey showing how inputs become outputs
- Identifies unique operations in each file

## How It Works

### When You Open a File:
1. ✅ Previous visualization is **cleared immediately**
2. 🔍 AI analyzes the NEW code
3. 📊 Extracts unique data and operations
4. 🎯 Identifies the code's goal (from console.log)
5. 🎨 Creates a **unique visualization** for THIS specific code
6. 📝 Shows step-by-step journey with line numbers

### What Makes Each Visualization Unique:
- **Code Fingerprint**: Unique ID based on code content
- **Specific Data**: Uses actual arrays, numbers, strings from YOUR code
- **Unique Operations**: Lists operations specific to this file (map, filter, sort, etc.)
- **Custom Journey**: Shows how THIS code transforms inputs to outputs
- **Line Numbers**: References actual line numbers from your file

## Examples

### File 1: Bubble Sort
```javascript
let arr = [5, 2, 8, 1, 9];
// Visualization shows: Floating bubbles with values 5, 2, 8, 1, 9
// Unique operations: sorting, bubble sort
// Code fingerprint: let_arr_=_[5,_2,_8,_1,_9];...
```

### File 2: Array Transformation
```javascript
let numbers = [1, 2, 3, 4];
let doubled = numbers.map(x => x * 2);
console.log(doubled);
// Visualization shows: Input→Processing→Output flow
// Unique operations: map transformation
// Shows journey: [1,2,3,4] → doubling → [2,4,6,8]
// Code fingerprint: let_numbers_=_[1,_2,_3,_4];...
```

### File 3: Queue Operations
```javascript
let queue = [];
queue.push('A');
queue.push('B');
queue.shift();
// Visualization shows: Queue boxes with FRONT/BACK labels
// Unique operations: adding to end, removing from start
// Shows: A and B being added, then A being removed
// Code fingerprint: let_queue_=_[];queue.push...
```

## Console Output

When you switch files, you'll see in the console:
```
🔄 File changed! Clearing previous visualization...
🎬 Building NEW trace for file: mycode.js
📝 Code preview: let arr = [5, 2, 8, 1, 9];...
🎬 ADAPTIVE AI ANALYZER: Starting visualization for NEW code
📝 Code fingerprint: let_arr_=_[5,_2,_8,_1,_9];...
📏 Code length: 150 characters
🔍 AI Analysis Results:
  - Arrays found: 1
  - Numbers found: 0
  - Strings found: 0
  - Console outputs: 1
🎯 Pattern Detection:
  - Queue/Stack: false
  - Recursion: false
  - Sorting: true
  - Searching: false
  - Array ops: true
✅ ADAPTIVE: Creating UNIQUE Sorting visualization for THIS code
  - Using actual array data: [5, 2, 8, 1, 9]
✨ Generated 45 unique frames for Sorting
📊 RESULT: Generated 45 UNIQUE frames for this specific code
✅ Setting trace frames for visualization
```

## Benefits

### For Students:
- ✅ Each file's visualization is **different and unique**
- ✅ See **actual data** from your code (not generic examples)
- ✅ Understand **your specific code's journey**
- ✅ Line numbers help you follow along in the editor

### For Learning:
- ✅ Compare different algorithms side-by-side
- ✅ See how different inputs produce different outputs
- ✅ Understand what makes each code unique
- ✅ Visual feedback shows code is being analyzed fresh each time

## Technical Details

### Adaptive Analysis Process:
1. **Clear State**: Previous frames cleared immediately
2. **Extract Data**: Parse actual arrays, numbers, strings from code
3. **Detect Patterns**: Identify sorting, searching, loops, etc.
4. **Analyze Output**: Find console.log statements to understand goal
5. **Generate Frames**: Create step-by-step visualization
6. **Add Metadata**: Include code fingerprint, line numbers, unique operations

### Priority System (13 Levels):
1. Queue/Stack operations (most visual)
2. Recursion (special functions)
3. Sorting algorithms
4. Searching algorithms
5. Array operations (map, filter, reduce)
6. String operations
7. Loops
8. Conditionals
9. Functions
10. Arithmetic
11. Objects/Classes
12. Variables
13. Smart Universal Analyzer (AI fallback)

## Testing

Try these files to see unique visualizations:

### Test 1: Different Arrays
```javascript
// File A
let arr = [5, 2, 8];
// Shows: 3 bubbles with values 5, 2, 8

// File B  
let arr = [10, 20, 30, 40];
// Shows: 4 bubbles with values 10, 20, 30, 40
```

### Test 2: Different Operations
```javascript
// File A
let nums = [1, 2, 3];
let doubled = nums.map(x => x * 2);
// Shows: Transform theme with map operation

// File B
let nums = [1, 2, 3, 4, 5];
let evens = nums.filter(x => x % 2 === 0);
// Shows: Transform theme with filter operation
```

### Test 3: Different Structures
```javascript
// File A
let queue = [];
queue.push('A');
// Shows: Queue visualization

// File B
let stack = [];
stack.push('X');
stack.pop();
// Shows: Stack visualization
```

## Troubleshooting

### If visualizations still look similar:
1. Check console for "Code fingerprint" - should be different
2. Verify "unique operations" list is different
3. Make sure code content is actually different
4. Try adding console.log to show different outputs

### If visualization doesn't update:
1. Check console for "File changed! Clearing previous visualization"
2. Wait 300ms for debounce
3. Make sure file content actually changed
4. Try switching to another file and back

## Summary

The system is now **truly adaptive**:
- ✅ Each file gets a **unique visualization**
- ✅ Based on **actual code content**
- ✅ Previous visualizations are **cleared immediately**
- ✅ AI analyzes **specific data and operations**
- ✅ Shows **unique journey** for each file
- ✅ No more repeating patterns!

**Every file is now treated as a unique piece of code with its own story to tell!** 🎉
