const { AnalysisResult, Visualization } = require('../models');
const acorn = require('acorn');
const walk = require('acorn-walk');

const analysisController = {
  // Analyze code and generate visualization data
  async analyzeCode(event, data) {
    try {
      const { code, language, userId, fileId } = data;
      
      if (!code || !language) {
        return { success: false, msg: 'Code and language are required' };
      }

      console.log('Analyzing code:', { language, codeLength: code.length });

      // Generate analysis based on language
      let analysis;
      if (language === 'javascript' || language === 'js') {
        analysis = analyzeJavaScript(code);
      } else if (language === 'python' || language === 'py') {
        analysis = analyzePython(code);
      } else {
        analysis = analyzeGeneric(code);
      }

      // Save analysis to database if user is provided
      if (userId && fileId) {
        try {
          const analysisResult = new AnalysisResult({
            userId,
            fileId,
            analysisType: 'Code Flow Analysis',
            explanation: JSON.stringify(analysis),
            analyzedAt: new Date()
          });
          await analysisResult.save();

          // Save visualization data
          const visualization = new Visualization({
            fileId,
            visualizationType: 'Flowchart',
            visualizationData: JSON.stringify(analysis.flowchart),
            generatedAt: new Date()
          });
          await visualization.save();
        } catch (dbError) {
          console.warn('Database save failed:', dbError.message);
        }
      }

      return {
        success: true,
        analysis: analysis
      };
    } catch (error) {
      console.error('Code analysis error:', error);
      return { success: false, msg: 'Analysis failed: ' + error.message };
    }
  },

  // Get analysis history for a user
  async getAnalysisHistory(event, userId) {
    try {
      if (!userId) {
        return { success: false, msg: 'User ID required' };
      }

      const analyses = await AnalysisResult.find({ userId })
        .sort({ analyzedAt: -1 })
        .limit(10);

      return {
        success: true,
        analyses: analyses.map(analysis => ({
          id: analysis._id,
          analysisType: analysis.analysisType,
          analyzedAt: analysis.analyzedAt,
          explanation: JSON.parse(analysis.explanation || '{}')
        }))
      };
    } catch (error) {
      console.error('Get analysis history error:', error);
      return { success: false, msg: 'Failed to get analysis history' };
    }
  }
};

/**
 * Analyze JavaScript code using AST parsing
 * Handles modern JS: arrow functions, classes, async/await, destructuring, etc.
 */
