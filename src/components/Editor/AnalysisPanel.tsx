import React, { useState } from 'react';

const AnalysisPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Visualize');

  return (
    <div className="analysis-panel">
      <div className="analysis-header">
        <h2>LumoFlow Analysis</h2>
      </div>

      <div className="analysis-tabs">
        {['Visualize', 'Explanation', 'Interaction', 'Games'].map(tab => (
          <div 
            key={tab} 
            className={`a-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="analysis-content">
        <p style={{color: '#888', fontSize: '13px', marginBottom: '20px'}}>
          Interactive flow diagram of the execution, showing variable states and transitions.
          Hover over elements for detailed information.
        </p>

        {/* CSS-BASED FLOWCHART (Mocking the Image) */}
        <div className="flow-container">
          
          {/* Row 1 */}
          <div className="flow-row">
            <div className="flow-node">initialize()</div>
            <div className="connector-h"></div>
            <div className="flow-node">loadConfig()</div>
          </div>

          <div className="connector-v"></div>

          {/* Row 2 */}
          <div className="flow-row" style={{justifyContent: 'center'}}>
            <div className="flow-node purple">isValid?</div>
          </div>

          <div className="connector-v"></div>

          {/* Row 3 */}
          <div className="flow-row" style={{justifyContent: 'center'}}>
            <div className="flow-node cyan active">Process Data</div>
          </div>

          {/* Popover Logic Bubble */}
          <div className="data-popover">
            <strong>Current Index: 2</strong><br/>
            <span style={{color: '#666'}}>Buffer Size: 1024kb</span>
          </div>

          {/* Cursor Mock */}
          <div style={{
            position: 'absolute', bottom: '100px', right: '80px', 
            fontSize: '24px', color: 'black'
          }}>
            <i className="fa-solid fa-arrow-pointer"></i>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;