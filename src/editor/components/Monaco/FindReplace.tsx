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
  const decorationsRef = useRef<string[]>([]);

  // Clear decorations on unmount or close
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible && editorRef.current) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus();
      handleSearch(); // Refresh on show
    }
  }, [isVisible]);

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

  const handleSearch = () => {
    if (!editorRef.current || !searchText) {
      if (editorRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
      setMatchCount(0);
      return;
    }

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    try {
      const matches = model.findMatches(
        searchText,
        false, // searchOnlyEditableRange
        regex,
        caseSensitive,
        wholeWord ? " `~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?" : null,
        true // captureMatches
      );

      setMatchCount(matches.length);

      // Apply highlighting
      const newDecorations = matches.map((match: any) => ({
        range: match.range,
        options: {
          className: 'find-match-highlight',
          inlineClassName: 'find-match-highlight',
          stickiness: 1 // NeverGrowsWhenTypingAtEdges
        }
      }));

      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    } catch (e) {
      console.error('Find error:', e);
      setMatchCount(0);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchText, caseSensitive, wholeWord, regex]);

  const findNext = () => {
    if (!editorRef.current || !searchText) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const matches = model.findMatches(
      searchText,
      false,
      regex,
      caseSensitive,
      wholeWord ? " `~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?" : null,
      true
    );

    if (matches.length === 0) return;

    const currentPos = editor.getPosition();
    let nextMatch = matches.find((m: any) =>
      m.range.startLineNumber > currentPos.lineNumber ||
      (m.range.startLineNumber === currentPos.lineNumber && m.range.startColumn > currentPos.column)
    );

    if (!nextMatch) nextMatch = matches[0]; // Wrap around

    if (nextMatch) {
      editor.setSelection(nextMatch.range);
      editor.revealRangeInCenter(nextMatch.range);

      // Update decorations to highlight current match specifically
      const newDecorations = matches.map((match: any) => ({
        range: match.range,
        options: {
          className: match === nextMatch ? 'find-current-match-highlight' : 'find-match-highlight',
          inlineClassName: match === nextMatch ? 'find-current-match-highlight' : 'find-match-highlight',
          stickiness: 1
        }
      }));
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    }
  };

  const findPrevious = () => {
    if (!editorRef.current || !searchText) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const matches = model.findMatches(
      searchText,
      false,
      regex,
      caseSensitive,
      wholeWord ? " `~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?" : null,
      true
    );

    if (matches.length === 0) return;

    const currentPos = editor.getPosition();
    let prevMatch = [...matches].reverse().find((m: any) =>
      m.range.startLineNumber < currentPos.lineNumber ||
      (m.range.startLineNumber === currentPos.lineNumber && m.range.startColumn < currentPos.column)
    );

    if (!prevMatch) prevMatch = matches[matches.length - 1]; // Wrap around

    if (prevMatch) {
      editor.setSelection(prevMatch.range);
      editor.revealRangeInCenter(prevMatch.range);

      // Update decorations
      const newDecorations = matches.map((match: any) => ({
        range: match.range,
        options: {
          className: match === prevMatch ? 'find-current-match-highlight' : 'find-match-highlight',
          inlineClassName: match === prevMatch ? 'find-current-match-highlight' : 'find-match-highlight',
          stickiness: 1
        }
      }));
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
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
      handleSearch();
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
