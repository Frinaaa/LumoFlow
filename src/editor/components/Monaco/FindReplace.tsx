import React, { useState, useRef, useEffect } from 'react';

interface FindReplaceProps {
  editorRef: React.MutableRefObject<any>;
  isVisible: boolean;
  onClose: () => void;
}

const FindReplace: React.FC<FindReplaceProps> = ({ editorRef, isVisible, onClose }) => {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          findPrevious();
        } else {
          findNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, searchText]);

  const buildRegex = () => {
    let pattern = searchText;
    let flags = 'g';

    if (!regex) {
      pattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    if (!caseSensitive) {
      flags += 'i';
    }

    if (wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    try {
      return new RegExp(pattern, flags);
    } catch (e) {
      return null;
    }
  };

  const findMatches = () => {
    if (!editorRef.current || !searchText) {
      setMatchCount(0);
      return;
    }

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const text = model.getValue();
    const regexPattern = buildRegex();
    
    if (!regexPattern) {
      setMatchCount(0);
      return;
    }

    try {
      const matches = text.match(regexPattern);
      setMatchCount(matches ? matches.length : 0);
    } catch (e) {
      setMatchCount(0);
    }
  };

  useEffect(() => {
    findMatches();
  }, [searchText, caseSensitive, wholeWord, regex]);

  const findNext = () => {
    if (!editorRef.current || !searchText) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const regexPattern = buildRegex();
    if (!regexPattern) return;

    const text = model.getValue();
    const currentPos = editor.getPosition();
    const currentOffset = model.getOffsetAt(currentPos);
    
    let nextMatch = null;
    let nextOffset = -1;
    
    const regex = buildRegex();
    if (!regex) return;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index >= currentOffset) {
        nextMatch = match;
        nextOffset = match.index;
        break;
      }
    }
    
    if (nextMatch) {
      const startPos = model.getPositionAt(nextOffset);
      const endPos = model.getPositionAt(nextOffset + nextMatch[0].length);
      editor.setSelection({
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column
      });
      editor.revealRangeInCenter({
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column
      });
    }
  };

  const findPrevious = () => {
    if (!editorRef.current || !searchText) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const regexPattern = buildRegex();
    if (!regexPattern) return;

    const text = model.getValue();
    const currentPos = editor.getPosition();
    const currentOffset = model.getOffsetAt(currentPos);
    
    let prevMatch = null;
    let prevOffset = -1;
    
    const regex = buildRegex();
    if (!regex) return;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index < currentOffset) {
        prevMatch = match;
        prevOffset = match.index;
      } else {
        break;
      }
    }
    
    if (prevMatch) {
      const startPos = model.getPositionAt(prevOffset);
      const endPos = model.getPositionAt(prevOffset + prevMatch[0].length);
      editor.setSelection({
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column
      });
      editor.revealRangeInCenter({
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column
      });
    }
  };

  const replaceOne = () => {
    if (!editorRef.current || !searchText) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const selection = editor.getSelection();
    if (!selection) return;

    const selectedText = model.getValueInRange(selection);
    const regexPattern = buildRegex();
    
    if (regexPattern && regexPattern.test(selectedText)) {
      const newText = selectedText.replace(regexPattern, replaceText);
      editor.executeEdits('replace', [
        {
          range: selection,
          text: newText
        }
      ]);
      findNext();
    }
  };

  const replaceAll = () => {
    if (!editorRef.current || !searchText) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const text = model.getValue();
    const regexPattern = buildRegex();
    
    if (!regexPattern) return;

    const newText = text.replace(regexPattern, replaceText);
    
    if (newText !== text) {
      editor.executeEdits('replaceAll', [
        {
          range: model.getFullModelRange(),
          text: newText
        }
      ]);
      findMatches();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="find-replace-panel">
      {/* Search Row */}
      <div className="find-replace-row">
        <input
          ref={searchInputRef}
          type="text"
          className="find-replace-input"
          placeholder="Search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <div className="find-replace-options">
          <button
            className={`find-replace-option-btn ${caseSensitive ? 'active' : ''}`}
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="Match Case (Aa)"
          >
            Aa
          </button>
          <button
            className={`find-replace-option-btn ${wholeWord ? 'active' : ''}`}
            onClick={() => setWholeWord(!wholeWord)}
            title="Match Whole Word (ab)"
          >
            ab
          </button>
          <button
            className={`find-replace-option-btn ${regex ? 'active' : ''}`}
            onClick={() => setRegex(!regex)}
            title="Use Regular Expression (.*)"
          >
            .*
          </button>
        </div>
        <span className="find-replace-counter">
          {matchCount > 0 ? matchCount : 'No results'}
        </span>
        <button
          className="find-replace-button close"
          onClick={onClose}
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Replace Row - Only shown when toggled */}
      {showReplace && (
        <div className="find-replace-row">
          <input
            type="text"
            className="find-replace-input"
            placeholder="Replace"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
          />
          <button
            className="find-replace-button"
            onClick={replaceOne}
            title="Replace (Ctrl+Shift+1)"
          >
            Replace
          </button>
          <button
            className="find-replace-button"
            onClick={replaceAll}
            title="Replace All (Ctrl+Alt+Enter)"
          >
            Replace All
          </button>
        </div>
      )}

      {/* Toggle Replace Button */}
      <button
        className="find-replace-toggle-btn"
        onClick={() => setShowReplace(!showReplace)}
        title={showReplace ? 'Hide Replace' : 'Show Replace'}
      >
        {showReplace ? '▼ Replace' : '▶ Replace'}
      </button>
    </div>
  );
};

export default FindReplace;
