// Search - Will show spotlight scanning effect!
function findNumber(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}

const data = [10, 20, 30, 40, 50];
const result = findNumber(data, 30);
console.log("Found at index:", result);
