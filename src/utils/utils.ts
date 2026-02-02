// Import from centralized editor types and re-alias for backwards compatibility
import { FileNode } from '../editor/types';

// FileItem is an alias for FileNode with additional fields for tree building
export interface FileItem extends FileNode {
  parentFolder?: string;
}

// Re-export from centralized config for backwards compatibility
export {
  getLanguageFromFile,
  getFileIcon,
  getFileIconColor,
  getFileTypeInfo,
  FILE_TYPES,
  FOLDER_INFO
} from '../config/fileTypes';

interface Problem {
  message: string;
  line: number;
  source: string;
  type: 'error' | 'warning';
}

// Strip ANSI escape sequences
export const stripAnsiCodes = (str: string): string => {
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
};

// Parse errors from stderr into problems with DETAILED EXPLANATIONS
export const parseErrors = (stderr: string, fileName: string, filePath?: string): Problem[] => {
  if (!stderr) return [];

  const cleanStderr = stripAnsiCodes(stderr);
  const problems: Problem[] = [];
  const lines = cleanStderr.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    // Node.js / JavaScript 'at' patterns (Stack traces)
    // Matches: "at Object.<anonymous> (c:\path\file.js:10:5)"
    // Or: "at c:\path\file.js:10:5"
    if (line.includes('at ') && (line.includes('.js:') || line.includes('.ts:'))) {
      const match = line.match(/:(\d+):(\d+)\)?$/) || line.match(/:(\d+)\)?$/);
      if (match) {
        const lineNum = parseInt(match[1]);
        const colNum = match[2] ? parseInt(match[2]) : 1;

        // Try to find the error message (usually in the previous lines)
        let message = 'Runtime Error';
        let errorType = '';
        for (let i = lines.indexOf(line) - 1; i >= 0; i--) {
          const l = lines[i].trim();
          if (l && !l.includes('at ')) {
            message = l;
            // Extract error type
            if (l.includes('ReferenceError')) errorType = 'ReferenceError';
            else if (l.includes('TypeError')) errorType = 'TypeError';
            else if (l.includes('SyntaxError')) errorType = 'SyntaxError';
            else if (l.includes('RangeError')) errorType = 'RangeError';
            else if (l.includes('URIError')) errorType = 'URIError';
            break;
          }
        }

        // Add detailed explanation
        const detailedMessage = explainError(message, errorType, lineNum);

        problems.push({
          message: detailedMessage,
          line: lineNum,
          source: fileName,
          type: 'error'
        });
        continue;
      }
    }

    // Python error patterns
    if (line.includes('File "') && line.includes('line ')) {
      const lineMatch = line.match(/line (\d+)/);
      const lineNum = lineMatch ? parseInt(lineMatch[1]) : 1;

      const errorIndex = lines.indexOf(line);
      let message = 'Syntax Error';

      // Python error message is usually 2 lines down after the "    ^" line
      for (let i = errorIndex + 1; i < lines.length; i++) {
        const l = lines[i].trim();
        if (l && !l.startsWith('File') && !l.includes('^')) {
          message = l;
          break;
        }
      }

      const detailedMessage = explainError(message, 'Python', lineNum);

      problems.push({
        message: detailedMessage,
        line: lineNum,
        source: fileName,
        type: 'error'
      });
    }

    // Direct Error/Exception lines (e.g. ReferenceError: x is not defined)
    else if (line.includes('Error:') || line.includes('Exception:') || line.includes('TypeError') || line.includes('ReferenceError') || line.includes('SyntaxError')) {
      // Avoid duplicate if already added by stack trace parser
      if (problems.some(p => p.message.includes(line.trim()))) continue;

      let errorType = '';
      if (line.includes('ReferenceError')) errorType = 'ReferenceError';
      else if (line.includes('TypeError')) errorType = 'TypeError';
      else if (line.includes('SyntaxError')) errorType = 'SyntaxError';
      else if (line.includes('RangeError')) errorType = 'RangeError';

      const detailedMessage = explainError(line.trim(), errorType, 1);

      problems.push({
        message: detailedMessage,
        line: 1, // Default to line 1 if no specific line found yet
        source: fileName,
        type: 'error'
      });
    }

    // Command failed patterns
    else if (line.includes('Command failed') || line.includes('is not recognized')) {
      const detailedMessage = explainError(line.trim(), 'Command', 1);
      
      problems.push({
        message: detailedMessage,
        line: 1,
        source: fileName,
        type: 'error'
      });
    }
  }

  return problems;
};

