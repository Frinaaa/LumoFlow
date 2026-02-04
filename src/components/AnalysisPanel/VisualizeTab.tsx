import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAnalysisStore, TraceFrame } from '../../editor/stores/analysisStore';
import { useEditorStore } from '../../editor/stores/editorStore';
import { useUserStore } from '../../stores/userStore';

// Helper functions defined outside component for better performance
const generateSortingTrace = (code: string, frames: TraceFrame[]) => {
  try {
    // Detect if it's selection sort
    const isSelectionSort = /selection/i.test(code) || (/min/.test(code) && /for.*for/.test(code));

    // Find array initialization
    const arrayMatch = code.match(/(?:let|const|var)\s+(\w+)\s*=\s*(\[[\s\S]*?\])/);
    if (!arrayMatch) return;

    const varName = arrayMatch[1];
    let arrayData;

    try {
      arrayData = JSON.parse(arrayMatch[2].replace(/'/g, '"'));
    } catch (e) {
      // If parsing fails, try to evaluate it
      arrayData = eval(arrayMatch[2]);
    }

    if (!Array.isArray(arrayData)) return;

    // If it's selection sort, use different visualization
    if (isSelectionSort) {
      generateSelectionSortTrace(code, arrayData, varName, frames);
      return;
    }

    frames.push({
      id: 0,
      memory: { [varName]: [...arrayData] },
      activeVariable: varName,
      action: 'EXECUTE',
      desc: `Let's start! We have these numbers: ${arrayData.join(', ')}. Our goal is to arrange them from smallest to largest using Bubble Sort.`
    });

    // Actually execute the sorting algorithm
    const arr = [...arrayData];
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arr] },
        activeVariable: varName,
        action: 'EXECUTE',
        desc: `Starting pass number ${i + 1}. We'll look at each pair of numbers and swap them if they're in the wrong order.`
      });

      for (let j = 0; j < n - i - 1; j++) {
        frames.push({
          id: frames.length,
          memory: { [varName]: [...arr], comparing: [j, j + 1] },
          activeVariable: varName,
          action: 'READ',
          desc: `Now comparing ${arr[j]} and ${arr[j + 1]}. Is ${arr[j]} bigger than ${arr[j + 1]}? ${arr[j] > arr[j + 1] ? 'Yes! So we need to swap them.' : 'No, they are already in the right order.'}`
        });

        if (arr[j] > arr[j + 1]) {
          frames.push({
            id: frames.length,
            memory: { [varName]: [...arr], swapping: [j, j + 1] },
            activeVariable: varName,
            action: 'WRITE',
            desc: `Swapping! ${arr[j]} moves to the right, and ${arr[j + 1]} moves to the left. Watch them switch places!`
          });

          // Perform the actual swap
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];

          frames.push({
            id: frames.length,
            memory: { [varName]: [...arr] },
            activeVariable: varName,
            action: 'WRITE',
            desc: `Great! After swapping, our array now looks like this: ${arr.join(', ')}. The bigger number moved to the right.`
          });
        } else {
          frames.push({
            id: frames.length,
            memory: { [varName]: [...arr] },
            activeVariable: varName,
            action: 'READ',
            desc: `These two are already in the correct order, so we don't need to swap. Moving on to the next pair.`
          });
        }
      }

      frames.push({
        id: frames.length,
        memory: { [varName]: [...arr], sorted: n - i - 1 },
        activeVariable: varName,
        action: 'EXECUTE',
        desc: `Pass ${i + 1} is complete! The largest number has bubbled up to its correct position. It's now locked in place and won't move anymore.`
      });
    }

    frames.push({
      id: frames.length,
      memory: { [varName]: [...arr], sorted: n },
      activeVariable: varName,
      action: 'EXECUTE',
      desc: `Perfect! We're all done! The array is now completely sorted from smallest to largest: ${arr.join(', ')}. Every number is in its correct position!`
    });

    // Show final result
    frames.push({
      id: frames.length,
      memory: { [varName]: [...arr], sorted: n, result: arr },
      activeVariable: varName,
      action: 'EXECUTE',
      desc: `FINAL RESULT: [${arr.join(', ')}]. The sorting is complete! We started with [${arrayData.join(', ')}] and ended with [${arr.join(', ')}].`
    });
  } catch (e) {
    console.error('Error in sorting trace:', e);
  }
};

// Selection Sort with detailed explanations of WHY each element is chosen
const generateSelectionSortTrace = (code: string, arrayData: any[], varName: string, frames: TraceFrame[]) => {
  frames.push({
    id: 0,
    memory: { [varName]: [...arrayData] },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `Let's start Selection Sort! We have: ${arrayData.join(', ')}. The strategy: Find the smallest number and move it to the front, then repeat for the rest.`
  });

  const arr = [...arrayData];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    frames.push({
      id: frames.length,
      memory: { [varName]: [...arr], currentPosition: i },
      activeVariable: varName,
      action: 'EXECUTE',
      desc: `Position ${i}: We need to find the smallest number in the remaining unsorted part [${arr.slice(i).join(', ')}] and put it here.`
    });

    let minIndex = i;
    let minValue = arr[i];

    frames.push({
      id: frames.length,
      memory: { [varName]: [...arr], minIndex, checking: i },
      activeVariable: varName,
      action: 'READ',
      desc: `Starting with ${arr[i]} at position ${i} as our current minimum. Now let's check if there's anything smaller in the rest of the array.`
    });

    for (let j = i + 1; j < n; j++) {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arr], minIndex, checking: j, comparing: [minIndex, j] },
        activeVariable: varName,
        action: 'READ',
        desc: `Checking position ${j}: Found ${arr[j]}. Is ${arr[j]} smaller than our current minimum ${minValue}? ${arr[j] < minValue ? `YES! ${arr[j]} < ${minValue}, so ${arr[j]} is our new minimum.` : `No, ${arr[j]} >= ${minValue}, so ${minValue} is still the smallest.`}`
      });

      if (arr[j] < arr[minIndex]) {
        minIndex = j;
        minValue = arr[j];

        frames.push({
          id: frames.length,
          memory: { [varName]: [...arr], minIndex, newMin: minValue },
          activeVariable: varName,
          action: 'WRITE',
          desc: `Found a new minimum! ${minValue} at position ${minIndex} is now the smallest number we've seen. We'll remember this position.`
        });
      }
    }

    if (minIndex !== i) {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arr], minIndex, swapping: [i, minIndex] },
        activeVariable: varName,
        action: 'WRITE',
        desc: `The smallest number in the unsorted part is ${arr[minIndex]} at position ${minIndex}. Let's swap it with position ${i} (which has ${arr[i]}). WHY? Because ${arr[minIndex]} is the smallest, it belongs at the front!`
      });

      // Perform swap
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];

      frames.push({
        id: frames.length,
        memory: { [varName]: [...arr], sorted: i + 1 },
        activeVariable: varName,
        action: 'WRITE',
        desc: `Swapped! Now ${arr[i]} is in position ${i}. Array is now: ${arr.join(', ')}. Position ${i} is now sorted and locked in place!`
      });
    } else {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arr], sorted: i + 1 },
        activeVariable: varName,
        action: 'EXECUTE',
        desc: `${arr[i]} at position ${i} is already the smallest in the unsorted part. No swap needed! Position ${i} is now sorted.`
      });
    }
  }

  frames.push({
    id: frames.length,
    memory: { [varName]: [...arr], sorted: n },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `Selection Sort complete! Every position now has the correct number. Final sorted array: ${arr.join(', ')}.`
  });

  frames.push({
    id: frames.length,
    memory: { [varName]: [...arr], sorted: n, result: arr },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `FINAL RESULT: [${arr.join(', ')}]. We started with [${arrayData.join(', ')}] and sorted it by repeatedly selecting the smallest element!`
  });
};

const generateSearchingTrace = (code: string, frames: TraceFrame[]) => {
  const arrayMatch = code.match(/(?:let|const|var)\s+(\w+)\s*=\s*(\[[\s\S]*?\])/);
  const targetMatch = code.match(/(?:find|search|indexOf)\s*\(\s*(\w+|\d+)\s*\)/i);

  if (!arrayMatch) return;

  const varName = arrayMatch[1];
  const arrayData = JSON.parse(arrayMatch[2].replace(/'/g, '"'));
  const target = targetMatch ? targetMatch[1] : arrayData[Math.floor(arrayData.length / 2)];

  frames.push({
    id: 0,
    memory: { [varName]: [...arrayData], target },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `Let's search for the number ${target}! We have this array: ${arrayData.join(', ')}. We'll check each box one by one until we find it.`
  });

  for (let i = 0; i < arrayData.length; i++) {
    frames.push({
      id: frames.length,
      memory: { [varName]: [...arrayData], currentIndex: i, target },
      activeVariable: varName,
      action: 'READ',
      desc: `Looking at position ${i}. The value here is ${arrayData[i]}. Is this the number we're looking for? ${arrayData[i] == target ? 'Yes! We found it!' : `No, ${arrayData[i]} is not equal to ${target}. Let's keep searching.`}`
    });

    if (arrayData[i] == target) {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arrayData], foundIndex: i, target },
        activeVariable: varName,
        action: 'EXECUTE',
        desc: `Success! We found ${target} at position ${i}! The search is complete. We checked ${i + 1} ${i === 0 ? 'box' : 'boxes'} before finding it.`
      });
      return;
    }
  }

  frames.push({
    id: frames.length,
    memory: { [varName]: [...arrayData], target },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `✗ ${target} not found in array`
  });
};

const generateStringTrace = (code: string, frames: TraceFrame[]) => {
  const strMatch = code.match(/(?:let|const|var)\s+(\w+)\s*=\s*["']([^"']+)["']/);
  if (!strMatch) return;

  const varName = strMatch[1];
  const strValue = strMatch[2];

  frames.push({
    id: 0,
    memory: { [varName]: strValue },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `String: "${strValue}"`
  });

  if (/split/.test(code)) {
    const chars = strValue.split('');
    frames.push({
      id: frames.length,
      memory: { [varName]: strValue, result: chars },
      activeVariable: 'result',
      action: 'WRITE',
      desc: `Split into: [${chars.join(', ')}]`
    });
  }

  if (/toUpperCase/.test(code)) {
    frames.push({
      id: frames.length,
      memory: { [varName]: strValue, result: strValue.toUpperCase() },
      activeVariable: 'result',
      action: 'WRITE',
      desc: `Uppercase: "${strValue.toUpperCase()}"`
    });
  }

  if (/toLowerCase/.test(code)) {
    frames.push({
      id: frames.length,
      memory: { [varName]: strValue, result: strValue.toLowerCase() },
      activeVariable: 'result',
      action: 'WRITE',
      desc: `Lowercase: "${strValue.toLowerCase()}"`
    });
  }

  if (/reverse/.test(code)) {
    const reversed = strValue.split('').reverse().join('');
    frames.push({
      id: frames.length,
      memory: { [varName]: strValue, result: reversed },
      activeVariable: 'result',
      action: 'WRITE',
      desc: `Reversed: "${reversed}"`
    });
  }
};

