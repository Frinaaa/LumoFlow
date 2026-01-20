import React from 'react';
import { PATTERNS, VARIABLES, FUNCTIONS } from './puzzleData';

export interface CodeFragment {
  id: string;
  content: React.ReactNode;
}

export interface PuzzleData {
  id: number;
  title: string;
  description: string;
  filename: string;
  hint: string;
  fragments: CodeFragment[]; 
  correctOrderIds: string[];
}

// 🟢 Helper: Convert string code to Colored JSX
const highlightSyntax = (line: string): React.ReactNode => {
  // Simple regex tokenizer for display purposes
  const parts = line.split(/(\s+|[(){}[\].,;])/g);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (/^(const|let|var|function|class|return|if|else|for|while|try|catch|async|await|throw|new|this|extends|super)$/.test(part)) 
          return <span key={index} className="kw">{part}</span>;
        if (/^\w+(?=\()/.test(part)) 
          return <span key={index} className="fn">{part}</span>;
        if (/^["'`].*["'`]$/.test(part)) 
          return <span key={index} className="str">{part}</span>;
        return <span key={index}>{part === ' ' ? '\u00A0' : part}</span>;
      })}
    </>
  );
};

// 🟢 Helper: Robust Shuffle
const shuffle = <T,>(array: T[]): T[] => {
  if (array.length <= 1) return array;
  
  let newArr = [...array];
  
  // Swap elements randomly
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }

  // Force Scramble: If it's still in order, swap the first two
  const isSame = newArr.every((item: any, idx) => item.id === (array[idx] as any).id);
  if (isSame) {
    [newArr[0], newArr[1]] = [newArr[1], newArr[0]];
  }
  
  return newArr;
};

// 🟢 Main Generator Function
export const getNextPuzzle = (level: number): PuzzleData => {
  // 1. Pick a RANDOM pattern (Infinite feel)
  const templateIndex = Math.floor(Math.random() * PATTERNS.length);
  const pattern = PATTERNS[templateIndex];

  // 2. Inject Random Variables (Dynamic generation)
  const v = VARIABLES[Math.floor(Math.random() * VARIABLES.length)];
  const f = FUNCTIONS[Math.floor(Math.random() * FUNCTIONS.length)];

  let rawCode = pattern.template
    .replace(/{v}/g, v)
    .replace(/{f}/g, f);

  // 3. Process Code Lines
  const rawLines = rawCode.split('\n');
  const fragments: CodeFragment[] = rawLines.map((line: string, idx: number) => ({
    id: `frag-${level}-${idx}`, // Unique IDs
    content: highlightSyntax(line)
  }));

  // 4. Save Correct Order
  const correctOrderIds = fragments.map(f => f.id);

  // 5. Create Shuffled Copy for Sidebar
  const shuffledFragments = shuffle(fragments);

  return {
    id: level,
    title: pattern.title,
    description: pattern.desc,
    filename: `${pattern.type.toLowerCase()}_level_${level}.js`,
    hint: pattern.hint,
    fragments: shuffledFragments,
    correctOrderIds: correctOrderIds
  };
};