function analyzeJavaScript(code) {
  const analysis = {
    language: 'JavaScript',
    totalLines: code.split('\n').length,
    functions: [],
    variables: [],
    classes: [],
    imports: [],
    exports: [],
    controlFlow: [],
    asyncOperations: [],
    flowchart: {
      nodes: [],
      connections: []
    },
    explanation: []
  };

  let nodeId = 0;
  let currentY = 0;

  // Add start node
  analysis.flowchart.nodes.push({
    id: nodeId++,
    type: 'start',
    label: 'Start',
    x: 200,
    y: currentY,
    color: '#00f2ff'
  });
  currentY += 80;

  try {
    // Parse code into AST
    const ast = acorn.parse(code, { 
      ecmaVersion: 'latest', 
      sourceType: 'module',
      locations: true 
    });

    // Walk the AST and collect information
    walk.simple(ast, {
      // Function declarations: function foo() {}
      FunctionDeclaration(node) {
        const funcName = node.id?.name || 'anonymous';
        const line = node.loc?.start.line || 0;
        
        analysis.functions.push({
          name: funcName,
          line: line,
          type: 'function',
          params: node.params.length,
          async: node.async
        });

        analysis.flowchart.nodes.push({
          id: nodeId++,
          type: 'function',
          label: `Function: ${funcName}${node.async ? ' (async)' : ''}`,
          x: 200,
          y: currentY,
          color: '#bc13fe'
        });
        currentY += 80;

        analysis.explanation.push(`Line ${line}: Function '${funcName}' declared${node.async ? ' (async)' : ''}`);
      },

      // Arrow functions: const foo = () => {}
      ArrowFunctionExpression(node) {
        // Only process if it's assigned to a variable (handled by VariableDeclarator)
      },

      // Variable declarations: const/let/var
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier') {
          const varName = node.id.name;
          const line = node.loc?.start.line || 0;
          const isArrowFunc = node.init?.type === 'ArrowFunctionExpression';
          
          analysis.variables.push({
            name: varName,
            line: line,
            type: isArrowFunc ? 'arrow-function' : 'variable',
            async: isArrowFunc && node.init?.async
          });

          if (isArrowFunc) {
            analysis.functions.push({
              name: varName,
              line: line,
              type: 'arrow-function',
              params: node.init?.params?.length || 0,
              async: node.init?.async
            });

            analysis.flowchart.nodes.push({
              id: nodeId++,
              type: 'function',
              label: `Arrow Function: ${varName}${node.init?.async ? ' (async)' : ''}`,
              x: 200,
              y: currentY,
              color: '#bc13fe'
            });
            currentY += 80;

            analysis.explanation.push(`Line ${line}: Arrow function '${varName}' defined${node.init?.async ? ' (async)' : ''}`);
          } else {
            analysis.flowchart.nodes.push({
              id: nodeId++,
              type: 'variable',
              label: `Variable: ${varName}`,
              x: 200,
              y: currentY,
              color: '#00ff88'
            });
            currentY += 80;

            analysis.explanation.push(`Line ${line}: Variable '${varName}' declared`);
          }
        }
      },

      // Class declarations
      ClassDeclaration(node) {
        const className = node.id?.name || 'AnonymousClass';
        const line = node.loc?.start.line || 0;
        
        analysis.classes.push({
          name: className,
          line: line,
          methods: node.body.body.filter(m => m.type === 'MethodDefinition').map(m => m.key.name)
        });

        analysis.flowchart.nodes.push({
          id: nodeId++,
          type: 'class',
          label: `Class: ${className}`,
          x: 200,
          y: currentY,
          color: '#4ec9b0'
        });
        currentY += 80;

        analysis.explanation.push(`Line ${line}: Class '${className}' defined`);
      },

      // Import statements
      ImportDeclaration(node) {
        const source = node.source.value;
        const line = node.loc?.start.line || 0;
        
        analysis.imports.push({
          source: source,
          line: line,
          specifiers: node.specifiers.map(s => s.local.name)
        });

        analysis.explanation.push(`Line ${line}: Import from '${source}'`);
      },

      // Export statements
      ExportNamedDeclaration(node) {
        const line = node.loc?.start.line || 0;
        if (node.declaration) {
          const name = node.declaration.id?.name || 'unnamed';
          analysis.exports.push({ name, line, type: 'named' });
          analysis.explanation.push(`Line ${line}: Export '${name}'`);
        }
      },

      ExportDefaultDeclaration(node) {
        const line = node.loc?.start.line || 0;
        const name = node.declaration.id?.name || 'default';
        analysis.exports.push({ name, line, type: 'default' });
        analysis.explanation.push(`Line ${line}: Export default '${name}'`);
      },

      // If statements
      IfStatement(node) {
        const line = node.loc?.start.line || 0;
        analysis.controlFlow.push({
          type: 'conditional',
          line: line
        });

        analysis.flowchart.nodes.push({
          id: nodeId++,
          type: 'decision',
          label: 'Conditional',
          x: 200,
          y: currentY,
          color: '#ff6b35'
        });
        currentY += 80;

        analysis.explanation.push(`Line ${line}: Conditional statement`);
      },

      // Loops
      ForStatement(node) {
        const line = node.loc?.start.line || 0;
        analysis.controlFlow.push({
          type: 'loop',
          line: line,
          loopType: 'for'
        });

        analysis.flowchart.nodes.push({
          id: nodeId++,
          type: 'loop',
          label: 'For Loop',
          x: 200,
          y: currentY,
          color: '#ff0055'
        });
        currentY += 80;

        analysis.explanation.push(`Line ${line}: For loop`);
      },

      WhileStatement(node) {
        const line = node.loc?.start.line || 0;
        analysis.controlFlow.push({
          type: 'loop',
          line: line,
          loopType: 'while'
        });

        analysis.flowchart.nodes.push({
          id: nodeId++,
          type: 'loop',
          label: 'While Loop',
          x: 200,
          y: currentY,
          color: '#ff0055'
        });
        currentY += 80;

        analysis.explanation.push(`Line ${line}: While loop`);
      },

      // Async/await
      AwaitExpression(node) {
        const line = node.loc?.start.line || 0;
        analysis.asyncOperations.push({
          type: 'await',
          line: line
        });

        analysis.explanation.push(`Line ${line}: Await expression`);
      },

      // Try/catch
      TryStatement(node) {
        const line = node.loc?.start.line || 0;
        analysis.controlFlow.push({
          type: 'try-catch',
          line: line
        });

        analysis.flowchart.nodes.push({
          id: nodeId++,
          type: 'error-handling',
          label: 'Try/Catch',
          x: 200,
          y: currentY,
          color: '#ffa500'
        });
        currentY += 80;

        analysis.explanation.push(`Line ${line}: Try/catch block`);
      },

      // Console/output
      CallExpression(node) {
        if (node.callee.type === 'MemberExpression' &&
            node.callee.object.name === 'console') {
          const method = node.callee.property.name;
          const line = node.loc?.start.line || 0;

          analysis.flowchart.nodes.push({
            id: nodeId++,
            type: 'output',
            label: `console.${method}()`,
            x: 200,
            y: currentY,
            color: '#ffd700'
          });
          currentY += 80;

          analysis.explanation.push(`Line ${line}: console.${method}() output`);
        }
      }
    });

  } catch (error) {
    analysis.explanation.push(`Syntax Error: ${error.message}`);
    console.error('AST parsing error:', error);
  }

  // Add end node
  analysis.flowchart.nodes.push({
    id: nodeId++,
    type: 'end',
    label: 'End',
    x: 200,
    y: currentY,
    color: '#ff4444'
  });

  // Generate connections between nodes
  for (let i = 0; i < analysis.flowchart.nodes.length - 1; i++) {
    analysis.flowchart.connections.push({
      from: analysis.flowchart.nodes[i].id,
      to: analysis.flowchart.nodes[i + 1].id
    });
  }

  return analysis;
}