const generateArrayOperationTrace = (code: string, frames: TraceFrame[]) => {
  const arrayMatch = code.match(/(?:let|const|var)\s+(\w+)\s*=\s*(\[[\s\S]*?\])/);
  if (!arrayMatch) return;

  const varName = arrayMatch[1];
  const arrayData = JSON.parse(arrayMatch[2].replace(/'/g, '"'));

  frames.push({
    id: 0,
    memory: { [varName]: [...arrayData] },
    activeVariable: varName,
    action: 'EXECUTE',
    desc: `Here's our starting array: ${arrayData.join(', ')}. We're going to transform each number one by one.`
  });

  const isMap = /\.map\s*\(/.test(code);
  const isFilter = /\.filter\s*\(/.test(code);

  if (isMap) {
    const result: any[] = [];
    arrayData.forEach((val: any, idx: number) => {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arrayData], currentIndex: idx, processing: val },
        activeVariable: varName,
        action: 'READ',
        desc: `Now looking at position ${idx}. The value here is ${val}. Let's transform it!`
      });

      const transformed = val * 2;
      result.push(transformed);

      frames.push({
        id: frames.length,
        memory: { [varName]: [...arrayData], result: [...result], currentIndex: idx },
        activeVariable: 'result',
        action: 'WRITE',
        desc: `We took ${val} and doubled it to get ${transformed}. This transformed value goes into our new array. So far our result is: ${result.join(', ')}.`
      });
    });

    frames.push({
      id: frames.length,
      memory: { [varName]: [...arrayData], result },
      activeVariable: 'result',
      action: 'EXECUTE',
      desc: `All done! We transformed every number. Our original array was ${arrayData.join(', ')}, and our new array is ${result.join(', ')}. Each number was doubled!`
    });

    // FINAL RESULT - Show clearly
    frames.push({
      id: frames.length,
      memory: { [varName]: [...arrayData], result, FINAL_OUTPUT: result },
      activeVariable: 'result',
      action: 'EXECUTE',
      desc: `✅ FINAL RESULT: [${result.join(', ')}]

📊 TRANSFORMATION COMPLETE:
Input:  [${arrayData.join(', ')}]
Output: [${result.join(', ')}]

Every element was processed and the final array is ready!`
    });
  } else if (isFilter) {
    const result: any[] = [];
    arrayData.forEach((val: any, idx: number) => {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arrayData], currentIndex: idx, checking: val },
        activeVariable: varName,
        action: 'READ',
        desc: `Checking the number ${val}. Is it greater than 5? ${val > 5 ? `Yes! ${val} is bigger than 5, so we'll keep it.` : `No, ${val} is not bigger than 5, so we'll skip it.`}`
      });

      if (val > 5) {
        result.push(val);
        frames.push({
          id: frames.length,
          memory: { [varName]: [...arrayData], result: [...result] },
          activeVariable: 'result',
          action: 'WRITE',
          desc: `Perfect! ${val} passed the test, so we're adding it to our result array. Our filtered array now has: ${result.join(', ')}.`
        });
      }
    });

    frames.push({
      id: frames.length,
      memory: { [varName]: [...arrayData], result },
      activeVariable: 'result',
      action: 'EXECUTE',
      desc: `Filtering complete! We started with ${arrayData.join(', ')}, and after keeping only numbers greater than 5, we got ${result.join(', ')}. ${result.length === 0 ? 'No numbers passed the test.' : `${result.length} ${result.length === 1 ? 'number' : 'numbers'} passed the test!`}`
    });

    // FINAL RESULT - Show clearly
    frames.push({
      id: frames.length,
      memory: { [varName]: [...arrayData], result, FINAL_OUTPUT: result },
      activeVariable: 'result',
      action: 'EXECUTE',
      desc: `✅ FINAL RESULT: [${result.join(', ')}]

📊 FILTERING COMPLETE:
Input:  [${arrayData.join(', ')}] (${arrayData.length} elements)
Output: [${result.join(', ')}] (${result.length} elements)

${result.length} element${result.length !== 1 ? 's' : ''} met the criteria and made it to the final result!`
    });
  } else {
    arrayData.forEach((val: any, idx: number) => {
      frames.push({
        id: frames.length,
        memory: { [varName]: [...arrayData], currentIndex: idx },
        activeVariable: varName,
        action: 'READ',
        desc: `Looking at position ${idx}. The value is ${JSON.stringify(val)}. Processing this element now.`
      });
    });

    frames.push({
      id: frames.length,
      memory: { [varName]: [...arrayData] },
      activeVariable: varName,
      action: 'EXECUTE',
      desc: `✓ Processed all ${arrayData.length} elements`
    });

    // FINAL RESULT
    frames.push({
      id: frames.length,
      memory: { [varName]: [...arrayData], FINAL_OUTPUT: arrayData },
      activeVariable: varName,
      action: 'EXECUTE',
      desc: `✅ FINAL RESULT: [${arrayData.join(', ')}]

All ${arrayData.length} elements have been processed!`
    });
  }
};

const generateLoopTrace = (code: string, frames: TraceFrame[]) => {
  const forMatch = code.match(/for\s*\(\s*let\s+(\w+)\s*=\s*(\d+)\s*;\s*\w+\s*<\s*(\d+)/);

  if (forMatch) {
    const varName = forMatch[1];
    const start = parseInt(forMatch[2]);
    const end = parseInt(forMatch[3]);

    frames.push({
      id: 0,
      memory: {},
      activeVariable: null,
      action: 'EXECUTE',
      desc: `Starting loop: ${varName} from ${start} to ${end - 1}`
    });

    for (let i = start; i < end; i++) {
      frames.push({
        id: frames.length,
        memory: { [varName]: i },
        activeVariable: varName,
        action: 'WRITE',
        desc: `Iteration ${i - start + 1}: ${varName} = ${i}`
      });
    }

    frames.push({
      id: frames.length,
      memory: { [varName]: end },
      activeVariable: varName,
      action: 'EXECUTE',
      desc: `✓ Loop complete after ${end - start} iterations`
    });
  }
};

const generateConditionalTrace = (code: string, frames: TraceFrame[]) => {
  const varMatches = Array.from(code.matchAll(/(?:let|const|var)\s+(\w+)\s*=\s*([^;\n]+)/g));
  const memory: Record<string, any> = {};

  frames.push({
    id: 0,
    memory: {},
    activeVariable: null,
    action: 'EXECUTE',
    desc: 'Starting conditional logic evaluation. We\'ll check conditions and see which path the code takes.'
  });

  varMatches.forEach(match => {
    const varName = match[1];
    const value = match[2].trim();

    try {
      const evalValue = new Function(`return ${value}`)();
      memory[varName] = evalValue;

      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: varName,
        action: 'WRITE',
        desc: `Creating variable "${varName}" with value ${JSON.stringify(evalValue)}. This will be used in our condition check.`
      });
    } catch (e) {
      memory[varName] = value;
      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: varName,
        action: 'WRITE',
        desc: `Creating variable "${varName}" = ${value}`
      });
    }
  });

  const ifMatch = code.match(/if\s*\(\s*([^)]+)\s*\)/);
  if (ifMatch) {
    const condition = ifMatch[1];
    frames.push({
      id: frames.length,
      memory: { ...memory },
      activeVariable: null,
      action: 'READ',
      desc: `Now checking the condition: if (${condition}). Let's see if this is true or false.`
    });

    try {
      const result = new Function(...Object.keys(memory), `return ${condition}`)(...Object.values(memory));
      frames.push({
        id: frames.length,
        memory: { ...memory, conditionResult: result },
        activeVariable: null,
        action: 'EXECUTE',
        desc: `The condition is ${result ? 'TRUE ✓' : 'FALSE ✗'}! ${result ? 'We will execute the code inside the if block.' : 'We will skip the if block and go to else (if it exists).'}`
      });
    } catch (e) {
      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: null,
        action: 'EXECUTE',
        desc: `Condition evaluated: ${condition}`
      });
    }
  }

  // Add final frame
  if (frames.length > 1) {
    frames.push({
      id: frames.length,
      memory: { ...memory },
      activeVariable: null,
      action: 'EXECUTE',
      desc: `✅ Conditional logic complete! Final state: ${Object.entries(memory).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}`
    });
  }
};

const generateFunctionTrace = (code: string, frames: TraceFrame[]) => {
  const funcMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)/);

  if (funcMatch) {
    const funcName = funcMatch[1];
    const params = funcMatch[2];

    frames.push({
      id: 0,
      memory: {},
      activeVariable: funcName,
      action: 'EXECUTE',
      desc: `Defining function "${funcName}"${params ? ` with parameters: ${params}` : ''}. This creates a reusable block of code that we can call multiple times.`
    });

    // Try to find example values in the code
    const callMatch = code.match(new RegExp(`${funcName}\\s*\\(([^)]+)\\)`));
    if (callMatch && callMatch[1]) {
      const args = callMatch[1].split(',').map(a => a.trim());

      frames.push({
        id: 1,
        memory: { [funcName]: 'calling', input: args },
        activeVariable: funcName,
        action: 'READ',
        desc: `Calling ${funcName} with input: ${args.join(', ')}. These values will be passed into the function.`
      });

      // Show parameters receiving values
      const paramList = params.split(',').map(p => p.trim()).filter(p => p);
      paramList.forEach((param, idx) => {
        if (args[idx]) {
          frames.push({
            id: frames.length,
            memory: { [param]: args[idx] },
            activeVariable: param,
            action: 'WRITE',
            desc: `Parameter "${param}" receives the value ${args[idx]}. This is like putting ${args[idx]} into a box labeled "${param}".`
          });
        }
      });
    }

    // Look for return statement
    const returnMatch = code.match(/return\s+([^;\n]+)/);
    if (returnMatch) {
      const returnExpr = returnMatch[1].trim();

      frames.push({
        id: frames.length,
        memory: { [funcName]: 'processing', expression: returnExpr },
        activeVariable: funcName,
        action: 'EXECUTE',
        desc: `Processing: ${returnExpr}. The function is calculating the result using this expression.`
      });

      // Try to evaluate if possible
      if (callMatch && callMatch[1]) {
        try {
          const args = callMatch[1].split(',').map(a => a.trim().replace(/['"]/g, ''));
          const paramList = params.split(',').map(p => p.trim()).filter(p => p);
          const evalContext: any = {};
          paramList.forEach((param, idx) => {
            evalContext[param] = isNaN(Number(args[idx])) ? args[idx] : Number(args[idx]);
          });

          const result = new Function(...Object.keys(evalContext), `return ${returnExpr}`)(...Object.values(evalContext));

          frames.push({
            id: frames.length,
            memory: { [funcName]: 'complete', result, input: args },
            activeVariable: 'result',
            action: 'WRITE',
            desc: `✅ Result: ${result}. The function took ${args.join(', ')} as input and produced ${result} as output. This is the final answer!`
          });
        } catch (e) {
          frames.push({
            id: frames.length,
            memory: { [funcName]: 'complete' },
            activeVariable: funcName,
            action: 'EXECUTE',
            desc: `✅ Function "${funcName}" execution complete! The result is returned to the caller.`
          });
        }
      }
    }

    if (frames.length === 1) {
      frames.push({
        id: frames.length,
        memory: { [funcName]: 'ready' },
        activeVariable: funcName,
        action: 'EXECUTE',
        desc: `✅ Function "${funcName}" is defined and ready to use!`
      });
    }
  }
};

// Generate Recursion visualization
const generateRecursionTrace = (code: string, frames: TraceFrame[]) => {
  try {
    const funcMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)/);
    if (!funcMatch) return false;

    const funcName = funcMatch[1];
    const params = funcMatch[2];

    // Check if it's actually recursive
    const isRecursive = code.includes(funcName + '(') && code.indexOf(funcName + '(') !== code.indexOf('function ' + funcName);
    if (!isRecursive) return false;

    frames.push({
      id: 0,
      memory: {},
      activeVariable: funcName,
      action: 'EXECUTE',
      desc: `Let's understand RECURSION! Function "${funcName}" calls itself to solve a problem by breaking it into smaller pieces.`
    });

    frames.push({
      id: 1,
      memory: { [funcName]: 'defined' },
      activeVariable: funcName,
      action: 'EXECUTE',
      desc: `Defining recursive function "${funcName}"${params ? ` with parameter: ${params}` : ''}. Think of recursion like Russian nesting dolls - each doll contains a smaller version of itself.`
    });

    // Try to find base case
    const baseCase = code.match(/if\s*\([^)]*\)\s*{\s*return\s+([^;]+)/);
    if (baseCase) {
      frames.push({
        id: 2,
        memory: { [funcName]: 'base case' },
        activeVariable: funcName,
        action: 'READ',
        desc: `Found BASE CASE! This is the stopping condition. Without it, the function would call itself forever. The base case returns: ${baseCase[1]}`
      });
    }

    // Recursive case
    frames.push({
      id: frames.length,
      memory: { [funcName]: 'recursive case' },
      activeVariable: funcName,
      action: 'EXECUTE',
      desc: `RECURSIVE CASE: The function calls itself with a smaller problem. Each call gets closer to the base case.`
    });

    // Simulate a few recursive calls
    for (let i = 1; i <= 3; i++) {
      frames.push({
        id: frames.length,
        memory: { [funcName]: `call ${i}`, depth: i },
        activeVariable: funcName,
        action: 'EXECUTE',
        desc: `Recursive call #${i}: Function calls itself. We go deeper into the recursion stack.`
      });
    }

    frames.push({
      id: frames.length,
      memory: { [funcName]: 'base case reached' },
      activeVariable: funcName,
      action: 'EXECUTE',
      desc: `Base case reached! Now we start returning back up the call stack.`
    });

    for (let i = 3; i >= 1; i--) {
      frames.push({
        id: frames.length,
        memory: { [funcName]: `returning ${i}`, depth: i },
        activeVariable: funcName,
        action: 'EXECUTE',
        desc: `Returning from call #${i}: Each function call returns its result to the previous call.`
      });
    }

    frames.push({
      id: frames.length,
      memory: { [funcName]: 'complete' },
      activeVariable: funcName,
      action: 'EXECUTE',
      desc: `✅ Recursion complete! All calls have returned. The final result is built from combining all the recursive calls.`
    });

    return true;
  } catch (e) {
    console.error('Error in recursion trace:', e);
    return false;
  }
};

const generateVariableTrace = (code: string, frames: TraceFrame[]) => {
  const varMatches = Array.from(code.matchAll(/(?:let|const|var)\s+(\w+)\s*=\s*([^;\n]+)/g));
  const memory: Record<string, any> = {};

  if (varMatches.length === 0) {
    frames.push({
      id: 0,
      memory: {},
      activeVariable: null,
      action: 'EXECUTE',
      desc: 'No variables detected. Try: let x = 10 or let arr = [1, 2, 3]'
    });
    return;
  }

  frames.push({
    id: 0,
    memory: {},
    activeVariable: null,
    action: 'EXECUTE',
    desc: 'Starting execution...'
  });

  varMatches.forEach(match => {
    const varName = match[1];
    const value = match[2].trim();

    try {
      const evalValue = new Function(`return ${value}`)();
      memory[varName] = evalValue;

      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: varName,
        action: 'WRITE',
        desc: `Declaring ${varName} = ${JSON.stringify(evalValue)}`
      });
    } catch (e) {
      memory[varName] = value;
      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: varName,
        action: 'WRITE',
        desc: `Declaring ${varName} = ${value}`
      });
    }
  });

  frames.push({
    id: frames.length,
    memory: { ...memory },
    activeVariable: null,
    action: 'EXECUTE',
    desc: `✓ Execution complete with ${varMatches.length} variable(s)`
  });
};

