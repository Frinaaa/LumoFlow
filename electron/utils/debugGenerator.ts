// src/utils/debugGenerator.ts

// 1. Data Banks
const VARS = ['userData', 'config', 'payload', 'session', 'cache', 'metrics', 'input', 'response'];
const FUNCS = ['validate', 'process', 'compute', 'parse', 'fetch', 'sync', 'render', 'init'];
const PROPS = ['isActive', 'isValid', 'hasAccess', 'isVerified', 'isVisible', 'canEdit'];

// 2. Helper
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// 3. Interface (Strictly typed)
export interface BugLevel {
  id: number;
  filename: string;
  initialCode: string;
  correctCode: string;
  description: string;
  validate: (userCode: string) => boolean; 
}

// --- GENERATOR FUNCTIONS ---

const genAssignmentBug = (level: number): BugLevel => {
  const v = pick(VARS);
  const p = pick(PROPS);
  return {
    id: level,
    filename: `auth_v${level}.js`,
    initialCode: `function check(${v}) {\n    if (${v}.${p} = false) {\n        return false;\n    }\n    return true;\n}`,
    correctCode: `function check(${v}) {\n    if (${v}.${p} === false) {\n        return false;\n    }\n    return true;\n}`,
    description: "Logic Error: Assignment (=) used inside condition instead of comparison (===).",
    validate: (c) => (c.includes('===') || c.includes('==')) && !c.includes(`if (${v}.${p} = false)`)
  };
};

const genSyntaxBug = (level: number): BugLevel => {
  const f = pick(FUNCS);
  return {
    id: level,
    filename: `syntax_v${level}.js`,
    initialCode: `function ${f}Data(data) {\n    if (data) {\n        console.log("Processing...");\n    \n    return true;\n}`,
    correctCode: `function ${f}Data(data) {\n    if (data) {\n        console.log("Processing...");\n    }\n    return true;\n}`,
    description: "Syntax Error: Unexpected end of input. A closing curly brace '}' is missing.",
    validate: (c) => (c.match(/}/g) || []).length >= 2
  };
};

const genLoopBug = (level: number): BugLevel => {
  const v = pick(VARS);
  return {
    id: level,
    filename: `loop_v${level}.js`,
    initialCode: `function loop(${v}) {\n    for (let i = 0; i <= ${v}.length; i++) {\n        console.log(${v}[i]);\n    }\n}`,
    correctCode: `function loop(${v}) {\n    for (let i = 0; i < ${v}.length; i++) {\n        console.log(${v}[i]);\n    }\n}`,
    description: "Index Error: Loop condition causes an 'undefined' error on the last iteration.",
    validate: (c) => c.includes(`< ${v}.length`) && !c.includes(`<=`)
  };
};

const genConstBug = (level: number): BugLevel => {
  const v = pick(VARS);
  return {
    id: level,
    filename: `state_v${level}.js`,
    initialCode: `function update() {\n    const ${v} = 10;\n    ${v} = ${v} + 1;\n    return ${v};\n}`,
    correctCode: `function update() {\n    let ${v} = 10;\n    ${v} = ${v} + 1;\n    return ${v};\n}`,
    description: "TypeError: Assignment to constant variable. Use 'let' instead.",
    validate: (c) => c.includes(`let ${v}`)
  };
};

// --- MAIN EXPORT ---
export const getNextBug = (level: number): BugLevel => {
  const generators = [genAssignmentBug, genSyntaxBug, genLoopBug, genConstBug];
  const randomGen = generators[Math.floor(Math.random() * generators.length)];
  const bug = randomGen(level);
  
  // Fail-safe to ensure we never return empty data
  if (!bug.initialCode) {
    return genAssignmentBug(level); 
  }
  return bug;
};