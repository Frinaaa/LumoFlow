export interface BugLevel {
  id: number;
  title: string;
  description: string;
  buggyCode: string;
  fixedCode: string;
  hint: string;
  errorMessage: string;
  explanation: string;
}

// Base bug templates
const baseBugs: Omit<BugLevel, 'id'>[] = [
  {
    title: "Missing Semicolon",
    description: "Fix the syntax error",
    buggyCode: "function greet() {\n  console.log('Hello')\n  return true;\n}",
    fixedCode: "function greet() {\n  console.log('Hello');\n  return true;\n}",
    hint: "Add semicolon after console.log",
    errorMessage: "SyntaxError: Unexpected token",
    explanation: "JavaScript statements should end with semicolons"
  },
  {
    title: "Missing Bracket",
    description: "Fix the missing closing bracket",
    buggyCode: "function sum(a, b) {\n  return a + b;\n",
    fixedCode: "function sum(a, b) {\n  return a + b;\n}",
    hint: "Add closing curly brace",
    errorMessage: "SyntaxError: Unexpected end of input",
    explanation: "Every opening bracket needs a closing bracket"
  },
  {
    title: "Wrong Operator",
    description: "Fix the comparison operator",
    buggyCode: "function isEven(num) {\n  if (num % 2 = 0) {\n    return true;\n  }\n  return false;\n}",
    fixedCode: "function isEven(num) {\n  if (num % 2 === 0) {\n    return true;\n  }\n  return false;\n}",
    hint: "Use === for comparison",
    errorMessage: "SyntaxError: Invalid assignment",
    explanation: "Use === for comparison, not = (assignment)"
  },
  {
    title: "Undefined Variable",
    description: "Fix the reference error",
    buggyCode: "function calc() {\n  let result = x + 5;\n  return result;\n}",
    fixedCode: "function calc() {\n  let x = 10;\n  let result = x + 5;\n  return result;\n}",
    hint: "Declare variable x",
    errorMessage: "ReferenceError: x is not defined",
    explanation: "Variables must be declared before use"
  },
  {
    title: "Array Index",
    description: "Fix the array indexing",
    buggyCode: "const arr = [1, 2, 3];\nconst first = arr[1];",
    fixedCode: "const arr = [1, 2, 3];\nconst first = arr[0];",
    hint: "Arrays start at index 0",
    errorMessage: "Logic Error: Wrong value",
    explanation: "JavaScript arrays are zero-indexed"
  },
  {
    title: "Infinite Loop",
    description: "Fix the loop",
    buggyCode: "let i = 0;\nwhile (i < 5) {\n  console.log(i);\n}",
    fixedCode: "let i = 0;\nwhile (i < 5) {\n  console.log(i);\n  i++;\n}",
    hint: "Increment the counter",
    errorMessage: "Warning: Infinite loop",
    explanation: "Loop counter must be incremented"
  },
  {
    title: "Type Error",
    description: "Fix the method call",
    buggyCode: "function double(num) {\n  return num.toUpperCase();\n}",
    fixedCode: "function double(num) {\n  return num * 2;\n}",
    hint: "toUpperCase is for strings",
    errorMessage: "TypeError: Not a function",
    explanation: "toUpperCase() only works on strings"
  },
  {
    title: "Missing Parameter",
    description: "Fix the function call",
    buggyCode: "function add(a, b) {\n  return a + b;\n}\nconst result = add(5);",
    fixedCode: "function add(a, b) {\n  return a + b;\n}\nconst result = add(5, 3);",
    hint: "Function needs 2 parameters",
    errorMessage: "Logic Error: NaN",
    explanation: "Missing parameters become undefined"
  },
  {
    title: "String Concatenation",
    description: "Fix the string operation",
    buggyCode: "const age = 25;\nconst msg = 'Age: ' - age;",
    fixedCode: "const age = 25;\nconst msg = 'Age: ' + age;",
    hint: "Use + for concatenation",
    errorMessage: "Logic Error: NaN",
    explanation: "Use + to concatenate strings"
  },
  {
    title: "Missing Return",
    description: "Add return statement",
    buggyCode: "function multiply(a, b) {\n  const result = a * b;\n}",
    fixedCode: "function multiply(a, b) {\n  const result = a * b;\n  return result;\n}",
    hint: "Add return statement",
    errorMessage: "Logic Error: undefined",
    explanation: "Functions need return statements"
  }
];

// Generate 1000+ variations
function generateBugs(): BugLevel[] {
  const bugs: BugLevel[] = [];
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  const nums = [3, 5, 7, 10, 15, 20, 25, 30];
  const vars = ['x', 'y', 'value', 'data', 'count', 'total'];
  
  // Generate 100 variations of each base bug (10 × 100 = 1000)
  for (let i = 0; i < 100; i++) {
    baseBugs.forEach((bug, idx) => {
      const id = i * baseBugs.length + idx + 1;
      let buggy = bug.buggyCode;
      let fixed = bug.fixedCode;
      
      // Apply variations
      const name = names[i % names.length];
      const num = nums[i % nums.length];
      const varName = vars[i % vars.length];
      
      buggy = buggy.replace(/Alice|Bob/g, name);
      fixed = fixed.replace(/Alice|Bob/g, name);
      buggy = buggy.replace(/\b5\b/g, String(num));
      fixed = fixed.replace(/\b5\b/g, String(num));
      buggy = buggy.replace(/\b10\b/g, String(num * 2));
      fixed = fixed.replace(/\b10\b/g, String(num * 2));
      
      if (i % 3 === 0) {
        buggy = buggy.replace(/\bx\b/g, varName);
        fixed = fixed.replace(/\bx\b/g, varName);
      }
      
      bugs.push({
        id,
        title: `${bug.title} #${id}`,
        description: bug.description,
        buggyCode: buggy,
        fixedCode: fixed,
        hint: bug.hint,
        errorMessage: bug.errorMessage,
        explanation: bug.explanation
      });
    });
  }
  
  return bugs;
}

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate and shuffle bugs once per session
let allBugs = shuffleArray(generateBugs());
let sessionStartIndex = 0;

// Function to reshuffle bugs (call this when starting a new game)
export function reshuffleBugs(): void {
  allBugs = shuffleArray(generateBugs());
  // Start from a random position in the shuffled array
  sessionStartIndex = Math.floor(Math.random() * allBugs.length);
}

export function getNextBug(level: number): BugLevel {
  // Use session start index to ensure different starting point each time
  const index = (sessionStartIndex + level - 1) % allBugs.length;
  return allBugs[index];
}

export function getTotalBugs(): number {
  return allBugs.length;
}
