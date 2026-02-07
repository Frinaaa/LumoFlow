import { useCallback } from 'react';
import { useGitStore } from '../stores/gitStore';
import { useFileStore } from '../stores/fileStore';
import { useUserStore } from '../../stores/userStore';

export const useGitOperations = () => {
    const gitStore = useGitStore();
    const fileStore = useFileStore();
    const userStore = useUserStore();

    // Helper to get authenticated URL
    const getAuthUrl = (url: string) => {
        const token = localStorage.getItem('github_token');
        if (!token || !url.startsWith('https://github.com')) return url;
        return url.replace('https://github.com', `https://${token}@github.com`);
    };

    const checkStatus = useCallback(async () => {
        if (!fileStore.workspacePath) return;

        // @ts-ignore
        if (!window.api?.gitStatus) return;

        gitStore.setLoading(true);
        try {
            // @ts-ignore
            const statusRes = await window.api.gitStatus(fileStore.workspacePath);
            // @ts-ignore
            const branchRes = await window.api.gitBranch(fileStore.workspacePath);

            if (statusRes.success) {
                gitStore.setGitStatus({
                    isRepo: true,
                    changes: statusRes.changes || [],
                    branch: branchRes.branch || 'main'
                });
            } else {
                gitStore.setGitStatus({
                    isRepo: false,
                    changes: [],
                    branch: ''
                });
            }
        } catch (error) {
            console.error('Git status check failed:', error);
            gitStore.setGitStatus({ isRepo: false, changes: [], branch: '' });
        } finally {
            gitStore.setLoading(false);
        }
    }, [fileStore.workspacePath]);

    const cloneRepository = async (repoUrl: string) => {
        gitStore.setLoading(true);
        try {
            // @ts-ignore
            const result = await window.api.openFolderDialog();
            if (result.canceled || !result.folderPath) {
                gitStore.setLoading(false);
                return { success: false, message: 'No folder selected' };
            }

            const authUrl = getAuthUrl(repoUrl);

            // @ts-ignore
            const cloneRes = await window.api.gitClone({
                url: authUrl,
                targetPath: result.folderPath
            });

            if (cloneRes.success) {
                // Determine the actual path (usually folderPath + repoName)
                const repoName = repoUrl.split('/').pop()?.replace('.git', '');
                const finalPath = `${result.folderPath}\\${repoName}`;

                // Open the workspace
                const workspaceName = repoName || 'Project';
                fileStore.setWorkspace(finalPath, workspaceName);

                // Save to localStorage for persistence (like VS Code)
                localStorage.setItem('lumoflow_workspace', JSON.stringify({
                    path: finalPath,
                    name: workspaceName
                }));
                console.log('💾 Workspace saved to localStorage:', finalPath);


                // Trigger file refresh - wait a bit for workspace to be set
                await new Promise(resolve => setTimeout(resolve, 100));

                try {
                    // @ts-ignore
                    const files = await window.api.readProjectFiles(finalPath);
                    if (files && files.length > 0) {
                        // @ts-ignore - File format mismatch between API and store
                        fileStore.setFiles(files);
                        console.log('✅ Files loaded after clone:', files.length);
                    }
                } catch (e) {
                    console.error('Error loading files after clone:', e);
                }

                // Also check Git status
                await checkStatus();

                return { success: true, path: finalPath };
            }
            return cloneRes;
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            gitStore.setLoading(false);
        }
    };

    const commitChanges = async (message: string) => {
        if (!fileStore.workspacePath) return { success: false, message: 'No workspace open' };

        gitStore.setLoading(true);
        try {
            // Stage all changes (simplification for now)
            // @ts-ignore
            await window.api.gitAdd({ files: ['.'], repoPath: fileStore.workspacePath });

            // @ts-ignore
            let res = await window.api.gitCommit({
                message,
                repoPath: fileStore.workspacePath
            });

            // Handle "Author identity unknown" error automatically
            if (!res.success && (res.error?.includes('Author identity unknown') || res.error?.includes('Please tell me who you are'))) {
                console.log('🤖 Git identity missing, configuring automatically...');
                const { user } = userStore;

                const name = user?.name || user?.email?.split('@')[0] || 'LumoFlow User';
                const email = user?.email || 'user@lumoflow.app';

                // @ts-ignore
                await window.api.gitConfig({ key: 'user.name', value: name, repoPath: fileStore.workspacePath });
                // @ts-ignore
                await window.api.gitConfig({ key: 'user.email', value: email, repoPath: fileStore.workspacePath });

                // Retry commit
                // @ts-ignore
                res = await window.api.gitCommit({
                    message,
                    repoPath: fileStore.workspacePath
                });
            }

            if (res.success) {
                await checkStatus();
            }
            return res;
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            gitStore.setLoading(false);
        }
    };

    const syncChanges = async () => {
        if (!fileStore.workspacePath) return { success: false, message: 'No workspace open' };

        gitStore.setLoading(true);
        try {
            // @ts-ignore
            const pullRes = await window.api.gitPull({
                repoPath: fileStore.workspacePath
            });

            if (!pullRes.success) throw new Error(pullRes.error);

            // @ts-ignore
            const pushRes = await window.api.gitPush({
                repoPath: fileStore.workspacePath
            });

            await checkStatus();
            return pushRes;
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            gitStore.setLoading(false);
        }
    };

    const getHistory = async () => {
        if (!fileStore.workspacePath) return [];
        // @ts-ignore
        const res = await window.api.gitLog({ limit: 20, repoPath: fileStore.workspacePath });
        return res.success ? res.commits : [];
    };

    return {
        checkStatus,
        cloneRepository,
        commitChanges,
        syncChanges,
        getHistory,
        ...gitStore
    };
};
