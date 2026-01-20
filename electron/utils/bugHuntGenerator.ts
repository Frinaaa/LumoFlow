// src/utils/bugHuntGenerator.ts

export interface CodeLine {
  text: string;
  isBug: boolean;
  indent: number;
}

export interface BugHuntLevel {
  id: number;
  filename: string;
  missionTitle: string;
  missionDesc: string;
  goal: string;
  hint: string;
  lines: CodeLine[];
}

const VARS = ['users', 'data', 'items', 'records', 'inventory', 'metrics'];
const ITERATORS = ['i', 'j', 'idx', 'k'];

// Helper to pick random item
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// --- TEMPLATES ---

// 1. Array Index Out of Bounds (Loop)
const genLoopBug = (level: number): BugHuntLevel => {
  const v = pick(VARS);
  const i = pick(ITERATORS);
  
  return {
    id: level,
    filename: `processor_${level}.js`,
    missionTitle: "Loop Overflow",
    missionDesc: "A rogue loop is accessing restricted memory sectors by iterating too far.",
    goal: "Identify the line causing the 'Index Out of Bounds' error.",
    hint: "Arrays are 0-indexed. Check the loop termination condition.",
    lines: [
      { indent: 0, text: `function process${v.charAt(0).toUpperCase() + v.slice(1)}(${v}) {`, isBug: false },
      { indent: 1, text: `let total = 0;`, isBug: false },
      { indent: 0, text: ``, isBug: false },
      { indent: 1, text: `// Iterate through all items`, isBug: false },
      { indent: 1, text: `for (let ${i} = 0; ${i} <= ${v}.length; ${i}++) {`, isBug: true }, // BUG
      { indent: 2, text: `if (${v}[${i}]) {`, isBug: false },
      { indent: 3, text: `total += ${v}[${i}].value;`, isBug: false },
      { indent: 2, text: `}`, isBug: false },
      { indent: 1, text: `}`, isBug: false },
      { indent: 1, text: `return total;`, isBug: false },
      { indent: 0, text: `}`, isBug: false },
    ]
  };
};

// 2. Assignment in Conditional
const genAssignmentBug = (level: number): BugHuntLevel => {
  return {
    id: level,
    filename: `auth_guard_${level}.js`,
    missionTitle: "Security Breach",
    missionDesc: "The firewall is letting everyone through regardless of their permissions.",
    goal: "Find the logic error in the permission check.",
    hint: "Using '=' assigns a value. Using '===' compares it.",
    lines: [
      { indent: 0, text: `function checkPermission(user) {`, isBug: false },
      { indent: 1, text: `const REQUIRED_LEVEL = 5;`, isBug: false },
      { indent: 0, text: ``, isBug: false },
      { indent: 1, text: `// Grant access if admin or high level`, isBug: false },
      { indent: 1, text: `if (user.isAdmin = true) {`, isBug: true }, // BUG
      { indent: 2, text: `return "ACCESS_GRANTED";`, isBug: false },
      { indent: 1, text: `}`, isBug: false },
      { indent: 0, text: ``, isBug: false },
      { indent: 1, text: `if (user.level >= REQUIRED_LEVEL) {`, isBug: false },
      { indent: 2, text: `return "ACCESS_GRANTED";`, isBug: false },
      { indent: 1, text: `}`, isBug: false },
      { indent: 1, text: `return "ACCESS_DENIED";`, isBug: false },
      { indent: 0, text: `}`, isBug: false },
    ]
  };
};

// 3. Const Reassignment
const genConstBug = (level: number): BugHuntLevel => {
  const v = pick(['counter', 'attempts', 'retries', 'score']);
  return {
    id: level,
    filename: `state_manager_${level}.js`,
    missionTitle: "State Lockdown",
    missionDesc: "The system crashes whenever it tries to update the tracking variable.",
    goal: "Identify the variable declaration causing a TypeError.",
    hint: "Variables declared with 'const' cannot be reassigned.",
    lines: [
      { indent: 0, text: `function update${v.charAt(0).toUpperCase() + v.slice(1)}() {`, isBug: false },
      { indent: 1, text: `const MAX_LIMIT = 100;`, isBug: false },
      { indent: 1, text: `const ${v} = 0;`, isBug: false },
      { indent: 0, text: ``, isBug: false },
      { indent: 1, text: `// Increment logic`, isBug: false },
      { indent: 1, text: `if (${v} < MAX_LIMIT) {`, isBug: false },
      { indent: 2, text: `${v} = ${v} + 1;`, isBug: true }, // BUG (Technically the bug is the declaration, but clicking the update logic is usually accepted)
      { indent: 1, text: `}`, isBug: false },
      { indent: 0, text: ``, isBug: false },
      { indent: 1, text: `return ${v};`, isBug: false },
      { indent: 0, text: `}`, isBug: false },
    ]
  };
};

// 4. Async Without Await
const genAsyncBug = (level: number): BugHuntLevel => {
  return {
    id: level,
    filename: `api_client_${level}.js`,
    missionTitle: "Empty Payload",
    missionDesc: "The data processing function is crashing because the data hasn't arrived yet.",
    goal: "Find where the Promise is not being handled correctly.",
    hint: "Network calls return Promises. You need to 'await' them.",
    lines: [
      { indent: 0, text: `async function fetchUserData(id) {`, isBug: false },
      { indent: 1, text: `try {`, isBug: false },
      { indent: 2, text: `const url = '/api/users/' + id;`, isBug: false },
      { indent: 0, text: ``, isBug: false },
      { indent: 2, text: `// Fetch from server`, isBug: false },
      { indent: 2, text: `const response = fetch(url);`, isBug: true }, // BUG
      { indent: 2, text: `const data = await response.json();`, isBug: false },
      { indent: 0, text: ``, isBug: false },
      { indent: 2, text: `return data;`, isBug: false },
      { indent: 1, text: `} catch (err) {`, isBug: false },
      { indent: 2, text: `console.error(err);`, isBug: false },
      { indent: 1, text: `}`, isBug: false },
      { indent: 0, text: `}`, isBug: false },
    ]
  };
};

// --- MAIN GENERATOR ---
export const getNextBugLevel = (level: number): BugHuntLevel => {
  const generators = [genLoopBug, genAssignmentBug, genConstBug, genAsyncBug];
  // Pick random based on level to ensure variety but consistency
  const index = (level - 1) % generators.length;
  // Or purely random: const index = Math.floor(Math.random() * generators.length);
  
  return generators[index](level);
};