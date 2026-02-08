import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../editor/stores/editorStore';
import { copilotService } from '../../services/CopilotService';

interface AnalysisData {
  language: string;
  totalLines: number;
  functions: Array<{ name: string; line: number; type: string }>;
  variables: Array<{ name: string; line: number; type: string }>;
  controlFlow: Array<{ type: string; line: number; condition?: string }>;
  flowchart: {
    nodes: Array<any>;
    connections: Array<any>;
  };
  explanation: string[];
}

interface InteractionTabProps {
  analysisData: AnalysisData | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const InteractionTab: React.FC<InteractionTabProps> = ({ analysisData }) => {
  const tabs = useEditorStore(state => state.tabs);
  const activeTabId = useEditorStore(state => state.activeTabId);
  const editorStore = useEditorStore();

  const activeTab = React.useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
  const cursorLine = activeTab?.cursorPosition?.line || 1;
  const cursorColumn = activeTab?.cursorPosition?.column || 1;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hi! I\'m your **AI Coding Assistant**!\n\nI can help you with:\n• ▶️ **"Run this code"** - Execute your program\n• 📊 **"Analyze my code"** - Get code insights\n• 🐛 **"Fix this error"** - Debug help\n• 💡 **"Explain this"** - Code explanations\n• 📝 **"How do I..."** - Programming concepts\n\nJust ask me anything about coding!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autopilotMode, setAutopilotMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopSpeaking();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window && voiceEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // AI Response Generator - Using CopilotService with Custom Tools
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const currentCode = activeTab?.content || '';
    const currentFile = activeTab?.fileName || 'untitled';
    const problems = editorStore.staticProblems.concat(editorStore.runtimeProblems);

    // Set context for the CopilotService
    copilotService.setContext({
      currentCode,
      currentFile,
      problems: problems.map(p => ({ line: p.line, message: p.message })),
      analysisData,
      executeCode: () => {
        // Trigger code execution
        const runButton = document.querySelector('[title="Run Code"]') as HTMLElement;
        runButton?.click();
      },
      clearOutput: () => {
        editorStore.clearOutputData();
        editorStore.clearDebugData();
      }
    });

    // Use the CopilotService to get response (handles tools automatically)
    try {
      const response = await copilotService.chat(userMessage);
      return response;
    } catch (error) {
      console.error('CopilotService error:', error);
      return "I encountered an error processing your request. Please try again.";
    }
  };

  // Build context for AI
  const buildContext = (question: string, code: string, fileName: string, problems: any[]) => {
    let context = `Current file: ${fileName}\n`;

    if (code) {
      const lines = code.split('\n').length;
      context += `Code length: ${lines} lines\n`;
      context += `Code preview:\n${code.substring(0, 500)}${code.length > 500 ? '...' : ''}\n\n`;
    }

    if (problems.length > 0) {
      context += `Errors found: ${problems.length}\n`;
      problems.forEach((p, i) => {
        context += `${i + 1}. Line ${p.line}: ${p.message.split('\n')[0]}\n`;
      });
      context += '\n';
    }

    if (analysisData) {
      context += `Variables: ${analysisData.variables.length}\n`;
      context += `Functions: ${analysisData.functions.length}\n`;
    }

    return context;
  };

