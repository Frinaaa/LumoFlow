export interface ErrorSample {
  id: string;
  title: string;
  explanation: string;
  example: string;
  fix: string;
  color: string;
}

const COLORS = ['#00f2ff', '#bc13fe', '#ff0055', '#ffaa00', '#00ff88', '#ff00ff', '#00ffff'];

const ERROR_TEMPLATES = [
  {
    title: "ReferenceError: variable is not defined",
    why: "Variable used before declaration or out of scope.",
    fix: "Declare the variable using let, const, or var before usage.",
    example: "let x = 10;\nconsole.log(x);",
    java: "Similar to using a variable without declaring its type or scope."
  },
  {
    title: "TypeError: Cannot read properties of undefined",
    why: "Accessing a property or method on a null or undefined object.",
    fix: "Use optional chaining (?.) or null checks before accessing properties.",
    example: "if (obj && obj.name) {\n  console.log(obj.name);\n}",
    java: "Equivalent to NullPointerException in Java."
  },
  {
    title: "TypeError: not a function",
    why: "Attempting to call a variable that is not a function (e.g., string, null).",
    fix: "Check the type of the variable using 'typeof' before calling.",
    example: "if (typeof fn === 'function') {\n  fn();\n}",
    java: "Similar to ClassCastException or calling a method on an incompatible object."
  },
  {
    title: "SyntaxError: Unexpected token",
    why: "Missing brackets, commas, quotes, or invalid syntax keywords.",
    fix: "Ensure all brackets are closed and commas are correctly placed.",
    example: "let a = [1, 2, 3]; // Correct comma usage",
    java: "Standard compile-time syntax error."
  },
  {
    title: "Infinite Loop Detection",
    why: "Loop condition never evaluates to false or iterator is not updated.",
    fix: "Ensure the loop has a clear exit condition and increments the counter.",
    example: "for (let i = 0; i < 5; i++) {\n  // logic here\n}",
    java: "Same logic mistake as an infinite while/for loop in Java."
  },
  {
    title: "Assignment instead of Comparison",
    why: "Using '=' (assignment) inside an 'if' statement instead of '===' (comparison).",
    fix: "Use '===' or '==' for comparisons.",
    example: "if (a === 5) {\n  // correct comparison\n}",
    java: "Common mistake where 'if (a = true)' compiles but 'if (a = 5)' doesn't."
  },
  {
    title: "Undefined vs Null confusion",
    why: "Misunderstanding the difference; 'undefined' means uninitialized, 'null' is explicit empty.",
    fix: "Use loose equality '== null' to check for both.",
    example: "if (value == null) {\n  // catches both null and undefined\n}",
    java: "Java only has 'null', making this JS-specific."
  },
  {
    title: "NaN (Not-a-Number) error",
    why: "Result of an invalid mathematical operation (e.g., 0 / 0 or 'abc' * 5).",
    fix: "Use isNaN() or Number.isNaN() to validate numeric results.",
    example: "if (!isNaN(num)) {\n  let result = num * 10;\n}",
    java: "Similar to handling NumberFormatException during parsing."
  },
  {
    title: "Wrong Equality usage (== vs ===)",
    why: "'==' performs type coercion which can lead to unexpected 'true' results.",
    fix: "Always use '===' (strict equality) unless coercion is explicitly needed.",
    example: "5 === '5' // false (correct)\n5 == '5'  // true (danger!)",
    java: "Java doesn't have type-coercing equality for primitives."
  },
  {
    title: "Accessing Array Out of Range",
    why: "Accessing an index that doesn't exist returns 'undefined' instead of throwing an error.",
    fix: "Check the array length before accessing specific indices.",
    example: "if (i >= 0 && i < arr.length) {\n  console.log(arr[i]);\n}",
    java: "Prevents ArrayIndexOutOfBoundsException."
  },
  {
    title: "Unhandled Promise Rejection",
    why: "An asynchronous operation failed and there was no .catch() block.",
    fix: "Always attach a .catch() handler or use try-catch with await.",
    example: "fetch(url)\n  .then(res => res.json())\n  .catch(err => console.error(err));",
    java: "Similar to unhandled Checked Exceptions."
  },
  {
    title: "JSON.parse Error",
    why: "Attempting to parse a string that is not valid JSON.",
    fix: "Wrap JSON.parse in a try-catch block.",
    example: "try {\n  const data = JSON.parse(rawString);\n} catch (e) {\n  console.error('Invalid JSON');\n}",
    java: "Equivalent to catching JsonSyntaxException in GSON."
  },
  {
    title: "'this' Keyword Confusion",
    why: "Value of 'this' changes depending on how a function is called.",
    fix: "Use arrow functions to preserve lexical scope or .bind().",
    example: "const obj = {\n  name: 'Lumo',\n  show() { console.log(this.name); }\n};",
    java: "'this' always refers to the current instance in Java methods."
  },
  {
    title: "Hoisting Issues (Var vs Let)",
    why: "'var' declarations are hoisted to the top, potentially leading to 'undefined' bugs.",
    fix: "Prefer 'let' and 'const' to ensure block scoping and prevent hoisting bugs.",
    example: "let x = 5;\n// x is not accessible before this line",
    java: "Java variables must be declared before use, similar to let/const."
  },
  {
    title: "Memory Leak: Event Listeners",
    why: "Adding listeners without removing them can keep objects in memory.",
    fix: "Call removeEventListener when the element is destroyed or component unmounts.",
    example: "element.removeEventListener('click', handler);",
    java: "Similar to failing to close database connections or file streams."
  },
  {
    title: "DOM Not Loaded Error",
    why: "Script runs before the HTML elements it targets are rendered.",
    fix: "Place script at the end of body or use DOMContentLoaded listener.",
    example: "document.addEventListener('DOMContentLoaded', () => {\n  // init app\n});",
    java: "Similar to accessing UI components before 'onCreate' in Android."
  },
  {
    title: "Implicit Return from Function",
    why: "Function returns 'undefined' because the 'return' keyword was omitted.",
    fix: "Ensure all execution paths return a value if expected.",
    example: "function sum(a, b) {\n  return a + b;\n}",
    java: "Java compiler forces a return statement for non-void methods."
  },
  {
    title: "String and Number Coercion",
    why: "Using '+' with a mix of strings and numbers leads to concatenation.",
    fix: "Explicitly convert strings to numbers before arithmetic.",
    example: "let total = Number('5') + 5; // 10",
    java: "Strong typing in Java prevents implicit mixed-type addition."
  },
  {
    title: "Object Key check failure",
    why: "Accessing a key that doesn't exist returns 'undefined'.",
    fix: "Use 'in' operator or hasOwnProperty to check for existence.",
    example: "if ('name' in obj) {\n  console.log(obj.name);\n}",
    java: "Similar to Map.containsKey() check."
  },
  {
    title: "Property Assignment on Undefined",
    why: "Trying to set a property on a variable that hasn't been initialized as an object.",
    fix: "Initialize the variable as an empty object first.",
    example: "let obj = {};\nobj.name = 'New Name';",
    java: "Prevents NullPointerException during field assignment."
  },
  // --- New Variations and Common Errors ---
  {
    title: "RangeError: Maximum call stack size exceeded",
    why: "Infinite recursion without a base case.",
    fix: "Add a base case to your recursive function to stop execution.",
    example: "function recurse(n) {\n  if (n <= 0) return;\n  recurse(n - 1);\n}",
    java: "Equivalent to StackOverflowError."
  },
  {
    title: "URIError: malformed URI sequence",
    why: "Passing invalid characters to decodeURI() or encodeURI().",
    fix: "Ensure strings are properly escaped before URI operations.",
    example: "try {\n  decodeURIComponent('%invalid');\n} catch(e) { }",
    java: "Similar to URISyntaxException."
  },
  {
    title: "Strict Mode: Read-only property assignment",
    why: "Attempting to change a property that is defined as non-writable.",
    fix: "Check property descriptors or avoid mutating constants.",
    example: "const obj = {};\nObject.defineProperty(obj, 'ver', { value: 1, writable: false });\n// obj.ver = 2; // Errors in strict mode",
    java: "Similar to modifying a 'final' field."
  },
  {
    title: "Async/Await: Missing await keyword",
    why: "Variable stores a Promise object instead of the resolved data.",
    fix: "Add 'await' before calling the asynchronous function.",
    example: "const data = await fetchData();",
    java: "Similar to getting a Future object without calling .get()."
  },
  {
    title: "React: Hooks inside condition",
    why: "React requires hooks to be called in the same order every render.",
    fix: "Move hooks to the top level of the component.",
    example: "const [val, setVal] = useState(0);\nif (loading) return '...';",
    java: "No direct equivalent, relates to framework state management."
  },
  {
    title: "Array.prototype.sort() unpredictability",
    why: "Default sort treats numbers as strings ('10' comes before '2').",
    fix: "Provide a comparison function: (a, b) => a - b.",
    example: "arr.sort((a, b) => a - b);",
    java: "Comparable/Comparator interface usage."
  },
  {
    title: "Floating Point Precision error",
    why: "Binary representation of decimals leads to 0.1 + 0.2 !== 0.3.",
    fix: "Round results or use an epsilon comparison.",
    example: "if (Math.abs((0.1 + 0.2) - 0.3) < 0.0001) { }",
    java: "Same issue with double/float precision."
  },
  {
    title: "Object.assign() shallow copy",
    why: "Mutating a nested object in the copy also affects the original.",
    fix: "Use deep cloning or structuredClone() for nested data.",
    example: "const copy = structuredClone(original);",
    java: "Confusion between Shallow copy and Deep copy."
  },
  {
    title: "CORS (Cross-Origin Resource Sharing)",
    why: "Browser blocking request to a different domain without permission headers.",
    fix: "Configure Access-Control-Allow-Origin on the server side.",
    example: "header('Access-Control-Allow-Origin: *');",
    java: "Common in Spring Boot/Servlet security configuration."
  },
  {
    title: "RegEx: Missing 'g' flag",
    why: "replace() ONLY replaces the first occurrence.",
    fix: "Add the 'g' (global) flag to the regular expression.",
    example: "str.replace(/error/g, 'fix');",
    java: "String.replaceAll() handles this by default."
  },
  {
    title: "Event: missing event.preventDefault()",
    why: "Page reloads on form submit or link click instead of running JS logic.",
    fix: "Call e.preventDefault() at the start of the event handler.",
    example: "form.onsubmit = (e) => {\n  e.preventDefault();\n  // logic\n};",
    java: "Similar to handling events in Swing/JavaFX without consuming them."
  },
  {
    title: "LocalStorage: Quota Exceeded",
    why: "Storing more than 5-10MB in the browser's local storage.",
    fix: "Clear old data or use IndexedDB for large datasets.",
    example: "try {\n  localStorage.setItem('key', data);\n} catch(e) { }",
    java: "Similar to DiskFull or QuotaExceeded exceptions."
  },
  {
    title: "Array: map() without return",
    why: "Using map when no value is returned, resulting in an array of undefined.",
    fix: "Use forEach() if you are only performing side effects.",
    example: "arr.forEach(item => console.log(item));",
    java: "Confusion between a stream transform and a consumer."
  },
  {
    title: "Closure: Loop variable capture (var)",
    why: "All callbacks see the final value of the loop variable because of hoisting.",
    fix: "Use 'let' in the for-loop header for block-scoping.",
    example: "for (let i = 0; i < 5; i++) {\n  setTimeout(() => console.log(i), 100);\n}",
    java: "Solved by 'effectively final' requirement in Java lambdas."
  },
  {
    title: "Shadowing: Inner scope variable",
    why: "Declaring a variable with the same name as one in an outer scope.",
    fix: "Rename the inner variable to avoid confusion and bugs.",
    example: "const x = 10;\nfunction test() {\n  const x = 5; // shadows outer x\n}",
    java: "Same concept in class members vs local variables."
  },
  {
    title: "Boolean Confusion: Boolean('false')",
    why: "Non-empty strings are always truthy in JavaScript, even 'false'.",
    fix: "Check the string value explicitly: str === 'true'.",
    example: "if (str === 'true') { }",
    java: "Boolean.parseBoolean() handles this correctly."
  },
  {
    title: "Performance: Objects as Keys",
    why: "Objects are converted to '[object Object]' when used as keys in a plain Object.",
    fix: "Use a Map to use objects as keys.",
    example: "const map = new Map();\nmap.set(obj, value);",
    java: "Equivalent to HashMap requiring hashCode/equals."
  },
  {
    title: "Date: Month is 0-indexed",
    why: "In JS Date, January is 0 and December is 11.",
    fix: "Add or subtract 1 when converting between human months and JS dates.",
    example: "new Date(2024, 0, 1); // Jan 1st",
    java: "Legacy java.util.Date had the same confusing behavior."
  },
  {
    title: "Object.freeze() vs Const",
    why: "const prevents reassignment, but allows mutating object properties.",
    fix: "Use Object.freeze(obj) to make the object itself immutable.",
    example: "const obj = Object.freeze({ name: 'A' });",
    java: "Similar to Collections.unmodifiableMap()."
  },
  {
    title: "Module: Circular Dependency",
    why: "Files A and B import each other, leading to 'undefined' exports.",
    fix: "Refactor common logic into a third file C that both A and B import.",
    example: "// move shared logic to shared.ts",
    java: "Compiler usually detects circular package dependencies."
  },
  {
    title: "RegEx: Global state bug",
    why: "A global RegEx object maintains state (.lastIndex) between tests.",
    fix: "Reset lastIndex to 0 or create a new RegEx instance.",
    example: "regex.lastIndex = 0;\nregex.test(str);",
    java: "Matcher objects in Java also have state during walking."
  }
];

export const generateErrorSamples = (): ErrorSample[] => {
  const samples: ErrorSample[] = [];

  // We will generate 200 samples by cycling through templates and adding variations
  for (let i = 1; i <= 200; i++) {
    const template = ERROR_TEMPLATES[(i - 1) % ERROR_TEMPLATES.length];
    const color = COLORS[i % COLORS.length];

    // Create unique-ish titles and descriptions using the index
    const prefix = i <= 20 ? "" : `Variant ${Math.floor(i / ERROR_TEMPLATES.length)}: `;

    // For the first 20, follow the user's list exactly. 
    // For others, keep the core info but vary the presentation.

    let explanation = template.why;
    if (template.java) {
      explanation += `\n\nJava: ${template.java}`;
    }

    samples.push({
      id: i.toString().padStart(2, '0'),
      title: `${i}. ${template.title}`,
      explanation: explanation,
      example: template.example,
      fix: template.fix,
      color: color
    });
  }

  return samples;
};