import React, { useState, useEffect, useMemo } from 'react';
import { useEditorStore } from '../../editor/stores/editorStore';

interface FixStep {
    line: number;
    error: string;
    fix: string;
    explanation: string;
    originalCode: string;
    analogy: string;
}

const VirtualDebuggerTab: React.FC = () => {
    const staticProblems = useEditorStore(state => state.staticProblems);
    const activeTabId = useEditorStore(state => state.activeTabId);
    const tabs = useEditorStore(state => state.tabs);

    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [fixSteps, setFixSteps] = useState<FixStep[]>([]);

    // Group only 'error' type problems by file
    const filesWithErrors = useMemo(() => {
        const groups: Record<string, any[]> = {};
        staticProblems.filter(p => p.type === 'error').forEach(p => {
            if (!groups[p.source]) groups[p.source] = [];
            groups[p.source].push(p);
        });
        return Object.keys(groups).map(fileName => ({
            fileName,
            problems: groups[fileName]
        }));
    }, [staticProblems]);

    const activeTab = tabs.find(t => t.id === activeTabId);

    // Force strict sync with active tab
    useEffect(() => {
        if (activeTab) {
            setSelectedFile(activeTab.fileName);
        } else if (filesWithErrors.length > 0 && !selectedFile) {
            setSelectedFile(filesWithErrors[0].fileName);
        }
    }, [activeTabId, activeTab?.fileName, filesWithErrors]);

    const currentFileData = activeTab; // Use activeTab directly for content consistency
    const currentFileErrors = useMemo(() => {
        const fileData = filesWithErrors.find(f => f.fileName === selectedFile);
        return fileData ? fileData.problems : [];
    }, [selectedFile, filesWithErrors]);

    // Generate fix visualizations
    useEffect(() => {
        if (currentFileErrors.length > 0) {
            const groupedErrors: Record<number, any[]> = {};
            currentFileErrors.forEach(err => {
                if (!groupedErrors[err.line]) groupedErrors[err.line] = [];
                groupedErrors[err.line].push(err);
            });

            const steps = Object.keys(groupedErrors).map(lineNumStr => {
                const lineNum = parseInt(lineNumStr);
                const errorsOnLine = groupedErrors[lineNum];
                const primaryError = errorsOnLine[0];

                const entireFileContent = currentFileData?.content || '';
                const lines = entireFileContent.split('\n');
                const rawLineContent = lines[lineNum - 1] || '';
                const lineContent = rawLineContent.trim() || '// empty line';

                const fix = generateFixCode(primaryError.message, rawLineContent.trim());

                return {
                    line: lineNum,
                    error: errorsOnLine.map(e => e.message).join(' • '),
                    originalCode: lineContent,
                    fix: fix,
                    explanation: generateStudentExplanation(primaryError.message, fix),
                    analogy: generateAnalogy(primaryError.message, fix)
                };
            }).sort((a, b) => a.line - b.line);

            setFixSteps(steps);
        } else {
            setFixSteps([]);
        }
    }, [currentFileErrors.length, selectedFile, currentFileData]);

    const generateFixCode = (msg: string, code: string) => {
        const m = msg.toLowerCase();
        const trimCode = code.trim();
        const isSingleWord = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimCode);

        // 🟢 1. EXTRACT TYPO SUGGESTIONS: "Did you mean 'hyena'?"
        const suggestMatch = msg.match(/did you mean ['"]([^'"]+)['"]/i);
        if (suggestMatch && suggestMatch[1]) {
            const suggestion = suggestMatch[1];
            // If the code is just the variable (e.g., "hyen"), replace with suggested variable ("hyena")
            if (isSingleWord) return suggestion;

            // Extract the wrong name from the error message to perform a targeted replacement
            const wrongNameMatch = msg.match(/name ['"]([^'"]+)['"]/i);
            if (wrongNameMatch && wrongNameMatch[1]) {
                const wrongName = wrongNameMatch[1];
                return trimCode.replace(new RegExp(`\\b${wrongName}\\b`, 'g'), suggestion);
            }

            // Fallback: If it's a simple typo in a single word line
            return suggestion;
        }

        // 🟢 2. REFERENCE / UNDEFINED ERRORS
        if (m.includes('undefined') || m.includes('not found') || m.includes('is not defined') || m.includes('referenceerror')) {
            if (isSingleWord) return `const ${trimCode} = "";`;
            // If it's something like "hyena = 5" and hyena is undefined
            if (trimCode.includes('=') || trimCode.includes('(')) {
                const varName = trimCode.split(/[\s=({]/)[0].trim() || 'myVar';
                return `const ${varName} = 0;`;
            }
            return `const ${trimCode.split(' ')[0]} = "";`;
        }

        // 🟢 3. BRACKET / SCOPE ERRORS (Improved)
        if (m.includes('bracket') || m.includes('closing') || m.includes('unexpected end') || m.includes('curly') || m.includes('unexpected token')) {
            // Case: missing opening ( but has closing )
            if (trimCode.includes(')') && !trimCode.includes('(')) {
                return trimCode.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/, '$1()');
            }
            // Case: missing closing ) but has opening (
            if (trimCode.includes('(') && !trimCode.includes(')')) {
                return `${trimCode})`;
            }
            // Case: missing closing } but has opening {
            if (trimCode.includes('{') && !trimCode.includes('}')) {
                return `${trimCode}\n}`;
            }
            // Case: generic unexpected closing )
            if (trimCode.endsWith(');') && !trimCode.includes('(')) {
                return trimCode.replace(');', '();');
            }
        }

        // 🟢 4. SEMICOLON / TERMINATOR ERRORS
        if (m.includes('semicolon') || m.includes('expected semicolon') || m.includes('terminate')) {
            if (trimCode.endsWith(';')) return trimCode;
            return `${trimCode};`;
        }

        // 🟢 5. CONSTANT / ASSIGNMENT ERRORS
        if ((m.includes('const') || m.includes('read-only')) && (m.includes('assign') || m.includes('update'))) {
            return trimCode.replace('const', 'let');
        }

        // 🟢 6. TYPE ERRORS
        if (m.includes('is not a function')) {
            const funcName = trimCode.split('(')[0].trim();
            return `const ${funcName} = () => {};\n${trimCode}`;
        }

        // 🟢 7. LOGIC FALLBACK (Context-Aware)
        // If it's a single word and no typo was found by compiler, suggest declaring it as a variable
        if (isSingleWord) {
            return `const ${trimCode} = "";`;
        }

        // If no high-confidence fix is found, return the original code to avoid 'random' incorrect guesses
        return trimCode;
    };

    const generateStudentExplanation = (msg: string, fix: string) => {
        const m = msg.toLowerCase();
        if (msg.toLowerCase().includes('did you mean')) {
            const suggestion = msg.match(/did you mean ['"]([^'"]+)['"]/i)?.[1];
            return `You made a small typo! You likely meant to use '${suggestion}' here.`;
        }

        // Specific for missing opening bracket
        if (m.includes('unexpected token )') || (m.includes('unexpected token') && !msg.includes('(') && msg.includes(')'))) {
            return "You tried to close a group that was never started. Every ending needs a beginning!";
        }

        if (m.includes('undefined') || m.includes('not defined')) return "This word is unknown to the computer. We need to introduce it first.";
        if (m.includes('bracket') || m.includes('closing')) return "A section was opened but never closed. Every start needs a finish!";
        if (m.includes('semicolon')) return "Missing an ending mark. Like a period at the end of a sentence.";
        if (m.includes('const')) return "You tried to change a 'Constant' (permanent) variable. Using 'let' allows changes.";
        if (m.includes('is not a function')) return "You're trying to use this like a command (function), but it hasn't been set up as one.";
        return "The grammar of this line is slightly off, making it hard for the computer to follow.";
    };

    const generateAnalogy = (msg: string, fix: string) => {
        const m = msg.toLowerCase();
        if (msg.toLowerCase().includes('did you mean')) return "Like writing 'recpe' in a book when you meant 'recipe'.";

        // Missing opening bracket analogy
        if (m.includes('unexpected token )') || (m.includes('unexpected token') && !msg.includes('(') && msg.includes(')'))) {
            return "Like trying to close an umbrella that was never opened.";
        }

        if (m.includes('undefined')) return "Like trying to call a friend without having their phone number in your contacts.";
        if (m.includes('bracket')) return "Like putting on a shirt but forgetting to button it up.";
        if (m.includes('semicolon')) return "Like finishing a sentence but forgetting the period at the end.";
        if (m.includes('const')) return "Like trying to rewrite a document that was already printed and laminated.";
        if (m.includes('is not a function')) return "Like trying to use a toaster to make a phone call.";
        return "Like a piece of furniture with a missing screw.";
    };

    const [currentStepIdx, setCurrentStepIdx] = useState(0);

    // Reset index when steps change
    useEffect(() => {
        setCurrentStepIdx(0);
    }, [fixSteps.length, selectedFile]);

    const activeStep = fixSteps[currentStepIdx];
    const hasNext = currentStepIdx < fixSteps.length - 1;
    const hasPrev = currentStepIdx > 0;

    if (filesWithErrors.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: '40px', color: '#4caf50', marginBottom: '16px', opacity: 0.5 }}></i>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ccc' }}>Workspace Clean</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>No critical errors detected.</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#ccc', fontFamily: 'Inter, system-ui' }}>
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Focused Repair: {selectedFile}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#f14c4c', fontWeight: 'bold' }}>
                        ISSUE {currentStepIdx + 1} OF {fixSteps.length}
                    </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                    {activeStep ? (
                        <div style={{
                            background: '#252526',
                            borderRadius: '16px',
                            border: '1px solid #333',
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            animation: 'slideIn 0.3s ease-out',
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '100%'
                        }}>
                            {/* Card Header */}
                            <div style={{ padding: '14px 20px', background: '#1a1a1a', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ background: '#f14c4c', color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>LINE {activeStep.line}</span>
                                    <span style={{ fontSize: '11px', color: '#aaa', fontWeight: '600' }}>FIX VISUALIZATION</span>
                                </div>
                                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#00f2ff', fontSize: '14px' }}></i>
                            </div>

                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                                {/* 1. The Broken Line */}
                                <div>
                                    <div style={{ fontSize: '10px', color: '#f14c4c', marginBottom: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Before (Broken)</div>
                                    <div style={{ background: '#000', padding: '14px', borderRadius: '8px', border: '1px solid rgba(241, 76, 76, 0.2)' }}>
                                        <code style={{ fontSize: '13px', color: '#ff6b6b', textDecoration: 'line-through', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontFamily: 'monospace' }}>{activeStep.originalCode || "// No code on this line"}</code>
                                    </div>
                                </div>

                                {/* 2. Simple Student Analogy */}
                                <div style={{ background: 'rgba(255, 215, 0, 0.04)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.1)', textAlign: 'center' }}>
                                    <i className="fa-solid fa-lightbulb" style={{ color: '#ffd700', fontSize: '18px', marginBottom: '8px' }}></i>
                                    <div style={{ fontSize: '13px', color: '#eee', fontWeight: '500', marginBottom: '4px', lineHeight: '1.4' }}>{activeStep.explanation}</div>
                                    <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>"{activeStep.analogy}"</div>
                                </div>

                                {/* 3. The Corrected Line */}
                                <div>
                                    <div style={{ fontSize: '10px', color: '#4caf50', marginBottom: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>After (Fixed)</div>
                                    <div style={{
                                        background: '#0a0a0a',
                                        padding: '14px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(76, 175, 80, 0.4)',
                                        boxShadow: 'inset 0 0 15px rgba(76, 175, 80, 0.05), 0 0 10px rgba(76, 175, 80, 0.1)'
                                    }}>
                                        <code style={{ fontSize: '13px', color: '#4caf50', fontWeight: '700', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontFamily: 'monospace' }}>{activeStep.fix || activeStep.originalCode}</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#444' }}>Ready for Repair Visualization...</div>
                    )}
                </div>

                {/* Navigation Controls - Only show if there's more than one issue */}
                {fixSteps.length > 1 && (
                    <div style={{ padding: '20px 0', borderTop: '1px solid #333', marginTop: '20px', display: 'flex', gap: '15px' }}>
                        <button
                            onClick={() => setCurrentStepIdx(prev => Math.max(0, prev - 1))}
                            disabled={!hasPrev}
                            style={{
                                flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #333',
                                background: hasPrev ? '#2d2d2d' : '#1e1e1e', color: hasPrev ? '#fff' : '#444',
                                cursor: hasPrev ? 'pointer' : 'not-allowed', fontWeight: '600', transition: 'all 0.2s'
                            }}
                        >
                            <i className="fa-solid fa-chevron-left" style={{ marginRight: '8px' }}></i> Previous Issue
                        </button>
                        <button
                            onClick={() => setCurrentStepIdx(prev => Math.min(fixSteps.length - 1, prev + 1))}
                            disabled={!hasNext}
                            style={{
                                flex: 1, padding: '14px', borderRadius: '8px', border: 'none',
                                background: hasNext ? '#f14c4c' : '#333', color: '#fff',
                                cursor: hasNext ? 'pointer' : 'not-allowed', fontWeight: '600', transition: 'all 0.2s'
                            }}
                        >
                            Next Issue <i className="fa-solid fa-chevron-right" style={{ marginLeft: '8px' }}></i>
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default VirtualDebuggerTab;
