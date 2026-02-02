// TEST FILE: Error Explanations Demo
// This file contains intentional errors to test the detailed error explanation system
// Uncomment ONE error at a time to see the detailed explanation in the Problems tab

// ============================================
// TEST 1: ReferenceError - Undefined Variable
// ============================================
// Uncomment the line below to test:
// console.log(myUndefinedVariable);

// Expected: Detailed explanation about variable not being defined
// with suggestions to declare it first


// ============================================
// TEST 2: TypeError - Cannot Read Property
// ============================================
// Uncomment the lines below to test:
// let user;
// console.log(user.name);

// Expected: Explanation about accessing property on undefined
// with suggestions to use optional chaining or check if exists


// ============================================
// TEST 3: TypeError - Not a Function
// ============================================
// Uncomment the lines below to test:
// let myFunc = 10;
// myFunc();

// Expected: Explanation that variable is not a function
// with examples of correct function declarations


// ============================================
// TEST 4: SyntaxError - Missing Bracket
// ============================================
// Uncomment the lines below to test:
// if (x > 5 {
//   console.log('Missing closing parenthesis');
// }

// Expected: Explanation about missing closing parenthesis
// with bracket matching tips


// ============================================
// TEST 5: SyntaxError - Unexpected Token
// ============================================
// Uncomment the lines below to test:
// let x = 10 let y = 20;

// Expected: Explanation about missing semicolon
// with examples of correct syntax


// ============================================
// TEST 6: RangeError - Maximum Call Stack
// ============================================
// Uncomment the lines below to test:
// function infiniteRecursion(n) {
//   return infiniteRecursion(n - 1);  // No base case!
// }
// infiniteRecursion(10);

// Expected: Explanation about infinite recursion
// with examples of adding base case


// ============================================
// TEST 7: RangeError - Invalid Array Length
// ============================================
// Uncomment the line below to test:
// let arr = new Array(-10);

// Expected: Explanation about negative array length
// with examples of valid array creation


// ============================================
// WORKING CODE (No Errors)
// ============================================
// This code works correctly - no errors should appear

let numbers = [1, 2, 3, 4, 5];
let doubled = numbers.map(x => x * 2);
console.log('Doubled:', doubled);

let sum = 0;
for (let i = 0; i < numbers.length; i++) {
  sum += numbers[i];
}
console.log('Sum:', sum);

function greet(name) {
  return `Hello, ${name}!`;
}
console.log(greet('Student'));

// ============================================
// INSTRUCTIONS:
// ============================================
// 1. Uncomment ONE error test at a time
// 2. Run the code (Ctrl+Shift+B or Run button)
// 3. Check the Problems tab (should open automatically)
// 4. Click on the error to see detailed explanation
// 5. Read the explanation sections:
//    - What This Means
//    - Common Causes
//    - How To Fix
//    - Examples
// 6. Click "Go to Line X" to jump to the error
// 7. Fix the error using the suggestions
// 8. Run again to verify the fix worked
// 9. Comment out the fixed error and try the next one
//
// The working code at the bottom should always run successfully!
