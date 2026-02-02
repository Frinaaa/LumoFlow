// COMPLETE JOURNEY VISUALIZATION
// Watch the code execute from start to finish with full explanations!

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

const numbers = [7, 3, 9, 2, 5, 1];
const sorted = bubbleSort(numbers);
console.log("Final sorted array:", sorted);

// ═══════════════════════════════════════════════════════════
// HOW TO USE - COMPLETE JOURNEY MODE
// ═══════════════════════════════════════════════════════════

// 🎬 PLAY BUTTON:
// - Click the green "Play" button to start
// - Voice will explain each step completely
// - Visual waits for voice to finish before moving
// - No rushing - you understand each step fully!

// ⏸️ PAUSE BUTTON:
// - Click the orange "Pause" button to stop
// - Voice stops immediately
// - Visual freezes on current step
// - Resume anytime by clicking Play again

// 🔊 SOUND TOGGLE:
// - Purple button = Sound ON (voice narration)
// - Red button = Sound OFF (silent mode)
// - Toggle anytime during playback

// ═══════════════════════════════════════════════════════════
// WHAT YOU'LL EXPERIENCE
// ═══════════════════════════════════════════════════════════

// STAGE 1: INITIAL STATE
// Voice: "Let's start! We have these numbers: 7, 3, 9, 2, 5, 1.
//         Our goal is to arrange them from smallest to largest."
// Visual: Shows all numbers as blue bubbles
// [You see the messy, unsorted array]

// STAGE 2: FIRST PASS BEGINS
// Voice: "Starting pass number 1. We'll look at each pair of 
//         numbers and swap them if they're in the wrong order."
// Visual: Bubbles prepare for comparison
// [You understand what's about to happen]

// STAGE 3: FIRST COMPARISON
// Voice: "Now comparing 7 and 3. Is 7 bigger than 3? Yes! 
//         So we need to swap them."
// Visual: Two bubbles turn orange (comparing)
// [You see which numbers are being compared]

// STAGE 4: SWAPPING
// Voice: "Swapping! 7 moves to the right, and 3 moves to the left. 
//         Watch them switch places!"
// Visual: Bubbles turn red and swap positions with animation
// [You watch the actual swap happening]

// STAGE 5: AFTER SWAP
// Voice: "Great! After swapping, our array now looks like this: 
//         3, 7, 9, 2, 5, 1. The bigger number moved to the right."
// Visual: Bubbles return to blue in new positions
// [You see the result of the swap]

// STAGE 6: NEXT COMPARISON
// Voice: "Now comparing 7 and 9. Is 7 bigger than 9? No, they 
//         are already in the correct order."
// Visual: Two bubbles turn orange briefly
// [You understand why no swap is needed]

// STAGE 7: CONTINUE COMPARING
// Voice: "These two are already in the correct order, so we 
//         don't need to swap. Moving on to the next pair."
// Visual: Bubbles stay in place
// [You see that not every comparison needs a swap]

// ... This continues for every comparison ...

// STAGE N-1: PASS COMPLETE
// Voice: "Pass 1 is complete! The largest number has bubbled up 
//         to its correct position. It's now locked in place and 
//         won't move anymore."
// Visual: Rightmost bubble turns green (sorted)
// [You see progress - one number is in final position]

// STAGE N: FINAL RESULT
// Voice: "Perfect! We're all done! The array is now completely 
//         sorted from smallest to largest: 1, 2, 3, 5, 7, 9. 
//         Every number is in its correct position!"
// Visual: All bubbles are green (sorted)
// [You see the complete, sorted array]

// ═══════════════════════════════════════════════════════════
// KEY FEATURES
// ═══════════════════════════════════════════════════════════

// ✅ WAITS FOR SPEECH TO COMPLETE:
// - Visual doesn't change until voice finishes
// - You have time to understand each explanation
// - No confusion from rapid changes
// - Speech rate: 0.65x (very slow and clear)

// ✅ COMPLETE EXPLANATIONS:
// - Every step is explained in detail
// - Uses questions and answers
// - Describes what you're seeing
// - Explains why things happen

// ✅ VISUAL JOURNEY:
// - See the initial messy state
// - Watch each comparison (orange bubbles)
// - See each swap (red bubbles with animation)
// - Track progress (green bubbles = sorted)
// - Celebrate the final sorted result

// ✅ COLOR-CODED STATES:
// 🔵 Blue = Normal, unsorted
// 🟠 Orange = Currently comparing
// 🔴 Red = Swapping positions
// 🟢 Green = Sorted and locked

// ✅ SMOOTH ANIMATIONS:
// - 0.8 second transitions
// - Bubbles float and move smoothly
// - Clear visual feedback
// - Easy to follow

// ✅ PROGRESS TRACKING:
// - Shows current step number
// - Shows total steps
// - Progress bar fills up
// - Percentage complete

// ═══════════════════════════════════════════════════════════
// LEARNING BENEFITS
// ═══════════════════════════════════════════════════════════

// FOR VISUAL LEARNERS:
// - See colors change
// - Watch elements move
// - Track progress visually
// - Understand through sight

// FOR AUDITORY LEARNERS:
// - Hear detailed explanations
// - Listen to reasoning
// - Understand through sound
// - Follow along with voice

// FOR KINESTHETIC LEARNERS:
// - Control playback speed
// - Pause to think
// - Resume when ready
// - Active participation

// FOR ALL LEARNERS:
// - Multi-sensory experience
// - Reinforced learning
// - Complete understanding
// - From start to finish

// ═══════════════════════════════════════════════════════════
// TRY IT NOW!
// ═══════════════════════════════════════════════════════════

// 1. Look at the "Visualize" tab in Analysis Panel
// 2. Click the green "Play" button
// 3. Watch and listen as each step is explained
// 4. See the complete journey from messy to sorted
// 5. Pause anytime to think about what you learned
// 6. Resume to continue the journey
// 7. Watch until all bubbles turn green!

// The visualization shows EVERY SINGLE STEP from the initial
// unsorted array to the final sorted result. Nothing is skipped!

// 🎓 Perfect for learning algorithms step by step! ✨
