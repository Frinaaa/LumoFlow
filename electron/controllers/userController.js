const { User, GameProgress } = require('../models');

const userController = {
  async getDashboardData(event, userId) {
    try {
      const user = await User.findById(userId).select('-password');
      
      // In a real app, calculate these from the 'CodeFile' and 'GameProgress' collections
      // For now, we return the structure needed for the UI
      const stats = {
        linesWritten: 1240, 
        bugsSquashed: 86,
        conceptsLearned: 12,
        arcadeScore: 4500,
        level: "Level 12: System Architect",
        xp: 12500
      };

      // Data for the Radar Chart
      const skillMatrix = [
        { subject: 'Logic', A: 120, fullMark: 150 },
        { subject: 'Syntax', A: 98, fullMark: 150 },
        { subject: 'Speed', A: 86, fullMark: 150 },
        { subject: 'Debug', A: 99, fullMark: 150 },
        { subject: 'Visuals', A: 85, fullMark: 150 },
      ];

      // Recent Activity
      const recentActivity = [
        { id: 1, title: "Loops & Arrays", type: "Terminal Practice", time: "2h ago", xp: 150, color: "#00f2ff" },
        { id: 2, title: "Debug Race", type: "Rank S", time: "5h ago", xp: 300, color: "#ff0055" },
        { id: 3, title: "Memory Heap", type: "Visual Guide", time: "Yesterday", xp: 50, color: "#bc13fe" },
      ];

      return { success: true, user, stats, skillMatrix, recentActivity };
    } catch (err) {
      console.error("Dashboard Data Error:", err);
      return { success: false, msg: "Failed to load dashboard." };
    }
  }
};

module.exports = userController;