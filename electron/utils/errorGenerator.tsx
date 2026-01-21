import React from 'react';

// Types
export type ErrorType = 'syntax' | 'ref' | 'type' | 'logic';

export interface ErrorCardData {
  id: number;
  type: ErrorType;
  color: string;
  code: React.ReactNode;
  hint: string;
}

// Data Pools
const VARS = ['userData', 'config', 'items', 'list', 'session', 'payload', 'buffer'];
const FUNCS = ['init', 'parse', 'fetch', 'render', 'load', 'handle'];

// Helper: Pick Random
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Syntax Highlighting Components
const K = ({ c }: { c: string }) => <span className="kwd">{c}</span>;
const V = ({ c }: { c: string }) => <span className="var">{c}</span>;
const F = ({ c }: { c: string }) => <span className="func">{c}</span>;
const E = ({ c }: { c: string }) => <span className="err-highlight" style={{borderBottom:'2px wavy red'}}>{c}</span>;

// --- GENERATOR TEMPLATES ---

const genSyntax = (id: number): ErrorCardData => {
  const v = pick(VARS);
  return {
    id, type: 'syntax', color: '#00f2ff',
    hint: "Unexpected token. Did you mean to close the parenthesis?",
    code: (
      <>
        <K c="if"/> ({v} === <span className="num">null</span> <E c="then"/> {'{'}<br/>
        &nbsp;&nbsp;console.log("Empty");<br/>
        {'}'}
      </>
    )
  };
};

const genRef = (id: number): ErrorCardData => {
  const v = pick(VARS);
  const v2 = v + "_val"; // undefined variable
  return {
    id, type: 'ref', color: '#bc13fe',
    hint: "You are trying to access a variable that hasn't been defined.",
    code: (
      <>
        <K c="const"/> {v} = <span className="num">10</span>;<br/>
        console.log(<E c={v2}/>); 
      </>
    )
  };
};

const genType = (id: number): ErrorCardData => {
  const v = pick(VARS);
  return {
    id, type: 'type', color: '#f72585',
    hint: ".map() is an Array method, but this variable is a Number.",
    code: (
      <>
        <K c="const"/> {v} = <span className="num">100</span>;<br/>
        {v}.<E c="map"/>(i ={'>'} i * 2);
      </>
    )
  };
};

const genLogic = (id: number): ErrorCardData => {
  return {
    id, type: 'logic', color: '#ff9f1c',
    hint: "This loop condition creates an infinite loop.",
    code: (
      <>
        <K c="while"/> (<K c="true"/>) {'{'}<br/>
        &nbsp;&nbsp;console.log("Running...");<br/>
        {'}'}
      </>
    )
  };
};

// --- MAIN FUNCTION ---
export const getNextErrorCard = (): ErrorCardData => {
  const generators = [genSyntax, genRef, genType, genLogic];
  const randGen = generators[Math.floor(Math.random() * generators.length)];
  return randGen(Date.now());
};