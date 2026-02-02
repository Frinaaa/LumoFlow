// SELECTION SORT - With detailed WHY explanations
// Watch how we select the smallest element each time!

let numbers = [64, 25, 12, 22, 11];

// Selection sort algorithm
for (let i = 0; i < numbers.length - 1; i++) {
  let minIndex = i;
  
  // Find the minimum element in remaining unsorted array
  for (let j = i + 1; j < numbers.length; j++) {
    if (numbers[j] < numbers[minIndex]) {
      minIndex = j;
    }
  }
  
  // Swap the found minimum element with the first element
  if (minIndex !== i) {
    let temp = numbers[i];
    numbers[i] = numbers[minIndex];
    numbers[minIndex] = temp;
  }
}

console.log("Sorted array:", numbers);

// ═══════════════════════════════════════════════════════════
// WHAT YOU'LL SEE - WITH WHY EXPLANATIONS
// ═══════════════════════════════════════════════════════════

// STEP 1: Introduction
// Voice: "Let's start Selection Sort! We have: 64, 25, 12, 22, 11.
//         The strategy: Find the smallest number and move it to the
//         front, then repeat for the rest."
// Visual: All numbers shown

// STEP 2: Position 0 - Start
// Voice: "Position 0: We need to find the smallest number in the
//         remaining unsorted part [64, 25, 12, 22, 11] and put it here."
// Visual: Highlighting position 0

// STEP 3: Initial Minimum
// Voice: "Starting with 64 at position 0 as our current minimum.
//         Now let's check if there's anything smaller in the rest."
// Visual: 64 marked as current minimum

// STEP 4: Checking 25
// Voice: "Checking position 1: Found 25. Is 25 smaller than our
//         current minimum 64? YES! 25 < 64, so 25 is our new minimum."
// Visual: Comparing 64 and 25, 25 becomes new minimum

// STEP 5: New Minimum Found
// Voice: "Found a new minimum! 25 at position 1 is now the smallest
//         number we've seen. We'll remember this position."
// Visual: 25 highlighted as minimum

// STEP 6: Checking 12
// Voice: "Checking position 2: Found 12. Is 12 smaller than our
//         current minimum 25? YES! 12 < 25, so 12 is our new minimum."
// Visual: Comparing 25 and 12, 12 becomes new minimum

// STEP 7: New Minimum Found
// Voice: "Found a new minimum! 12 at position 2 is now the smallest
//         number we've seen. We'll remember this position."
// Visual: 12 highlighted as minimum

// STEP 8: Checking 22
// Voice: "Checking position 3: Found 22. Is 22 smaller than our
//         current minimum 12? No, 22 >= 12, so 12 is still the smallest."
// Visual: Comparing 12 and 22, 12 remains minimum

// STEP 9: Checking 11
// Voice: "Checking position 4: Found 11. Is 11 smaller than our
//         current minimum 12? YES! 11 < 12, so 11 is our new minimum."
// Visual: Comparing 12 and 11, 11 becomes new minimum

// STEP 10: Final Minimum
// Voice: "Found a new minimum! 11 at position 4 is now the smallest
//         number we've seen. We'll remember this position."
// Visual: 11 highlighted as minimum

// STEP 11: WHY We Swap
// Voice: "The smallest number in the unsorted part is 11 at position 4.
//         Let's swap it with position 0 (which has 64).
//         WHY? Because 11 is the smallest, it belongs at the front!"
// Visual: Showing swap between positions 0 and 4

// STEP 12: After Swap
// Voice: "Swapped! Now 11 is in position 0. Array is now: 11, 25, 12, 22, 64.
//         Position 0 is now sorted and locked in place!"
// Visual: 11 in green (sorted), rest in blue

// ... Process repeats for remaining positions ...

// FINAL STEP: Complete
// Voice: "Selection Sort complete! Every position now has the correct number.
//         Final sorted array: 11, 12, 22, 25, 64."
// Visual: All numbers in green (sorted)

// FINAL RESULT
// Voice: "FINAL RESULT: [11, 12, 22, 25, 64]. We started with
//         [64, 25, 12, 22, 11] and sorted it by repeatedly selecting
//         the smallest element!"
// Visual: Before and after comparison

// ═══════════════════════════════════════════════════════════
// KEY DIFFERENCES FROM BUBBLE SORT
// ═══════════════════════════════════════════════════════════

// SELECTION SORT:
// - Finds the minimum in each pass
// - Only ONE swap per pass
// - Explains WHY each element is chosen
// - Shows comparison with current minimum
// - Builds sorted array from left to right

// BUBBLE SORT:
// - Compares adjacent pairs
// - MULTIPLE swaps per pass
// - Largest bubbles to the end
// - Builds sorted array from right to left

// ═══════════════════════════════════════════════════════════
// LEARNING BENEFITS
// ═══════════════════════════════════════════════════════════

// ✅ UNDERSTAND WHY:
// - See why each element is selected
// - Understand the selection criteria
// - Learn the decision-making process

// ✅ SEE THE STRATEGY:
// - Find minimum in unsorted part
// - Place it at the front
// - Repeat for remaining elements

// ✅ COMPARE VALUES:
// - Watch comparisons happen
// - See when minimum changes
// - Understand the search process

// ✅ TRACK PROGRESS:
// - Sorted part grows from left
// - Unsorted part shrinks
// - Clear visual separation

// Perfect for understanding selection-based sorting! 🎓✨
