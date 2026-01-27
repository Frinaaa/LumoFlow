/**
 * Analysis API - Client-side wrapper for code analysis operations
 */

export interface AnalysisRequest {
    code: string;
    language: string;
    userId?: string;
    fileId?: string;
    fileName?: string;
}

export const analysisApi = {
    /**
     * Request deep analysis of code
     */
    async analyzeCode(data: AnalysisRequest) {
        try {
            if (!(window as any).api?.analyzeCode) {
                throw new Error('Analysis API not available');
            }
            return await (window as any).api.analyzeCode(data);
        } catch (error: any) {
            return {
                success: false,
                msg: error.message || 'Analysis failed'
            };
        }
    },

    /**
     * Get history of previous analyses
     */
    async getAnalysisHistory(userId: string) {
        try {
            return await (window as any).api.getAnalysisHistory(userId);
        } catch (error: any) {
            return {
                success: false,
                msg: error.message || 'Failed to fetch history'
            };
        }
    }
};
