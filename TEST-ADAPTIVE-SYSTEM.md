# 🧪 Testing the Adaptive Visualization System

## Quick Test Guide

Follow these steps to verify that each file gets a unique visualization.

## Test 1: Different Array Values

### File A: `test-array-small.js`
```javascript
let arr = [3, 1, 4];
console.log(arr);
```

**Expected**:
- Code fingerprint: `let_arr_=_[3,_1,_4];console.log(arr);`
- Visualization shows 3 elements: 3, 1, 4
- Console shows: "Arrays found: 1"

### File B: `test-array-large.js`
```javascript
let arr = [10, 20, 30, 40, 50];
console.log(arr);
```

**Expected**:
- Code fingerprint: `let_arr_=_[10,_20,_30,_40,_50];console.log(arr);`
- Visualization shows 5 elements: 10, 20, 30, 40, 50
- Console shows: "Arrays found: 1"

**Verification**:
- ✅ Different fingerprints
- ✅ Different number of elements
- ✅ Different values displayed

---

## Test 2: Different Operations

### File A: `test-map.js`
```javascript
let nums = [1, 2, 3];
let doubled = nums.map(x => x * 2);
console.log(doubled);
```

**Expected**:
- Unique operations: "map transformation"
- Shows Input→Processing→Output
- Result: [2, 4, 6]

### File B: `test-filter.js`
```javascript
let nums = [1, 2, 3, 4, 5];
let evens = nums.filter(x => x % 2 === 0);
console.log(evens);
```

**Expected**:
- Unique operations: "filter operation"
- Shows Input→Processing→Output
- Result: [2, 4]

**Verification**:
- ✅ Different operations listed
- ✅ Different transformations shown
- ✅ Different results

---

## Test 3: Queue vs Stack

### File A: `test-queue.js`
```javascript
let queue = [];
queue.push('First');
queue.push('Second');
queue.shift();
console.log(queue);
```

**Expected**:
- Unique operations: "adding to end, removing from start"
- Shows Queue visualization (FRONT/BACK labels)
- FIFO behavior

### File B: `test-stack.js`
```javascript
let stack = [];
stack.push('Bottom');
stack.push('Top');
stack.pop();
console.log(stack);
```

**Expected**:
- Unique operations: "adding to end, removing from end"
- Shows Stack visualization (TOP/BASE labels)
- LIFO behavior

**Verification**:
- ✅ Different data structures
- ✅ Different labels (FRONT/BACK vs TOP/BASE)
- ✅ Different behavior explained

---

## Test 4: Sorting Different Arrays

### File A: `test-sort-small.js`
```javascript
let arr = [5, 2, 8];
// Bubble sort
for (let i = 0; i < arr.length; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
    }
  }
}
console.log(arr);
```

**Expected**:
- Shows 3 bubbles: 5, 2, 8
- Bubble sort visualization
- Final result: [2, 5, 8]

### File B: `test-sort-large.js`
```javascript
let arr = [9, 3, 7, 1, 5];
// Bubble sort
for (let i = 0; i < arr.length; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
    }
  }
}
console.log(arr);
```

**Expected**:
- Shows 5 bubbles: 9, 3, 7, 1, 5
- Bubble sort visualization
- Final result: [1, 3, 5, 7, 9]

**Verification**:
- ✅ Different number of bubbles
- ✅ Different values
- ✅ Different final results

---

## Test 5: Unique Code Paths

### File A: `test-conditional-a.js`
```javascript
let x = 10;
let y = 20;
if (x < y) {
  console.log('x is smaller');
}
```

**Expected**:
- Unique operations: "conditional check"
- Shows: x=10, y=20
- Condition: TRUE
- Output: "x is smaller"

### File B: `test-conditional-b.js`
```javascript
let a = 50;
let b = 30;
if (a < b) {
  console.log('a is smaller');
} else {
  console.log('a is larger');
}
```

**Expected**:
- Unique operations: "conditional check"
- Shows: a=50, b=30
- Condition: FALSE
- Output: "a is larger"

**Verification**:
- ✅ Different variable names
- ✅ Different values
- ✅ Different condition results
- ✅ Different outputs

---

## Test 6: Complex Unique Code

### File A: `test-complex-a.js`
```javascript
let numbers = [1, 2, 3, 4, 5];
let sum = 0;
for (let i = 0; i < numbers.length; i++) {
  sum += numbers[i];
}
console.log('Sum:', sum);
```

**Expected**:
- Unique operations: "for loop"
- Shows: numbers=[1,2,3,4,5], sum=0
- Step-by-step addition
- Final: sum=15
- Output: "Sum: 15"

