import React from 'react';

interface StatusBarProps {
  line: number;
  col: number;
  language: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ line, col, language }) => {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  const statusItemStyle = (itemKey: string) => ({
    cursor: 'pointer',
    padding: '0 8px',
    height: '22px',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    transform: hoveredItem === itemKey ? 'translateY(-2px)' : 'translateY(0)',
    background: hoveredItem === itemKey ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    borderRadius: '2px'
  });

  return (
    <div style={{
      height: '22px',
      background: '#bc13fe',
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
      <div style={{ display: 'flex', gap: '5px' }}>
        <div 
          style={statusItemStyle('branch')}
          title="Current branch: main (uncommitted changes)"
          onMouseEnter={() => setHoveredItem('branch')}
          onMouseLeave={() => setHoveredItem(null)}
        >
           <i className="fa-solid fa-code-branch" style={{ fontSize: '10px', marginRight: '5px' }}></i>
           <span>main*</span>
        </div>
        <div 
          style={statusItemStyle('errors')}
          title="No errors or warnings"
          onMouseEnter={() => setHoveredItem('errors')}
          onMouseLeave={() => setHoveredItem(null)}
        >
           <i className="fa-regular fa-circle-xmark" style={{ marginRight: '3px' }}></i> 0
           <i className="fa-solid fa-triangle-exclamation" style={{ marginLeft: '8px', marginRight: '3px' }}></i> 0
        </div>
      </div>

      {/* RIGHT SECTION: CURSOR INFO */}
      <div style={{ display: 'flex', gap: '5px' }}>
        <div 
          style={statusItemStyle('position')}
          title={`Line ${line}, Column ${col}`}
          onMouseEnter={() => setHoveredItem('position')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          Ln {line}, Col {col}
        </div>
        <div 
          style={statusItemStyle('spaces')}
          title="Indentation: 2 spaces"
          onMouseEnter={() => setHoveredItem('spaces')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          Spaces: 2
        </div>
        <div 
          style={statusItemStyle('encoding')}
          title="File encoding: UTF-8"
          onMouseEnter={() => setHoveredItem('encoding')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          UTF-8
        </div>
        <div 
          style={statusItemStyle('eol')}
          title="End of line sequence: CRLF"
          onMouseEnter={() => setHoveredItem('eol')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          CRLF
        </div>
        <div 
          style={{...statusItemStyle('language'), fontWeight: 600}}
          title="Select language mode"
          onMouseEnter={() => setHoveredItem('language')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {language === 'javascript' ? '{ } JavaScript' : 
           language === 'python' ? '🐍 Python' : 
           language === 'typescript' ? '{ } TypeScript' : 'Plain Text'}
        </div>
        <div 
          style={statusItemStyle('notifications')}
          title="Notifications"
          onMouseEnter={() => setHoveredItem('notifications')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <i className="fa-regular fa-bell"></i>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;