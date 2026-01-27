export interface PredictChallenge {
  id: number;
  title: string;
  description: string;
  code: string;
  options: string[];
  correctAnswer: string;
  correctIndex: number;
  explanation: string;
}

const baseChallenges: Omit<PredictChallenge, 'id' | 'correctIndex'>[] = [
  {
    title: "Console Output",
    description: "What will this code output?",
    code: "console.log(2 + 2);",
    options: ["2", "4", "22", "undefined"],
    correctAnswer: "4",
    explanation: "2 + 2 equals 4"
  },
  {
    title: "String Concatenation",
    description: "What will this code output?",
    code: "console.log('Hello' + ' ' + 'World');",
    options: ["Hello World", "HelloWorld", "Hello + World", "undefined"],
    correctAnswer: "Hello World",
    explanation: "The + operator concatenates strings with spaces"
  },
  {
    title: "Array Length",
    description: "What will this code output?",
    code: "const arr = [1, 2, 3];\nconsole.log(arr.length);",
    options: ["0", "2", "3", "undefined"],
    correctAnswer: "3",
    explanation: "The array has 3 elements"
  },
  {
    title: "Type Coercion",
    description: "What will this code output?",
    code: "console.log('5' + 3);",
    options: ["8", "53", "5 3", "NaN"],
    correctAnswer: "53",
    explanation: "String concatenation converts number to string"
  },
  {
    title: "Boolean Logic",
    description: "What will this code output?",
    code: "console.log(true && false);",
    options: ["true", "false", "undefined", "null"],
    correctAnswer: "false",
    explanation: "AND operator returns false if any operand is false"
  },
  {
    title: "Array Push",
    description: "What will this code output?",
    code: "const arr = [1, 2];\nconsole.log(arr.push(3));",
    options: ["[1, 2, 3]", "3", "2", "undefined"],
    correctAnswer: "3",
    explanation: "push() returns the new length of the array"
  },
  {
    title: "Array Pop",
    description: "What will this code output?",
    code: "const arr = [1, 2, 3];\nconsole.log(arr.pop());",
    options: ["[1, 2]", "3", "2", "undefined"],
    correctAnswer: "3",
    explanation: "pop() returns the removed element"
  },
  {
    title: "Typeof Null",
    description: "What will this code output?",
    code: "console.log(typeof null);",
    options: ["null", "object", "undefined", "number"],
    correctAnswer: "object",
    explanation: "typeof null returns 'object' due to a JavaScript quirk"
  },
  {
    title: "Typeof Array",
    description: "What will this code output?",
    code: "console.log(typeof [1, 2, 3]);",
    options: ["array", "object", "list", "undefined"],
    correctAnswer: "object",
    explanation: "Arrays are objects in JavaScript"
  },
  {
    title: "String to Number",
    description: "What will this code output?",
    code: "console.log('5' - 2);",
    options: ["52", "3", "NaN", "Error"],
    correctAnswer: "3",
    explanation: "Subtraction coerces string to number"
  },
  {
    title: "NaN Check",
    description: "What will this code output?",
    code: "console.log(NaN === NaN);",
    options: ["true", "false", "NaN", "undefined"],
    correctAnswer: "false",
    explanation: "NaN is not equal to itself"
  },
  {
    title: "Undefined Variable",
    description: "What will this code output?",
    code: "let x;\nconsole.log(x);",
    options: ["null", "undefined", "0", "Error"],
    correctAnswer: "undefined",
    explanation: "Uninitialized variables are undefined"
  },
  {
    title: "String Length",
    description: "What will this code output?",
    code: "console.log('Hello'.length);",
    options: ["4", "5", "6", "undefined"],
    correctAnswer: "5",
    explanation: "String length counts all characters"
  },
  {
    title: "Array Index",
    description: "What will this code output?",
    code: "const arr = [10, 20, 30];\nconsole.log(arr[1]);",
    options: ["10", "20", "30", "undefined"],
    correctAnswer: "20",
    explanation: "Array indices start at 0"
  },
  {
    title: "Boolean OR",
    description: "What will this code output?",
    code: "console.log(false || true);",
    options: ["true", "false", "undefined", "null"],
    correctAnswer: "true",
    explanation: "OR returns true if any operand is true"
  },
  {
    title: "String Multiplication",
    description: "What will this code output?",
    code: "console.log('3' * 2);",
    options: ["32", "6", "NaN", "Error"],
    correctAnswer: "6",
    explanation: "Multiplication coerces string to number"
  },
  {
    title: "Array Shift",
    description: "What will this code output?",
    code: "const arr = [1, 2, 3];\nconsole.log(arr.shift());",
    options: ["[2, 3]", "1", "3", "undefined"],
    correctAnswer: "1",
    explanation: "shift() removes and returns the first element"
  },
  {
    title: "Array Unshift",
    description: "What will this code output?",
    code: "const arr = [2, 3];\nconsole.log(arr.unshift(1));",
    options: ["[1, 2, 3]", "3", "1", "undefined"],
    correctAnswer: "3",
    explanation: "unshift() returns the new array length"
  },
  {
    title: "String Comparison",
    description: "What will this code output?",
    code: "console.log('10' > '9');",
    options: ["true", "false", "undefined", "Error"],
    correctAnswer: "false",
    explanation: "String comparison is lexicographic"
  },
  {
    title: "Loose Equality",
    description: "What will this code output?",
    code: "console.log(0 == false);",
    options: ["true", "false", "undefined", "null"],
    correctAnswer: "true",
    explanation: "Loose equality coerces types"
  },
  {
    title: "Strict Equality",
    description: "What will this code output?",
    code: "console.log(0 === false);",
    options: ["true", "false", "undefined", "null"],
    correctAnswer: "false",
    explanation: "Strict equality checks type and value"
  }
];

