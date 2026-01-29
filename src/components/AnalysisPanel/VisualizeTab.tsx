import React, { useState, useEffect, useMemo } from 'react';
import ProgressBar from './ProgressBar';
import { useAnalysisStore } from '../../editor/stores/analysisStore';

interface AnalysisData {
  language: string;
  totalLines: number;
  functions: Array<{ name: string; line: number; type: string }>;
  variables: Array<{ name: string; line: number; type: string }>;
  controlFlow: Array<{ type: string; line: number; condition?: string }>;
  explanation: string[];
  flowchart?: {
    nodes: Array<any>;
    connections: Array<any>;
  };
}

interface VisualizeTabProps {
  analysisData: AnalysisData | null;
  currentStep: number;
  onStepChange: (step: number) => void;
}

const VisualizeTab: React.FC<VisualizeTabProps> = ({ analysisData, currentStep, onStepChange }) => {
  const { liveVisual } = useAnalysisStore();
  const [autoPlay, setAutoPlay] = useState(false);

  // Auto-detect animation flavor based on code characteristics
  const animationFlavor = useMemo(() => {
    if (!analysisData) return 'smooth';
    
    const hasLoops = analysisData.controlFlow.some(cf => cf.type === 'loop');
    const hasAsync = analysisData.functions.some(f => (f as any).async);
    const isComplex = analysisData.totalLines > 50 || analysisData.functions.length > 5;
    
    if (hasAsync) return 'energetic';
    if (hasLoops) return 'smooth';
    if (isComplex) return 'minimal';
    return 'smooth';
  }, [analysisData]);

  const animSpeed = animationFlavor === 'minimal' ? 300 : animationFlavor === 'energetic' ? 500 : 400;

  useEffect(() => {
    if (!autoPlay || !analysisData) return;

    const interval = setInterval(() => {
      const nextStep = currentStep + 1;
      if (nextStep >= analysisData.explanation.length) {
        setAutoPlay(false);
        return;
      }
      onStepChange(nextStep);
    }, 2000);

    return () => clearInterval(interval);
  }, [autoPlay, analysisData, onStepChange, currentStep]);

  // Render Live Visual (merged from LiveCanvas)
  const renderLiveVisual = () => {
    if (liveVisual.type === 'NONE' || !liveVisual.params) return null;

    const { params } = liveVisual;

    return (
      <div style={{
        padding: '30px',
        background: 'linear-gradient(135deg, #0e0e10 0%, #1a0a1e 100%)',
        borderRadius: '12px',
        border: '2px solid #bc13fe',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#bc13fe',
          letterSpacing: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <i className="fa-solid fa-bolt"></i> LIVE PREVIEW
        </div>

        {/* ARRAY PUSH */}
        {liveVisual.type === 'ARRAY_PUSH' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '40px', color: '#fff' }}>[</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {Array.isArray(params.prevItems) && params.prevItems.map((item: any, i: number) => (
                  <div
                    key={`prev-${i}`}
                    style={{
                      padding: '10px 15px',
                      background: '#1e1e1e',
                      border: '2px solid #ffd700',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '16px',
                      fontFamily: 'monospace',
                      opacity: 0.7
                    }}
                  >
                    {String(item)}
                  </div>
                ))}
                {params.value !== undefined && (
                  <div
                    style={{
                      padding: '10px 15px',
                      background: '#00f2ff',
                      color: '#000',
                      border: '2px solid #fff',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                  >
                    {String(params.value)}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '40px', color: '#fff' }}>]</span>
            </div>
            <div style={{ color: '#888', fontSize: '13px', fontFamily: 'monospace' }}>
              {params.arrayName || 'array'}.push(<span style={{ color: '#00f2ff', fontWeight: 'bold' }}>{String(params.value)}</span>)
            </div>
          </div>
        )}

        {/* VARIABLE BOX */}
        {liveVisual.type === 'VARIABLE_BOX' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#bc13fe', fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>
              {params.name || 'variable'}
            </div>
            <div style={{
              width: '120px',
              height: '120px',
              border: '3px solid #bc13fe',
              background: 'rgba(188, 19, 254, 0.1)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'borderFlash 1s infinite alternate'
            }}>
              <div style={{
                fontSize: '28px',
                color: '#fff',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}>
                {String(params.value ?? '')}
              </div>
            </div>
            <div style={{ color: '#888', fontSize: '12px', marginTop: '15px' }}>
              Storing value in memory...
            </div>
          </div>
        )}

        {/* CSS FLEX */}
        {liveVisual.type === 'CSS_FLEX' && (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div 
              style={{ 
                width: '300px',
                height: '180px',
                border: '2px dashed #666',
                background: '#1a1a1a',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: params.justify || 'flex-start',
                alignItems: params.align || 'stretch',
                padding: '10px',
                margin: '0 auto 20px',
                transition: 'all 0.5s ease'
              }}
            >
              {[1, 2, 3].map(num => (
                <div
                  key={num}
                  style={{
                    width: '50px',
                    height: '50px',
                    background: '#ff0055',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    margin: '5px'
                  }}
                >
                  {num}
                </div>
              ))}
            </div>
            <div style={{ color: '#888', fontSize: '12px', fontFamily: 'monospace' }}>
              justify: {params.justify || 'flex-start'} | align: {params.align || 'stretch'}
            </div>
          </div>
        )}

        <style>{`
          @keyframes popIn {
            0% { transform: scale(0) translateY(-50px); opacity: 0; }
            70% { transform: scale(1.2) translateY(0); opacity: 1; }
            100% { transform: scale(1); }
          }
          @keyframes borderFlash {
            from { box-shadow: 0 0 5px #bc13fe; }
            to { box-shadow: 0 0 20px #bc13fe; }
          }
        `}</style>
      </div>
    );
  };

  // Render Output-Based Visualization
  const renderOutputVisualization = () => {
    if (!analysisData) return null;

    const currentNode = analysisData.flowchart?.nodes?.[currentStep];
    const currentExplanation = analysisData.explanation[currentStep];

    // Extract output type from explanation
    const isLoop = currentExplanation?.toLowerCase().includes('loop');
    const isFunction = currentExplanation?.toLowerCase().includes('function');
    const isVariable = currentExplanation?.toLowerCase().includes('variable');
    const isConditional = currentExplanation?.toLowerCase().includes('conditional') || currentExplanation?.toLowerCase().includes('if');
    const isOutput = currentExplanation?.toLowerCase().includes('console') || currentExplanation?.toLowerCase().includes('print');

    // Calculate progress percentage
    const progressPercent = ((currentStep + 1) / analysisData.explanation.length) * 100;

    return (
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0e 0%, #1a0a1e 100%)',
        border: '2px solid rgba(0, 242, 255, 0.3)',
        borderRadius: '12px',
        padding: '25px',
        minHeight: '450px',
        position: 'relative'
      }}>
        {/* Progress Ring */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '50px',
          height: '50px'
        }}>
          <svg width="50" height="50" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="rgba(0, 242, 255, 0.2)"
              strokeWidth="4"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="#00f2ff"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercent / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#00f2ff'
          }}>
            {Math.round(progressPercent)}%
          </div>
        </div>

        {/* Current Execution Visual */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          border: '2px solid ' + (currentNode?.color || '#00f2ff'),
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '25px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Glow Effect */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            background: `radial-gradient(circle, ${currentNode?.color || '#00f2ff'}20 0%, transparent 70%)`,
            animation: 'pulse 3s ease-in-out infinite',
            pointerEvents: 'none'
          }} />

          {/* Animated Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: currentNode?.color || '#00f2ff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 30px ${currentNode?.color || '#00f2ff'}`,
            animation: isLoop ? 'spin 2s linear infinite' : 'pulse 2s ease-in-out infinite',
            position: 'relative',
            zIndex: 1
          }}>
            <i className={`fa-solid fa-${
              isLoop ? 'rotate' :
              isFunction ? 'code' :
              isVariable ? 'database' :
              isConditional ? 'code-branch' :
              isOutput ? 'terminal' :
              'play'
            }`} style={{ color: '#000', fontSize: '32px' }}></i>
          </div>

          {/* Main Label */}
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            position: 'relative',
            zIndex: 1
          }}>
            {currentNode?.label || 'Executing'}
          </div>

          {/* Explanation Text with Typewriter Effect */}
          <div style={{
            fontSize: '13px',
            color: '#00ff00',
            fontFamily: 'monospace',
            lineHeight: '1.8',
            maxWidth: '500px',
            margin: '0 auto',
            textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
            animation: `fadeIn ${animSpeed}ms ease-out`,
            position: 'relative',
            zIndex: 1
          }}>
            <span style={{ color: '#00f2ff', marginRight: '8px' }}>▶</span>
            {currentExplanation}
          </div>

          {/* Step Counter */}
          <div style={{
            marginTop: '15px',
            fontSize: '11px',
            color: '#888',
            fontFamily: 'monospace',
            position: 'relative',
            zIndex: 1
          }}>
            Step {currentStep + 1} of {analysisData.explanation.length}
          </div>
        </div>

        {/* Interactive Timeline */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '10px',
            color: '#888',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: 'bold'
          }}>
            Execution Timeline
          </div>
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '5px 0'
          }}>
            {analysisData.explanation.map((exp, idx) => {
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              const node = analysisData.flowchart?.nodes?.[idx];

              return (
                <div
                  key={idx}
                  onClick={() => onStepChange(idx)}
                  title={exp}
                  style={{
                    minWidth: '45px',
                    height: '45px',
                    borderRadius: '8px',
                    background: isActive 
                      ? `linear-gradient(135deg, ${node?.color || '#00f2ff'}, ${node?.color || '#bc13fe'})`
                      : isPast
                      ? 'rgba(0, 242, 255, 0.3)'
                      : 'rgba(100, 100, 100, 0.2)',
                    border: `2px solid ${isActive ? '#fff' : 'transparent'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: isActive ? '#000' : isPast ? '#00f2ff' : '#666',
                    boxShadow: isActive ? `0 0 20px ${node?.color || '#00f2ff'}80` : 'none',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.borderColor = '#00f2ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  {isPast ? (
                    <i className="fa-solid fa-check"></i>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '0',
                      height: '0',
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '5px solid #fff'
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Insights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px'
        }}>
          {/* Variables */}
          {analysisData.variables && analysisData.variables.length > 0 && (
            <div style={{
              padding: '15px',
              background: 'rgba(188, 19, 254, 0.05)',
              border: '1px solid rgba(188, 19, 254, 0.3)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '11px',
                color: '#bc13fe',
                fontWeight: 'bold',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className="fa-solid fa-database"></i>
                VARIABLES ({analysisData.variables.slice(0, currentStep + 1).length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysisData.variables.slice(0, currentStep + 1).map((v, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '5px 10px',
                      background: 'rgba(188, 19, 254, 0.15)',
                      border: '1px solid rgba(188, 19, 254, 0.4)',
                      borderRadius: '6px',
                      fontSize: '10px',
                      color: '#bc13fe',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      animation: `slideUp ${animSpeed}ms ease-out ${idx * 100}ms both`
                    }}
                  >
                    {v.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Functions */}
          {analysisData.functions && analysisData.functions.length > 0 && (
            <div style={{
              padding: '15px',
              background: 'rgba(0, 242, 255, 0.05)',
              border: '1px solid rgba(0, 242, 255, 0.3)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '11px',
                color: '#00f2ff',
                fontWeight: 'bold',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className="fa-solid fa-code"></i>
                FUNCTIONS ({analysisData.functions.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysisData.functions.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '5px 10px',
                      background: 'rgba(0, 242, 255, 0.15)',
                      border: '1px solid rgba(0, 242, 255, 0.4)',
                      borderRadius: '6px',
                      fontSize: '10px',
                      color: '#00f2ff',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      animation: `slideUp ${animSpeed}ms ease-out ${idx * 100}ms both`
                    }}
                  >
                    {f.name}()
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  };

  // Priority: Show live visual if available
  if (liveVisual && liveVisual.type !== 'NONE') {
    return renderLiveVisual();
  }

  return (
    <>
      {analysisData && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <ProgressBar
              currentStep={currentStep}
              totalSteps={analysisData.explanation.length}
              onStepChange={onStepChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={() => onStepChange(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              style={{
                padding: '10px 18px',
                background: currentStep === 0 ? '#333' : 'linear-gradient(135deg, #bc13fe, #8a0fc9)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                opacity: currentStep === 0 ? 0.5 : 1,
                transition: 'all 0.2s',
                boxShadow: currentStep === 0 ? 'none' : '0 4px 15px rgba(188, 19, 254, 0.4)'
              }}
            >
              <i className="fa-solid fa-chevron-left"></i> Previous
            </button>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              style={{
                padding: '10px 18px',
                background: autoPlay 
                  ? 'linear-gradient(135deg, #00f2ff, #00b8cc)' 
                  : 'linear-gradient(135deg, #bc13fe, #8a0fc9)',
                border: 'none',
                borderRadius: '8px',
                color: autoPlay ? '#000' : 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                flex: 1,
                transition: 'all 0.2s',
                boxShadow: autoPlay 
                  ? '0 4px 15px rgba(0, 242, 255, 0.6)' 
                  : '0 4px 15px rgba(188, 19, 254, 0.4)'
              }}
            >
              <i className={`fa-solid fa-${autoPlay ? 'pause' : 'play'}`}></i> {autoPlay ? 'Pause' : 'Auto Play'}
            </button>
            <button
              onClick={() => onStepChange(Math.min(analysisData.explanation.length - 1, currentStep + 1))}
              disabled={currentStep === analysisData.explanation.length - 1}
              style={{
                padding: '10px 18px',
                background: currentStep === analysisData.explanation.length - 1 ? '#333' : 'linear-gradient(135deg, #bc13fe, #8a0fc9)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: currentStep === analysisData.explanation.length - 1 ? 'not-allowed' : 'pointer',
                opacity: currentStep === analysisData.explanation.length - 1 ? 0.5 : 1,
                transition: 'all 0.2s',
                boxShadow: currentStep === analysisData.explanation.length - 1 ? 'none' : '0 4px 15px rgba(188, 19, 254, 0.4)'
              }}
            >
              Next <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </>
      )}

      <div>
        {analysisData ? renderOutputVisualization() : (
          <div style={{
            padding: '80px 40px',
            textAlign: 'center',
            border: '2px dashed rgba(0, 242, 255, 0.3)',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(10, 10, 14, 0.5), rgba(26, 10, 30, 0.5))'
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              margin: '0 auto 25px',
              border: '3px solid rgba(0, 242, 255, 0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <i className="fa-solid fa-code" style={{ fontSize: '32px', color: '#00f2ff' }}></i>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#888', fontWeight: 'bold' }}>
              Ready to Analyze
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>
              Write code and click analyze to see execution visualization
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default VisualizeTab;