// DETAILED ERROR EXPLANATION SYSTEM
const explainError = (errorMessage: string, errorType: string, lineNum: number): string => {
  const msg = errorMessage.toLowerCase();
  
  // ReferenceError explanations
  if (errorType === 'ReferenceError' || msg.includes('is not defined') || msg.includes('not defined')) {
    const varMatch = errorMessage.match(/(\w+) is not defined/);
    const varName = varMatch ? varMatch[1] : 'variable';
    
    return `❌ ReferenceError: ${varName} is not defined (Line ${lineNum})

📝 WHAT THIS MEANS:
You're trying to use a variable "${varName}" that doesn't exist yet.

🔍 COMMON CAUSES:
1. Typo in variable name (check spelling)
2. Variable not declared with let, const, or var
3. Variable declared after it's used (order matters!)
4. Variable is in a different scope (inside another function/block)

✅ HOW TO FIX:
• Declare the variable before using it: let ${varName} = ...
• Check for typos in the variable name
• Make sure the variable is in the same scope
• If it's a function parameter, check the function definition

💡 EXAMPLE:
❌ Wrong:  console.log(${varName});  // Error: not defined
✅ Correct: let ${varName} = 10; console.log(${varName});`;
  }
  
  // TypeError explanations
  if (errorType === 'TypeError' || msg.includes('cannot read') || msg.includes('is not a function') || msg.includes('undefined')) {
    
    // Cannot read property
    if (msg.includes('cannot read') || msg.includes('cannot read property')) {
      const propMatch = errorMessage.match(/property '(\w+)'/);
      const prop = propMatch ? propMatch[1] : 'property';
      
      return `❌ TypeError: Cannot read property '${prop}' of undefined/null (Line ${lineNum})

📝 WHAT THIS MEANS:
You're trying to access a property "${prop}" on something that is undefined or null.

🔍 COMMON CAUSES:
1. Object doesn't exist (undefined)
2. Object is null
3. Trying to access property before object is created
4. Typo in object name

✅ HOW TO FIX:
• Check if the object exists before accessing: if (obj) { obj.${prop} }
• Use optional chaining: obj?.${prop}
• Initialize the object first: let obj = { ${prop}: value }
• Check for typos in object name

💡 EXAMPLE:
❌ Wrong:  let obj; console.log(obj.${prop});  // Error: obj is undefined
✅ Correct: let obj = { ${prop}: 'value' }; console.log(obj.${prop});
✅ Safe:    console.log(obj?.${prop});  // Returns undefined if obj is null`;
    }
    
    // Is not a function
    if (msg.includes('is not a function')) {
      const funcMatch = errorMessage.match(/(\w+) is not a function/);
      const funcName = funcMatch ? funcMatch[1] : 'something';
      
      return `❌ TypeError: ${funcName} is not a function (Line ${lineNum})

📝 WHAT THIS MEANS:
You're trying to call "${funcName}" as a function, but it's not a function.

🔍 COMMON CAUSES:
1. Variable is not a function (it's a number, string, object, etc.)
2. Function name is misspelled
3. Trying to call a property that doesn't exist
4. Overwriting a function with a non-function value

✅ HOW TO FIX:
• Check if ${funcName} is actually a function
• Verify the function name spelling
• Make sure you're not reassigning the function to something else
• Check if the function is defined before calling it

💡 EXAMPLE:
❌ Wrong:  let ${funcName} = 10; ${funcName}();  // Error: 10 is not a function
✅ Correct: function ${funcName}() { ... }; ${funcName}();
✅ Correct: let ${funcName} = () => { ... }; ${funcName}();`;
    }
    
    // Generic TypeError
    return `❌ TypeError: ${errorMessage} (Line ${lineNum})

📝 WHAT THIS MEANS:
You're trying to perform an operation on a value of the wrong type.

🔍 COMMON CAUSES:
1. Using undefined or null where a value is expected
2. Calling something that's not a function
3. Accessing properties on non-objects
4. Type mismatch in operations

✅ HOW TO FIX:
• Check the type of your variables: console.log(typeof variable)
• Make sure variables are initialized before use
• Use optional chaining (?.) for safe property access
• Verify function names and definitions

💡 TIP: Add console.log() statements to check variable values and types`;
  }
  
  // SyntaxError explanations
  if (errorType === 'SyntaxError' || msg.includes('unexpected') || msg.includes('missing')) {
    
    // Missing parenthesis/bracket
    if (msg.includes('missing') && (msg.includes(')') || msg.includes('}') || msg.includes(']'))) {
      return `❌ SyntaxError: Missing closing bracket/parenthesis (Line ${lineNum})

📝 WHAT THIS MEANS:
You opened a bracket, parenthesis, or brace but forgot to close it.

🔍 COMMON CAUSES:
1. Missing closing ) for function calls or conditions
2. Missing closing } for code blocks or objects
3. Missing closing ] for arrays
4. Mismatched brackets

✅ HOW TO FIX:
• Count your opening and closing brackets - they must match!
• Use an editor with bracket matching (highlights pairs)
• Check each opening bracket has a corresponding closing bracket
• Look at the line number - the error might be on a previous line

💡 EXAMPLE:
❌ Wrong:  if (x > 5 { console.log('hi'); }  // Missing )
✅ Correct: if (x > 5) { console.log('hi'); }

❌ Wrong:  let arr = [1, 2, 3;  // Missing ]
✅ Correct: let arr = [1, 2, 3];`;
    }
    
    // Unexpected token
    if (msg.includes('unexpected')) {
      return `❌ SyntaxError: Unexpected token (Line ${lineNum})

📝 WHAT THIS MEANS:
JavaScript found a character or symbol it didn't expect at this location.

🔍 COMMON CAUSES:
1. Missing semicolon on previous line
2. Extra or misplaced bracket/parenthesis
3. Using reserved keywords incorrectly
4. Typo in syntax (e.g., "iff" instead of "if")
5. Missing comma in object or array

✅ HOW TO FIX:
• Check the line mentioned AND the line before it
• Look for missing semicolons, commas, or brackets
• Verify all brackets are properly matched
• Check for typos in keywords (if, for, while, etc.)

💡 EXAMPLE:
❌ Wrong:  let x = 10 let y = 20;  // Missing semicolon
✅ Correct: let x = 10; let y = 20;

❌ Wrong:  let obj = { a: 1 b: 2 };  // Missing comma
✅ Correct: let obj = { a: 1, b: 2 };`;
    }
    
    // Generic SyntaxError
    return `❌ SyntaxError: ${errorMessage} (Line ${lineNum})

📝 WHAT THIS MEANS:
There's a mistake in how you wrote the code - JavaScript can't understand it.

🔍 COMMON CAUSES:
1. Missing or extra brackets, parentheses, or braces
2. Missing semicolons or commas
3. Typos in keywords
4. Incorrect syntax structure

✅ HOW TO FIX:
• Carefully read the error message - it tells you what's wrong
• Check line ${lineNum} and the lines around it
• Look for missing or extra punctuation
• Verify all brackets are properly matched
• Check for typos in keywords

💡 TIP: Syntax errors prevent code from running at all. Fix these first!`;
  }
  
  // RangeError explanations
  if (errorType === 'RangeError' || msg.includes('maximum call stack') || msg.includes('invalid array length')) {
    
    if (msg.includes('maximum call stack')) {
      return `❌ RangeError: Maximum call stack size exceeded (Line ${lineNum})

📝 WHAT THIS MEANS:
Your code is calling functions too many times, usually due to infinite recursion.

🔍 COMMON CAUSES:
1. Recursive function with no base case (stopping condition)
2. Function accidentally calls itself infinitely
3. Circular function calls (A calls B, B calls A)
4. Infinite loop that keeps calling functions

✅ HOW TO FIX:
• Add a base case to stop recursion: if (condition) return;
• Check that your recursive function eventually reaches the base case
• Verify loop conditions to prevent infinite loops
• Add console.log() to see how many times function is called

💡 EXAMPLE:
❌ Wrong:  function count(n) { return count(n-1); }  // No base case!
✅ Correct: function count(n) { if (n <= 0) return; return count(n-1); }`;
    }
    
    if (msg.includes('invalid array length')) {
      return `❌ RangeError: Invalid array length (Line ${lineNum})

📝 WHAT THIS MEANS:
You're trying to create an array with an invalid length (negative or too large).

🔍 COMMON CAUSES:
1. Negative array length: new Array(-5)
2. Array length too large (over 2^32)
3. Using non-integer for array length

✅ HOW TO FIX:
• Check array length is positive: if (length > 0) new Array(length)
• Verify calculations that determine array size
• Use reasonable array sizes (not billions of elements)

💡 EXAMPLE:
❌ Wrong:  let arr = new Array(-10);  // Negative length
✅ Correct: let arr = new Array(10);`;
    }
  }
  
  // Command errors
  if (errorType === 'Command' || msg.includes('command failed') || msg.includes('not recognized')) {
    return `❌ Command Error: ${errorMessage}

📝 WHAT THIS MEANS:
The system couldn't execute the command you tried to run.

🔍 COMMON CAUSES:
1. Command/program not installed on your system
2. Typo in command name
3. Command not in system PATH
4. Missing dependencies

✅ HOW TO FIX:
• Check if the program is installed
• Verify the command spelling
• Install missing programs (node, python, etc.)
• Check system PATH environment variable

💡 TIP: This is usually a system/environment issue, not a code issue`;
  }
  
  // Python errors
  if (errorType === 'Python') {
    if (msg.includes('syntaxerror')) {
      return `❌ Python SyntaxError: ${errorMessage}

📝 WHAT THIS MEANS:
There's a mistake in your Python syntax.

🔍 COMMON CAUSES:
1. Missing colon (:) after if, for, while, def
2. Incorrect indentation (Python is indent-sensitive!)
3. Missing parentheses in print() statements (Python 3)
4. Mixing tabs and spaces

✅ HOW TO FIX:
• Check for missing colons at end of statements
• Verify indentation is consistent (use spaces, not tabs)
• Make sure print statements have parentheses: print("hello")
• Check line ${lineNum} and surrounding lines

💡 EXAMPLE:
❌ Wrong:  if x > 5 print("hi")  // Missing : and newline
✅ Correct: if x > 5:
              print("hi")`;
    }
    
    if (msg.includes('indentationerror')) {
      return `❌ Python IndentationError: ${errorMessage}

📝 WHAT THIS MEANS:
Your code's indentation is incorrect. Python uses indentation to define code blocks!

🔍 COMMON CAUSES:
1. Mixing tabs and spaces
2. Inconsistent indentation levels
3. Missing indentation after if, for, while, def
4. Extra indentation where not needed

✅ HOW TO FIX:
• Use consistent indentation (4 spaces is standard)
• Don't mix tabs and spaces
• Indent code inside if, for, while, def blocks
• Check line ${lineNum} for indentation issues

💡 TIP: Configure your editor to show spaces/tabs and use spaces only`;
    }
  }
  
  // Generic error with basic explanation
  return `❌ Error: ${errorMessage} (Line ${lineNum})

📝 WHAT HAPPENED:
An error occurred while running your code.

🔍 THINGS TO CHECK:
• Review line ${lineNum} in your code
• Check for typos in variable and function names
• Verify all brackets, parentheses, and braces are matched
• Make sure variables are declared before use
• Check that functions are defined before calling them

✅ DEBUGGING TIPS:
• Add console.log() statements to track values
• Check the line number mentioned in the error
• Read the error message carefully - it often tells you what's wrong
• Look at lines before and after the error line

💡 TIP: Errors are normal! They help you learn and improve your code.`;
};

