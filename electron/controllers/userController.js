const { User } = require('../models');

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
      const user = await User.findById(userId).select('-password');
      if (!user) return { success: false, msg: "User not found" };

      const stats = {
        linesWritten: 1240, 
        bugsSquashed: 86,
        conceptsLearned: 12,
        arcadeScore: 4500,
        level: "Level 12: System Architect",
        xp: 12500
      };

      const skillMatrix = [
        { subject: 'Logic', A: 120, fullMark: 150 },
        { subject: 'Syntax', A: 98, fullMark: 150 },
        { subject: 'Speed', A: 86, fullMark: 150 },
        { subject: 'Debug', A: 99, fullMark: 150 },
        { subject: 'Visuals', A: 85, fullMark: 150 },
      ];

      const recentActivity = [
        { id: 1, title: "Loops & Arrays", type: "Terminal Practice", time: "2h ago", xp: 150, color: "#00f2ff", icon: 'fa-terminal' },
        { id: 2, title: "Debug Race", type: "Rank S", time: "5h ago", xp: 300, color: "#ff0055", icon: 'fa-bug' },
        { id: 3, title: "Memory Heap", type: "Visual Guide", time: "Yesterday", xp: 50, color: "#bc13fe", icon: 'fa-code' },
      ];

      return { 
        success: true, 
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio
        },
        stats, 
        skillMatrix, 
        recentActivity 
      };
    } catch (err) {
      console.error("Dashboard Data Error:", err);
      return { success: false, msg: "Failed to load dashboard data." };
    }
  }
};

module.exports = userController;