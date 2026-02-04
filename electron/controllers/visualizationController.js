const { SavedVisualization } = require('../models');

const visualizationController = {
    // Save a new visualization
    async saveVisualization(event, { userId, title, codeSnippet, visualType, traceFrames }) {
        try {
            if (!userId) return { success: false, msg: "User ID required" };

            // Skip demo users
            if (typeof userId !== 'string' || userId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(userId)) {
                return { success: true, demo: true };
            }

            console.log(`💾 SAVING VISUALIZATION for User: ${userId}`);
            console.log(`   Title: ${title}`);
            console.log(`   Type: ${visualType}`);

            const savedViz = await SavedVisualization.create({
                userId,
                title: title || 'Untitled Visualization',
                codeSnippet,
                visualType,
                traceFrames: JSON.stringify(traceFrames)
            });

            console.log(`✅ VISUALIZATION SAVED: ${savedViz._id}`);
            return { success: true, visualizationId: savedViz._id.toString() };
        } catch (err) {
            console.error("Save Visualization Error:", err);
            return { success: false, msg: err.message };
        }
    },

    // Get all visualizations for a user
    async getUserVisualizations(event, userId) {
        try {
            if (!userId) return { success: false, msg: "User ID required" };

            // Skip demo users
            if (typeof userId !== 'string' || userId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(userId)) {
                return { success: true, visualizations: [] };
            }

            console.log(`📂 FETCHING VISUALIZATIONS for User: ${userId}`);

            const visualizations = await SavedVisualization
                .find({ userId })
                .sort({ createdAt: -1 })
                .limit(50) // Limit to 50 most recent
                .select('_id title visualType codeSnippet createdAt');

            console.log(`📊 FOUND ${visualizations.length} visualizations`);

            return {
                success: true,
                visualizations: visualizations.map(viz => ({
                    id: viz._id.toString(),
                    title: viz.title,
                    type: viz.visualType,
                    code: viz.codeSnippet.substring(0, 100) + '...', // Preview only
                    date: viz.createdAt
                }))
            };
        } catch (err) {
            console.error("Get Visualizations Error:", err);
            return { success: false, msg: err.message };
        }
    },

    // Get a single visualization by ID (for replay)
    async getVisualization(event, { userId, visualizationId }) {
        try {
            if (!userId || !visualizationId) {
                return { success: false, msg: "User ID and Visualization ID required" };
            }

            console.log(`🎬 LOADING VISUALIZATION: ${visualizationId} for User: ${userId}`);

            const viz = await SavedVisualization.findOne({
                _id: visualizationId,
                userId // Ensure user owns this visualization
            });

            if (!viz) {
                return { success: false, msg: "Visualization not found" };
            }

            return {
                success: true,
                visualization: {
                    id: viz._id.toString(),
                    title: viz.title,
                    type: viz.visualType,
                    code: viz.codeSnippet,
                    frames: JSON.parse(viz.traceFrames || '[]'),
                    date: viz.createdAt
                }
            };
        } catch (err) {
            console.error("Get Visualization Error:", err);
            return { success: false, msg: err.message };
        }
    },

    // Delete a visualization
    async deleteVisualization(event, { userId, visualizationId }) {
        try {
            if (!userId || !visualizationId) {
                return { success: false, msg: "User ID and Visualization ID required" };
            }

            console.log(`🗑️ DELETING VISUALIZATION: ${visualizationId}`);

            const result = await SavedVisualization.deleteOne({
                _id: visualizationId,
                userId // Ensure user owns this visualization
            });

            if (result.deletedCount === 0) {
                return { success: false, msg: "Visualization not found or already deleted" };
            }

            console.log(`✅ VISUALIZATION DELETED`);
            return { success: true };
        } catch (err) {
            console.error("Delete Visualization Error:", err);
            return { success: false, msg: err.message };
        }
    }
};

module.exports = visualizationController;
