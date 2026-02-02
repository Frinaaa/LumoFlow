// QUEUE VISUALIZATION DEMO
// Watch how a queue works with visual boxes!

let queue = [];

function enqueue(val) {
  queue.push(val);
  console.log("Enqueue:", val, "Queue:", queue);
}

function dequeue() {
  let removed = queue.shift();
  console.log("Dequeue:", removed, "Queue:", queue);
}

// Add items to the queue
enqueue("A");
enqueue("B");
enqueue("C");
enqueue("D");

// Remove items from the queue
dequeue();
dequeue();

// ═══════════════════════════════════════════════════════════
// WHAT YOU'LL SEE
// ═══════════════════════════════════════════════════════════

// STAGE 1: Empty Queue
// Voice: "Let's learn about Queues! A Queue is like a line of people.
//         First person in line is first to leave (FIFO - First In First Out)."
// Visual: Empty queue container
// [You see an empty line]

// STAGE 2: Adding "A"
// Voice: "Adding 'A' to the Queue. It joins at the back of the line.
//         Now the Queue has: A."
// Visual: Green box appears with "A" inside
//         Label shows "FRONT" and "BACK"
// [You see the first person joining the line]

// STAGE 3: Adding "B"
// Voice: "Adding 'B' to the Queue. It joins at the back of the line.
//         Now the Queue has: A, B."
// Visual: Another green box appears with "B"
//         "A" is at FRONT, "B" is at BACK
// [You see the second person joining behind the first]

// STAGE 4: Adding "C"
// Voice: "Adding 'C' to the Queue. It joins at the back of the line.
//         Now the Queue has: A, B, C."
// Visual: Green box with "C" appears
//         Line grows: A (FRONT) → B → C (BACK)
// [You see the line getting longer]

// STAGE 5: Adding "D"
// Voice: "Adding 'D' to the Queue. It joins at the back of the line.
//         Now the Queue has: A, B, C, D."
// Visual: Green box with "D" appears
//         Full line: A (FRONT) → B → C → D (BACK)
// [You see a complete queue]

// STAGE 6: Removing "A"
// Voice: "Removing 'A' from the Queue. It was at the front of the line,
//         so it leaves first. Remaining: B, C, D."
// Visual: "A" box turns red and disappears
//         B moves to FRONT position
// [You see the first person leaving]

// STAGE 7: Removing "B"
// Voice: "Removing 'B' from the Queue. It was at the front of the line,
//         so it leaves first. Remaining: C, D."
// Visual: "B" box turns red and disappears
//         C moves to FRONT position
// [You see the second person leaving]

// STAGE 8: Final State
// Voice: "Queue operations complete! Final Queue: C, D.
//         Remember: First In, First Out!"
// Visual: Two boxes remain: C (FRONT) → D (BACK)
// [You see the remaining people in line]

// ═══════════════════════════════════════════════════════════
// VISUAL FEATURES
// ═══════════════════════════════════════════════════════════

// 📦 BOXES:
// - Each item is shown as a colorful box
// - Boxes are arranged horizontally (like a line)
// - Clear labels show FRONT and BACK

// 🟢 GREEN BOXES:
// - Appear when adding items
// - Pop in with rotation animation
// - Show the item being added

// 🔴 RED BOXES:
// - Appear when removing items
// - Fade out with rotation
// - Show the item being removed

// ➡️ DIRECTION ARROWS:
// - "← OUT" on the left (where items leave)
// - "IN →" on the right (where items join)
// - Clear visual flow

// 🎯 LABELS:
// - "FRONT" label on first item
// - "BACK" label on last item
// - Easy to understand positions

// ═══════════════════════════════════════════════════════════
// LEARNING BENEFITS
// ═══════════════════════════════════════════════════════════

// ✅ SEE THE LINE:
// - Visual representation of queue
// - Boxes arranged like people in line
// - Clear front and back

// ✅ WATCH ITEMS MOVE:
// - See items being added
// - See items being removed
// - Understand FIFO principle

// ✅ COLOR CODING:
// - Green = Adding
// - Red = Removing
// - Blue = Normal state

// ✅ COMPLETE JOURNEY:
// - Start with empty queue
// - Add multiple items
// - Remove items in order
// - See final state

// ═══════════════════════════════════════════════════════════
// TRY IT NOW!
// ═══════════════════════════════════════════════════════════

// 1. Click the green "Play" button
// 2. Watch boxes appear as items are added
// 3. See boxes disappear as items are removed
// 4. Understand First In, First Out!

// Perfect for learning data structures visually! 🎓✨