// Check if Electron API is available
export const isElectronAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).api;
};

// Check if file is a folder
export const isFolder = (file: any): boolean => {
  return file.isFolder ||
    file.path?.endsWith('/') ||
    file.path?.endsWith('\\') ||
    !file.name.includes('.');
};

// Build folder tree structure from flat file list
export const buildFolderTree = (files: FileItem[]): FileItem[] => {
  const fileMap = new Map<string, FileItem>();
  const rootFiles: FileItem[] = [];

  // First pass: create all file objects
  files.forEach(file => {
    fileMap.set(file.path, { ...file, children: [] });
  });

  // Second pass: build tree structure
  files.forEach(file => {
    const fileObj = fileMap.get(file.path);
    if (!fileObj) return;

    if (file.parentFolder) {
      const parent = fileMap.get(file.parentFolder);
      if (parent && parent.children) {
        parent.children.push(fileObj);
      }
    } else {
      rootFiles.push(fileObj);
    }
  });

  // Sort: folders first, then files, alphabetically
  const sortFiles = (a: FileItem, b: FileItem) => {
    const aIsFolder = isFolder(a);
    const bIsFolder = isFolder(b);

    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return a.name.localeCompare(b.name);
  };

  const sortTree = (items: FileItem[]): FileItem[] => {
    return items.sort(sortFiles).map(item => ({
      ...item,
      children: item.children ? sortTree(item.children) : []
    }));
  };

  return sortTree(rootFiles);
};

