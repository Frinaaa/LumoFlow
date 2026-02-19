import React from 'react';
import { TraceFrame } from '../../editor/stores/visualStore';

interface LogicStructureProps {
    frame: TraceFrame;
}

// ─── Shared CSS injected once into <head> ─────────────────────────────────────
const LOGIC_STYLES = `
  .logic-structure { width: 100%; max-width: 100%; padding: 20px; box-sizing: border-box; }
  .struct-label { font-family: 'Orbitron', sans-serif; font-size: 12px; color: #bc13fe; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
  .type-badge { font-size: 8px; padding: 2px 6px; background: rgba(188,19,254,0.1); border: 1px solid #bc13fe; border-radius: 10px; opacity: 0.7; }

  .action-banner { display: flex; align-items: center; gap: 12px; padding: 6px 12px; margin-bottom: 15px; border-left: 3px solid #888; background: rgba(255,255,255,0.02); border-radius: 0 6px 6px 0; }
  .action-label { font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: bold; letter-spacing: 2px; }
  .step-counter { font-size: 9px; color: #555; margin-left: auto; font-family: 'JetBrains Mono', monospace; }

  .array-cells { 
    display: flex; gap: 20px; flex-wrap: wrap; 
    justify-content: center; align-items: flex-start; padding: 20px 10px; 
  }
  
  .array-cell {
    min-width: 60px; height: 60px; padding: 10px;
    border-radius: 12px; /* Changed from 50% to Rounded Square for objects */
    background: rgba(255,255,255,0.03);
    border: 2px solid hsla(var(--hue, 270), 70%, 50%, 0.3);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    position: relative; transition: all 0.4s ease;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
  .array-cell.comparing {
    border-color: #ffaa00;
    background: radial-gradient(circle at 35% 35%, rgba(255,170,0,0.25) 0%, rgba(0,0,0,0.5) 100%);
    transform: scale(1.15);
    box-shadow: 0 0 25px rgba(255,170,0,0.4), inset 0 0 15px rgba(255,170,0,0.1);
  }
  .array-cell.swapping {
    border-color: #ff0055;
    background: radial-gradient(circle at 35% 35%, rgba(255,0,85,0.25) 0%, rgba(0,0,0,0.5) 100%);
    animation: ls-swap-shake 0.3s infinite alternate;
    box-shadow: 0 0 25px rgba(255,0,85,0.4), inset 0 0 15px rgba(255,0,85,0.1);
  }
  .array-cell.active { border-color: #00f2ff; box-shadow: 0 0 20px rgba(0,242,255,0.3); }
  @keyframes ls-swap-shake { 0% { transform: scale(1.1) rotate(3deg); } 100% { transform: scale(1.1) rotate(-3deg); } }

  .cell-val { 
    font-family: 'JetBrains Mono', monospace; 
    font-size: 11px; /* Smaller font for objects */
    color: #fff; 
    z-index: 2; 
    text-align: center;
    max-width: 150px; /* Prevent text from spreading too wide */
    word-break: break-word;
    line-height: 1.2;
  }
  .cell-idx { position: absolute; bottom: -22px; font-size: 8px; color: #555; font-family: 'Orbitron', sans-serif; }
  /* Pointer names (like "Sara") should be clearly above */
  .pointer-tag { 
    position: absolute; top: -25px; left: 50%; transform: translateX(-50%); 
    font-family: 'Orbitron'; font-size: 9px; color: #ff9d00; 
    white-space: nowrap; font-weight: bold;
  }
  @keyframes ls-bounce { from { transform: translateX(-50%) translateY(0); } to { transform: translateX(-50%) translateY(3px); } }

  .scalar-sidebar { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); }
  .scalar-chip { display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; }
  .scalar-name { font-family: 'Orbitron', sans-serif; font-size: 8px; color: #bc13fe; text-transform: uppercase; }
  .scalar-val { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #00f2ff; }

  .sequence-container { display: flex; gap: 10px; padding: 20px; background: rgba(255,255,255,0.02); border: 1px dashed #333; border-radius: 10px; }
  .queue-row { flex-direction: row; align-items: center; flex-wrap: wrap; justify-content: center; }
  .stack-column { flex-direction: column-reverse; align-items: center; min-width: 100px; }
  .seq-node { width: 60px; height: 40px; background: #111; border: 1px solid #bc13fe; border-radius: 4px; display: flex; align-items: center; justify-content: center; position: relative; animation: ls-pop-in 0.3s forwards; }
  .node-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #00f2ff; }
  .linear-tag { position: absolute; font-size: 8px; font-family: 'Orbitron', sans-serif; color: #bc13fe; top: -15px; width: 100%; text-align: center; }
  .stack-column .linear-tag { left: 70px; top: 12px; text-align: left; }
  .empty-linear { font-family: 'Orbitron', sans-serif; font-size: 10px; color: #333; padding: 20px; text-align: center; }

  .tree-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 25px; width: 100%; }
  .tree-node-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .tree-circle { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #00f2ff; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 14px; background: rgba(0,242,255,0.05); }
  .tree-id { font-size: 9px; color: #444; }

  .variable-grid { display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; }
  .variable-node { min-width: 80px; padding: 12px 16px; background: rgba(188,19,254,0.03); border: 1px solid rgba(188,19,254,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; animation: ls-pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; opacity: 0; }
  .variable-node.array-inline { min-width: 120px; }
  .variable-node.obj-card { min-width: 140px; }
  @keyframes ls-pop-in { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .node-content { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .node-label { font-family: 'Orbitron', sans-serif; font-size: 8px; color: #bc13fe; text-transform: uppercase; letter-spacing: 1px; }
  .node-value { font-family: 'JetBrains Mono', monospace; font-size: 16px; color: #00f2ff; }

  .inline-arr { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
  .inline-arr-item { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #00f2ff; padding: 2px 6px; background: rgba(0,242,255,0.05); border: 1px solid rgba(0,242,255,0.15); border-radius: 4px; }

  .obj-fields { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
  .obj-field { font-size: 10px; color: #888; }
  .obj-key { color: #bc13fe; }
  .obj-val { color: #00f2ff; font-family: 'JetBrains Mono', monospace; }
  /* Final Neon Tower of Hanoi Styles */
  .hanoi-stage { 
    display: flex; flex-direction: column; align-items: center; width: 100%; 
    padding: 50px 10px; position: relative;
  }
  .hanoi-container { 
    display: flex; justify-content: space-around; align-items: flex-end; 
    width: 100%; height: 160px; position: relative; z-index: 2;
  }
  .hanoi-pole-wrapper { 
    display: flex; flex-direction: column; align-items: center; width: 30%; position: relative; 
  }
  
  /* Neon Purple Rods */
  .hanoi-rod { 
    width: 10px; height: 140px; background: #bc13fe; 
    border-radius: 10px 10px 0 0; position: absolute; bottom: 0; z-index: 1; 
    box-shadow: 0 0 15px rgba(188, 19, 254, 0.6);
  }

  /* Neon Purple Base */
  .hanoi-base {
    width: 90%; height: 12px; background: #bc13fe; 
    border-radius: 10px; margin-top: -2px; z-index: 3;
    box-shadow: 0 0 15px rgba(188, 19, 254, 0.4);
  }
  
  /* Neon Cyan Rings (Pill Shape) */
  .hanoi-discs { 
    display: flex; flex-direction: column-reverse; align-items: center; 
    width: 100%; z-index: 4; gap: 2px; padding-bottom: 2px;
  }
  .hanoi-disc { 
    height: 24px; border-radius: 12px; 
    background: #00f2ff;
    border: 1px solid #fff;
    display: flex; align-items: center; justify-content: center;
    color: #000; font-family: 'Orbitron'; font-size: 10px; font-weight: bold;
    box-shadow: 0 0 12px rgba(0, 242, 255, 0.5);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .hanoi-disc.moving { 
    transform: translateY(-25px); 
    box-shadow: 0 15px 25px rgba(0, 242, 255, 0.8);
  }
  
  .pole-label-top { 
    position: absolute; top: -35px; font-family: 'Orbitron'; 
    font-size: 16px; font-weight: bold; color: #bc13fe; 
  }
`;
let stylesInjected = false;
function injectLogicStyles() {
    if (stylesInjected || typeof document === 'undefined') return;
    if (document.getElementById('logic-structure-styles')) { stylesInjected = true; return; }
    const el = document.createElement('style');
    el.id = 'logic-structure-styles';
    el.textContent = LOGIC_STYLES;
    document.head.appendChild(el);
    stylesInjected = true;
}

