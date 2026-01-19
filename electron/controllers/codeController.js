const { CodeProject, CodeFile, User } = require('../models');
const path = require('path');

const codeController = {
  // Save code to database
  async saveCodeToDatabase(event, data) {
    try {
      const { filePath, content, userId } = data;
      
      if (!userId) {
        return { success: false, msg: 'User ID required for database save' };
      }

      // Extract file info
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(fileName).toLowerCase();
      const language = fileExtension === '.py' ? 'python' : 'javascript';
      
      // Find or create project (using a default project for now)
      let project = await CodeProject.findOne({ 
        userId: userId, 
        projectName: 'Default Project' 
      });
      
      if (!project) {
        project = new CodeProject({
          userId: userId,
          projectName: 'Default Project',
          language: language
        });
        await project.save();
      }

      // Find or create code file
      let codeFile = await CodeFile.findOne({ 
        projectId: project._id, 
        fileName: fileName 
      });
      
      if (codeFile) {
        // Update existing file
        codeFile.codeContent = content;
        codeFile.lastModified = new Date();
        await codeFile.save();
      } else {
        // Create new file
        codeFile = new CodeFile({
          projectId: project._id,
          fileName: fileName,
          codeContent: content,
          lastModified: new Date()
        });
        await codeFile.save();
      }

      return { 
        success: true, 
        msg: 'Code saved to database',
        fileId: codeFile._id,
        projectId: project._id
      };
    } catch (err) {
      console.error('Save to database error:', err);
      return { success: false, msg: 'Database save failed: ' + err.message };
    }
  },

  // Load user's projects and files
  async loadUserProjects(event, userId) {
    try {
      if (!userId) {
        return { success: false, msg: 'User ID required' };
      }

      const projects = await CodeProject.find({ userId }).populate({
        path: 'files',
        model: 'CodeFile'
      });

      // Get files for each project
      const projectsWithFiles = await Promise.all(
        projects.map(async (project) => {
          const files = await CodeFile.find({ projectId: project._id });
          return {
            _id: project._id,
            projectName: project.projectName,
            language: project.language,
            createdAt: project.createdAt,
            files: files.map(file => ({
              _id: file._id,
              fileName: file.fileName,
              lastModified: file.lastModified,
              codeContent: file.codeContent
            }))
          };
        })
      );

      return { 
        success: true, 
        projects: projectsWithFiles 
      };
    } catch (err) {
      console.error('Load projects error:', err);
      return { success: false, msg: 'Failed to load projects: ' + err.message };
    }
  },

  // Load specific file content
  async loadFileFromDatabase(event, fileId) {
    try {
      const codeFile = await CodeFile.findById(fileId);
      if (!codeFile) {
        return { success: false, msg: 'File not found' };
      }

      return {
        success: true,
        file: {
          _id: codeFile._id,
          fileName: codeFile.fileName,
          codeContent: codeFile.codeContent,
          lastModified: codeFile.lastModified
        }
      };
    } catch (err) {
      console.error('Load file error:', err);
      return { success: false, msg: 'Failed to load file: ' + err.message };
    }
  },

  // Delete file from database
  async deleteFileFromDatabase(event, fileId) {
    try {
      const result = await CodeFile.findByIdAndDelete(fileId);
      if (!result) {
        return { success: false, msg: 'File not found' };
      }

      return { success: true, msg: 'File deleted from database' };
    } catch (err) {
      console.error('Delete file error:', err);
      return { success: false, msg: 'Failed to delete file: ' + err.message };
    }
  },

  // Create new project
  async createProject(event, data) {
    try {
      const { userId, projectName, language } = data;
      
      if (!userId || !projectName) {
        return { success: false, msg: 'User ID and project name required' };
      }

      // Check if project already exists
      const existingProject = await CodeProject.findOne({ 
        userId, 
        projectName 
      });
      
      if (existingProject) {
        return { success: false, msg: 'Project already exists' };
      }

      const project = new CodeProject({
        userId,
        projectName,
        language: language || 'javascript'
      });
      
      await project.save();

      return { 
        success: true, 
        msg: 'Project created',
        project: {
          _id: project._id,
          projectName: project.projectName,
          language: project.language,
          createdAt: project.createdAt
        }
      };
    } catch (err) {
      console.error('Create project error:', err);
      return { success: false, msg: 'Failed to create project: ' + err.message };
    }
  }
};

module.exports = codeController;