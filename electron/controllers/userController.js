const { User, GameProgress } = require('../models');

const userController = {
  async updateProfile(event, data) {
    const { userId, name, bio, avatar } = data;
    try {
      console.log("UserController updateProfile - Received userId:", userId);

      if (!userId) {
        console.error("No userId provided");
        return { success: false, msg: "User ID is required" };
      }

      // Validate avatar size (Base64 can be large)
      if (avatar && avatar.length > 5000000) {
        return { success: false, msg: "Image too large (max 5MB)" };
      }

      const updateData = { $set: {} };
      if (name) updateData.$set.name = name;
      if (bio) updateData.$set.bio = bio;
      if (avatar) updateData.$set.avatar = avatar;

      console.log("Updating user with data:", { name, bio, avatarSize: avatar ? avatar.length : 0 });

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        console.error("User not found for ID:", userId);
        return { success: false, msg: "User not found" };
      }

      console.log("User updated successfully");

      return {
        success: true,
        user: {
          _id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio
        }
      };
    } catch (err) {
      console.error("UpdateProfile error:", err);
      return { success: false, msg: err.message };
    }
  },

  async getDashboardData(event, userId) {
    try {
      if (!userId) return { success: false, msg: "No User ID provided" };

      // Handle Demo Mode or Invalid IDs
      if (typeof userId !== 'string' || userId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        console.warn("Using Demo Mode / Skipping DB for ID:", userId);
        return {
          success: true,
          user: { name: "Demo User", email: "demo@lumoflow.ai", avatar: "", bio: "Developer in training" },
          stats: { linesWritten: 0, bugsSquashed: 0, conceptsLearned: 0, arcadeScore: 0, level: "LVL 0: DEMO", xp: 0 },
          skillMatrix: [],
          recentActivity: []
        };
      }

      console.log(`📂 DASHBOARD DATA for User: ${userId}`);
      const user = await User.findById(userId).select('-password');
      if (!user) {
        console.warn(`❌ DASHBOARD FAIL: User not found - ${userId}`);
        return { success: false, msg: "User not found" };
      }

      const stats = {
        linesWritten: user.linesWritten || 0,
        bugsDetected: user.bugsDetected || 0,
        conceptsVisualized: user.conceptsVisualized || 0,
        totalScore: user.totalScore || 0,
        level: this.calculateLevel(user.totalScore || 0),
        xp: user.totalScore || 0
      };

      console.log(`📈 SENDING STATS to Frontend:`, stats);

      // 🟢 DYNAMIC SKILL MATRIX (Calculated from real stats)
      const skillMatrix = [
        { subject: 'Logic', A: Math.min(150, (user.totalScore || 0) / 10 + 60), fullMark: 150 },
        { subject: 'Syntax', A: Math.min(150, (user.linesWritten || 0) / 5 + 50), fullMark: 150 },
        { subject: 'Speed', A: 86, fullMark: 150 },
        { subject: 'Debug', A: Math.min(150, (user.bugsDetected || 0) * 15 + 40), fullMark: 150 },
        { subject: 'Visuals', A: Math.min(150, (user.conceptsVisualized || 0) * 20 + 30), fullMark: 150 },
      ];

      // Format recent activity for frontend
      const recentActivity = (user.recentActivity || []).map((act, index) => ({
        id: act._id || index,
        title: act.title,
        type: act.type,
        time: this.formatTimeAgo(act.time),
        xp: act.xp,
        color: act.color,
        icon: act.icon
      })).reverse().slice(0, 5); // Show latest 5

      console.log(`📋 SENDING ACTIVITY: ${recentActivity.length} items`);

      return {
        success: true,
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          ...stats // Include stats in user object too
        },
        stats,
        skillMatrix,
        recentActivity
      };
    } catch (err) {
      console.error("Dashboard Data Error:", err);
      return { success: false, msg: "Failed to load dashboard data." };
    }
  },

  async updateStats(event, { userId, linesWritten, bugsDetected, conceptsVisualized, totalScore }) {
    try {
      if (!userId) return { success: false, msg: "User ID required" };

      if (typeof userId !== 'string' || userId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        return { success: true, demo: true };
      }

      const update = { $inc: {} };
      if (linesWritten) update.$inc.linesWritten = linesWritten;
      if (bugsDetected) update.$inc.bugsDetected = bugsDetected;
      if (conceptsVisualized) update.$inc.conceptsVisualized = conceptsVisualized;
      if (totalScore) update.$inc.totalScore = totalScore;

      console.log(`📊 DB UPDATE START for User: ${userId}`, update);
      const user = await User.findByIdAndUpdate(userId, update, { new: true });
      if (!user) {
        console.warn(`❌ USER NOT FOUND in DB for update: ${userId}`);
        return { success: false, msg: "User not found in database" };
      }
      console.log(`✅ DB UPDATE SUCCESS for User: ${userId}. New Stats:`, {
        linesWritten: user.linesWritten,
        bugsDetected: user.bugsDetected,
        conceptsVisualized: user.conceptsVisualized,
        totalScore: user.totalScore
      });
      return {
        success: true, stats: {
          linesWritten: user.linesWritten,
          bugsDetected: user.bugsDetected,
          conceptsVisualized: user.conceptsVisualized,
          totalScore: user.totalScore
        }
      };
    } catch (err) {
      return { success: false, msg: err.message };
    }
  },

  async saveGameProgress(event, { userId, gameName, score, level }) {
    try {
      if (!userId) return { success: false, msg: "User ID required" };

      if (typeof userId !== 'string' || userId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        return { success: true, demo: true };
      }

      console.log(`🎮 SAVING GAME PROGRESS: User: ${userId}, Game: ${gameName}, Score: ${score}, Lvl: ${level}`);

      // 1. Update/Insert Game Progress entry
      await GameProgress.findOneAndUpdate(
        { userId, gameName },
        {
          $set: { level, playedAt: new Date() },
          $inc: { score: score || 0 }
        },
        { upsert: true, new: true }
      );

      // 2. Increment User's totalScore
      if (score) {
        await User.findByIdAndUpdate(userId, { $inc: { totalScore: score } });
      }

      return { success: true };
    } catch (err) {
      console.error("Save Game Progress Error:", err);
      return { success: false, msg: err.message };
    }
  },

  async addActivity(event, { userId, activity }) {
    try {
      if (!userId) return { success: false, msg: "User ID required" };

      if (typeof userId !== 'string' || userId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        return { success: true, demo: true };
      }

      console.log(`📝 DB ACTIVITY PUSH for User: ${userId}`, activity.title);
      const user = await User.findByIdAndUpdate(
        userId,
        { $push: { recentActivity: { ...activity, time: new Date() } } },
        { new: true }
      );
      if (!user) {
        console.warn(`❌ USER NOT FOUND in DB for activity: ${userId}`);
        return { success: false, msg: "User not found in database" };
      }
      console.log(`✅ DB ACTIVITY SUCCESS for User: ${userId}`);
      return { success: true };
    } catch (err) {
      return { success: false, msg: err.message };
    }
  },

  // Helper to calculate level based on XP/Score
  calculateLevel(xp) {
    if (xp < 500) return "LVL 0: DETECTING...";
    if (xp < 1500) return "LVL 1: NOVICE FLOW";
    if (xp < 3000) return "LVL 2: LOGIC BUILDER";
    if (xp < 6000) return "LVL 3: SYNTAX SORCERER";
    return `LVL ${Math.floor(xp / 2000)}: ARCHITECT`;
  },

  // Helper to format date to "2h ago" etc.
  formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
  }
};

module.exports = userController;