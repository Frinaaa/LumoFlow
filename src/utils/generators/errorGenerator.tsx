import React from 'react';

export interface ErrorCardData {
  id: number;
  type: 'syntax' | 'ref' | 'type' | 'logic';
  code: React.ReactNode;
  hint: string;
  color: string;
}

const baseErrors: Omit<ErrorCardData, 'id'>[] = [
  {
    type: 'syntax',
    code: <>const x = 10<br/>console.log(x)</>,
    hint: 'Missing semicolon',
    color: '#ff6b6b'
  },
  {
    type: 'syntax',
    code: <>let data = {'{'} name: 'John' age: 25 {'}'}</>,
    hint: 'Missing comma between properties',
    color: '#ff6b6b'
  },
  {
    type: 'syntax',
    code: <>function test() {'{'}<br/>  return 5<br/>{'}'}</>,
    hint: 'Missing semicolon after return',
    color: '#ff6b6b'
  },
  {
    type: 'ref',
    code: <>console.log(y);<br/>let y = 5;</>,
    hint: 'Variable used before declaration',
    color: '#ffd93d'
  },
  {
    type: 'ref',
    code: <>function test() {'{'}<br/>  console.log(temp);<br/>{'}'}</>,
    hint: 'Undefined variable',
    color: '#ffd93d'
  },
  {
    type: 'ref',
    code: <>const obj = null;<br/>console.log(obj.name);</>,
    hint: 'Accessing property of null',
    color: '#ffd93d'
  },
  {
    type: 'type',
    code: <>let num = "5";<br/>num.toFixed(2);</>,
    hint: 'String method on number type',
    color: '#6bcf7f'
  },
  {
    type: 'type',
    code: <>let arr = "hello";<br/>arr.push('!');</>,
    hint: 'Array method on string',
    color: '#6bcf7f'
  },
  {
    type: 'type',
    code: <>let val = 42;<br/>val.toUpperCase();</>,
    hint: 'String method on number',
    color: '#6bcf7f'
  },
  {
    type: 'logic',
    code: <>if (x = 10) {'{'}<br/>  return true;<br/>{'}'}</>,
    hint: 'Assignment instead of comparison',
    color: '#4d96ff'
  },
  {
    type: 'logic',
    code: <>for (var i = 0; i {'<'} 10; i--) {'{'}<br/>  console.log(i);<br/>{'}'}</>,
    hint: 'Infinite loop - wrong increment',
    color: '#4d96ff'
  },
  {
    type: 'logic',
    code: <>if (x {'>'} 0 || y {'>'} 0) {'{'}<br/>  return true;<br/>{'}'}</>,
    hint: 'Should use AND not OR',
    color: '#4d96ff'
  }
];

function generateErrors(): ErrorCardData[] {
  const errors: ErrorCardData[] = [];
  
  // Generate 100 variations of each base error
  for (let i = 0; i < 100; i++) {
    baseErrors.forEach((error, idx) => {
      const id = i * baseErrors.length + idx + 1;
      errors.push({
        id,
        ...error
      });
    });
  }
  
  return errors;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

let allErrors = shuffleArray(generateErrors());
let sessionStartIndex = 0;

export function reshuffleErrors(): void {
  allErrors = shuffleArray(generateErrors());
  sessionStartIndex = Math.floor(Math.random() * allErrors.length);
}

export function getNextError(level: number): ErrorCardData {
  const index = (sessionStartIndex + level - 1) % allErrors.length;
  return allErrors[index];
}

export function getNextErrorCard(): ErrorCardData {
  const randomIndex = Math.floor(Math.random() * allErrors.length);
  return allErrors[randomIndex];
}

export function getTotalErrors(): number {
  return allErrors.length;
}
