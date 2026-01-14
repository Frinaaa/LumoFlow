import React from 'react';
import { useNavigate } from 'react-router-dom';

interface IDEHeaderProps {
  onAnalyze: () => void;
  onRun: () => void;
  onSave: () => void;
  isRunning: boolean;
  hasUnsavedChanges?: boolean;
}

const IDEHeader: React.FC<IDEHeaderProps> = ({ 
  onAnalyze, 
  onRun, 
  onSave, 
  isRunning,
  hasUnsavedChanges = false
}) => {
  const navigate = useNavigate();

  return (
    <header className="ide-header">
      <div className="ide-brand">
        <i className="fa-solid fa-bolt"></i> LUMO<span>FLOW</span>
      </div>
      <div className="ide-actions">
        <button 
          className="btn-analyze" 
          onClick={onAnalyze} 
          title="Analyze Code (Ctrl+Shift+A)"
        >
          <i className="fa-solid fa-microchip"></i> Analyze
        </button>

        <button 
          className="btn-run" 
          onClick={onRun} 
          disabled={isRunning} 
          title="Run Code (Ctrl+Enter)"
        >
          <i className={`fa-solid ${isRunning ? 'fa-spinner fa-spin' : 'fa-play'}`}></i> 
          {isRunning ? 'Running...' : 'Run'}
        </button>

        <button 
          className={`btn-icon ${hasUnsavedChanges ? 'unsaved' : ''}`}
          onClick={onSave} 
          title="Save (Ctrl+S)"
        >
          <i className="fa-solid fa-floppy-disk"></i>
          {hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
        </button>

        <button 
          className="btn-icon" 
          onClick={() => navigate('/dashboard')} 
          title="Dashboard"
        >
          <i className="fa-solid fa-house"></i>
        </button>

        <button 
          className="btn-icon" 
          onClick={() => navigate('/settings')} 
          title="Settings"
        >
          <i className="fa-solid fa-gear"></i>
        </button>
      </div>
    </header>
  );
};

export default IDEHeader;
