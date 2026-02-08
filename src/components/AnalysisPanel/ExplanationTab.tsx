import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../editor/stores/editorStore';

interface ExplanationTabProps {
  analysisData?: any;
}

const ExplanationTab: React.FC<ExplanationTabProps> = () => {
  const editorStore = useEditorStore();
  const [explanations, setExplanations] = useState<Array<{
    line: number;
    code: string;
    title: string;
    explanation: string;
    example: string;
  }>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<number | null>(null);

  // Get active tab code
  const activeTab = editorStore.tabs.find(t => t.id === editorStore.activeTabId);
  const code = activeTab?.content || '';
  const activeTabId = editorStore.activeTabId;

  // Generate explanations when code changes OR when active tab changes
  useEffect(() => {
    if (!code.trim()) {
      setExplanations([]);
      return;
    }

    console.log('🔄 Generating explanations for:', activeTab?.fileName);
    const generatedExplanations = generateCodeExplanations(code);
    setExplanations(generatedExplanations);

    // Stop any ongoing speech when switching files
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentSpeakingIndex(null);
  }, [code, activeTabId, activeTab?.fileName]);

  // Text-to-speech function
  const speakExplanation = (text: string, index: number) => {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    if (isSpeaking && currentSpeakingIndex === index) {
      setIsSpeaking(false);
      setCurrentSpeakingIndex(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for better understanding
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentSpeakingIndex(index);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSpeakingIndex(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentSpeakingIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Stop all speech when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!code.trim()) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#666'
      }}>
        <i className="fa-solid fa-code" style={{ fontSize: '48px', opacity: 0.3, marginBottom: '16px' }}></i>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>No Code to Explain</div>
        <div style={{ fontSize: '12px' }}>Write some code in the editor to see detailed explanations</div>
      </div>
    );
  }

  if (explanations.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#666'
      }}>
        <i className="fa-solid fa-circle-info" style={{ fontSize: '48px', opacity: 0.3, marginBottom: '16px' }}></i>
        <div style={{ fontSize: '14px' }}>Analyzing code...</div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '16px',
      background: '#1e1e1e'
    }}>
      {/* File indicator */}
      {activeTab && (
        <div style={{
          marginBottom: '16px',
          padding: '10px 12px',
          background: '#252526',
          border: '1px solid #333',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="fa-solid fa-file-code" style={{ color: '#00f2ff', fontSize: '14px' }}></i>
          <span style={{ color: '#ccc', fontSize: '12px' }}>
            Explaining: <strong style={{ color: '#fff' }}>{activeTab.fileName}</strong>
          </span>
        </div>
      )}

      <div style={{
        marginBottom: '20px',
        padding: '12px',
        background: 'rgba(0, 242, 255, 0.1)',
        border: '1px solid rgba(0, 242, 255, 0.3)',
        borderRadius: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <i className="fa-solid fa-graduation-cap" style={{ color: '#00f2ff', fontSize: '16px' }}></i>
          <span style={{ color: '#00f2ff', fontSize: '13px', fontWeight: 'bold' }}>Student-Friendly Explanations</span>
        </div>
        <div style={{ fontSize: '11px', color: '#aaa', lineHeight: '1.5' }}>
          Each section explains what the code does in simple language with examples.
          Click the speaker icon to hear the explanation!
        </div>
      </div>

      {explanations.map((item, index) => (
        <div
          key={index}
          style={{
            marginBottom: '16px',
            padding: '16px',
            background: '#252526',
            border: '1px solid #333',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}
        >
          {/* Header with line number and title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: '#00f2ff',
                color: '#000',
                padding: '2px 8px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                Line {item.line}
              </span>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>
                {item.title}
              </span>
            </div>
            <button
              onClick={() => speakExplanation(item.explanation, index)}
              style={{
                background: isSpeaking && currentSpeakingIndex === index ? '#00f2ff' : 'transparent',
                border: '1px solid #00f2ff',
                color: isSpeaking && currentSpeakingIndex === index ? '#000' : '#00f2ff',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!(isSpeaking && currentSpeakingIndex === index)) {
                  e.currentTarget.style.background = 'rgba(0, 242, 255, 0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (!(isSpeaking && currentSpeakingIndex === index)) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <i className={`fa-solid ${isSpeaking && currentSpeakingIndex === index ? 'fa-stop' : 'fa-volume-high'}`}></i>
              {isSpeaking && currentSpeakingIndex === index ? 'Stop' : 'Listen'}
            </button>
          </div>

          {/* Code snippet */}
          <div style={{
            background: '#1e1e1e',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '12px',
            border: '1px solid #333'
          }}>
            <code style={{
              color: '#d4d4d4',
              fontSize: '12px',
              fontFamily: 'Consolas, Monaco, monospace'
            }}>
              {item.code}
            </code>
          </div>

          {/* Explanation */}
          <div style={{
            marginBottom: '12px',
            padding: '12px',
            background: 'rgba(188, 19, 254, 0.05)',
            borderLeft: '3px solid #bc13fe',
            borderRadius: '4px'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#bc13fe',
              fontWeight: 'bold',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              What does this do?
            </div>
            <div style={{
              fontSize: '12px',
              color: '#ccc',
              lineHeight: '1.6'
            }}>
              {item.explanation}
            </div>
          </div>

          {/* Example */}
          {item.example && (
            <div style={{
              padding: '12px',
              background: 'rgba(0, 255, 136, 0.05)',
              borderLeft: '3px solid #00ff88',
              borderRadius: '4px'
            }}>
              <div style={{
                fontSize: '11px',
                color: '#00ff88',
                fontWeight: 'bold',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Example
              </div>
              <div style={{
                fontSize: '12px',
                color: '#ccc',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {item.example}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Function to generate student-friendly explanations
function generateCodeExplanations(code: string) {
  const lines = code.split('\n');
  const explanations: Array<{
    line: number;
    code: string;
    title: string;
    explanation: string;
    example: string;
  }> = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) return;

    const lineNumber = index + 1;

    // Variable declarations
    if (/^(const|let|var)\s+/.test(trimmedLine)) {
      const match = trimmedLine.match(/^(const|let|var)\s+(\w+)\s*=\s*(.+)/);
      if (match) {
        const [, keyword, varName, value] = match;
        explanations.push({
          line: lineNumber,
          code: trimmedLine,
          title: `Creating a Variable: ${varName}`,
          explanation: `This line creates a ${keyword === 'const' ? 'constant (unchangeable)' : 'variable (changeable)'} named "${varName}". Think of it like a box where we store information. ${keyword === 'const' ? 'Once we put something in this box, we cannot change it.' : 'We can change what\'s inside this box later.'}`,
          example: `Imagine you have a box labeled "${varName}". ${keyword === 'const' ? 'You write something on a piece of paper and seal it in the box forever.' : 'You can put different things in this box whenever you want.'}\n\nFor example:\n${keyword} ${varName} = ${value.replace(/;$/, '')}\nNow ${varName} contains: ${value.replace(/;$/, '')}`
        });
      }
    }

    // Function declarations
    else if (/^function\s+/.test(trimmedLine) || /^(const|let|var)\s+\w+\s*=\s*(\(.*\)|function)/.test(trimmedLine)) {
      const traditionalMatch = trimmedLine.match(/function\s+(\w+)\s*\((.*?)\)/);
      const arrowMatch = trimmedLine.match(/(const|let|var)\s+(\w+)\s*=\s*\((.*?)\)\s*=>/);

      if (traditionalMatch || arrowMatch) {
        const funcName = traditionalMatch ? traditionalMatch[1] : arrowMatch![2];
        const params = traditionalMatch ? traditionalMatch[2] : arrowMatch![3];
        explanations.push({
          line: lineNumber,
          code: trimmedLine,
          title: `Function: ${funcName}`,
          explanation: `This creates a function called "${funcName}". A function is like a recipe - it's a set of instructions that we can use over and over again. ${params.trim() ? `It needs some ingredients (parameters): ${params}` : 'It doesn\'t need any ingredients to work.'}`,
          example: `Think of "${funcName}" as a machine:\n- You give it inputs${params.trim() ? ` (${params})` : ''}\n- It does some work inside\n- It might give you back a result\n\nYou can use this machine whenever you need it by calling: ${funcName}(${params.trim() ? '...' : ''})`
        });
      }
    }

    // If statements
    else if (/^if\s*\(/.test(trimmedLine)) {
      const condition = trimmedLine.match(/if\s*\((.*?)\)/)?.[1];
      explanations.push({
        line: lineNumber,
        code: trimmedLine,
        title: 'Making a Decision (If Statement)',
        explanation: `This is a decision point. The code checks if something is true: "${condition}". If it's true, it will do what's inside the curly braces. If it's false, it will skip that part.`,
        example: `Think of it like this:\n"IF it's raining outside, THEN take an umbrella"\n\nIn this code:\nIF (${condition}) is true\nTHEN do the code inside { }\nOTHERWISE skip it`
      });
    }

    // For loops
    else if (/^for\s*\(/.test(trimmedLine)) {
      explanations.push({
        line: lineNumber,
        code: trimmedLine,
        title: 'Repeating Actions (For Loop)',
        explanation: `This is a loop - it repeats the same actions multiple times. Think of it like doing jumping jacks: you count from 1 to 10 and do a jumping jack each time. The loop does the same thing but with code!`,
        example: `Imagine you're counting:\n1, 2, 3, 4, 5...\n\nFor each number, you do something (the code inside { }).\n\nThis is useful when you want to:\n- Process each item in a list\n- Repeat an action a specific number of times\n- Go through data step by step`
      });
    }

    // While loops
    else if (/^while\s*\(/.test(trimmedLine)) {
      const condition = trimmedLine.match(/while\s*\((.*?)\)/)?.[1];
      explanations.push({
        line: lineNumber,
        code: trimmedLine,
        title: 'Repeating While True (While Loop)',
        explanation: `This keeps repeating as long as the condition "${condition}" is true. It's like saying "keep doing this until I tell you to stop". Be careful - if the condition never becomes false, it will run forever!`,
        example: `Think of it like:\n"WHILE you're hungry, keep eating"\n\nThe code keeps running as long as (${condition}) is true.\nOnce it becomes false, the loop stops.`
      });
    }

    // Array operations
    else if (/\.(map|filter|reduce|forEach|find|some|every)\(/.test(trimmedLine)) {
      const method = trimmedLine.match(/\.(map|filter|reduce|forEach|find|some|every)/)?.[1];
      const methodExplanations: Record<string, { title: string; explanation: string; example: string }> = {
        map: {
          title: 'Transforming Each Item (Map)',
          explanation: 'Map goes through each item in a list and transforms it into something new. It\'s like having a factory assembly line where each item gets modified in the same way.',
          example: 'Imagine you have a list of numbers: [1, 2, 3]\nYou want to double each one: [2, 4, 6]\n\nMap does this automatically:\n- Takes each number\n- Doubles it\n- Puts the result in a new list'
        },
        filter: {
          title: 'Filtering Items (Filter)',
          explanation: 'Filter goes through a list and only keeps items that pass a test. It\'s like sorting through your toys and only keeping the red ones.',
          example: 'Imagine you have numbers: [1, 2, 3, 4, 5]\nYou only want even numbers: [2, 4]\n\nFilter does this:\n- Checks each number\n- If it passes the test (is even), keep it\n- If it fails, throw it away'
        },
        forEach: {
          title: 'Doing Something With Each Item (ForEach)',
          explanation: 'ForEach goes through each item in a list and does something with it. It\'s like going through your homework problems one by one.',
          example: 'Imagine you have a list of names: ["Alice", "Bob", "Charlie"]\n\nForEach will:\n- Take "Alice" and do something\n- Take "Bob" and do something\n- Take "Charlie" and do something'
        }
      };

      if (method && methodExplanations[method]) {
        explanations.push({
          line: lineNumber,
          code: trimmedLine,
          ...methodExplanations[method]
        });
      }
    }

    // Console.log
    else if (/console\.log\(/.test(trimmedLine)) {
      const content = trimmedLine.match(/console\.log\((.*?)\)/)?.[1];
      explanations.push({
        line: lineNumber,
        code: trimmedLine,
        title: 'Printing to Console',
        explanation: `This displays information in the console (the output area). It's like the computer talking to you, showing you what's happening inside the code. This is very useful for debugging and understanding what your code is doing.`,
        example: `Think of console.log as the computer's way of showing you something:\n\nIf you write: console.log("Hello")\nThe computer shows: Hello\n\nIt's like asking the computer "What's the value of this?" and it tells you!`
      });
    }

    // Return statements
    else if (/^return\s+/.test(trimmedLine)) {
      explanations.push({
        line: lineNumber,
        code: trimmedLine,
        title: 'Returning a Result',
        explanation: `This sends a value back from a function. When a function finishes its work, "return" is how it gives you the answer. After return runs, the function stops immediately.`,
        example: `Think of a function like a calculator:\n- You give it numbers\n- It does math\n- It RETURNS the answer back to you\n\nWithout return, the function would do the work but never tell you the result!`
      });
    }
  });

  return explanations;
}

export default ExplanationTab;
