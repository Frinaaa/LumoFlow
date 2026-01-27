import React from 'react';

interface StackTraceLine {
  raw: string;
  isStackTrace: boolean;
  filePath?: string;
  line?: number;
  column?: number;
  functionName?: string;
}

interface StackTraceParserProps {
  output: string;
  onFileClick?: (filePath: string, line: number, column: number) => void;
}

/**
 * Parses Node.js stack traces and makes them clickable
 * Handles patterns like:
 * - at functionName (file.js:5:12)
 * - at Object.<anonymous> (file.js:5:12)
 * - at async functionName (file.js:5:12)
 */
export const StackTraceParser: React.FC<StackTraceParserProps> = ({ output, onFileClick }) => {
  const parseStackTraces = (text: string): StackTraceLine[] => {
    const lines = text.split('\n');
    return lines.map(line => {
      // Pattern: at functionName (path/to/file.js:line:column)
      const stackTracePattern = /at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/;
      const match = line.match(stackTracePattern);

      if (match) {
        return {
          raw: line,
          isStackTrace: true,
          functionName: match[1],
          filePath: match[2],
          line: parseInt(match[3], 10),
          column: parseInt(match[4], 10),
        };
      }

      return {
        raw: line,
        isStackTrace: false,
      };
    });
  };

  const handleStackTraceClick = (filePath: string, line: number, column: number) => {
    if (onFileClick) {
      onFileClick(filePath, line, column);
    }
  };

  const parsedLines = parseStackTraces(output);

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
      {parsedLines.map((item, idx) => (
        <div key={idx}>
          {item.isStackTrace && item.filePath ? (
            <div style={{ color: '#ccc' }}>
              at{' '}
              <span style={{ color: '#ce9178' }}>{item.functionName}</span>
              {' '}(
              <span
                onClick={() => handleStackTraceClick(item.filePath!, item.line!, item.column!)}
                style={{
                  color: '#00f2ff',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#4ec9b0';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#00f2ff';
                }}
                title={`Click to open ${item.filePath}:${item.line}:${item.column}`}
              >
                {item.filePath}:{item.line}:{item.column}
              </span>
              )
            </div>
          ) : (
            <div style={{ color: item.raw.includes('Error') ? '#f14c4c' : '#ccc' }}>
              {item.raw}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Utility function to extract file references from error output
 */
export const extractFileReferences = (output: string): Array<{ filePath: string; line: number; column: number }> => {
  const pattern = /at\s+.+?\s+\((.+?):(\d+):(\d+)\)/g;
  const matches: Array<{ filePath: string; line: number; column: number }> = [];
  let match;

  while ((match = pattern.exec(output)) !== null) {
    matches.push({
      filePath: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
    });
  }

  return matches;
};
