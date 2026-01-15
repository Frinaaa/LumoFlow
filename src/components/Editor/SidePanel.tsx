import React, { useState } from 'react';

const AnalysisPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Visualize');

  const tabs = [
    { name: 'Visualize', icon: 'fa-chart-line' },
    { name: 'Explanation', icon: 'fa-book' },
    { name: 'Interaction', icon: 'fa-hand-pointer' },
    { name: 'Games', icon: 'fa-gamepad' }
  ];

  return (
    <div className="analysis-panel-wrapper">
      {/* Navigation Tabs - Integrated at top */}
      <div className="analysis-panel-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            className={`analysis-tab-btn ${activeTab === tab.name ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.name)}
            title={tab.name}
          >
            <i className={`fa-solid ${tab.icon}`}></i>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content Area - Full Height */}
      <div className="analysis-panel-content">
        {activeTab === 'Visualize' && (
          <>
            <p className="analysis-desc">
              Interactive flow diagram of the code execution, showing variable states and transitions.
            </p>

            {/* Flowchart Container */}
            <div className="flow-visual-card">
              
              {/* Row 1 */}
              <div className="flow-row">
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

              {/* Data Popover */}
              <div className="data-popover-card">
                <div className="popover-accent"></div>
                <div className="popover-content">
                  <span className="pop-label">Current Index:</span> <strong>2</strong><br/>
                  <span className="pop-label">Buffer Size:</span> <strong>1024kb</strong>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'Explanation' && (
          <div className="analysis-content-section">
            <h4>Code Explanation</h4>
            <p>This section provides detailed explanations of your code logic and execution flow.</p>
            <ul>
              <li>Function calls and their order</li>
              <li>Variable state changes</li>
              <li>Control flow decisions</li>
              <li>Performance metrics</li>
            </ul>
          </div>
        )}

        {activeTab === 'Interaction' && (
          <div className="analysis-content-section">
            <h4>Interactive Elements</h4>
            <p>Hover over code elements to see their execution details in real-time.</p>
            <div className="interaction-demo">
              <div className="demo-item">
                <span className="demo-label">Variables:</span>
                <code>x = 10, y = 20</code>
              </div>
              <div className="demo-item">
                <span className="demo-label">Return:</span>
                <code>30</code>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Games' && (
          <div className="analysis-content-section">
            <h4>Learning Games</h4>
            <p>Interactive games to help you understand code concepts better.</p>
            <button className="game-btn">
              <i className="fa-solid fa-gamepad"></i> Start Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;