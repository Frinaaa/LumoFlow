let arr = [2, 4, 6, 8, 10, 12];
let target = 8;

let low = 0, high = arr.length - 1;

while (low <= high) {
  let mid = Math.floor((low + high) / 2);
  // Logging the current state
  console.log(`Low=${low}, Mid=${mid}, High=${high}`);

  if (arr[mid] === target) {
    console.log("Found at index", mid);
    break;
  } else if (arr[mid] < target) {
    low = mid + 1;
  } else {
    high = mid - 1;
  }
}
