# 🚀 Quick Error Guide - For Students

## How to Use the Error System

### Step 1: Run Your Code
Press `Ctrl+Shift+B` or click the Run button

### Step 2: Check Problems Tab
If errors occur, the Problems tab opens automatically

### Step 3: Click on Any Error
See the full explanation expand with:
- 📝 What the error means
- 🔍 Why it happened
- ✅ How to fix it
- 💡 Code examples

### Step 4: Go to the Error
Click "Go to Line X" button to jump to the error in your code

### Step 5: Fix It
Use the suggestions and examples to fix the error

### Step 6: Run Again
Verify your fix worked!

---

## Common Errors Quick Reference

### ❌ "x is not defined"
**Problem**: Variable doesn't exist
**Fix**: Declare it first: `let x = 10;`

### ❌ "Cannot read property 'name' of undefined"
**Problem**: Trying to access property on null/undefined
**Fix**: Check if exists: `if (obj) { obj.name }` or use `obj?.name`

### ❌ "myFunc is not a function"
**Problem**: Trying to call something that's not a function
**Fix**: Make sure it's a function: `function myFunc() { ... }`

### ❌ "Unexpected token"
**Problem**: Missing semicolon, comma, or bracket
**Fix**: Check for missing punctuation

### ❌ "Maximum call stack size exceeded"
**Problem**: Infinite recursion (function calls itself forever)
**Fix**: Add a base case: `if (n <= 0) return;`

---

## Tips

💡 **Read the error message** - It tells you what's wrong!
💡 **Check the line number** - Error might be on that line or the one before
💡 **Use console.log()** - Print values to see what's happening
💡 **Fix one error at a time** - Start with the first one
💡 **Errors are normal** - They help you learn!

---

## Test File

Open `test-error-explanations.js` to see examples of all error types!

---

## Need More Help?

1. Click the error in Problems tab for detailed explanation
2. Read all sections (What, Why, How, Examples)
3. Try the suggested fixes
4. Check the Debug Console for technical details
5. Ask your instructor if still stuck

**Remember: Every error is a learning opportunity!** 🎓
