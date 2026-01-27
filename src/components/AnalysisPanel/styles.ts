export const analysisPanelStyles = `
  @keyframes pulse {
    0%, 100% { transform: scale(1.2); }
    50% { transform: scale(1.3); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .analysis-panel-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .analysis-panel-tabs {
    display: flex;
    gap: 4px;
    padding: 6px 8px;
    background: #1e1e1e;
    border-bottom: 1px solid #333;
    overflow-x: auto;
    overflow-y: hidden;
    flex-wrap: nowrap;
  }
  
  .analysis-panel-tabs::-webkit-scrollbar {
    height: 4px;
  }
  
  .analysis-panel-tabs::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .analysis-panel-tabs::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 2px;
  }
  
  .analysis-tab-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 10px;
    background: transparent;
    border: 1px solid #333;
    border-radius: 3px;
    color: #888;
    cursor: pointer;
    font-size: 11px;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }
  
  .analysis-tab-btn i {
    font-size: 10px;
  }
  
  .analysis-tab-btn:hover {
    background: #2d2d30;
    color: #fff;
  }
  
  .analysis-tab-btn.active {
    background: #00f2ff;
    color: #000;
    border-color: #00f2ff;
    font-weight: bold;
  }
  
  .analysis-panel-content {
    flex: 1;
    overflow: auto;
    padding: 12px;
    background: #1e1e1e;
  }
  
  .analysis-content-section {
    padding: 12px;
  }
  
  .analysis-panel-content::-webkit-scrollbar,
  .flowchart-container::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .analysis-panel-content::-webkit-scrollbar-track,
  .flowchart-container::-webkit-scrollbar-track {
    background: #1e1e1e;
  }
  
  .analysis-panel-content::-webkit-scrollbar-thumb,
  .flowchart-container::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }
  
  .analysis-panel-content::-webkit-scrollbar-thumb:hover,
  .flowchart-container::-webkit-scrollbar-thumb:hover {
    background: #777;
  }

  .progress-bar-container {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    padding: 10px;
    background: #2d2d30;
    border-radius: 6px;
    border: 1px solid #3e3e42;
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: #1e1e1e;
    border-radius: 3px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #00f2ff, #bc13fe);
    transition: width 0.1s ease;
    border-radius: 3px;
  }

  .progress-bar-thumb {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 14px;
    height: 14px;
    background: #00f2ff;
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 0 8px #00f2ff;
    z-index: 10;
  }

  .progress-bar-thumb:active {
    cursor: grabbing;
  }

  .step-counter {
    font-size: 11px;
    color: #888;
    min-width: 50px;
    text-align: right;
  }
`;
