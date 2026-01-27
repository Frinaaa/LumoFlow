export interface PuzzleFragment {
  id: string;
  content: string;
}

export interface PuzzleData {
  title: string;
  description: string;
  hint: string;
  fragments: PuzzleFragment[];
  correctOrderIds: string[];
}

// Shuffle array helper
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Base puzzle templates
const basePuzzles = [
  {
    title: "Hello World",
    description: "Arrange the code fragments to print 'Hello World' to the console.",
    hint: "Start with the function declaration, then the console.log statement.",
    fragments: [
      { id: "a1", content: "function greet() {" },
      { id: "a2", content: "  console.log('Hello World');" },
      { id: "a3", content: "}" }
    ]
  },
  {
    title: "Variable Declaration",
    description: "Arrange the code to declare a variable and assign it a value.",
    hint: "Use const or let, then assign the value.",
    fragments: [
      { id: "b1", content: "const message = 'Learning JavaScript';" },
      { id: "b2", content: "console.log(message);" }
    ]
  },
  {
    title: "Simple Loop",
    description: "Create a for loop that counts from 0 to 4.",
    hint: "for loop syntax: for(init; condition; increment)",
    fragments: [
      { id: "c1", content: "for (let i = 0; i < 5; i++) {" },
      { id: "c2", content: "  console.log(i);" },
      { id: "c3", content: "}" }
    ]
  },
  {
    title: "Array Sum",
    description: "Write code to sum all numbers in an array.",
    hint: "Use reduce or a loop to accumulate the sum.",
    fragments: [
      { id: "d1", content: "const numbers = [1, 2, 3, 4, 5];" },
      { id: "d2", content: "const sum = numbers.reduce((a, b) => a + b, 0);" },
      { id: "d3", content: "console.log(sum);" }
    ]
  },
  {
    title: "Conditional Logic",
    description: "Check if a number is even or odd.",
    hint: "Use the modulo operator (%) to check divisibility.",
    fragments: [
      { id: "e1", content: "const num = 7;" },
      { id: "e2", content: "if (num % 2 === 0) {" },
      { id: "e3", content: "  console.log('Even');" },
      { id: "e4", content: "} else {" },
      { id: "e5", content: "  console.log('Odd');" },
      { id: "e6", content: "}" }
    ]
  },
  {
    title: "Function with Return",
    description: "Create a function that returns the square of a number.",
    hint: "Define function, calculate square, return result.",
    fragments: [
      { id: "f1", content: "function square(x) {" },
      { id: "f2", content: "  return x * x;" },
      { id: "f3", content: "}" },
      { id: "f4", content: "console.log(square(5));" }
    ]
  },
  {
    title: "Array Filter",
    description: "Filter an array to get only numbers greater than 10.",
    hint: "Use the filter method with a comparison.",
    fragments: [
      { id: "g1", content: "const nums = [5, 12, 8, 15, 3];" },
      { id: "g2", content: "const filtered = nums.filter(n => n > 10);" },
      { id: "g3", content: "console.log(filtered);" }
    ]
  },
  {
    title: "Object Creation",
    description: "Create an object with properties and log it.",
    hint: "Use object literal syntax with key-value pairs.",
    fragments: [
      { id: "h1", content: "const person = {" },
      { id: "h2", content: "  name: 'Alice'," },
      { id: "h3", content: "  age: 25" },
      { id: "h4", content: "};" },
      { id: "h5", content: "console.log(person.name);" }
    ]
  },
  {
    title: "While Loop",
    description: "Create a while loop that counts down from 5 to 1.",
    hint: "Initialize counter, check condition, decrement inside loop.",
    fragments: [
      { id: "i1", content: "let count = 5;" },
      { id: "i2", content: "while (count > 0) {" },
      { id: "i3", content: "  console.log(count);" },
      { id: "i4", content: "  count--;" },
      { id: "i5", content: "}" }
    ]
  },
  {
    title: "Array Map",
    description: "Double each number in an array using map.",
    hint: "Use map to transform each element.",
    fragments: [
      { id: "j1", content: "const values = [1, 2, 3, 4];" },
      { id: "j2", content: "const doubled = values.map(v => v * 2);" },
      { id: "j3", content: "console.log(doubled);" }
    ]
  }
];

// Generate variations by modifying values
const generateVariations = (): PuzzleData[] => {
  const variations: PuzzleData[] = [];
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  const messages = ['Hello', 'Welcome', 'Greetings', 'Hi there', 'Good day'];
  const numbers = [3, 5, 7, 10, 15, 20, 25, 30];
  
  // Generate 1000+ variations
  for (let i = 0; i < 100; i++) {
    basePuzzles.forEach((base, idx) => {
      const variantNum = i * basePuzzles.length + idx + 1;
      
      // Clone and modify fragments based on puzzle type
      let modifiedFragments = base.fragments.map(f => ({
        id: `${f.id}_v${variantNum}`,
        content: f.content
      }));

      // Apply variations based on puzzle type
      if (base.title === "Hello World") {
        const msg = messages[i % messages.length];
        modifiedFragments = modifiedFragments.map(f => ({
          ...f,
          content: f.content.replace('Hello World', msg)
        }));
      } else if (base.title === "Variable Declaration") {
        const msg = messages[i % messages.length];
        modifiedFragments = modifiedFragments.map(f => ({
          ...f,
          content: f.content.replace('Learning JavaScript', msg)
        }));
      } else if (base.title === "Simple Loop") {
        const num = numbers[i % numbers.length];
        modifiedFragments = modifiedFragments.map(f => ({
          ...f,
          content: f.content.replace('5', String(num)).replace('4', String(num - 1))
        }));
      } else if (base.title === "Conditional Logic") {
        const num = numbers[i % numbers.length];
        modifiedFragments = modifiedFragments.map(f => ({
          ...f,
          content: f.content.replace('7', String(num))
        }));
      } else if (base.title === "Object Creation") {
        const name = names[i % names.length];
        const age = 20 + (i % 30);
        modifiedFragments = modifiedFragments.map(f => ({
          ...f,
          content: f.content.replace('Alice', name).replace('25', String(age))
        }));
      } else if (base.title === "While Loop") {
        const num = numbers[i % numbers.length];
        modifiedFragments = modifiedFragments.map(f => ({
          ...f,
          content: f.content.replace('5', String(num))
        }));
      }

      // Store correct order before shuffling
      const correctOrderIds = modifiedFragments.map(f => f.id);
      
      // Shuffle the fragments
      const shuffledFragments = shuffleArray(modifiedFragments);

      variations.push({
        title: `${base.title} #${variantNum}`,
        description: base.description,
        hint: base.hint,
        fragments: shuffledFragments,
        correctOrderIds: correctOrderIds
      });
    });
  }

  return variations;
};

// Generate all puzzles and shuffle
let allPuzzles = shuffleArray(generateVariations());
let sessionStartIndex = 0;

// Function to reshuffle puzzles (call this when starting a new game)
export const reshufflePuzzles = (): void => {
  allPuzzles = shuffleArray(generateVariations());
  // Start from a random position in the shuffled array
  sessionStartIndex = Math.floor(Math.random() * allPuzzles.length);
};

export const getNextPuzzle = (level: number): PuzzleData => {
  // Use session start index to ensure different starting point each time
  const index = (sessionStartIndex + level - 1) % allPuzzles.length;
  return allPuzzles[index];
};

// Export total count for reference
export const getTotalPuzzles = (): number => allPuzzles.length;
