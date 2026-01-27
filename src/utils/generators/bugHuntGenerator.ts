export interface BugHuntLevel {
  id: number;
  filename: string;
  missionTitle: string;
  missionDesc: string;
  goal: string;
  hint: string;
  lines: {
    text: string;
    indent: number;
    isBug: boolean;
  }[];
}

const baseLevels: Omit<BugHuntLevel, 'id'>[] = [
  {
    filename: "app.js",
    missionTitle: "Missing Semicolon",
    missionDesc: "A semicolon is missing, causing unexpected behavior.",
    goal: "Find the line with the missing semicolon",
    hint: "Check variable declarations",
    lines: [
      { text: "function calculate() {", indent: 0, isBug: false },
      { text: "let x = 10", indent: 1, isBug: true },
      { text: "let y = 20;", indent: 1, isBug: false },
      { text: "return x + y;", indent: 1, isBug: false },
      { text: "}", indent: 0, isBug: false }
    ]
  },
  {
    filename: "utils.js",
    missionTitle: "Undefined Variable",
    missionDesc: "A variable is used before being declared.",
    goal: "Find the undefined variable usage",
    hint: "Look for variables used before declaration",
    lines: [
      { text: "function process() {", indent: 0, isBug: false },
      { text: "console.log(result);", indent: 1, isBug: true },
      { text: "let result = 42;", indent: 1, isBug: false },
      { text: "return result;", indent: 1, isBug: false },
      { text: "}", indent: 0, isBug: false }
    ]
  },
  {
    filename: "data.js",
    missionTitle: "Wrong Comparison",
    missionDesc: "Using assignment instead of comparison.",
    goal: "Find the incorrect operator",
    hint: "Check the if condition",
    lines: [
      { text: "function check(val) {", indent: 0, isBug: false },
      { text: "if (val = 10) {", indent: 1, isBug: true },
      { text: "return true;", indent: 2, isBug: false },
      { text: "}", indent: 1, isBug: false },
      { text: "return false;", indent: 1, isBug: false },
      { text: "}", indent: 0, isBug: false }
    ]
  },
  {
    filename: "array.js",
    missionTitle: "Array Index Error",
    missionDesc: "Accessing array with wrong index.",
    goal: "Find the incorrect array access",
    hint: "Arrays are zero-indexed",
    lines: [
      { text: "const items = [1, 2, 3];", indent: 0, isBug: false },
      { text: "console.log(items[3]);", indent: 0, isBug: true },
      { text: "console.log(items[0]);", indent: 0, isBug: false }
    ]
  },
  {
    filename: "loop.js",
    missionTitle: "Infinite Loop",
    missionDesc: "Loop counter is not incrementing.",
    goal: "Find the missing increment",
    hint: "Check the loop counter update",
    lines: [
      { text: "let i = 0;", indent: 0, isBug: false },
      { text: "while (i < 10) {", indent: 0, isBug: false },
      { text: "console.log(i);", indent: 1, isBug: true },
      { text: "}", indent: 0, isBug: false }
    ]
  },
  {
    filename: "string.js",
    missionTitle: "String Concatenation Bug",
    missionDesc: "Missing + operator in string concatenation.",
    goal: "Find the concatenation error",
    hint: "Check how strings are joined",
    lines: [
      { text: "let name = 'John';", indent: 0, isBug: false },
      { text: "let greeting = 'Hello' name;", indent: 0, isBug: true },
      { text: "console.log(greeting);", indent: 0, isBug: false }
    ]
  },
  {
    filename: "object.js",
    missionTitle: "Missing Property",
    missionDesc: "Accessing undefined object property.",
    goal: "Find the typo in property name",
    hint: "Check property spelling",
    lines: [
      { text: "const user = { name: 'Alice', age: 25 };", indent: 0, isBug: false },
      { text: "console.log(user.nmae);", indent: 0, isBug: true },
      { text: "console.log(user.age);", indent: 0, isBug: false }
    ]
  },
  {
    filename: "function.js",
    missionTitle: "Missing Return",
    missionDesc: "Function doesn't return a value.",
    goal: "Find the missing return statement",
    hint: "Check what the function should return",
    lines: [
      { text: "function add(a, b) {", indent: 0, isBug: false },
      { text: "let sum = a + b;", indent: 1, isBug: true },
      { text: "}", indent: 0, isBug: false },
      { text: "console.log(add(5, 3));", indent: 0, isBug: false }
    ]
  },
  {
    filename: "condition.js",
    missionTitle: "Wrong Logical Operator",
    missionDesc: "Using OR instead of AND.",
    goal: "Find the incorrect logical operator",
    hint: "Check the condition logic",
    lines: [
      { text: "function isValid(x, y) {", indent: 0, isBug: false },
      { text: "if (x > 0 || y > 0) {", indent: 1, isBug: true },
      { text: "return true;", indent: 2, isBug: false },
      { text: "}", indent: 1, isBug: false },
      { text: "return false;", indent: 1, isBug: false },
      { text: "}", indent: 0, isBug: false }
    ]
  },
  {
    filename: "parse.js",
    missionTitle: "Type Coercion Bug",
    missionDesc: "String not converted to number.",
    goal: "Find where parseInt is missing",
    hint: "Check type conversions",
    lines: [
      { text: "let input = '42';", indent: 0, isBug: false },
      { text: "let result = input + 10;", indent: 0, isBug: true },
      { text: "console.log(result);", indent: 0, isBug: false }
    ]
  },
  {
    filename: "callback.js",
    missionTitle: "Missing Callback",
    missionDesc: "Function called without required callback.",
    goal: "Find the missing callback parameter",
    hint: "Check function parameters",
    lines: [
      { text: "function fetchData(url, callback) {", indent: 0, isBug: false },
      { text: "callback(data);", indent: 1, isBug: false },
      { text: "}", indent: 0, isBug: false },
      { text: "fetchData('api.com');", indent: 0, isBug: true }
    ]
  },
  {
    filename: "scope.js",
    missionTitle: "Variable Scope Error",
    missionDesc: "Variable accessed outside its scope.",
    goal: "Find the scope violation",
    hint: "Check where variables are declared",
    lines: [
      { text: "function test() {", indent: 0, isBug: false },
      { text: "if (true) {", indent: 1, isBug: false },
      { text: "let temp = 5;", indent: 2, isBug: false },
      { text: "}", indent: 1, isBug: false },
      { text: "console.log(temp);", indent: 1, isBug: true },
      { text: "}", indent: 0, isBug: false }
    ]
  },
  {
    filename: "null.js",
    missionTitle: "Null Reference",
    missionDesc: "Accessing property of null object.",
    goal: "Find the null check missing",
    hint: "Check for null before accessing",
    lines: [
      { text: "let obj = null;", indent: 0, isBug: false },
      { text: "console.log(obj.name);", indent: 0, isBug: true }
    ]
  },
  {
    filename: "async.js",
    missionTitle: "Missing Await",
    missionDesc: "Async function called without await.",
    goal: "Find where await is missing",
    hint: "Check async function calls",
    lines: [
      { text: "async function getData() {", indent: 0, isBug: false },
      { text: "return fetch('api.com');", indent: 1, isBug: false },
      { text: "}", indent: 0, isBug: false },
      { text: "let data = getData();", indent: 0, isBug: true },
      { text: "console.log(data);", indent: 0, isBug: false }
    ]
  },
  {
    filename: "closure.js",
    missionTitle: "Closure Bug",
    missionDesc: "Variable captured incorrectly in closure.",
    goal: "Find the closure issue",
    hint: "Check loop variable capture",
    lines: [
      { text: "for (var i = 0; i < 3; i++) {", indent: 0, isBug: true },
      { text: "setTimeout(() => console.log(i), 100);", indent: 1, isBug: false },
      { text: "}", indent: 0, isBug: false }
    ]
  },
  {
    filename: "equality.js",
    missionTitle: "Strict Equality Missing",
    missionDesc: "Using == instead of ===.",
    goal: "Find the loose equality",
    hint: "Check comparison operators",
    lines: [
      { text: "function compare(a, b) {", indent: 0, isBug: false },
      { text: "if (a == b) {", indent: 1, isBug: true },
      { text: "return true;", indent: 2, isBug: false },
      { text: "}", indent: 1, isBug: false },
      { text: "return false;", indent: 1, isBug: false },
      { text: "}", indent: 0, isBug: false }
    ]
  },
  {
    filename: "default.js",
    missionTitle: "Missing Default Case",
    missionDesc: "Switch statement without default.",
    goal: "Find the missing default case",
    hint: "Check switch statement completeness",
    lines: [
      { text: "switch (value) {", indent: 0, isBug: false },
      { text: "case 1:", indent: 1, isBug: false },
      { text: "console.log('one');", indent: 2, isBug: false },
      { text: "break;", indent: 2, isBug: false },
      { text: "}", indent: 0, isBug: true }
    ]
  },
  {
    filename: "mutation.js",
    missionTitle: "Const Reassignment",
    missionDesc: "Trying to reassign a const variable.",
    goal: "Find the const violation",
    hint: "Check const declarations",
    lines: [
      { text: "const MAX = 100;", indent: 0, isBug: false },
      { text: "MAX = 200;", indent: 0, isBug: true },
      { text: "console.log(MAX);", indent: 0, isBug: false }
    ]
  },
  {
    filename: "json.js",
    missionTitle: "JSON Parse Error",
    missionDesc: "Invalid JSON string.",
    goal: "Find the JSON syntax error",
    hint: "Check JSON string format",
    lines: [
      { text: "let json = \"{'name': 'John'}\";", indent: 0, isBug: true },
      { text: "let obj = JSON.parse(json);", indent: 0, isBug: false },
      { text: "console.log(obj);", indent: 0, isBug: false }
    ]
  },
  {
    filename: "event.js",
    missionTitle: "Event Listener Leak",
    missionDesc: "Event listener not removed.",
    goal: "Find the missing removeEventListener",
    hint: "Check cleanup code",
    lines: [
      { text: "function setup() {", indent: 0, isBug: false },
      { text: "button.addEventListener('click', handler);", indent: 1, isBug: false },
      { text: "}", indent: 0, isBug: false },
      { text: "function cleanup() {", indent: 0, isBug: false },
      { text: "// Missing cleanup", indent: 1, isBug: true },
      { text: "}", indent: 0, isBug: false }
    ]
  }
];

