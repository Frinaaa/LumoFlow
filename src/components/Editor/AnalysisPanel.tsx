import React, { useState } from 'react';

const AnalysisPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Visualize');

  return (
    <div className="analysis-panel">
      <div className="analysis-header-row">
        <h2 className="analysis-title">LumoFlow Analysis</h2>
      </div>

      {/* Navigation Tabs */}
      <div className="analysis-tabs">
        {['Visualize', 'Explanation', 'Interaction', 'Games'].map((tab) => (
          <button
            key={tab}
            className={`a-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <p className="analysis-desc">
        Interactive flow diagram of the code execution, showing variable states and transitions.
        Hover over elements for detailed information.
      </p>

      {/* Flowchart Container (Light Background) */}
      <div className="flow-visual-card">
        
        {/* Row 1 */}
        <div className="flow-row top">
          <div className="flow-node-pill">initialize()</div>
          <div className="connector-line horizontal"></div>
          <div className="flow-node-pill">loadConfig()</div>
        </div>

        {/* Vertical Connector */}
        <div className="connector-line vertical"></div>

        {/* Row 2 */}
        <div className="flow-row">
          <div className="flow-node-pill">isValid?</div>
        </div>

        {/* Vertical Connector */}
        <div className="connector-line vertical"></div>

        {/* Row 3 */}
        <div className="flow-row">
          <div className="flow-node-pill highlight-cyan">Process Data</div>
        </div>

        {/* Floating Data Popover (The purple-bordered box) */}
        <div className="data-popover-card">
          <div className="popover-accent"></div>
          <div className="popover-content">
            <span className="pop-label">Current Index:</span> <strong>2</strong><br/>
            <span className="pop-label">Buffer Size:</span> <strong>1024kb</strong>
          </div>
        </div>

        {/* Cursor Icon Mock */}
        <i className="fa-solid fa-arrow-pointer cursor-mock"></i>
      </div>
    </div>
  );
};

export default AnalysisPanel;