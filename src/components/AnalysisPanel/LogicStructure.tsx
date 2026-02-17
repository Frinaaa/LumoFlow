import React from 'react';
import { TraceFrame } from '../../editor/stores/visualStore';

interface LogicStructureProps {
    frame: TraceFrame;
}

const LogicStructure: React.FC<LogicStructureProps> = ({ frame }) => {
    const { memory = {}, type, metadata, action, desc } = frame;

    // Helper: extract all non-array scalar variables from memory for a side panel
    const scalarVars = Object.entries(memory).filter(
        ([k, v]) => !Array.isArray(v) && typeof v !== 'object'
    );

    // Helper: determine action color
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

    // ============================
    // 📦 RENDERER: ARRAY / LISTS
    // ============================
    if (type === 'ARRAY' || (memory && Object.values(memory).some(v => Array.isArray(v)))) {
        const arrayName = Object.keys(memory).find(k => Array.isArray(memory[k])) || 'arr';
        const arr = memory[arrayName];
        const safeArr = Array.isArray(arr) ? arr : [];

        return (
            <div className="logic-structure array-view">
                {/* Action banner */}
                <div className="action-banner" style={{ borderLeftColor: actionColor(action) }}>
                    <span className="action-label" style={{ color: actionColor(action) }}>{action}</span>
                    <span className="step-counter">STEP {frame.id}</span>
                </div>

                <h3 className="struct-label">{arrayName.toUpperCase()} <span className="type-badge">ARRAY</span></h3>

                {/* 3D Sphere Grid */}
                <div className="array-cells">
                    {safeArr.length === 0 && <div className="empty-linear">EMPTY ARRAY</div>}
                    {safeArr.map((val, idx) => {
                        const isComparing = metadata?.highlightIndex?.includes(idx) && action === 'COMPARE';
                        const isSwapping = metadata?.highlightIndex?.includes(idx) && action === 'SWAP';
                        const isActive = metadata?.highlightIndex?.includes(idx);
                        const isPointer = metadata?.pointerName && metadata?.highlightIndex?.includes(idx);

                        // Value-mapped bubble sizing
                        const numericVal = typeof val === 'number' ? Math.abs(val) : 3;
                        const maxVal = Math.max(...safeArr.filter(v => typeof v === 'number').map(v => Math.abs(v as number)), 10);
                        const bubbleSize = 45 + Math.min(30, (numericVal / maxVal) * 30);
                        const hue = (idx * 47 + numericVal * 3) % 360;

                        return (
                            <div
                                key={idx}
                                className={`array-cell ${isComparing ? 'comparing' : ''} ${isSwapping ? 'swapping' : ''} ${isActive && !isComparing && !isSwapping ? 'active' : ''}`}
                                style={{
                                    width: `${bubbleSize}px`,
                                    height: `${bubbleSize}px`,
                                    '--hue': hue,
                                } as React.CSSProperties}
                            >
                                <div className="cell-val">{JSON.stringify(val)}</div>
                                <div className="cell-idx">{idx}</div>
                                {isPointer && (
                                    <div className="pointer-tag">{metadata.pointerName}</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Scalar sidebar (i, j, temp, etc.) */}
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

    // ============================
    // 📦 RENDERER: QUEUE / STACK
    // ============================
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
                            <span className="node-val">{JSON.stringify(val)}</span>
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

    // ============================
    // 📦 RENDERER: TREE / GRAPH
    // ============================
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

    // ============================
    // 📦 DEFAULT: VARIABLE HUD
    // ============================
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
                {/* Render primitives as data cards */}
                {primitiveEntries.map(([k, v], i) => (
                    <div key={k} className="variable-node" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="node-content">
                            <span className="node-label">{k}</span>
                            <span className="node-value">{String(v)}</span>
                        </div>
                    </div>
                ))}

                {/* Render inline arrays */}
                {arrayEntries.map(([k, v]) => (
                    <div key={k} className="variable-node array-inline">
                        <div className="node-content">
                            <span className="node-label">{k}</span>
                            <div className="inline-arr">
                                {(v as any[]).map((item, i) => (
                                    <span key={i} className="inline-arr-item">{JSON.stringify(item)}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Render objects as expandable */}
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

                {allEntries.length === 0 && (
                    <div className="empty-linear">NO VARIABLES</div>
                )}
            </div>
        </div>
    );
};

export default LogicStructure;
