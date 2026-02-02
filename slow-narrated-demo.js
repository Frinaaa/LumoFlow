// SLOW NARRATED DEMO - Perfect for Learning!
// This demo has been optimized for student learning with:
// - Slower animations (2 seconds per step)
// - Slower speech (0.75x speed)
// - Human-friendly explanations

// Example 1: Bubble Sort with Detailed Narration
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

const numbers = [5, 2, 8, 1, 9];
const sorted = bubbleSort(numbers);
console.log("Sorted:", sorted);

// HOW TO USE FOR BEST LEARNING:
// 
// 1. Click the PLAY button ▶️
//    - Animation runs at 2 seconds per step (nice and slow!)
//    - Watch the bubbles change color and move
//
// 2. Enable "Auto-narrate" checkbox ✅
//    - You'll hear a friendly voice explaining each step
//    - Speech is slowed down to 0.75x for clarity
//    - Perfect for understanding what's happening
//
// 3. Or click "Listen" 🔊 for individual steps
//    - Hear explanation of the current step only
//    - Great for reviewing specific moments
//
// 4. Use the slider to review
//    - Jump to any step you want to understand better
//    - Listen to that step's explanation again
//
// WHAT YOU'LL HEAR:
// - "Let's start! We have these numbers: 5, 2, 8, 1, 9..."
// - "Now comparing 5 and 2. Is 5 bigger than 2? Yes! So we need to swap them."
// - "Swapping! 5 moves to the right, and 2 moves to the left..."
// - "Great! After swapping, our array now looks like this: 2, 5, 8, 1, 9..."
// - And much more friendly, step-by-step guidance!
//
// VISUAL COLORS:
// 🔵 Blue bubbles = Normal state
// 🟠 Orange bubbles = Comparing two numbers
// 🔴 Red bubbles = Swapping positions
// 🟢 Green bubbles = Sorted and locked in place!