// Python code analyzer
function analyzePython(code) {
  const lines = code.split('\n').filter(line => line.trim());
  const analysis = {
    language: 'Python',
    totalLines: lines.length,
    functions: [],
    variables: [],
    controlFlow: [],
    flowchart: {
      nodes: [],
      connections: []
    },
    explanation: []
  };

  let nodeId = 0;
  let currentY = 0;

  // Add start node
  analysis.flowchart.nodes.push({
    id: nodeId++,
    type: 'start',
    label: 'Start',
    x: 200,
    y: currentY,
    color: '#00f2ff'
  });
  currentY += 80;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Function definitions
    if (trimmedLine.startsWith('def ')) {
      const funcName = extractPythonFunctionName(trimmedLine);
      analysis.functions.push({
        name: funcName,
        line: index + 1,
        type: 'function'
      });
      
      analysis.flowchart.nodes.push({
        id: nodeId++,
        type: 'function',
        label: `Function: ${funcName}`,
        x: 200,
        y: currentY,
        color: '#bc13fe'
      });
      currentY += 80;

      analysis.explanation.push(`Line ${index + 1}: Function '${funcName}' is defined`);
    }
    
    // Variable assignments
    else if (trimmedLine.includes(' = ') && !trimmedLine.includes('==')) {
      const varName = extractPythonVariableName(trimmedLine);
      analysis.variables.push({
        name: varName,
        line: index + 1,
        type: 'assignment'
      });

      analysis.flowchart.nodes.push({
        id: nodeId++,
        type: 'variable',
        label: `Variable: ${varName}`,
        x: 200,
        y: currentY,
        color: '#00ff88'
      });
      currentY += 80;

      analysis.explanation.push(`Line ${index + 1}: Variable '${varName}' is assigned`);
    }
    
    // Control flow
    else if (trimmedLine.startsWith('if ') || trimmedLine.startsWith('elif ') || trimmedLine.startsWith('else:')) {
      analysis.controlFlow.push({
        type: 'conditional',
        line: index + 1,
        condition: trimmedLine
      });

      analysis.flowchart.nodes.push({
        id: nodeId++,
        type: 'decision',
        label: 'Decision',
        x: 200,
        y: currentY,
        color: '#ff6b35'
      });
      currentY += 80;

      analysis.explanation.push(`Line ${index + 1}: Conditional statement`);
    }
    
    // Loops
    else if (trimmedLine.startsWith('for ') || trimmedLine.startsWith('while ')) {
      analysis.controlFlow.push({
        type: 'loop',
        line: index + 1,
        condition: trimmedLine
      });

      analysis.flowchart.nodes.push({
        id: nodeId++,
        type: 'loop',
        label: 'Loop',
        x: 200,
        y: currentY,
        color: '#ff0055'
      });
      currentY += 80;

      analysis.explanation.push(`Line ${index + 1}: Loop statement`);
    }
    
    // Print statements
    else if (trimmedLine.includes('print(')) {
      analysis.flowchart.nodes.push({
        id: nodeId++,
        type: 'output',
        label: 'Output',
        x: 200,
        y: currentY,
        color: '#ffd700'
      });
      currentY += 80;

      analysis.explanation.push(`Line ${index + 1}: Print statement`);
    }
  });

  // Add end node
  analysis.flowchart.nodes.push({
    id: nodeId++,
    type: 'end',
    label: 'End',
    x: 200,
    y: currentY,
    color: '#ff4444'
  });

  // Generate connections
  for (let i = 0; i < analysis.flowchart.nodes.length - 1; i++) {
    analysis.flowchart.connections.push({
      from: analysis.flowchart.nodes[i].id,
      to: analysis.flowchart.nodes[i + 1].id
    });
  }

  return analysis;
}

