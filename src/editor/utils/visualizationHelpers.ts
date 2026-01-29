/**
 * Visualization Helpers
 * Utilities for code visualization and animation
 */

export type AnimationFlavor = 'smooth' | 'minimal' | 'energetic';

export interface AnimationConfig {
  duration: number;
  easing: string;
  glowIntensity: number;
  transitionSpeed: number;
}

export const ANIMATION_CONFIGS: Record<AnimationFlavor, AnimationConfig> = {
  smooth: {
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    glowIntensity: 0.4,
    transitionSpeed: 0.3
  },
  minimal: {
    duration: 300,
    easing: 'ease-out',
    glowIntensity: 0.1,
    transitionSpeed: 0.2
  },
  energetic: {
    duration: 500,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    glowIntensity: 0.8,
    transitionSpeed: 0.4
  }
};

/**
 * Auto-detect animation flavor based on code characteristics
 */
export const detectAnimationFlavor = (analysisData: any): AnimationFlavor => {
  if (!analysisData) return 'smooth';
  
  const hasLoops = analysisData.controlFlow?.some((cf: any) => cf.type === 'loop') || false;
  const hasAsync = analysisData.functions?.some((f: any) => f.async) || false;
  const isComplex = analysisData.totalLines > 50 || (analysisData.functions?.length || 0) > 5;
  
  if (hasAsync) return 'energetic';
  if (hasLoops) return 'smooth';
  if (isComplex) return 'minimal';
  return 'smooth';
};

/**
 * Get icon name based on node type or explanation
 */
export const getExecutionIcon = (nodeType?: string, explanation?: string): string => {
  if (nodeType === 'loop' || explanation?.toLowerCase().includes('loop')) return 'rotate';
  if (nodeType === 'function' || explanation?.toLowerCase().includes('function')) return 'code';
  if (nodeType === 'variable' || explanation?.toLowerCase().includes('variable')) return 'database';
  if (nodeType === 'decision' || explanation?.toLowerCase().includes('conditional') || explanation?.toLowerCase().includes('if')) return 'code-branch';
  if (nodeType === 'output' || explanation?.toLowerCase().includes('console') || explanation?.toLowerCase().includes('print')) return 'terminal';
  if (nodeType === 'start') return 'play';
  if (nodeType === 'end') return 'flag-checkered';
  return 'play';
};

/**
 * Determine if icon should spin or pulse
 */
export const shouldSpin = (nodeType?: string, explanation?: string): boolean => {
  return nodeType === 'loop' || explanation?.toLowerCase().includes('loop') || false;
};

/**
 * Generate CSS animations
 */
export const generateAnimationCSS = (config: AnimationConfig): string => `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes popIn {
    0% { transform: scale(0) translateY(-50px); opacity: 0; }
    70% { transform: scale(1.2) translateY(0); opacity: 1; }
    100% { transform: scale(1); }
  }
  
  @keyframes borderFlash {
    from { box-shadow: 0 0 5px #bc13fe; }
    to { box-shadow: 0 0 20px #bc13fe; }
  }
`;

/**
 * Format output for display
 */
export const formatOutput = (output: any): string => {
  if (typeof output === 'string') return output;
  if (typeof output === 'object') return JSON.stringify(output, null, 2);
  return String(output);
};