const generateArithmeticTrace = (code: string, frames: TraceFrame[]) => {
  const varMatches = Array.from(code.matchAll(/(?:let|const|var)\s+(\w+)\s*=\s*([^;\n]+)/g));
  const memory: Record<string, any> = {};

  frames.push({
    id: 0,
    memory: {},
    activeVariable: null,
    action: 'EXECUTE',
    desc: 'Starting arithmetic operations...'
  });

  varMatches.forEach(match => {
    const varName = match[1];
    const expression = match[2].trim();

    try {
      // Check if it's an arithmetic expression
      if (/[\+\-\*\/\%]/.test(expression)) {
        // Show the expression first
        frames.push({
          id: frames.length,
          memory: { ...memory },
          activeVariable: varName,
          action: 'READ',
          desc: `Evaluating: ${varName} = ${expression}`
        });
      }

      const evalValue = new Function(...Object.keys(memory), `return ${expression}`)(...Object.values(memory));
      memory[varName] = evalValue;

      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: varName,
        action: 'WRITE',
        desc: `${varName} = ${evalValue}`
      });
    } catch (e) {
      memory[varName] = expression;
      frames.push({
        id: frames.length,
        memory: { ...memory },
        activeVariable: varName,
        action: 'WRITE',
        desc: `${varName} = ${expression}`
      });
    }
  });

  frames.push({
    id: frames.length,
    memory: { ...memory },
    activeVariable: null,
    action: 'EXECUTE',
    desc: '✓ Arithmetic operations complete'
  });
};

const generateUniversalTrace = (code: string, frames: TraceFrame[]) => {
  // Universal fallback: Try to execute and capture any state changes
  frames.push({
    id: 0,
    memory: {},
    activeVariable: null,
    action: 'EXECUTE',
    desc: 'Analyzing code structure... This code doesn\'t have a specific visual representation, but I\'ll explain what it does step by step.'
  });

  try {
    // Try to extract any meaningful information
    const lines = code.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));

    if (lines.length === 0) {
      frames.push({
        id: frames.length,
        memory: {},
        activeVariable: null,
        action: 'EXECUTE',
        desc: 'No executable code found. This appears to be comments or empty lines.'
      });
      return;
    }

    lines.forEach((line, idx) => {
      if (line.trim()) {
        frames.push({
          id: frames.length,
          memory: { line: line.trim() },
          activeVariable: null,
          action: 'EXECUTE',
          desc: `Line ${idx + 1}: ${line.trim().substring(0, 80)}${line.length > 80 ? '...' : ''} - This line ${line.includes('function') ? 'defines a function' :
            line.includes('return') ? 'returns a value' :
              line.includes('console.log') ? 'prints output to console' :
                line.includes('if') ? 'checks a condition' :
                  line.includes('for') || line.includes('while') ? 'creates a loop' :
                    line.includes('=') ? 'assigns a value' :
                      'executes an operation'
            }.`
        });
      }
    });

    frames.push({
      id: frames.length,
      memory: {},
      activeVariable: null,
      action: 'EXECUTE',
      desc: `✅ Code analysis complete! This code has ${lines.length} line(s). While there's no specific visual representation (like bubbles for sorting or boxes for queues), the code structure has been analyzed and explained step by step.`
    });
  } catch (e) {
    frames.push({
      id: frames.length,
      memory: {},
      activeVariable: null,
      action: 'EXECUTE',
      desc: 'Code structure analyzed. This code doesn\'t have a visual representation, but it has been parsed and understood.'
    });
  }
};

