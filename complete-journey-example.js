// COMPLETE CODE JOURNEY - From Start to Output
// Watch how the code transforms data step by step!

// Starting with unsorted numbers
const numbers = [5, 2, 8, 1, 9, 3];

console.log("Original array:", numbers);

// Step 1: Sort the numbers (watch bubbles swap!)
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap happens here - watch the bubbles!
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

const sorted = bubbleSort(numbers);
console.log("After sorting:", sorted);

// WHAT YOU'LL SEE:
// 1. Blue bubbles appear (initial state)
// 2. Orange bubbles when comparing two numbers
// 3. Red bubbles when swapping positions
// 4. Green bubbles when in final sorted position
// 5. Each step is narrated with audio!

// HOW TO USE:
// 1. Click PLAY ▶️ to start the animation
// 2. Click "Listen" 🔊 to hear what's happening
// 3. Check "Auto-narrate" for continuous audio
// 4. Use ⏮️ ⏭️ to step through manually
// 5. Drag the slider to jump to any step

// The visualization shows EVERY step from the messy
// unsorted array to the beautifully sorted result!
