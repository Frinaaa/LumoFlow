import { useCallback } from 'react';
import { useGitStore } from '../stores/gitStore';
import { useFileStore } from '../stores/fileStore';
import { useUserStore } from '../../stores/userStore';

export const useGitOperations = () => {
    const gitStore = useGitStore();
    const fileStore = useFileStore();
    const userStore = useUserStore();

    // Helper to get GitHub token
    const getToken = () => localStorage.getItem('github_token') || '';

    // Helper to get authenticated URL (for clone)
    const getAuthUrl = (url: string) => {
        const token = getToken();
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

    const checkAheadBehind = useCallback(async () => {
        if (!fileStore.workspacePath) return;
        // @ts-ignore
        if (!window.api?.gitAheadBehind) return;

        try {
            // @ts-ignore
            const res = await window.api.gitAheadBehind({ repoPath: fileStore.workspacePath });
            if (res.success) {
                gitStore.setAheadBehind(res.ahead || 0, res.behind || 0);
            }
        } catch (error) {
            console.error('Ahead/behind check failed:', error);
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
                const repoName = repoUrl.split('/').pop()?.replace('.git', '');
                const finalPath = `${result.folderPath}\\${repoName}`;

                const workspaceName = repoName || 'Project';
                fileStore.setWorkspace(finalPath, workspaceName);

                localStorage.setItem('lumoflow_workspace', JSON.stringify({
                    path: finalPath,
                    name: workspaceName
                }));
                console.log('💾 Workspace saved to localStorage:', finalPath);

                await new Promise(resolve => setTimeout(resolve, 100));

                try {
                    // @ts-ignore
                    const files = await window.api.readProjectFiles(finalPath);
                    if (files && files.length > 0) {
                        // @ts-ignore
                        fileStore.setFiles(files);
                        console.log('✅ Files loaded after clone:', files.length);
                    }
                } catch (e) {
                    console.error('Error loading files after clone:', e);
                }

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
            // Stage all changes
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
                await checkAheadBehind();
            }
            return res;
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            gitStore.setLoading(false);
        }
    };

    // Check if remote origin exists
    const hasRemoteOrigin = async (): Promise<boolean> => {
        if (!fileStore.workspacePath) return false;
        try {
            // @ts-ignore
            const res = await window.api.gitRemote({ action: 'list', repoPath: fileStore.workspacePath });
            if (res.success && res.remotes) {
                return res.remotes.some((r: any) => r.name === 'origin');
            }
            return false;
        } catch {
            return false;
        }
    };

    // Create a GitHub repo & set it as origin & push
    const publishToGitHub = async (repoName: string, isPrivate: boolean, description?: string) => {
        if (!fileStore.workspacePath) return { success: false, error: 'No workspace open' };

        const token = getToken();
        if (!token) return { success: false, error: 'Not connected to GitHub. Please sign in first.' };

        gitStore.setPushing(true);
        gitStore.setLastSyncMessage('');

        try {
            // 1. Create repo on GitHub via API
            console.log('🔵 Creating GitHub repo:', repoName, isPrivate ? '(private)' : '(public)');
            const createRes = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: repoName,
                    description: description || '',
                    private: isPrivate,
                    auto_init: false
                })
            });

            if (!createRes.ok) {
                const errorData = await createRes.json().catch(() => ({}));
                const errMsg = errorData.message || `HTTP ${createRes.status}`;
                if (errMsg.includes('name already exists')) {
                    gitStore.setLastSyncMessage('❌ Repository name already exists on GitHub');
                    return { success: false, error: 'Repository name already exists on your GitHub account. Choose a different name.' };
                }
                gitStore.setLastSyncMessage('❌ Failed to create repo: ' + errMsg);
                return { success: false, error: errMsg };
            }

            const repoData = await createRes.json();
            const remoteUrl = repoData.clone_url; // https://github.com/user/repo.git
            console.log('✅ GitHub repo created:', remoteUrl);

            // 2. Remove existing origin if any, then add new one
            // @ts-ignore
            await window.api.gitRemote({ action: 'remove', name: 'origin', repoPath: fileStore.workspacePath }).catch(() => { });
            // @ts-ignore
            const addRes = await window.api.gitRemote({ action: 'add', name: 'origin', url: remoteUrl, repoPath: fileStore.workspacePath });
            if (!addRes.success) {
                gitStore.setLastSyncMessage('❌ Failed to set remote: ' + (addRes.error || ''));
                return { success: false, error: 'Failed to add remote origin: ' + (addRes.error || '') };
            }
            console.log('✅ Remote origin set to:', remoteUrl);

            // 3. Push to origin with token auth
            // @ts-ignore
            const pushRes = await window.api.gitPush({
                repoPath: fileStore.workspacePath,
                token: token
            });

            if (pushRes.success) {
                gitStore.setLastSyncMessage('✅ Published to GitHub!');
                await checkAheadBehind();
                return { success: true, repoUrl: repoData.html_url };
            } else {
                gitStore.setLastSyncMessage('❌ Push failed after creating repo: ' + (pushRes.error || ''));
                return { success: false, error: pushRes.error };
            }
        } catch (error: any) {
            gitStore.setLastSyncMessage('❌ Publish failed: ' + error.message);
            return { success: false, error: error.message };
        } finally {
            gitStore.setPushing(false);
        }
    };

    const pushChanges = async () => {
        if (!fileStore.workspacePath) return { success: false, message: 'No workspace open' };

        // Check if remote origin exists first
        const hasOrigin = await hasRemoteOrigin();
        if (!hasOrigin) {
            return { success: false, error: 'No remote origin configured', no_remote: true };
        }

        gitStore.setPushing(true);
        gitStore.setLastSyncMessage('');
        try {
            const token = getToken();
            // @ts-ignore
            const pushRes = await window.api.gitPush({
                repoPath: fileStore.workspacePath,
                token: token || undefined
            });

            if (pushRes.success) {
                gitStore.setLastSyncMessage('✅ Pushed successfully');
                await checkAheadBehind();
            } else {
                // Detect permission / no-remote errors
                const err = pushRes.error || '';
                if (err.includes('permission') || err.includes('denied') ||
                    err.includes('could not read') || err.includes('does not appear to be a git repository') ||
                    err.includes('No configured push destination') || err.includes('remote origin')) {
                    return { success: false, error: err, no_remote: true };
                }
                gitStore.setLastSyncMessage('❌ Push failed: ' + err);
            }

            return pushRes;
        } catch (error: any) {
            const msg = '❌ Push failed: ' + error.message;
            gitStore.setLastSyncMessage(msg);
            return { success: false, error: error.message };
        } finally {
            gitStore.setPushing(false);
        }
    };

    const pullChanges = async () => {
        if (!fileStore.workspacePath) return { success: false, message: 'No workspace open' };

        gitStore.setPulling(true);
        gitStore.setLastSyncMessage('');
        try {
            const token = getToken();
            // @ts-ignore
            const pullRes = await window.api.gitPull({
                repoPath: fileStore.workspacePath,
                token: token || undefined
            });

            if (pullRes.success) {
                gitStore.setLastSyncMessage('✅ Pulled successfully');
                await checkStatus();
                await checkAheadBehind();
            } else {
                gitStore.setLastSyncMessage('❌ Pull failed: ' + (pullRes.error || ''));
            }

            return pullRes;
        } catch (error: any) {
            const msg = '❌ Pull failed: ' + error.message;
            gitStore.setLastSyncMessage(msg);
            return { success: false, error: error.message };
        } finally {
            gitStore.setPulling(false);
        }
    };

    const syncChanges = async () => {
        if (!fileStore.workspacePath) return { success: false, message: 'No workspace open' };

        gitStore.setLoading(true);
        gitStore.setLastSyncMessage('');
        try {
            const token = getToken();

            // Pull first
            // @ts-ignore
            const pullRes = await window.api.gitPull({
                repoPath: fileStore.workspacePath,
                token: token || undefined
            });

            if (!pullRes.success) {
                gitStore.setLastSyncMessage('❌ Pull failed: ' + (pullRes.error || ''));
                return pullRes;
            }

            // Then push
            // @ts-ignore
            const pushRes = await window.api.gitPush({
                repoPath: fileStore.workspacePath,
                token: token || undefined
            });

            if (pushRes.success) {
                gitStore.setLastSyncMessage('✅ Synced successfully');
            } else {
                gitStore.setLastSyncMessage('❌ Push failed: ' + (pushRes.error || ''));
            }

            await checkStatus();
            await checkAheadBehind();
            return pushRes;
        } catch (error: any) {
            gitStore.setLastSyncMessage('❌ Sync failed: ' + error.message);
            return { success: false, error: error.message };
        } finally {
            gitStore.setLoading(false);
        }
    };

    const initRepo = async () => {
        if (!fileStore.workspacePath) return { success: false, message: 'No workspace open' };

        gitStore.setLoading(true);
        try {
            // @ts-ignore
            const res = await window.api.gitInit(fileStore.workspacePath);
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

    const stageFile = async (file: string) => {
        if (!fileStore.workspacePath) return;
        // @ts-ignore
        await window.api.gitStageFile({ file, repoPath: fileStore.workspacePath });
        await checkStatus();
    };

    const unstageFile = async (file: string) => {
        if (!fileStore.workspacePath) return;
        // @ts-ignore
        await window.api.gitUnstageFile({ file, repoPath: fileStore.workspacePath });
        await checkStatus();
    };

    const discardFile = async (file: string) => {
        if (!fileStore.workspacePath) return;
        // @ts-ignore
        await window.api.gitDiscardFile({ file, repoPath: fileStore.workspacePath });
        await checkStatus();
    };

    const getHistory = async () => {
        if (!fileStore.workspacePath) return [];
        // @ts-ignore
        const res = await window.api.gitLog({ limit: 20, repoPath: fileStore.workspacePath });
        return res.success ? res.commits : [];
    };

    return {
        checkStatus,
        checkAheadBehind,
        cloneRepository,
        commitChanges,
        pushChanges,
        pullChanges,
        syncChanges,
        initRepo,
        publishToGitHub,
        hasRemoteOrigin,
        stageFile,
        unstageFile,
        discardFile,
        getHistory,
        ...gitStore
    };
};
