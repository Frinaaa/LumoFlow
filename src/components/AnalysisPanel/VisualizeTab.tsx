import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';

interface FlowchartNode {
  id: number;
  type: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

interface FlowchartConnection {
  from: number;
  to: number;
}

interface AnalysisData {
  language: string;
  totalLines: number;
  functions: Array<{ name: string; line: number; type: string }>;
  variables: Array<{ name: string; line: number; type: string }>;
  controlFlow: Array<{ type: string; line: number; condition?: string }>;
  flowchart: {
    nodes: FlowchartNode[];
    connections: FlowchartConnection[];
  };
  explanation: string[];
}

interface VisualizeTabProps {
  analysisData: AnalysisData | null;
  currentStep: number;
  onStepChange: (step: number) => void;
}

const VisualizeTab: React.FC<VisualizeTabProps> = ({ analysisData, currentStep, onStepChange }) => {
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (!autoPlay || !analysisData) return;

    const interval = setInterval(() => {
      const nextStep = currentStep + 1;
      if (nextStep >= analysisData.explanation.length) {
        setAutoPlay(false);
        return;
      }
      onStepChange(nextStep);
    }, 1500);

    return () => clearInterval(interval);
  }, [autoPlay, analysisData, onStepChange, currentStep]);

  const renderFlowchart = () => {
    if (!analysisData?.flowchart?.nodes) return null;

    const nodes = analysisData.flowchart.nodes;
    const connections = analysisData.flowchart.connections;

    // Calculate SVG dimensions
    const maxX = Math.max(...nodes.map(n => n.x + 120), 400);
    const maxY = Math.max(...nodes.map(n => n.y + 60), 300);

    return (
      <div className="flowchart-container" style={{
        position: 'relative',
        width: '100%',
        minHeight: '400px',
        background: '#0a0a0e',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '20px',
        overflow: 'auto'
      }}>
        <svg width={maxX} height={maxY} style={{ position: 'relative', display: 'block' }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7"
              refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
            <marker id="arrowhead-active" markerWidth="10" markerHeight="7"
              refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#00f2ff" />
            </marker>
          </defs>

          {/* Draw connections */}
          {connections.map((conn, index) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const isActive = currentStep >= conn.from && currentStep <= conn.to;
            const isPast = currentStep > conn.to;

            return (
              <g key={index}>
                <line
                  x1={fromNode.x + 60}
                  y1={fromNode.y + 30}
                  x2={toNode.x + 60}
                  y2={toNode.y}
                  stroke={isActive ? '#00f2ff' : isPast ? '#444' : '#555'}
                  strokeWidth={isActive ? '3' : '2'}
                  markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                  style={{
                    transition: 'all 0.3s ease',
                    filter: isActive ? 'drop-shadow(0 0 6px #00f2ff)' : 'none'
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Draw nodes */}
        {nodes.map((node) => {
          const isActive = currentStep === node.id;
          const isPast = currentStep > node.id;

          return (
            <div
              key={node.id}
              className="flowchart-node"
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: '120px',
                height: '60px',
                background: isActive ? '#00f2ff' : isPast ? '#444' : node.color,
                border: `2px solid ${isActive ? '#00f2ff' : node.color}`,
                borderRadius: node.type === 'decision' ? '50%' : '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? '#000' : 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
                zIndex: isActive ? 100 : 10,
                boxShadow: isActive ? '0 0 20px #00f2ff' : 'none',
                opacity: isPast ? 0.7 : 1,
                padding: '8px'
              }}
              onClick={() => onStepChange(node.id)}
              title={`${node.type}: ${node.label}`}
            >
              {node.label}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '-28px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#00f2ff',
                  color: '#000',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold',
                  zIndex: 200
                }}>
                  EXECUTING
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };



  const renderCurrentStepInfo = () => {
    if (!analysisData || !analysisData.explanation[currentStep]) return null;

    const explanation = analysisData.explanation[currentStep];
    const controlFlowItem = analysisData.controlFlow[currentStep];

    return (
      <div style={{
        background: '#2d2d30',
        border: '1px solid #3e3e42',
        borderRadius: '6px',
        padding: '12px',
        marginTop: '12px'
      }}>
        <div style={{ color: '#00f2ff', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
          Step {currentStep + 1} of {analysisData.explanation.length}
        </div>
        <div style={{ color: '#ccc', fontSize: '12px', lineHeight: '1.5' }}>
          {explanation}
        </div>
        {controlFlowItem && (
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            background: '#1e1e1e', 
            borderRadius: '4px',
            fontSize: '11px',
            color: '#888'
          }}>
            <span style={{ color: '#00f2ff' }}>Type:</span> {controlFlowItem.type}
            {controlFlowItem.condition && (
              <>
                <br />
                <span style={{ color: '#00f2ff' }}>Condition:</span> {controlFlowItem.condition}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {analysisData && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <ProgressBar
              currentStep={currentStep}
              totalSteps={analysisData.explanation.length}
              onStepChange={onStepChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => onStepChange(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              style={{
                padding: '6px 12px',
                background: currentStep === 0 ? '#333' : '#bc13fe',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                opacity: currentStep === 0 ? 0.5 : 1
              }}
            >
              <i className="fa-solid fa-chevron-left"></i> Previous
            </button>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              style={{
                padding: '6px 12px',
                background: autoPlay ? '#00f2ff' : '#bc13fe',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              <i className={`fa-solid fa-${autoPlay ? 'pause' : 'play'}`}></i> {autoPlay ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => onStepChange(Math.min(analysisData.explanation.length - 1, currentStep + 1))}
              disabled={currentStep === analysisData.explanation.length - 1}
              style={{
                padding: '6px 12px',
                background: currentStep === analysisData.explanation.length - 1 ? '#333' : '#bc13fe',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
                cursor: currentStep === analysisData.explanation.length - 1 ? 'not-allowed' : 'pointer',
                opacity: currentStep === analysisData.explanation.length - 1 ? 0.5 : 1
              }}
            >
              Next <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </>
      )}

      <div>
        <h5 style={{ color: '#ff6b35', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold' }}>
          <i className="fa-solid fa-diagram-project"></i> Execution Flow Visualization
        </h5>
        {analysisData ? renderFlowchart() : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666',
            border: '2px dashed #333',
            borderRadius: '8px'
          }}>
            <i className="fa-solid fa-code" style={{ fontSize: '48px', marginBottom: '15px', display: 'block' }}></i>
            <p style={{ margin: '0 0 8px 0' }}>Write some code and it will analyze in real-time</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>Click Analyze to see the execution flow</p>
          </div>
        )}
      </div>

      {renderCurrentStepInfo()}
    </>
  );
};

export default VisualizeTab;
