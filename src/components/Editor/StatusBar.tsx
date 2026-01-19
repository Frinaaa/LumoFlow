import React from 'react';

interface StatusBarProps {
  line: number;
  col: number;
  language: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ line, col, language }) => {
  return (
    <div style={{
      height: '22px',
      background: '#bc13fe', //  purple
      color: 'white',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      justifyContent: 'space-between',
      fontFamily: "'Segoe UI', sans-serif",
      userSelect: 'none',
      zIndex: 20
    }}>
      {/* LEFT SECTION: GIT & ERRORS */}
      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
           <i className="fa-solid fa-code-branch" style={{ fontSize: '10px' }}></i>
           <span>main*</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
           <i className="fa-regular fa-circle-xmark"></i> 0
           <i className="fa-solid fa-triangle-exclamation" style={{ marginLeft: '5px' }}></i> 0
        </div>
      </div>

      {/* RIGHT SECTION: CURSOR INFO */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ cursor: 'pointer' }}>
          Ln {line}, Col {col}
        </div>
        <div style={{ cursor: 'pointer' }}>
          Spaces: 2
        </div>
        <div style={{ cursor: 'pointer' }}>
          UTF-8
        </div>
        <div style={{ cursor: 'pointer' }}>
          CRLF
        </div>
        <div style={{ cursor: 'pointer', fontWeight: 600 }}>
          {language === 'javascript' ? '{ } JavaScript' : 
           language === 'python' ? '🐍 Python' : 
           language === 'typescript' ? '{ } TypeScript' : 'Plain Text'}
        </div>
        <div style={{ cursor: 'pointer' }}>
          <i className="fa-regular fa-bell"></i>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;