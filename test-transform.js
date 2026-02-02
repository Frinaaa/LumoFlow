// Map/Filter - Will show input → processing → output transformation!
const numbers = [1, 2, 3, 4, 5];

// Double each number
const doubled = numbers.map(num => num * 2);
console.log("Doubled:", doubled);

// Filter even numbers
const evens = numbers.filter(num => num % 2 === 0);
console.log("Evens:", evens);