  // Get AI response from GitHub Copilot
  const getAIResponse = async (question: string, context: string): Promise<string | null> => {
    // Check if GitHub Copilot CLI is available
    const copilotToken = localStorage.getItem('github_copilot_token');

    if (copilotToken) {
      try {
        // Use GitHub Copilot Chat API
        const response = await fetch('https://api.githubcopilot.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${copilotToken}`,
            'Editor-Version': 'vscode/1.85.0',
            'Editor-Plugin-Version': 'copilot-chat/0.11.0',
            'Openai-Organization': 'github-copilot',
            'Openai-Intent': 'conversation-panel',
            'Copilot-Integration-Id': 'vscode-chat'
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are GitHub Copilot, an AI programming assistant integrated into a code editor.
Your role is to help students learn programming by:
- Explaining code clearly and simply
- Helping debug errors with detailed explanations
- Providing code examples with comments
- Answering programming questions at any level
- Being encouraging and supportive

Current context:
${context}

Provide clear, helpful, and educational responses. Use code examples when helpful.`
              },
              {
                role: 'user',
                content: question
              }
            ],
            model: 'gpt-4',
            temperature: 0.7,
            top_p: 1,
            n: 1,
            stream: false,
            max_tokens: 1024
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content;
          }
        } else {
          const errorData = await response.json();
          console.error('GitHub Copilot API error:', errorData);

          if (response.status === 401) {
            return '⚠️ Authentication error. Please check your GitHub Copilot token in settings.';
          } else if (response.status === 429) {
            return '⚠️ Rate limit reached. Please wait a moment and try again.';
          }
        }
      } catch (error) {
        console.error('GitHub Copilot API error:', error);
        return '⚠️ Connection error. Check your internet connection and try again.';
      }
    }

    // Fallback: Google Gemini (if user has it configured)
    const geminiKey = localStorage.getItem('gemini_api_key');
    if (geminiKey) {
      try {
        const systemPrompt = `You are an expert programming assistant helping students learn to code. 
Your role is to:
- Explain code clearly and simply
- Help debug errors with detailed explanations
- Provide code examples with comments
- Answer programming questions at any level
- Be encouraging and supportive

Current context:
${context}

Provide clear, helpful, and educational responses. Use examples when helpful.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nStudent Question: ${question}\n\nYour Response:`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
          }
        }
      } catch (error) {
        console.error('Gemini API error:', error);
      }
    }

    // Fallback: OpenAI GPT (if user prefers)
    const openaiKey = localStorage.getItem('openai_api_key');
    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful programming assistant. Answer questions about code, explain concepts, help debug, and provide code examples. Be concise and clear.'
              },
              {
                role: 'user',
                content: `Context:\n${context}\n\nQuestion: ${question}`
              }
            ],
            max_tokens: 800,
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.choices[0].message.content;
        }
      } catch (error) {
        console.error('OpenAI API error:', error);
      }
    }

    return null;
  };

  // Intelligent fallback - flexible pattern matching
  const generateIntelligentResponse = (question: string, context: string): string => {
    const q = question.toLowerCase();
    const words = q.split(' ');

    // Extract key topics from question
    const topics = {
      code: /code|program|script|file/.test(q),
      explain: /explain|what|how|why|understand|mean/.test(q),
      error: /error|bug|fix|wrong|issue|problem|debug/.test(q),
      create: /create|write|make|generate|build|code/.test(q),
      variable: /variable|var|let|const|data|value/.test(q),
      function: /function|method|procedure|routine/.test(q),
      array: /array|list|collection/.test(q),
      loop: /loop|for|while|iterate|repeat/.test(q),
      condition: /if|condition|conditional|check|compare/.test(q),
      object: /object|class|struct|property/.test(q),
      string: /string|text|char|word/.test(q),
      number: /number|int|float|math|calculate/.test(q),
      run: /run|execute|start|launch|test/.test(q),
      help: /help|assist|guide|teach|learn/.test(q)
    };

    // Analyze current code if available
    const currentCode = activeTab?.content || '';
    const hasCode = currentCode.length > 0;
    const codeAnalysis = hasCode ? analyzeCodeIntelligently(currentCode) : null;

    // Generate response based on topics and context

    // 1. Code explanation requests
    if (topics.explain && topics.code && hasCode) {
      return `Let me explain this code:\n\n${codeAnalysis?.explanation || 'This code performs operations on data.'}\n\n${codeAnalysis?.details || 'The code uses variables, functions, and control flow to achieve its goal.'}\n\nWould you like me to explain any specific part in more detail?`;
    }

    // 2. Error/debugging help
    if (topics.error) {
      const problems = editorStore.staticProblems.concat(editorStore.runtimeProblems);
      if (problems.length > 0) {
        const errorDetails = problems.map((p, i) =>
          `${i + 1}. **Line ${p.line}**: ${p.message.split('\n')[0]}`
        ).join('\n\n');
        return `I found ${problems.length} issue(s):\n\n${errorDetails}\n\n💡 **How to fix:**\n• Check the line numbers mentioned\n• Read the error messages carefully\n• Look for typos, missing brackets, or undefined variables\n\nWould you like help fixing a specific error?`;
      }
      return `Good news! I don't see any errors in your code right now. ✅\n\nIf you're experiencing issues:\n• Try running the code to see runtime errors\n• Check the Output and Debug Console tabs\n• Make sure all variables are defined before use\n\nWhat specific problem are you facing?`;
    }

    // 3. Code creation requests
    if (topics.create) {
      if (topics.function) {
        return generateFlexibleCodeExample('function', question);
      } else if (topics.array) {
        return generateFlexibleCodeExample('array', question);
      } else if (topics.loop) {
        return generateFlexibleCodeExample('loop', question);
      } else if (topics.object) {
        return generateFlexibleCodeExample('object', question);
      } else {
        return `I can help you create code! Based on your question, here's a suggestion:\n\n\`\`\`javascript\n// Example code structure\nfunction yourFunction(param) {\n  // Your logic here\n  return result;\n}\n\`\`\`\n\nCould you be more specific about what you want to create? For example:\n• "Create a function that..."\n• "Make an array of..."\n• "Write a loop to..."`;
      }
    }

    // 4. Concept explanations
    if (topics.explain || topics.help) {
      if (topics.variable) {
        return `**Variables** store data in your program:\n\n• \`let x = 10;\` - Creates a variable that can change\n• \`const y = 20;\` - Creates a constant (can't change)\n• \`var z = 30;\` - Old way (avoid using)\n\n**When to use:**\n• Use \`let\` for values that will change\n• Use \`const\` for values that stay the same\n\n**Example:**\n\`\`\`javascript\nlet score = 0;        // Can change\nconst maxScore = 100; // Won't change\nscore = score + 10;   // Update score\n\`\`\`\n\nWhat else would you like to know about variables?`;
      } else if (topics.function) {
        return `**Functions** are reusable blocks of code:\n\n**Why use functions?**\n• Organize code into logical pieces\n• Reuse code without copying\n• Make code easier to understand\n• Test code in isolation\n\n**Basic syntax:**\n\`\`\`javascript\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nlet message = greet("Alice");\nconsole.log(message); // "Hello, Alice!"\n\`\`\`\n\n**Key parts:**\n• \`function\` - keyword to define function\n• \`greet\` - function name\n• \`(name)\` - parameter (input)\n• \`return\` - output value\n\nWant to see more examples?`;
      } else if (topics.array) {
        return `**Arrays** store multiple values in one variable:\n\n**Creating arrays:**\n\`\`\`javascript\nlet numbers = [1, 2, 3, 4, 5];\nlet names = ["Alice", "Bob", "Charlie"];\nlet mixed = [1, "hello", true];\n\`\`\`\n\n**Common operations:**\n• \`arr[0]\` - Access first item\n• \`arr.push(6)\` - Add to end\n• \`arr.pop()\` - Remove from end\n• \`arr.length\` - Get size\n• \`arr.forEach()\` - Loop through items\n\n**Example:**\n\`\`\`javascript\nlet fruits = ["apple", "banana"];\nfruits.push("orange");\nconsole.log(fruits); // ["apple", "banana", "orange"]\n\`\`\`\n\nWhat would you like to do with arrays?`;
      } else if (topics.loop) {
        return `**Loops** repeat code multiple times:\n\n**For loop** (when you know how many times):\n\`\`\`javascript\nfor (let i = 0; i < 5; i++) {\n  console.log("Count: " + i);\n}\n// Prints: 0, 1, 2, 3, 4\n\`\`\`\n\n**While loop** (when condition-based):\n\`\`\`javascript\nlet count = 0;\nwhile (count < 5) {\n  console.log(count);\n  count++;\n}\n\`\`\`\n\n**Array loops:**\n\`\`\`javascript\nlet arr = [1, 2, 3];\narr.forEach(num => {\n  console.log(num * 2);\n});\n\`\`\`\n\nWhich type of loop do you need help with?`;
      }
    }

    // 5. Run code requests
    if (topics.run && hasCode) {
      return `I'll help you run the code!\n\n**To run your code:**\n1. Make sure your code is saved\n2. Click the Run button (▶️) or press Ctrl+Shift+B\n3. Check the Output tab for results\n\n**Current file:** ${activeTab?.fileName || 'untitled'}\n**Lines of code:** ${currentCode.split('\n').length}\n\n${autopilotMode ? '🤖 Autopilot is ON - I can run it automatically!' : '💡 Enable Autopilot mode for automatic execution!'}\n\nReady to run?`;
    }

    // 6. General questions - try to be helpful
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
    const isQuestion = questionWords.some(w => q.startsWith(w));

    if (isQuestion) {
      return `That's a great question! Let me help you:\n\n${generateContextualAnswer(question, context)}\n\nIf you need more specific help:\n• Ask about code concepts (variables, functions, loops)\n• Request code examples\n• Get help with errors\n• Learn programming basics\n\nWhat would you like to explore?`;
    }

    // 7. Conversational responses
    if (/hello|hi|hey|greetings/.test(q)) {
      return `Hello! 👋 I'm your AI programming assistant.\n\nI can help you with:\n• Explaining code and concepts\n• Fixing errors and debugging\n• Writing new code\n• Answering programming questions\n• Running and testing code\n\nWhat would you like to work on today?`;
    }

    if (/thank|thanks|thx/.test(q)) {
      return `You're very welcome! 😊\n\nI'm here whenever you need help. Feel free to ask:\n• Questions about your code\n• How to implement features\n• Explanations of concepts\n• Anything programming-related!\n\nHappy coding! 💻`;
    }

    // 8. Default intelligent response
    return `I understand you're asking about: "${question}"\n\n${generateContextualAnswer(question, context)}\n\n💡 **I can help with:**\n• Code explanations and analysis\n• Error fixing and debugging\n• Writing code examples\n• Programming concepts\n• Running and testing code\n\nCould you rephrase your question or be more specific? For example:\n• "Explain how this code works"\n• "Fix the error on line 5"\n• "Create a function that..."\n• "What is a variable?"`;
  };

  // Analyze code intelligently
  const analyzeCodeIntelligently = (code: string) => {
    const lines = code.split('\n').filter(l => l.trim());
    const features = {
      variables: /(?:let|const|var)\s+\w+/.test(code),
      functions: /function\s+\w+|const\s+\w+\s*=\s*\(/.test(code),
      loops: /for\s*\(|while\s*\(|\.forEach|\.map/.test(code),
      conditions: /if\s*\(|else|switch/.test(code),
      arrays: /\[.*\]/.test(code),
      objects: /\{[^}]+\}/.test(code),
      strings: /["'].*["']/.test(code),
      numbers: /\d+/.test(code),
      console: /console\.log/.test(code)
    };

    let explanation = `This is a ${lines.length}-line program that `;
    const parts = [];

    if (features.functions) parts.push('defines functions');
    if (features.variables) parts.push('uses variables');
    if (features.loops) parts.push('includes loops');
    if (features.conditions) parts.push('has conditional logic');
    if (features.arrays) parts.push('works with arrays');

    explanation += parts.join(', ') + '.';

    let details = '\n\n**What it does:**\n';
    if (features.variables) details += '• Stores data in variables\n';
    if (features.functions) details += '• Organizes code into functions\n';
    if (features.loops) details += '• Repeats operations with loops\n';
    if (features.conditions) details += '• Makes decisions with if/else\n';
    if (features.arrays) details += '• Processes collections of data\n';
    if (features.console) details += '• Outputs results to console\n';

    return { explanation, details };
  };

  // Generate contextual answer
  const generateContextualAnswer = (question: string, context: string): string => {
    const q = question.toLowerCase();

    // Try to extract the main topic
    const topics = q.match(/\b(variable|function|array|loop|object|string|number|class|method)\b/g);

    if (topics && topics.length > 0) {
      const topic = topics[0];
      return `Based on your question about **${topic}s**, here's what you need to know:\n\n${getTopicInfo(topic)}\n\nIs there a specific aspect you'd like to explore?`;
    }

    if (context.includes('Code preview:')) {
      return `Looking at your current code, I can see you're working on something interesting!\n\nIf you want me to:\n• Explain what the code does\n• Find and fix errors\n• Suggest improvements\n• Add new features\n\nJust ask specifically!`;
    }

    return `I'm here to help with programming! You can ask me anything about:\n• Code concepts and syntax\n• Debugging and error fixing\n• Writing new code\n• Best practices\n• Specific programming problems`;
  };

  // Get topic information
  const getTopicInfo = (topic: string): string => {
    const info: Record<string, string> = {
      variable: 'Variables store data. Use `let` for changeable values, `const` for constants.',
      function: 'Functions are reusable code blocks. Define with `function name() {}` or `const name = () => {}`.',
      array: 'Arrays store multiple values: `let arr = [1, 2, 3]`. Access with `arr[0]`.',
      loop: 'Loops repeat code. Use `for`, `while`, or array methods like `.forEach()`.',
      object: 'Objects store key-value pairs: `let obj = { name: "value" }`. Access with `obj.name`.',
      string: 'Strings are text: `let str = "hello"`. Combine with `+` or template literals.',
      number: 'Numbers are numeric values: `let num = 42`. Use math operators: `+`, `-`, `*`, `/`.',
      class: 'Classes are blueprints for objects. Define with `class Name {}` and create with `new Name()`.',
      method: 'Methods are functions inside objects or classes. Call with `obj.method()`.'
    };

    return info[topic] || 'This is an important programming concept!';
  };

  // Generate flexible code examples
  const generateFlexibleCodeExample = (type: string, question: string): string => {
    const examples: Record<string, string> = {
      function: `Here's a function example based on your question:\n\n\`\`\`javascript\n// Function to perform an operation\nfunction processData(input) {\n  // Process the input\n  let result = input * 2;\n  return result;\n}\n\n// Use the function\nlet output = processData(5);\nconsole.log(output); // 10\n\`\`\`\n\n**Key points:**\n• Functions take input (parameters)\n• Process data inside\n• Return output\n• Can be reused multiple times\n\nWant a more specific example?`,

      array: `Here's an array example:\n\n\`\`\`javascript\n// Create an array\nlet items = [1, 2, 3, 4, 5];\n\n// Process each item\nlet doubled = items.map(x => x * 2);\nconsole.log(doubled); // [2, 4, 6, 8, 10]\n\n// Filter items\nlet evens = items.filter(x => x % 2 === 0);\nconsole.log(evens); // [2, 4]\n\`\`\`\n\n**Array methods:**\n• \`.map()\` - Transform each item\n• \`.filter()\` - Keep items that match\n• \`.forEach()\` - Loop through items\n• \`.reduce()\` - Combine into single value\n\nWhat do you want to do with arrays?`,

      loop: `Here's a loop example:\n\n\`\`\`javascript\n// For loop - when you know the count\nfor (let i = 0; i < 5; i++) {\n  console.log("Iteration: " + i);\n}\n\n// While loop - when condition-based\nlet count = 0;\nwhile (count < 5) {\n  console.log(count);\n  count++;\n}\n\n// Array loop\nlet arr = [1, 2, 3];\narr.forEach(item => {\n  console.log(item);\n});\n\`\`\`\n\n**Choose based on:**\n• Known iterations → for loop\n• Condition-based → while loop\n• Array processing → forEach/map\n\nWhich fits your needs?`,

      object: `Here's an object example:\n\n\`\`\`javascript\n// Create an object\nlet person = {\n  name: "Alice",\n  age: 25,\n  greet: function() {\n    return "Hello, I'm " + this.name;\n  }\n};\n\n// Access properties\nconsole.log(person.name);    // "Alice"\nconsole.log(person.age);     // 25\nconsole.log(person.greet()); // "Hello, I'm Alice"\n\n// Modify properties\nperson.age = 26;\n\`\`\`\n\n**Objects are great for:**\n• Grouping related data\n• Creating structured data\n• Modeling real-world things\n\nWhat do you want to create?`
    };

    return examples[type] || `I can help you create ${type} code! Could you be more specific about what you need?`;
  };

  const analyzeCode = (code: string): string => {
    const lines = code.split('\n').filter(l => l.trim());
    const hasVariables = /(?:let|const|var)\s+\w+/.test(code);
    const hasFunctions = /function\s+\w+|const\s+\w+\s*=\s*\(/.test(code);
    const hasLoops = /for\s*\(|while\s*\(/.test(code);
    const hasConditions = /if\s*\(/.test(code);

    let explanation = `This code has ${lines.length} lines. Here's what it does:\n\n`;

    if (hasVariables) explanation += "✓ Declares variables to store data\n";
    if (hasFunctions) explanation += "✓ Defines functions to organize code\n";
    if (hasLoops) explanation += "✓ Uses loops to repeat operations\n";
    if (hasConditions) explanation += "✓ Has conditional logic for decision making\n";

    explanation += "\n💡 The code appears to be working with data and performing operations on it.";

    return explanation;
  };

  const generateCodeSuggestion = (request: string): string => {
    const lower = request.toLowerCase();

    if (lower.includes('array') || lower.includes('list')) {
      return `Here's an array example:\n\n\`\`\`javascript\nlet numbers = [1, 2, 3, 4, 5];\nlet doubled = numbers.map(x => x * 2);\nconsole.log(doubled); // [2, 4, 6, 8, 10]\n\`\`\`\n\nThis creates an array and doubles each number!`;
    }

    if (lower.includes('function')) {
      return `Here's a function example:\n\n\`\`\`javascript\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet('Student')); // Hello, Student!\n\`\`\`\n\nFunctions help organize reusable code!`;
    }

    if (lower.includes('loop') || lower.includes('for')) {
      return `Here's a loop example:\n\n\`\`\`javascript\nfor (let i = 0; i < 5; i++) {\n  console.log(\`Count: \${i}\`);\n}\n\`\`\`\n\nThis prints numbers 0 through 4!`;
    }

    return "I can help you write code! Tell me specifically what you want to create (array, function, loop, etc.) and I'll provide an example.";
  };

  const provideGeneralHelp = (question: string): string => {
    const lower = question.toLowerCase();

    if (lower.includes('variable')) {
      return "**Variables** store data:\n\n• `let x = 10;` - can change\n• `const y = 20;` - cannot change\n• `var z = 30;` - old way (avoid)\n\nUse `let` for values that change, `const` for constants!";
    }

    if (lower.includes('array')) {
      return "**Arrays** store multiple values:\n\n• Create: `let arr = [1, 2, 3];`\n• Access: `arr[0]` gets first item\n• Add: `arr.push(4)`\n• Loop: `arr.forEach(x => console.log(x))`\n\nArrays are perfect for lists of data!";
    }

    if (lower.includes('function')) {
      return "**Functions** are reusable code blocks:\n\n• Define: `function name(params) { ... }`\n• Call: `name(arguments)`\n• Return: `return value;`\n\nFunctions help organize and reuse code!";
    }

    return "I can help with:\n• Explaining code\n• Finding and fixing errors\n• Writing new code\n• Understanding concepts\n• Running your code\n\nJust ask me anything!";
  };

  const getConversationalResponse = (message: string): string => {
    const lower = message.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi')) {
      return "Hello! 👋 How can I help you with your code today?";
    }

    if (lower.includes('thank')) {
      return "You're welcome! Happy to help! 😊 Let me know if you need anything else.";
    }

    if (lower.includes('good') || lower.includes('great')) {
      return "Glad I could help! Keep coding! 💪";
    }

    return "I'm here to help with your code! You can ask me to:\n• Explain code\n• Fix errors\n• Write new code\n• Answer programming questions\n\nWhat would you like to do?";
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const aiResponse = await generateAIResponse(userMessage.content);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsProcessing(false);

    // Speak response if voice is enabled
    if (voiceEnabled && !isSpeaking) {
      // Remove markdown and special characters for speech
      const cleanText = aiResponse
        .replace(/[*_`#]/g, '')
        .replace(/\n+/g, '. ')
        .substring(0, 300); // Limit length
      speak(cleanText);
    }

    // Autopilot mode - execute actions
    if (autopilotMode) {
      executeAutopilotAction(userMessage.content);
    }
  };

  const executeAutopilotAction = async (command: string) => {
    const lower = command.toLowerCase();

    if (lower.includes('run') && activeTab) {
      // Trigger code execution
      setTimeout(() => {
        const runButton = document.querySelector('[title="Run Code"]') as HTMLElement;
        runButton?.click();
      }, 1000);
    }

    if (lower.includes('clear')) {
      editorStore.clearOutputData();
      editorStore.clearDebugData();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0c0c0f',
      overflow: 'hidden',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Top Accent Strip */}
      <div style={{
        height: '2px',
        background: 'linear-gradient(90deg, #bc13fe, #00f2ff)',
        opacity: 0.8
      }} />

      {/* Modern Minimal Header */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(18, 18, 24, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'rgba(188, 19, 254, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(188, 19, 254, 0.2)'
          }}>
            <i className="fa-solid fa-sparkles" style={{ fontSize: '18px', color: '#bc13fe' }}></i>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', letterSpacing: '-0.2px' }}>
              Assistant
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: autopilotMode ? '#00ff88' : '#666', boxShadow: autopilotMode ? '0 0 8px #00ff88' : 'none' }}></span>
              {autopilotMode ? 'Autopilot Active' : 'Ready to help'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setAutopilotMode(!autopilotMode)}
            style={{
              width: '34px',
              height: '34px',
              background: autopilotMode ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255,255,255,0.03)',
              color: autopilotMode ? '#00ff88' : 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            title="Toggle Autopilot"
          >
            <i className="fa-solid fa-plane-up"></i>
          </button>

          <button
            onClick={() => {
              const newValue = !voiceEnabled;
              setVoiceEnabled(newValue);
              if (!newValue) stopSpeaking();
            }}
            style={{
              width: '34px',
              height: '34px',
              background: voiceEnabled ? 'rgba(188, 19, 254, 0.15)' : 'rgba(255,255,255,0.03)',
              color: voiceEnabled ? '#bc13fe' : 'rgba(255,255,255,0.4)',
              border: voiceEnabled ? '1px solid rgba(188, 19, 254, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            title={voiceEnabled ? "Turn Speaker OFF" : "Turn Speaker ON"}
          >
            <i className={`fa-solid ${voiceEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`} style={{
              animation: isSpeaking && voiceEnabled ? 'speaker-pulse 1.2s infinite' : 'none'
            }}></i>
            {isSpeaking && voiceEnabled && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                background: '#bc13fe',
                borderRadius: '50%',
                border: '2px solid #121218'
              }} />
            )}
          </button>

          <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 4px' }}></div>

          <button
            onClick={() => setMessages([messages[0]])}
            style={{
              width: '34px',
              height: '34px',
              background: 'transparent',
              color: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#ff4d4d')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            title="Reset Chat"
          >
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      </div>

      {/* Styled Message Feed */}
      <div className="message-feed" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: '14px',
              alignItems: 'flex-start',
              animation: 'messageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: msg.role === 'user' ? 'rgba(0, 242, 255, 0.15)' : 'rgba(188, 19, 254, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 12px ${msg.role === 'user' ? 'rgba(0, 242, 255, 0.1)' : 'rgba(188, 19, 254, 0.1)'}`
            }}>
              <i className={`fa-solid ${msg.role === 'user' ? 'fa-user-ninja' : 'fa-wand-magic-sparkles'}`}
                style={{ color: msg.role === 'user' ? '#00f2ff' : '#bc13fe', fontSize: '14px' }}></i>
            </div>

            <div style={{
              maxWidth: '82%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                background: msg.role === 'user' ? '#1c1c24' : '#14141b',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '14px',
                lineHeight: '1.7',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                position: 'relative'
              }}>
                {msg.content.split('\n').map((line, i) => (
                  <div key={i} style={{ marginBottom: line ? '6px' : '12px' }}>
                    {line.startsWith('•') || line.startsWith('-') ? (
                      <span style={{ display: 'flex', gap: '10px' }}>
                        <span style={{ color: msg.role === 'user' ? '#00f2ff' : '#bc13fe', fontWeight: 'bold' }}>•</span>
                        <span>{line.substring(1)}</span>
                      </span>
                    ) : (
                      line.split('**').map((part, index) =>
                        index % 2 === 1 ? <strong key={index} style={{ color: msg.role === 'user' ? '#00f2ff' : '#bc13fe', fontWeight: 'bold' }}>{part}</strong> : part
                      )
                    )}
                  </div>
                ))}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.2)',
                marginTop: '8px',
                fontWeight: '500',
                letterSpacing: '0.05em'
              }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(188, 19, 254, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ color: '#bc13fe', fontSize: '14px' }}></i>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2px' }}>AI is analyzing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Card */}
      <div style={{
        padding: '24px',
        background: 'linear-gradient(0deg, #0c0c0f 0%, transparent 100%)',
        position: 'relative'
      }}>
        <div style={{
          background: 'rgba(20, 20, 27, 0.95)',
          padding: '12px 16px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          transition: 'border-color 0.3s ease',
          backdropFilter: 'blur(20px)'
        }} className="input-container">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            style={{
              width: '40px',
              height: '40px',
              background: isListening ? '#ff3b30' : 'rgba(255,255,255,0.04)',
              color: isListening ? '#fff' : 'rgba(255,255,255,0.4)',
              border: 'none',
              borderRadius: '14px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isListening ? '0 0 20px rgba(255, 59, 48, 0.4)' : 'none'
            }}
          >
            <i className={`fa-solid ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`} style={{ fontSize: '16px' }}></i>
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={isProcessing || isListening}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              resize: 'none',
              padding: '10px 0',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              maxHeight: '180px'
            }}
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />

          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            style={{
              width: '40px',
              height: '40px',
              background: input.trim() && !isProcessing ? '#bc13fe' : 'rgba(255,255,255,0.02)',
              color: input.trim() && !isProcessing ? '#fff' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '14px',
              cursor: input.trim() && !isProcessing ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: input.trim() && !isProcessing ? '0 8px 20px rgba(188, 19, 254, 0.3)' : 'none'
            }}
          >
            <i className="fa-solid fa-arrow-up" style={{ fontSize: '18px' }}></i>
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.15)',
          marginTop: '14px',
          letterSpacing: '0.1em',
          fontWeight: '600'
        }}>
          INTELLIGENT ASSISTANT • COPILOT READY
        </div>
      </div>

      <style>{`
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .message-feed::-webkit-scrollbar {
          width: 4px;
        }
        .message-feed::-webkit-scrollbar-track {
          background: transparent;
        }
        .message-feed::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        .message-feed::-webkit-scrollbar-thumb:hover {
          background: rgba(188, 19, 254, 0.2);
        }

        .input-container:focus-within {
          border-color: rgba(188, 19, 254, 0.4) !important;
          background: rgba(22, 22, 30, 1) !important;
        }
        @keyframes speaker-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default InteractionTab;

