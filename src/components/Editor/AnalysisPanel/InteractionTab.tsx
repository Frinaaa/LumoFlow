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

interface InteractionTabProps {
  analysisData: AnalysisData | null;
}

const InteractionTab: React.FC<InteractionTabProps> = ({ analysisData }) => {
  return (
    <div className="analysis-content-section">
      <h4 style={{ color: '#00f2ff' }}>Interactive Elements</h4>
      <p style={{ color: '#ccc' }}>Hover over flowchart nodes to see detailed information about each step.</p>
      {analysisData && (
        <div className="interaction-demo">
          <div className="demo-item" style={{
            background: '#2a2a2a',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '10px',
            border: '1px solid #444'
          }}>
            <span className="demo-label" style={{ color: '#00f2ff' }}>Total Nodes:</span>
            <code style={{ color: '#fff', marginLeft: '10px' }}>{analysisData.flowchart.nodes.length}</code>
          </div>
          <div className="demo-item" style={{
            background: '#2a2a2a',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #444'
          }}>
            <span className="demo-label" style={{ color: '#00f2ff' }}>Connections:</span>
            <code style={{ color: '#fff', marginLeft: '10px' }}>{analysisData.flowchart.connections.length}</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionTab;