function generateLevels(): BugHuntLevel[] {
  const levels: BugHuntLevel[] = [];
  const varNames = ['data', 'value', 'item', 'result', 'temp', 'count', 'total', 'sum'];
  const funcNames = ['process', 'calculate', 'validate', 'transform', 'filter', 'map'];
  
  // Generate 50+ variations for each base level
  for (let i = 0; i < 50; i++) {
    baseLevels.forEach((level, idx) => {
      const id = i * baseLevels.length + idx + 1;
      const varName = varNames[i % varNames.length];
      const funcName = funcNames[i % funcNames.length];
      
      // Create variations by replacing variable/function names
      const modifiedLines = level.lines.map(line => ({
        ...line,
        text: line.text
          .replace(/result/g, varName)
          .replace(/process/g, funcName)
          .replace(/calculate/g, funcName)
          .replace(/\d+/g, (match) => String(parseInt(match) + i))
      }));
      
      levels.push({
        id,
        filename: `${funcName}_${i}.js`,
        missionTitle: `${level.missionTitle} #${id}`,
        missionDesc: level.missionDesc,
        goal: level.goal,
        hint: level.hint,
        lines: modifiedLines
      });
    });
  }
  
  return levels;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

let allLevels = shuffleArray(generateLevels());
let sessionStartIndex = 0;

export function reshuffleLevels(): void {
  allLevels = shuffleArray(generateLevels());
  sessionStartIndex = Math.floor(Math.random() * allLevels.length);
}

export function getNextBugLevel(level: number): BugHuntLevel {
  const index = (sessionStartIndex + level - 1) % allLevels.length;
  return allLevels[index];
}

export function getTotalLevels(): number {
  return allLevels.length;
}
