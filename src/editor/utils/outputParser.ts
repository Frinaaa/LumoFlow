
/**
 * Output Parser Utility
 * Extracts visualizable data structures from terminal/stdout
 */

export interface OutputVisual {
    type: 'ARRAY' | 'OBJECT' | 'NUMBER' | 'STRING' | 'NONE';
    data: any;
    label?: string;
}

export const parseOutputForVisuals = (output: string): OutputVisual => {
    if (!output) return { type: 'NONE', data: null };

    // Clean up terminal formatting/colors if any (though usually handled by terminal component)
    const cleanOutput = output.replace(/\n\n+/g, '\n').trim();
    const lines = cleanOutput.split('\n');

    // Look for the last line that looks like an array or result
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();

        // Match JSON-like array: [1, 2, 3] or [ "a", "b" ]
        const arrayMatch = line.match(/^\[\s*.*?\s*\]$/);
        if (arrayMatch) {
            try {
                // Try JSON parse, if it fails try a more lenient eval-like parse
                const data = JSON.parse(line.replace(/'/g, '"'));
                if (Array.isArray(data)) {
                    return { type: 'ARRAY', data };
                }
            } catch (e) {
                // Attempt manual parse for [1, 2, 3] without quotes
                const content = line.substring(1, line.length - 1);
                const items = content.split(',').map(item => item.trim());
                if (items.length > 0) {
                    return { type: 'ARRAY', data: items };
                }
            }
        }

        // Match "Result: 42" or "Sorted: [1, 2]"
        const resultMatch = line.match(/^(?:result|sorted|output|final)\s*:?\s*(.+)$/i);
        if (resultMatch) {
            const val = resultMatch[1].trim();
            if (val.startsWith('[') && val.endsWith(']')) {
                // It's an array result
                const items = val.substring(1, val.length - 1).split(',').map(item => item.trim());
                return { type: 'ARRAY', data: items, label: 'Final Result' };
            }
            return { type: 'STRING', data: val, label: 'Final Result' };
        }
    }

    return { type: 'NONE', data: null };
};
