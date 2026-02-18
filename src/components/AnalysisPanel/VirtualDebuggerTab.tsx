import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../../editor/stores/editorStore';
import { copilotService } from '../../services/CopilotService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AICard {
    line: number;
    severity: 'error' | 'warning' | 'tip';
    errorMsg: string;
    originalCode: string;
    fixedCode: string;
    explanation: string;
    analogy: string;
    emoji: string;
}

// ─── Neon-red palette ─────────────────────────────────────────────────────────
const P = {
    bg: '#0a0a0a',
    card: '#0f0a0a',
    cardBorder: 'rgba(255,23,68,0.12)',
    strip: '#ff1744',
    badge: 'rgba(255,23,68,0.12)',
    badgeBorder: 'rgba(255,23,68,0.25)',
    textBright: '#ffe0e4',
    textMid: '#c86070',
    textDim: '#5a2030',
    divider: 'rgba(255,23,68,0.08)',
    headerBg: 'rgba(0,0,0,0.4)',
    scrollThumb: '#2e0a10',
};

// ─── Parse AI JSON response — multiple fallback strategies ────────────────────
function parseAIResponse(raw: string): { cards: AICard[]; correctedCode: string } | null {
    const makeCard = (item: any): AICard => ({
        line: Math.max(1, Number(item.line) || 1),
        severity: (['error', 'warning', 'tip'].includes(item.severity) ? item.severity : 'error') as AICard['severity'],
        errorMsg: String(item.error || item.message || item.issue || 'Unknown issue'),
        originalCode: String(item.original || item.originalCode || ''),
        fixedCode: String(item.fixed || item.fixedCode || ''),
        explanation: String(item.explanation || item.hint || ''),
        analogy: String(item.analogy || ''),
        emoji: String(item.emoji || '🔧'),
    });

    // Strategy 1: strip ALL markdown fences then try full parse
    const stripped = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    try {
        const json = JSON.parse(stripped);
        if (json && Array.isArray(json.issues)) {
            return { cards: json.issues.map(makeCard), correctedCode: String(json.correctedCode || '') };
        }
        if (Array.isArray(json)) return { cards: json.map(makeCard), correctedCode: '' };
    } catch { /* fall through */ }

    // Strategy 2: extract outermost { ... } block
    const objMatch = stripped.match(/\{[\s\S]*\}/);
    if (objMatch) {
        try {
            const json = JSON.parse(objMatch[0]);
            if (json && Array.isArray(json.issues)) {
                return { cards: json.issues.map(makeCard), correctedCode: String(json.correctedCode || '') };
            }
        } catch { /* fall through */ }
    }

    // Strategy 3: extract JSON array directly
    const arrMatch = stripped.match(/\[[\s\S]*\]/);
    if (arrMatch) {
        try {
            const arr = JSON.parse(arrMatch[0]);
            if (Array.isArray(arr) && arr.length > 0 && arr[0].line) {
                return { cards: arr.map(makeCard), correctedCode: '' };
            }
        } catch { /* fall through */ }
    }

    // Strategy 4: plain-text "no issues" detection
    const lower = raw.toLowerCase();
    if (
        lower.includes('no issue') || lower.includes('no error') ||
        lower.includes('looks good') || lower.includes('no problem') ||
        lower.includes('no bugs') || lower.includes('all clear') ||
        lower.includes('"issues": []') || lower.includes('"issues":[]')
    ) {
        return { cards: [], correctedCode: '' };
    }

    // Could not parse — caller will show error state
    return null;
}

