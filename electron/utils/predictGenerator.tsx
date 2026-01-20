import React from 'react';

export interface Question {
  id: number;
  code: React.ReactNode;
  options: string[];
  correctIndex: number;
}

// Helpers for syntax highlighting
const K = ({ c }: { c: string }) => <span className="kw">{c}</span>;
const F = ({ c }: { c: string }) => <span className="fn">{c}</span>;
const S = ({ c }: { c: string }) => <span className="str">{c}</span>;
const N = ({ c }: { c: string | number }) => <span className="num">{c}</span>;

// Shuffle Helper
const shuffleOptions = (correct: string, distractors: string[]) => {
  const all = [correct, ...distractors];
  // Fisher-Yates
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return {
    options: all,
    correctIndex: all.indexOf(correct)
  };
};

// --- TEMPLATES ---

const genCoercion = (id: number): Question => {
  const num = Math.floor(Math.random() * 50) + 1;
  const strVal = `"${num}"`;
  
  // Logic: 10 + "20" = "1020"
  const { options, correctIndex } = shuffleOptions(`"${num}20"`, [`${num + 20}`, "NaN", "Error"]);

  return {
    id,
    code: (
      <>
        <K c="let"/> x = <S c={strVal} />;<br/>
        <K c="let"/> y = <N c={20} />;<br/>
        console.log(x + y);
      </>
    ),
    options,
    correctIndex
  };
};

const genArrayMethod = (id: number): Question => {
  const arr = [1, 2, 3];
  const method = Math.random() > 0.5 ? 'push' : 'pop';
  
  let correct, distractors;
  let codeSnippet;

  if (method === 'push') {
    // Push returns new length
    correct = "4";
    distractors = ["[1, 2, 3, 4]", "undefined", "3"];
    codeSnippet = (
      <>
        <K c="const"/> arr = [<N c="1"/>, <N c="2"/>, <N c="3"/>];<br/>
        console.log(arr.<F c="push"/>(<N c="4"/>));
      </>
    );
  } else {
    // Pop returns removed element
    correct = "3";
    distractors = ["[1, 2]", "2", "undefined"];
    codeSnippet = (
      <>
        <K c="const"/> arr = [<N c="1"/>, <N c="2"/>, <N c="3"/>];<br/>
        console.log(arr.<F c="pop"/>());
      </>
    );
  }

  const { options, correctIndex } = shuffleOptions(correct, distractors);

  return {
    id,
    code: codeSnippet,
    options,
    correctIndex
  };
};

const genTypeof = (id: number): Question => {
  const types = [
    { val: <N c="null"/>, res: '"object"', wrong: ['"null"', '"undefined"', '"number"'] },
    { val: <S c='"text"'/>, res: '"string"', wrong: ['"text"', '"object"', '"array"'] },
    { val: <N c="NaN"/>, res: '"number"', wrong: ['"NaN"', '"undefined"', '"object"'] }
  ];
  
  const selected = types[Math.floor(Math.random() * types.length)];
  const { options, correctIndex } = shuffleOptions(selected.res, selected.wrong);

  return {
    id,
    code: (
      <>
        console.log(<K c="typeof"/> {selected.val});
      </>
    ),
    options,
    correctIndex
  };
};

const genScope = (id: number): Question => {
  const { options, correctIndex } = shuffleOptions("ReferenceError", ["10", "undefined", "null"]);

  return {
    id,
    code: (
      <>
        <K c="function"/> <F c="test"/>() {'{'}<br/>
        &nbsp;&nbsp;<K c="if"/> (<K c="true"/>) {'{'}<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;<K c="let"/> x = <N c="10"/>;<br/>
        &nbsp;&nbsp;{'}'}<br/>
        &nbsp;&nbsp;console.log(x);<br/>
        {'}'}<br/>
        <F c="test"/>();
      </>
    ),
    options,
    correctIndex
  };
};

// --- MAIN GENERATOR ---
export const getNextQuestion = (level: number): Question => {
  const generators = [genCoercion, genArrayMethod, genTypeof, genScope];
  // Pick random generator
  const randomGen = generators[Math.floor(Math.random() * generators.length)];
  return randomGen(level);
};