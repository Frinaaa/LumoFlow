// src/utils/puzzleData.ts

// Dynamic Variable Names to make it feel infinite
export const VARIABLES = ['userData', 'config', 'items', 'nodes', 'response', 'payload', 'buffer', 'session', 'cache', 'metrics'];
export const FUNCTIONS = ['init', 'parse', 'fetch', 'render', 'compute', 'validate', 'sync', 'handle', 'format', 'load'];

// 20+ Real-world Logic Patterns
export const PATTERNS = [
  {
    type: "DOM",
    title: "Toggle Class",
    desc: "Select an element and toggle a CSS class on click.",
    hint: "Select element -> Add event listener -> Toggle classList.",
    template: `const btn = document.querySelector("#toggle");
btn.addEventListener("click", () => {
  const box = document.getElementById("box");
  box.classList.toggle("hidden");
});`
  },
  {
    type: "ALGO",
    title: "Filter & Map",
    desc: "Get names of active users from a list.",
    hint: "Chain .filter() then .map().",
    template: `const activeNames = users
  .filter(u => u.isActive)
  .map(u => u.name)
  .sort();
console.log(activeNames);`
  },
  {
    type: "ASYNC",
    title: "Async Fetch",
    desc: "Fetch data from an API safely.",
    hint: "Use try/catch blocks with await.",
    template: `async function loadData() {
  try {
    const res = await fetch("/api/data");
    const json = await res.json();
    return json;
  } catch (err) {
    console.error(err);
  }
}`
  },
  {
    type: "LOGIC",
    title: "Palindrome Check",
    desc: "Check if a string reads the same forwards and backwards.",
    hint: "Split, Reverse, Join, then Compare.",
    template: `function isPalindrome(str) {
  const clean = str.toLowerCase();
  const reversed = clean
    .split('')
    .reverse()
    .join('');
  return clean === reversed;
}`
  },
  {
    type: "MATH",
    title: "Random Range",
    desc: "Generate a random integer between min and max.",
    hint: "Math.random() * range + min.",
    template: `function getRandom(min, max) {
  const range = max - min + 1;
  const rand = Math.random() * range;
  return Math.floor(rand) + min;
}`
  },
  {
    type: "OOP",
    title: "Class Constructor",
    desc: "Create a User class with a method.",
    hint: "Define class, constructor, then methods.",
    template: `class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
  greet() {
    return "Hello " + this.name;
  }
}`
  },
  {
    type: "ERROR",
    title: "Custom Error",
    desc: "Throw an error if input is invalid.",
    hint: "Check condition first, then throw.",
    template: `function divide(a, b) {
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  return a / b;
}`
  },
  {
    type: "ARRAY",
    title: "Remove Duplicates",
    desc: "Remove duplicate values from an array using Set.",
    hint: "Pass array to new Set(), then spread back to array.",
    template: `const nums = [1, 2, 2, 3, 3, 4];
const unique = [...new Set(nums)];
console.log(unique);`
  },
  {
    type: "LOOP",
    title: "For..Of Loop",
    desc: "Iterate over an array and sum values.",
    hint: "Initialize sum, loop with 'of', add to sum.",
    template: `let total = 0;
for (const price of prices) {
  if (price > 0) {
    total += price;
  }
}
return total;`
  },
  {
    type: "REGEX",
    title: "Email Validation",
    desc: "Check if a string looks like an email.",
    hint: "Define regex, then use .test().",
    template: `function isValidEmail(email) {
  const regex = /^\\S+@\\S+\\.\\S+$/;
  return regex.test(email);
}`
  }
];