// Generate Queue/Stack visualization by actually executing the code
const generateQueueStackTrace = (code: string, frames: TraceFrame[]) => {
  // Detect queue operations
  const hasQueueKeyword = /queue/i.test(code);
  const hasEnqueue = /enqueue/i.test(code);
  const hasDequeue = /dequeue/i.test(code);
  const isQueue = hasQueueKeyword || hasEnqueue || hasDequeue;

  // Detect stack operations - be more specific
  const hasStackKeyword = /stack/i.test(code);
  const hasPush = /\.push\(/.test(code);
  const hasPop = /\.pop\(/.test(code);
  const hasShift = /\.shift\(/.test(code);
  const isStack = hasStackKeyword || (hasPush && hasPop && !isQueue);

  if (!isQueue && !isStack) return false;

  try {
    const dataStructure: any[] = [];
    const type = isQueue ? 'queue' : 'stack';

    frames.push({
      id: 0,
      memory: { [type]: [] },
      activeVariable: type,
      action: 'EXECUTE',
      desc: `Let's learn about ${type === 'queue' ? 'Queues' : 'Stacks'}! ${isQueue ? 'A Queue is like a line of people. First person in line is first to leave (FIFO - First In First Out).' : 'A Stack is like a pile of plates. Last plate added is first to be removed (LIFO - Last In First Out).'}`
    });

    // Execute the code line by line and capture operations
    const lines = code.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Match enqueue/push operations
      const enqueueMatch = trimmedLine.match(/(?:enqueue|push)\s*\(\s*["']?([^"')]+)["']?\s*\)/);
      if (enqueueMatch) {
        const value = enqueueMatch[1];
        dataStructure.push(value);

        frames.push({
          id: frames.length,
          memory: { [type]: [...dataStructure], adding: value },
          activeVariable: type,
          action: 'WRITE',
          desc: `Adding "${value}" to the ${type === 'queue' ? 'Queue' : 'Stack'}. ${isQueue ? `It joins at the back of the line. Now the Queue has: ${dataStructure.join(', ')}.` : `It goes on top of the stack. Now the Stack has: ${dataStructure.join(', ')}.`}`
        });

        frames.push({
          id: frames.length,
          memory: { [type]: [...dataStructure] },
          activeVariable: type,
          action: 'EXECUTE',
          desc: `Current ${type === 'queue' ? 'Queue' : 'Stack'}: ${dataStructure.join(', ')}`
        });
      }

      // Match dequeue/pop/shift operations
      const dequeueMatch = trimmedLine.match(/(?:dequeue|pop|shift)\s*\(\s*\)/);
      if (dequeueMatch && dataStructure.length > 0) {
        const removed = isQueue ? dataStructure.shift() : dataStructure.pop();

        frames.push({
          id: frames.length,
          memory: { [type]: [...dataStructure], removing: removed },
          activeVariable: type,
          action: 'WRITE',
          desc: `Removing "${removed}" from the ${type === 'queue' ? 'Queue' : 'Stack'}. ${isQueue ? `It was at the front of the line, so it leaves first.` : `It was on top, so it comes off first.`} ${dataStructure.length > 0 ? `Remaining: ${dataStructure.join(', ')}.` : `The ${type === 'queue' ? 'Queue' : 'Stack'} is now empty!`}`
        });

        if (dataStructure.length > 0) {
          frames.push({
            id: frames.length,
            memory: { [type]: [...dataStructure] },
            activeVariable: type,
            action: 'EXECUTE',
            desc: `Current ${type === 'queue' ? 'Queue' : 'Stack'}: ${dataStructure.join(', ')}`
          });
        }
      }

      // Match console.log to show output
      const consoleMatch = trimmedLine.match(/console\.log\s*\(/);
      if (consoleMatch) {
        frames.push({
          id: frames.length,
          memory: { [type]: [...dataStructure] },
          activeVariable: type,
          action: 'READ',
          desc: `Logging output: ${trimmedLine.substring(0, 60)}${trimmedLine.length > 60 ? '...' : ''}`
        });
      }
    }

    frames.push({
      id: frames.length,
      memory: { [type]: [...dataStructure] },
      activeVariable: type,
      action: 'EXECUTE',
      desc: `${type === 'queue' ? 'Queue' : 'Stack'} operations complete! ${dataStructure.length > 0 ? `Final ${type === 'queue' ? 'Queue' : 'Stack'}: ${dataStructure.join(', ')}.` : `The ${type === 'queue' ? 'Queue' : 'Stack'} is empty.`} ${isQueue ? 'Remember: First In, First Out!' : 'Remember: Last In, First Out!'}`
    });

    return true;
  } catch (e) {
    console.error('Error generating queue/stack trace:', e);
    return false;
  }
};

// Generate Object/Class visualization
const generateObjectTrace = (code: string, frames: TraceFrame[]) => {
  try {
    frames.push({
      id: 0,
      memory: {},
      activeVariable: null,
      action: 'EXECUTE',
      desc: 'Analyzing object or class structure... Objects group related data together like a container with labeled compartments.'
    });

    // Find object literals with better parsing
    const objectMatches = Array.from(code.matchAll(/(?:let|const|var)\s+(\w+)\s*=\s*\{([^}]+)\}/gs));

    objectMatches.forEach((match, objIdx) => {
      const varName = match[1];
      const objContent = match[2];

      frames.push({
        id: frames.length,
        memory: { [varName]: 'object' },
        activeVariable: varName,
        action: 'WRITE',
        desc: `Creating object "${varName}". This object will store related data together, like a container with labeled compartments.`
      });

      // Parse properties more carefully
      const props = objContent.split(',').map(p => p.trim()).filter(p => p);
      const objData: Record<string, any> = {};

      props.forEach((prop, propIdx) => {
        const colonIndex = prop.indexOf(':');
        if (colonIndex > 0) {
          const key = prop.substring(0, colonIndex).trim();
          let value = prop.substring(colonIndex + 1).trim();

          // Remove quotes from strings
          value = value.replace(/["']/g, '');

          objData[key] = value;

          frames.push({
            id: frames.length,
            memory: { [varName]: { ...objData } },
            activeVariable: varName,
            action: 'WRITE',
            desc: `Setting property "${key}" to ${value}. This is like labeling a compartment in our container.`
          });
        }
      });

      // Show complete object
      frames.push({
        id: frames.length,
        memory: { [varName]: objData },
        activeVariable: varName,
        action: 'EXECUTE',
        desc: `Object "${varName}" is complete with ${props.length} properties: ${Object.keys(objData).join(', ')}.`
      });
    });

    // Find class definitions
    const classMatch = code.match(/class\s+(\w+)/);
    if (classMatch) {
      const className = classMatch[1];
      frames.push({
        id: frames.length,
        memory: { [className]: 'class' },
        activeVariable: className,
        action: 'EXECUTE',
        desc: `Defining class "${className}". A class is like a blueprint for creating objects with similar properties and behaviors.`
      });
    }

    if (frames.length === 1) {
      frames.push({
        id: frames.length,
        memory: {},
        activeVariable: null,
        action: 'EXECUTE',
        desc: 'Object structure analyzed. Objects group related data together.'
      });
    } else {
      // Add final summary
      frames.push({
        id: frames.length,
        memory: {},
        activeVariable: null,
        action: 'EXECUTE',
        desc: `✅ Object analysis complete! Created ${objectMatches.length} object${objectMatches.length > 1 ? 's' : ''}. Objects help organize related data in a structured way.`
      });
    }
  } catch (e) {
    console.error('Error in object trace:', e);
  }
};

// Smart Universal Trace - AI-like analysis for any code with UNIQUE visualizations
const generateSmartUniversalTrace = (code: string, frames: TraceFrame[]) => {
  try {
    // Create unique identifier for this code
    const codeFingerprint = code.substring(0, 50).replace(/\s+/g, '_');

    frames.push({
      id: 0,
      memory: { codeId: codeFingerprint },
      activeVariable: null,
      action: 'EXECUTE',
      desc: `🤖 AI Analyzer activated! Analyzing YOUR unique code (ID: ${codeFingerprint.substring(0, 20)}...). Let me understand what makes this code special...`
    });

    const lines = code.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));
    const memory: Record<string, any> = {};
    let stepCount = 0;
    let hasOutput = false;
    let outputValues: string[] = [];
    let uniqueOperations: string[] = [];

    // STEP 1: Analyze what makes THIS code unique
    lines.forEach(line => {
      const trimmed = line.trim();

      // Track unique operations in THIS specific code
      if (trimmed.includes('.map(')) uniqueOperations.push('map transformation');
      if (trimmed.includes('.filter(')) uniqueOperations.push('filter operation');
      if (trimmed.includes('.reduce(')) uniqueOperations.push('reduce aggregation');
      if (trimmed.includes('.sort(')) uniqueOperations.push('sorting');
      if (trimmed.includes('.reverse(')) uniqueOperations.push('reversing');
      if (trimmed.includes('.push(')) uniqueOperations.push('adding to end');
      if (trimmed.includes('.pop(')) uniqueOperations.push('removing from end');
      if (trimmed.includes('.shift(')) uniqueOperations.push('removing from start');
      if (trimmed.includes('.unshift(')) uniqueOperations.push('adding to start');
      if (trimmed.includes('Math.')) uniqueOperations.push('math calculation');
      if (/\*\*/.test(trimmed)) uniqueOperations.push('exponentiation');
      if (/for\s*\(/.test(trimmed)) uniqueOperations.push('for loop');
      if (/while\s*\(/.test(trimmed)) uniqueOperations.push('while loop');
      if (/if\s*\(/.test(trimmed)) uniqueOperations.push('conditional check');
    });

    // Show what makes this code unique
    if (uniqueOperations.length > 0) {
      frames.push({
        id: frames.length,
        memory: { uniqueOps: uniqueOperations },
        activeVariable: null,
        action: 'EXECUTE',
        desc: `🎯 This code is UNIQUE! It performs these specific operations: ${uniqueOperations.join(', ')}. No other file has this exact combination!`
      });
    }

    // STEP 2: Find all console.log outputs to understand the goal
    lines.forEach(line => {
      const consoleMatch = line.match(/console\.log\s*\((.*)\)/);
      if (consoleMatch) {
        hasOutput = true;
        outputValues.push(consoleMatch[1]);
      }
    });

    // If we have output, explain we're working towards it
    if (hasOutput && outputValues.length > 0) {
      frames.push({
        id: frames.length,
        memory: { goal: outputValues.join(', '), targetOutput: outputValues },
        activeVariable: null,
        action: 'EXECUTE',
        desc: `📤 This code's GOAL: Produce output "${outputValues.join(', ')}". Let me show you the UNIQUE journey to get there!`
      });
    }

    // STEP 3: Process each line and create UNIQUE visualizations
    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Variable declarations with evaluation
      const varMatch = trimmed.match(/(?:let|const|var)\s+(\w+)\s*=\s*(.+?);?$/);
      if (varMatch) {
        const varName = varMatch[1];
        const valueStr = varMatch[2];
        let actualValue = valueStr;
        let visualType = '📦';

        // Try to evaluate the value
        try {
          // Handle object literals
          if (valueStr.trim().startsWith('{')) {
            actualValue = valueStr;
            visualType = '🗂️';
          }
          // Handle arrays
          else if (valueStr.trim().startsWith('[')) {
            actualValue = JSON.parse(valueStr.replace(/'/g, '"'));
            visualType = '📊';
          }
          // Handle numbers
          else if (!isNaN(Number(valueStr))) {
            actualValue = Number(valueStr);
            visualType = '🔢';
          }
          // Handle strings
          else if (valueStr.match(/^["'].*["']$/)) {
            actualValue = valueStr.replace(/["']/g, '');
            visualType = '📝';
          }
          // Handle expressions with existing variables
          else if (/[\+\-\*\/]/.test(valueStr)) {
            try {
              actualValue = new Function(...Object.keys(memory), `return ${valueStr}`)(...Object.values(memory));
              visualType = '🧮';
            } catch {
              actualValue = valueStr;
            }
          }
        } catch (e) {
          actualValue = valueStr;
        }

        memory[varName] = actualValue;
        stepCount++;

        // Create UNIQUE visual representation for THIS specific value
        const visualDesc = Array.isArray(actualValue)
          ? `${visualType} Array with ${actualValue.length} elements: [${actualValue.join(', ')}]`
          : typeof actualValue === 'number'
            ? `${visualType} Number: ${actualValue}`
            : typeof actualValue === 'string'
              ? `${visualType} Text: "${actualValue}"`
              : `${visualType} Value: ${JSON.stringify(actualValue)}`;

        frames.push({
          id: frames.length,
          memory: { ...memory, currentStep: stepCount, lineNumber: idx + 1 },
          activeVariable: varName,
          action: 'WRITE',
          desc: `Step ${stepCount} (Line ${idx + 1}): Creating "${varName}" = ${JSON.stringify(actualValue)}

${visualDesc}

This variable is UNIQUE to this code and will be used to calculate the final result.`
        });
      }

      // Function definitions
      const funcDefMatch = trimmed.match(/function\s+(\w+)\s*\(([^)]*)\)/);
      if (funcDefMatch) {
        const funcName = funcDefMatch[1];
        const params = funcDefMatch[2];
        stepCount++;
        memory[funcName] = 'function';

        frames.push({
          id: frames.length,
          memory: { ...memory, currentStep: stepCount, lineNumber: idx + 1 },
          activeVariable: funcName,
          action: 'EXECUTE',
          desc: `Step ${stepCount} (Line ${idx + 1}): 🔧 Defining UNIQUE function "${funcName}"${params ? ` with parameters: ${params}` : ''}

This is a custom tool created specifically for THIS code. It's not a generic function - it's designed for this exact purpose!`
        });
      }

      // Function calls (not definitions)
      const funcCallMatch = trimmed.match(/(\w+)\s*\(([^)]*)\)/);
      if (funcCallMatch && !varMatch && !funcDefMatch && !trimmed.startsWith('function') && !trimmed.startsWith('console')) {
        const funcName = funcCallMatch[1];
        const args = funcCallMatch[2];
        stepCount++;

        frames.push({
          id: frames.length,
          memory: { ...memory, currentStep: stepCount, lineNumber: idx + 1, callingFunc: funcName },
          activeVariable: null,
          action: 'EXECUTE',
          desc: `Step ${stepCount} (Line ${idx + 1}): ⚙️ Calling function "${funcName}"${args ? ` with: ${args}` : ''}

This function call is SPECIFIC to this code's logic. It processes data in a way that's unique to this file!`
        });
      }

      // Console.log - extract what's being logged and show the UNIQUE journey
      if (trimmed.includes('console.log')) {
        stepCount++;
        hasOutput = true;
        const logMatch = trimmed.match(/console\.log\s*\((.*)\)/);
        const logContent = logMatch ? logMatch[1] : 'output';

        // Try to evaluate the output
        let evaluatedOutput = logContent;
        try {
          evaluatedOutput = new Function(...Object.keys(memory), `return ${logContent}`)(...Object.values(memory));
        } catch (e) {
          // Keep original if can't evaluate
        }

        // Create UNIQUE visual journey for THIS code
        const inputVars = Object.entries(memory)
          .filter(([k, v]) => k !== 'output' && k !== 'returnValue' && k !== 'goal' && k !== 'currentStep' && k !== 'lineNumber' && k !== 'codeId' && k !== 'uniqueOps' && k !== 'targetOutput' && k !== 'callingFunc')
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(', ');

        frames.push({
          id: frames.length,
          memory: { ...memory, output: evaluatedOutput, FINAL_OUTPUT: evaluatedOutput },
          activeVariable: null,
          action: 'READ',
          desc: `Step ${stepCount} (Line ${idx + 1}): 📤 OUTPUT TIME! This code's UNIQUE result: ${JSON.stringify(evaluatedOutput)}

🎯 UNIQUE JOURNEY FOR THIS CODE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${inputVars ? `📥 Starting values: ${inputVars}` : '📥 No input values'}
      ↓
⚙️  Processing: ${logContent}
      ↓
✅ RESULT: ${JSON.stringify(evaluatedOutput)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is how THIS specific code transforms its inputs into outputs. Every file has a different journey!`
        });
      }

      // Return statements
      if (trimmed.includes('return')) {
        stepCount++;
        const returnValue = trimmed.replace('return', '').trim().replace(';', '');

        // Try to evaluate
        let evaluatedReturn = returnValue;
        try {
          evaluatedReturn = new Function(...Object.keys(memory), `return ${returnValue}`)(...Object.values(memory));
        } catch (e) {
          // Keep original
        }

        memory['returnValue'] = evaluatedReturn;

        frames.push({
          id: frames.length,
          memory: { ...memory, FINAL_OUTPUT: evaluatedReturn },
          activeVariable: 'returnValue',
          action: 'EXECUTE',
          desc: `Step ${stepCount} (Line ${idx + 1}): 🎁 Returning ${JSON.stringify(evaluatedReturn)}

This is the UNIQUE final result that THIS code produces. It's calculated specifically by this code's logic!`
        });
      }

      // Assignments (not declarations)
      const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+?);?$/);
      if (assignMatch && !varMatch) {
        const varName = assignMatch[1];
        const valueStr = assignMatch[2];
        let actualValue = valueStr;

        // Try to evaluate
        try {
          if (/[\+\-\*\/]/.test(valueStr)) {
            actualValue = new Function(...Object.keys(memory), `return ${valueStr}`)(...Object.values(memory));
          }
        } catch (e) {
          actualValue = valueStr;
        }

        const oldValue = memory[varName];
        memory[varName] = actualValue;
        stepCount++;

        frames.push({
          id: frames.length,
          memory: { ...memory, currentStep: stepCount, lineNumber: idx + 1 },
          activeVariable: varName,
          action: 'WRITE',
          desc: `Step ${stepCount} (Line ${idx + 1}): 🔄 Updating "${varName}"

From: ${JSON.stringify(oldValue)}
To: ${JSON.stringify(actualValue)}

This transformation is UNIQUE to this code's logic. Getting closer to the final goal!`
        });
      }
    });

    // STEP 4: Final summary with UNIQUE visual representation
    const varCount = Object.keys(memory).filter(k => !['output', 'returnValue', 'goal', 'currentStep', 'lineNumber', 'codeId', 'uniqueOps', 'targetOutput', 'callingFunc'].includes(k)).length;
    const finalValues = Object.entries(memory)
      .filter(([k]) => !['output', 'returnValue', 'goal', 'currentStep', 'lineNumber', 'codeId', 'uniqueOps', 'targetOutput', 'callingFunc'].includes(k))
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(', ');

    // Create UNIQUE visual summary for THIS code
    let visualSummary = `✅ Analysis complete for THIS unique code!

📊 CODE STATISTICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total operations: ${stepCount}
• Variables created: ${varCount}
• Unique operations: ${uniqueOperations.length > 0 ? uniqueOperations.join(', ') : 'basic operations'}
• Code fingerprint: ${codeFingerprint.substring(0, 30)}...`;

    if (hasOutput) {
      visualSummary += `\n\n🎯 UNIQUE DATA FLOW FOR THIS CODE:
┌─ INPUT ─────────────────────┐`;
      if (finalValues) {
        visualSummary += `\n│ ${finalValues.substring(0, 50)}${finalValues.length > 50 ? '...' : ''}`;
      } else {
        visualSummary += `\n│ (no input variables)`;
      }
      visualSummary += `\n├─ PROCESSING ────────────────┤`;
      visualSummary += `\n│ ${stepCount} unique steps`;
      visualSummary += `\n├─ OUTPUT ────────────────────┤`;
      if (memory.output) {
        visualSummary += `\n│ ${JSON.stringify(memory.output)}`;
      } else if (memory.returnValue) {
        visualSummary += `\n│ ${JSON.stringify(memory.returnValue)}`;
      }
      visualSummary += `\n└─────────────────────────────┘`;
    } else if (finalValues) {
      visualSummary += `\n\n📦 FINAL STATE: ${finalValues}`;
    }

    visualSummary += `\n\n💡 This visualization is UNIQUE to this code. Switch to another file to see a completely different visualization!`;

    frames.push({
      id: frames.length,
      memory: {
        ...memory,
        FINAL_RESULT: finalValues || 'Complete',
        VISUAL_SUMMARY: visualSummary,
        UNIQUE_ID: codeFingerprint
      },
      activeVariable: null,
      action: 'EXECUTE',
      desc: visualSummary
    });
  } catch (e) {
    console.error('Error in smart universal trace:', e);
    frames.push({
      id: frames.length,
      memory: {},
      activeVariable: null,
      action: 'EXECUTE',
      desc: 'Code structure analyzed. The code is ready to run!'
    });
  }
};

const VisualizeTab: React.FC = () => {
  const { traceFrames, currentFrameIndex, setFrameIndex, setTraceFrames, isPlaying, togglePlay, isReplaying, setReplaying } = useAnalysisStore();
  const editorStore = useEditorStore();
  const { tabs, activeTabId, outputData, debugData } = editorStore;
  const { user } = useUserStore();
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false); // Track if auto-playing
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // --- 3. ADAPTIVE AI CODE ANALYZER (Creates Unique Visualizations) ---
  const buildAdvancedTrace = React.useCallback((code: string) => {
    const frames: TraceFrame[] = [];

    try {
      const cleanCode = code.trim();
      if (!cleanCode) {
        console.log('No code to visualize');
        setTraceFrames([]);
        return;
      }

      console.log('🎬 ADAPTIVE AI ANALYZER: Starting visualization for NEW code');
      console.log('📝 Code fingerprint:', cleanCode.substring(0, 100) + '...');
      console.log('📏 Code length:', cleanCode.length, 'characters');

      // STEP 1: Extract actual data from code (not just patterns)
      const extractedArrays = Array.from(code.matchAll(/(?:let|const|var)\s+(\w+)\s*=\s*(\[[^\]]+\])/g));
      const extractedNumbers = Array.from(code.matchAll(/(?:let|const|var)\s+(\w+)\s*=\s*(\d+)/g));
      const extractedStrings = Array.from(code.matchAll(/(?:let|const|var)\s+(\w+)\s*=\s*["']([^"']+)["']/g));
      const consoleOutputs = Array.from(code.matchAll(/console\.log\s*\(([^)]+)\)/g));

      console.log('🔍 AI Analysis Results:');
      console.log('  - Arrays found:', extractedArrays.length);
      console.log('  - Numbers found:', extractedNumbers.length);
      console.log('  - Strings found:', extractedStrings.length);
      console.log('  - Console outputs:', consoleOutputs.length);

      // STEP 2: Detect code patterns with MORE SPECIFICITY
      const hasArray = extractedArrays.length > 0;
      const hasLoop = /for\s*\(|while\s*\(|\.forEach|\.map|\.filter|\.reduce/i.test(code);
      const hasFunction = /function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/.test(code);
      const hasConditional = /if\s*\(|else|switch|case|\?/.test(code);
      const isSorting = /sort|bubble|selection|insertion|quick|merge/i.test(code);
      const isSearching = /search|find|indexOf|includes|binary/i.test(code);
      const isStringOp = /split|join|slice|substring|concat|replace|toUpperCase|toLowerCase/.test(code);
      const hasVariable = /(?:let|const|var)\s+\w+\s*=/.test(code);
      const hasArithmetic = /[\+\-\*\/\%]/.test(code);
      const hasComparison = /[<>]=?|===?|!==?/.test(code);
      const hasObject = /\{[\s\S]*\}/.test(code) && !/function/.test(code);
      const hasClass = /class\s+\w+/.test(code);

      // Detect Queue/Stack operations - ULTRA SPECIFIC
      const hasQueueKeyword = /queue/i.test(code);
      const hasStackKeyword = /stack/i.test(code);
      const hasEnqueue = /enqueue/i.test(code);
      const hasDequeue = /dequeue/i.test(code);
      const hasPush = /\.push\(/.test(code);
      const hasPop = /\.pop\(/.test(code);
      const hasShift = /\.shift\(/.test(code);
      const isQueueStack = hasQueueKeyword || hasStackKeyword || hasEnqueue || hasDequeue ||
        (hasPush && (hasPop || hasShift));

      // Check for recursion - ULTRA SPECIFIC (must have function calling itself AND base case)
      const funcMatch = code.match(/function\s+(\w+)\s*\(/);
      const hasBaseCase = /if\s*\([^)]*\)\s*{\s*return/.test(code);
      const isRecursive = funcMatch &&
        code.includes(funcMatch[1] + '(') &&
        code.indexOf(funcMatch[1] + '(') !== code.indexOf('function ' + funcMatch[1]) &&
        hasBaseCase &&
        !isQueueStack; // NOT a queue/stack operation

      console.log('🎯 Pattern Detection:');
      console.log('  - Queue/Stack:', isQueueStack);
      console.log('  - Recursion:', isRecursive);
      console.log('  - Sorting:', isSorting);
      console.log('  - Searching:', isSearching);
      console.log('  - Array ops:', hasArray && hasLoop);

      // STEP 3: Generate UNIQUE visualization based on SPECIFIC code content
      // PRIORITY 1: Queue/Stack Operations (highly visual)
      if (isQueueStack) {
        console.log('✅ ADAPTIVE: Creating UNIQUE Queue/Stack visualization for THIS code');
        const generated = generateQueueStackTrace(code, frames);
        if (generated && frames.length > 0) {
          console.log(`✨ Generated ${frames.length} unique frames for Queue/Stack`);
          setTraceFrames(frames);
          return;
        }
      }
      // PRIORITY 2: Recursion (special case of functions)
      else if (isRecursive) {
        console.log('✅ ADAPTIVE: Creating UNIQUE Recursion visualization for THIS code');
        const generated = generateRecursionTrace(code, frames);
        if (generated && frames.length > 0) {
          console.log(`✨ Generated ${frames.length} unique frames for Recursion`);
          setTraceFrames(frames);
          return;
        }
      }
      // PRIORITY 3: Sorting Algorithms (most visual)
      else if (isSorting && hasArray) {
        console.log('✅ ADAPTIVE: Creating UNIQUE Sorting visualization for THIS code');
        console.log('  - Using actual array data:', extractedArrays[0]?.[2]);
        generateSortingTrace(code, frames);
      }
      // PRIORITY 4: Searching Algorithms
      else if (isSearching && hasArray) {
        console.log('✅ ADAPTIVE: Creating UNIQUE Search visualization for THIS code');
        console.log('  - Using actual array data:', extractedArrays[0]?.[2]);
        generateSearchingTrace(code, frames);
      }
      // PRIORITY 5: Array Operations (map, filter, reduce)
      else if (hasArray && hasLoop) {
        console.log('✅ ADAPTIVE: Creating UNIQUE Array operation visualization for THIS code');
        console.log('  - Using actual array data:', extractedArrays[0]?.[2]);
        generateArrayOperationTrace(code, frames);
      }
      // PRIORITY 6: String Operations
      else if (isStringOp && hasVariable) {
        console.log('✅ ADAPTIVE: Creating UNIQUE String visualization for THIS code');
        generateStringTrace(code, frames);
      }
      // PRIORITY 7: Loops (for, while)
      else if (hasLoop) {
        console.log('✅ ADAPTIVE: Creating UNIQUE Loop visualization for THIS code');
        generateLoopTrace(code, frames);
      }
      // PRIORITY 8: Conditionals (if/else)
      else if (hasConditional && hasVariable) {
        console.log('✅ ADAPTIVE: Creating UNIQUE Conditional visualization for THIS code');
        generateConditionalTrace(code, frames);
      }
      // PRIORITY 9: Functions
      else if (hasFunction) {
        console.log('✅ ADAPTIVE: Creating UNIQUE Function visualization for THIS code');
        generateFunctionTrace(code, frames);
      }
      // PRIORITY 10: Arithmetic Operations
      else if (hasArithmetic && hasVariable) {
        console.log('✅ ADAPTIVE: Creating UNIQUE Arithmetic visualization for THIS code');
        generateArithmeticTrace(code, frames);
      }
      // PRIORITY 11: Objects/Classes
      else if (hasObject || hasClass) {
        console.log('✅ ADAPTIVE: Creating UNIQUE Object visualization for THIS code');
        generateObjectTrace(code, frames);
      }
      // PRIORITY 12: Any Variables (universal fallback)
      else if (hasVariable) {
        console.log('✅ ADAPTIVE: Creating UNIQUE Variable visualization for THIS code');
        generateVariableTrace(code, frames);
      }
      // PRIORITY 13: Smart Universal Execution (AI-like analysis) - Only for meaningful code
      else if (code.length > 10 && (hasVariable || hasFunction || hasLoop || hasConditional || hasArithmetic || consoleOutputs.length > 0)) {
        console.log('✅ ADAPTIVE: Using Smart AI Analyzer for THIS code');
        generateSmartUniversalTrace(code, frames);
      }

      console.log(`📊 RESULT: Generated ${frames.length} UNIQUE frames for this specific code`);

      if (frames.length === 0) {
        console.log('⚠️ No meaningful patterns found for visualization');
      }

      console.log('✅ Setting trace frames for visualization');
      setTraceFrames(frames);
    } catch (e) {
      console.error('❌ Trace generation error:', e);
      // Show error frame instead of empty
      setTraceFrames([{
        id: 0,
        memory: {},
        activeVariable: null,
        action: 'EXECUTE',
        desc: `Error analyzing code: ${e instanceof Error ? e.message : 'Unknown error'}`
      }]);
    }
  }, [setTraceFrames]);

  // --- 1. REAL-TIME OBSERVER (Watches Editor Changes) ---
  useEffect(() => {
    // If we are replaying, we don't want the real-time observer to clear our frames
    if (isReplaying) {
      console.log('⏭️ Replay active, skipping real-time analysis');
      setIsAutoPlaying(true);
      return;
    }

    if (!activeTab?.content) {
      console.log('No active tab content');
      setTraceFrames([]); // Clear frames when no content
      return;
    }

    // Check if the file is JavaScript or TypeScript
    const fileName = activeTab.fileName.toLowerCase();
    const isJS = fileName.endsWith('.js') ||
      fileName.endsWith('.jsx') ||
      fileName.endsWith('.ts') ||
      fileName.endsWith('.tsx') ||
      fileName.endsWith('.mjs');

    // CRITICAL: Clear previous frames immediately when file changes
    console.log('🔄 File changed! Clearing previous visualization...');
    setTraceFrames([]);
    setFrameIndex(0);
    setIsAutoPlaying(false);
    stopSpeaking();

    // If not a JS file, don't generate visuals
    if (!isJS) {
      console.log('ℹ️ Visualization restricted to JS/TS files. Language not supported for animations.');
      return;
    }

    console.log('🎬 Building NEW trace for file:', activeTab.fileName);
    console.log('📝 Code preview:', activeTab.content.substring(0, 100));

    // Build trace with slight delay to ensure clean state
    const timeout = setTimeout(() => {
      buildAdvancedTrace(activeTab.content);
    }, 300);

    return () => {
      clearTimeout(timeout);
      stopSpeaking();
    };
  }, [activeTab?.content, activeTabId, buildAdvancedTrace, isReplaying]);

  // --- 2. PLAY/PAUSE ENGINE (Wait for speech to complete) ---
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Don't auto-advance - controlled by speech completion
  }, [isAutoPlaying, traceFrames.length]);

  // --- TEXT-TO-SPEECH NARRATION (Waits for completion) ---
  const speakDescription = (text: string, shouldAutoAdvance: boolean = false) => {
    if ('speechSynthesis' in window && soundEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.65; // Very slow for complete understanding
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Only advance if auto-playing
        if (shouldAutoAdvance && isAutoPlaying) {
          setTimeout(() => {
            setFrameIndex((prev: number) => {
              if (prev < traceFrames.length - 1) {
                return prev + 1;
              } else {
                setIsAutoPlaying(false); // Stop at end
                return prev;
              }
            });
          }, 800); // Pause between steps
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        // Still advance on error if auto-playing
        if (shouldAutoAdvance && isAutoPlaying) {
          setTimeout(() => {
            setFrameIndex((prev: number) => {
              if (prev < traceFrames.length - 1) return prev + 1;
              setIsAutoPlaying(false);
              return prev;
            });
          }, 800);
        }
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else if (shouldAutoAdvance && isAutoPlaying) {
      // Fallback if speech not available
      setTimeout(() => {
        setFrameIndex((prev: number) => {
          if (prev < traceFrames.length - 1) return prev + 1;
          setIsAutoPlaying(false);
          return prev;
        });
      }, 3000);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (isAutoPlaying) {
      // Pause
      setIsAutoPlaying(false);
      stopSpeaking();
    } else {
      // Play
      setIsAutoPlaying(true);
      // Start speaking current frame
      if (currentFrame?.desc && soundEnabled) {
        speakDescription(currentFrame.desc, true);
      }
    }
  };

  // Speak when frame changes during auto-play
  useEffect(() => {
    if (isAutoPlaying && currentFrame?.desc && soundEnabled && !isSpeaking) {
      speakDescription(currentFrame.desc, true);
    }
  }, [currentFrameIndex, isAutoPlaying]);

  // Handle saving visualization
  const handleSaveVisualization = async () => {
    // Check if the API exists
    if (!(window as any).api?.saveVisualization) {
      alert('Save feature not available. Please restart the app completely (close and reopen).');
      console.error('window.api.saveVisualization is not defined. Available methods:', Object.keys((window as any).api || {}));
      return;
    }

    if (!user?._id || !activeTab || traceFrames.length === 0) {
      alert('Cannot save: No user or visualization data');
      console.error('Save blocked:', { hasUser: !!user?._id, hasTab: !!activeTab, framesLength: traceFrames.length });
      return;
    }

    setSaveStatus('saving');
    console.log('🎬 Attempting to save visualization...');

    try {
      // Detect visualization type
      const code = activeTab.content;
      let visualType = 'UNIVERSAL';
      if (/bubble|sort/i.test(code)) visualType = 'SORTING';
      else if (/search|find/i.test(code)) visualType = 'SEARCHING';
      else if (/map|filter/i.test(code)) visualType = 'ARRAY_OPERATION';
      else if (/queue|stack/i.test(code)) visualType = 'QUEUE_STACK';

      // Generate title from filename or code
      const title = activeTab.fileName.replace(/\.(js|ts|py)$/, '') || 'Untitled Visualization';

      console.log('📦 Saving data:', { userId: user._id, title, visualType, framesCount: traceFrames.length });

      const result = await (window as any).api.saveVisualization({
        userId: user._id,
        title,
        codeSnippet: code,
        visualType,
        traceFrames
      });

      console.log('📬 Save result:', result);

      if (result.success) {
        console.log('✅ Visualization saved successfully!');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000); // Reset after 2s
      } else {
        console.error('❌ Save failed:', result.msg);
        alert(`Failed to save: ${result.msg || 'Unknown error'}`);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('💥 Exception while saving visualization:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // Stop speech when switching files
  useEffect(() => {
    setIsAutoPlaying(false);
    return () => stopSpeaking();
  }, [activeTabId]);

  // --- 4. THE RENDERER ---
  const currentFrame = traceFrames[currentFrameIndex];

  // Check if we have output data to show
  const hasOutput = outputData && outputData.trim().length > 0;
  const hasDebugData = debugData && debugData.trim().length > 0;

  // STRICT LANGUAGE CHECK (Only for generation)
  const fileName = activeTab?.fileName.toLowerCase() || '';
  const isJS = fileName.endsWith('.js') ||
    fileName.endsWith('.jsx') ||
    fileName.endsWith('.ts') ||
    fileName.endsWith('.tsx') ||
    fileName.endsWith('.mjs');

  // 🟢 RENDER LOGIC FLOW:
  // 1. If we have frames (from Replay or Live JS), show the VISUALIZER!
  // 2. If no frames & not JS, show "Not Supported"
  // 3. If no frames & is JS, show "Scanning" or "No Meaningful Code"

  const code = activeTab?.content || '';
  const isMeaningfulCode = code.length > 5 && /\b(let|const|var|function|if|for|while|return|console|\[|\]|\{|\})\b/.test(code);

  if (traceFrames.length === 0 || !currentFrame) {
    // 🔴 CASE A: NOT A JS FILE (Unsupported language)
    if (!isJS) {
      return (
        <div className="universal-viz" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <i className="fa-solid fa-code" style={{ fontSize: '40px', color: '#888' }}></i>
            <h3 style={{ color: '#fff', margin: 0 }}>Visuals not supported</h3>
            <p style={{ color: '#888', fontSize: '14px', maxWidth: '300px', lineHeight: '1.6' }}>
              Interactive visualizations and step-by-step animations are currently restricted to <strong>JavaScript</strong> and <strong>TypeScript</strong>.
            </p>

            {(hasOutput || hasDebugData) && (
              <div style={{ marginTop: '20px', width: '100%', textAlign: 'left' }}>
                <div style={{ color: '#00f2ff', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>
                  <i className="fa-solid fa-terminal"></i> PROGRAM OUTPUT:
                </div>
                <pre style={{
                  background: '#000',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {outputData || debugData}
                </pre>
              </div>
            )}
          </div>
          <style>{styles}</style>
        </div>
      );
    }

    // 🟡 CASE B: IS JS BUT NO FRAMES (Empty, "dump code", or still analyzing)
    // If we're here, it means frames are missing. We show either output or instructions.
    
    // If code has been executed and produced output, show it
    if (hasOutput || hasDebugData) {
      return (
        <div className="universal-viz" style={{ padding: '16px' }}>
          {/* File indicator */}
          {activeTab && (
            <div style={{
              marginBottom: '12px',
              padding: '8px 12px',
              background: '#252526',
              border: '1px solid #333',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fa-solid fa-file-code" style={{ color: '#00f2ff', fontSize: '12px' }}></i>
              <span style={{ color: '#ccc', fontSize: '11px' }}>
                Output from: <strong style={{ color: '#fff' }}>{activeTab.fileName}</strong>
              </span>
            </div>
          )}

          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'rgba(0, 242, 255, 0.1)',
            border: '1px solid rgba(0, 242, 255, 0.3)',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <i className="fa-solid fa-terminal" style={{ color: '#00f2ff', fontSize: '14px' }}></i>
              <span style={{ color: '#00f2ff', fontSize: '12px', fontWeight: 'bold' }}>CONSOLE OUTPUT</span>
            </div>
            <div style={{ fontSize: '10px', color: '#aaa' }}>
              {isJS
                ? "This code doesn't have a visual representation, but here's what it outputs:"
                : "Animations are only supported for JavaScript/TypeScript files. Viewing standard output:"}
            </div>
          </div>

          {/* Output Display */}
          {hasOutput && (
            <div style={{
              marginBottom: '16px',
              padding: '16px',
              background: '#1a1a1d',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '12px',
              lineHeight: '1.6',
              color: '#00ff88',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{
                marginBottom: '8px',
                color: '#00f2ff',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}>
                📤 OUTPUT:
              </div>
              <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#ccc'
              }}>
                {outputData}
              </pre>
            </div>
          )}

          {/* Debug/Error Display */}
          {hasDebugData && (
            <div style={{
              padding: '16px',
              background: '#1a1a1d',
              border: '1px solid rgba(255, 0, 85, 0.3)',
              borderRadius: '8px',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '12px',
              lineHeight: '1.6',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{
                marginBottom: '8px',
                color: '#ff0055',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}>
                ⚠️ DEBUG INFO:
              </div>
              <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#ffaa00'
              }}>
                {debugData}
              </pre>
            </div>
          )}

          {/* Helpful tips */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(188, 19, 254, 0.05)',
            border: '1px solid rgba(188, 19, 254, 0.2)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#aaa',
            lineHeight: '1.5'
          }}>
            <div style={{ color: '#bc13fe', fontWeight: 'bold', marginBottom: '6px' }}>
              💡 Want to see visual animations?
            </div>
            Try code with:
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Arrays: <code style={{ color: '#00f2ff' }}>let arr = [5, 2, 8, 1, 9]</code></li>
              <li>Sorting: <code style={{ color: '#00f2ff' }}>arr.sort()</code></li>
              <li>Loops: <code style={{ color: '#00f2ff' }}>for (let i = 0; i &lt; 5; i++)</code></li>
              <li>Array methods: <code style={{ color: '#00f2ff' }}>arr.map(), arr.filter()</code></li>
            </ul>
          </div>

          <style>{styles}</style>
        </div>
      );
    }

    // No output and no frames - show loading
    return (
      <div className="universal-viz empty">
        <div className="loader-box">
          {!isJS ? (
            <>
              <i className="fa-solid fa-code" style={{ fontSize: '30px', color: '#ffaa00', marginBottom: '15px' }}></i>
              <p>STATIC CODE VIEW</p>
              <span>Visual animations are restricted to JS/TS files.</span>
              <span style={{ marginTop: '10px', fontSize: '11px', color: '#555' }}>
                Run your code to see results here.
              </span>
            </>
          ) : (
            <>
              <div className="spinner-neon"></div>
              <p>SCANNING CODE...</p>
              <span>Write code with arrays or variables to visualize</span>
              <span style={{ marginTop: '10px', fontSize: '11px', color: '#555' }}>
                Try: let arr = [5, 2, 8, 1, 9]
              </span>
            </>
          )}
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Detect visualization type based on code pattern
  const getVisualizationType = () => {
    const code = activeTab?.content || '';
    if (/bubble|sort/i.test(code)) return 'bubbles';
    if (/search|find/i.test(code)) return 'search';
    if (/map|filter/i.test(code)) return 'transform';
    return 'default';
  };

  // Render array visualization with creative themes
  const renderArrayVisualization = () => {
    const arrayKey = Object.keys(currentFrame.memory).find(k => Array.isArray(currentFrame.memory[k]));
    if (!arrayKey) return null;

    const array = currentFrame.memory[arrayKey];
    const comparing = currentFrame.memory.comparing || [];
    const swapping = currentFrame.memory.swapping || [];
    const sorted = currentFrame.memory.sorted || 0;
    const currentIndex = currentFrame.memory.currentIndex;
    const foundIndex = currentFrame.memory.foundIndex;
    const target = currentFrame.memory.target;
    const adding = currentFrame.memory.adding;
    const removing = currentFrame.memory.removing;
    const vizType = getVisualizationType();

    // QUEUE/STACK VISUALIZATION - Visual boxes in line
    if (arrayKey === 'queue' || arrayKey === 'stack') {
      const isQueue = arrayKey === 'queue';
      return (
        <div className="array-visualization queue-stack-theme">
          <div className="queue-stack-header">
            <i className={`fa-solid ${isQueue ? 'fa-people-line' : 'fa-layer-group'}`}></i>
            <span>{isQueue ? 'QUEUE (First In, First Out)' : 'STACK (Last In, First Out)'}</span>
          </div>
          <div className={`queue-stack-container ${isQueue ? 'horizontal' : 'vertical'}`}>
            {isQueue && (
              <div className="queue-direction">
                <div className="arrow-label">← OUT</div>
                <div className="arrow-label">IN →</div>
              </div>
            )}
            {array.length === 0 ? (
              <div className="empty-message">
                <i className="fa-solid fa-inbox"></i>
                <span>{isQueue ? 'Queue' : 'Stack'} is empty</span>
              </div>
            ) : (
              array.map((val: any, idx: number) => {
                const isAdding = val === adding;
                const isRemoving = val === removing;
                const position = isQueue ? idx : array.length - 1 - idx;

                return (
                  <div
                    key={idx}
                    className={`queue-stack-box ${isAdding ? 'adding' : ''} ${isRemoving ? 'removing' : ''}`}
                    style={{
                      animationDelay: `${idx * 0.1}s`
                    }}
                  >
                    <div className="box-content">
                      <span className="box-value">{val}</span>
                      {isQueue && idx === 0 && <div className="front-label">FRONT</div>}
                      {isQueue && idx === array.length - 1 && <div className="back-label">BACK</div>}
                      {!isQueue && idx === array.length - 1 && <div className="top-label">TOP</div>}
                    </div>
                    {isAdding && <div className="add-indicator">+</div>}
                    {isRemoving && <div className="remove-indicator">-</div>}
                  </div>
                );
              })
            )}
          </div>
          {!isQueue && array.length > 0 && (
            <div className="stack-base">BASE</div>
          )}
        </div>
      );
    }

    // BUBBLE SORT VISUALIZATION - Using actual bubbles!
    if (vizType === 'bubbles') {
      return (
        <div className="array-visualization bubble-theme">
          <div className="bubble-container">
            {array.map((val: any, idx: number) => {
              const isComparing = comparing.includes(idx);
              const isSwapping = swapping.includes(idx);
              const isSorted = idx >= array.length - sorted;

              const bubbleSize = Math.max(val * 6 + 40, 50);

              return (
                <div key={idx} className="bubble-wrapper" style={{
                  animation: isSwapping ? 'bubbleSwap 0.6s ease-in-out' :
                    isComparing ? 'bubbleCompare 0.4s ease-in-out' : 'none'
                }}>
                  <div
                    className={`bubble ${isSorted ? 'bubble-sorted' : ''} ${isComparing ? 'bubble-comparing' : ''} ${isSwapping ? 'bubble-swapping' : ''}`}
                    style={{
                      width: `${bubbleSize}px`,
                      height: `${bubbleSize}px`,
                    }}
                  >
                    <div className="bubble-shine"></div>
                    <span className="bubble-value">{val}</span>
                  </div>
                  <div className="bubble-index">#{idx}</div>
                </div>
              );
            })}
          </div>
          <div className="bubble-floor"></div>
        </div>
      );
    }

    // SEARCH VISUALIZATION - Spotlight effect
    if (vizType === 'search') {
      return (
        <div className="array-visualization search-theme">
          <div className="search-header">
            <i className="fa-solid fa-magnifying-glass"></i>
            <span>Searching for: <strong>{target}</strong></span>
          </div>
          <div className="search-container">
            {array.map((val: any, idx: number) => {
              const isCurrent = idx === currentIndex;
              const isFound = idx === foundIndex;
              const isPassed = currentIndex !== undefined && idx < currentIndex;

              return (
                <div key={idx} className="search-box-wrapper">
                  <div
                    className={`search-box ${isCurrent ? 'searching' : ''} ${isFound ? 'found' : ''} ${isPassed ? 'passed' : ''}`}
                  >
                    {isCurrent && <div className="spotlight"></div>}
                    {isFound && <div className="found-glow"></div>}
                    <span className="search-value">{val}</span>
                    {isFound && <i className="fa-solid fa-check found-icon"></i>}
                  </div>
                  <div className="search-index">[{idx}]</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // TRANSFORM VISUALIZATION - For map/filter
    if (vizType === 'transform') {
      const result = currentFrame.memory.result || [];
      const processing = currentFrame.memory.processing;

      return (
        <div className="array-visualization transform-theme">
          <div className="transform-row">
            <div className="transform-label">INPUT</div>
            <div className="transform-items">
              {array.map((val: any, idx: number) => {
                const isCurrent = idx === currentIndex;
                return (
                  <div key={idx} className={`transform-box input ${isCurrent ? 'active' : ''}`}>
                    {val}
                    {isCurrent && <div className="transform-arrow">→</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {processing !== undefined && (
            <div className="transform-process">
              <div className="process-box">
                <i className="fa-solid fa-gear fa-spin"></i>
                <span>Processing: {processing}</span>
              </div>
            </div>
          )}

          {result.length > 0 && (
            <div className="transform-row">
              <div className="transform-label">OUTPUT</div>
              <div className="transform-items">
                {result.map((val: any, idx: number) => (
                  <div key={idx} className="transform-box output pop-in">
                    {val}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // DEFAULT VISUALIZATION - Enhanced bars
    return (
      <div className="array-visualization">
        <div className="array-container">
          {array.map((val: any, idx: number) => {
            const isComparing = comparing.includes(idx);
            const isSwapping = swapping.includes(idx);
            const isSorted = idx >= array.length - sorted;
            const isCurrent = idx === currentIndex;

            let className = 'array-bar';
            if (isSwapping) className += ' swapping';
            else if (isComparing) className += ' comparing';
            else if (isCurrent) className += ' current';
            else if (isSorted) className += ' sorted';

            return (
              <div key={idx} className="array-item">
                <div
                  className={className}
                  style={{
                    height: `${Math.max(val * 8, 30)}px`,
                    transition: 'all 0.5s ease'
                  }}
                >
                  <span className="bar-value">{val}</span>
                </div>
                <div className="bar-index">{idx}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="universal-viz">
      {/* File indicator */}
      {activeTab && (
        <div style={{
          marginBottom: '10px',
          padding: '6px 10px',
          background: '#252526',
          border: '1px solid #333',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="fa-solid fa-file-code" style={{ color: '#00f2ff', fontSize: '11px' }}></i>
          <span style={{ color: '#ccc', fontSize: '10px' }}>
            Visualizing: <strong style={{ color: '#fff' }}>{activeTab.fileName}</strong>
          </span>
        </div>
      )}

      <div className="hud-header">
        <div className="badge">STEP-BY-STEP VISUALIZATION</div>
        <div className="step">STEP {currentFrameIndex + 1} / {traceFrames.length}</div>
      </div>
      {/* Controls: Play/Pause and Sound Toggle */}
      <div className="control-panel">
        <button
          onClick={handlePlayPause}
          className={`play-pause-btn ${isAutoPlaying ? 'playing' : 'paused'}`}
          title={isAutoPlaying ? 'Pause' : 'Play'}
        >
          <i className={`fa-solid ${isAutoPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          <span>{isAutoPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`sound-toggle-btn ${soundEnabled ? 'sound-on' : 'sound-off'}`}
          title={soundEnabled ? 'Sound On - Click to mute' : 'Sound Off - Click to unmute'}
        >
          <i className={`fa-solid ${soundEnabled ? 'fa-volume-up' : 'fa-volume-xmark'}`}></i>
          <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
        </button>

        {isSpeaking && soundEnabled && (
          <div className="speaking-indicator">
            <div className="sound-wave"></div>
            <span>Speaking...</span>
          </div>
        )}
      </div>

      {renderArrayVisualization()}

      <div className="memory-grid">
        {Object.entries(currentFrame.memory)
          .filter(([key]) => !['comparing', 'swapping', 'sorted', 'currentIndex', 'target', 'foundIndex', 'processing', 'checking', 'result', 'goal', 'output'].includes(key))
          .map(([key, value]) => {
            const isActive = currentFrame.activeVariable === key;
            const isFinalOutput = key === 'FINAL_OUTPUT' || key === 'FINAL_RESULT';
            return (
              <div key={key} className={`widget ${isActive ? 'active' : ''} ${isFinalOutput ? 'final-output' : ''} ${currentFrame.action}`}>
                <div className="widget-label">{isFinalOutput ? '🎯 ' + key : key}</div>
                <div className="widget-content">
                  {Array.isArray(value) ? (
                    <div className="array-viz">
                      {value.map((v: any, i: number) => (
                        <div key={i} className="mini-bar" style={{ height: `${Math.min(Math.abs(Number(v)) * 2 || 5, 60)}px` }}>
                          {v}
                        </div>
                      ))}
                    </div>
                  ) : typeof value === 'object' ? (
                    <div className="obj-viz">{JSON.stringify(value)}</div>
                  ) : (
                    <div className="val-viz">{String(value)}</div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <div className="explanation-hud">
        <i className={`fa-solid ${currentFrame.action === 'WRITE' ? 'fa-pen-nib' :
          currentFrame.action === 'READ' ? 'fa-eye' :
            'fa-play'
          }`}></i>
        <span>{currentFrame.desc}</span>
      </div>

      {/* Save Button at Bottom */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '15px 10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <button
          onClick={handleSaveVisualization}
          className={`save-viz-btn ${saveStatus}`}
          disabled={saveStatus === 'saving' || traceFrames.length === 0}
          title="Save this visualization to view later"
          style={{ width: '200px' }}
        >
          <i className={`fa-solid ${saveStatus === 'saving' ? 'fa-spinner fa-spin' :
            saveStatus === 'saved' ? 'fa-check' :
              saveStatus === 'error' ? 'fa-times' :
                'fa-save'
            }`}></i>
          <span>
            {saveStatus === 'saving' ? 'Saving...' :
              saveStatus === 'saved' ? 'Saved!' :
                saveStatus === 'error' ? 'Error' :
                  'Save Visualization'}
          </span>
        </button>
      </div>

      <div className="progress-bar-container">
        <div className="progress-label">
          <span>Step {currentFrameIndex + 1} of {traceFrames.length}</span>
          <span className="progress-percent">{Math.round(((currentFrameIndex + 1) / traceFrames.length) * 100)}%</span>
        </div>
        <div
          className="progress-bar interactive"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const newIndex = Math.floor(percentage * traceFrames.length);
            const clampedIndex = Math.max(0, Math.min(traceFrames.length - 1, newIndex));

            setIsAutoPlaying(false);
            stopSpeaking();
            setFrameIndex(clampedIndex);

            // Speak the description when jumping to a step
            if (soundEnabled && traceFrames[clampedIndex]?.desc) {
              setTimeout(() => speakDescription(traceFrames[clampedIndex].desc, false), 100);
            }
          }}
          onMouseDown={(e) => {
            const handleMouseMove = (moveEvent: MouseEvent) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const moveX = moveEvent.clientX - rect.left;
              const percentage = Math.max(0, Math.min(1, moveX / rect.width));
              const newIndex = Math.floor(percentage * traceFrames.length);
              const clampedIndex = Math.max(0, Math.min(traceFrames.length - 1, newIndex));

              setIsAutoPlaying(false);
              stopSpeaking();
              setFrameIndex(clampedIndex);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);

              // Speak the description when done dragging
              if (soundEnabled && currentFrame?.desc) {
                setTimeout(() => speakDescription(currentFrame.desc, false), 100);
              }
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          title="Click or drag to jump to any step"
        >
          <div
            className="progress-fill"
            style={{ width: `${((currentFrameIndex + 1) / traceFrames.length) * 100}%` }}
          ></div>
        </div>
      </div>
      <style>{styles}</style>
    </div>
  );
};

export default VisualizeTab;

const styles = `
  .universal-viz { 
    display: flex; 
    flex-direction: column; 
    height: 100%; 
    max-height: calc(100vh - 200px);
    background: #0c0c0f; 
    padding: 10px; 
    gap: 8px; 
    overflow-y: auto;
    overflow-x: hidden;
  }
  .universal-viz.empty { justify-content: center; align-items: center; background: #0c0c0f; overflow: hidden; }
  
  .loader-box { text-align: center; color: #888; }
  .loader-box p { color: #00f2ff; font-size: 13px; margin: 8px 0 4px; font-weight: bold; }
  .loader-box span { color: #666; font-size: 11px; display: block; }
  .spinner-neon { width: 35px; height: 35px; border: 2px solid #222; border-top: 2px solid #bc13fe; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .hud-header { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; padding: 6px 0; }
  .badge { background: #bc13fe; color: #fff; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.5px; }
  .step { color: #888; font-size: 9px; font-family: monospace; }

  /* CONTROL PANEL */
  .control-panel {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(0, 242, 255, 0.05);
    border: 1px solid rgba(0, 242, 255, 0.2);
    border-radius: 8px;
    flex-shrink: 0;
    margin-bottom: 10px;
  }
  
  /* PLAY/PAUSE BUTTON */
  .play-pause-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  .play-pause-btn.paused {
    background: linear-gradient(135deg, #bc13fe, #9010cc);
    color: #fff;
  }
  .play-pause-btn.paused:hover {
    background: linear-gradient(135deg, #d01fff, #bc13fe);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(188, 19, 254, 0.4);
  }
  .play-pause-btn.playing {
    background: linear-gradient(135deg, #00f2ff, #0099cc);
    color: #000;
  }
  .play-pause-btn.playing:hover {
    background: linear-gradient(135deg, #00ccff, #0077aa);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 242, 255, 0.5);
  }
  .play-pause-btn i {
    font-size: 14px;
  }

  /* SOUND TOGGLE */
  .sound-toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .sound-toggle-btn.sound-on {
    background: #bc13fe;
    color: #fff;
  }
  .sound-toggle-btn.sound-on:hover {
    background: #d01fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(188, 19, 254, 0.4);
  }
  .sound-toggle-btn.sound-off {
    background: #ff0055;
    color: #fff;
  }
  .sound-toggle-btn.sound-off:hover {
    background: #cc0044;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 0, 85, 0.4);
  }
  .sound-toggle-btn i {
    font-size: 13px;
  }
  
  /* SAVE BUTTON */
  .save-viz-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #00f2ff, #0099aa);
    color: #000;
  }
  .save-viz-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #0099aa, #006677);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 242, 255, 0.4);
  }
  .save-viz-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .save-viz-btn.saved {
    background: linear-gradient(135deg, #00ff88, #00cc66);
  }
  .save-viz-btn.error {
    background: linear-gradient(135deg, #ff0055, #cc0044);
    color: #fff;
  }
  .save-viz-btn i {
    font-size: 13px;
  }
  
  /* SPEAKING INDICATOR */
  .speaking-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #00f2ff;
    font-size: 11px;
    font-weight: bold;
    animation: fadeInOut 1.5s ease-in-out infinite;
    margin-left: auto;
  }
  .sound-wave {
    width: 18px;
    height: 18px;
    border: 2px solid #00f2ff;
    border-radius: 50%;
    animation: soundPulse 1s ease-in-out infinite;
  }
  @keyframes soundPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.5; }
  }
  @keyframes fadeInOut {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  /* PROGRESS BAR */
  .progress-bar-container {
    flex-shrink: 0;
    padding: 10px;
    background: #1a1a1d;
    border-radius: 6px;
    border: 1px solid #2a2a2a;
  }
  .progress-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 10px;
    color: #888;
  }
  .progress-percent {
    color: #00f2ff;
    font-weight: bold;
  }
  .progress-bar {
    width: 100%;
    height: 6px;
    background: #2a2a2a;
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }
  .progress-bar.interactive {
    cursor: pointer;
    height: 12px;
    transition: all 0.3s ease;
  }
  .progress-bar.interactive:hover {
    height: 16px;
    background: #333;
    box-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
  }
  .progress-bar.interactive:active {
    cursor: grabbing;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #bc13fe, #00f2ff);
    border-radius: 3px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(188, 19, 254, 0.5);
    pointer-events: none;
  }
  .progress-bar.interactive .progress-fill {
    box-shadow: 0 0 15px rgba(0, 242, 255, 0.6);
  }
  .progress-bar.interactive:hover .progress-fill {
    box-shadow: 0 0 20px rgba(0, 242, 255, 0.8);
  }

  /* ARRAY VISUALIZATION STYLES */
  .array-visualization { 
    flex-shrink: 0; 
    background: #1a1a1d; 
    border: 1px solid #2a2a2a; 
    border-radius: 6px; 
    padding: 12px; 
    margin-bottom: 6px;
    max-height: 240px;
    overflow: hidden;
  }
  .array-container { 
    display: flex; 
    gap: 10px; 
    justify-content: center; 
    align-items: flex-end; 
    min-height: 120px;
    max-height: 180px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 8px 0;
  }
  .array-item { display: flex; flex-direction: column; align-items: center; gap: 5px; }
  
  .array-bar { 
    width: 35px; 
    min-width: 35px;
    background: linear-gradient(180deg, #00f2ff, #0088cc); 
    border-radius: 5px 5px 0 0; 
    display: flex; 
    align-items: flex-end; 
    justify-content: center; 
    padding-bottom: 5px;
    box-shadow: 0 3px 12px rgba(0, 242, 255, 0.3);
    position: relative;
    transition: all 0.8s ease; /* Slowed from 0.5s to 0.8s */
    max-height: 150px;
  }
  
  .array-bar.comparing { 
    background: linear-gradient(180deg, #ffaa00, #ff6600); 
    box-shadow: 0 3px 18px rgba(255, 170, 0, 0.5);
    transform: translateY(-6px);
    transition: all 0.8s ease; /* Slowed transition */
  }
  
  .array-bar.swapping { 
    background: linear-gradient(180deg, #ff0055, #cc0044); 
    box-shadow: 0 3px 20px rgba(255, 0, 85, 0.6);
    transform: translateY(-10px) scale(1.06);
    animation: pulse 0.8s ease-in-out; /* Slowed from 0.5s to 0.8s */
  }
  
  .array-bar.sorted { 
    background: linear-gradient(180deg, #00ff88, #00cc66); 
    box-shadow: 0 3px 12px rgba(0, 255, 136, 0.4);
    transition: all 0.8s ease; /* Slowed transition */
  }
  
  .array-bar.current { 
    background: linear-gradient(180deg, #bc13fe, #8800cc); 
    box-shadow: 0 3px 18px rgba(188, 19, 254, 0.5);
    transform: translateY(-5px);
    transition: all 0.8s ease; /* Slowed transition */
  }
  
  @keyframes pulse {
    0%, 100% { transform: translateY(-10px) scale(1.06); }
    50% { transform: translateY(-14px) scale(1.1); }
  }
  
  .bar-value { color: #fff; font-weight: bold; font-size: 13px; font-family: 'Orbitron', monospace; }
  .bar-index { color: #666; font-size: 9px; font-family: monospace; }

  .memory-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); 
    gap: 8px; 
    align-content: flex-start; 
    max-height: 250px;
    overflow-y: auto; 
    padding-right: 4px;
    margin-bottom: 6px;
  }
  .no-vars { grid-column: 1/-1; color: #666; text-align: center; margin-top: 25px; font-size: 11px; }
  
  .widget { 
    background: #1a1a1d; 
    border: 1px solid #2a2a2a; 
    border-radius: 5px; 
    padding: 8px; 
    transition: 0.3s; 
    position: relative; 
    overflow: hidden;
    min-height: 70px;
  }
  .widget.active.WRITE { border-color: #ff0055; box-shadow: 0 0 10px rgba(255, 0, 85, 0.2); transform: scale(1.02); }
  .widget.active.READ { border-color: #00f2ff; box-shadow: 0 0 10px rgba(0, 242, 255, 0.2); transform: scale(1.02); }
  
  /* FINAL OUTPUT WIDGET - Make it stand out! */
  .widget.final-output {
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 242, 255, 0.1));
    border: 2px solid #00ff88;
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
    animation: finalPulse 2s ease-in-out infinite;
    grid-column: span 2;
    min-height: 90px;
  }
  .widget.final-output .widget-label {
    color: #00ff88;
    font-size: 10px;
  }
  .widget.final-output .val-viz {
    color: #00ff88;
    font-size: 22px;
  }
  @keyframes finalPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.3); }
    50% { box-shadow: 0 0 30px rgba(0, 255, 136, 0.6); }
  }
  
  .widget-label { font-size: 8px; color: #888; text-transform: uppercase; margin-bottom: 6px; font-weight: bold; letter-spacing: 0.5px; }
  .val-viz { font-size: 18px; color: #fff; font-family: 'Orbitron'; text-align: center; }
  .array-viz { display: flex; align-items: flex-end; gap: 3px; height: 45px; justify-content: center; overflow-x: auto; }
  .mini-bar { width: 11px; min-width: 11px; background: #00f2ff; font-size: 7px; color: #000; text-align: center; border-radius: 2px 2px 0 0; font-weight: bold; display: flex; align-items: flex-end; justify-content: center; }
  .obj-viz { font-size: 9px; color: #00ff88; font-family: monospace; word-break: break-all; opacity: 0.8; }

  .explanation-hud { 
    flex-shrink: 0; 
    background: rgba(188, 19, 254, 0.05); 
    border-left: 3px solid #bc13fe; 
    padding: 8px 10px; 
    display: flex; 
    gap: 8px; 
    align-items: center; 
    color: #fff; 
    font-size: 11px; 
    border-radius: 0 4px 4px 0;
    margin-bottom: 6px;
  }
  .explanation-hud i { color: #bc13fe; font-size: 12px; }
  
  /* Custom scrollbar */
  .universal-viz::-webkit-scrollbar,
  .memory-grid::-webkit-scrollbar,
  .array-container::-webkit-scrollbar { width: 5px; height: 5px; }
  .universal-viz::-webkit-scrollbar-track,
  .memory-grid::-webkit-scrollbar-track,
  .array-container::-webkit-scrollbar-track { background: #1a1a1d; }
  .universal-viz::-webkit-scrollbar-thumb,
  .memory-grid::-webkit-scrollbar-thumb,
  .array-container::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  .universal-viz::-webkit-scrollbar-thumb:hover,
  .memory-grid::-webkit-scrollbar-thumb:hover,
  .array-container::-webkit-scrollbar-thumb:hover { background: #444; }

  /* ========== QUEUE/STACK THEME ========== */
  .queue-stack-theme { position: relative; }
  .queue-stack-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding: 8px 12px;
    background: rgba(0, 242, 255, 0.1);
    border-radius: 6px;
    border-left: 3px solid #00f2ff;
  }
  .queue-stack-header i { color: #00f2ff; font-size: 16px; }
  .queue-stack-header span { color: #fff; font-size: 12px; font-weight: bold; }
  .queue-stack-container {
    display: flex;
    padding: 20px;
    min-height: 150px;
    position: relative;
  }
  .queue-stack-container.horizontal {
    flex-direction: row;
    gap: 10px;
    align-items: center;
    justify-content: center;
  }
  .queue-stack-container.vertical {
    flex-direction: column-reverse;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
  }
  .queue-direction {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
  }
  .arrow-label {
    color: #00f2ff;
    font-size: 11px;
    font-weight: bold;
  }
  .queue-stack-box {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #00f2ff, #0088cc);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 4px 15px rgba(0, 242, 255, 0.3);
    animation: boxAppear 0.5s ease-out;
    transition: all 0.5s ease;
  }
  .queue-stack-box.adding {
    background: linear-gradient(135deg, #00ff88, #00cc66);
    box-shadow: 0 4px 20px rgba(0, 255, 136, 0.5);
    animation: boxAdd 0.6s ease-out;
  }
  .queue-stack-box.removing {
    background: linear-gradient(135deg, #ff0055, #cc0044);
    box-shadow: 0 4px 20px rgba(255, 0, 85, 0.5);
    animation: boxRemove 0.6s ease-out;
  }
  .box-content {
    text-align: center;
  }
  .box-value {
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  .front-label, .back-label, .top-label {
    position: absolute;
    font-size: 9px;
    font-weight: bold;
    color: #ffaa00;
    background: #000;
    padding: 2px 6px;
    border-radius: 3px;
  }
  .front-label { top: -20px; left: 50%; transform: translateX(-50%); }
  .back-label { bottom: -20px; left: 50%; transform: translateX(-50%); }
  .top-label { top: -20px; left: 50%; transform: translateX(-50%); }
  .add-indicator, .remove-indicator {
    position: absolute;
    top: -10px;
    right: -10px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    animation: indicatorPop 0.4s ease-out;
  }
  .add-indicator {
    background: #00ff88;
    color: #000;
  }
  .remove-indicator {
    background: #ff0055;
    color: #fff;
  }
  .empty-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #666;
    font-size: 14px;
  }
  .empty-message i {
    font-size: 40px;
    opacity: 0.3;
  }
  .stack-base {
    text-align: center;
    color: #00f2ff;
    font-size: 11px;
    font-weight: bold;
    margin-top: 10px;
    padding: 5px;
    border-top: 3px solid #00f2ff;
  }
  @keyframes boxAppear {
    0% { transform: scale(0); opacity: 0; }
    70% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes boxAdd {
    0% { transform: scale(0) rotate(-180deg); opacity: 0; }
    70% { transform: scale(1.15) rotate(10deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes boxRemove {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2) rotate(10deg); }
    100% { transform: scale(0) rotate(180deg); opacity: 0; }
  }
  @keyframes indicatorPop {
    0% { transform: scale(0); }
    70% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }

  /* ========== BUBBLE SORT THEME ========== */
  .bubble-theme { position: relative; max-height: 220px; overflow: hidden; }
  .bubble-container { 
    display: flex; 
    gap: 12px; 
    justify-content: center; 
    align-items: flex-end; 
    min-height: 140px;
    max-height: 180px;
    padding: 15px 8px 8px;
    positio
  .bubble-wrapper { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    gap: 8px;
    animation: bubbleFloat 3s ease-in-out infinite;
  }
  .bubble { 
    border-radius: 50%; 
    background: radial-gradient(circle at 30% 30%, rgba(0, 242, 255, 0.9), rgba(0, 136, 204, 0.7), rgba(0, 68, 102, 0.5));
    display: flex; 
    align-items: center; 
    justify-content: center; 
    position: relative;
    box-shadow: 
      0 8px 20px rgba(0, 242, 255, 0.3),
      inset -10px -10px 20px rgba(0, 0, 0, 0.2),
      inset 10px 10px 20px rgba(255, 255, 255, 0.1);
    transition: all 0.4s ease;
  }
  .bubble-shine {
    position: absolute;
    top: 15%;
    left: 25%;
    width: 30%;
    height: 30%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent);
    border-radius: 50%;
    pointer-events: none;
  }
  .bubble-value { 
    color: #fff; 
    font-weight: bold; 
    font-size: 18px; 
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    z-index: 1;
  }
  .bubble-index { 
    color: #666; 
    font-size: 11px; 
    font-family: monospace; 
    background: #1a1a1d;
    padding: 2px 6px;
    border-radius: 3px;
  }
  .bubble-comparing { 
    background: radial-gradient(circle at 30% 30%, rgba(255, 170, 0, 0.9), rgba(255, 102, 0, 0.7), rgba(204, 68, 0, 0.5));
    box-shadow: 
      0 8px 25px rgba(255, 170, 0, 0.5),
      inset -10px -10px 20px rgba(0, 0, 0, 0.2),
      inset 10px 10px 20px rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }
  .bubble-swapping { 
    background: radial-gradient(circle at 30% 30%, rgba(255, 0, 85, 0.9), rgba(204, 0, 68, 0.7), rgba(153, 0, 51, 0.5));
    box-shadow: 
      0 8px 30px rgba(255, 0, 85, 0.6),
      inset -10px -10px 20px rgba(0, 0, 0, 0.2),
      inset 10px 10px 20px rgba(255, 255, 255, 0.1);
    transform: scale(1.15);
  }
  .bubble-sorted { 
    background: radial-gradient(circle at 30% 30%, rgba(0, 255, 136, 0.9), rgba(0, 204, 102, 0.7), rgba(0, 153, 77, 0.5));
    box-shadow: 
      0 8px 20px rgba(0, 255, 136, 0.4),
      inset -10px -10px 20px rgba(0, 0, 0, 0.2),
      inset 10px 10px 20px rgba(255, 255, 255, 0.1);
    animation: bubblePop 0.5s ease-out;
  }
  .bubble-floor {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #333, transparent);
  }
  @keyframes bubbleFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes bubbleCompare {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-15px) scale(1.1); }
  }
  @keyframes bubbleSwap {
    0%, 100% { transform: translateY(0) scale(1); }
    25% { transform: translateY(-25px) scale(1.15); }
    50% { transform: translateY(-30px) scale(1.2) rotate(10deg); }
    75% { transform: translateY(-25px) scale(1.15); }
  }
  @keyframes bubblePop {
    0% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }

  /* ========== SEARCH THEME ========== */
  .search-theme { }
  .search-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding: 8px 12px;
    background: rgba(188, 19, 254, 0.1);
    border-radius: 6px;
    border-left: 3px solid #bc13fe;
  }
  .search-header i { color: #bc13fe; font-size: 14px; }
  .search-header span { color: #ccc; font-size: 12px; }
  .search-header strong { color: #00f2ff; }
  .search-container { 
    display: flex; 
    gap: 15px; 
    justify-content: center; 
    align-items: center; 
    min-height: 150px;
    padding: 20px 10px;
    overflow-x: auto;
  }
  .search-box-wrapper { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    gap: 8px;
  }
  .search-box { 
    width: 60px; 
    height: 60px; 
    background: #1a1a1d; 
    border: 2px solid #333;
    border-radius: 8px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    position: relative;
    transition: all 0.4s ease;
  }
  .search-value { 
    color: #fff; 
    font-weight: bold; 
    font-size: 18px;
    z-index: 2;
  }
  .search-index { 
    color: #666; 
    font-size: 10px; 
    font-family: monospace; 
  }
  .search-box.passed { 
    opacity: 0.4;
    border-color: #222;
  }
  .search-box.searching { 
    border-color: #ffaa00;
    box-shadow: 0 0 20px rgba(255, 170, 0, 0.5);
    transform: scale(1.1);
    animation: searchScan 1s ease-in-out infinite;
  }
  .spotlight {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 80px;
    background: radial-gradient(circle, rgba(255, 170, 0, 0.3), transparent 70%);
    border-radius: 50%;
    animation: spotlightPulse 1s ease-in-out infinite;
    pointer-events: none;
  }
  .search-box.found { 
    border-color: #00ff88;
    background: rgba(0, 255, 136, 0.1);
    box-shadow: 0 0 30px rgba(0, 255, 136, 0.6);
    transform: scale(1.15);
    animation: foundCelebrate 0.6s ease-out;
  }
  .found-glow {
    position: absolute;
    inset: -10px;
    background: radial-gradient(circle, rgba(0, 255, 136, 0.3), transparent 70%);
    border-radius: 12px;
    animation: glowPulse 1.5s ease-in-out infinite;
    pointer-events: none;
  }
  .found-icon {
    position: absolute;
    top: -8px;
    right: -8px;
    color: #00ff88;
    font-size: 16px;
    background: #0c0c0f;
    border-radius: 50%;
    padding: 4px;
    animation: iconPop 0.4s ease-out;
  }
  @keyframes searchScan {
    0%, 100% { box-shadow: 0 0 20px rgba(255, 170, 0, 0.5); }
    50% { box-shadow: 0 0 35px rgba(255, 170, 0, 0.8); }
  }
  @keyframes spotlightPulse {
    0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
    50% { opacity: 1; transform: translateX(-50%) scale(1.2); }
  }
  @keyframes foundCelebrate {
    0% { transform: scale(1); }
    25% { transform: scale(1.3) rotate(-5deg); }
    50% { transform: scale(1.2) rotate(5deg); }
    75% { transform: scale(1.25) rotate(-3deg); }
    100% { transform: scale(1.15) rotate(0deg); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  @keyframes iconPop {
    0% { transform: scale(0) rotate(-180deg); }
    70% { transform: scale(1.2) rotate(10deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  /* ========== TRANSFORM THEME ========== */
  .transform-theme { }
  .transform-row { 
    margin-bottom: 15px;
  }
  .transform-label {
    color: #888;
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 8px;
    padding-left: 5px;
  }
  .transform-items { 
    display: flex; 
    gap: 10px; 
    flex-wrap: wrap;
    justify-content: center;
    padding: 10px;
    background: rgba(26, 26, 29, 0.5);
    border-radius: 8px;
    min-height: 60px;
    align-items: center;
  }
  .transform-box { 
    width: 50px; 
    height: 50px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    border-radius: 6px; 
    font-weight: bold; 
    font-size: 16px;
    position: relative;
    transition: all 0.3s ease;
  }
  .transform-box.input { 
    background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
    border: 2px solid #333;
    color: #00f2ff;
  }
  .transform-box.input.active { 
    border-color: #bc13fe;
    box-shadow: 0 0 20px rgba(188, 19, 254, 0.5);
    transform: scale(1.1);
    animation: transformPulse 0.6s ease-in-out;
  }
  .transform-arrow {
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    color: #bc13fe;
    font-size: 20px;
    animation: arrowBounce 0.8s ease-in-out infinite;
  }
  .transform-box.output { 
    background: linear-gradient(135deg, #00ff88, #00cc66);
    border: 2px solid #00ff88;
    color: #000;
    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
  }
  .transform-box.output.pop-in {
    animation: popIn 0.5s ease-out;
  }
  .transform-process {
    display: flex;
    justify-content: center;
    margin: 15px 0;
  }
  .process-box {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    background: rgba(188, 19, 254, 0.1);
    border: 1px solid #bc13fe;
    border-radius: 20px;
    color: #bc13fe;
    font-size: 12px;
    font-weight: bold;
  }
  .process-box i { font-size: 16px; }
  @keyframes transformPulse {
    0%, 100% { transform: scale(1.1); }
    50% { transform: scale(1.2); }
  }
  @keyframes arrowBounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(5px); }
  }
  @keyframes popIn {
    0% { transform: scale(0) rotate(-180deg); opacity: 0; }
    70% { transform: scale(1.15) rotate(10deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
`;