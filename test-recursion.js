// RECURSION VISUALIZATION TEST
// Watch how a function calls itself!

function factorial(n) {
  // Base case: stop when n is 0 or 1
  if (n <= 1) {
    return 1;
  }
  
  // Recursive case: n * factorial(n-1)
  return n * factorial(n - 1);
}

// Calculate factorial of 5
let result = factorial(5);
console.log("Factorial of 5 is:", result);

// ═══════════════════════════════════════════════════════════
// WHAT YOU'LL SEE
// ═══════════════════════════════════════════════════════════

// STEP 1: Introduction
// Voice: "Let's understand RECURSION! Function 'factorial' calls
//         itself to solve a problem by breaking it into smaller pieces."
// Visual: Function definition highlighted

// STEP 2: Function Definition
// Voice: "Defining recursive function 'factorial' with parameter: n.
//         Think of recursion like Russian nesting dolls - each doll
//         contains a smaller version of itself."
// Visual: Function box appears

// STEP 3: Base Case
// Voice: "Found BASE CASE! This is the stopping condition. Without it,
//         the function would call itself forever. The base case returns: 1"
// Visual: Base case highlighted

// STEP 4: Recursive Case
// Voice: "RECURSIVE CASE: The function calls itself with a smaller problem.
//         Each call gets closer to the base case."
// Visual: Recursive call shown

// STEP 5-7: Recursive Calls
// Voice: "Recursive call #1: Function calls itself. We go deeper into
//         the recursion stack."
// Visual: Stack of function calls building up

// STEP 8: Base Case Reached
// Voice: "Base case reached! Now we start returning back up the call stack."
// Visual: Bottom of stack highlighted

// STEP 9-11: Returning
// Voice: "Returning from call #3: Each function call returns its result
//         to the previous call."
// Visual: Stack unwinding, values returning

// STEP 12: Complete
// Voice: "Recursion complete! All calls have returned. The final result
//         is built from combining all the recursive calls."
// Visual: Final result = 120

// ═══════════════════════════════════════════════════════════
// HOW RECURSION WORKS
// ═══════════════════════════════════════════════════════════

// factorial(5) calls factorial(4)
// factorial(4) calls factorial(3)
// factorial(3) calls factorial(2)
// factorial(2) calls factorial(1)
// factorial(1) returns 1 (BASE CASE!)
// factorial(2) returns 2 * 1 = 2
// factorial(3) returns 3 * 2 = 6
// factorial(4) returns 4 * 6 = 24
// factorial(5) returns 5 * 24 = 120

// FINAL RESULT: 120 ✅

// ═══════════════════════════════════════════════════════════
// KEY CONCEPTS
// ═══════════════════════════════════════════════════════════

// 🔄 RECURSION:
// - Function calls itself
// - Breaks problem into smaller pieces
// - Each call is simpler than the last

// 🛑 BASE CASE:
// - Stopping condition
// - Prevents infinite recursion
// - Returns without calling itself

// 📚 CALL STACK:
// - Each call waits for the next
// - Stack builds up (going down)
// - Stack unwinds (coming back up)

// 🎯 RESULT:
// - Built from combining all calls
// - Each level contributes
// - Final answer emerges at top

// Perfect for learning recursion visually! 🎓✨