### File B: `test-complex-b.js`
```javascript
let values = [10, 20, 30];
let product = 1;
for (let i = 0; i < values.length; i++) {
  product *= values[i];
}
console.log('Product:', product);
```

**Expected**:
- Unique operations: "for loop"
- Shows: values=[10,20,30], product=1
- Step-by-step multiplication
- Final: product=6000
- Output: "Product: 6000"

**Verification**:
- ✅ Different variable names
- ✅ Different operations (+ vs *)
- ✅ Different results
- ✅ Different outputs

---

## How to Test

### Step 1: Open Developer Console
- Press F12 or right-click → Inspect
- Go to Console tab

### Step 2: Create Test Files
- Create each test file listed above
- Save them in your workspace

### Step 3: Switch Between Files
- Open File A
- Check console output
- Check visualization
- Open File B
- Check console output
- Check visualization

### Step 4: Verify Console Output

For each file, you should see:
```
🔄 File changed! Clearing previous visualization...
🎬 Building NEW trace for file: [filename]
📝 Code preview: [first 100 chars]
🎬 ADAPTIVE AI ANALYZER: Starting visualization for NEW code
📝 Code fingerprint: [unique fingerprint]
📏 Code length: [number] characters
🔍 AI Analysis Results:
  - Arrays found: [number]
  - Numbers found: [number]
  - Strings found: [number]
  - Console outputs: [number]
🎯 Pattern Detection:
  - [pattern results]
✅ ADAPTIVE: Creating UNIQUE [type] visualization for THIS code
✨ Generated [number] unique frames
```

### Step 5: Verify Visualization

Check that:
- ✅ Code fingerprint is different for each file
- ✅ Unique operations list is different
- ✅ Actual data values are shown (not generic)
- ✅ Line numbers reference actual code lines
- ✅ Final output matches console.log

---

## Common Issues & Solutions

### Issue: Visualizations look the same
**Solution**: 
- Check console for "Code fingerprint" - should be different
- Verify code content is actually different
- Make sure you're switching between files (not just editing same file)

### Issue: Console doesn't show "File changed"
**Solution**:
- Make sure you're clicking on different files in file explorer
- Wait 300ms for debounce
- Check that activeTabId is changing

### Issue: No visualization appears
**Solution**:
- Check console for errors
- Verify code has valid JavaScript syntax
- Try adding console.log to your code
- Check that Analysis Panel is open

### Issue: Same fingerprint for different files
**Solution**:
- This means files have identical first 50 characters
- Add more unique content at the start of files
- Use different variable names

---

## Success Criteria

✅ **Each file shows different code fingerprint**
✅ **Each file shows different unique operations**
✅ **Visualizations use actual data from code**
✅ **Console shows "File changed! Clearing previous visualization"**
✅ **Line numbers match actual code**
✅ **Final outputs match console.log statements**
✅ **No two files have identical visualizations (unless code is identical)**

---

## Quick Verification Script

Run this in your workspace to create all test files at once:

```bash
# Test 1
echo "let arr = [3, 1, 4]; console.log(arr);" > test-array-small.js
echo "let arr = [10, 20, 30, 40, 50]; console.log(arr);" > test-array-large.js

# Test 2
echo "let nums = [1, 2, 3]; let doubled = nums.map(x => x * 2); console.log(doubled);" > test-map.js
echo "let nums = [1, 2, 3, 4, 5]; let evens = nums.filter(x => x % 2 === 0); console.log(evens);" > test-filter.js

# Test 3
echo "let queue = []; queue.push('First'); queue.push('Second'); queue.shift(); console.log(queue);" > test-queue.js
echo "let stack = []; stack.push('Bottom'); stack.push('Top'); stack.pop(); console.log(stack);" > test-stack.js
```

Then open each file and verify the visualization is unique!

---

## Expected Results Summary

| File | Fingerprint Starts With | Unique Ops | Elements | Result |
|------|------------------------|------------|----------|--------|
| test-array-small.js | `let_arr_=_[3,_1,_4]` | - | 3 | [3,1,4] |
| test-array-large.js | `let_arr_=_[10,_20,_30` | - | 5 | [10,20,30,40,50] |
| test-map.js | `let_nums_=_[1,_2,_3]` | map transformation | 3 | [2,4,6] |
| test-filter.js | `let_nums_=_[1,_2,_3,_4` | filter operation | 5 | [2,4] |
| test-queue.js | `let_queue_=_[]` | adding to end, removing from start | - | ['Second'] |
| test-stack.js | `let_stack_=_[]` | adding to end, removing from end | - | ['Bottom'] |

All fingerprints should be **different**!
All visualizations should be **unique**!

🎉 **If all tests pass, the adaptive system is working perfectly!**