// Generic code analyzer for other languages
function analyzeGeneric(code) {
  const lines = code.split('\n').filter(line => line.trim());
  return {
    language: 'Generic',
    totalLines: lines.length,
    functions: [],
    variables: [],
    controlFlow: [],
    flowchart: {
      nodes: [
        { id: 0, type: 'start', label: 'Start', x: 200, y: 0, color: '#00f2ff' },
        { id: 1, type: 'process', label: 'Process Code', x: 200, y: 80, color: '#bc13fe' },
        { id: 2, type: 'end', label: 'End', x: 200, y: 160, color: '#ff4444' }
      ],
      connections: [
        { from: 0, to: 1 },
        { from: 1, to: 2 }
      ]
    },
    explanation: ['Generic code analysis - specific language features not recognized']
  };
}

// Helper functions
function extractFunctionName(line) {
  if (line.includes('function ')) {
    const match = line.match(/function\s+(\w+)/);
    return match ? match[1] : 'anonymous';
  } else if (line.includes('=>')) {
    const match = line.match(/(\w+)\s*=/);
    return match ? match[1] : 'arrow function';
  }
  return 'function';
}

function extractVariableName(line) {
  const match = line.match(/(let|const|var)\s+(\w+)/);
  return match ? match[2] : 'variable';
}

function extractPythonFunctionName(line) {
  const match = line.match(/def\s+(\w+)/);
  return match ? match[1] : 'function';
}

function extractPythonVariableName(line) {
  const match = line.match(/(\w+)\s*=/);
  return match ? match[1] : 'variable';
}

module.exports = analysisController;
