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
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const decorationsRef = useRef<string[]>([]);
  const allMatchesRef = useRef<any[]>([]);

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

  const getMatches = () => {
    if (!editorRef.current || !searchText) return [];
    const model = editorRef.current.getModel();
    if (!model) return [];
    try {
      return model.findMatches(
        searchText,
        false,
        regex,          // isRegex
        caseSensitive,  // matchCase
        wholeWord ? ' `~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?' : null,
        true
      );
    } catch (e) {
      return [];
    }
  };

  const applyDecorations = (matches: any[], activeIdx: number) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const newDecorations = matches.map((match: any, i: number) => ({
      range: match.range,
      options: {
        className: i === activeIdx ? 'find-current-match-highlight' : 'find-match-highlight',
        inlineClassName: i === activeIdx ? 'find-current-match-highlight' : 'find-match-highlight',
        stickiness: 1,
      }
    }));
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  };

  const handleSearch = (activeIdx = 0) => {
    if (!editorRef.current || !searchText) {
      if (editorRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
      setMatchCount(0);
      setCurrentMatchIndex(-1);
      allMatchesRef.current = [];
      return;
    }
    const matches = getMatches();
    allMatchesRef.current = matches;
    setMatchCount(matches.length);
    const idx = matches.length > 0 ? Math.min(activeIdx, matches.length - 1) : -1;
    setCurrentMatchIndex(idx);
    applyDecorations(matches, idx);
    if (matches.length > 0 && idx >= 0) {
      editorRef.current.setSelection(matches[idx].range);
      editorRef.current.revealRangeInCenter(matches[idx].range);
    }
  };

  useEffect(() => {
    handleSearch(0);
  }, [searchText, caseSensitive, wholeWord, regex]);

  const findNext = () => {
    if (!editorRef.current || !searchText) return;
    const matches = allMatchesRef.current;
    if (matches.length === 0) return;
    const next = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(next);
    applyDecorations(matches, next);
    editorRef.current.setSelection(matches[next].range);
    editorRef.current.revealRangeInCenter(matches[next].range);
  };

  const findPrevious = () => {
    if (!editorRef.current || !searchText) return;
    const matches = allMatchesRef.current;
    if (matches.length === 0) return;
    const prev = ((currentMatchIndex - 1) + matches.length) % matches.length;
    setCurrentMatchIndex(prev);
    applyDecorations(matches, prev);
    editorRef.current.setSelection(matches[prev].range);
    editorRef.current.revealRangeInCenter(matches[prev].range);
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
          {searchText
            ? (matchCount > 0
              ? `${currentMatchIndex + 1} / ${matchCount}`
              : 'No results')
            : ''}
        </span>
        {/* Prev / Next arrows */}
        <div className="find-nav-arrows">
          <button
            className="find-nav-btn"
            onClick={findPrevious}
            disabled={matchCount === 0}
            title="Previous Match (Shift+Enter)"
          >&#8593;</button>
          <button
            className="find-nav-btn"
            onClick={findNext}
            disabled={matchCount === 0}
            title="Next Match (Enter)"
          >&#8595;</button>
        </div>
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
            placeholder="Replace with..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
          />
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
