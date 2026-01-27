import React, { useEffect, useState } from 'react';
import { useFileStore } from '../../stores/fileStore';

interface NPMScript {
  name: string;
  command: string;
}

export const NPMScriptsSidebar: React.FC<{ onRunScript?: (script: NPMScript) => void }> = ({ onRunScript }) => {
  const [scripts, setScripts] = useState<NPMScript[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningScript, setRunningScript] = useState<string | null>(null);

  const fileStore = useFileStore();

  const loadScripts = async () => {
    if (!fileStore.workspacePath) return;

    setLoading(true);
    try {
      // Read package.json
      const packageJsonPath = `${fileStore.workspacePath}/package.json`;
      const result = await window.api?.readFile(packageJsonPath);
      
      if (result) {
        const packageJson = JSON.parse(result);
        const scriptsList: NPMScript[] = Object.entries(packageJson.scripts || {}).map(
          ([name, command]) => ({
            name,
            command: command as string
          })
        );
        setScripts(scriptsList);
      }
    } catch (error) {
      console.error('Failed to load package.json:', error);
      setScripts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScripts();
  }, [fileStore.workspacePath]);

  const handleRunScript = async (script: NPMScript) => {
    setRunningScript(script.name);
    try {
      if (onRunScript) {
        onRunScript(script);
      } else {
        // Default: execute via terminal
        if (window.api?.executeCommand) {
          await window.api.executeCommand(`npm run ${script.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to run script:', error);
    } finally {
      setRunningScript(null);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#1e1e1e',
        color: '#ccc',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #3c3c3c',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          color: '#888',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        NPM SCRIPTS
        <i
          className="fa-solid fa-rotate-right"
          onClick={loadScripts}
          style={{
            cursor: 'pointer',
            fontSize: '12px',
            opacity: loading ? 0.5 : 1,
          }}
          title="Reload scripts"
        />
      </div>

      {/* Scripts List */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 0',
        }}
      >
        {loading ? (
          <div
            style={{
              padding: '20px 12px',
              textAlign: 'center',
              color: '#666',
              fontSize: '12px',
            }}
          >
            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} />
            Loading scripts...
          </div>
        ) : scripts.length === 0 ? (
          <div
            style={{
              padding: '20px 12px',
              textAlign: 'center',
              color: '#666',
              fontSize: '12px',
            }}
          >
            <i className="fa-solid fa-box" style={{ display: 'block', marginBottom: '8px', fontSize: '24px' }} />
            No scripts found
            <div style={{ fontSize: '11px', marginTop: '8px', color: '#555' }}>
              Add scripts to package.json
            </div>
          </div>
        ) : (
          scripts.map((script) => (
            <div
              key={script.name}
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #3c3c3c',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                background: 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <i
                className={`fa-solid fa-${
                  script.name === 'start'
                    ? 'play'
                    : script.name === 'build'
                    ? 'hammer'
                    : script.name === 'test'
                    ? 'flask-vial'
                    : 'terminal'
                }`}
                style={{
                  fontSize: '12px',
                  color: '#00f2ff',
                  width: '16px',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{script.name}</div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#888',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {script.command}
                </div>
              </div>
              <button
                onClick={() => handleRunScript(script)}
                disabled={runningScript !== null}
                style={{
                  background: runningScript === script.name ? '#0e639c' : '#555',
                  border: 'none',
                  borderRadius: '3px',
                  color: '#fff',
                  padding: '4px 8px',
                  cursor: runningScript === null ? 'pointer' : 'not-allowed',
                  fontSize: '11px',
                  opacity: runningScript === script.name ? 0.8 : 1,
                }}
                title={`Run: npm run ${script.name}`}
              >
                {runningScript === script.name ? (
                  <i className="fa-solid fa-spinner fa-spin" />
                ) : (
                  <i className="fa-solid fa-play" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