// ─── Build the AI prompt ──────────────────────────────────────────────────────
function buildPrompt(code: string, fileName: string): string {
    return `IMPORTANT: Respond with ONLY valid JSON. No markdown. No explanation outside JSON.

You are a code analysis tool reviewing: "${fileName}"

Find ALL issues: syntax errors, missing semicolons, typos, wrong variable names, unused variables, logic bugs, bad indentation, missing imports, etc.

Return this exact JSON structure:
{"issues":[{"line":<number>,"severity":"error","error":"<title>","original":"<broken line>","fixed":"<corrected line>","explanation":"<student-friendly 1-2 sentences>","analogy":"<fun analogy>","emoji":"<emoji>"}],"correctedCode":"<full corrected file>"}

If no issues: {"issues":[],"correctedCode":""}

CODE:
${code}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
const VirtualDebuggerTab: React.FC = () => {
    const activeTabId = useEditorStore(s => s.activeTabId);
    const tabs = useEditorStore(s => s.tabs);
    const activeTab = tabs.find(t => t.id === activeTabId);
    const fileName = activeTab?.fileName ?? null;
    const fileContent = activeTab?.content ?? '';

    const [cards, setCards] = useState<AICard[]>([]);
    const [correctedCode, setCorrectedCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'analysing' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [showCorrected, setShowCorrected] = useState(false);

    // Track which file+content we last analysed to avoid re-running on same code
    const lastAnalysedRef = useRef<string>('');
    const rawBufferRef = useRef<string>('');

    const runAnalysis = useCallback(async (code: string, name: string) => {
        const key = `${name}::${code}`;
        if (lastAnalysedRef.current === key) return;
        lastAnalysedRef.current = key;

        setStatus('analysing');
        setCards([]);
        setCorrectedCode('');
        setExpandedIdx(null);
        setShowCorrected(false);
        setErrorMsg('');
        rawBufferRef.current = '';

        copilotService.setContext({
            currentCode: code,
            currentFile: name,
            language: name.split('.').pop() || 'text',
        });

        await copilotService.streamChat(
            buildPrompt(code, name),
            (chunk: string) => {
                rawBufferRef.current += chunk;
            },
            () => {
                // Stream complete — parse the accumulated JSON
                const result = parseAIResponse(rawBufferRef.current);
                if (result) {
                    setCards(result.cards);
                    setCorrectedCode(result.correctedCode);
                    setStatus('done');
                } else {
                    // AI returned non-JSON (maybe quota error or plain text)
                    setErrorMsg('AI returned an unexpected response. Try again.');
                    setStatus('error');
                }
            },
            (err: string) => {
                setErrorMsg(err.includes('quota') || err.includes('402')
                    ? 'AI quota reached. Try again later.'
                    : `AI error: ${err}`);
                setStatus('error');
            }
        );
    }, []);

    // Auto-run when file changes (or content changes significantly)
    useEffect(() => {
        if (!fileName || !fileContent.trim()) {
            setStatus('idle');
            setCards([]);
            return;
        }
        // Debounce: wait 800ms after last change before calling AI
        const timer = setTimeout(() => {
            runAnalysis(fileContent, fileName);
        }, 800);
        return () => clearTimeout(timer);
    }, [fileName, fileContent, runAnalysis]);

    // ── IDLE / no file ──
    if (!fileName || !fileContent.trim()) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: P.bg, gap: 14 }}>
                <i className="fa-solid fa-bug" style={{ fontSize: 32, color: P.textDim }} />
                <div style={{ fontSize: 12, color: P.textDim }}>Open a file to start debugging</div>
            </div>
        );
    }

    // ── ANALYSING ──
    if (status === 'analysing') {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: P.bg, gap: 18 }}>
                <style>{`
                    @keyframes dbgSpin { to { transform: rotate(360deg); } }
                    @keyframes dbgPulse { 0%,100%{opacity:.4} 50%{opacity:1} }
                    @keyframes dbgDot { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
                `}</style>
                {/* Spinner ring */}
                <div style={{ position: 'relative', width: 64, height: 64 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,23,68,0.1)' }} />
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: P.strip, animation: 'dbgSpin 1s linear infinite' }} />
                    <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'rgba(255,23,68,0.4)', animation: 'dbgSpin 1.5s linear infinite reverse' }} />
                    <i className="fa-solid fa-bug" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: P.strip, animation: 'dbgPulse 2s ease infinite' } as any} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: P.textBright, marginBottom: 6 }}>AI Analysing…</div>
                    <div style={{ fontSize: 11, color: P.textMid }}>{fileName}</div>
                </div>
                {/* Animated dots */}
                <div style={{ display: 'flex', gap: 5 }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: P.strip, animation: `dbgDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                </div>
            </div>
        );
    }

    // ── ERROR STATE ──
    if (status === 'error') {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: P.bg, gap: 14, padding: '0 24px' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 28, color: P.strip }} />
                <div style={{ fontSize: 12, color: P.textMid, textAlign: 'center' }}>{errorMsg}</div>
                <button
                    onClick={() => { lastAnalysedRef.current = ''; runAnalysis(fileContent, fileName!); }}
                    style={{ background: P.badge, border: `1px solid ${P.badgeBorder}`, color: P.strip, padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // ── ALL CLEAR ──
    if (status === 'done' && cards.length === 0) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: P.bg, gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: P.badge, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${P.badgeBorder}`, boxShadow: `0 0 24px rgba(255,23,68,0.15)` }}>
                    <i className="fa-solid fa-shield-check" style={{ fontSize: 26, color: P.strip }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: P.textBright }}>All Clear!</div>
                <div style={{ fontSize: 11, color: P.textDim, textAlign: 'center', maxWidth: 200 }}>
                    No issues found in {fileName} ✨
                </div>
                <button
                    onClick={() => { lastAnalysedRef.current = ''; runAnalysis(fileContent, fileName!); }}
                    style={{ background: 'none', border: `1px solid ${P.textDim}`, color: P.textDim, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 10, marginTop: 4 }}
                >
                    Re-analyse
                </button>
            </div>
        );
    }

    // ── MAIN UI ──
    const errorCount = cards.filter(c => c.severity === 'error').length;
    const warningCount = cards.filter(c => c.severity === 'warning').length;
    const tipCount = cards.filter(c => c.severity === 'tip').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: P.bg, fontFamily: 'Inter, system-ui, sans-serif', color: P.textBright, overflow: 'hidden' }}>
            <style>{`
                @keyframes dbgSlide { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
                @keyframes dbgPop   { 0%{transform:scale(.97)} 60%{transform:scale(1.01)} 100%{transform:scale(1)} }
                .dbg-card { animation: dbgSlide .28s ease both; cursor:pointer; }
                .dbg-card:hover { box-shadow: 0 0 0 1px rgba(255,23,68,0.3), 0 4px 20px rgba(255,23,68,0.1) !important; }
                .dbg-scroll::-webkit-scrollbar { width:4px; }
                .dbg-scroll::-webkit-scrollbar-track { background: transparent; }
                .dbg-scroll::-webkit-scrollbar-thumb { background:${P.scrollThumb}; border-radius:4px; }
                .dbg-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,23,68,0.3); }
                .dbg-rerun:hover { background: rgba(255,23,68,0.15) !important; }
            `}</style>

            {/* ── Header ── */}
            <div style={{ padding: '11px 14px', background: P.headerBg, borderBottom: `1px solid ${P.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: P.badge, border: `1px solid ${P.badgeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 10px rgba(255,23,68,0.2)` }}>
                        <i className="fa-solid fa-bug" style={{ fontSize: 12, color: P.strip }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: P.textBright }}>Virtual Debugger</div>
                        <div style={{ fontSize: 10, color: P.textDim }}>{fileName}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Summary pills */}
                    {errorCount > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#ff4466', background: 'rgba(255,68,102,0.12)', padding: '2px 7px', borderRadius: 4, border: '1px solid rgba(255,68,102,0.2)' }}>{errorCount} err</span>}
                    {warningCount > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#ffaa44', background: 'rgba(255,170,68,0.12)', padding: '2px 7px', borderRadius: 4, border: '1px solid rgba(255,170,68,0.2)' }}>{warningCount} warn</span>}
                    {tipCount > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#aa88ff', background: 'rgba(170,136,255,0.12)', padding: '2px 7px', borderRadius: 4, border: '1px solid rgba(170,136,255,0.2)' }}>{tipCount} tip</span>}
                    {/* Re-run button */}
                    <button
                        className="dbg-rerun"
                        onClick={() => { lastAnalysedRef.current = ''; runAnalysis(fileContent, fileName!); }}
                        title="Re-analyse with AI"
                        style={{ background: P.badge, border: `1px solid ${P.badgeBorder}`, color: P.strip, width: 24, height: 24, borderRadius: 6, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}
                    >
                        <i className="fa-solid fa-rotate-right" />
                    </button>
                </div>
            </div>

            {/* ── Cards ── */}
            <div className="dbg-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cards.map((card, idx) => {
                    const isOpen = expandedIdx === idx;
                    const sevColor = card.severity === 'error' ? '#ff4466'
                        : card.severity === 'warning' ? '#ffaa44'
                            : '#aa88ff';
                    const sevBg = card.severity === 'error' ? 'rgba(255,68,102,0.1)'
                        : card.severity === 'warning' ? 'rgba(255,170,68,0.1)'
                            : 'rgba(170,136,255,0.1)';

                    return (
                        <div
                            key={idx}
                            className="dbg-card"
                            onClick={() => setExpandedIdx(isOpen ? null : idx)}
                            style={{ borderRadius: 12, background: P.card, border: `1px solid ${P.cardBorder}`, overflow: 'hidden', animationDelay: `${idx * 0.035}s`, transition: 'box-shadow .2s' }}
                        >
                            {/* top colour strip */}
                            <div style={{ height: 2, background: `linear-gradient(90deg, ${sevColor}, transparent)` }} />

                            <div style={{ padding: '10px 13px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                {/* emoji */}
                                <div style={{ width: 32, height: 32, borderRadius: 9, background: sevBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${sevColor}28`, fontSize: 15 }}>
                                    {card.emoji}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* line + severity */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: sevColor, letterSpacing: '.3px', textShadow: `0 0 8px ${sevColor}66` }}>
                                            LINE {card.line}
                                        </span>
                                        <span style={{ fontSize: 9, fontWeight: 700, color: sevColor, background: sevBg, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.3px' }}>
                                            {card.severity}
                                        </span>
                                    </div>

                                    {/* error title */}
                                    <div style={{ fontSize: 10, color: P.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>
                                        {card.errorMsg}
                                    </div>

                                    {/* explanation — always visible */}
                                    <div style={{ fontSize: 12, color: P.textBright, lineHeight: 1.55 }}>
                                        {card.explanation}
                                    </div>

                                    {/* analogy */}
                                    <div style={{ fontSize: 10, color: P.textDim, fontStyle: 'italic', marginTop: 3 }}>
                                        "{card.analogy}"
                                    </div>
                                </div>

                                <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 9, color: P.textDim, flexShrink: 0, marginTop: 7 }} />
                            </div>

                            {/* expanded: before / after */}
                            {isOpen && (
                                <div style={{ padding: '0 12px 13px', display: 'flex', gap: 8, animation: 'dbgPop .22s ease' }}>
                                    {/* Broken */}
                                    <div style={{ flex: 1, borderRadius: 9, overflow: 'hidden', border: `1px solid rgba(255,68,102,0.2)` }}>
                                        <div style={{ padding: '5px 10px', background: 'rgba(255,68,102,0.08)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <i className="fa-solid fa-xmark" style={{ fontSize: 8, color: '#ff4466' }} />
                                            <span style={{ fontSize: 9, fontWeight: 700, color: '#ff4466', textTransform: 'uppercase', letterSpacing: '.4px' }}>Broken</span>
                                        </div>
                                        <div style={{ padding: '9px 11px', background: 'rgba(0,0,0,0.3)' }}>
                                            <code style={{ fontSize: 11, color: '#ff8899', textDecoration: 'line-through wavy', textDecorationColor: 'rgba(255,68,102,0.5)', whiteSpace: 'pre-wrap', fontFamily: '"Fira Code","Cascadia Code",monospace', wordBreak: 'break-all', lineHeight: 1.65 }}>
                                                {card.originalCode || '(see error above)'}
                                            </code>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                        <i className="fa-solid fa-arrow-right" style={{ fontSize: 10, color: P.textDim }} />
                                    </div>

                                    {/* Fixed */}
                                    <div style={{ flex: 1, borderRadius: 9, overflow: 'hidden', border: `1px solid rgba(255,23,68,0.18)` }}>
                                        <div style={{ padding: '5px 10px', background: 'rgba(255,23,68,0.06)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 8, color: P.strip }} />
                                            <span style={{ fontSize: 9, fontWeight: 700, color: P.strip, textTransform: 'uppercase', letterSpacing: '.4px' }}>Fixed</span>
                                        </div>
                                        <div style={{ padding: '9px 11px', background: 'rgba(0,0,0,0.3)' }}>
                                            <code style={{ fontSize: 11, color: '#ffb0bc', fontWeight: 600, whiteSpace: 'pre-wrap', fontFamily: '"Fira Code","Cascadia Code",monospace', wordBreak: 'break-all', lineHeight: 1.65 }}>
                                                {card.fixedCode || '(no change needed)'}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Bottom bar ── */}
            {correctedCode && (
                <div style={{ flexShrink: 0, borderTop: `1px solid ${P.divider}`, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', background: P.headerBg }}>
                    <button
                        onClick={e => { e.stopPropagation(); setShowCorrected(p => !p); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: P.textDim, display: 'flex', alignItems: 'center', gap: 5, padding: 0, transition: 'color .2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = P.strip)}
                        onMouseLeave={e => (e.currentTarget.style.color = P.textDim)}
                    >
                        <i className="fa-solid fa-file-code" style={{ fontSize: 10 }} />
                        corrected code
                        <i className={`fa-solid fa-chevron-${showCorrected ? 'down' : 'up'}`} style={{ fontSize: 8 }} />
                    </button>
                </div>
            )}

            {/* ── Corrected Code Panel ── */}
            {showCorrected && correctedCode && (
                <div className="dbg-scroll" style={{ flexShrink: 0, maxHeight: 240, overflowY: 'auto', background: '#050508', borderTop: `1px solid ${P.divider}`, padding: '12px 14px' }}>
                    <div style={{ fontSize: 9, color: P.textMid, fontWeight: 700, letterSpacing: '.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 9, color: P.strip }} />
                        AI CORRECTED FILE
                    </div>
                    <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.7, color: P.textBright, fontFamily: '"Fira Code","Cascadia Code",monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {correctedCode}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default VirtualDebuggerTab;
