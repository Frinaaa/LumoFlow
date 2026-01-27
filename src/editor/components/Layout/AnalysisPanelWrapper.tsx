import React from 'react';
import { useAnalysisStore } from '../../stores/analysisStore';

export const AnalysisPanelWrapper = () => {
  const { isVisible, data, isAnalyzing, currentStep, setStep, togglePanel } = useAnalysisStore();
  const [activeTab, setActiveTab] = React.useState<'flow' | 'explain'>('flow');

  if (!isVisible) return null;

  return (
    <div
      style={{
        width: '350px',
        background: '#0e0e10',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '35px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          background: '#1e1e1e',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ccc' }}>LUMO ANALYSIS</span>
        <i
          className="fa-solid fa-xmark"
          onClick={togglePanel}
          style={{
            cursor: 'pointer',
            color: '#888',
            fontSize: '12px',
          }}
        ></i>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isAnalyzing ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontSize: '13px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '10px' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px' }}></i>
              </div>
              Processing Neural Link...
            </div>
          </div>
        ) : data ? (
          <>
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #333',
                background: '#1e1e1e',
              }}
            >
              <button
                onClick={() => setActiveTab('flow')}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: activeTab === 'flow' ? '#007acc' : 'transparent',
                  color: activeTab === 'flow' ? 'white' : '#888',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: activeTab === 'flow' ? 'bold' : 'normal',
                }}
              >
                Flowchart
              </button>
              <button
                onClick={() => setActiveTab('explain')}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: activeTab === 'explain' ? '#007acc' : 'transparent',
                  color: activeTab === 'explain' ? 'white' : '#888',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: activeTab === 'explain' ? 'bold' : 'normal',
                }}
              >
                Logic
              </button>
            </div>

            {/* Panel Content */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '10px',
                color: '#ccc',
                fontSize: '12px',
              }}
            >
              {activeTab === 'flow' ? (
                <div>
                  <div style={{ marginBottom: '10px', color: '#888' }}>
                    Flowchart visualization would render here
                  </div>
                  <pre style={{ background: '#1e1e1e', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '10px', color: '#888' }}>
                    Logic explanation would render here
                  </div>
                  <p>{data?.explanation || 'No explanation available'}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '13px',
            }}
          >
            Run analysis to see data
          </div>
        )}
      </div>
    </div>
  );
};