const LogicStructure: React.FC<LogicStructureProps> = ({ frame }) => {
    injectLogicStyles();

    const { memory = {}, type, metadata, action } = frame;

    const scalarVars = Object.entries(memory).filter(
        ([, v]) => !Array.isArray(v) && typeof v !== 'object'
    );

    const formatValue = (val: any) => {
        if (val === null || val === undefined) return "null";
        if (typeof val === 'object') {
            // If it's an object, try to show the 'name', 'id', or just 'Object'
            return val.name || val.id || val.label || "{...}";
        }
        return String(val);
    };

    const actionColor = (a: string) => {
        switch (a) {
            case 'COMPARE': return '#ffaa00';
            case 'SWAP': return '#ff0055';
            case 'WRITE': return '#00f2ff';
            case 'INIT': return '#bc13fe';
            case 'READ': return '#44ff88';
            case 'BRANCH': return '#ff6b6b';
            case 'END': return '#ff3333';
            default: return '#888';
        }
    };

    // ── ARRAY ──────────────────────────────────────────────────────────────────
    if (type === 'ARRAY' || (memory && Object.values(memory).some(v => Array.isArray(v)))) {
        const arrayName = Object.keys(memory).find(k => Array.isArray(memory[k])) || 'arr';
        const arr = memory[arrayName];
        const safeArr = Array.isArray(arr) ? arr : [];

        return (
            <div className="logic-structure array-view">
                <div className="action-banner" style={{ borderLeftColor: actionColor(action) }}>
                    <span className="action-label" style={{ color: actionColor(action) }}>{action}</span>
                    <span className="step-counter">STEP {frame.id}</span>
                </div>
                <h3 className="struct-label">{arrayName.toUpperCase()} <span className="type-badge">ARRAY</span></h3>
                <div className="array-cells">
                    {safeArr.length === 0 && <div className="empty-linear">EMPTY ARRAY</div>}
                    {safeArr.map((val, idx) => {
                        const isComparing = metadata?.highlightIndex?.includes(idx) && action === 'COMPARE';
                        const isSwapping = metadata?.highlightIndex?.includes(idx) && action === 'SWAP';
                        const isActive = metadata?.highlightIndex?.includes(idx);
                        const isPointer = metadata?.pointerName && metadata?.highlightIndex?.includes(idx);
                        const numericVal = typeof val === 'number' ? Math.abs(val) : 3;
                        const maxVal = Math.max(...safeArr.filter(v => typeof v === 'number').map(v => Math.abs(v as number)), 10);
                        const bubbleSize = 45 + Math.min(30, (numericVal / maxVal) * 30);
                        const hue = (idx * 47 + numericVal * 3) % 360;
                        return (
                            <div
                                key={idx}
                                className={`array-cell ${isComparing ? 'comparing' : ''} ${isSwapping ? 'swapping' : ''} ${isActive && !isComparing && !isSwapping ? 'active' : ''}`}
                                style={{ width: `${bubbleSize}px`, height: `${bubbleSize}px`, '--hue': hue } as React.CSSProperties}
                            >
                                <div className="cell-val">{formatValue(val)}</div>
                                <div className="cell-idx">{idx}</div>
                                {isPointer && <div className="pointer-tag">{metadata.pointerName}</div>}
                            </div>
                        );
                    })}
                </div>
                {scalarVars.length > 0 && (
                    <div className="scalar-sidebar">
                        {scalarVars.map(([k, v]) => (
                            <div key={k} className="scalar-chip">
                                <span className="scalar-name">{k}</span>
                                <span className="scalar-val">{String(v)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── QUEUE / STACK ──────────────────────────────────────────────────────────
    if (type === 'QUEUE' || type === 'STACK') {
        const sequenceName = Object.keys(memory).find(k => Array.isArray(memory[k])) || 'data';
        const seq = memory[sequenceName];
        const safeSeq = Array.isArray(seq) ? seq : [];
        return (
            <div className={`logic-structure linear-view ${type.toLowerCase()}-view`}>
                <div className="action-banner" style={{ borderLeftColor: actionColor(action) }}>
                    <span className="action-label" style={{ color: actionColor(action) }}>{action}</span>
                    <span className="step-counter">STEP {frame.id}</span>
                </div>
                <h3 className="struct-label">{sequenceName.toUpperCase()} <span className="type-badge">{type}</span></h3>
                <div className={`sequence-container ${type === 'STACK' ? 'stack-column' : 'queue-row'}`}>
                    {safeSeq.map((val: any, idx: number) => (
                        <div key={idx} className="seq-node" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <span className="node-val">{formatValue(val)}</span>
                            {type === 'QUEUE' && idx === 0 && <span className="linear-tag">FRONT</span>}
                            {type === 'QUEUE' && idx === safeSeq.length - 1 && <span className="linear-tag">REAR</span>}
                            {type === 'STACK' && idx === safeSeq.length - 1 && <span className="linear-tag">TOP</span>}
                        </div>
                    ))}
                    {safeSeq.length === 0 && <div className="empty-linear">EMPTY {type}</div>}
                </div>
                {scalarVars.length > 0 && (
                    <div className="scalar-sidebar">
                        {scalarVars.map(([k, v]) => (
                            <div key={k} className="scalar-chip">
                                <span className="scalar-name">{k}</span>
                                <span className="scalar-val">{String(v)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── TREE ───────────────────────────────────────────────────────────────────
    if (type === 'TREE') {
        return (
            <div className="logic-structure tree-view">
                <div className="action-banner" style={{ borderLeftColor: actionColor(action) }}>
                    <span className="action-label" style={{ color: actionColor(action) }}>{action}</span>
                    <span className="step-counter">STEP {frame.id}</span>
                </div>
                <h3 className="struct-label">HIERARCHY <span className="type-badge">TREE</span></h3>
                <div className="tree-grid">
                    {Object.entries(memory).map(([k, v]) => (
                        <div key={k} className="tree-node-item">
                            <div className="tree-circle">{String(v)}</div>
                            <span className="tree-id">{k}</span>
                        </div>
                    ))}
                    {Object.keys(memory).length === 0 && <div className="empty-linear">EMPTY TREE</div>}
                </div>
            </div>
        );
    }
    // ── TOWER OF HANOI RENDERING ──────────────────────────────────────────────
    if ((type as string) === 'TOWER_OF_HANOI' || memory.FROM || memory.from) {
        const poles = ['A', 'B', 'C'];
        const poleLabels: Record<string, string> = { 'A': '1', 'B': '2', 'C': '3' };

        // 🟢 FIX: Handle case where AI sends variables but no physical ring arrays
        const poleA = memory.A || (memory.FROM === 'A' || memory.from === 'A' ? [3, 2, 1] : []);
        const poleB = memory.B || (memory.FROM === 'B' || memory.from === 'B' ? [3, 2, 1] : []);
        const poleC = memory.C || (memory.FROM === 'C' || memory.from === 'C' ? [3, 2, 1] : []);
        const hanoiMemory: Record<string, any> = { A: poleA, B: poleB, C: poleC };

        const movingRing = metadata?.movingRing || (memory.N || memory.n || null);

        return (
            <div className="logic-structure hanoi-view">
                <div className="action-banner" style={{ borderLeftColor: '#00f2ff' }}>
                    <span className="action-label" style={{ color: '#00f2ff' }}>RECURSIVE STEP</span>
                    <span className="step-counter">STEP {frame.id}</span>
                </div>

                <div className="hanoi-stage">
                    <div className="hanoi-container">
                        {poles.map(pID => (
                            <div key={pID} className="hanoi-pole-wrapper">
                                <div className="pole-label-top">{poleLabels[pID]}</div>
                                <div className="hanoi-rod"></div>
                                <div className="hanoi-discs">
                                    {(hanoiMemory[pID] || []).map((ringSize: number) => (
                                        <div
                                            key={ringSize}
                                            className={`hanoi-disc ${movingRing === ringSize && (memory.FROM === pID || memory.from === pID) ? 'moving' : ''}`}
                                            style={{ width: `${ringSize * 35 + 20}px` }}
                                        >
                                            {/* Label inside ring */}
                                            {ringSize === 1 ? 'A' : ringSize === 2 ? 'B' : 'C'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="hanoi-base"></div>
                </div>

                <div className="scalar-sidebar">
                    {Object.entries(memory)
                        .filter(([k]) => !['A', 'B', 'C', 'poleA', 'poleB', 'poleC'].includes(k))
                        .map(([k, v]) => (
                            <div key={k} className="scalar-chip">
                                <span className="scalar-name">{k}</span>
                                <span className="scalar-val">{String(v)}</span>
                            </div>
                        ))}
                </div>
            </div>
        );
    }
    // ── DEFAULT: VARIABLE HUD ──────────────────────────────────────────────────
    const allEntries = Object.entries(memory);
    const arrayEntries = allEntries.filter(([, v]) => Array.isArray(v));
    const objectEntries = allEntries.filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v));
    const primitiveEntries = allEntries.filter(([, v]) => typeof v !== 'object' || v === null);

    return (
        <div className="logic-structure default-view">
            <div className="action-banner" style={{ borderLeftColor: actionColor(action) }}>
                <span className="action-label" style={{ color: actionColor(action) }}>{action}</span>
                <span className="step-counter">STEP {frame.id}</span>
            </div>
            <h3 className="struct-label">MEMORY HUD <span className="type-badge">RUNTIME</span></h3>
            <div className="variable-grid">
                {primitiveEntries.map(([k, v], i) => (
                    <div key={k} className="variable-node" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="node-content">
                            <span className="node-label">{k}</span>
                            <span className="node-value">{String(v)}</span>
                        </div>
                    </div>
                ))}
                {arrayEntries.map(([k, v]) => (
                    <div key={k} className="variable-node array-inline">
                        <div className="node-content">
                            <span className="node-label">{k}</span>
                            <div className="inline-arr">
                                {(v as any[]).map((item, i) => (
                                    <span key={i} className="inline-arr-item">{formatValue(item)}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                {objectEntries.map(([k, v]) => (
                    <div key={k} className="variable-node obj-card">
                        <div className="node-content">
                            <span className="node-label">{k}</span>
                            <div className="obj-fields">
                                {Object.entries(v as Record<string, any>).slice(0, 5).map(([fk, fv]) => (
                                    <div key={fk} className="obj-field">
                                        <span className="obj-key">{fk}:</span> <span className="obj-val">{JSON.stringify(fv)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                {allEntries.length === 0 && <div className="empty-linear">NO VARIABLES</div>}
            </div>
        </div>
    );
};

export default LogicStructure;
