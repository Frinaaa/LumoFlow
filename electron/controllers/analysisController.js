const { AnalysisResult, Visualization } = require('../models');

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

// JavaScript code analyzer
function analyzeJavaScript(code) {
  const lines = code.split('\n').filter(line => line.trim());
  const analysis = {
    language: 'JavaScript',
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

  // Analyze each line
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Function declarations
    if (trimmedLine.includes('function ') || trimmedLine.includes('=>')) {
      const funcName = extractFunctionName(trimmedLine);
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

      analysis.explanation.push(`Line ${index + 1}: Function '${funcName}' is declared`);
    }
    
    // Variable declarations
    else if (trimmedLine.includes('let ') || trimmedLine.includes('const ') || trimmedLine.includes('var ')) {
      const varName = extractVariableName(trimmedLine);
      analysis.variables.push({
        name: varName,
        line: index + 1,
        type: 'declaration'
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

      analysis.explanation.push(`Line ${index + 1}: Variable '${varName}' is declared`);
    }
    
    // Control flow (if statements)
    else if (trimmedLine.includes('if ') || trimmedLine.includes('else')) {
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

      analysis.explanation.push(`Line ${index + 1}: Conditional statement - ${trimmedLine}`);
    }
    
    // Loops
    else if (trimmedLine.includes('for ') || trimmedLine.includes('while ')) {
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

      analysis.explanation.push(`Line ${index + 1}: Loop statement - ${trimmedLine}`);
    }
    
    // Console/output statements
    else if (trimmedLine.includes('console.log') || trimmedLine.includes('alert')) {
      analysis.flowchart.nodes.push({
        id: nodeId++,
        type: 'output',
        label: 'Output',
        x: 200,
        y: currentY,
        color: '#ffd700'
      });
      currentY += 80;

      analysis.explanation.push(`Line ${index + 1}: Output statement`);
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