function generateChallenges(): PredictChallenge[] {
  const challenges: PredictChallenge[] = [];
  const nums = [2, 3, 5, 7, 10, 15, 20, 25, 30, 42];
  const strings = ['Hello', 'World', 'Code', 'Test', 'Data'];
  
  // Generate 50+ variations for each base challenge
  for (let i = 0; i < 50; i++) {
    baseChallenges.forEach((challenge, idx) => {
      const id = i * baseChallenges.length + idx + 1;
      let code = challenge.code;
      let correctAnswer = challenge.correctAnswer;
      let options = [...challenge.options];
      
      const num = nums[i % nums.length];
      const str = strings[i % strings.length];
      
      // Customize based on challenge type
      if (challenge.title === "Console Output") {
        code = code.replace(/2/g, String(num));
        correctAnswer = String(num + num);
        options = [String(num), String(num + num), String(num) + String(num), "undefined"];
      } else if (challenge.title === "String Concatenation") {
        code = `console.log('${str}' + ' ' + 'World');`;
        correctAnswer = `${str} World`;
        options = [`${str} World`, `${str}World`, `${str} + World`, "undefined"];
      } else if (challenge.title === "Array Length") {
        const len = (i % 5) + 2;
        const arrStr = Array.from({length: len}, (_, i) => i + 1).join(', ');
        code = `const arr = [${arrStr}];\nconsole.log(arr.length);`;
        correctAnswer = String(len);
        options = [String(len - 1), String(len), String(len + 1), "undefined"];
      } else if (challenge.title === "Type Coercion") {
        code = `console.log('${num}' + ${num});`;
        correctAnswer = `${num}${num}`;
        options = [String(num * 2), `${num}${num}`, `${num} ${num}`, "NaN"];
      } else if (challenge.title === "Array Push") {
        const newVal = num + 2;
        code = `const arr = [${num}, ${num + 1}];\nconsole.log(arr.push(${newVal}));`;
        correctAnswer = "3";
        options = [`[${num}, ${num + 1}, ${newVal}]`, "3", "2", "undefined"];
      } else if (challenge.title === "Array Pop") {
        code = `const arr = [${num}, ${num + 1}, ${num + 2}];\nconsole.log(arr.pop());`;
        correctAnswer = String(num + 2);
        options = [`[${num}, ${num + 1}]`, String(num + 2), String(num + 1), "undefined"];
      } else if (challenge.title === "String to Number") {
        code = `console.log('${num}' - ${num - 2});`;
        correctAnswer = String(2);
        options = [`${num}${num - 2}`, String(2), "NaN", "Error"];
      } else if (challenge.title === "String Length") {
        code = `console.log('${str}'.length);`;
        correctAnswer = String(str.length);
        options = [String(str.length - 1), String(str.length), String(str.length + 1), "undefined"];
      } else if (challenge.title === "Array Index") {
        code = `const arr = [${num}, ${num + 10}, ${num + 20}];\nconsole.log(arr[1]);`;
        correctAnswer = String(num + 10);
        options = [String(num), String(num + 10), String(num + 20), "undefined"];
      } else if (challenge.title === "String Multiplication") {
        code = `console.log('${num}' * 2);`;
        correctAnswer = String(num * 2);
        options = [`${num}2`, String(num * 2), "NaN", "Error"];
      } else if (challenge.title === "Array Shift") {
        code = `const arr = [${num}, ${num + 1}, ${num + 2}];\nconsole.log(arr.shift());`;
        correctAnswer = String(num);
        options = [`[${num + 1}, ${num + 2}]`, String(num), String(num + 2), "undefined"];
      } else if (challenge.title === "Array Unshift") {
        code = `const arr = [${num + 1}, ${num + 2}];\nconsole.log(arr.unshift(${num}));`;
        correctAnswer = "3";
        options = [`[${num}, ${num + 1}, ${num + 2}]`, "3", String(num), "undefined"];
      }
      
      // Shuffle options for variety
      const shuffledOptions = shuffleArray(options);
      const correctIndex = shuffledOptions.indexOf(correctAnswer);
      
      challenges.push({
        id,
        title: `${challenge.title} #${id}`,
        description: challenge.description,
        code,
        options: shuffledOptions,
        correctAnswer,
        correctIndex,
        explanation: challenge.explanation
      });
    });
  }
  
  return challenges;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

let allChallenges = shuffleArray(generateChallenges());
let sessionStartIndex = 0;

export function reshuffleChallenges(): void {
  allChallenges = shuffleArray(generateChallenges());
  sessionStartIndex = Math.floor(Math.random() * allChallenges.length);
}

export function getNextChallenge(level: number): PredictChallenge {
  const index = (sessionStartIndex + level - 1) % allChallenges.length;
  return allChallenges[index];
}

export function getTotalChallenges(): number {
  return allChallenges.length;
}
