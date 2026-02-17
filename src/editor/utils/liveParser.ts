// Define VisualType for live code parsing
type VisualType = 'ARRAY_PUSH' | 'VARIABLE_BOX' | 'CSS_FLEX' | 'NONE';

export const parseLiveCode = (code: string): { type: VisualType; params: any } => {
  const cleanCode = code.trim();
  const lastLine = cleanCode.split('\n').pop()?.trim() || "";

  // 1. Detect Array Push:  arr.push(10)
  const pushMatch = lastLine.match(/(\w+)\.push\((['"]?)(.+?)\2\)/);
  if (pushMatch) {
    const arrayName = pushMatch[1];

    // Attempt to find the array declaration in the rest of the code to avoid hardcoding
    const arrayDeclMatch = code.match(new RegExp(`(?:let|const|var)\\s+${arrayName}\\s*=\\s*\\[(.*?)\\]`));
    let existingItems: string[] = [];
    if (arrayDeclMatch) {
      existingItems = arrayDeclMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
    }

    return {
      type: 'ARRAY_PUSH',
      params: {
        arrayName,
        value: pushMatch[3],
        prevItems: existingItems.length > 0 ? existingItems : ['...'], // No longer hardcoded 4, 10, 5
      }
    };
  }

  // 2. Detect Variable Declaration: let x = 10
  const varMatch = lastLine.match(/(let|const|var)\s+(\w+)\s*=\s*(.+)/);
  if (varMatch) {
    return {
      type: 'VARIABLE_BOX',
      params: {
        name: varMatch[2],
        value: varMatch[3].replace(/['";]/g, '') // Clean up quotes/semicolons
      }
    };
  }

  // 3. Detect CSS Flexbox: display: flex
  if (cleanCode.includes('display: flex') || cleanCode.includes('display:flex')) {
    const justify = cleanCode.match(/justify-content:\s*(\w+)/);
    const align = cleanCode.match(/align-items:\s*(\w+)/);

    return {
      type: 'CSS_FLEX',
      params: {
        justify: justify ? justify[1] : 'flex-start',
        align: align ? align[1] : 'flex-start'
      }
    };
  }

  return { type: 'NONE', params: {} };
};