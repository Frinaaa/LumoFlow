import React from 'react';
import { useNavigate } from 'react-router-dom';

interface IDEHeaderProps {
  onAnalyze: () => void;
  onRun: () => void;
  onSave: () => void;
  isAnalysisMode: boolean;
}

const IDEHeader: React.FC<IDEHeaderProps> = ({ 
  onAnalyze, onRun, onSave, isAnalysisMode 
}) => {
  const navigate = useNavigate();

  return (
    <header className="ide-header">
      {/* Left: Brand */}
      <div className="ide-brand">
        <i className="fa-solid fa-bolt"></i> LUMO<span>FLOW</span>
      </div>

      {/* Right: Actions */}
      <div className="ide-actions">
        {/* Analyze Button - Toggles Split View */}
        <button className="btn-analyze" onClick={onAnalyze}>
          <i className="fa-solid fa-microchip"></i> {isAnalysisMode ? 'Close Analysis' : 'Analyze'}
        </button>

        {/* Run Button */}
        <button className="btn-run" onClick={onRun}>
           <i className="fa-solid fa-play"></i> Run
        </button>

        {/* Standard Actions */}
        <button className="btn-icon" onClick={onSave} title="Save">
            <i className="fa-solid fa-floppy-disk"></i>
        </button>
        <button className="btn-icon" onClick={() => navigate('/dashboard')} title="Home">
            <i className="fa-solid fa-house"></i>
        </button>
        <button className="btn-icon" title="GitHub Settings">
            <i className="fa-solid fa-gear"></i>
        </button>
      </div>
    </header>
  );
};

export default IDEHeader;