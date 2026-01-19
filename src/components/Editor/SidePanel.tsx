import React, { useState, useEffect } from 'react';
import VisualizeTab from './AnalysisPanel/VisualizeTab';
import ExplanationTab from './AnalysisPanel/ExplanationTab';
import InteractionTab from './AnalysisPanel/InteractionTab';
import GamesTab from './AnalysisPanel/GamesTab';
import { analysisPanelStyles } from './AnalysisPanel/styles';

interface AnalysisPanelProps {
  code?: string;
  language?: string;
  isVisible?: boolean;
}

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

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ code = '', language = 'javascript', isVisible = false }) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('Visualize');

  useEffect(() => {
    if (isVisible && code.trim()) {
      analyzeCode();
    }
  }, [isVisible, code, language]);

  const analyzeCode = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    setCurrentStep(0);

    try {
      const userInfo = localStorage.getItem('user_info');
      const user = userInfo ? JSON.parse(userInfo) : null;

      const result = await window.api.analyzeCode({
        code,
        language,
        userId: user?._id || user?.id || undefined,
        fileId: undefined
      });

      if (result.success) {
        setAnalysisData(result.analysis);
      } else {
        console.error('Analysis failed:', result.msg);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { name: 'Visualize', icon: 'fa-chart-line' },
    { name: 'Explanation', icon: 'fa-book' },
    { name: 'Interaction', icon: 'fa-hand-pointer' },
    { name: 'Games', icon: 'fa-gamepad' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Visualize':
        return (
          <VisualizeTab
            analysisData={analysisData}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />
        );
      case 'Explanation':
        return <ExplanationTab analysisData={analysisData} />;
      case 'Interaction':
        return <InteractionTab analysisData={analysisData} />;
      case 'Games':
        return <GamesTab />;
      default:
        return null;
    }
  };

  return (
    <div className="analysis-panel-wrapper">
      <style>{analysisPanelStyles}</style>

      {/* Navigation Tabs */}
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

      {/* Content Area */}
      <div className="analysis-panel-content">
        {isAnalyzing && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#00f2ff'
          }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
            Analyzing code...
          </div>
        )}

        {!isAnalyzing && renderTabContent()}
      </div>
    </div>
  );
};

export default AnalysisPanel;
