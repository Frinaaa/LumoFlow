import React from 'react';

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

interface ExplanationTabProps {
  analysisData: AnalysisData | null;
}

const ExplanationTab: React.FC<ExplanationTabProps> = ({ analysisData }) => {
  return (
    <div className="analysis-content-section">
      <h4 style={{ color: '#00f2ff' }}>Code Explanation</h4>
      {analysisData ? (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h5 style={{ color: '#bc13fe' }}>Functions Found:</h5>
            {analysisData.functions.length > 0 ? (
              <ul style={{ color: '#ccc' }}>
                {analysisData.functions.map((func, index) => (
                  <li key={index}>
                    <strong>{func.name}</strong> (Line {func.line})
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#666' }}>No functions detected</p>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h5 style={{ color: '#00ff88' }}>Variables Found:</h5>
            {analysisData.variables.length > 0 ? (
              <ul style={{ color: '#ccc' }}>
                {analysisData.variables.map((variable, index) => (
                  <li key={index}>
                    <strong>{variable.name}</strong> (Line {variable.line})
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#666' }}>No variables detected</p>
            )}
          </div>

          <div>
            <h5 style={{ color: '#ff6b35' }}>Execution Flow:</h5>
            {analysisData.explanation.length > 0 ? (
              <ol style={{ color: '#ccc' }}>
                {analysisData.explanation.map((step, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{step}</li>
                ))}
              </ol>
            ) : (
              <p style={{ color: '#666' }}>No execution steps detected</p>
            )}
          </div>
        </div>
      ) : (
        <p style={{ color: '#666' }}>No analysis data available. Code will be analyzed in real-time.</p>
      )}
    </div>
  );
};

export default ExplanationTab;
