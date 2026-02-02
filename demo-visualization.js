// COMPREHENSIVE VISUALIZATION DEMO
// This file demonstrates all visualization features with audio narration

// 1. BUBBLE SORT - Watch bubbles float, compare, and swap!
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

const numbers = [8, 3, 7, 1, 5];
const sorted = bubbleSort(numbers);
console.log("Sorted:", sorted);

// TRY THIS:
// 1. Click the PLAY button to watch the animation
// 2. Click "Listen" to hear the explanation of each step
// 3. Enable "Auto-narrate" checkbox for automatic audio
// 4. Use the slider to jump to any step
// 5. Watch the bubbles change color as they compare and swap!
